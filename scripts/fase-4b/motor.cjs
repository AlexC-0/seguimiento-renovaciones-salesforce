'use strict';
const h=require('./comun.cjs'),{decision}=require('./observador.cjs');
const counterNames=['Evaluados','Creados','YaExistentes','Omitidos','Fallidos','LotesFallidos'];
const clean=x=>Object.fromEntries(Object.entries(x).filter(([key])=>!['attributes','OwnerId','CreatedById','LastModifiedById','Solicitante__c'].includes(key)));
async function apex(name,source){
 await h.connect('p06-renovaciones-dev');
 if(h.fs.existsSync(h.path.join(h.dir,name+'.apex')))throw Error('Fuente ya registrada; inspeccionar sin repetir.');
 h.fs.writeFileSync(h.path.join(h.dir,name+'.apex'),source);
 const raw=await h.cli(['apex','run','--target-org','p06-renovaciones-dev','--api-version','65.0','--file',h.path.join(h.dir,name+'.apex'),'--debug-level','DEBUGONLY','--json'],name);
 const r=raw.result||raw.data;if(!r?.compiled||!r.success)throw Error('Apex no confirmado; conservar '+name);
 const matches=[...String(r.logs).matchAll(/P06_4B=(\{[^\r\n]+\})/g)];if(matches.length!==1)throw Error('Recibo ausente o ambiguo.');return JSON.parse(matches[0][1]);
}
async function snapshot(c,label,run){
 const group=h.read('estado.json').groups[label],receipt=group.runs[run].receipt;
 const jobs=(await h.queryAll(c,'SELECT Id,Status,NumberOfErrors,JobItemsProcessed,TotalJobItems,CreatedDate,CompletedDate,ExtendedStatus FROM AsyncApexJob WHERE Id IN '+h.ids([receipt.job]))).rows;
 if(jobs.length!==1)throw Error('Job no identificado.');
 const executions=(await h.records(c,'EjecucionRenovacion__c',[receipt.execution])).rows;
 const follows=await h.bounded(c,'SeguimientoRenovacion__c','Contrato__c IN '+h.ids(group.contracts.map(x=>x.id)));
 const incidents=await h.bounded(c,'IncidenciaRenovacion__c','Ejecucion__c IN '+h.ids([receipt.execution]));
 return {timestamp:new Date().toISOString(),job:clean(jobs[0]),execution:executions[0],follows,incidents};
}
function publishSnapshot(name,s){
 const b=h.read('antes.json');h.save(name,s);
 h.publish(name,{timestamp:s.timestamp,job:s.job,execution:clean(s.execution),follows:s.follows.map(x=>({...clean(x),ownerMatchesFixture:x.OwnerId===b.commercial})),incidents:s.incidents.map(clean)});
}
function inventory(label,s){const state=h.read('estado.json'),group=state.groups[label];for(const [object,rows] of [['EjecucionRenovacion__c',[s.execution]],['SeguimientoRenovacion__c',s.follows],['IncidenciaRenovacion__c',s.incidents]])for(const row of rows)if(!group.records.some(x=>x.id===row.Id))group.records.push({objeto:object,id:row.Id});h.save('estado.json',state);h.inventory(state);}
async function observe(c,label,run){
 const receipt=h.read('estado.json').groups[label].runs[run].receipt;const samples=[];const start=Date.now();let verdict,last='';
 do{
 const requestedAt=new Date().toISOString();
 const jobs=(await h.queryAll(c,'SELECT Id,Status,NumberOfErrors,JobItemsProcessed,TotalJobItems,CompletedDate FROM AsyncApexJob WHERE Id IN '+h.ids([receipt.job]))).rows;
 const executions=(await h.queryAll(c,'SELECT Id,Estado__c,Finalizacion__c,RequiereReconciliacion__c,Evaluados__c,Creados__c,YaExistentes__c,Omitidos__c,Fallidos__c,LotesFallidos__c FROM EjecucionRenovacion__c WHERE Id IN '+h.ids([receipt.execution]))).rows;
 if(jobs.length!==1||executions.length!==1)throw Error('Observación incompleta.');
 samples.push({requestedAt,receivedAt:new Date().toISOString(),elapsed:Date.now()-start,job:clean(jobs[0]),execution:clean(executions[0])});
 verdict=decision(samples,Date.now()-start);h.save(label+'-'+run+'-observaciones.json',{maximumMs:120000,samples,verdict});
 const sig=JSON.stringify([jobs[0].Status,executions[0].Estado__c,jobs[0].JobItemsProcessed]);if(sig!==last){last=sig;console.log(JSON.stringify({label,run,job:jobs[0].Status,execution:executions[0].Estado__c,scopes:jobs[0].JobItemsProcessed,total:jobs[0].TotalJobItems,errors:jobs[0].NumberOfErrors}));}
 if(!verdict.stop)await new Promise(r=>setTimeout(r,1000));
 }while(!verdict.stop);
 h.publish(label+'-'+run+'-observaciones.json',{maximumMs:120000,samples,verdict});
 if(!['Completed','Failed','Aborted'].includes(samples.at(-1).job.Status))throw Error('Job no terminal; inspeccionar sin relanzar.');
 const s=await snapshot(c,label,run);publishSnapshot(label+'-'+run+'-resultado.json',s);inventory(label,s);return s;
}
async function launch(c,label,run,abort=false){
 let state=h.read('estado.json');const group=state.groups[label];if(!group||group.runs[run])throw Error('Conjunto ausente o lanzamiento ya iniciado.');
 const values=group.contracts.map(x=>x.id);const rows=(await h.records(c,'ContratoComercial__c',values)).rows;
 const cut=new Intl.DateTimeFormat('en-CA',{timeZone:group.timezone}).format(new Date());
 if(cut!==group.cut||rows.some(x=>x.Cuenta__c!==group.account||x.Estado__c!=='Activo'||x.FechaVencimiento__c<group.cut||x.FechaVencimiento__c>group.end))throw Error('Conjunto o corte no conforme.');
 const prior=await h.bounded(c,'SeguimientoRenovacion__c','Contrato__c IN '+h.ids(values));h.save(label+'-'+run+'-previos.json',prior);
 group.runs[run]={started:new Date().toISOString(),scope:values,batchSize:5,abort,priorFollows:prior.length};h.save('estado.json',state);
 const source="Set<Id> alcance=new Set<Id>{"+values.map(x=>"'"+x+"'").join(',')+"};\n"+`
Id idEjecucion=ServicioRenovaciones.lanzar(5,alcance);
EjecucionRenovacion__c e=ServicioRenovaciones.leerEjecucion(idEjecucion);
AsyncApexJob j=ServicioRenovaciones.leerTrabajo(e);
Map<String,Object> recibo=new Map<String,Object>{'execution'=>e.Id,'job'=>j.Id,'cut'=>e.FechaCorte__c,'end'=>e.FinVentana__c,'timezone'=>e.ZonaHoraria__c,'scope'=>alcance.size(),'batchSize'=>5,'beforeAbort'=>j.Status,'jobClass'=>j.ApexClass.Name,'requesterVerified'=>j.CreatedById==UserInfo.getUserId(),'linked'=>e.AsyncApexJobId__c==String.valueOf(j.Id),'observedAt'=>System.now()};
`+(abort?`
if(j.ApexClass.Name!='LoteRenovaciones'||j.JobType!='BatchApex'||j.CreatedById!=UserInfo.getUserId()||e.AsyncApexJobId__c!=String.valueOf(j.Id))throw new IllegalArgumentException('Job ajeno al ensayo.');
Boolean terminal=new Set<String>{'Completed','Failed','Aborted'}.contains(j.Status);
if(!terminal){
 try {System.abortJob(j.Id);recibo.put('abortRequested',true);}
 catch(Exception error){recibo.put('abortRequested',false);recibo.put('abortError',LoteRenovaciones.sanear(error.getMessage(),1000));}
}else{recibo.put('abortRequested',false);recibo.put('alreadyTerminal',true);}
recibo.put('afterAbort',ServicioRenovaciones.leerTrabajo(e).Status);
`:'')+"System.debug(LoggingLevel.ERROR,'P06_4B='+JSON.serialize(recibo));\n";
 const receipt=await apex(label+'-'+run+'-apex',source);
 if(receipt.scope!==values.length||receipt.batchSize!==5||receipt.cut!==group.cut||receipt.end!==group.end||receipt.timezone!==group.timezone||!receipt.linked||!receipt.requesterVerified)throw Error('Recibo de lanzamiento no conforme.');
 state=h.read('estado.json');state.groups[label].runs[run].receipt=receipt;state.groups[label].records.push({objeto:'EjecucionRenovacion__c',id:receipt.execution});h.save('estado.json',state);h.inventory(state);
 h.publish(label+'-'+run+'-lanzamiento.json',{...receipt,scopeIds:values,context:abort?'Aborto solicitado dentro de la transacción de lanzamiento; confirmar estado persistido después del commit.':'Lanzamiento manual sobre IDs explícitos.'});
 return observe(c,label,run);
}
async function contrast(c,label,run){
 const before=await snapshot(c,label,run);publishSnapshot(label+'-'+run+'-antes-contraste.json',before);
 const receipt=h.read('estado.json').groups[label].runs[run].receipt;const observations=[];let previous;
 for(let pass=1;pass<=2;pass++){
 await apex(label+'-'+run+'-contraste-'+pass,"AsyncApexJob j=ServicioRenovaciones.contrastar('"+receipt.execution+"');System.debug(LoggingLevel.ERROR,'P06_4B='+JSON.serialize(new Map<String,Object>{'job'=>j.Id,'status'=>j.Status}));");
 const after=await snapshot(c,label,run);publishSnapshot(label+'-'+run+'-contraste-'+pass+'.json',after);inventory(label,after);
 if(counterNames.slice(0,5).some(k=>after.execution[k+'__c']!==before.execution[k+'__c'])||h.changed(before.follows,after.follows).length||h.changed(before.incidents,after.incidents).length)throw Error('Contraste alteró resultados confirmados.');
 if(previous&&(h.changed([previous.execution],[after.execution]).length||h.changed(previous.incidents,after.incidents).length||previous.incidents.length!==after.incidents.length))throw Error('Contraste repetido no estable.');
 observations.push({pass,job:after.job,execution:clean(after.execution),incidents:after.incidents.map(clean)});previous=after;
 }
 h.publish(label+'-'+run+'-contraste.json',{observations,individualCountersPreserved:true,previousFollowsAndIncidentsPreserved:true,secondPassUnchanged:true,pass:true});return previous;
}
module.exports={apex,snapshot,publishSnapshot,inventory,observe,launch,contrast,clean,counterNames};
'use strict';
const h=require('./comun.cjs'),m=require('./motor.cjs'),p=require('./preparar.cjs'),permission=require('./permiso.cjs');
const label='vencimientos';
const ensure=(v,message)=>{if(!v)throw Error(message);};
const persisted=(before,after)=>h.changed(before.map(({Aplicable__c,...x})=>x),after.map(({Aplicable__c,...x})=>x));
async function patch(c,name,object,rows){
 const group=h.read('estado.json').groups[label];const allowed=new Set(group.records.filter(x=>x.objeto===object).map(x=>x.id));ensure(rows.every(x=>allowed.has(x.Id)),'Escritura fuera del conjunto nuevo.');
 await h.connect('p06-renovaciones-dev');h.save(name+'-previsto.json',rows);
 const result=await c.request({method:'PATCH',url:'/services/data/v65.0/composite/sobjects',headers:{'Content-Type':'application/json','Sforce-Email':'triggerUserEmail=false, triggerOtherEmail=false, triggerAutoResponseEmail=false'},body:JSON.stringify({allOrNone:true,records:rows.map(x=>({attributes:{type:object},...x}))})});h.save(name+'-recibo.json',result);ensure(result.length===rows.length&&result.every(x=>x.success),'Escritura no confirmada; no repetir sin inspección.');
}
async function follows(c){const g=h.read('estado.json').groups[label];return h.bounded(c,'SeguimientoRenovacion__c','Contrato__c IN '+h.ids(g.contracts.map(x=>x.id)));}
async function report(c,step,expectedIds){
 const current=await follows(c),reportId=(await h.queryAll(c,"SELECT Id FROM Report WHERE DeveloperName='PendientesRenovaciones'")).rows;ensure(reportId.length===1,'Informe ambiguo.');
 const data=await c.request('/services/data/v65.0/analytics/reports/'+reportId[0].Id+'?includeDetails=true');
 const query=await h.queryAll(c,"SELECT Id FROM SeguimientoRenovacion__c WHERE Estado__c IN ('Pendiente','En curso') AND Aplicable__c=true ORDER BY Id");
 const found=Object.entries(data.factMap).filter(([k,v])=>k!=='T!T'&&v.rows).flatMap(([,v])=>v.rows.map(x=>x.dataCells[0].value)).sort();const expected=query.rows.map(x=>x.Id).sort();const newIds=found.filter(id=>current.some(x=>x.Id===id));
 const pass=data.allData===true&&JSON.stringify(found)===JSON.stringify(expected)&&data.factMap['T!T'].aggregates[0].value===query.total&&JSON.stringify(newIds)===JSON.stringify([...expectedIds].sort());
 h.save(step+'-informe-completo.json',{data,query});h.publish(step+'-informe.json',{timestamp:new Date().toISOString(),context:'Misma identidad técnica para Analytics y SOQL; no es sesión comercial.',reportTotal:data.factMap['T!T'].aggregates[0].value,queryTotal:query.total,queryComplete:query.done,queryPages:query.pages,reportComplete:data.allData,sameIds:JSON.stringify(found)===JSON.stringify(expected),expectedNewIds:expectedIds,newIncludedIds:newIds,newExcluded:current.filter(x=>!expectedIds.includes(x.Id)).map(x=>({id:x.Id,state:x.Estado__c,applicable:x.Aplicable__c})),pass});ensure(pass,'Informe distinto de SOQL o inclusión esperada: '+step);
}
async function access(c,step){
 const b=h.read('antes.json'),g=h.read('estado.json').groups[label],f=await follows(c),values=[...g.contracts.map(x=>x.id),...f.map(x=>x.Id)];const observations=[];
 for(const [actor,user] of [['A',b.coordinator],['B',b.commercial]]){const r=await h.queryAll(c,"SELECT RecordId,HasReadAccess,HasEditAccess,HasDeleteAccess FROM UserRecordAccess WHERE UserId='"+user+"' AND RecordId IN "+h.ids(values));ensure(r.rows.length===values.length,'Acceso incompleto.');observations.push({actor,records:r.rows.map(({attributes,...x})=>x)});}
 h.publish(step+'-acceso.json',{timestamp:new Date().toISOString(),context:'UserRecordAccess consultado por cuenta técnica; no prueba acciones ni FLS desde una sesión comercial.',observations});return observations;
}
function checkRun(result,created,existing){const x=result.execution;ensure(result.job.Status==='Completed'&&result.job.NumberOfErrors===0&&result.job.JobItemsProcessed===1&&result.job.TotalJobItems===1&&x.Estado__c==='Completada'&&!x.RequiereReconciliacion__c&&x.Evaluados__c===2&&x.Creados__c===created&&x.YaExistentes__c===existing&&x.Omitidos__c===0&&x.Fallidos__c===0&&x.LotesFallidos__c===0&&result.incidents.length===0,'Resultado Batch no conforme.');}
async function capture(c,step,expected,baseline=[]){
 const g=h.read('estado.json').groups[label],b=h.read('antes.json');const contracts=(await h.records(c,'ContratoComercial__c',g.contracts.map(x=>x.id))).rows;const rows=await follows(c);const differences=persisted(baseline,rows);
 const pass=expected.every(e=>{const f=rows.find(x=>x.Id===e.id);return f&&f.Aplicable__c===e.applicable&&f.Estado__c===e.state&&f.OwnerId===(e.owner==='A'?b.coordinator:b.commercial);})&&differences.length===0&&rows.every(f=>f.ClaveIdentidad__c===f.Contrato__c+'|'+f.FechaVencimientoCapturada__c)&&new Set(rows.map(f=>f.ClaveIdentidad__c)).size===rows.length;
 h.save(step+'-completo.json',{contracts,follows:rows});h.publish(step+'-comprobacion.json',{timestamp:new Date().toISOString(),expected,contracts:contracts.map(x=>({...m.clean(x),ownerActor:x.OwnerId===b.coordinator?'A':'B'})),follows:rows.map(x=>({...m.clean(x),ownerActor:x.OwnerId===b.coordinator?'A':'B'})),persistentChanges:differences,formulaFieldsComparedSeparately:['Aplicable__c','DiasRestantes__c'],canonicalUnique:true,pass});ensure(pass,'Historia o aplicabilidad incorrecta: '+step);return rows;
}
(async()=>{
 const c=await h.connect(process.argv[2]),b=h.read('antes.json');const group=await p.prepare(c,label,2);
 const initial=await m.launch(c,label,'original');checkRun(initial,2,0);
 const originals=group.contracts.map(t=>initial.follows.find(x=>x.Contrato__c===t.id));ensure(originals.every(x=>x&&x.OwnerId===b.commercial),'Propietario inicial distinto.');
 await report(c,'01-original',originals.map(x=>x.Id));await access(c,'01-original');
 await patch(c,'02-estados','SeguimientoRenovacion__c',originals.map((x,i)=>({Id:x.Id,Estado__c:i===0?'Cerrado':'En curso',Notas__c:i===0?'P06 F5: cierre ficticio que no debe reabrirse.':'P06 F5: nota conservada al restaurar el vencimiento.'})));
 const oldExpected=originals.map((x,i)=>({id:x.Id,state:i===0?'Cerrado':'En curso',owner:'B',applicable:true}));const edited=await capture(c,'02-estados',oldExpected);await report(c,'02-estados',[originals[1].Id]);
 const parent=group.contracts[0].id;const sharesBefore=await h.queryAll(c,'SELECT Id,ParentId,UserOrGroupId,AccessLevel,RowCause FROM ContratoComercial__Share WHERE ParentId IN '+h.ids([parent]));h.save('03-comparticion-antes.json',sharesBefore.rows);
 try{
  await permission.grant();await patch(c,'03-transferencia','ContratoComercial__c',[{Id:parent,OwnerId:b.coordinator}]);
 }finally{await permission.revoke();}
 const afterTransfer=await access(c,'03-transferencia-sin-concesion');
 const shares=await h.queryAll(c,'SELECT Id,ParentId,UserOrGroupId,AccessLevel,RowCause FROM ContratoComercial__Share WHERE ParentId IN '+h.ids([parent]));ensure(!shares.rows.some(x=>x.UserOrGroupId===b.commercial&&x.RowCause==='Manual'),'Concesión manual inesperada.');
 await h.connect('p06-renovaciones-dev');const share=await c.sobject('ContratoComercial__Share').create({ParentId:parent,UserOrGroupId:b.commercial,AccessLevel:'Read',RowCause:'Manual'});ensure(share.success,'Compartición no confirmada.');
 const state=h.read('estado.json');state.groups[label].share={id:share.id,parent,actor:'B',access:'Read'};h.save('estado.json',state);
 h.publish('03-comparticion.json',{timestamp:new Date().toISOString(),id:share.id,parent,actor:'B',access:'Read',rowCause:'Manual',reason:'B conserva el seguimiento original del contrato ahora propiedad de A',context:'Alta REST técnica; no se cambian grupos ni permisos comerciales'});
 const dates=group.contracts.map((x,i)=>({Id:x.id,FechaVencimiento__c:new Date(new Date(group.cut+'T12:00:00Z').getTime()+(20+i)*86400000).toISOString().slice(0,10)}));
 await patch(c,'04-fechas-alternativas','ContratoComercial__c',dates);await capture(c,'04-fechas-alternativas',oldExpected.map(x=>({...x,applicable:false})),edited);await report(c,'04-fechas-alternativas',[]);
 const alternate=await m.launch(c,label,'alternativa');checkRun(alternate,2,0);const fresh=dates.map(d=>alternate.follows.find(f=>f.Contrato__c===d.Id&&f.FechaVencimientoCapturada__c===d.FechaVencimiento__c));ensure(fresh.every(Boolean),'Faltan identidades alternativas.');
 const altExpected=fresh.map((x,i)=>({id:x.Id,state:'Pendiente',owner:i===0?'A':'B',applicable:true}));const allAlternate=await capture(c,'05-alternativa',[...oldExpected.map(x=>({...x,applicable:false})),...altExpected],edited);await report(c,'05-alternativa',fresh.map(x=>x.Id));
 const rights=await access(c,'05-alternativa');const B=rights.find(x=>x.actor==='B').records,A=rights.find(x=>x.actor==='A').records;
 ensure(B.find(x=>x.RecordId===parent).HasReadAccess&&!B.find(x=>x.RecordId===parent).HasEditAccess&&B.find(x=>x.RecordId===originals[0].Id).HasEditAccess&&!B.find(x=>x.RecordId===fresh[0].Id).HasReadAccess&&A.find(x=>x.RecordId===parent).HasEditAccess&&A.find(x=>x.RecordId===fresh[0].Id).HasEditAccess,'Acceso esperado tras transferencia no confirmado.');
 await patch(c,'06-restauracion-fechas','ContratoComercial__c',group.contracts.map(x=>({Id:x.id,FechaVencimiento__c:x.expiry})));
 const finalExpected=[...oldExpected,...altExpected.map(x=>({...x,applicable:false}))];await capture(c,'06-restauracion-fechas',finalExpected,allAlternate);await report(c,'06-restauracion-fechas',[originals[1].Id]);
 const repeated=await m.launch(c,label,'restaurada');checkRun(repeated,0,2);await capture(c,'07-repeticion',finalExpected,allAlternate);await report(c,'07-repeticion',[originals[1].Id]);await access(c,'07-repeticion');
 ensure(repeated.follows.length===4&&persisted(allAlternate,repeated.follows).length===0,'La repetición alteró historia o creó duplicados.');
 const history=[initial.execution,alternate.execution];const reread=(await h.records(c,'EjecucionRenovacion__c',history.map(x=>x.Id))).rows;ensure(h.changed(history,reread).length===0,'Ejecuciones anteriores modificadas.');
 const done=h.read('estado.json');done.groups[label].verified=true;done.groups[label].expectedFinal=finalExpected;h.save('estado.json',done);
 h.publish('recorrido-final.json',{timestamp:new Date().toISOString(),pass:true,contracts:group.contracts.map((x,i)=>({id:x.id,original:x.expiry,alternative:dates[i].FechaVencimiento__c,final:x.expiry,finalOwner:i===0?'A':'B'})),jobs:[initial,alternate,repeated].map(x=>({job:x.job.Id,execution:x.execution.Id,created:x.execution.Creados__c,existing:x.execution.YaExistentes__c,state:x.execution.Estado__c})),originalFollowIds:originals.map(x=>x.Id),alternativeFollowIds:fresh.map(x=>x.Id),closedNotReopened:true,originalOpenApplicable:true,alternativeFollowsApplicable:false,historyPersistedUnchanged:true,previousExecutionsUnchanged:true,transferVerified:true,accessVerifiedBy:'UserRecordAccess desde identidad técnica',newCommercialSession:false});
 console.log(JSON.stringify({functionalJourney:true,created:[2,2,0],existing:[0,0,2],follows:4,transferVerified:true}));
})().catch(h.reportError);
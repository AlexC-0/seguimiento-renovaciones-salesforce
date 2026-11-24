'use strict';
const h=require('./comun.cjs'),e=require('./ensayos.cjs'),rule=require('./regla.cjs');
(async()=>{
 const c=await h.connect(process.argv[2]);let state=h.read('estado.json');const group=state.groups.parcial;
 if(!group?.partialVerified||group.runs.recuperacion||group.samplesPrepared)throw Error('Recuperación no preparada o ya iniciada.');
 const settings=h.read('regla.json');const actual=(await rule.object(c)).validationRules.find(x=>x.fullName===rule.ruleName);
 if(settings.restoreRequired||actual.active!==false||actual.errorConditionFormula!==settings.formula)throw Error('La causa del rechazo sigue activa o cambió.');
 const original=h.read('parcial-rechazo-resultado.json');
 const checkedJobs=(await h.queryAll(c,'SELECT Id, Status, NumberOfErrors, JobItemsProcessed, TotalJobItems FROM AsyncApexJob WHERE Id IN '+h.ids(original.jobs.map(x=>x.Id)))).rows;
 const checkedExecutions=(await h.records(c,'EjecucionRenovacion__c',original.executions.map(x=>x.Id))).rows;
 const checkedIncidents=await h.bounded(c,'IncidenciaRenovacion__c','Ejecucion__c IN '+h.ids(original.executions.map(x=>x.Id)));
 const checkedFollows=await h.bounded(c,'SeguimientoRenovacion__c','Contrato__c IN '+h.ids(group.contracts.map(x=>x.id)));
 if(!h.completed(checkedJobs,checkedExecutions,1)||checkedFollows.length!==4||checkedIncidents.length!==1||h.changed(original.executions,checkedExecutions).length||h.changed(original.incidents,checkedIncidents).length)throw Error('Estado previo distinto del resultado original.');
 h.save('recuperacion-previo.json',{timestamp:new Date().toISOString(),jobs:checkedJobs,executions:checkedExecutions,incidents:checkedIncidents,follows:checkedFollows});
 const samples=[...checkedFollows].sort((a,b)=>a.Id.localeCompare(b.Id)).slice(0,2);
 const edits=samples.map((x,i)=>({attributes:{type:'SeguimientoRenovacion__c'},Id:x.Id,Estado__c:i===0?'Cerrado':'En curso',Notas__c:i===0?'P06 F4A: cierre ficticio previo a recuperación.':'P06 F4A: nota que debe conservar la recuperación.'}));
 h.save('recuperacion-ediciones-previstas.json',edits);
 const response=await c.request({method:'PATCH',url:'/services/data/v65.0/composite/sobjects',headers:{'Content-Type':'application/json','Sforce-Email':'triggerUserEmail=false, triggerOtherEmail=false, triggerAutoResponseEmail=false'},body:JSON.stringify({allOrNone:true,records:edits})});
 if(response.length!==2||response.some(x=>!x.success))throw Error('Muestras no confirmadas; revisar sin repetir.');
 group.samplesPrepared=edits.map(({Id,Estado__c,Notas__c})=>({id:Id,state:Estado__c,notes:Notas__c}));h.save('estado.json',state);
 h.publish('recuperacion-preparacion.json',{timestamp:new Date().toISOString(),originalJob:checkedJobs[0].Id,originalExecution:checkedExecutions[0].Id,originalState:checkedExecutions[0].Estado__c,priorFollows:4,originalIncidents:1,temporaryRuleActive:false,samples:group.samplesPrepared,context:'Preparación técnica de dos seguimientos nuevos; no acredita una nueva sesión comercial.'});
 const result=await e.launch(c,'parcial','recuperacion',5,1);const x=result.executions[0];
 const historicalExecutions=(await h.records(c,'EjecucionRenovacion__c',original.executions.map(x=>x.Id))).rows;
 const historicalIncidents=(await h.records(c,'IncidenciaRenovacion__c',original.incidents.map(x=>x.Id))).rows;
 const historyPreserved=h.changed(original.executions,historicalExecutions).length===0&&h.changed(original.incidents,historicalIncidents).length===0;
 const existingUnchanged=h.changed(result.previousFollows,result.follows).length===0;
 const newOnes=result.follows.filter(f=>!result.previousFollows.some(old=>old.Id===f.Id));
 const pass=result.jobs[0].Status==='Completed'&&result.jobs[0].NumberOfErrors===0&&result.jobs[0].JobItemsProcessed===1&&result.jobs[0].TotalJobItems===1&&x.Estado__c==='Completada'&&!x.RequiereReconciliacion__c&&x.Evaluados__c===5&&x.Creados__c===1&&x.YaExistentes__c===4&&x.Omitidos__c===0&&x.Fallidos__c===0&&x.LotesFallidos__c===0&&result.incidents.length===0&&result.follows.length===5&&newOnes.length===1&&newOnes[0].Contrato__c===settings.target&&newOnes[0].Ejecucion__c===x.Id&&existingUnchanged&&historyPreserved;
 h.publish('recuperacion-comprobacion.json',{timestamp:new Date().toISOString(),pass,job:result.jobs[0].Id,execution:x.Id,state:x.Estado__c,created:x.Creados__c,existing:x.YaExistentes__c,failed:x.Fallidos__c,failedScopes:x.LotesFallidos__c,newFollow:newOnes[0]?.Id,newFollowContract:newOnes[0]?.Contrato__c,existingUnchanged,originalExecutionAndIncidentUnchanged:historyPreserved,originalState:historicalExecutions[0].Estado__c,originalIncidents:historicalIncidents.length,applicationRetry:false});
 if(!pass)throw Error('Recuperación no conforme; conservar ambos resultados.');
 const executionIds=[original.executions[0].Id,x.Id];
 const contrastBefore={executions:(await h.records(c,'EjecucionRenovacion__c',executionIds)).rows,incidents:await h.bounded(c,'IncidenciaRenovacion__c','Ejecucion__c IN '+h.ids(executionIds))};h.save('contraste-antes.json',contrastBefore);
 const source=`List<Id> ejecuciones = new List<Id>{${executionIds.map(x=>"'"+x+"'").join(',')}};
List<Map<String,Object>> resultados = new List<Map<String,Object>>();
for(Integer pasada=0; pasada<2; pasada++) {
  for(Id identificador:ejecuciones) {
    AsyncApexJob job=ServicioRenovaciones.contrastar(identificador);
    EjecucionRenovacion__c e=ServicioRenovaciones.leerEjecucion(identificador);
    resultados.add(new Map<String,Object>{'pass'=>pasada+1,'execution'=>e.Id,'job'=>job.Id,'jobState'=>job.Status,'executionState'=>e.Estado__c,'reconciliation'=>e.RequiereReconciliacion__c});
  }
}
System.debug(LoggingLevel.ERROR,'P06_4A_CONTRASTE='+JSON.serialize(resultados));\n`;
 h.fs.writeFileSync(h.path.join(h.dir,'contraste.apex'),source);
 const raw=await h.cli(['apex','run','--target-org','p06-renovaciones-dev','--api-version','65.0','--file',h.path.join(h.dir,'contraste.apex'),'--debug-level','DEBUGONLY','--json'],'contraste-apex');
 const apex=raw.result||raw.data;if(!apex.compiled||!apex.success)throw Error('Contraste no confirmado.');
 const matches=[...String(apex.logs).matchAll(/P06_4A_CONTRASTE=(\[[^\r\n]+\])/g)];if(matches.length!==1)throw Error('Recibo de contraste ausente.');
 const contrastAfter={executions:(await h.records(c,'EjecucionRenovacion__c',executionIds)).rows,incidents:await h.bounded(c,'IncidenciaRenovacion__c','Ejecucion__c IN '+h.ids(executionIds))};
 const unchanged=h.changed(contrastBefore.executions,contrastAfter.executions).length===0&&h.changed(contrastBefore.incidents,contrastAfter.incidents).length===0&&contrastAfter.incidents.length===1;
 h.save('contraste-despues.json',contrastAfter);h.publish('contraste-repetido.json',{timestamp:new Date().toISOString(),observations:JSON.parse(matches[0][1]),beforeIncidents:contrastBefore.incidents.length,afterIncidents:contrastAfter.incidents.length,historyUnchanged:unchanged,pass:unchanged});
 if(!unchanged)throw Error('El contraste alteró resultados o duplicó incidencias.');
 state=h.read('estado.json');state.groups.parcial.recoveryVerified=true;h.save('estado.json',state);
 console.log(JSON.stringify({recovery:pass,created:1,existing:4,originalAttemptPreserved:historyPreserved,repeatedContrastUnchanged:unchanged}));
})().catch(h.reportError);

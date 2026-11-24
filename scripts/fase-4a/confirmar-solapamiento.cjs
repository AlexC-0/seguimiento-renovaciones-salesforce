'use strict';
const h=require('./comun.cjs');
(async()=>{
 const c=await h.connect(process.argv[2]);const label='solapamiento-'+Number(process.argv[3]);const state=h.read('estado.json');const group=state.groups[label];
 const name=group.runs['doble-corregido']?'doble-corregido':'doble';const old=h.read(label+'-'+name+'-resultado.json');
 const jobs=(await h.queryAll(c,'SELECT Id, Status, JobItemsProcessed, TotalJobItems, NumberOfErrors, CompletedDate FROM AsyncApexJob WHERE Id IN '+h.ids(old.jobs.map(x=>x.Id)))).rows;
 const executions=(await h.records(c,'EjecucionRenovacion__c',old.executions.map(x=>x.Id))).rows;
 const follows=await h.bounded(c,'SeguimientoRenovacion__c','Contrato__c IN '+h.ids(group.contracts.map(x=>x.id)));
 const incidents=await h.bounded(c,'IncidenciaRenovacion__c','Ejecucion__c IN '+h.ids(executions.map(x=>x.Id)));
 const diffs=h.changed(old.follows,follows);
 const pass=h.completed(jobs,executions,2)&&jobs.every(x=>x.Status==='Completed'&&x.NumberOfErrors===0&&x.JobItemsProcessed===6&&x.TotalJobItems===6)&&executions.every(x=>x.Estado__c==='Completada'&&!x.RequiereReconciliacion__c&&x.Evaluados__c===30&&x.Fallidos__c===0&&x.Omitidos__c===0&&x.LotesFallidos__c===0&&x.Evaluados__c===x.Creados__c+x.YaExistentes__c+x.Omitidos__c+x.Fallidos__c&&x.Creados__c===follows.filter(f=>f.Ejecucion__c===x.Id).length)&&follows.length===30&&new Set(follows.map(x=>x.ClaveIdentidad__c)).size===30&&follows.every(x=>x.ClaveIdentidad__c===x.Contrato__c+'|'+x.FechaVencimientoCapturada__c)&&incidents.length===0&&diffs.length===0;
 h.save(label+'-confirmacion-final.json',{timestamp:new Date().toISOString(),jobs,executions,follows,incidents});
 const overlap=old.observations.filter(o=>o.jobs.length===2&&o.jobs.every(x=>x.Status==='Processing'));
 h.publish(label+'-confirmacion-final.json',{timestamp:new Date().toISOString(),pass,overlapObserved:overlap.length>0,jointProcessingObservations:overlap,initialResultPreserved:label+'-'+name+'-resultado.json',initialCheckPreserved:label+'-comprobacion.json',observationFinding:'El primer estado Completed de los jobs precedió al cierre persistido de una ejecución; la lectura posterior confirma ambos cierres. No se relanzó ni corrigió la aplicación.',jobs:jobs.map(({attributes,...x})=>x),executions:executions.map(x=>({id:x.Id,state:x.Estado__c,final:x.Finalizacion__c,created:x.Creados__c,existing:x.YaExistentes__c,evaluated:x.Evaluados__c,failed:x.Fallidos__c,failedScopes:x.LotesFallidos__c,reconciliation:x.RequiereReconciliacion__c})),follows:follows.length,changedFollows:diffs,incidents:incidents.length,collisionDemonstrated:false});
 group.overlapVerified=pass;h.save('estado.json',state);
 console.log(JSON.stringify({label,overlapObserved:overlap.length>0,processingObservations:overlap.length,closedExecutions:executions.map(x=>x.Estado__c),unchangedFollows:diffs.length===0,pass}));if(!pass)throw Error('Cierre final no conforme.');
})().catch(h.reportError);

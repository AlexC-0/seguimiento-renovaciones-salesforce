'use strict';
const h=require('./comun.cjs'),m=require('./motor.cjs'),rules=require('./reglas.cjs');
(async()=>{
 const c=await h.connect(process.argv[2]),label=process.argv[3];let state=h.read('estado.json');const group=state.groups[label];
 if(!group?.adverseVerified||group.runs.recuperacion||group.samplesPrepared)throw Error('Falta revisión o recuperación ya iniciada.');
 await rules.verify(c,false);const original=await m.snapshot(c,label,group.adverseRun);
 if(!original.execution.RequiereReconciliacion__c||!['Fallida','Abortada'].includes(original.execution.Estado__c))throw Error('Intento original sin diagnóstico adverso.');
 const missing=group.contracts.map(x=>x.id).filter(id=>!original.follows.some(f=>f.Contrato__c===id));
 if(!missing.length)throw Error('No hay identidades pendientes para recuperar.');
 const samples=[...original.follows].sort((a,b)=>a.Id.localeCompare(b.Id)).slice(0,2);
 const edits=samples.map((x,i)=>({attributes:{type:'SeguimientoRenovacion__c'},Id:x.Id,Estado__c:i===0?'Cerrado':'En curso',Notas__c:'P06 F4B: muestra ficticia que debe conservar la nueva ejecución.'}));
 h.save(label+'-ediciones-previstas.json',edits);
 if(edits.length){const response=await c.request({method:'PATCH',url:'/services/data/v65.0/composite/sobjects',headers:{'Content-Type':'application/json','Sforce-Email':'triggerUserEmail=false, triggerOtherEmail=false, triggerAutoResponseEmail=false'},body:JSON.stringify({allOrNone:true,records:edits})});if(response.length!==edits.length||response.some(x=>!x.success))throw Error('Ediciones no confirmadas; inspeccionar sin repetir.');}
 group.samplesPrepared=edits.map(({Id,Estado__c,Notas__c})=>({id:Id,state:Estado__c,notes:Notas__c}));h.save('estado.json',state);
 const before=await m.snapshot(c,label,group.adverseRun);m.publishSnapshot(label+'-revision-manual.json',before);
 h.publish(label+'-recuperacion-prevista.json',{timestamp:new Date().toISOString(),originalJob:before.job.Id,originalExecution:before.execution.Id,originalState:before.execution.Estado__c,originalReconciliation:before.execution.RequiereReconciliacion__c,missingContractIds:missing,expectedCreated:missing.length,expectedExisting:before.follows.length,samples:group.samplesPrepared,context:'Revisión y preparación técnica de datos ficticios nuevos; sin sesión comercial adicional.'});
 const result=await m.launch(c,label,'recuperacion');const originalAfter=await m.snapshot(c,label,group.adverseRun);
 const newRows=result.follows.filter(x=>!before.follows.some(y=>x.Id===y.Id));const x=result.execution;
 const existingUnchanged=h.changed(before.follows,result.follows).length===0;
 const historyUnchanged=h.changed([before.execution],[originalAfter.execution]).length===0&&h.changed(before.incidents,originalAfter.incidents).length===0&&before.incidents.length===originalAfter.incidents.length;
 const canonical=result.follows.every(f=>f.ClaveIdentidad__c===f.Contrato__c+'|'+f.FechaVencimientoCapturada__c)&&new Set(result.follows.map(f=>f.ClaveIdentidad__c)).size===group.count;
 const pass=result.job.Status==='Completed'&&result.job.NumberOfErrors===0&&x.Estado__c==='Completada'&&!x.RequiereReconciliacion__c&&x.Evaluados__c===group.count&&x.Creados__c===missing.length&&x.YaExistentes__c===before.follows.length&&x.Omitidos__c===0&&x.Fallidos__c===0&&x.LotesFallidos__c===0&&result.incidents.length===0&&result.follows.length===group.count&&newRows.length===missing.length&&newRows.every(f=>missing.includes(f.Contrato__c)&&f.Ejecucion__c===x.Id&&f.Estado__c==='Pendiente'&&f.OwnerId===h.read('antes.json').commercial)&&existingUnchanged&&historyUnchanged&&canonical;
 h.publish(label+'-recuperacion-comprobacion.json',{timestamp:new Date().toISOString(),pass,job:result.job.Id,execution:x.Id,created:x.Creados__c,existing:x.YaExistentes__c,newFollowIds:newRows.map(f=>f.Id),existingUnchanged,originalExecutionAndIncidentsUnchanged:historyUnchanged,originalReconciliation:originalAfter.execution.RequiereReconciliacion__c,canonical,newExecution:true,automaticRetry:false});
 if(!pass)throw Error('Recuperación no conforme.');state=h.read('estado.json');state.groups[label].recoveryVerified=true;h.save('estado.json',state);console.log(JSON.stringify({label,recovered:true,created:x.Creados__c,existing:x.YaExistentes__c,historyUnchanged}));
})().catch(h.reportError);
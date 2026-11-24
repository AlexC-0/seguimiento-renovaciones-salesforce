'use strict';
const h=require('./comun.cjs'),e=require('./ensayos.cjs'),rule=require('./regla.cjs');
(async()=>{
 const c=await h.connect(process.argv[2]);let group;
 if(process.argv[3]==='continuar-preparacion'){group=h.read('estado.json').groups.parcial;if(!group||Object.keys(group.runs).length)throw Error('No se puede repetir un lanzamiento ya iniciado.');}
 else{group=await e.prepare(c,'parcial',5);await rule.prepare(c,group);}
 let r;
 try{
  await rule.set(true);
  r=await e.launch(c,'parcial','rechazo',5,1);
  const x=r.executions[0],target=group.contracts[0].id;
  const pass=r.jobs.length===1&&r.jobs[0].Status==='Completed'&&r.jobs[0].NumberOfErrors===0&&r.jobs[0].JobItemsProcessed===1&&r.jobs[0].TotalJobItems===1&&x.Estado__c==='Completada con incidencias'&&!x.RequiereReconciliacion__c&&x.Evaluados__c===5&&x.Creados__c===4&&x.YaExistentes__c===0&&x.Omitidos__c===0&&x.Fallidos__c===1&&x.LotesFallidos__c===0&&r.follows.length===4&&!r.follows.some(f=>f.Contrato__c===target)&&r.incidents.length===1&&r.incidents[0].Contrato__c===target&&r.incidents[0].CodigoError__c==='FIELD_CUSTOM_VALIDATION_EXCEPTION'&&r.incidents[0].Mensaje__c.includes('P06_F4A_RECHAZO_INDIVIDUAL')&&r.incidents[0].Etapa__c==='Creación'&&r.incidents[0].ClaveIntentada__c===target+'|'+group.contracts[0].expiry&&r.incidents[0].Ejecucion__c===x.Id;
  h.publish('parcial-comprobacion.json',{timestamp:new Date().toISOString(),pass,job:r.jobs[0].Id,execution:x.Id,state:x.Estado__c,expected:{evaluated:5,created:4,failed:1,failedScopes:0},observed:{evaluated:x.Evaluados__c,created:x.Creados__c,existing:x.YaExistentes__c,omitted:x.Omitidos__c,failed:x.Fallidos__c,failedScopes:x.LotesFallidos__c},rejectedContract:target,rejectedFollowAbsent:!r.follows.some(f=>f.Contrato__c===target),incident:r.publicResult.incidents[0],reconciliation:x.RequiereReconciliacion__c});
  console.log(JSON.stringify({partial:pass,created:x.Creados__c,failed:x.Fallidos__c,failedScopes:x.LotesFallidos__c,incidents:r.incidents.length}));
  if(!pass)throw Error('Ensayo parcial no conforme; conservar el resultado original.');
 }finally{await rule.set(false);}
 const state=h.read('estado.json');state.groups.parcial.partialVerified=true;h.save('estado.json',state);
})().catch(h.reportError);

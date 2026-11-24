'use strict';
const h = require('./comun.cjs'); const e = require('./ensayos.cjs');
(async () => {
  const attempt = Number(process.argv[3]); if (![1,2,3].includes(attempt)) throw Error('Intento fuera del máximo de tres.');
  const c = await h.connect(process.argv[2]); const state=h.read('estado.json');
  for(let i=1;i<attempt;i++){const old=h.readJSON(h.path.join(h.out,'solapamiento-'+i+'-comprobacion.json'));if(old.overlapObserved)throw Error('Ya se observó solapamiento; no ampliar ensayos.');}
  const label = 'solapamiento-' + attempt;
  let run='doble';
  if(process.argv[4]==='corregir-compilacion'){
    const receipt=h.read(label+'-doble-apex.json');const failure=receipt.data||receipt.result;
    if(failure?.compiled!==false||!state.groups[label]||state.groups[label].runs.doble.receipt)throw Error('No hay fallo de compilación confirmado para corregir.');
    const since=state.groups[label].runs.doble.started.replace(/\.\d{3}Z$/,'Z');
    const jobs=(await h.queryAll(c,"SELECT Id FROM AsyncApexJob WHERE JobType='BatchApex' AND ApexClass.Name='LoteRenovaciones' AND CreatedDate >= "+since)).rows;
    const follows=await h.bounded(c,'SeguimientoRenovacion__c','Contrato__c IN '+h.ids(state.groups[label].contracts.map(x=>x.id)));
    if(jobs.length||follows.length)throw Error('Hay resultados que deben inspeccionarse antes de otro lanzamiento.');
    state.groups[label].runs.doble.notExecuted=true;h.save('estado.json',state);
    h.publish(label+'-compilacion-inicial.json',{timestamp:new Date().toISOString(),compiled:false,success:false,problem:failure.compileProblem,newJobs:0,newFollows:0,correction:'Consulta de observación en USER_MODE; sin cambios de aplicación.'});
    run='doble-corregido';
  }else await e.prepare(c, label, 30);
  const r = await e.launch(c, label, run, 5, 2);
  const sameKeys = new Set(r.follows.map(x=>x.ClaveIdentidad__c)).size===30 && r.follows.every(x=>x.ClaveIdentidad__c===x.Contrato__c+'|'+x.FechaVencimientoCapturada__c);
  const accounting = r.executions.every(x=>x.Evaluados__c===30 && x.Evaluados__c===x.Creados__c+x.YaExistentes__c+x.Omitidos__c+x.Fallidos__c && x.Creados__c===r.follows.filter(f=>f.Ejecucion__c===x.Id).length);
  const pass = r.jobs.every(x=>x.Status==='Completed'&&x.NumberOfErrors===0&&x.JobItemsProcessed===6&&x.TotalJobItems===6)&&r.executions.every(x=>x.Estado__c==='Completada'&&!x.RequiereReconciliacion__c&&x.Fallidos__c===0&&x.LotesFallidos__c===0)&&r.follows.length===30&&sameKeys&&accounting&&r.executions.reduce((n,x)=>n+x.Creados__c,0)===30&&r.incidents.length===0&&r.publicResult.overwrites.length===0&&r.publicResult.follows.every(x=>x.ownerMatchesContract&&x.state==='Pendiente'&&x.notes===null&&x.created===x.lastModified);
  h.publish(label+'-comprobacion.json',{timestamp:new Date().toISOString(),attempt,overlapObserved:r.publicResult.overlapObserved,insertionCollisionDemonstrated:false,uniqueFollows:r.follows.length,canonicalKeys:sameKeys,accounting,confirmedCreations:r.executions.reduce((n,x)=>n+x.Creados__c,0),existing:r.executions.reduce((n,x)=>n+x.YaExistentes__c,0),noOverwrites:r.publicResult.overwrites.length===0,incidents:r.incidents.length,pass});
  console.log(JSON.stringify({attempt,overlapObserved:r.publicResult.overlapObserved,confirmedCreations:30,existing:r.executions.reduce((n,x)=>n+x.YaExistentes__c,0),uniqueFollows:r.follows.length,pass}));
  if(!pass)throw Error('Resultado de solapamiento no conforme; conservar registros y diagnosticar.');
})().catch(h.reportError);

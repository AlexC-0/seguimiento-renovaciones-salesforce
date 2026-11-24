'use strict';
const h=require('./comun.cjs'),m=require('./motor.cjs'),p=require('./preparar.cjs');
(async()=>{
 const c=await h.connect(process.argv[2]);const attempt=Number(process.argv[3]);if(![1,2].includes(attempt))throw Error('Máximo dos intentos.');
 const state=h.read('estado.json');if(attempt===2){const previous=state.groups['aborto-1'];if(!previous?.abortTooLate)throw Error('Segundo intento solo si el primero terminó antes del aborto.');}
 const label='aborto-'+attempt;await p.prepare(c,label,10);const result=await m.launch(c,label,'aborto',true);
 const receipt=h.read('estado.json').groups[label].runs.aborto.receipt;
 const actual=result.job.Status;const classification=actual==='Aborted'?(result.follows.length?'después de resultados confirmados':receipt.beforeAbort==='Holding'&&result.execution.Estado__c==='Encolada'?'antes de comenzar':'sin resultados confirmados; inicio no acreditado'):'aborto no obtenido';
 h.publish(label+'-clasificacion.json',{timestamp:new Date().toISOString(),classification,receipt,job:result.job,executionStateBeforeContrast:result.execution.Estado__c,confirmedFollows:result.follows.length,confirmedCounts:Object.fromEntries(m.counterNames.map(k=>[k,result.execution[k+'__c']])),aborted:actual==='Aborted'});
 if(actual!=='Aborted'){const s=h.read('estado.json');s.groups[label].abortTooLate=actual==='Completed';h.save('estado.json',s);throw Error('Aborto no obtenido; conservar y revisar antes de otro intento.');}
 const after=await m.contrast(c,label,'aborto');const pass=after.execution.Estado__c==='Abortada'&&after.execution.RequiereReconciliacion__c&&after.execution.LotesFallidos__c===result.execution.LotesFallidos__c&&after.incidents.some(x=>x.Etapa__c==='Reconciliación'&&x.CodigoError__c==='CONTRASTE_JOB');
 h.publish(label+'-comprobacion.json',{timestamp:new Date().toISOString(),pass,classification,job:after.job,execution:m.clean(after.execution),incidents:after.incidents.map(m.clean),noIndividualResultsReconstructed:true});
 if(!pass)throw Error('Diagnóstico de aborto no conforme.');const s=h.read('estado.json');s.groups[label].adverseVerified=true;s.groups[label].adverseRun='aborto';h.save('estado.json',s);console.log(JSON.stringify({label,classification,pass}));
})().catch(h.reportError);
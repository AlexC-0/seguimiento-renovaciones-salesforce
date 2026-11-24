'use strict';
const h=require('./comun.cjs'),m=require('./motor.cjs'),rules=require('./reglas.cjs');
(async()=>{
 const c=await h.connect(process.argv[2]);await rules.verify(c,false);
 const state=h.read('estado.json'),group=state.groups.reversion,target=h.read('reglas.json').target;
 const before=await m.snapshot(c,'reversion','fallo');const evidence=[];
 for(const log of h.read('logs-vinculados.json')){
  const body=h.fs.readFileSync(h.path.join(h.dir,'log-'+log.id+'.txt'),'utf8');const lines=body.split(/\r?\n/);
  const scopeLine=lines.find(x=>/VARIABLE_ASSIGNMENT\|\[\d+\]\|alcance\|/.test(x));if(!scopeLine)continue;
  const scope=JSON.parse(scopeLine.split('|alcance|')[1].split('|')[0]).map(x=>x.Id);
  const resultLine=lines.find(x=>/VARIABLE_ASSIGNMENT\|\[\d+\]\|resultados\|/.test(x));if(!resultLine)throw Error('Sin resultados en la traza.');
  const results=JSON.parse(resultLine.split('|resultados|')[1].split('|')[0]);
  const rolledBack=body.includes('|SAVEPOINT_ROLLBACK|');const rejectedAudit=body.includes('EXCEPTION_THROWN|[145]|System.DmlException:')&&body.includes('P06_F4B_RechazoAuditoria');
  evidence.push({log:log.id,start:log.start,sha256:log.sha256,scope,executionLinked:body.includes(before.execution.Id),insertResults:results.map(x=>({success:x.success,id:x.id})),tentativeSuccesses:results.filter(x=>x.success).length,individualFailures:results.filter(x=>!x.success).length,rolledBack,rejectedAudit,fatalError:body.includes('|FATAL_ERROR|'),persistedFollows:before.follows.filter(f=>scope.includes(f.Contrato__c)).map(f=>f.Id)});
 }
 const failed=evidence.filter(x=>x.rolledBack),success=evidence.filter(x=>!x.rolledBack);const allScope=evidence.flatMap(x=>x.scope);
 const tentativeIds=failed.flatMap(x=>x.insertResults.filter(y=>y.success).map(y=>y.id));
 const tentativePersisted=tentativeIds.length?(await h.queryAll(c,'SELECT Id FROM SeguimientoRenovacion__c WHERE Id IN '+h.ids(tentativeIds))).rows:[];
 const ex=before.execution;
 const proof=evidence.length===2&&allScope.length===10&&new Set(allScope).size===10&&group.contracts.every(x=>allScope.includes(x.id))&&evidence.every(x=>x.scope.length===5&&x.executionLinked)&&failed.length===1&&success.length===1&&failed[0].scope.includes(target)&&failed[0].tentativeSuccesses===4&&failed[0].individualFailures===1&&failed[0].rejectedAudit&&failed[0].fatalError&&failed[0].persistedFollows.length===0&&tentativePersisted.length===0&&success[0].persistedFollows.length===5&&success[0].tentativeSuccesses===5&&before.follows.length===5&&before.incidents.every(x=>x.Etapa__c!=='Creación')&&ex.Evaluados__c===5&&ex.Creados__c===5&&ex.YaExistentes__c===0&&ex.Omitidos__c===0&&ex.Fallidos__c===0&&before.job.NumberOfErrors===1;
 h.publish('reversion-prueba-lotes.json',{timestamp:new Date().toISOString(),pass:proof,job:before.job.Id,execution:ex.Id,scopeSource:'VARIABLE_ASSIGNMENT de alcance en execute, vinculado a la ejecución; no se deduce del orden ni de NumberOfErrors',scopes:evidence,tentativePersisted:tentativePersisted.length,individualIncidentsPersisted:before.incidents.filter(x=>x.Etapa__c==='Creación').length,confirmedCounters:Object.fromEntries(m.counterNames.map(k=>[k,ex[k+'__c']])),wholeScopeRollback:proof});
 if(!proof)throw Error('La evidencia no demuestra reversión completa y conservación del otro lote.');
 const after=await m.contrast(c,'reversion','fallo');
 const computable=after.job.Status==='Completed'&&after.job.JobItemsProcessed===after.job.TotalJobItems&&after.job.NumberOfErrors<=after.job.TotalJobItems;
 const expectedScopes=computable?Math.max(ex.LotesFallidos__c,after.job.NumberOfErrors):ex.LotesFallidos__c;
 const pass=after.execution.Estado__c==='Fallida'&&after.execution.RequiereReconciliacion__c&&after.execution.LotesFallidos__c===expectedScopes&&after.incidents.some(x=>x.Etapa__c==='Reconciliación'&&x.CodigoError__c==='CONTRASTE_JOB');
 h.publish('reversion-comprobacion.json',{timestamp:new Date().toISOString(),pass,job:after.job,execution:m.clean(after.execution),incidents:after.incidents.map(m.clean),rollbackEvidence:'reversion-prueba-lotes.json',confirmedIndividualCountersPreserved:true});
 if(!pass)throw Error('Diagnóstico no conforme.');const s=h.read('estado.json');s.groups.reversion.adverseVerified=true;s.groups.reversion.adverseRun='fallo';h.save('estado.json',s);console.log(JSON.stringify({rollback:proof,failedScope:failed[0].scope.length,otherScopePersisted:5,diagnosis:pass,incidents:after.incidents.length}));
})().catch(h.reportError);
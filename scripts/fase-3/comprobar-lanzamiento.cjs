'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { connectP06, reportError, root, readState, writeState } = require('./salesforce.cjs');
(async () => {
  const c = await connectP06(process.argv[2]);
  const stage = process.argv[3];
  if (!['primero', 'repeticion'].includes(stage)) throw Error('Etapa inválida.');
  const state = readState('demostracion.json');
  const response = readState('apex-' + stage + '.json');
  const result = response.result || response.data;
  if (response.status !== 0 || !result?.compiled || !result.success) throw Error('El lanzamiento no terminó correctamente; conservar el diagnóstico privado.');
  const matches = [...String(result.logs).matchAll(/P06_LANZAMIENTO=(\{[^\r\n]+\})/g)];
  if (matches.length !== 1) throw Error('No hay un único recibo del lanzamiento.');
  const receipt = JSON.parse(matches[0][1]);
  if (receipt.contratosEnFiltro !== 124 || receipt.tamanioLote !== 50 || receipt.corte !== state.cut) throw Error('El alcance o corte no coincide con lo previsto.');
  if (state.runs[stage].receipt && state.runs[stage].receipt.job !== receipt.job) throw Error('El recibo no coincide con el guardado.');
  state.runs[stage].receipt = receipt;
  writeState('demostracion.json', state);
  let job;
  let previous;
  for (let i = 0; i < 120; i++) {
    job = (await c.query("SELECT Id, Status, NumberOfErrors, JobItemsProcessed, TotalJobItems, CreatedById, ApexClass.Name FROM AsyncApexJob WHERE Id='" + receipt.job + "'")).records[0];
    if (!job || job.ApexClass.Name !== 'LoteRenovaciones' || job.CreatedById !== readState('operador.json').technicalUserId) throw Error('Job ajeno al lanzamiento.');
    const status = JSON.stringify({ stage, status: job.Status, scopesProcessed: job.JobItemsProcessed, scopesTotal: job.TotalJobItems });
    if (status !== previous) { console.log(status); previous = status; }
    if (['Completed', 'Failed', 'Aborted'].includes(job.Status)) break;
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  if (!['Completed', 'Failed', 'Aborted'].includes(job.Status)) throw Error('Trabajo todavía en curso; no se relanza.');
  const execution = await c.sobject('EjecucionRenovacion__c').retrieve(receipt.ejecucion);
  const ids = state.contracts.map(x => x.id);
  const follows = (await c.query("SELECT FIELDS(ALL) FROM SeguimientoRenovacion__c WHERE Contrato__c IN ('" + ids.join("','") + "') LIMIT 200")).records;
  writeState('resultado-' + stage + '.json', { job, execution, follows });
  const candidates = state.contracts.filter(x => x.eligible);
  const candidateIds = new Set(candidates.map(x => x.id));
  const origin = stage === 'primero' ? receipt.ejecucion : state.runs.primero.receipt.ejecucion;
  const before = readState('seguimientos-antes-' + stage + '.json');
  const changed = stage === 'repeticion' ? before.filter(old => {
    const now = follows.find(x => x.Id === old.Id);
    return !now || Object.keys(old).some(k => !['attributes', 'LastViewedDate', 'LastReferencedDate', 'DiasRestantes__c'].includes(k) && JSON.stringify(old[k]) !== JSON.stringify(now[k]));
  }).map(x => x.Id) : [];
  const counts = Object.fromEntries(['Evaluados__c', 'Creados__c', 'YaExistentes__c', 'Omitidos__c', 'Fallidos__c', 'LotesFallidos__c'].map(k => [k, execution[k]]));
  const pass = job.Status === 'Completed' && job.NumberOfErrors === 0 && job.TotalJobItems === 3 && job.JobItemsProcessed === 3 && execution.AsyncApexJobId__c === job.Id && execution.Estado__c === 'Completada' && !execution.RequiereReconciliacion__c && counts.Evaluados__c === 120 && counts.Creados__c === (stage === 'primero' ? 120 : 0) && counts.YaExistentes__c === (stage === 'primero' ? 0 : 120) && counts.Omitidos__c === 0 && counts.Fallidos__c === 0 && counts.LotesFallidos__c === 0 && follows.length === 120 && new Set(follows.map(x => x.Contrato__c)).size === 120 && follows.every(x => candidateIds.has(x.Contrato__c) && x.OwnerId === state.ownerId && x.Ejecucion__c === origin && x.ClaveIdentidad__c === x.Contrato__c + '|' + x.FechaVencimientoCapturada__c && x.FechaVencimientoCapturada__c === candidates.find(y => y.id === x.Contrato__c).expiry) && changed.length === 0;
  const evidence = { stage, timestamp: new Date().toISOString(), receipt, job: { id: job.Id, status: job.Status, numberOfErrors: job.NumberOfErrors, jobItemsProcessed: job.JobItemsProcessed, totalJobItems: job.TotalJobItems, unit: 'lotes, no contratos' }, execution: { id: execution.Id, state: execution.Estado__c, cut: execution.FechaCorte__c, windowEnd: execution.FinVentana__c, timezone: execution.ZonaHoraria__c, reconciliation: execution.RequiereReconciliacion__c, counts }, expectedCandidates: 120, follows: follows.length, unchangedOnRepeat: stage === 'repeticion' ? changed.length === 0 : null, changedFollowIds: changed, originalExecutionPreserved: follows.every(x => x.Ejecucion__c === origin), ownerMatchesContract: follows.every(x => x.OwnerId === state.ownerId), states: follows.reduce((a, x) => ({ ...a, [x.Estado__c]: (a[x.Estado__c] || 0) + 1 }), {}), pass };
  fs.writeFileSync(path.join(root, 'docs/evidencias-fase-3/' + stage + '.json'), JSON.stringify(evidence, null, 2) + '\n');
  if (!pass) throw Error('Demostración no conforme; no repetir ni borrar registros.');
  state.runs[stage].verified = true;
  state.runs[stage].finishedAt = evidence.timestamp;
  if (!state.records.some(x => x.id === execution.Id)) state.records.push({ objeto: 'EjecucionRenovacion__c', id: execution.Id, funcion: stage });
  for (const follow of follows) if (!state.records.some(x => x.id === follow.Id)) state.records.push({ objeto: 'SeguimientoRenovacion__c', id: follow.Id, funcion: 'seguimiento_generado' });
  writeState('demostracion.json', state);
  fs.writeFileSync(path.join(root, 'docs/evidencias-fase-3/inventario.json'), JSON.stringify({ tag: state.tag, records: state.records }, null, 2) + '\n');
  console.log(JSON.stringify(evidence));
})().catch(reportError);

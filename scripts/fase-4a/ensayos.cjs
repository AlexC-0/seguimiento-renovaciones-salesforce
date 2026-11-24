'use strict';
const h = require('./comun.cjs');
async function prepare(c, label, count) {
  const state = h.read('estado.json'); if (state.groups[label]) throw Error('El conjunto ya existe; no repetir preparación.');
  const before = h.read('antes.json');
  const cut = new Intl.DateTimeFormat('en-CA', { timeZone: before.timezone }).format(new Date());
  const date = offset => new Date(new Date(cut + 'T12:00:00Z').getTime() + offset * 86400000).toISOString().slice(0, 10);
  const group = { label, cut, end: date(30), timezone: before.timezone, count, records: [], runs: {}, preparedAt: new Date().toISOString() };
  state.groups[label] = group; h.save('estado.json', state);
  const headers = { 'Content-Type': 'application/json', 'Sforce-Email': 'triggerUserEmail=false, triggerOtherEmail=false, triggerAutoResponseEmail=false' };
  const account = await c.request({ method: 'POST', url: '/services/data/v65.0/sobjects/Account', headers, body: JSON.stringify({ Name: 'P06 F4A ' + label + ' ' + group.preparedAt }) });
  if (!account.success) throw Error('Cuenta no confirmada.');
  group.account = account.id; group.records.push({ objeto: 'Account', id: account.id }); h.save('estado.json', state); h.inventory(state);
  const data = Array.from({ length: count }, (_, i) => ({ attributes: { type: 'ContratoComercial__c' }, Cuenta__c: account.id, OwnerId: before.commercial, FechaInicio__c: date(-365), FechaVencimiento__c: date(10 + i % 10), Estado__c: 'Activo' }));
  h.save(label + '-contratos-previstos.json', data);
  const result = await c.request({ method: 'POST', url: '/services/data/v65.0/composite/sobjects', headers, body: JSON.stringify({ allOrNone: true, records: data }) });
  if (result.length !== count || result.some(x => !x.success)) throw Error('Conjunto no confirmado; no recrear automáticamente.');
  group.contracts = result.map((x, i) => ({ id: x.id, expiry: data[i].FechaVencimiento__c }));
  group.records.push(...group.contracts.map(x => ({ objeto: 'ContratoComercial__c', id: x.id }))); h.save('estado.json', state); h.inventory(state);
  const contracts = await h.records(c, 'ContratoComercial__c', group.contracts.map(x => x.id));
  const follows = await h.bounded(c, 'SeguimientoRenovacion__c', 'Contrato__c IN ' + h.ids(group.contracts.map(x => x.id)));
  if (follows.length) throw Error('El conjunto inicial ya contiene seguimientos.');
  h.save(label + '-contratos-iniciales.json', contracts.rows);
  h.publish(label + '-conjunto.json', { label, timestamp: group.preparedAt, cut, end: group.end, timezone: group.timezone, eligible: count, account: account.id, contracts: group.contracts, initialFollows: 0, queryChecks: contracts.checks });
  console.log(JSON.stringify({ label, eligible: count, newAccount: 1, initialFollows: 0 })); return group;
}
async function launch(c, label, run, batchSize, copies) {
  let state = h.read('estado.json'); const group = state.groups[label]; const before = h.read('antes.json');
  if (!group?.contracts || group.runs[run]) throw Error('Lanzamiento no preparado o ya registrado.');
  if (new Intl.DateTimeFormat('en-CA', { timeZone: group.timezone }).format(new Date()) !== group.cut) throw Error('Cambió el corte; revisar antes de lanzar.');
  const values = group.contracts.map(x => x.id);
  const contracts = (await h.records(c, 'ContratoComercial__c', values)).rows;
  if (contracts.length !== group.count || contracts.some(x => x.Cuenta__c !== group.account || x.Estado__c !== 'Activo' || x.FechaVencimiento__c < group.cut || x.FechaVencimiento__c > group.end)) throw Error('Alcance no elegible o ajeno.');
  const prior = await h.bounded(c, 'SeguimientoRenovacion__c', 'Contrato__c IN ' + h.ids(values));
  const name = label + '-' + run; h.save(name + '-seguimientos-antes.json', prior);
  const source = `Set<Id> alcance = new Set<Id>{${values.map(x => "'" + x + "'").join(',')}};
List<Map<String,Object>> recibos = new List<Map<String,Object>>();
Set<Id> trabajos = new Set<Id>();
for (Integer i = 0; i < ${copies}; i++) {
    Id identificador = ServicioRenovaciones.lanzar(${batchSize}, alcance);
    EjecucionRenovacion__c e = ServicioRenovaciones.leerEjecucion(identificador);
    trabajos.add((Id)e.AsyncApexJobId__c);
    recibos.add(new Map<String,Object>{'execution'=>e.Id,'job'=>e.AsyncApexJobId__c,'cut'=>e.FechaCorte__c,'end'=>e.FinVentana__c,'timezone'=>e.ZonaHoraria__c,'scope'=>alcance.size(),'batchSize'=>${batchSize}});
}
List<AsyncApexJob> cola = [SELECT Id,Status,JobItemsProcessed,TotalJobItems,NumberOfErrors FROM AsyncApexJob WHERE Id IN :trabajos WITH USER_MODE];
System.debug(LoggingLevel.ERROR, 'P06_4A=' + JSON.serialize(new Map<String,Object>{'receipts'=>recibos,'queueObservedAt'=>System.now(),'queue'=>cola}));
`;
  h.fs.writeFileSync(h.path.join(h.dir, name + '.apex'), source);
  const started = new Date().toISOString();
  group.runs[run] = { started, scope: values, batchSize, copies, priorFollows: prior.length, sourceHash: h.hash(source) }; h.save('estado.json', state);
  h.publish(name + '-previo.json', { label, run, ...group.runs[run], cut: group.cut, end: group.end, timezone: group.timezone, expectedCandidatesPerJob: group.count });
  let cliDone = false, cliError, response;
  const command = h.cli(['apex','run','--target-org','p06-renovaciones-dev','--api-version','65.0','--file',h.path.join(h.dir,name+'.apex'),'--debug-level','DEBUGONLY','--json'], name + '-apex').then(x => { response = x; cliDone = true; }).catch(e => { cliError = e; cliDone = true; });
  const observations = []; const seen = new Map(prior.map(x => [x.Id, x])); let lastStatus = ''; let finalJobs = [];
  const since = started.replace(/\.\d{3}Z$/, 'Z');
  for (let i = 0; i < 400; i++) {
    const requestedAt = new Date().toISOString();
    const query = await h.queryAll(c, "SELECT Id, Status, JobItemsProcessed, TotalJobItems, NumberOfErrors, CreatedDate, CompletedDate FROM AsyncApexJob WHERE JobType='BatchApex' AND ApexClass.Name='LoteRenovaciones' AND CreatedById='" + before.technical + "' AND CreatedDate >= " + since + ' ORDER BY CreatedDate,Id');
    if (query.rows.length > copies) throw Error('Aparecieron jobs adicionales; no atribuirlos automáticamente al ensayo.');
    const jobs = query.rows.map(({ attributes, ...x }) => x); finalJobs = jobs;
    observations.push({ requestedAt, receivedAt: new Date().toISOString(), jobs, queryComplete: query.done, pages: query.pages });
    h.save(name + '-observaciones.json', observations);
    const signature = JSON.stringify(jobs.map(x => [x.Id, x.Status, x.JobItemsProcessed, x.TotalJobItems]));
    if (signature !== lastStatus) {
      lastStatus = signature; console.log(JSON.stringify({ label, run, observed: jobs.map(x => ({ id: x.Id, status: x.Status, scopes: x.JobItemsProcessed, total: x.TotalJobItems })) }));
      const rows = (await h.queryAll(c, 'SELECT FIELDS(ALL) FROM SeguimientoRenovacion__c WHERE Contrato__c IN ' + h.ids(values) + ' LIMIT 200')).rows;
      for (const row of rows) if (!seen.has(row.Id)) seen.set(row.Id, row);
    }
    if (cliDone && cliError) break;
    if (cliDone && jobs.length === copies && jobs.every(x => ['Completed','Failed','Aborted'].includes(x.Status))) {
      const closure = (await h.queryAll(c, 'SELECT Id, AsyncApexJobId__c, Estado__c, Finalizacion__c FROM EjecucionRenovacion__c WHERE AsyncApexJobId__c IN ' + h.ids(jobs.map(x => x.Id)))).rows;
      observations[observations.length - 1].executionClosures = closure.map(({attributes,...x})=>x);
      h.save(name + '-observaciones.json', observations);
      if (h.completed(jobs, closure, copies)) break;
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  await command; if (cliError) throw cliError;
  const apex = response.result || response.data;
  if (response.status !== 0 || !apex?.compiled || !apex.success) throw Error('Lanzamiento no confirmado; conservar recibo.');
  const matches = [...String(apex.logs).matchAll(/P06_4A=(\{[^\r\n]+\})/g)]; if (matches.length !== 1) throw Error('Recibo de lanzamiento ausente o ambiguo.');
  const receipt = JSON.parse(matches[0][1]);
  if (receipt.receipts.length !== copies || receipt.receipts.some(x => x.scope !== group.count || x.batchSize !== batchSize || x.cut !== group.cut || x.end !== group.end || x.timezone !== group.timezone)) throw Error('Contexto de lanzamiento inesperado.');
  const jobIds = receipt.receipts.map(x => x.job);
  if (finalJobs.length !== copies || finalJobs.some(x => !jobIds.includes(x.Id) || !['Completed','Failed','Aborted'].includes(x.Status))) throw Error('Trabajos todavía activos o ajenos; revisar sin relanzar.');
  const executions = (await h.records(c, 'EjecucionRenovacion__c', receipt.receipts.map(x => x.execution))).rows;
  const follows = await h.bounded(c, 'SeguimientoRenovacion__c', 'Contrato__c IN ' + h.ids(values));
  const incidents = await h.bounded(c, 'IncidenciaRenovacion__c', 'Ejecucion__c IN ' + h.ids(executions.map(x => x.Id)));
  const result = { receipt, jobs: finalJobs, executions, follows, incidents, observations, earliestFollows: [...seen.values()], previousFollows: prior };
  h.save(name + '-resultado.json', result);
  state = h.read('estado.json'); state.groups[label].runs[run].receipt = receipt; state.groups[label].runs[run].completed = true;
  for (const [object, rows] of [['EjecucionRenovacion__c',executions],['SeguimientoRenovacion__c',follows],['IncidenciaRenovacion__c',incidents]]) for (const row of rows) if (!state.groups[label].records.some(x => x.id === row.Id)) state.groups[label].records.push({ objeto: object, id: row.Id });
  h.save('estado.json', state); h.inventory(state);
  const overlap = copies === 2 && observations.some(o => o.jobs.length === 2 && o.jobs.every(x => jobIds.includes(x.Id) && x.Status === 'Processing'));
  const overwritten = h.changed([...seen.values()], follows);
  const publicResult = { label, run, timestamp: new Date().toISOString(), receipts: receipt.receipts, queueObservedAt: receipt.queueObservedAt, queueBeforeCommit: receipt.queue.map(({attributes,...x})=>x), queueObservationContext:'Observación dentro de la transacción de lanzamiento, antes del commit; no acredita procesamiento.', observations, overlapObserved: overlap, overlapCriterion: 'Ambos jobs con Status=Processing en una misma respuesta SOQL completa.', insertionCollisionDemonstrated: false, insertionCollisionLimit: 'YaExistentes no distingue consulta previa de confirmación tras DUPLICATE_VALUE; no se capturó esa ruta interna.', jobs: finalJobs, executions: executions.map(e => ({ id:e.Id, job:e.AsyncApexJobId__c, state:e.Estado__c, cut:e.FechaCorte__c,end:e.FinVentana__c,timezone:e.ZonaHoraria__c,reconciliation:e.RequiereReconciliacion__c,counts:Object.fromEntries(['Evaluados','Creados','YaExistentes','Omitidos','Fallidos','LotesFallidos'].map(k=>[k,e[k+'__c']])) })), follows: follows.map(f=>({id:f.Id,contract:f.Contrato__c,capture:f.FechaVencimientoCapturada__c,key:f.ClaveIdentidad__c,state:f.Estado__c,notes:f.Notas__c,origin:f.Ejecucion__c,ownerMatchesContract:f.OwnerId===before.commercial,created:f.CreatedDate,lastModified:f.LastModifiedDate})), incidents: incidents.map(x=>({id:x.Id,execution:x.Ejecucion__c,contract:x.Contrato__c,key:x.ClaveIntentada__c,stage:x.Etapa__c,code:x.CodigoError__c,message:x.Mensaje__c,fields:x.CamposAfectados__c})), overwrites: overwritten };
  h.publish(name + '-resultado.json', publicResult); return { ...result, publicResult };
}
module.exports = { prepare, launch };

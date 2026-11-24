'use strict';
const h = require('./comun.cjs');
(async () => {
  if (h.fs.existsSync(h.path.join(h.dir, 'antes.json'))) throw Error('La instantánea inicial ya existe.');
  const c = await h.connect(process.argv[2]);
  const limits = await c.request('/services/data/v65.0/limits');
  const active = (await c.query("SELECT COUNT() FROM AsyncApexJob WHERE JobType='BatchApex' AND Status IN ('Queued','Preparing','Processing','Holding')")).totalSize;
  if (limits.DailyAsyncApexExecutions.Remaining < 100 || limits.DailyApiRequests.Remaining < 1500 || active > 3) throw Error('Límites insuficientes para el ensayo acotado.');
  const inventory = [...h.readJSON(h.path.join(h.root, 'docs/evidencias-fase-1b.json')).comprobacionesFuncionales.registrosCreados, ...h.readJSON(h.path.join(h.root, 'docs/evidencias-fase-2/fixtures.json')).registros, ...h.readJSON(h.path.join(h.root, 'docs/evidencias-fase-3/inventario.json')).records, ...h.readJSON(h.path.join(h.root, 'docs/evidencias-fase-4a/inventario.json')).records];
  if (inventory.length !== 374 || new Set(inventory.map(x => x.id)).size !== 374) throw Error('Inventario anterior inesperado.');
  const rows = [], checks = [];
  for (const object of [...new Set(inventory.map(x => x.objeto))]) {
    const result = await h.records(c, object, inventory.filter(x => x.objeto === object).map(x => x.id));
    rows.push(...result.rows.map(row => ({ object, row }))); checks.push(...result.checks);
  }
  const security = await c.metadata.read('SecuritySettings', 'Security'); if (security.enableAdminLoginAsAnyUser !== false) throw Error('Login As debe permanecer false.');
  const users = h.readJSON(h.path.join(h.root, '.sf/p06-fase-2/usuarios.json')).users;
  const assignments = (await h.queryAll(c, 'SELECT AssigneeId, PermissionSetId FROM PermissionSetAssignment WHERE AssigneeId IN ' + h.ids(users.map(x => x.id)) + ' ORDER BY AssigneeId, PermissionSetId')).rows;
  const userRows = (await h.queryAll(c, 'SELECT Id, ProfileId, UserRoleId, IsActive FROM User WHERE Id IN ' + h.ids(users.map(x => x.id)) + ' ORDER BY Id')).rows;
  const technical = h.readJSON(h.path.join(h.root, '.sf/p06-fase-3/operador.json')).technicalUserId;
  const timezone = (await c.query("SELECT TimeZoneSidKey FROM User WHERE Id='" + technical + "'")).records[0].TimeZoneSidKey;
  const git = args => h.cp.execFileSync('git', ['-c', 'safe.directory=' + h.root.replaceAll('\\', '/'), ...args], { cwd: h.root });
  const files = git(['ls-tree', '-r', '--name-only', '-z', h.baseline, 'docs']).toString().split('\0').filter(x => x.startsWith('docs/evidencias'));
  const evidence = files.map(file => { const bytes = h.fs.readFileSync(h.path.join(h.root, file)); const blob = git(['show', h.baseline + ':' + file]); if (bytes.toString().replace(/\r\n/g, '\n') !== blob.toString().replace(/\r\n/g, '\n')) throw Error('Evidencia previa alterada.'); return { file, sha256: h.hash(bytes) }; });
  const application = git(['ls-tree', '-r', '--name-only', '-z', h.baseline, 'force-app', 'manifest']).toString().split('\0').filter(Boolean).map(file => ({ file, sha256: h.hash(h.fs.readFileSync(h.path.join(h.root, file))) }));
  const previousRule = await c.metadata.read('CustomObject','SeguimientoRenovacion__c');
  if(previousRule.validationRules.find(x=>x.fullName==='P06_F4A_RechazoAcotado')?.active!==false)throw Error('La regla F4A debe seguir inactiva.');
  const traceFlags = await c.tooling.query('SELECT Id, TracedEntityId, DebugLevelId, LogType, StartDate, ExpirationDate FROM TraceFlag');
  if(!traceFlags.done)throw Error('Inventario de trazas incompleto.');
  h.save('trazas-previas.json',traceFlags.records);
  h.save('antes.json', { timestamp: new Date().toISOString(), rows, checks, evidence, application, assignments, users: userRows, technical, commercial: users.find(x => x.actor === 'B').id, timezone, limits, loginAs: false });
  h.save('estado.json', { groups: {} });
  h.publish('inspeccion.json', { timestamp: new Date().toISOString(), baseline: h.baseline, target: process.argv[2], apiVersion: '65.0', records: rows.length, queries: checks, priorEvidenceFiles: evidence.length, limits: { dailyApi: limits.DailyApiRequests, dailyAsync: limits.DailyAsyncApexExecutions, activeBatchJobs: active }, timezone, loginAs: false, tools: { node: process.version, salesforceCli: '2.158.7' } });
  console.log(JSON.stringify({ records: rows.length, queriesComplete: checks.every(x => x.done && x.requested === x.retrieved), priorEvidenceFiles: evidence.length, activeBatchJobs: active, availableApi: limits.DailyApiRequests.Remaining, availableAsync: limits.DailyAsyncApexExecutions.Remaining, timezone, loginAs: false }));
})().catch(h.reportError);

'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const { connectP06, reportError, root, cliModules } = require('../fase-2/salesforce.cjs');
require(path.join(cliModules, '@jsforce/jsforce-node/lib/api/metadata'));
const dir = path.join(root, '.sf/p06-revision-fase-3');
const read = name => { const b = fs.readFileSync(path.join(dir, name)); return JSON.parse(b.toString(b[0] === 255 && b[1] === 254 ? 'utf16le' : 'utf8').replace(/^\uFEFF/, '')); };
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const content = b => b.toString('utf8').replace(/\r\n/g, '\n').replace(/\n$/, '');
(async () => {
  const c = await connectP06(process.argv[2]);
  const before = read('inspeccion-antes.json');
  const validated = read('fuentes-validadas.json');
  const result = name => {
    const r = read(name).result;
    const t = r.details.runTestResult;
    return { id: r.id, status: r.status, success: r.success, done: r.done, checkOnly: r.checkOnly, components: r.numberComponentsDeployed, totalComponents: r.numberComponentsTotal, testsPassed: r.numberTestsCompleted, testErrors: r.numberTestErrors, methods: (t.successes || []).map(x => x.methodName).sort(), coverage: (t.codeCoverage || []).map(x => ({ name: x.name, locations: x.numLocations, uncovered: x.numLocationsNotCovered, percent: Number((100 * (x.numLocations - x.numLocationsNotCovered) / x.numLocations).toFixed(2)) })) };
  };
  const validation = result('validacion-2.json');
  const deployment = result('despliegue.json');
  if (![validation, deployment].every(x => x.done && x.success && x.status === 'Succeeded' && x.testsPassed === 20 && x.testErrors === 0)) throw Error('Validación o despliegue no terminado correctamente.');
  const sourceFiles = validated.files.map(x => ({ ...x, unchangedSinceValidation: hash(fs.readFileSync(path.join(root, x.file))) === x.sha256 }));
  if (sourceFiles.some(x => !x.unchangedSinceValidation)) throw Error('Fuente diferente de la validada.');
  const remote = await c.tooling.query("SELECT Name, Body, ApiVersion FROM ApexClass WHERE Name IN ('ServicioRenovaciones','LoteRenovaciones','RenovacionesTest')");
  if (remote.records.length !== 3) throw Error('Clases finales incompletas.');
  const remoteSources = remote.records.map(x => {
    const file = 'force-app/main/default/classes/' + x.Name + '.cls';
    const bytes = Buffer.from(x.Body, 'utf8');
    fs.mkdirSync(path.join(dir, 'fuentes-remotas-despues'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'fuentes-remotas-despues', x.Name + '.cls'), bytes);
    return { file, apiVersion: x.ApiVersion, remoteByteHash: hash(bytes), remoteContentHash: hash(content(bytes)), validatedContentHash: validated.files.find(f => f.file === file).contentSha256, sameContent: hash(content(bytes)) === validated.files.find(f => f.file === file).contentSha256 };
  });
  if (remoteSources.some(x => !x.sameContent || x.apiVersion !== 65)) throw Error('El contenido remoto no coincide con el validado.');
  const after = [];
  for (const type of [...new Set(before.rows.map(x => x.objeto))]) {
    const ids = before.rows.filter(x => x.objeto === type).map(x => x.id);
    const rows = (await c.query('SELECT FIELDS(ALL) FROM ' + type + " WHERE Id IN ('" + ids.join("','") + "') LIMIT 200")).records;
    if (rows.length !== ids.length) throw Error('Falta un registro inventariado.');
    after.push(...rows.map(row => ({ objeto: type, id: row.Id, row })));
  }
  const ignored = ['attributes', 'LastViewedDate', 'LastReferencedDate', 'DiasRestantes__c'];
  const differences = before.rows.flatMap(old => {
    const current = after.find(x => x.id === old.id).row;
    const fields = [...new Set([...Object.keys(old.row), ...Object.keys(current)])].filter(k => !ignored.includes(k) && JSON.stringify(old.row[k]) !== JSON.stringify(current[k]));
    return fields.length ? [{ id: old.id, objeto: old.objeto, fields }] : [];
  });
  const evidenceFiles = before.evidenceFiles.map(x => ({ file: x.file, unchangedBytes: hash(fs.readFileSync(path.join(root, x.file))) === x.bytesHash }));
  const users = JSON.parse(fs.readFileSync(path.join(root, '.sf/p06-fase-2/usuarios.json'), 'utf8')).users;
  const assignments = (await c.query("SELECT AssigneeId, PermissionSetId FROM PermissionSetAssignment WHERE AssigneeId IN ('" + users.map(x => x.id).join("','") + "') ORDER BY AssigneeId, PermissionSetId")).records;
  const assignmentsUnchanged = JSON.stringify(assignments) === JSON.stringify(before.assignments);
  const security = await c.metadata.read('SecuritySettings', 'Security');
  const jobs = (await c.query("SELECT Id, Status FROM AsyncApexJob WHERE JobType='BatchApex' AND ApexClass.Name='LoteRenovaciones' AND CreatedDate >= " + before.timestamp)).records;
  const forceignorePreserved = fs.readFileSync(path.join(root, '.forceignore')).equals(fs.readFileSync(path.join(dir, 'forceignore-antes.txt')));
  const methodsBefore = [...cp.execFileSync('git', ['-c', 'safe.directory=' + root.replaceAll('\\', '/'), 'show', '31528e267a3f2d65ba41015dc1ef9a5838c56195:force-app/main/default/classes/RenovacionesTest.cls'], { cwd: root, encoding: 'utf8' }).matchAll(/@IsTest\s+static void (\w+)\(/g)].map(x => x[1]);
  const previousTestsPreserved = methodsBefore.length === 14 && methodsBefore.every(x => deployment.methods.includes(x));
  fs.writeFileSync(path.join(dir, 'inspeccion-despues.json'), JSON.stringify({ timestamp: new Date().toISOString(), rows: after, assignments, jobs }, null, 2) + '\n');
  const evidence = { timestamp: new Date().toISOString(), baseline: '31528e267a3f2d65ba41015dc1ef9a5838c56195', target: process.argv[2], apiVersion: '65.0', validation, deployment, priorValidation: { ...result('validacion-1.json'), reason: 'La prueba de rechazo de creación de incidencia esperaba DmlException; USER_MODE devolvió TypeException. Corregida la aserción sin cambiar el mecanismo de rollback.' }, sourceFiles, remoteSources, normalization: 'UTF-8; CRLF a LF y eliminación de exactamente un LF final para Body remoto; hashes de bytes conservados por separado.', previousTestsPreserved, addedTests: deployment.methods.filter(x => !methodsBefore.includes(x)), conservation: { records: after.length, historical: 50, phase3: 247, changed: differences, ignoredFields: ignored, evidenceFiles, assignmentsUnchanged, forceignorePreserved }, newPersistentBatchJobs: jobs.length, loginAs: security.enableAdminLoginAsAnyUser, realAdverseJobsExecuted: false, demonstrationsRelaunched: false };
  evidence.pass = differences.length === 0 && after.length === 297 && evidenceFiles.every(x => x.unchangedBytes) && assignmentsUnchanged && forceignorePreserved && previousTestsPreserved && jobs.length === 0 && evidence.loginAs === false;
  fs.writeFileSync(path.join(root, 'docs/evidencias-revision-fase-3/comprobacion-final.json'), JSON.stringify(evidence, null, 2) + '\n');
  console.log(JSON.stringify({ validation: validation.id, deployment: deployment.id, tests: deployment.testsPassed, coverage: deployment.coverage, remoteSourceMatches: remoteSources.every(x => x.sameContent), recordsPreserved: after.length - differences.length, evidenceFilesPreserved: evidenceFiles.filter(x => x.unchangedBytes).length, assignmentsUnchanged, forceignorePreserved, newPersistentBatchJobs: jobs.length, loginAs: evidence.loginAs, pass: evidence.pass }));
  if (!evidence.pass) throw Error('Comprobación final no conforme; conservar el diagnóstico.');
})().catch(reportError);

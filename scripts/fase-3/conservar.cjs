'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const { connectP06, reportError, root, privateDir, readState, writeState } = require('./salesforce.cjs');
(async () => {
  const mode = process.argv[3];
  if (!['antes', 'despues'].includes(mode)) throw Error('Indicar antes o despues.');
  const connection = await connectP06(process.argv[2]);
  const one = JSON.parse(fs.readFileSync(path.join(root, 'docs/evidencias-fase-1b.json'), 'utf8')).comprobacionesFuncionales.registrosCreados;
  const two = JSON.parse(fs.readFileSync(path.join(root, 'docs/evidencias-fase-2/fixtures.json'), 'utf8')).registros;
  const inventory = [...one, ...two];
  if (inventory.length !== 50 || new Set(inventory.map(r => r.id)).size !== 50) throw Error('Inventario anterior inesperado.');
  if (mode === 'antes' && fs.existsSync(path.join(privateDir, 'historicos-antes.json'))) throw Error('La instantánea inicial ya existe; no se sobrescribe.');
  const rows = [];
  for (let i = 0; i < inventory.length; i += 5) {
    const batch = inventory.slice(i, i + 5);
    const results = await Promise.allSettled(batch.map(async r => ({ objeto: r.objeto, id: r.id, row: await connection.sobject(r.objeto).retrieve(r.id) })));
    for (const result of results) { if (result.status !== 'fulfilled') throw Error('Lectura histórica incompleta.'); rows.push(result.value); }
  }
  const users = JSON.parse(fs.readFileSync(path.join(root, '.sf/p06-fase-2/usuarios.json'), 'utf8')).users;
  const commercialAssignments = (await connection.query("SELECT AssigneeId, PermissionSetId, PermissionSet.Name FROM PermissionSetAssignment WHERE AssigneeId IN ('" + users.map(u => u.id).join("','") + "') ORDER BY AssigneeId, PermissionSetId")).records;
  if (mode === 'antes') {
    writeState('historicos-antes.json', { timestamp: new Date().toISOString(), rows, commercialAssignments });
    console.log(JSON.stringify({ historicalSnapshot: rows.length, commercialAssignmentsSaved: true }));
    return;
  }
  const before = readState('historicos-antes.json');
  const changed = rows.map(r => ({ objeto: r.objeto, id: r.id, fields: Object.keys(r.row).filter(k => !['attributes', 'LastViewedDate', 'LastReferencedDate', 'DiasRestantes__c'].includes(k) && JSON.stringify(r.row[k]) !== JSON.stringify(before.rows.find(b => b.id === r.id).row[k])) }));
  const git = args => cp.execFileSync('git', ['-c', 'safe.directory=' + root.replaceAll('\\', '/'), ...args], { cwd: root });
  const files = git(['ls-tree', '-r', '--name-only', '-z', '0716f9fc41d2b2142a79d9abd495f8236783ce03', 'docs/evidencias-fase-1b.json', 'docs/evidencias-fase-1b', 'docs/evidencias-fase-2.json', 'docs/evidencias-fase-2']).toString().split('\0').filter(Boolean);
  const hash = value => crypto.createHash('sha256').update(value.toString('utf8').replace(/\r\n/g, '\n')).digest('hex');
  const documents = files.map(file => ({ file, unchanged: hash(git(['show', '0716f9fc41d2b2142a79d9abd495f8236783ce03:' + file])) === hash(fs.readFileSync(path.join(root, file))) }));
  const evidence = { timestamp: new Date().toISOString(), previousRecords: rows.length, unchanged: changed.every(r => r.fields.length === 0), rows: changed, ignoredDynamicFields: ['LastViewedDate', 'LastReferencedDate', 'DiasRestantes__c'], commercialAssignmentsUnchanged: JSON.stringify(commercialAssignments) === JSON.stringify(before.commercialAssignments), historicalEvidence: documents };
  fs.writeFileSync(path.join(root, 'docs/evidencias-fase-3/conservacion.json'), JSON.stringify(evidence, null, 2) + '\n');
  console.log(JSON.stringify({ previousRecords: rows.length, unchanged: evidence.unchanged, assignmentsUnchanged: evidence.commercialAssignmentsUnchanged, evidenceFilesUnchanged: documents.filter(x => x.unchanged).length }));
  if (!evidence.unchanged || !evidence.commercialAssignmentsUnchanged || documents.some(x => !x.unchanged)) throw Error('Conservación no confirmada.');
})().catch(reportError);

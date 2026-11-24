'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const { connectP06, reportError, root, cliModules } = require('../fase-2/salesforce.cjs');
require(path.join(cliModules, '@jsforce/jsforce-node/lib/api/metadata'));
const baseline = '31528e267a3f2d65ba41015dc1ef9a5838c56195';
const privateDir = path.join(root, '.sf/p06-revision-fase-3');
const outputDir = path.join(root, 'docs/evidencias-revision-fase-3');
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const normalized = b => new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(b).replace(/\r\n/g, '\n');
const content = b => normalized(b).replace(/\n$/, '');
const git = args => cp.execFileSync('git', ['-c', 'safe.directory=' + root.replaceAll('\\', '/'), ...args], { cwd: root, env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' } });
const json = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8').replace(/^\uFEFF/, ''));
function describe(b) { const t = normalized(b); return { bytes: b.length, sha256: hash(b), normalizedSha256: hash(t), contentSha256: hash(content(b)), finalLf: t.endsWith('\n'), utf8: true, bom: b.subarray(0, 3).equals(Buffer.from([239, 187, 191])), crlf: (b.toString('utf8').match(/\r\n/g) || []).length, lfOnly: (b.toString('utf8').match(/(?<!\r)\n/g) || []).length, crlfLines: b.toString('utf8').split('\n').flatMap((x, i) => x.endsWith('\r') ? [i + 1] : []) }; }
(async () => {
  if (process.argv[3] !== 'antes') throw Error('Indicar antes; la inspección inicial no se sobrescribe.');
  if (fs.existsSync(path.join(privateDir, 'inspeccion-antes.json'))) throw Error('Ya existe la instantánea inicial.');
  const c = await connectP06(process.argv[2]);
  fs.mkdirSync(privateDir, { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });
  const names = ['IdentidadRenovacion', 'LoteRenovaciones', 'ServicioRenovaciones', 'RenovacionesTest'];
  const remote = await c.tooling.query("SELECT Name, Body, ApiVersion FROM ApexClass WHERE Name IN ('" + names.join("','") + "')");
  if (remote.records.length !== names.length) throw Error('Clases desplegadas incompletas.');
  const publicReceipt = json('docs/evidencias-fase-3/despliegue-pruebas.json');
  const privateReceipt = json('.sf/p06-fase-3/fuentes-validadas.json');
  const sources = [];
  for (const name of names) {
    const file = 'force-app/main/default/classes/' + name + '.cls';
    const blob = git(['show', baseline + ':' + file]);
    const local = fs.readFileSync(path.join(root, file));
    const body = Buffer.from(remote.records.find(x => x.Name === name).Body, 'utf8');
    for (const [folder, bytes] of [['fuentes-locales-antes', local], ['fuentes-remotas-antes', body]]) {
      fs.mkdirSync(path.join(privateDir, folder), { recursive: true });
      const saved = path.join(privateDir, folder, name + '.cls');
      if (fs.existsSync(saved) && !fs.readFileSync(saved).equals(bytes)) throw Error('La fuente capturada ha cambiado.');
      if (!fs.existsSync(saved)) fs.writeFileSync(saved, bytes);
    }
    const publishedHash = publicReceipt.sourceHashes.find(x => x.file === file).sha256;
    const receiptHash = privateReceipt.files.find(x => x.file === file).sha256;
    sources.push({ file, publishedHash, privateReceiptHash: receiptHash, gitBlob: describe(blob), localBefore: describe(local), remoteBefore: describe(body), originalReceiptsAgree: publishedHash === receiptHash, localMatchesOriginalBytes: hash(local) === receiptHash, gitLocalEquivalentLF: normalized(local) === normalized(blob), equivalentNormalized: content(local) === content(blob) && content(body) === content(blob) });
  }
  if (sources.some(x => !x.originalReceiptsAgree || !x.localMatchesOriginalBytes || !x.equivalentNormalized)) throw Error('Diferencia adicional de fuentes; revisar instantáneas antes de continuar.');
  const inventory = [...json('docs/evidencias-fase-1b.json').comprobacionesFuncionales.registrosCreados, ...json('docs/evidencias-fase-2/fixtures.json').registros, ...json('docs/evidencias-fase-3/inventario.json').records];
  if (inventory.length !== 297 || new Set(inventory.map(x => x.id)).size !== 297) throw Error('Inventario inesperado.');
  const rows = [];
  for (const type of [...new Set(inventory.map(x => x.objeto))]) {
    const ids = inventory.filter(x => x.objeto === type).map(x => x.id);
    const result = await c.query('SELECT FIELDS(ALL) FROM ' + type + " WHERE Id IN ('" + ids.join("','") + "') LIMIT 200");
    if (result.records.length !== ids.length) throw Error('Inventario incompleto: ' + type);
    rows.push(...result.records.map(row => ({ objeto: type, id: row.Id, row })));
  }
  const security = await c.metadata.read('SecuritySettings', 'Security');
  if (security.enableAdminLoginAsAnyUser !== false) throw Error('Login As no está cerrado.');
  const users = json('.sf/p06-fase-2/usuarios.json').users;
  const assignments = (await c.query("SELECT AssigneeId, PermissionSetId FROM PermissionSetAssignment WHERE AssigneeId IN ('" + users.map(x => x.id).join("','") + "') ORDER BY AssigneeId, PermissionSetId")).records;
  const files = git(['ls-tree', '-r', '--name-only', '-z', baseline, 'docs/evidencias-fase-1b.json', 'docs/evidencias-fase-1b', 'docs/evidencias-fase-2.json', 'docs/evidencias-fase-2', 'docs/evidencias-fase-3.json', 'docs/evidencias-fase-3']).toString().split('\0').filter(Boolean);
  const evidenceFiles = files.map(file => ({ file, bytesHash: hash(fs.readFileSync(path.join(root, file))), normalizedHash: hash(normalized(fs.readFileSync(path.join(root, file)))), matchesPublished: normalized(fs.readFileSync(path.join(root, file))) === normalized(git(['show', baseline + ':' + file])) }));
  if (evidenceFiles.some(x => !x.matchesPublished)) throw Error('Evidencia previa modificada.');
  fs.copyFileSync(path.join(root, '.forceignore'), path.join(privateDir, 'forceignore-antes.txt'));
  fs.writeFileSync(path.join(privateDir, 'inspeccion-antes.json'), JSON.stringify({ timestamp: new Date().toISOString(), rows, assignments, evidenceFiles, loginAs: false }, null, 2) + '\n');
  const evidence = { timestamp: new Date().toISOString(), baseline, target: process.argv[2], apiVersion: '65.0', normalization: 'N1: decodificación UTF-8 estricta, sustituir exclusivamente CRLF por LF. N2: aplicar N1 y quitar exactamente un LF final si existe. No quitar BOM, espacios ni normalizar Unicode. N1 explica Git/local; N2 permite contrastar Body remoto sin LF final.', remoteSource: 'Tooling API ApexClass.Body, guardado como UTF-8 en carpeta privada separada; no sobrescribe fuentes de trabajo.', sources, historicalRecords: 50, phase3Records: 247, snapshotRecords: rows.length, evidenceFiles: evidenceFiles.length, loginAs: false };
  fs.writeFileSync(path.join(outputDir, 'trazabilidad-inicial.json'), JSON.stringify(evidence, null, 2) + '\n');
  console.log(JSON.stringify({ sourceEquivalence: sources.map(x => ({ file: x.file, equivalent: x.equivalentNormalized, localCrlfLines: x.localBefore.crlfLines, remoteMatchesLocalBytes: x.remoteBefore.sha256 === x.localBefore.sha256 })), snapshotRecords: rows.length, previousEvidenceFiles: evidenceFiles.length, loginAs: false }));
})().catch(reportError);

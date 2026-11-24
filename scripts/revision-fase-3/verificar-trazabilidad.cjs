'use strict';
const fs = require('node:fs');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const git = (args, input) => cp.execFileSync('git', ['-c', 'safe.directory=' + root.replaceAll('\\', '/'), ...args], { cwd: root, input, env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' } });
const evidence = JSON.parse(fs.readFileSync(path.join(root, 'docs/evidencias-revision-fase-3/trazabilidad-inicial.json'), 'utf8'));
function reconstruct(blob, format) {
  let text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(blob).replace(/\r\n/g, '\n');
  if (format.bom) throw Error('Este contraste no necesita reconstruir BOM.');
  if (!format.finalLf && text.endsWith('\n')) text = text.slice(0, -1);
  else if (format.finalLf && !text.endsWith('\n')) text += '\n';
  return Buffer.from(text.split('\n').map((line, i) => line + (format.crlfLines.includes(i + 1) ? '\r' : '')).join('\n'), 'utf8');
}
const results = evidence.sources.map(source => {
  const blob = git(['show', evidence.baseline + ':' + source.file]);
  const original = reconstruct(blob, source.localBefore);
  const remote = reconstruct(blob, source.remoteBefore);
  const objectId = git(['rev-parse', evidence.baseline + ':' + source.file]).toString().trim();
  const filteredObjectId = git(['hash-object', '--path=' + source.file, '--stdin'], original).toString().trim();
  return { file: source.file, gitBlobSha256: hash(blob), originalBytesReconstructedSha256: hash(original), remoteBodyReconstructedSha256: hash(remote), originalReceiptsMatch: hash(original) === source.publishedHash && hash(original) === source.privateReceiptHash, remoteFormatMatchesObservation: hash(remote) === source.remoteBefore.sha256, normalizedContentMatches: source.gitBlob.contentSha256 === source.remoteBefore.contentSha256 && source.gitBlob.contentSha256 === source.localBefore.contentSha256, objectId, filteredObjectId, gitCleanReproducesPublishedBlob: objectId === filteredObjectId };
});
const result = { timestamp: new Date().toISOString(), baseline: evidence.baseline, coreAutocrlf: git(['config', '--get', 'core.autocrlf']).toString().trim(), attributes: git(['check-attr', 'text', 'eol', '--', ...results.map(x => x.file)]).toString().trim().split('\n'), method: 'Reconstrucción reproducible del formato observado a partir del blob Git inmutable; hash-object sin -w aplica filtros sin escribir objetos ni índice. No consulta el estado remoto actual ni sustituye el recibo de la lectura inicial.', results, pass: results.every(x => x.originalReceiptsMatch && x.remoteFormatMatchesObservation && x.normalizedContentMatches && x.gitCleanReproducesPublishedBlob) };
fs.writeFileSync(path.join(root, 'docs/evidencias-revision-fase-3/trazabilidad-reproducida.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ sources: results.length, originalHashesReproduced: results.every(x => x.originalReceiptsMatch), remoteFormattingReproduced: results.every(x => x.remoteFormatMatchesObservation), gitCleanReproducesPublishedBlobs: result.pass }));
if (!result.pass) process.exitCode = 1;

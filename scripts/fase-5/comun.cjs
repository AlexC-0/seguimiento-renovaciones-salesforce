'use strict';
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const { connectP06, reportError, root, cliModules } = require('../fase-2/salesforce.cjs');
require(path.join(cliModules, '@jsforce/jsforce-node/lib/api/metadata'));
const dir = path.join(root, '.sf/p06-fase-5');
const out = path.join(root, 'docs/evidencias-fase-5');
const baseline = '69622d3013fbc77fc69877dcadddfde3dbae6be2';
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const readJSON = p => { const b = fs.readFileSync(p); return JSON.parse(b.toString(b[0] === 255 && b[1] === 254 ? 'utf16le' : 'utf8').replace(/^\uFEFF/, '')); };
const read = name => readJSON(path.join(dir, name));
function save(name, value) { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, name), JSON.stringify(value, null, 2) + '\n'); }
function publish(name, value) { fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, name), JSON.stringify(value, null, 2) + '\n'); }
function ids(values) { if (!values.length || values.some(x => !/^[a-zA-Z0-9]{18}$/.test(x))) throw Error('Se requieren Id explícitos válidos.'); return "('" + values.join("','") + "')"; }
async function queryAll(c, soql) {
  let response = await c.query(soql); const total = response.totalSize; const rows = [...response.records]; let pages = 1;
  while (!response.done) { if (!response.nextRecordsUrl) throw Error('Consulta incompleta sin cursor.'); response = await c.queryMore(response.nextRecordsUrl); rows.push(...response.records); pages++; }
  if (rows.length !== total) throw Error('Resultado truncado o conteo inconsistente.');
  return { rows, total, pages, done: true };
}
async function records(c, object, values) {
  const rows = [], checks = [];
  for (let i = 0; i < values.length; i += 150) {
    const chunk = values.slice(i, i + 150); const r = await queryAll(c, 'SELECT FIELDS(ALL) FROM ' + object + ' WHERE Id IN ' + ids(chunk) + ' LIMIT 200');
    if (r.rows.length !== chunk.length || r.rows.some(x => !chunk.includes(x.Id)) || new Set(r.rows.map(x => x.Id)).size !== chunk.length) throw Error('Inventario incompleto: ' + object);
    rows.push(...r.rows); checks.push({ object, requested: chunk.length, retrieved: r.rows.length, pages: r.pages, done: r.done });
  }
  return { rows, checks };
}
async function bounded(c, object, where) {
  const count = (await c.query('SELECT COUNT() FROM ' + object + ' WHERE ' + where)).totalSize;
  if (count > 200) throw Error('Consulta acotada supera el límite previsto; no aceptar truncamiento.');
  const result = await queryAll(c, 'SELECT FIELDS(ALL) FROM ' + object + ' WHERE ' + where + ' LIMIT 200');
  if (count !== result.total) throw Error('El conjunto cambió durante la lectura; repetir la inspección sin relanzar.');
  return result.rows;
}
async function connect(target) {
  const c = await connectP06(target); const identity = await c.identity();
  const technical = readJSON(path.join(root, '.sf/p06-fase-3/operador.json')).technicalUserId;
  if (identity.user_id !== technical) throw Error('La sesión no corresponde al operador técnico inventariado.');
  return c;
}
function cli(args, name) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(path.join(dir, name + '.json'))) return reject(Error('Recibo existente; inspeccionar sin repetir: ' + name));
    const stdout = fs.openSync(path.join(dir, name + '.json'), 'w'); const stderr = fs.openSync(path.join(dir, name + '-stderr.txt'), 'w');
    const child = cp.spawn(process.execPath, [path.join(cliModules, '..', 'bin/run.js'), ...args], { cwd: root, windowsHide: true, stdio: ['ignore', stdout, stderr] });
    child.once('error', reject); child.once('close', code => { fs.closeSync(stdout); fs.closeSync(stderr); if (code !== 0) reject(Error('La CLI no confirmó ' + name + '; conservar su recibo privado.')); else resolve(read(name + '.json')); });
  });
}
const ignore = ['attributes', 'LastViewedDate', 'LastReferencedDate', 'DiasRestantes__c'];
function changed(before, after) {
  return before.flatMap(old => { const now = after.find(x => x.Id === old.Id); const fields = now ? [...new Set([...Object.keys(old), ...Object.keys(now)])].filter(k => !ignore.includes(k) && JSON.stringify(old[k]) !== JSON.stringify(now[k])) : ['registro ausente']; return fields.length ? [{ id: old.Id, fields }] : []; });
}
function inventory(state) { publish('inventario.json', { timestamp: new Date().toISOString(), records: Object.entries(state.groups).flatMap(([scenario, group]) => group.records.map(x => ({ ...x, scenario }))) }); }
async function deploy(args, name) {
  let response;
  if (fs.existsSync(path.join(dir, name + '.json'))) response = read(name + '.json');
  else { try { response = await cli(args, name); } catch (error) { if (!fs.existsSync(path.join(dir, name + '.json'))) throw error; response = read(name + '.json'); } }
  if (response.name === 'ClientTimeoutError' && response.data?.id) {
    const c = await connect('p06-renovaciones-dev');
    for (let i = 0; i < 180; i++) {
      const status = await c.metadata.checkDeployStatus(response.data.id, true);
      save(name + '-final.json', { status: status.success ? 0 : 1, result: status });
      if (status.done) { response = { status: status.success ? 0 : 1, result: status }; break; }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  if (!response.result?.done || response.result.status !== 'Succeeded') throw Error('Despliegue o validación no confirmados: ' + name);
  return response;
}
function completed(jobs, executions, count) {
  return jobs.length === count && executions.length === count &&
    jobs.every(j => ['Completed','Failed','Aborted'].includes(j.Status)) &&
    executions.every(e => jobs.some(j => j.Id === e.AsyncApexJobId__c) &&
      ['Completada','Completada con incidencias','Fallida','Abortada'].includes(e.Estado__c) && e.Finalizacion__c != null);
}
module.exports = { deploy, completed, fs, path, cp, root, dir, out, baseline, hash, readJSON, read, save, publish, ids, queryAll, records, bounded, connect, cli, changed, ignore, inventory, reportError };

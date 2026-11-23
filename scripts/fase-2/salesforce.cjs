'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const privateDir = path.join(root, '.sf/p06-fase-2');
const cliModules = process.env.P06_SF_MODULES || path.join(process.env.APPDATA, 'npm/node_modules/@salesforce/cli/node_modules');
const { Org } = require(path.join(cliModules, '@salesforce/core'));
async function connectP06(target) {
  if (target !== 'p06-renovaciones-dev') throw new Error('Se requiere el destino P06 explícito.');
  const saved = JSON.parse(fs.readFileSync(path.join(root, '.sf/p06-fase-1b/destino-verificado.json'), 'utf8').replace(/^\uFEFF/, ''));
  const org = await Org.create({ aliasOrUsername: target });
  const connection = org.getConnection('65.0');
  const identity = await connection.query('SELECT Id, OrganizationType, IsSandbox FROM Organization LIMIT 1');
  if (identity.records.length !== 1 || identity.records[0].Id !== saved.OrganizationId ||
      identity.records[0].OrganizationType !== 'Developer Edition' || identity.records[0].IsSandbox) {
    throw new Error('El destino no coincide con la Developer Edition registrada.');
  }
  return connection;
}
function writePrivate(name, value) {
  if (!/^[a-z0-9-]+\.json$/.test(name)) throw new Error('Nombre privado inválido.');
  fs.mkdirSync(privateDir, { recursive: true });
  fs.writeFileSync(path.join(privateDir, name), JSON.stringify(value, null, 2) + '\n');
}
function readPrivate(name) {
  return JSON.parse(fs.readFileSync(path.join(privateDir, name), 'utf8').replace(/^\uFEFF/, ''));
}
function reportError(error) {
  // No volcar objetos de conexión, solicitudes, cabeceras o errores de autenticación.
  console.error(JSON.stringify({ error: error.errorCode || error.name || 'Error', message: String(error.message || 'Operación no completada').replace(/https?:\/\/\S+/g, '[URL]').replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+/g, '[identidad]').slice(0, 600) }));
  process.exitCode = 1;
}
module.exports = { connectP06, writePrivate, readPrivate, root, privateDir, cliModules, reportError };

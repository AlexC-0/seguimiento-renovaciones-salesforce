'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { connectP06, reportError, root, cliModules } = require('../fase-2/salesforce.cjs');
const privateDir = path.join(root, '.sf/p06-fase-3');
function readState(name) {
  if (!/^[a-z0-9-]+\.json$/.test(name)) throw Error('Nombre de estado inválido.');
  const data = fs.readFileSync(path.join(privateDir, name));
  return JSON.parse(data.toString(data[0] === 255 && data[1] === 254 ? 'utf16le' : 'utf8').replace(/^\uFEFF/, ''));
}
function writeState(name, value) {
  if (!/^[a-z0-9-]+\.json$/.test(name)) throw Error('Nombre de estado inválido.');
  fs.mkdirSync(privateDir, { recursive: true });
  fs.writeFileSync(path.join(privateDir, name), JSON.stringify(value, null, 2) + '\n');
}
module.exports = { connectP06, reportError, root, cliModules, privateDir, readState, writeState };

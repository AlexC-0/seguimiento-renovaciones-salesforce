'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { connectP06, reportError, root, readState, writeState } = require('./salesforce.cjs');
(async () => {
  const c = await connectP06(process.argv[2]);
  const state = readState('demostracion.json');
  if (!state.runs.primero?.verified || state.runs.repeticion || state.editedSamples) throw Error('Estado no válido para preparar la repetición.');
  const previous = readState('resultado-primero.json').follows;
  const rows = [...previous].sort((a, b) => a.Id.localeCompare(b.Id)).slice(0, 2);
  const edits = rows.map((r, i) => ({ attributes: { type: 'SeguimientoRenovacion__c' }, Id: r.Id, Estado__c: i === 0 ? 'Cerrado' : 'En curso', Notas__c: i === 0 ? 'P06 F3: cierre ficticio que debe conservar la repetición.' : 'P06 F3: nota comercial que debe conservar la repetición.' }));
  writeState('edicion-prevista.json', edits);
  const result = await c.request({ method: 'PATCH', url: '/services/data/v65.0/composite/sobjects', headers: { 'Content-Type': 'application/json', 'Sforce-Email': 'triggerUserEmail=false, triggerOtherEmail=false, triggerAutoResponseEmail=false' }, body: JSON.stringify({ allOrNone: true, records: edits }) });
  if (result.some(x => !x.success)) throw Error('Edición de muestras no confirmada.');
  state.editedSamples = edits.map(({ Id, Estado__c, Notas__c }) => ({ id: Id, state: Estado__c, notes: Notas__c }));
  writeState('demostracion.json', state);
  fs.writeFileSync(path.join(root, 'docs/evidencias-fase-3/muestras-repeticion.json'), JSON.stringify({ timestamp: new Date().toISOString(), purpose: 'Preparación técnica de dos registros nuevos para comprobar conservación; no acredita una operación de usuario comercial.', records: state.editedSamples }, null, 2) + '\n');
  console.log(JSON.stringify({ newFollowsPrepared: 2, closed: 1, inProgress: 1, historicalRecordsChanged: 0 }));
})().catch(reportError);

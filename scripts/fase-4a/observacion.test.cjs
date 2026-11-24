'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { completed } = require('./comun.cjs');
const job = { Id: 'trabajo-controlado', Status: 'Completed' };
const closed = { AsyncApexJobId__c: job.Id, Estado__c: 'Completada', Finalizacion__c: 'fecha-controlada' };
test('un job Completed no basta si la ejecución aún está En curso', () => {
  assert.equal(completed([job], [{ ...closed, Estado__c: 'En curso', Finalizacion__c: null }], 1), false);
});
test('se requieren ambos trabajos y sus cierres vinculados', () => {
  assert.equal(completed([job], [closed], 1), true);
  assert.equal(completed([job], [closed], 2), false);
  assert.equal(completed([job], [{ ...closed, AsyncApexJobId__c: 'otro' }], 1), false);
});
test('un trabajo activo no termina la observación', () => {
  assert.equal(completed([{ ...job, Status: 'Processing' }], [closed], 1), false);
});

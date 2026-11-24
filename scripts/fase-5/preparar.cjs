'use strict';
const h = require('./comun.cjs');
async function prepare(c, label, count) {
  const state = h.read('estado.json'); if (state.groups[label]) throw Error('El conjunto ya existe; no repetir preparación.');
  const before = h.read('antes.json');
  const cut = new Intl.DateTimeFormat('en-CA', { timeZone: before.timezone }).format(new Date());
  const date = offset => new Date(new Date(cut + 'T12:00:00Z').getTime() + offset * 86400000).toISOString().slice(0, 10);
  const group = { label, cut, end: date(30), timezone: before.timezone, count, records: [], runs: {}, preparedAt: new Date().toISOString() };
  state.groups[label] = group; h.save('estado.json', state);
  const headers = { 'Content-Type': 'application/json', 'Sforce-Email': 'triggerUserEmail=false, triggerOtherEmail=false, triggerAutoResponseEmail=false' };
  const account = await c.request({ method: 'POST', url: '/services/data/v65.0/sobjects/Account', headers, body: JSON.stringify({ Name: 'P06 F5 ' + label + ' ' + group.preparedAt }) });
  if (!account.success) throw Error('Cuenta no confirmada.');
  group.account = account.id; group.records.push({ objeto: 'Account', id: account.id }); h.save('estado.json', state); h.inventory(state);
  const data = Array.from({ length: count }, (_, i) => ({ attributes: { type: 'ContratoComercial__c' }, Cuenta__c: account.id, OwnerId: before.commercial, FechaInicio__c: date(-365), FechaVencimiento__c: date(10 + i % 10), Estado__c: 'Activo' }));
  h.save(label + '-contratos-previstos.json', data);
  const result = await c.request({ method: 'POST', url: '/services/data/v65.0/composite/sobjects', headers, body: JSON.stringify({ allOrNone: true, records: data }) });
  if (result.length !== count || result.some(x => !x.success)) throw Error('Conjunto no confirmado; no recrear automáticamente.');
  group.contracts = result.map((x, i) => ({ id: x.id, expiry: data[i].FechaVencimiento__c }));
  group.records.push(...group.contracts.map(x => ({ objeto: 'ContratoComercial__c', id: x.id }))); h.save('estado.json', state); h.inventory(state);
  const contracts = await h.records(c, 'ContratoComercial__c', group.contracts.map(x => x.id));
  const follows = await h.bounded(c, 'SeguimientoRenovacion__c', 'Contrato__c IN ' + h.ids(group.contracts.map(x => x.id)));
  if (follows.length) throw Error('El conjunto inicial ya contiene seguimientos.');
  h.save(label + '-contratos-iniciales.json', contracts.rows);
  h.publish(label + '-conjunto.json', { label, timestamp: group.preparedAt, cut, end: group.end, timezone: group.timezone, eligible: count, account: account.id, contracts: group.contracts, initialFollows: 0, queryChecks: contracts.checks });
  console.log(JSON.stringify({ label, eligible: count, newAccount: 1, initialFollows: 0 })); return group;
}
module.exports = {prepare};

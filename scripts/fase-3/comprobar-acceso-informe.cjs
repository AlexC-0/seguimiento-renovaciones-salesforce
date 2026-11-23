'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { connectP06, reportError, root, readState, writeState } = require('./salesforce.cjs');
(async () => {
  const c = await connectP06(process.argv[2]);
  const state = readState('demostracion.json');
  if (!state.runs.repeticion?.verified) throw Error('Falta la repetición comprobada.');
  const identity = await c.identity();
  if (identity.user_id !== readState('operador.json').technicalUserId) throw Error('Contexto distinto del operador inventariado.');
  const reportId = (await c.query("SELECT Id FROM Report WHERE DeveloperName='PendientesRenovaciones'")).records[0]?.Id;
  if (!reportId) throw Error('No existe el informe operativo.');
  const report = await c.request('/services/data/v65.0/analytics/reports/' + reportId + '?includeDetails=true');
  const independent = await c.query("SELECT Id, Estado__c, Aplicable__c, FechaVencimientoCapturada__c, DiasRestantes__c, Contrato__c FROM SeguimientoRenovacion__c WHERE Estado__c IN ('Pendiente','En curso') AND Aplicable__c=true ORDER BY FechaVencimientoCapturada__c");
  const reportIds = Object.entries(report.factMap).filter(([k, v]) => k !== 'T!T' && v.rows).flatMap(([,v]) => v.rows.map(row => row.dataCells[0].value)).sort();
  const queryIds = independent.records.map(r => r.Id).sort();
  const follows = readState('resultado-repeticion.json').follows;
  const newIds = new Set(follows.map(r => r.Id));
  const visibleNew = independent.records.filter(r => newIds.has(r.Id));
  const users = JSON.parse(fs.readFileSync(path.join(root, '.sf/p06-fase-2/usuarios.json'), 'utf8')).users;
  const targetIds = [...follows.map(r => r.Id), ...state.contracts.filter(r => r.eligible).map(r => r.id)];
  const access = [];
  const privateAccess = [];
  for (const user of users) {
    const rows = [];
    for (let i = 0; i < targetIds.length; i += 150) {
      rows.push(...(await c.query("SELECT RecordId, HasReadAccess, HasEditAccess, HasDeleteAccess FROM UserRecordAccess WHERE UserId='" + user.id + "' AND RecordId IN ('" + targetIds.slice(i, i + 150).join("','") + "')")).records);
    }
    privateAccess.push({ actor: user.actor, rows });
    const followAccess = rows.filter(r => newIds.has(r.RecordId));
    const contractAccess = rows.filter(r => !newIds.has(r.RecordId));
    const summary = { actor: user.actor, role: user.currentRole, follows: followAccess.length, followsReadable: followAccess.filter(r => r.HasReadAccess).length, followsEditable: followAccess.filter(r => r.HasEditAccess).length, contracts: contractAccess.length, contractsReadable: contractAccess.filter(r => r.HasReadAccess).length, contractsEditable: contractAccess.filter(r => r.HasEditAccess).length, deleteAllowed: rows.filter(r => r.HasDeleteAccess).length, method: 'UserRecordAccess consultado por cuenta técnica; no es una nueva sesión del comercial o coordinador.' };
    summary.pass = followAccess.length === 120 && summary.followsReadable === 120 && summary.followsEditable === 120 && contractAccess.length === 120 && summary.contractsReadable === 120 && summary.contractsEditable === (user.actor === 'A' ? 120 : 0) && summary.deleteAllowed === 0;
    access.push(summary);
  }
  writeState('informe-acceso.json', { report, independent, privateAccess });
  const evidence = { timestamp: new Date().toISOString(), reportContext: 'Cuenta técnica existente con P06_OperadorRenovaciones y su perfil administrativo previo', comparisonContext: 'Misma conexión autenticada para Analytics REST y SOQL', reportTotal: report.factMap['T!T'].aggregates[0].value, queryTotal: independent.totalSize, sameIds: JSON.stringify(reportIds) === JSON.stringify(queryIds), completeReport: report.allData, newFollowsInReport: visibleNew.length, newClosedExcluded: !reportIds.includes(state.editedSamples.find(x => x.state === 'Cerrado').id), newInProgressIncluded: reportIds.includes(state.editedSamples.find(x => x.state === 'En curso').id), access, loginAsReenabled: false };
  evidence.pass = evidence.sameIds && evidence.completeReport && evidence.reportTotal === evidence.queryTotal && visibleNew.length === 119 && evidence.newClosedExcluded && evidence.newInProgressIncluded && access.every(a => a.pass);
  fs.writeFileSync(path.join(root, 'docs/evidencias-fase-3/acceso-informe.json'), JSON.stringify(evidence, null, 2) + '\n');
  console.log(JSON.stringify(evidence));
  if (!evidence.pass) throw Error('Contraste de acceso o informe no conforme.');
})().catch(reportError);

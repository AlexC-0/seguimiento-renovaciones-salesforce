'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { connectP06, reportError, root, writeState } = require('./salesforce.cjs');
(async () => {
  const c = await connectP06(process.argv[2]);
  const identity = await c.identity();
  const original = JSON.parse(fs.readFileSync(path.join(root, '.sf/p06-fase-2/configuracion.json'), 'utf8'));
  if (identity.user_id !== original.technicalUserId) throw Error('La cuenta no coincide con la técnica inventariada.');
  const set = (await c.query("SELECT Id, Name FROM PermissionSet WHERE Name='P06_OperadorRenovaciones'")).records[0];
  const group = (await c.query("SELECT Id FROM Group WHERE Type='Regular' AND DeveloperName='P06_Operadores'")).records[0];
  if (!set || !group) throw Error('Paquete de operador no desplegado.');
  const detail = await c.sobject('PermissionSet').retrieve(set.Id);
  if (['AuthorApex', 'ModifyAllData', 'ViewAllData', 'ManageUsers', 'CustomizeApplication', 'ViewSetup'].some(p => detail['Permissions' + p])) throw Error('El permiso de operador concede privilegios no admitidos.');
  const assignments = (await c.query("SELECT Id, AssigneeId FROM PermissionSetAssignment WHERE PermissionSetId='" + set.Id + "'")).records;
  if (assignments.some(a => a.AssigneeId !== identity.user_id)) throw Error('Asignación de operador ajena al destino autorizado.');
  let assignment = assignments[0];
  if (!assignment) { assignment = await c.sobject('PermissionSetAssignment').create({ PermissionSetId: set.Id, AssigneeId: identity.user_id }); if (!assignment.success) throw Error('No se asignó operador.'); }
  const memberships = (await c.query("SELECT Id, UserOrGroupId FROM GroupMember WHERE GroupId='" + group.Id + "'")).records;
  if (memberships.some(m => m.UserOrGroupId !== identity.user_id)) throw Error('Grupo de operador con miembros inesperados.');
  if (!memberships.length) { const r = await c.sobject('GroupMember').create({ GroupId: group.Id, UserOrGroupId: identity.user_id }); if (!r.success) throw Error('No se asignó el grupo.'); }
  writeState('operador.json', { technicalUserId: identity.user_id, permissionSetId: set.Id, groupId: group.Id, timestamp: new Date().toISOString() });
  console.log(JSON.stringify({ operatorAssignedToExistingTechnicalAccountOnly: true, administrativePrivilegesAdded: false, commercialUsersChanged: false }));
})().catch(reportError);

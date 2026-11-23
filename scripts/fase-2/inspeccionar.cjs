'use strict';
const { connectP06, writePrivate, reportError } = require('./salesforce.cjs');
(async () => {
  const connection = await connectP06(process.argv[2]);
  const queries = {
    profiles: "SELECT Id, Name, UserLicense.Name, PermissionsModifyAllData, PermissionsViewAllData, PermissionsAuthorApex, PermissionsManageUsers, PermissionsCustomizeApplication, PermissionsApiEnabled, PermissionsRunReports, PermissionsViewSetup FROM Profile WHERE UserLicense.Name IN ('Salesforce', 'Salesforce Platform')",
    users: "SELECT Id, Alias, Username, FirstName, LastName, IsActive, ProfileId, UserRoleId, UserType FROM User WHERE IsActive = true",
    licenses: "SELECT Name, TotalLicenses, UsedLicenses FROM UserLicense WHERE Name IN ('Salesforce', 'Salesforce Platform')",
    sets: "SELECT Id, Name, IsOwnedByProfile, ProfileId FROM PermissionSet WHERE Name LIKE 'P06_%'"
  };
  const entries = await Promise.all(Object.entries(queries).map(async ([key, query]) => [key, (await connection.query(query)).records]));
  const data = Object.fromEntries(entries);
  writePrivate('inspeccion.json', data);
  console.log(JSON.stringify({
    profiles: data.profiles.map(p => ({ name: p.Name, license: p.UserLicense.Name, admin: p.PermissionsModifyAllData, viewAll: p.PermissionsViewAllData, apex: p.PermissionsAuthorApex, manageUsers: p.PermissionsManageUsers, customize: p.PermissionsCustomizeApplication, api: p.PermissionsApiEnabled, reports: p.PermissionsRunReports, viewSetup: p.PermissionsViewSetup })),
    licenses: data.licenses.map(l => ({ name: l.Name, total: l.TotalLicenses, used: l.UsedLicenses })),
    activeUsers: data.users.length,
    identifiedPhase2TestUsers: data.users.filter(u => /^p06f2/i.test(u.Alias) || /^P06 F2 /.test(u.LastName)).length,
    p06PermissionSets: data.sets.map(p => p.Name)
  }, null, 2));
})().catch(reportError);

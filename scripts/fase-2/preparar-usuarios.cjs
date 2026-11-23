'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {connectP06,writePrivate,readPrivate,privateDir,reportError}=require('./salesforce.cjs');
(async()=>{
 const c=await connectP06(process.argv[2]);
 const profile=(await c.query("SELECT Id,Name,UserLicense.Name FROM Profile WHERE Name='P06_BaseComercial'")).records[0];
 if(!profile||profile.UserLicense.Name!=='Salesforce')throw Error('Perfil mínimo P06 no disponible.');
 const profileSet=(await c.query("SELECT Id FROM PermissionSet WHERE IsOwnedByProfile=true AND ProfileId='"+profile.Id+"'")).records[0];
 const detail=await c.sobject('PermissionSet').retrieve(profileSet.Id);
 const forbidden=['ModifyAllData','ViewAllData','AuthorApex','ManageUsers','CustomizeApplication','ViewSetup','TransferAnyEntity','TransferAnyLead','TransferAnyCase','ViewAllFieldsGlobal','EmailAdministration','EmailTemplateManagement'];
 if(forbidden.some(p=>detail['Permissions'+p]))throw Error('El perfil aún contiene permisos no admitidos.');
 const objectPermissions=(await c.query("SELECT SobjectType,PermissionsRead,PermissionsCreate,PermissionsEdit,PermissionsDelete,PermissionsViewAllRecords,PermissionsModifyAllRecords FROM ObjectPermissions WHERE ParentId='"+profileSet.Id+"'")).records;
 if(objectPermissions.some(p=>p.PermissionsCreate||p.PermissionsEdit||p.PermissionsDelete||p.PermissionsViewAllRecords||p.PermissionsModifyAllRecords))throw Error('El perfil no es mínimo.');
 const roles=(await c.query("SELECT Id,DeveloperName FROM UserRole WHERE DeveloperName IN ('P06_Comercial','P06_Coordinacion')")).records;
 const groups=(await c.query("SELECT Id,DeveloperName,Type FROM Group WHERE Type='Regular' AND DeveloperName IN ('P06_Propietarios','P06_Comerciales','P06_Coordinacion')")).records;
 const sets=(await c.query("SELECT Id,Name FROM PermissionSet WHERE Name IN ('P06_Comercial','P06_Coordinacion','P06_VerificacionModelo')")).records;
 const identity=await c.identity();
 const config={profile,profileSet,enabledProfilePermissions:Object.entries(detail).filter(([k,v])=>k.startsWith('Permissions')&&v===true).map(([k])=>k),objectPermissions,roles,groups,sets,technicalUserId:identity.user_id};
 writePrivate('configuracion.json',config);
 const userFile=path.join(privateDir,'usuarios.json');
 const state=fs.existsSync(userFile)?readPrivate('usuarios.json'):{users:[]};
 const existing=(await c.query("SELECT Id,Alias,Username FROM User WHERE Alias IN ('p06f2a','p06f2b')")).records;
 if(existing.some(u=>!state.users.some(s=>s.id===u.Id)))throw Error('Colisión con usuarios no inventariados; detener.');
 const license=(await c.query("SELECT TotalLicenses,UsedLicenses FROM UserLicense WHERE Name='Salesforce'")).records[0];
 if(license.TotalLicenses-license.UsedLicenses<2-state.users.filter(u=>u.id).length)throw Error('Licencias gratuitas insuficientes.');
 const role=roles.find(r=>r.DeveloperName==='P06_Comercial');
 const commercial=sets.find(s=>s.Name==='P06_Comercial');
 if(!role||!commercial||groups.length!==3)throw Error('Configuración incompleta.');
 for(const actor of ['A','B']){
   let user=state.users.find(u=>u.actor===actor);
   if(!user){user={actor,username:'p06.f2.'+actor.toLowerCase()+'.'+crypto.randomUUID().replaceAll('-','')+'@example.invalid',alias:'p06f2'+actor.toLowerCase()};state.users.push(user);writePrivate('usuarios.json',state);}
   if(!user.id){
     const payload={Username:user.username,Email:'p06-f2-'+actor.toLowerCase()+'@example.invalid',FirstName:'Prueba',LastName:'P06 F2 Comercial '+actor,Alias:user.alias,TimeZoneSidKey:'Europe/Madrid',LocaleSidKey:'es_ES',EmailEncodingKey:'UTF-8',LanguageLocaleKey:'es',ProfileId:profile.Id,UserRoleId:role.Id,IsActive:true,UserPreferencesLightningExperiencePreferred:true,UserPreferencesDisableAllFeedsEmail:true};
     const result=await c.request({method:'POST',url:'/services/data/v65.0/sobjects/User',headers:{'Content-Type':'application/json','Sforce-Email':'triggerUserEmail=false, triggerOtherEmail=false, triggerAutoResponseEmail=false'},body:JSON.stringify(payload)});
     if(!result.success)throw Error('Creación de usuario no confirmada.');
     user.id=result.id;user.initialRole='comercial';user.currentRole='comercial';writePrivate('usuarios.json',state);
   }
   const assignments=(await c.query("SELECT Id,PermissionSetId FROM PermissionSetAssignment WHERE PermissionSet.IsOwnedByProfile=false AND AssigneeId='"+user.id+"'")).records;
   if(assignments.some(a=>a.PermissionSetId!==commercial.Id))throw Error('Asignaciones inesperadas en la cuenta ficticia.');
   if(!assignments.length){const a=await c.sobject('PermissionSetAssignment').create({AssigneeId:user.id,PermissionSetId:commercial.Id});if(!a.success)throw Error('Asignación comercial fallida');user.assignmentId=a.id;writePrivate('usuarios.json',state);}
   for(const name of ['P06_Propietarios','P06_Comerciales']){
     const group=groups.find(g=>g.DeveloperName===name);
     const prior=(await c.query("SELECT Id FROM GroupMember WHERE GroupId='"+group.Id+"' AND UserOrGroupId='"+user.id+"'")).records;
     if(!prior.length){const m=await c.sobject('GroupMember').create({GroupId:group.Id,UserOrGroupId:user.id});if(!m.success)throw Error('Alta en grupo fallida');}
   }
 }
 const owners=groups.find(g=>g.DeveloperName==='P06_Propietarios');
 const membership=(await c.query("SELECT Id FROM GroupMember WHERE GroupId='"+owners.Id+"' AND UserOrGroupId='"+identity.user_id+"'")).records;
 if(!membership.length){const m=await c.sobject('GroupMember').create({GroupId:owners.Id,UserOrGroupId:identity.user_id});if(!m.success)throw Error('Grupo de propietarios incompleto');}
 console.log(JSON.stringify({testUsers:state.users.map(u=>({actor:u.actor,profile:profile.Name,role:u.currentRole,permissionSet:'P06_Comercial'})),welcomeEmails:false,passwordResets:false,reservedEmailDomain:'example.invalid',newAdministrativePermissions:false}));
})().catch(reportError);

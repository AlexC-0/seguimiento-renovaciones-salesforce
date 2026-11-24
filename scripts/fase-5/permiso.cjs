'use strict';
const h=require('./comun.cjs');
const name='P06_F5_ReasignacionTemporal';
async function exists(c){return (await h.queryAll(c,"SELECT Id FROM PermissionSet WHERE Name='"+name+"'")).rows;}
async function deploy(remove){
 const label=remove?'retirada':'alta',folder=h.path.join(h.out,'permiso-'+label),zip=h.path.join(h.dir,'permiso-'+label+'.zip');
 const entries=remove?['package.xml','destructiveChangesPost.xml']:['package.xml','permissionsets/'+name+'.permissionset'];
 h.fs.mkdirSync(h.path.join(folder,'permissionsets'),{recursive:true});
 const ns='http://soap.sforce.com/2006/04/metadata';const member='<types><members>'+name+'</members><name>PermissionSet</name></types>';
 h.fs.writeFileSync(h.path.join(folder,'package.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<Package xmlns="'+ns+'">'+(remove?'':member)+'<version>65.0</version></Package>\n');
 if(remove)h.fs.writeFileSync(h.path.join(folder,'destructiveChangesPost.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<Package xmlns="'+ns+'">'+member+'<version>65.0</version></Package>\n');
 else h.fs.writeFileSync(h.path.join(folder,entries[1]),'<?xml version="1.0" encoding="UTF-8"?>\n<PermissionSet xmlns="'+ns+'"><customPermissions><enabled>true</enabled><name>P06_Reasignar</name></customPermissions><description>Concesión temporal de fase 5; retirar después de transferir un contrato ficticio nuevo.</description><label>P06 F5 Reasignación temporal</label></PermissionSet>\n');
 if(!h.fs.existsSync(zip)){const q=x=>"'"+x.replace(/'/g,"''")+"'";h.cp.execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',"$ErrorActionPreference='Stop'; Add-Type -AssemblyName System.IO.Compression.FileSystem; Add-Type -AssemblyName System.IO.Compression; $archive=[IO.Compression.ZipFile]::Open("+q(zip)+",[IO.Compression.ZipArchiveMode]::Create); try{foreach($relative in @("+entries.map(q).join(',')+")){ $entry=$archive.CreateEntry($relative); $src=[IO.File]::OpenRead([IO.Path]::Combine("+q(folder)+",$relative));$dst=$entry.Open();try{$src.CopyTo($dst)}finally{$src.Dispose();$dst.Dispose()} }}finally{$archive.Dispose()}"],{cwd:h.root,windowsHide:true,stdio:'pipe'});}
 const hash=h.hash(h.fs.readFileSync(zip));const args=['project','deploy','start','--target-org','p06-renovaciones-dev','--api-version','65.0','--metadata-dir',zip,'--single-package','--test-level','NoTestRun','--wait','1','--json'];
 await h.connect('p06-renovaciones-dev');const validation=await h.deploy([...args,'--dry-run'],'permiso-'+label+'-validacion');
 if(h.hash(h.fs.readFileSync(zip))!==hash)throw Error('El paquete cambió después de validar.');await h.connect('p06-renovaciones-dev');const deployment=await h.deploy(args,'permiso-'+label+'-despliegue');
 const receipt=x=>({id:x.id,status:x.status,done:x.done,success:x.success,checkOnly:x.checkOnly,components:x.numberComponentsDeployed,tests:x.numberTestsCompleted});
 h.publish('permiso-'+label+'-recibos.json',{timestamp:new Date().toISOString(),name,packageSha256:hash,validation:receipt(validation.result),deployment:receipt(deployment.result),scope:'Solo permiso personalizado P06_Reasignar; sin CRUD ni permisos de sistema adicionales'});
 console.log(JSON.stringify({permission:label,validation:validation.result.id,deployment:deployment.result.id}));
}
async function grant(){
 const c=await h.connect('p06-renovaciones-dev');if(h.fs.existsSync(h.path.join(h.dir,'permiso.json')))throw Error('Permiso temporal ya registrado.');if((await exists(c)).length)throw Error('Nombre de permiso ya existente.');
 const state={name,initial:'ausente',technical:h.read('antes.json').technical,restored:false};h.save('permiso.json',state);await deploy(false);
 const rows=await exists(c);if(rows.length!==1)throw Error('Permiso no identificado.');state.permissionSet=rows[0].Id;h.save('permiso.json',state);
 const metadata=await c.metadata.read('PermissionSet',name);const custom=Array.isArray(metadata.customPermissions)?metadata.customPermissions:[metadata.customPermissions];
 if(custom.length!==1||custom[0]?.name!=='P06_Reasignar'||custom[0]?.enabled!==true||metadata.userPermissions?.length||metadata.objectPermissions?.length)throw Error('Concesión más amplia de lo previsto.');
 const assigned=await c.sobject('PermissionSetAssignment').create({AssigneeId:state.technical,PermissionSetId:state.permissionSet});if(!assigned.success)throw Error('Asignación no confirmada.');state.assignment=assigned.id;h.save('permiso.json',state);
 const check=await c.tooling.executeAnonymous("System.assert(FeatureManagement.checkPermission('P06_Reasignar'),'Permiso no efectivo');");if(!check.compiled||!check.success)throw Error('Permiso temporal no efectivo.');
 h.publish('permiso-asignado.json',{timestamp:new Date().toISOString(),name,assignee:'Solo cuenta técnica existente',customPermission:'P06_Reasignar',effective:true,commercialAssignmentsChanged:false});
}
async function revoke(){
 if(!h.fs.existsSync(h.path.join(h.dir,'permiso.json')))return;const s=h.read('permiso.json'),c=await h.connect('p06-renovaciones-dev');
 if(s.assignment){const rows=(await h.queryAll(c,'SELECT Id,AssigneeId,PermissionSetId FROM PermissionSetAssignment WHERE Id IN '+h.ids([s.assignment]))).rows;if(rows.length){if(rows[0].AssigneeId!==s.technical||rows[0].PermissionSetId!==s.permissionSet)throw Error('Asignación ajena; no retirar.');const result=await c.sobject('PermissionSetAssignment').destroy(s.assignment);if(!result.success)throw Error('Asignación no retirada.');}}
 const current=await exists(c);if(current.length){if(s.permissionSet&&current[0].Id!==s.permissionSet)throw Error('Componente distinto.');const refs=await h.queryAll(c,'SELECT Id FROM PermissionSetAssignment WHERE PermissionSetId IN '+h.ids(current.map(x=>x.Id)));if(refs.rows.length)throw Error('Hay asignaciones adicionales; no borrar.');await deploy(true);}
 const remaining=await exists(c);const check=await c.tooling.executeAnonymous("System.assert(!FeatureManagement.checkPermission('P06_Reasignar'),'Permiso todavía efectivo');");if(remaining.length||!check.compiled||!check.success)throw Error('Restauración no confirmada.');
 s.restored=true;h.save('permiso.json',s);h.publish('permiso-restaurado.json',{timestamp:new Date().toISOString(),name,assignmentRemoved:true,componentRemoved:true,effective:false,initial:'ausente',final:'ausente'});console.log(JSON.stringify({temporaryPermissionRestored:true}));
}
module.exports={grant,revoke,name};
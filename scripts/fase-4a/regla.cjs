'use strict';
const h=require('./comun.cjs');
const ruleName='P06_F4A_RechazoAcotado';
async function object(c){return c.metadata.read('CustomObject','SeguimientoRenovacion__c');}
async function prepare(c,group){
 const original=await object(c);const rules=original.validationRules||[];
 if(rules.some(x=>x.fullName===ruleName))throw Error('El nombre de regla temporal ya existe.');
 const target=group.contracts[0].id;
 if(h.read('antes.json').rows.some(x=>x.row.Id===target)||group.contracts.filter(x=>x.id===target).length!==1)throw Error('La regla no está limitada a un contrato nuevo.');
 const formula='AND(ISNEW(), CASESAFEID(Contrato__c) = "'+target+'")';
 const state={name:ruleName,target,formula,initial:'ausente',originalRules:rules,restoreRequired:false};h.save('regla.json',state);
 for(const active of [true,false]){
  const label=active?'activa':'inactiva';const dir=h.path.join(h.out,'regla-'+label);h.fs.mkdirSync(h.path.join(dir,'objects'),{recursive:true});
  const xml='<?xml version="1.0" encoding="UTF-8"?>\n<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">\n  <validationRules>\n    <fullName>'+ruleName+'</fullName>\n    <active>'+active+'</active>\n    <description>Ensayo F4A limitado a un contrato ficticio nuevo. Conservar inactiva tras comprobar el rechazo.</description>\n    <errorConditionFormula>'+formula+'</errorConditionFormula>\n    <errorDisplayField>Contrato__c</errorDisplayField>\n    <errorMessage>P06_F4A_RECHAZO_INDIVIDUAL: creación bloqueada solo para el contrato del ensayo.</errorMessage>\n  </validationRules>\n</CustomObject>\n';
  h.fs.writeFileSync(h.path.join(dir,'objects/SeguimientoRenovacion__c.object'),xml);
  h.fs.writeFileSync(h.path.join(dir,'package.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<Package xmlns="http://soap.sforce.com/2006/04/metadata">\n  <types><members>SeguimientoRenovacion__c.'+ruleName+'</members><name>ValidationRule</name></types>\n  <version>65.0</version>\n</Package>\n');
 }
 h.publish('regla-inicial.json',{timestamp:new Date().toISOString(),name:ruleName,contract:target,formula,initial:'ausente',scope:'Solo ISNEW y el Id exacto de un contrato nuevo del conjunto parcial',priorRules:rules.map(x=>({name:x.fullName,active:x.active})),applicationPackageUnchanged:true});return state;
}
async function set(active){
 let c=await h.connect('p06-renovaciones-dev');const state=h.read('regla.json'),label=active?'activa':'inactiva';
 const current=await object(c),existing=(current.validationRules||[]).find(x=>x.fullName===ruleName);
 if(!active&&!existing){state.restoreRequired=false;h.save('regla.json',state);return;}
 if(existing&&existing.errorConditionFormula!==state.formula)throw Error('La condición de la regla cambió; no sobrescribir.');
 const directory=h.path.join(h.out,'regla-'+label),zip=h.path.join(h.dir,'regla-'+label+'-paquete-portable.zip');
 if(!h.fs.existsSync(zip)){
  const quote=x=>"'"+x.replace(/'/g,"''")+"'";
  h.cp.execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',"$ErrorActionPreference='Stop'; Add-Type -AssemblyName System.IO.Compression.FileSystem; Add-Type -AssemblyName System.IO.Compression; $archive=[IO.Compression.ZipFile]::Open("+quote(zip)+", [IO.Compression.ZipArchiveMode]::Create); try { foreach($relative in @('package.xml','objects/SeguimientoRenovacion__c.object')) { $entry=$archive.CreateEntry($relative); $source=[IO.File]::OpenRead([IO.Path]::Combine("+quote(directory)+",$relative)); $destination=$entry.Open(); try { $source.CopyTo($destination) } finally { $source.Dispose(); $destination.Dispose() } } } finally { $archive.Dispose() }"],{windowsHide:true,stdio:'pipe'});
 }
 const args=['project','deploy','start','--target-org','p06-renovaciones-dev','--api-version','65.0','--metadata-dir',zip,'--single-package','--test-level','NoTestRun','--wait','1','--json'];
 const validation=await h.deploy([...args,'--dry-run'],'regla-'+label+'-portable-validacion');
 if(validation.result.status!=='Succeeded'||!validation.result.done)throw Error('Regla no validada.');
 state.restoreRequired=true;h.save('regla.json',state);
 c=await h.connect('p06-renovaciones-dev');
 const deployment=await h.deploy(args,'regla-'+label+'-portable-despliegue');
 if(deployment.result.status!=='Succeeded'||!deployment.result.done)throw Error('Despliegue de regla no confirmado.');
 const after=await object(c);const actual=(after.validationRules||[]).find(x=>x.fullName===ruleName);
 const oldUnchanged=state.originalRules.every(x=>JSON.stringify(x)===JSON.stringify((after.validationRules||[]).find(y=>y.fullName===x.fullName)));
 if(!actual||actual.active!==active||actual.errorConditionFormula!==state.formula||!oldUnchanged)throw Error('Regla o validaciones anteriores no conformes.');
 state.active=active;state.restoreRequired=active;state[label]={validation:validation.result.id,deployment:deployment.result.id};h.save('regla.json',state);
 const receipt=r=>({id:r.id,status:r.status,done:r.done,success:r.success,checkOnly:r.checkOnly,components:r.numberComponentsDeployed,tests:r.numberTestsCompleted});
 h.publish('regla-'+label+'-recibos.json',{timestamp:new Date().toISOString(),validation:receipt(validation.result),deployment:receipt(deployment.result),readback:{name:actual.fullName,active:actual.active,formula:actual.errorConditionFormula},previousRulesUnchanged:oldUnchanged,temporaryRuleOutsideApplicationPackage:true});
 console.log(JSON.stringify({rule:ruleName,active,validation:validation.result.id,deployment:deployment.result.id,previousRulesUnchanged:oldUnchanged}));
}
module.exports={prepare,set,object,ruleName};

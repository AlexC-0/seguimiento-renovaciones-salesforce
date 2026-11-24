'use strict';
// Revisión local sin conexiones a Salesforce ni operaciones de escritura Git.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const expectedHead='69622d3013fbc77fc69877dcadddfde3dbae6be2';
const output='docs/evidencias-fase-5/revision-local.json';
const read=p=>fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,'');
const json=p=>JSON.parse(read(p));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const git=(...args)=>cp.execFileSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),'-c','core.autocrlf=false',...args],{cwd:root,windowsHide:true,encoding:'utf8',env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}});
const walk=p=>fs.readdirSync(path.join(root,p),{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(p+'/'+x.name):[p+'/'+x.name]);
const fail=[];
const assert=(v,message)=>{if(!v)fail.push(message);};
const changed=git('diff','--name-only','-z').split('\0').filter(Boolean);
const untracked=git('ls-files','--others','--exclude-standard','-z').split('\0').filter(Boolean);
const files=[...new Set([...changed,...untracked])].sort();
const scripts=walk('scripts/fase-5').filter(p=>p.endsWith('.cjs'));
for(const script of scripts){const run=cp.spawnSync(process.execPath,['--check',script],{cwd:root,windowsHide:true,encoding:'utf8'});assert(run.status===0,'Sintaxis: '+script);}
const jsonFiles=walk('docs/evidencias-fase-5').filter(p=>p.endsWith('.json')&&p!==output).concat('docs/evidencias-fase-5.json');
for(const file of jsonFiles){try{json(file);}catch{fail.push('JSON: '+file);}}
const markdown=files.filter(p=>p.endsWith('.md'));let linkCount=0;
for(const file of markdown){for(const match of read(file).matchAll(/\[[^\]]*\]\(([^)]+)\)/g)){let target=match[1].split('#')[0];if(!target||/^[a-z]+:/i.test(target))continue;target=decodeURIComponent(target.replace(/^<|>$/g,''));linkCount++;const absolute=path.resolve(root,path.dirname(file),target);assert(absolute===path.join(root,output)||fs.existsSync(absolute),'Enlace: '+file+' -> '+target);}}
const rules=[['identificador de usuario/organización',/\b(?:005|00D)[A-Za-z0-9]{12}(?:[A-Za-z0-9]{3})?\b/],['token Salesforce',/00D[A-Za-z0-9]{12,15}![A-Za-z0-9._-]{20,}/],['URL reutilizable',/(?:frontdoor\.jsp\?sid=|[?&](?:sid|access_token|refresh_token)=)[A-Za-z0-9._%-]{10,}/i],['clave privada',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],['correo real',/\b[A-Za-z0-9._%+-]+@(?!example\.invalid\b)[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/]];
let scanned=0;const sensitive=[];
for(const file of files){if(!/\.(?:md|json|xml|permissionset|cjs)$/.test(file))continue;const text=read(file);scanned++;for(const [name,re]of rules){if(re.test(text))sensitive.push({file,pattern:name});}assert(!text.includes('\ufffd'),'UTF-8: '+file);}
assert(sensitive.length===0,'Contenido sensible detectado por patrones; revisar sin imprimir valores.');
const baseline=json('.sf/p06-fase-5/antes.json');
const evidence=baseline.evidence.map(x=>({file:x.file,unchanged:hash(x.file)===x.sha256}));
const application=baseline.application.map(x=>({file:x.file,unchanged:hash(x.file)===x.sha256}));
assert(evidence.length===133&&evidence.every(x=>x.unchanged),'Evidencia histórica alterada.');
assert(application.every(x=>x.unchanged),'Aplicación o manifiestos históricos alterados.');
const head=git('rev-parse','HEAD').trim();assert(head===expectedHead,'HEAD cambió.');
assert(git('diff','--cached','--name-only').trim()==='','Hay cambios en staging.');
const diff=cp.spawnSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),'-c','core.autocrlf=false','diff','--check'],{cwd:root,windowsHide:true,encoding:'utf8',env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}});assert(diff.status===0,'git diff --check.');
const ac=[...read('docs/ACEPTACION-V1.md').matchAll(/^\| (AC-\d{2})\./gm)].map(x=>x[1]);assert(ac.length===20&&new Set(ac).size===20&&ac.every((x,i)=>x==='AC-'+String(i+1).padStart(2,'0')),'Matriz AC-01 a AC-20 incompleta.');
const xml=json('.sf/p06-fase-5/xml-local.json');assert(xml.length===5&&xml.every(x=>x.valid),'XML incompleto.');
const manifest=read('manifest/instalacion-v1.xml');assert([...manifest.matchAll(/<members>/g)].length===36,'Miembros del manifiesto.');assert(!/P06_VerificacionModelo|P06_F4A_|P06_F4B_|P06_F5_ReasignacionTemporal/.test(manifest),'Ensayo incluido en instalación.');
const preservation=json('docs/evidencias-fase-5/conservacion-final.json');assert(preservation.pass&&preservation.previousRecords===422&&preservation.newBusinessRecords===10,'Conservación remota no confirmada.');
const reports=jsonFiles.filter(p=>p.endsWith('-informe.json'));assert(reports.length===6&&reports.every(p=>json(p).pass),'Contrastes de informe incompletos.');
const result={timestamp:new Date().toISOString(),scope:'Inspección local; sin repetir ensayos remotos, despliegues o pruebas Apex',baseline:expectedHead,headUnchanged:head===expectedHead,indexEmpty:git('diff','--cached','--name-only').trim()==='',scriptsChecked:scripts,jsonFilesChecked:jsonFiles.length,xmlChecked:xml,relativeLinksChecked:linkCount,acceptanceCriteria:ac,publicFilesScanned:scanned,sensitivePatternFindings:sensitive,secretScanLimit:'Patrones delimitados y revisión; no garantía universal',priorEvidenceFiles:evidence.length,priorEvidenceUnchanged:evidence.every(x=>x.unchanged),applicationAndHistoricalManifestsUnchanged:application.every(x=>x.unchanged),newManifestMembers:36,reportComparisons:reports.length,remotePreservationEvidence:'conservacion-final.json',apexTestsRerun:false,cleanInstallationExecuted:false,stagingCommitPushExecuted:false,gitDiffCheck:diff.status===0,errors:fail,pass:fail.length===0};
fs.writeFileSync(path.join(root,output),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({scripts:scripts.length,json:jsonFiles.length,xml:xml.length,links:linkCount,criteria:ac.length,publicFiles:scanned,errors:fail,sensitivePatternFindings:sensitive,pass:result.pass}));
if(!result.pass)process.exitCode=1;

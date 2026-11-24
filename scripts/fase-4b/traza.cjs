'use strict';
const h=require('./comun.cjs');
async function start(c){
 if(h.fs.existsSync(h.path.join(h.dir,'traza.json')))throw Error('Traza ya registrada.');
 const technical=h.read('antes.json').technical;const now=new Date();
 const current=await c.tooling.query("SELECT Id FROM TraceFlag WHERE TracedEntityId='"+technical+"' AND ExpirationDate > "+now.toISOString());
 if(!current.done||current.records.length)throw Error('Hay otra traza activa; no reemplazar.');
 const state={started:now.toISOString(),expires:new Date(now.getTime()+600000).toISOString(),technical,restored:false};h.save('traza.json',state);
 const level=await c.tooling.sobject('DebugLevel').create({DeveloperName:'P06_F4B_'+Date.now(),MasterLabel:'P06 F4B temporal',ApexCode:'FINEST',ApexProfiling:'NONE',Callout:'NONE',Database:'INFO',System:'DEBUG',Validation:'INFO',Visualforce:'NONE',Workflow:'NONE'});
 if(!level.success)throw Error('Nivel de traza no creado.');state.level=level.id;h.save('traza.json',state);
 const flag=await c.tooling.sobject('TraceFlag').create({TracedEntityId:technical,DebugLevelId:state.level,LogType:'USER_DEBUG',StartDate:state.started,ExpirationDate:state.expires});
 if(!flag.success)throw Error('Traza no creada.');state.flag=flag.id;h.save('traza.json',state);
 h.publish('traza-inicial.json',{timestamp:state.started,expiration:state.expires,scope:'Solo operador técnico existente, durante el ensayo de reversión',apexCode:'FINEST',previousFlagsModified:false});
}
async function collect(c,execution){
 const state=h.read('traza.json');const logs=await c.tooling.query("SELECT Id,StartTime,Operation,Status,LogLength FROM ApexLog WHERE LogUserId='"+state.technical+"' AND StartTime >= "+state.started+" ORDER BY StartTime");
 if(!logs.done)throw Error('Inventario de logs truncado.');h.save('logs-inventario.json',logs.records);
 const kept=[];for(const log of logs.records){const body=await c.request('/services/data/v65.0/tooling/sobjects/ApexLog/'+log.Id+'/Body');if(typeof body!=='string')throw Error('Log no textual.');if(body.includes('LoteRenovaciones')&&body.includes(execution)){h.fs.writeFileSync(h.path.join(h.dir,'log-'+log.Id+'.txt'),body);kept.push({id:log.Id,start:log.StartTime,operation:log.Operation,status:log.Status,length:log.LogLength,sha256:h.hash(body)});}}
 h.save('logs-vinculados.json',kept);console.log(JSON.stringify({linkedLogs:kept.length}));return kept;
}
async function stop(){
 if(!h.fs.existsSync(h.path.join(h.dir,'traza.json')))return;const state=h.read('traza.json');const c=await h.connect('p06-renovaciones-dev');
 if(state.flag){const flags=await c.tooling.query("SELECT Id,TracedEntityId,DebugLevelId FROM TraceFlag WHERE Id='"+state.flag+"'");if(flags.records.length){const x=flags.records[0];if(x.TracedEntityId!==state.technical||x.DebugLevelId!==state.level)throw Error('Traza no coincide; no borrar.');const r=await c.tooling.sobject('TraceFlag').destroy(state.flag);if(!r.success)throw Error('Traza no retirada.');}}
 if(state.level){const refs=await c.tooling.query("SELECT Id FROM TraceFlag WHERE DebugLevelId='"+state.level+"'");if(refs.records.length)throw Error('Nivel todavía referenciado.');const levels=await c.tooling.query("SELECT Id,DeveloperName FROM DebugLevel WHERE Id='"+state.level+"'");if(levels.records.length){if(!levels.records[0].DeveloperName.startsWith('P06_F4B_'))throw Error('Nivel ajeno.');const r=await c.tooling.sobject('DebugLevel').destroy(state.level);if(!r.success)throw Error('Nivel no retirado.');}}
 const after=await c.tooling.query('SELECT Id, TracedEntityId, DebugLevelId, LogType, StartDate, ExpirationDate FROM TraceFlag');const before=h.read('trazas-previas.json');if(!after.done||after.records.length!==before.length||h.changed(before,after.records).length)throw Error('Trazas anteriores distintas.');
 state.restored=true;h.save('traza.json',state);h.publish('traza-restaurada.json',{timestamp:new Date().toISOString(),temporaryFlagRemoved:true,temporaryLevelRemoved:true,previousFlagsUnchanged:true,previousFlagCount:before.length,logsPreserved:true});
}
module.exports={start,collect,stop};
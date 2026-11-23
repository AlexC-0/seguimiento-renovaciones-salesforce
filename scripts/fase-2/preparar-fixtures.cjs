'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {connectP06,writePrivate,readPrivate,privateDir,root,reportError}=require('./salesforce.cjs');
(async()=>{
 const c=await connectP06(process.argv[2]),config=readPrivate('configuracion.json'),users=readPrivate('usuarios.json').users;
 if(users.length!==2||users.some(u=>!u.id))throw Error('Faltan identidades de prueba.');
 const history=JSON.parse(fs.readFileSync(path.join(root,'docs/evidencias-fase-1b.json'),'utf8')).comprobacionesFuncionales.registrosCreados;
 const beforeFile=path.join(privateDir,'historicos-antes.json');
 if(!fs.existsSync(beforeFile)){
   const snapshots=[];
   for(const record of history){const row=await c.sobject(record.objeto).retrieve(record.id);snapshots.push({object:record.objeto,id:record.id,row});}
   writePrivate('historicos-antes.json',snapshots);
 }
 const stateFile=path.join(privateDir,'fixtures.json');
 const state=fs.existsSync(stateFile)?readPrivate('fixtures.json'):{tag:'P06-F2-'+Date.now(),cut:new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid'}).format(new Date()),records:[],map:{}};
 const date=offset=>{const d=new Date(state.cut+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10)};
 async function create(object,key,payload){
  if(state.map[key])return state.map[key];
  const r=await c.request({method:'POST',url:'/services/data/v65.0/sobjects/'+object,headers:{'Content-Type':'application/json','Sforce-Email':'triggerUserEmail=false, triggerOtherEmail=false, triggerAutoResponseEmail=false'},body:JSON.stringify(payload)});
  if(!r.success)throw Error('Creación no confirmada: '+key);
  state.map[key]=r.id;state.records.push({objeto:object,id:r.id,funcion:key});writePrivate('fixtures.json',state);return r.id;
 }
 async function patch(object,id,payload){await c.request({method:'PATCH',url:'/services/data/v65.0/sobjects/'+object+'/'+id,headers:{'Content-Type':'application/json','Sforce-Email':'triggerUserEmail=false, triggerOtherEmail=false, triggerAutoResponseEmail=false'},body:JSON.stringify(payload)});}
 for(const actor of ['A','B'])await create('Account','cuenta_'+actor,{Name:state.tag+' Cuenta '+actor});
 const execution=await create('EjecucionRenovacion__c','ejecucion',{FechaCorte__c:state.cut,InicioVentana__c:state.cut,FinVentana__c:date(30),ZonaHoraria__c:'Europe/Madrid',Solicitante__c:config.technicalUserId});
 const specs=[
 ['a_pendiente','A',5,'Activo','Pendiente',0],['a_en_curso','A',10,'Activo','En curso',0],
 ['a_atrasado','A',-2,'Activo','Pendiente',0],['a_cerrado','A',20,'Activo','Cerrado',0],
 ['a_descartado','A',21,'Activo','Descartado',0],['a_inactivo','A',15,'Inactivo','Pendiente',0],
 ['a_fecha_distinta','A',30,'Activo','Pendiente',-1],['b_pendiente','B',8,'Activo','Pendiente',0],
 ['b_en_curso','B',12,'Activo','En curso',0],['cambio_contrato','A',18,'Activo','Pendiente',0],
 ['reasignacion','A',19,'Activo','Pendiente',0],['borrado_desechable','A',25,'Activo','Descartado',0]
 ];
 for(const [key,actor,days,contractState,followState,delta] of specs){
   const owner=users.find(u=>u.actor===actor).id;
   const contract=await create('ContratoComercial__c','contrato_'+key,{Cuenta__c:state.map['cuenta_'+actor],FechaInicio__c:date(-30),FechaVencimiento__c:date(days),Estado__c:contractState,OwnerId:owner});
   const expiry=date(days+delta);
   const follow=await create('SeguimientoRenovacion__c',key,{Contrato__c:contract,FechaVencimientoCapturada__c:expiry,ClaveIdentidad__c:contract+'|'+expiry,Ejecucion__c:execution,OwnerId:owner});
   if(followState!=='Pendiente'&&!state.map[key+'_estado_preparado']){
     await patch('SeguimientoRenovacion__c',follow,{Estado__c:followState,Notas__c:'Fixture '+state.tag+'; estado preparado para comprobación.'});
     state.map[key+'_estado_preparado']=true;writePrivate('fixtures.json',state);
   }
 }
 await create('IncidenciaRenovacion__c','incidencia',{Ejecucion__c:execution,Contrato__c:state.map.contrato_a_pendiente,Etapa__c:'Creación',CodigoError__c:'P06_F2_FIXTURE',Mensaje__c:state.tag+': incidencia ficticia para verificar acceso; no representa un fallo de procesamiento.'});
 const evidence={tipo:'preparacion_fixtures',fase:'2',fechaUtc:new Date().toISOString(),marca:state.tag,registros:state.records,registrosHistoricosConservados:history.length};
 fs.writeFileSync(path.join(root,'docs/evidencias-fase-2/fixtures.json'),JSON.stringify(evidence,null,2)+'\n');
 console.log(JSON.stringify({createdInventory:state.records.length,historicalSnapshot:history.length,objects:state.records.reduce((a,r)=>(a[r.objeto]=(a[r.objeto]||0)+1,a),{})}));
})().catch(reportError);

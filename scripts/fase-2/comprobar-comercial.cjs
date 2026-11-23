'use strict';
const fs=require('node:fs'),path=require('node:path');
const {run,reportError}=require('./navegador.cjs');
const {readPrivate,writePrivate,root}=require('./salesforce.cjs');
(async()=>{
 const actor=process.argv[2];if(!['A','B'].includes(actor))throw Error('Actor incorrecto.');
 const state=readPrivate('fixtures.json'),users=readPrivate('usuarios.json').users;
 const user=users.find(u=>u.actor===actor),other=users.find(u=>u.actor!==actor);
 const r=await run(async(page,ctx)=>{
  const cookies=await page.context().cookies([ctx.instanceUrl,'https://'+ctx.allowed[1]]);
  const sid=cookies.find(c=>c.name==='sid'&&c.domain===new URL(ctx.instanceUrl).hostname)||cookies.find(c=>c.name==='sid');
  if(!sid)throw Error('No hay sesion de prueba.');
  const headers={Authorization:'Bearer '+sid.value,'Sforce-Email':'triggerUserEmail=false, triggerOtherEmail=false, triggerAutoResponseEmail=false'};
  const identity=await page.request.get(ctx.instanceUrl+'/services/oauth2/userinfo',{headers});
  if((await identity.json()).user_id!==ctx.userId)throw Error('Identidad incorrecta para prueba.');
  const base=ctx.instanceUrl+'/services/data/v65.0';const cases=[];
  async function req(method,url,data){const r=await page.request.fetch(base+url,{method,headers,...(data?{data}:{})});let body=null;try{body=await r.json()}catch{}return {status:r.status(),body};}
  async function check(id,method,url,data,allowed,expected){const r=await req(method,url,data);const errors=Array.isArray(r.body)?r.body.map(e=>({code:e.errorCode,message:e.message.replace(/https?:\/\/\S+/g,'[URL]')})):[];const ok=allowed?r.status>=200&&r.status<300:r.status>=400&&r.status<500&&(!expected||errors.some(e=>expected.includes(e.code)));cases.push({id,method,status:r.status,expected:allowed?'permitido':'denegado',pass:ok,errors});return r.body;}
  const obj='/sobjects/SeguimientoRenovacion__c/',cobj='/sobjects/ContratoComercial__c/',m=ctx.map;
  const own=ctx.actor==='A'?m.a_pendiente:m.b_pendiente,foreign=ctx.actor==='A'?m.b_pendiente:m.a_pendiente;
  await check('lectura_propia','GET',obj+own,null,true);
  await check('edicion_notas_propia','PATCH',obj+own,{Notas__c:'P06 fase 2: comprobacion comercial '+ctx.actor},true);
  await check('lectura_ajena','GET',obj+foreign,null,false,['NOT_FOUND','INSUFFICIENT_ACCESS_OR_READONLY']);
  await check('edicion_ajena','PATCH',obj+foreign,{Notas__c:'Intento de acceso ajeno P06 F2'},false,['INSUFFICIENT_ACCESS_OR_READONLY','ENTITY_IS_DELETED','NOT_FOUND']);
  await check('contrato_solo_lectura','PATCH',cobj+m['contrato_'+(ctx.actor==='A'?'a_pendiente':'b_pendiente')],{Estado__c:'Inactivo'},false,['CANNOT_INSERT_UPDATE_ACTIVATE_ENTITY','INVALID_FIELD_FOR_INSERT_UPDATE','INSUFFICIENT_ACCESS_OR_READONLY']);
  await check('ejecucion_denegada','GET','/sobjects/EjecucionRenovacion__c/'+m.ejecucion,null,false,['NOT_FOUND','INVALID_TYPE']);
  await check('incidencia_denegada','GET','/sobjects/IncidenciaRenovacion__c/'+m.incidencia,null,false,['NOT_FOUND','INVALID_TYPE']);
  await check('reasignacion_denegada','PATCH',obj+own,{OwnerId:ctx.otherId},false,['FIELD_CUSTOM_VALIDATION_EXCEPTION','INSUFFICIENT_ACCESS_OR_READONLY']);
  if(ctx.actor==='A'){
   await check('creacion_denegada','POST',obj,{Contrato__c:m.contrato_a_pendiente,FechaVencimientoCapturada__c:'2030-01-01',ClaveIdentidad__c:m.contrato_a_pendiente+'|2030-01-01',Ejecucion__c:m.ejecucion,Estado__c:'Pendiente'},false,['CANNOT_INSERT_UPDATE_ACTIVATE_ENTITY','INVALID_FIELD','INSUFFICIENT_ACCESS_OR_READONLY','INVALID_TYPE','INVALID_FIELD_FOR_INSERT_UPDATE']);
   await check('eliminacion_denegada','DELETE',obj+m.borrado_desechable,null,false,['INSUFFICIENT_ACCESS_OR_READONLY']);
   for(const [name,data] of Object.entries({contrato:{Contrato__c:m.contrato_a_en_curso},fecha:{FechaVencimientoCapturada__c:'2030-01-01'},clave:{ClaveIdentidad__c:m.contrato_a_pendiente+'|2030-01-02'},origen:{Ejecucion__c:ctx.otherExecution}}))await check('inmutabilidad_'+name,'PATCH',obj+own,data,false,['INVALID_FIELD','FIELD_CUSTOM_VALIDATION_EXCEPTION','INSUFFICIENT_ACCESS_ON_CROSS_REFERENCE_ENTITY','INVALID_FIELD_FOR_INSERT_UPDATE']);
   await check('pendiente_a_en_curso','PATCH',obj+own,{Estado__c:'En curso'},true);
   await check('cierre_sin_nota','PATCH',obj+own,{Estado__c:'Cerrado',Notas__c:' '},false,['FIELD_CUSTOM_VALIDATION_EXCEPTION']);
   await check('cierre_con_nota','PATCH',obj+own,{Estado__c:'Cerrado',Notas__c:'Cierre ficticio para comprobar transiciones.'},true);
   await check('reapertura_denegada','PATCH',obj+own,{Estado__c:'Pendiente'},false,['FIELD_CUSTOM_VALIDATION_EXCEPTION']);
  }
  const desc=await req('GET',obj+'describe');const fields=desc.body.fields.filter(f=>['Notas__c','Estado__c','ClaveIdentidad__c','OwnerId','Aplicable__c'].includes(f.name)).map(f=>({name:f.name,createable:f.createable,updateable:f.updateable}));
  const lists=await req('GET',obj+'listviews');
  return {actor:ctx.actor,role:'comercial',identityVerified:true,cases,objectAccess:{createable:desc.body.createable,updateable:desc.body.updateable,deletable:desc.body.deletable},fields,lists:(lists.body.listviews||[]).map(l=>({name:l.developerName,label:l.label}))};
 },{actor,userId:user.id,otherId:other.id,map:state.map,otherExecution:JSON.parse(fs.readFileSync(path.join(root,'docs/evidencias-fase-1b.json'),'utf8')).comprobacionesFuncionales.registrosCreados.find(x=>x.objeto==='EjecucionRenovacion__c').id});
 r.timestamp=new Date().toISOString();writePrivate('comercial-'+actor.toLowerCase()+'.json',r);fs.writeFileSync(path.join(root,'docs/evidencias-fase-2/comercial-'+actor.toLowerCase()+'.json'),JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify(r));
})().catch(reportError);

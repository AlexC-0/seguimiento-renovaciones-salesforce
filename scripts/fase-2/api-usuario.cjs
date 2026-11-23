'use strict';
const {run}=require('./navegador.cjs');const {readPrivate}=require('./salesforce.cjs');
async function api(actor,requests){
 const user=readPrivate('usuarios.json').users.find(u=>u.actor===actor);if(!user)throw Error('Actor desconocido.');
 return run(async(page,ctx)=>{
 const cookies=await page.context().cookies([ctx.instanceUrl,'https://'+ctx.allowed[1]]);const sid=cookies.find(c=>c.name==='sid'&&c.domain===new URL(ctx.instanceUrl).hostname)||cookies.find(c=>c.name==='sid');if(!sid)throw Error('Sesion no disponible.');
 const headers={Authorization:'Bearer '+sid.value,'Sforce-Email':'triggerUserEmail=false, triggerOtherEmail=false, triggerAutoResponseEmail=false'};
 const who=await page.request.get(ctx.instanceUrl+'/services/oauth2/userinfo',{headers});if((await who.json()).user_id!==ctx.userId)throw Error('Identidad de sesion distinta a la solicitada.');
 const results=[];for(const x of ctx.requests){if(!x.url.startsWith('/services/data/v65.0/'))throw Error('Ruta API no permitida.');const r=await page.request.fetch(ctx.instanceUrl+x.url,{method:x.method||'GET',headers,...(x.data?{data:x.data}:{})});let body=null;try{body=await r.json()}catch{}results.push({id:x.id,status:r.status(),body});}return {actor:ctx.actor,identityVerified:true,results};
 },{actor,userId:user.id,requests});
}
module.exports={api};

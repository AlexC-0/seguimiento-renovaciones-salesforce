'use strict';
const fs=require('node:fs'),path=require('node:path');
const {connectP06,privateDir,reportError}=require('./salesforce.cjs');
async function rpc(method,params,id=1){
 const p=path.join(privateDir,'mcp-session.json');
 const s=fs.existsSync(p)?JSON.parse(fs.readFileSync(p,'utf8')):{};
 const headers={'Content-Type':'application/json','Accept':'application/json, text/event-stream'};
 if(s.sessionId)headers['Mcp-Session-Id']=s.sessionId;
 const r=await fetch('http://127.0.0.1:8937/mcp',{method:'POST',headers,body:JSON.stringify({jsonrpc:'2.0',...(id===null?{}:{id}),method,params})});
 if(r.headers.get('mcp-session-id'))fs.writeFileSync(p,JSON.stringify({sessionId:r.headers.get('mcp-session-id')}));
 const raw=await r.text();if(!r.ok)throw Error('Conector de navegador: HTTP '+r.status);
 if(!raw)return null;
 if(raw.trim().startsWith('{'))return JSON.parse(raw);
 const messages=raw.split('\n').filter(l=>l.startsWith('data:')).map(l=>JSON.parse(l.slice(5).trim()));
 return messages.find(m=>m.id===id)||messages.at(-1);
}
async function run(action,context={}){
 const c=await connectP06('p06-renovaciones-dev');
 const host=new URL(c.instanceUrl).hostname;
 const allowed=[host,host.replace('.my.salesforce.com','.lightning.force.com'),host.replace('.my.salesforce.com','.my.salesforce-setup.com')];
 const code='async(page)=>{const context='+JSON.stringify({...context,instanceUrl:c.instanceUrl,allowed})+';if(!context.allowed.includes(new URL(page.url()).hostname))return {scopeMismatch:true};return await ('+action.toString()+')(page,context);}';
 const r=await rpc('tools/call',{name:'browser_run_code_unsafe',arguments:{code}},Date.now());
 fs.writeFileSync(path.join(privateDir,'latest-browser-result.json'),JSON.stringify(r).replace(/(sid=)[^&\s\"<>]+/g,'$1[redactado]'));
 if(r.error||r.result?.isError){const diagnostic=(r.result?.content||[]).filter(x=>x.type==='text').map(x=>x.text).join(' ').split('Call log:')[0].replace(/https?:\/\/\S+/g,'[URL]').slice(0,450);throw Error(diagnostic||'Error de navegador; diagnostico privado conservado.');}
 const text=(r.result?.content||[]).filter(x=>x.type==='text').map(x=>x.text).join('\n');
 const section=text.split('### Result\n')[1]?.split('\n### ')[0]?.trim();
 if(!section)throw Error('El navegador no devolvió un resultado estructurado.');
 const value=JSON.parse(section);
 if(value.scopeMismatch)throw Error('La pestaña actual no pertenece a P06.');
 return value;
}
module.exports={rpc,run,reportError};

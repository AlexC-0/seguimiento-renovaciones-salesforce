'use strict';
const h=require('./comun.cjs'),p=require('./preparar.cjs'),r=require('./reglas.cjs'),t=require('./traza.cjs'),m=require('./motor.cjs');
(async()=>{
 const c=await h.connect(process.argv[2]);const group=await p.prepare(c,'reversion',10);await r.prepare(c,group);
 try{
  await r.set(true);await t.start(c);
  const result=await m.launch(c,'reversion','fallo');
  await t.collect(c,result.execution.Id);
  console.log(JSON.stringify({job:result.job,execution:result.execution.Estado__c,counts:Object.fromEntries(m.counterNames.map(k=>[k,result.execution[k+'__c']])),follows:result.follows.length,incidents:result.incidents.length}));
 }finally{try{await t.stop();}finally{await r.set(false);}}
})().catch(h.reportError);
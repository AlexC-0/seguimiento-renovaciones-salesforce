'use strict';
function decision(samples, elapsed, maximum=120000) {
 const last=samples.at(-1);if(!last)return {stop:elapsed>=maximum,reason:'sin observaciones'};
 const terminal=['Completed','Failed','Aborted'].includes(last.job.Status);
 const closed=['Completada','Completada con incidencias','Fallida','Abortada'].includes(last.execution.Estado__c)&&last.execution.Finalizacion__c!=null;
 const recent=samples.slice(-3);const signature=x=>JSON.stringify([x.job,x.execution]);
 const stable=recent.length===3&&recent.every(x=>signature(x)===signature(last));
 const terminalSince=samples.find(x=>['Completed','Failed','Aborted'].includes(x.job.Status))?.elapsed;
 if(terminal&&stable&&(closed||elapsed-terminalSince>=10000))return {stop:true,reason:closed?'terminal y cierre estables':'terminal estable sin cierre tras espera acotada'};
 return {stop:elapsed>=maximum,reason:elapsed>=maximum?'límite de observación':'observando'};
}
module.exports={decision};
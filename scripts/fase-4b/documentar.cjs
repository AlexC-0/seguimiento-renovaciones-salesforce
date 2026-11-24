'use strict';
const h=require('./comun.cjs');
const read=n=>h.readJSON(h.path.join(h.out,n));
const finish=read('conservacion-final.json'),report=read('informe.json');
if(!finish.pass||!report.pass)throw Error('Falta comprobación final satisfactoria.');
const rollback=read('reversion-comprobacion.json'),proof=read('reversion-prueba-lotes.json'),abort=read('aborto-1-comprobacion.json');
const rr=read('reversion-recuperacion-comprobacion.json'),ar=read('aborto-1-recuperacion-comprobacion.json');
if([rollback,proof,abort,rr,ar].some(x=>!x.pass))throw Error('Escenario no conforme.');
const write=(file,text)=>h.fs.writeFileSync(h.path.join(h.root,file),text.trimEnd()+'\n');
const update=(file,old,value)=>{const text=h.fs.readFileSync(h.path.join(h.root,file),'utf8');if(!text.includes(old))throw Error('Referencia no localizada en '+file);write(file,text.replace(old,value));};
const table=[['Reversión','reversion-fallo-contraste-2.json'],['Recuperación de reversión','reversion-recuperacion-resultado.json'],['Aborto','aborto-1-aborto-contraste-2.json'],['Recuperación de aborto','aborto-1-recuperacion-resultado.json']].map(([label,file])=>{const s=read(file),e=s.execution,j=s.job;return '| '+[label,e.Id,j.Id,j.Status,e.Estado__c,e.Evaluados__c,e.Creados__c,e.YaExistentes__c,e.Fallidos__c,e.LotesFallidos__c].join(' | ')+' |';}).join('\n');
write('docs/FASE-4B.md',`# Fase 4B — Reversión de lote, aborto y recuperación

Fecha: 24/11/2026. Referencia: ${h.baseline}. Destino exclusivo p06-renovaciones-dev, Developer Edition, API 65.0. La identidad de Organization y el operador técnico se verificaron contra sus recibos privados. V1 sigue abierta.

## Resultado

Se demostró la reversión completa de un execute al fallar su auditoría, con conservación del otro lote del mismo job. El ensayo independiente obtuvo un aborto antes de comenzar. Ambas recuperaciones manuales completaron las identidades ausentes y conservaron el intento adverso, su diagnóstico y su marca de reconciliación.

| Escenario | Ejecución | Job | Estado del job | Estado de ejecución tras contraste | Evaluados | Creados | Existentes | Fallidos individuales | Lotes fallidos |
|---|---|---|---|---|---:|---:|---:|---:|---:|
${table}

Corte de los cuatro lanzamientos: 2026-11-24. Fin inclusivo: 2026-12-24. Zona Salesforce: Europe/Paris. Dos conjuntos nuevos e independientes de diez contratos, con tamaño de lote cinco y filtro explícito de IDs. Los omitidos son cero. Cada ejecución conserva su corte, zona, job y resultados; los JSON registran timestamps UTC.

## Reversión completa acreditada

Se activaron dos reglas limitadas al contrato nuevo ${h.read('reglas.json').target}. La primera rechaza ISNEW del seguimiento. La segunda añade ISPICKVAL de Etapa__c igual a Creación y rechaza únicamente su incidencia individual. Reconciliación y los demás contratos quedan fuera de esa condición. Las reglas iniciales estaban ausentes; sus definiciones se conservan fuera de force-app y manifest.

El job procesó dos lotes y terminó Completed con NumberOfErrors=1. La [prueba de lotes](evidencias-fase-4b/reversion-prueba-lotes.json) recoge directamente VARIABLE_ASSIGNMENT de alcance en execute, vinculado a la ejecución. Identifica los cinco miembros reales de cada lote sin presuponer orden ni multiplicar errores por tamaño.

En el lote afectado, cuatro SaveResult indicaron éxito tentativo y uno rechazo individual. La posterior inserción de IncidenciaRenovacion falló por P06_F4B_RechazoAuditoria. El log registra SAVEPOINT_ROLLBACK y propagación de DmlException. Una lectura posterior confirma cero seguimientos para esos cinco contratos, ausencia de los cuatro IDs tentativos y ninguna incidencia de Creación persistida. Esos IDs revertidos se documentan como intentos; no se incluyen como registros persistidos en el inventario.

El otro execute conservó cinco seguimientos. La ejecución confirmó Evaluados=5, Creados=5 y cero existentes, omitidos o fallidos individuales. Se cumple la ecuación de resultados confirmados. LotesFallidos=1 tiene unidad lote y no se añade a esa ecuación.

El callback finish dejó Fallida, RequiereReconciliacion=true y una incidencia CONTRASTE_JOB en otra transacción, con estado Completed, dos lotes procesados y un error. La traza de finish y la lectura previa al contraste respaldan ese origen. Los dos contrastes manuales posteriores conservaron resultados, finalización y la única incidencia. [Comprobación](evidencias-fase-4b/reversion-comprobacion.json) y [contraste repetido](evidencias-fase-4b/reversion-fallo-contraste.json).

Completed del trabajo admite errores y se interpreta junto con sus contadores y los datos persistidos. La política local permite actualizar LotesFallidos cuando el resumen Completed es completo y coherente; no reconstruye resultados individuales. Véanse [AsyncApexJob](https://developer.salesforce.com/docs/platform/object-reference/references/standard-objects/object-asyncapexjob.html) y la [política del proyecto](REVISION-FASE-3.md).

## Recuperación del lote revertido

Las dos reglas se desactivaron y su estado se leyó antes de recuperar. La revisión consultó trabajo, ejecución, incidencias y seguimientos. Se prepararon dos seguimientos nuevos ya confirmados: uno Cerrado con nota y otro En curso con nota, para comprobar conservación. Es preparación técnica del ensayo y no una nueva sesión comercial.

La nueva ejecución ${rr.execution} creó cinco identidades ausentes y reconoció cinco existentes. Propietario, estado, notas y origen de estos últimos permanecieron iguales; el cerrado no se reabrió. Las nuevas claves coinciden con contrato y fecha capturada. El intento original sigue Fallida y mantiene su diagnóstico y RequiereReconciliacion=true. La relación entre revisión y nuevo intento figura en [recuperación prevista](evidencias-fase-4b/reversion-recuperacion-prevista.json) y [comprobación](evidencias-fase-4b/reversion-recuperacion-comprobacion.json).

## Aborto acotado y recuperación

Se lanzó el conjunto independiente y se consultó exclusivamente el AsyncApexJob vinculado a esa nueva ejecución. ServicioRenovaciones verificó LoteRenovaciones, BatchApex, solicitante y vínculo. System.abortJob recibió únicamente ese Id, dentro de la transacción de lanzamiento. El recibo observó Holding antes y Aborted después; la consulta posterior al commit confirmó Aborted persistido.

El alcance demostrado es **aborto antes de comenzar**: JobItemsProcessed=0, TotalJobItems=0, cero seguimientos y ejecución todavía Encolada. No se acredita aborto a mitad del procesamiento. Se obtuvo en el primer intento y no se preparó un segundo conjunto. [Clasificación y recibo](evidencias-fase-4b/aborto-1-clasificacion.json). El método acepta el Id de AsyncApexJob para Batch según la [referencia de System.abortJob](https://developer.salesforce.com/docs/platform/apex-ref/references/apex-ref/apex-methods-system-system.html).

El observador conservó las lecturas estables y terminó su espera de cierre sin depender de finish. El primer contraste marcó Abortada, RequiereReconciliacion=true y guardó una incidencia CONTRASTE_JOB. Conservó los cinco contadores individuales y LotesFallidos a cero; Aborted no permite atribuir fallos a execute. Finalizacion corresponde al diagnóstico, no a la hora exacta de fin del job. El segundo contraste no hizo cambios ni duplicó la incidencia. [Comprobación](evidencias-fase-4b/aborto-1-comprobacion.json) y [contraste](evidencias-fase-4b/aborto-1-aborto-contraste.json).

La nueva ejecución ${ar.execution} creó los diez seguimientos pendientes sin duplicados. No había seguimientos previos cuya conservación pudiera probarse en este escenario; esa comprobación sí se ejecutó en la recuperación de reversión. El job abortado, su ejecución, diagnóstico y marca permanecen intactos. [Revisión previa](evidencias-fase-4b/aborto-1-recuperacion-prevista.json) y [resultado](evidencias-fase-4b/aborto-1-recuperacion-comprobacion.json).

## Observación y diagnóstico

El observador separa estado del job y cierre de la ejecución. Exige tres lecturas consecutivas estables; si el job es terminal y no aparece cierre, espera al menos diez segundos desde la primera observación terminal y conserva esa ausencia para el contraste. El bucle tiene un presupuesto máximo de 120 segundos, evaluado entre peticiones; la latencia de la petición en curso puede añadir tiempo. Al agotarlo, conserva las observaciones y no relanza ni inventa un cierre.

La recuperación de reversión volvió a mostrar Completed del job antes de Completada de la ejecución. El observador esperó y recogió el cierre posterior sin clasificar la primera lectura como fallo. Cuatro pruebas locales cubren esa lectura adelantada, cierre ausente, estabilidad y límite total. [Pruebas](evidencias-fase-4b/pruebas-observador.json). No se repitieron las 20 pruebas Apex históricas: el código de aplicación no cambió.

Un rechazo individual permite confirmar los demás registros del lote cuando su auditoría se guarda. Cuando falla esa auditoría, el savepoint revierte el conjunto y la excepción se propaga; una escritura diagnóstica dentro de la transacción fallida tampoco garantiza persistencia. Por eso el diagnóstico se guarda en otra transacción, desde finish o contraste manual. [Ciclo de transacciones Batch](https://developer.salesforce.com/docs/platform/apex-dev/references/apex-dev/apex-batch-interface.html).

Recuperar crea otra ejecución porque su selección, trabajo y resultados corresponden a un intento nuevo. Se conserva la anterior para explicar qué quedó confirmado, qué no pudo confirmarse y qué revisó el operador. Completar las identidades ausentes no convierte retroactivamente un fallo o aborto en éxito ni elimina automáticamente su incertidumbre.

## Configuración temporal y restauración

| Estado de las dos reglas F4B | Validación | Despliegue | Resultado |
|---|---|---|---|
| Activas | 0Afg700000L6yWsCAJ | 0Afg700000L5yvXCAR | Succeeded, dos componentes |
| Inactivas | 0Afg700000L7EerCAF | 0Afg700000L7EoXCAV | Succeeded, dos componentes |

Se validó cada ZIP antes de desplegar y se comprobó su SHA-256 sin cambios entre ambas operaciones. Se utilizó NoTestRun en Developer Edition para las reglas de ensayo; no se presenta como ejecución de pruebas Apex. Las reglas anteriores permanecen idénticas y P06_F4A_RechazoAcotado sigue inactiva. Las dos reglas F4B se conservan inactivas en la organización, no ausentes. [Recibos activos](evidencias-fase-4b/reglas-activas-recibos.json) y [restauración](evidencias-fase-4b/reglas-inactivas-recibos.json).

La traza USER_DEBUG afectó solo al operador técnico, con ApexCode=FINEST y caducidad de diez minutos. Se recogieron cinco logs vinculados; solo se publican extractos estructurados de los dos execute. Los logs íntegros se conservan privados. TraceFlag y DebugLevel propios se retiraron al terminar el ensayo, antes de recuperar; la traza anterior, ya expirada, no se modificó. [Restauración](evidencias-fase-4b/traza-restaurada.json). FINEST permite observar asignaciones según la [documentación de logs](https://developer.salesforce.com/docs/platform/apex-dev/references/apex-dev/apex-debugging-debug-log.html).

No se modificaron usuarios, permisos comerciales, configuración global ni Login As. No hubo navegación, servicios, túneles, nuevas dependencias ni cambios en clases, triggers o manifiestos de aplicación. Un error local de construcción de archivos se corrigió antes de ejecutar el generador; no creó jobs ni produjo despliegues. [Incidencias de procedimiento](evidencias-fase-4b/incidencias-procedimiento.json). No apareció un defecto de aplicación que justificara corrección o despliegue.

## Informe y conservación

Analytics y SOQL, con la misma identidad técnica existente, coinciden en ${report.reportTotal} IDs. Aparecen ${report.newObserved} seguimientos nuevos: nueve del conjunto de reversión y diez del abortado. El cerrado queda excluido; En curso aparece. allData=true y consulta SOQL completa. No se atribuye esta lectura a una sesión comercial. [Informe e IDs](evidencias-fase-4b/informe.json).

Los 374 registros anteriores conservan sus campos persistidos y los 82 archivos históricos de evidencia mantienen sus bytes. Se conservan ${finish.newRecords} registros nuevos: dos cuentas, veinte contratos, cuatro ejecuciones, veinte seguimientos y dos incidencias de reconciliación. Los intentos fallido y abortado forman parte del inventario. El estado de los contratos nuevos y las historias adversas también se vuelven a comparar al terminar. [Inventario](evidencias-fase-4b/inventario.json) y [conservación final](evidencias-fase-4b/conservacion-final.json).

Las lecturas por inventario usan bloques de hasta 150 IDs y contrastan solicitados, recuperados y unicidad; las consultas paginadas consumen todos los cursores. Las consultas acotadas cotejan COUNT y límite. Se excluyen de la comparación attributes, LastViewedDate, LastReferencedDate y DiasRestantes__c, separando presentación y fórmula temporal de los campos persistidos. Login As=false, usuarios y asignaciones comerciales intactos. Las fuentes de force-app y manifest conservan sus bytes iniciales.

## Procedimientos y límites

scripts/fase-4b contiene inspección, preparación, reglas, traza, observación, contraste, recuperación y comprobación final separados de los históricos. Los recibos completos e identidades quedan en .sf, excluido de Git. Los procedimientos rechazan sobrescribir lanzamientos registrados. Ante interrupción se revisan primero sus recibos y Salesforce, y se desactivan los mecanismos temporales; no se vuelve a ejecutar un ensayo ya terminado.

La [revisión local](evidencias-fase-4b/revision-local.json) registra sintaxis, seis XML de los paquetes temporales, JSON, enlaces, contenido sensible, exclusiones e índice Git vacío. Las cuatro regresiones del observador se ejecutaron antes del ensayo remoto y se verificaron sus hashes al cerrar.

La fase 4B queda comprobada dentro del alcance. Quedan sin evidencia real el aborto después de confirmar lotes, errores de start o finish, colisión de inserción, cruce de medianoche y cambio estacional. No se hicieron pruebas de rendimiento ni se añaden reintentos, programación, LWC, Flow, integraciones o eventos. V1 sigue abierta.
`);
const short=`## Fase 4B

Comprobada sobre ${h.baseline}. Un execute revirtió cuatro inserciones tentativas al rechazarse su auditoría; sus cinco miembros están identificados en la traza. El otro lote conservó cinco seguimientos. Job Completed con un error; ejecución Fallida, Evaluados=5, Creados=5, LotesFallidos=1 y reconciliación marcada. finish dejó una incidencia; dos contrastes posteriores no la duplicaron.

La recuperación manual creó cinco ausentes y reconoció cinco existentes sin cambios, incluido un cerrado y otro con notas. Un conjunto independiente obtuvo Aborted desde Holding antes de comenzar: cero resultados confirmados. El contraste persistió Abortada y diagnóstico; la nueva ejecución creó diez seguimientos. Ambas historias adversas y sus marcas se conservan.

Configuración final: dos reglas F4B inactivas verificadas, regla F4A inactiva, traza y nivel temporales retirados; Login As=false y usuarios/permisos comerciales intactos. Conservación: 374 registros anteriores, ${finish.newRecords} nuevos y 82 evidencias históricas. Informe y SOQL técnico: ${report.reportTotal} IDs, ${report.newObserved} nuevos incluidos y uno cerrado excluido.

Cuatro regresiones locales del observador correctas; sin cambios de aplicación ni nueva batería Apex. V1 abierta. Aborto a mitad del procesamiento, errores de start/finish, colisión de inserción y casos temporales siguen sin evidencia real. [Resultados de fase 4B](FASE-4B.md) y [evidencias](evidencias-fase-4b.json).

`;
update('docs/STATUS.md','## Fase 4A',short+'## Fase 4A');
update('README.md','V1 sigue abierta: quedan sin demostrar la colisión de inserción, los abortos, la reversión completa de un lote y su recuperación, así como los casos temporales indicados en los criterios. El solapamiento observado no acredita rendimiento general.',`Fase 4B comprobada: reversión completa de un lote con conservación del otro, aborto antes de comenzar y dos recuperaciones manuales que conservan historia. Los 374 registros anteriores y 82 evidencias siguen intactos; quedan ${finish.newRecords} nuevos. Las reglas temporales están inactivas y la traza retirada. [Resultados](docs/FASE-4B.md).

V1 sigue abierta. No se acreditan aborto a mitad del procesamiento, errores reales de start/finish, colisión de inserción, cruce de medianoche ni cambio estacional. Estos ensayos no acreditan rendimiento general.`);
update('README.md','La organización conserva además la regla de ensayo de fase 4A inactiva.','La organización conserva además tres reglas de ensayo inactivas, una de fase 4A y dos de fase 4B.');
update('README.md','| scripts/fase-4a |','| scripts/fase-4b y docs/evidencias-fase-4b | Reversión, aborto, recuperación, conservación y reglas temporales |\n| scripts/fase-4a |');
update('README.md','- [Fase 4A:','- [Fase 4B: reversión, aborto y recuperación](docs/FASE-4B.md)\n- [Evidencias de fase 4B](docs/evidencias-fase-4b.json)\n- [Fase 4A:');
update('docs/PROJECT_BRIEF.md','Interrupciones y reversión total de un lote siguen sin ensayo real.','La fase 4B añade reversión total de un execute, aborto antes de comenzar y sus recuperaciones manuales; no acredita aborto intermedio ni fallos de start/finish.');
update('docs/PROJECT_BRIEF.md','La colisión de inserción, el cruce real de medianoche, el cambio estacional y las interrupciones siguen sin demostración real;','La fase 4B añade reversión completa de lote y aborto previo al inicio. La colisión de inserción, el cruce real de medianoche, el cambio estacional y el aborto durante el procesamiento siguen sin demostración real;');
update('docs/PROJECT_BRIEF.md','## Límites de fase 1A',`## Cobertura añadida en fase 4B

| Criterio | Evidencia real añadida | Límite |
|---|---|---|
| AC-05 | Recuperación reconoce cinco existentes, conserva todos sus campos y no reabre el cerrado | Muestra técnica del conjunto de reversión |
| AC-08 | Cinco miembros de execute identificados en log; cuatro inserciones tentativas revertidas, auditoría ausente y otro lote conservado | Fallo de auditoría de Creación; no errores reales de start/finish |
| AC-09 | Diagnóstico persistido, contraste repetido estable y nuevas ejecuciones recuperan cinco tras rollback y diez tras aborto | Aborto antes de comenzar, sin demostración intermedia |
| AC-16 | Informe y SOQL coinciden en ${report.reportTotal} IDs, ${report.newObserved} nuevos incluidos y un cerrado excluido | Cuenta técnica, no nueva sesión comercial |
| AC-17 | 374 anteriores y 82 evidencias intactos, ${finish.newRecords} nuevos conservados, historias adversas sin cambios | Se separan campos temporales y de visualización |

No se amplía la cobertura de colisión de inserción, medianoche o cambio estacional. La conservación de datos tras recuperación no limpia automáticamente RequiereReconciliacion de los intentos adversos. V1 sigue abierta. [Resultados de fase 4B](FASE-4B.md).

## Límites de fase 1A`);
h.fs.appendFileSync(h.path.join(h.root,'docs/ENVIRONMENT.md'),`\n## Entorno de fase 4B\n\nEl 24/11/2026 se verificó el mismo destino P06 con API 65.0. Node 24.13.0 y CLI 2.158.7 reutilizados sin cambios globales. La instantánea inicial registró cero Batch activos, 14999 solicitudes API y 250000 ejecuciones asíncronas disponibles; no son garantías de capacidad.\n\nSe validaron y desplegaron dos reglas temporales limitadas a un contrato nuevo para rechazar seguimiento y auditoría de Creación. Ambas quedaron inactivas verificadas antes de recuperar; F4A permaneció inactiva. Los ZIP y recibos están fuera del paquete de aplicación. Una traza USER_DEBUG limitada al operador y su DebugLevel propios se retiraron después de recoger logs del rollback; la traza anterior no cambió.\n\nCuatro jobs del ensayo, dos recuperaciones manuales. Corte 2026-11-24, fin 2026-12-24, Europe/Paris; evidencia en UTC. Conexión CLI/API sin navegador ni Login As. No se modificaron usuarios, permisos o configuración global. ${finish.newRecords} registros nuevos conservados junto a los 374 anteriores. [Detalle y restauración](FASE-4B.md).\n`);
update('AGENTS.md','## Antecedente: alcance de fase 4A',`## Resultado de fase 4B

Reversión real de execute por auditoría rechazada, con otro lote confirmado, y aborto antes de comenzar comprobados. Recuperaciones manuales: cinco creados y cinco existentes tras rollback; diez creados tras aborto. Conservar 374 registros anteriores, ${finish.newRecords} nuevos y todas las evidencias; no reactivar ni repetir ensayos cerrados. Reglas F4B y F4A inactivas, TraceFlag/DebugLevel propios retirados. Dos historias adversas conservan diagnóstico y reconciliación; informe técnico con ${report.reportTotal} IDs. Sin cambios de aplicación; cuatro regresiones del observador correctas. Ver docs/FASE-4B.md. V1 abierta; otros escenarios requieren nuevo alcance.

## Antecedente: alcance de fase 4A`);
const aggregate={phase:'4B',date:'2026-11-24',baseline:h.baseline,target:'p06-renovaciones-dev',apiVersion:'65.0',status:'Comprobada dentro del alcance; V1 abierta',rollback:{job:rollback.job.Id,execution:rollback.execution.Id,scopes:2,rolledBackScope:5,confirmedScope:5,tentativeCreatesRolledBack:4,individualIncidentPersisted:false,failedScopes:1,diagnosticIncidents:rollback.incidents.length},abort:{job:abort.job.Id,execution:abort.execution.Id,classification:abort.classification,confirmedFollows:0,diagnosticIncidents:abort.incidents.length},recoveries:[rr,ar],preservation:{previousRecords:374,newRecords:finish.newRecords,newRecordCounts:finish.newRecordCounts,previousEvidenceFiles:82,previousPersistentChanges:0},report:{total:report.reportTotal,newIncluded:report.newObserved,newExcluded:1,identity:'Cuenta técnica existente; misma conexión Analytics y SOQL'},temporary:{phase4aRuleInactive:true,phase4bRulesInactive:true,traceRemoved:true,debugLevelRemoved:true},checks:{observerTests:4,apexTestsRun:false,applicationChanged:false},evidence:{inspection:'evidencias-fase-4b/inspeccion.json',inventory:'evidencias-fase-4b/inventario.json',rollback:'evidencias-fase-4b/reversion-prueba-lotes.json',rollbackDiagnosis:'evidencias-fase-4b/reversion-comprobacion.json',abort:'evidencias-fase-4b/aborto-1-comprobacion.json',rulesRestored:'evidencias-fase-4b/reglas-inactivas-recibos.json',traceRestored:'evidencias-fase-4b/traza-restaurada.json',preservation:'evidencias-fase-4b/conservacion-final.json',report:'evidencias-fase-4b/informe.json',local:'evidencias-fase-4b/revision-local.json'},limits:['Aborto después de confirmar lotes no demostrado','Errores reales de start y finish no ensayados','Colisión de inserción no demostrada','Medianoche y cambio estacional no ensayados','Sin garantías de rendimiento'],v1Closed:false};
write('docs/evidencias-fase-4b.json',JSON.stringify(aggregate,null,2));
console.log(JSON.stringify({documentation:true,newRecords:finish.newRecords,reportTotal:report.reportTotal}));
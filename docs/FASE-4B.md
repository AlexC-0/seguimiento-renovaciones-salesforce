# Fase 4B — Reversión de lote, aborto y recuperación

Fecha: 24/11/2026. Referencia: abfcba0e7aa682084fc93fb23fe6c0ba9cd9e998. Destino exclusivo p06-renovaciones-dev, Developer Edition, API 65.0. La identidad de Organization y el operador técnico se verificaron contra sus recibos privados. V1 sigue abierta.

## Resultado

Se demostró la reversión completa de un execute al fallar su auditoría, con conservación del otro lote del mismo job. El ensayo independiente obtuvo un aborto antes de comenzar. Ambas recuperaciones manuales completaron las identidades ausentes y conservaron el intento adverso, su diagnóstico y su marca de reconciliación.

| Escenario | Ejecución | Job | Estado del job | Estado de ejecución tras contraste | Evaluados | Creados | Existentes | Fallidos individuales | Lotes fallidos |
|---|---|---|---|---|---:|---:|---:|---:|---:|
| Reversión | a01g700001MNaFJAA1 | 707g700001DaQaQAAV | Completed | Fallida | 5 | 5 | 0 | 0 | 1 |
| Recuperación de reversión | a01g700001MN9gYAAT | 707g700001DZR2MAAX | Completed | Completada | 10 | 5 | 5 | 0 | 0 |
| Aborto | a01g700001MNm3ZAAT | 707g700001DZSWQAA5 | Aborted | Abortada | 0 | 0 | 0 | 0 | 0 |
| Recuperación de aborto | a01g700001MNnNpAAL | 707g700001DaJUFAA3 | Completed | Completada | 10 | 10 | 0 | 0 | 0 |

Corte de los cuatro lanzamientos: 2026-11-24. Fin inclusivo: 2026-12-24. Zona Salesforce: Europe/Paris. Dos conjuntos nuevos e independientes de diez contratos, con tamaño de lote cinco y filtro explícito de IDs. Los omitidos son cero. Cada ejecución conserva su corte, zona, job y resultados; los JSON registran timestamps UTC.

## Reversión completa acreditada

Se activaron dos reglas limitadas al contrato nuevo a00g700002bNoPBAA0. La primera rechaza ISNEW del seguimiento. La segunda añade ISPICKVAL de Etapa__c igual a Creación y rechaza únicamente su incidencia individual. Reconciliación y los demás contratos quedan fuera de esa condición. Las reglas iniciales estaban ausentes; sus definiciones se conservan fuera de force-app y manifest.

El job procesó dos lotes y terminó Completed con NumberOfErrors=1. La [prueba de lotes](evidencias-fase-4b/reversion-prueba-lotes.json) recoge directamente VARIABLE_ASSIGNMENT de alcance en execute, vinculado a la ejecución. Identifica los cinco miembros reales de cada lote sin presuponer orden ni multiplicar errores por tamaño.

En el lote afectado, cuatro SaveResult indicaron éxito tentativo y uno rechazo individual. La posterior inserción de IncidenciaRenovacion falló por P06_F4B_RechazoAuditoria. El log registra SAVEPOINT_ROLLBACK y propagación de DmlException. Una lectura posterior confirma cero seguimientos para esos cinco contratos, ausencia de los cuatro IDs tentativos y ninguna incidencia de Creación persistida. Esos IDs revertidos se documentan como intentos; no se incluyen como registros persistidos en el inventario.

El otro execute conservó cinco seguimientos. La ejecución confirmó Evaluados=5, Creados=5 y cero existentes, omitidos o fallidos individuales. Se cumple la ecuación de resultados confirmados. LotesFallidos=1 tiene unidad lote y no se añade a esa ecuación.

El callback finish dejó Fallida, RequiereReconciliacion=true y una incidencia CONTRASTE_JOB en otra transacción, con estado Completed, dos lotes procesados y un error. La traza de finish y la lectura previa al contraste respaldan ese origen. Los dos contrastes manuales posteriores conservaron resultados, finalización y la única incidencia. [Comprobación](evidencias-fase-4b/reversion-comprobacion.json) y [contraste repetido](evidencias-fase-4b/reversion-fallo-contraste.json).

Completed del trabajo admite errores y se interpreta junto con sus contadores y los datos persistidos. La política local permite actualizar LotesFallidos cuando el resumen Completed es completo y coherente; no reconstruye resultados individuales. Véanse [AsyncApexJob](https://developer.salesforce.com/docs/platform/object-reference/references/standard-objects/object-asyncapexjob.html) y la [política del proyecto](REVISION-FASE-3.md).

## Recuperación del lote revertido

Las dos reglas se desactivaron y su estado se leyó antes de recuperar. La revisión consultó trabajo, ejecución, incidencias y seguimientos. Se prepararon dos seguimientos nuevos ya confirmados: uno Cerrado con nota y otro En curso con nota, para comprobar conservación. Es preparación técnica del ensayo y no una nueva sesión comercial.

La nueva ejecución a01g700001MN9gYAAT creó cinco identidades ausentes y reconoció cinco existentes. Propietario, estado, notas y origen de estos últimos permanecieron iguales; el cerrado no se reabrió. Las nuevas claves coinciden con contrato y fecha capturada. El intento original sigue Fallida y mantiene su diagnóstico y RequiereReconciliacion=true. La relación entre revisión y nuevo intento figura en [recuperación prevista](evidencias-fase-4b/reversion-recuperacion-prevista.json) y [comprobación](evidencias-fase-4b/reversion-recuperacion-comprobacion.json).

## Aborto acotado y recuperación

Se lanzó el conjunto independiente y se consultó exclusivamente el AsyncApexJob vinculado a esa nueva ejecución. ServicioRenovaciones verificó LoteRenovaciones, BatchApex, solicitante y vínculo. System.abortJob recibió únicamente ese Id, dentro de la transacción de lanzamiento. El recibo observó Holding antes y Aborted después; la consulta posterior al commit confirmó Aborted persistido.

El alcance demostrado es **aborto antes de comenzar**: JobItemsProcessed=0, TotalJobItems=0, cero seguimientos y ejecución todavía Encolada. No se acredita aborto a mitad del procesamiento. Se obtuvo en el primer intento y no se preparó un segundo conjunto. [Clasificación y recibo](evidencias-fase-4b/aborto-1-clasificacion.json). El método acepta el Id de AsyncApexJob para Batch según la [referencia de System.abortJob](https://developer.salesforce.com/docs/platform/apex-ref/references/apex-ref/apex-methods-system-system.html).

El observador conservó las lecturas estables y terminó su espera de cierre sin depender de finish. El primer contraste marcó Abortada, RequiereReconciliacion=true y guardó una incidencia CONTRASTE_JOB. Conservó los cinco contadores individuales y LotesFallidos a cero; Aborted no permite atribuir fallos a execute. Finalizacion corresponde al diagnóstico, no a la hora exacta de fin del job. El segundo contraste no hizo cambios ni duplicó la incidencia. [Comprobación](evidencias-fase-4b/aborto-1-comprobacion.json) y [contraste](evidencias-fase-4b/aborto-1-aborto-contraste.json).

La nueva ejecución a01g700001MNnNpAAL creó los diez seguimientos pendientes sin duplicados. No había seguimientos previos cuya conservación pudiera probarse en este escenario; esa comprobación sí se ejecutó en la recuperación de reversión. El job abortado, su ejecución, diagnóstico y marca permanecen intactos. [Revisión previa](evidencias-fase-4b/aborto-1-recuperacion-prevista.json) y [resultado](evidencias-fase-4b/aborto-1-recuperacion-comprobacion.json).

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

Analytics y SOQL, con la misma identidad técnica existente, coinciden en 179 IDs. Aparecen 19 seguimientos nuevos: nueve del conjunto de reversión y diez del abortado. El cerrado queda excluido; En curso aparece. allData=true y consulta SOQL completa. No se atribuye esta lectura a una sesión comercial. [Informe e IDs](evidencias-fase-4b/informe.json).

Los 374 registros anteriores conservan sus campos persistidos y los 82 archivos históricos de evidencia mantienen sus bytes. Se conservan 48 registros nuevos: dos cuentas, veinte contratos, cuatro ejecuciones, veinte seguimientos y dos incidencias de reconciliación. Los intentos fallido y abortado forman parte del inventario. El estado de los contratos nuevos y las historias adversas también se vuelven a comparar al terminar. [Inventario](evidencias-fase-4b/inventario.json) y [conservación final](evidencias-fase-4b/conservacion-final.json).

Las lecturas por inventario usan bloques de hasta 150 IDs y contrastan solicitados, recuperados y unicidad; las consultas paginadas consumen todos los cursores. Las consultas acotadas cotejan COUNT y límite. Se excluyen de la comparación attributes, LastViewedDate, LastReferencedDate y DiasRestantes__c, separando presentación y fórmula temporal de los campos persistidos. Login As=false, usuarios y asignaciones comerciales intactos. Las fuentes de force-app y manifest conservan sus bytes iniciales.

## Procedimientos y límites

scripts/fase-4b contiene inspección, preparación, reglas, traza, observación, contraste, recuperación y comprobación final separados de los históricos. Los recibos completos e identidades quedan en .sf, excluido de Git. Los procedimientos rechazan sobrescribir lanzamientos registrados. Ante interrupción se revisan primero sus recibos y Salesforce, y se desactivan los mecanismos temporales; no se vuelve a ejecutar un ensayo ya terminado.

La [revisión local](evidencias-fase-4b/revision-local.json) registra sintaxis, seis XML de los paquetes temporales, JSON, enlaces, contenido sensible, exclusiones e índice Git vacío. Las cuatro regresiones del observador se ejecutaron antes del ensayo remoto y se verificaron sus hashes al cerrar.

La fase 4B queda comprobada dentro del alcance. Quedan sin evidencia real el aborto después de confirmar lotes, errores de start o finish, colisión de inserción, cruce de medianoche y cambio estacional. No se hicieron pruebas de rendimiento ni se añaden reintentos, programación, LWC, Flow, integraciones o eventos. V1 sigue abierta.

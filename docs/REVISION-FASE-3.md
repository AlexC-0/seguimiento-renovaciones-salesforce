# Revisión acotada de fase 3

## Resultado y alcance

Corrección completada el 24/11/2026 sobre 31528e267a3f2d65ba41015dc1ef9a5838c56195. Se resuelve la discrepancia de fuentes y se completa el diagnóstico compartido por finish y contrastar. Validación y despliegue de tres clases correctos, con 20/20 pruebas. Los 297 registros inventariados, 47 archivos de evidencia anterior y asignaciones comerciales permanecen intactos.

No se relanzaron demostraciones ni se ejecutaron ensayos reales de solapamiento, aborto o fallos inducidos. V1 permanece abierta. La revisión utiliza exclusivamente p06-renovaciones-dev y API 65.0, verificando Organization contra el recibo privado existente antes de cada operación remota.

## Trazabilidad: causa comprobada

Los archivos locales iniciales de IdentidadRenovacion.cls, LoteRenovaciones.cls y ServicioRenovaciones.cls coincidían byte a byte con las huellas de los recibos privados y de despliegue-pruebas.json. Cada uno contenía un CRLF en su última línea; el resto de saltos era LF. Sus blobs Git contienen únicamente LF y tienen un byte menos.

| Clase | Bytes locales originales | Bytes del blob | Línea con CRLF local |
|---|---:|---:|---:|
| IdentidadRenovacion | 2813 | 2812 | 49 |
| LoteRenovaciones | 9717 | 9716 | 182 |
| ServicioRenovaciones | 6317 | 6316 | 111 |
| RenovacionesTest, control | 23632 | 23632 | Ninguna |

core.autocrlf está configurado en true y los atributos text/eol de esos archivos no tienen una asignación explícita. Aplicar los filtros efectivos mediante git hash-object --path y entrada estándar, sin -w, reproduce exactamente los identificadores de los blobs publicados. Esto acredita la conversión de formato que explica las discrepancias; no identifica ni presupone qué editor introdujo el CRLF original. No se cambió configuración Git ni se escribió en el índice o almacén de objetos.

La lectura adicional de ApexClass.Body muestra el mismo contenido de las cuatro clases, con finales LF y sin el último LF presente en los archivos. Sus textos se codificaron como UTF-8 y se guardaron en una carpeta privada separada. Son bytes de la representación Body recibida, no bytes de un ZIP histórico recuperado del despliegue.

Se distinguen tres huellas SHA-256:

1. **Bytes originales:** sin transformar; conservan codificación y finales de línea.
2. **N1:** decodificación UTF-8 estricta y sustitución exclusiva de CRLF por LF. Explica la equivalencia entre archivos locales iniciales y blobs Git.
3. **N2:** N1 más eliminación de exactamente un LF final si existe. Permite contrastar Body remoto. No elimina BOM, espacios ni otros saltos, ni normaliza Unicode.

No se detectaron BOM ni diferencias funcionales en la versión inicial. Las huellas originales se conservan en sus archivos históricos; no se sustituyen para hacerlas coincidir. La [trazabilidad inicial](evidencias-revision-fase-3/trazabilidad-inicial.json) contiene todos los hashes y formatos observados. El [contraste reproducido](evidencias-revision-fase-3/trazabilidad-reproducida.json) reconstruye los formatos observados desde los blobs inmutables y verifica sus huellas. La consulta del 24/11 acredita el estado remoto observado ese día y su equivalencia con los recibos; no constituye una nueva lectura del ZIP enviado el 23/11.

Contraste local reproducible, sin conexión Salesforce ni escritura Git:

```powershell
node scripts/revision-fase-3/verificar-trazabilidad.cjs
```

La corrección funcional posterior sí cambia ServicioRenovaciones y LoteRenovaciones, junto con sus pruebas. Sus nuevas huellas se registran separadamente en [comprobacion-final.json](evidencias-revision-fase-3/comprobacion-final.json), con comparación del contenido remoto después del nuevo despliegue. IdentidadRenovacion no necesita modificación ni despliegue.

## Corrección del diagnóstico

La versión anterior dejaba dos huecos: finish podía marcar reconciliación sin incidencia y contrastar omitía el diagnóstico cuando la marca ya estaba activa. Además, un cierre no persistido podía dejar LotesFallidos desactualizado.

ServicioRenovaciones.finalizar verifica el contexto Batch y comparte aplicarEstadoTrabajo con contrastar. Ambos conservan autorización, solicitante, job vinculado, with sharing, bloqueo de la ejecución y operaciones de negocio USER_MODE. La lectura técnica del job sigue limitada al trabajo del solicitante y añade ExtendedStatus. Se reutiliza el saneamiento existente; no se añaden campos, permisos, eventos, programación, reintentos ni dependencias.

Ante incertidumbre se guarda una incidencia CONTRASTE_JOB con el estado del job, NumberOfErrors, JobItemsProcessed, TotalJobItems, LotesFallidos conservados y detalle saneado. La operación mantiene Fallida o Abortada y RequiereReconciliacion=true. Nunca limpia automáticamente la marca ni reconstruye Evaluados, Creados, YaExistentes, Omitidos o Fallidos.

Una huella SHA-256 versionada de job, estado, sus tres contadores y detalle saneado se guarda en ClaveIntentada__c, exclusivamente para ese tipo de incidencia. La consulta de la huella se hace bajo el bloqueo de la ejecución. Repetir una observación ya registrada no añade incidencia; si tampoco cambia el estado esperado, no hace DML. Un estado, contador o detalle nuevo permite otro diagnóstico. El reloj y los campos que modifica la propia operación no forman parte de la huella. Las incidencias antiguas, incluidas las que no tienen huella, se conservan; la primera observación del formato nuevo añade su diagnóstico una sola vez.

Actualización e inserción comparten savepoint. Si no se puede crear la incidencia, se revierte también el cambio de estado y contadores de lotes, propagando el error. Una Finalizacion ya persistida se conserva; si falta, se registra el momento del diagnóstico, sin presentarlo como hora exacta de finalización del job.

La marca por sí sola solo expresa que hay incertidumbre. El diagnóstico aporta qué se observó y permite revisar cambios posteriores. Un resumen de lotes no permite conocer cuántos contratos se confirmaron o revirtieron dentro de cada transacción; reconstruir resultados multiplicando por el tamaño de lote inventaría información.

## Política de NumberOfErrors

Salesforce define NumberOfErrors como número de lotes con fallo. El estado Completed admite fallos; Failed representa un fallo de sistema y Aborted un aborto. Los campos disponibles no identifican por sí solos la fase concreta de una excepción ni los resultados de cada contrato. [Referencia AsyncApexJob](https://developer.salesforce.com/docs/platform/object-reference/references/standard-objects/object-asyncapexjob.html) y [ciclo Batch Apex](https://developer.salesforce.com/docs/platform/apex-dev/references/apex-dev/apex-batch-interface.html).

La implementación adopta esta política conservadora; sus condiciones son una decisión del proyecto, no una garantía adicional de la plataforma:

| Observación | Tratamiento |
|---|---|
| Holding, Queued, Preparing o Processing en contraste manual | Sin cierre, diagnóstico ni escritura; esperar estado terminal |
| Processing dentro del callback finish vinculado, con resumen completo y coherente | Permite usar NumberOfErrors como fallos de lote informados antes de cerrar; si hay problema, persiste diagnóstico y reconciliación |
| Completed con resumen completo y coherente | Permite actualizar LotesFallidos al máximo entre histórico y NumberOfErrors, también si finish no persistió el cierre |
| Failed o Aborted | Conserva LotesFallidos previo y registra NumberOfErrors como información observada; no atribuye automáticamente esos errores a transacciones execute |
| Contadores ausentes, negativos o incoherentes; resumen incompleto | Conserva LotesFallidos y señala incertidumbre con diagnóstico |
| Completed sin errores, cierre coherente y sin marca ni lotes fallidos históricos | Sin cambios |
| Completed sin errores pero con reconciliación ya marcada, lotes fallidos históricos o cierre ausente | No se convierte en éxito; conserva incertidumbre y registra diagnóstico |

Un resumen completo/coherente exige valores presentes, TotalJobItems y NumberOfErrors no negativos, JobItemsProcessed igual a TotalJobItems y NumberOfErrors no superior a TotalJobItems. No se deducen lotes fallidos mediante la diferencia entre totales y procesados. Un valor posterior menor no reduce LotesFallidos. Cuando la información no es atribuible, cero lotes persistidos no significa cero errores: la marca y la incidencia mantienen visible la incertidumbre.

La excepción interna para Processing solo se usa desde finalizar con el contexto Batch vinculado; contrastar no la usa. El cierre normal conserva el estado Completada con incidencias cuando existen fallos individuales confirmados. Las situaciones adversas reales que permitan contrastar estos límites siguen reservadas a fase 4.

## Pruebas y despliegue

Se conservan los 14 métodos anteriores y se añaden seis regresiones:

| Método | Evidencia |
|---|---|
| marcaPreviaNoSustituyeDiagnostico | Marca previa y diagnóstico antiguo sin huella; añade diagnóstico, conserva historia y cinco contadores; repetir no realiza DML |
| resumenControladoRecuperaLotesYConservaHistoria | Cierre ausente, aumento de lotes según resumen, novedades de error y detalle, ausencia de decremento y conservación de incidencias |
| estadosAmbiguosNoInventanLotes | Failed/Aborted, errores sin scopes, resumen contradictorio y contador desconocido no inventan lotes |
| finishControladoDejaDiagnosticoAntesDelContraste | Camino lógico de finish con error; el contraste terminal añade la nueva observación una sola vez |
| contrasteNoCierraTrabajosActivos | Job real encolado antes de Test.stopTest y cuatro estados activos controlados sin escrituras |
| diagnosticoNoPersistidoRevierteActualizacion | Rechazo real CRUD al insertar incidencia; revierte estado, finalización y marca, propagando la excepción |

Los jobs de estas pruebas son reales dentro del contexto de test y terminan sin errores de plataforma. Los estados adversos y contadores del job se suministran a la lógica privada TestVisible mediante copias en memoria; no se actualiza AsyncApexJob. Los contadores individuales preparados para las aserciones son datos controlados de prueba, no resultados de una nueva demostración. No existe una rama Test.isRunningTest que omita lógica. El usuario y Permission Set adicionales de prueba son transitorios y se revierten al terminar.

| Operación | Recibo | Resultado |
|---|---|---|
| Primera validación | 0Afg700000L6tqXCAR | 19/20; la aserción de rechazo CRUD esperaba DmlException y la plataforma devolvió TypeException |
| Validación final | 0Afg700000L6u8HCAR | Succeeded, checkOnly=true, 3/3 clases, 20/20 pruebas |
| Despliegue | 0Afg700000L6huECAR | Succeeded, checkOnly=false, 3/3 clases, 20/20 pruebas |

Cobertura obtenida para las clases desplegadas: ServicioRenovaciones 95,76 % y LoteRenovaciones 99,20 %. No se presenta la cobertura histórica de IdentidadRenovacion como una nueva medición de este despliegue. Las fuentes remotas de las tres clases coinciden en N2 con el paquete validado; los siete archivos del paquete conservan sus hashes de bytes entre validación y comprobación final.

```powershell
sf project deploy start --target-org p06-renovaciones-dev --api-version 65.0 --manifest manifest/revision-fase-3.xml --dry-run --test-level RunSpecifiedTests --tests RenovacionesTest --wait 1 --json
sf project deploy start --target-org p06-renovaciones-dev --api-version 65.0 --manifest manifest/revision-fase-3.xml --test-level RunSpecifiedTests --tests RenovacionesTest --wait 1 --json
```

## Conservación y reproducción

La inspección inicial capturó los 50 registros históricos y los 247 de fase 3 mediante lecturas por los Id inventariados. La comparación final confirma 297/297 sin cambios en campos persistidos, incluidas auditorías de modificación. Se excluyen attributes, LastViewedDate, LastReferencedDate y la fórmula temporal DiasRestantes. Los 47 archivos históricos de evidencia conservan exactamente los bytes iniciales. Asignaciones comerciales intactas, Login As=false y cero jobs Batch persistentes nuevos durante la revisión.

El cambio preexistente en .forceignore se conserva byte a byte. No se modifican remoto ni historial. Las lecturas iniciales y finales se guardan en estado privado excluido; los resultados públicos no contienen sesiones, credenciales ni logs completos.

```powershell
node scripts/revision-fase-3/inspeccionar.cjs p06-renovaciones-dev antes
node scripts/revision-fase-3/verificar-trazabilidad.cjs
node scripts/revision-fase-3/comprobar.cjs p06-renovaciones-dev
```

La primera orden es la captura inicial ya ejecutada y rechaza sobrescribirla. La segunda reconstruye el formato con la referencia Git sin acceso Salesforce. La tercera requiere los recibos privados de esta revisión y vuelve a consultar clases, registros, asignaciones y configuración; no relanza ni modifica registros de negocio.

## Archivos y límites pendientes

Cambian ServicioRenovaciones.cls, LoteRenovaciones.cls y RenovacionesTest.cls. Se añaden manifest/revision-fase-3.xml, tres scripts de inspección/comprobación y evidencias separadas en docs/evidencias-revision-fase-3. Se actualizan instrucciones, README, estado, entorno, modelo, decisiones y procedimiento de fase 3. IdentidadRenovacion y los JSON históricos permanecen intactos.

Pendientes para fase 4: solapamiento real, abortos, errores reales de start/execute/finish, bloqueo, interrupción de persistencia y recuperación manual adversa. No hay un nuevo recorrido de interfaz comercial ni una demostración de rendimiento. La corrección hace visible el diagnóstico cuando puede persistirse; no garantiza escritura si faltan permisos o falla la plataforma, ni resuelve automáticamente la incertidumbre.

La [revisión local final](evidencias-revision-fase-3/revision-local.json) confirma sintaxis de los tres scripts nuevos, 104 XML bien formados, JSON y enlaces relativos válidos, fuentes validadas intactas, estado privado excluido e índice Git vacío. El contenido público afectado se revisó sin atribuciones de elaboración, relatos personales ni firmas automáticas.

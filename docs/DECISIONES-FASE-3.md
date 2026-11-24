# Decisiones transaccionales de fase 3

## Lanzamiento y autorización

ServicioRenovaciones captura fecha local y zona del solicitante una vez. La creación de ejecución, executeBatch y el registro del identificador real pertenecen a la misma transacción, con rollback y propagación si falla cualquiera. Un permiso personalizado de procesamiento se exige en el servicio, constructor del Batch, start, execute, finish y contraste manual. Cada job debe corresponder a su ejecución y solicitante.

Las clases de servicio y Batch usan with sharing. Las consultas de datos y todo DML de negocio especifican USER_MODE; el operador recibe CRUD/FLS mínimo y compartición P06. No se añade Author Apex a funciones comerciales ni al Permission Set de operador: el script técnico requiere la capacidad ya existente de la cuenta técnica.

## Selección, relectura e identidad

start selecciona contratos Activos entre corte y corte+30 inclusive. Un filtro opcional por Id solo restringe; null significa selección ordinaria y conjunto vacío significa cero. execute relee los contratos en USER_MODE y omite los que ya no son elegibles o no son visibles. No se bloquean contratos: se utiliza el estado observado por esa relectura y no se promete aislamiento ante un cambio posterior concurrente. La identidad conserva la fecha capturada y Aplicable refleja cambios posteriores.

IdentidadRenovacion centraliza Id de 18 caracteres y fecha ISO. El trigger before insert calcula la clave ausente y rechaza la incompatible. Una lectura limitada en modo sistema comprueba parejas previas, incluidas claves históricas no canónicas, sin exponer registros ni modificarlos. Esa excepción de lectura protege la integridad entre ámbitos de sharing; no realiza DML en modo sistema. La restricción única sigue resolviendo carreras sobre la clave canónica.

La consulta previa del Batch se hace en USER_MODE por pareja capturada, no por vencimiento actual de seguimientos anteriores. Un DUPLICATE_VALUE solo se clasifica como ya existente si todos los errores son de duplicado, los campos informados no contradicen la clave única y una reconsulta confirma la misma pareja y clave; una respuesta sin nombre de campo tampoco basta por sí sola. Otros errores, incluidos permisos y bloqueos, no se convierten en éxito.

## Unidad de persistencia

Cada execute bloquea únicamente su ejecución para acumular contadores. La inserción parcial de seguimientos, todas las incidencias y los contadores se confirman juntos. Cada SaveResult y todos sus errores se inspeccionan; fallidos cuenta registros, incidencias puede tener más de una entrada por registro. Los textos se sanean y limitan antes de insertar.

Un fallo al guardar incidencias o contadores revierte también los seguimientos del lote y se propaga. No se intenta registrar un error durable dentro de la transacción que se revierte. Evaluados solo suma creados, existentes, omitidos y fallidos confirmados. LotesFallidos se mantiene separado.

## Cierre y contraste manual

finish consulta el job real y cierra los resultados normales. Si informa lotes fallidos, marca Fallida y RequiereReconciliacion, conservando contadores confirmados. No es la única vía de detección: un contraste manual autorizado compara la ejecución con su AsyncApexJob después de que termine. Ante aborto, fallo o ejecución sin cierre coherente, señala reconciliación y añade contexto sin inventar resultados individuales. No limpia la incertidumbre ni lanza reintentos.

Los ensayos de aborto, fallos excepcionales, solapamiento real y recuperación adversa quedan para la fase siguiente. Las pruebas unitarias con un lote y la demostración real de tres lotes son evidencias separadas.

## Corrección acotada del diagnóstico

Una marca de reconciliación expresa incertidumbre, pero no documenta la observación que la causó. finish y contrastar utilizan ahora aplicarEstadoTrabajo, tras verificar permiso, solicitante, job y bloqueo de la ejecución. El contraste manual retorna sin escritura para trabajos activos. El cierre desde finish exige el contexto vinculado y permite la observación Processing propia de ese callback.

El diagnóstico registra estado, NumberOfErrors, JobItemsProcessed, TotalJobItems, contador de lotes conservado y ExtendedStatus saneado. Una huella SHA-256 versionada de job, estado, sus tres contadores y detalle saneado se guarda en ClaveIntentada__c bajo CodigoError__c=CONTRASTE_JOB. La consulta USER_MODE de esa huella, bajo el bloqueo de la ejecución, evita repetir la observación. No incorpora el reloj ni los campos que la misma operación cambia. Un cambio de esos datos permite otra incidencia; las anteriores, incluidas las que no tienen huella, permanecen intactas.

La actualización usa solo estado, finalización, reconciliación y LotesFallidos; no reescribe resultados individuales. Si falta diagnóstico, actualización e inserción pertenecen al mismo savepoint: cualquier fallo revierte ambas y se propaga. Una observación ya registrada no requiere escrituras si la ejecución conserva el estado esperado. Una finalización existente no se sustituye; una ausente se registra al diagnosticar, sin atribuir esa hora al fin exacto del job.

NumberOfErrors se utiliza como contador de lotes informado solo dentro de la política conservadora de [REVISION-FASE-3.md](REVISION-FASE-3.md). Completed o Processing dentro de finish, con resumen completo y límites coherentes, permiten tomar el máximo histórico. Failed, Aborted o un resumen incompleto/inconsistente conservan el contador anterior y registran la información observada, porque no acreditan la fase de fallo ni resultados individuales. La marca de reconciliación nunca se limpia automáticamente.

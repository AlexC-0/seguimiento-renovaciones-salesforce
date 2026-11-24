# Fase 3 — Lanzamiento manual y procesamiento Batch

La corrección del 24/11/2026 se documenta en [REVISION-FASE-3.md](REVISION-FASE-3.md). Los recibos, conteos y pruebas de la entrega inicial que figuran aquí siguen siendo históricos; la corrección incorpora seis regresiones y no repite la demostración.

## Resultado

Implementación y demostración completadas el 23/11/2026 sobre 0716f9fc41d2b2142a79d9abd495f8236783ce03, en p06-renovaciones-dev, Developer Edition exclusiva P06, API 65.0. V1 sigue abierta: solapamiento real, interrupciones y recuperación adversa requieren la siguiente fase.

El paquete añade ServicioRenovaciones, LoteRenovaciones, IdentidadRenovacion, RenovacionesTest, el trigger ValidarIdentidadRenovacion, P06_ProcesarRenovaciones, P06_OperadorRenovaciones y P06_Operadores. Amplía cuatro contenedores de compartición y la carpeta del informe. Se conservan los cuatro objetos, 35 campos, 21 validaciones y permisos comerciales.

## Funcionamiento y transacciones

ServicioRenovaciones.lanzar captura una sola fecha local y zona del solicitante, crea la ejecución, encola un Batch real y guarda su AsyncApexJobId en una misma transacción. Si cualquiera falla, revierte y propaga la excepción. El tamaño admitido es 1 a 200; la demostración usa 50.

- **start** valida permiso, solicitante y vinculación al job, marca En curso y selecciona contratos Activos entre corte y corte+30 inclusive. El filtro opcional por Id solo restringe: null es selección ordinaria; conjunto vacío selecciona cero.
- **execute** relee cada conjunto en USER_MODE, omite contratos que ya no cumplen y consulta parejas existentes. Crea pendientes con propietario y vencimiento observados; no modifica contratos ni seguimientos anteriores. Bloquea su ejecución para acumular resultados, sin bloquear contratos ni prometer aislamiento absoluto ante cambios posteriores a la relectura.
- **finish** contrasta el job real y cierra como Completada, Completada con incidencias o Fallida con reconciliación. NumberOfErrors informa lotes fallidos; JobItemsProcessed mide lotes, no contratos. finish no garantiza el cierre en todos los abortos o fallos excepcionales, por lo que existe contraste manual independiente.

Un registro rechazado produce un resultado fallido y una incidencia por cada error, conservando los éxitos del mismo lote si sus incidencias y contadores pueden persistirse. Si falla esa persistencia, revierte el lote completo y propaga el error: ni los seguimientos, ni las incidencias, ni sus contadores parciales quedan confirmados. Un error no puede registrarse durablemente dentro de la misma transacción revertida. El job permite detectarlo después; finish o el contraste señalan incertidumbre sin inventar resultados individuales.

Se mantiene evaluados = creados + ya existentes + omitidos + fallidos. LotesFallidos tiene unidad distinta. Los mensajes se sanean y truncan con indicación explícita, inspeccionando todos los SaveResult y sus errores. No hay reintentos automáticos.

IdentidadRenovacion construye Id18|YYYY-MM-DD sin formato regional. El trigger calcula una clave ausente, rechaza incompatibles y protege parejas históricas ya representadas sin reescribirlas. La restricción única sigue siendo la protección frente a carreras. Un DUPLICATE_VALUE solo se interpreta como existente tras confirmar la misma pareja y clave; otros errores no se convierten en éxito.

Las [decisiones transaccionales](DECISIONES-FASE-3.md) justifican with sharing, USER_MODE y las dos lecturas técnicas limitadas en modo sistema: integridad de parejas y metadatos del job vinculado. No se realiza DML de negocio en modo sistema.

## Pruebas automatizadas

RenovacionesTest contiene 14 métodos con datos propios y usuarios transitorios revertidos al terminar; no utiliza los fixtures de negocio de la organización ni SeeAllData. Cada prueba Batch ejecuta como máximo un lote. Los puntos TestVisible ejercitan procesamiento y resultados con DML real, sin saltarse la lógica en tests.

| Grupo | Comprobaciones |
|---|---|
| Selección y contexto | Ayer, hoy, +30, +31, estados excluidos, zona Pacific/Kiritimati, corte conservado, cero candidatos y filtro vacío |
| Identidad | Id de 15 normalizado a 18, clave ausente, clave incompatible y alternativa en minúsculas, duplicado exacto y confirmación posterior |
| Conservación | Seguimiento cerrado con nota, propietario, clave y ejecución de origen preservados |
| Relectura | Cambios de estado y fecha excluyen candidatos; se conserva el corte capturado |
| Resultados | Éxito y fallo individual juntos, incidencias con contexto, ecuación de contadores |
| Atomicidad del lote | Un error al guardar contadores revierte los seguimientos e incidencias insertados |
| Atomicidad del lanzamiento | FLS permite crear ejecución y encolar, pero impide guardar el job: se revierten ejecución y trabajo |
| Autorización | Servicio, constructor, start, execute, finish y contraste rechazan falta de permiso; permiso personalizado sin CRUD tampoco basta |
| Trazabilidad | Job real vinculado, inmutabilidad tras asignación, contraste normal y detección controlada de cierre incoherente sin inventar contadores |
| Mensajes | Saneamiento y límites de 255 y 32768 caracteres |

Resultado final: 14/14 en validación y 14/14 en despliegue. Cobertura por componente: ServicioRenovaciones 92,31 %; LoteRenovaciones 96,99 %; IdentidadRenovacion 91,18 %; trigger 100 %. Es cobertura de líneas de estas pruebas, no evidencia de concurrencia ni recuperación adversa real.

## Validación y despliegue

| Operación final | Id | Estado |
|---|---|---|
| Validación | 0Afg700000L0MUHCA3 | Succeeded, checkOnly=true, 14 pruebas correctas |
| Despliegue | 0Afg700000L0NQLCA3 | Succeeded, checkOnly=false, 14 pruebas correctas |

manifest/fase-3.xml contiene 13 miembros explícitos; Salesforce procesó 21 componentes al desglosar contenedores de compartición. Las huellas originales registran los bytes locales de los 19 archivos del paquete. El [contraste posterior](REVISION-FASE-3.md) explica las diferencias de formato con los blobs Git y Body remoto sin sustituir esas huellas. No hay componentes destructivos ni errores ignorados.

Los intentos anteriores se conservan separados en [despliegue-pruebas.json](evidencias-fase-3/despliegue-pruebas.json): corrección de nombres de excepciones, clasificación de duplicados, saneamiento de mensajes largos, cobertura y aserciones de la prueba de rollback después de encolar. La validación intermedia 0Afg700000L0C1tCAF fue correcta antes de reforzar esa prueba; no sustituye la validación final. El primer intento de despliegue 0Afg700000L0NADCA3 falló por un nombre incorrecto de clase en el comando, ejecutó cero pruebas y revirtió el paquete por cobertura insuficiente.

Comandos finales utilizados:

```powershell
sf project deploy start --target-org p06-renovaciones-dev --manifest manifest/fase-3.xml --dry-run --test-level RunSpecifiedTests --tests RenovacionesTest --wait 1 --json
sf project deploy start --target-org p06-renovaciones-dev --manifest manifest/fase-3.xml --test-level RunSpecifiedTests --tests RenovacionesTest --wait 1 --json
```

## Demostración real

Se inventarió una cuenta nueva y 124 contratos propiedad del comercial B: 120 Activos elegibles, un vencido ayer, uno a +31, un Inactivo y un Borrador. El filtro incluyó exactamente esos 124 Id; no alcanzó contratos históricos. Se registraron candidatos, Id, conteos y hash del script antes de cada lanzamiento.

Corte 23/11/2026, zona real del solicitante Europe/Paris y fin 23/12/2026. Tamaño máximo por lote 50.

| Resultado | Primer lanzamiento | Repetición |
|---|---|---|
| Ejecución | a01g700001M1lNuAAJ | a01g700001M1rWXAAZ |
| Job real | 707g700001DKOHsAAP | 707g700001DLwdpAAD |
| Job / ejecución | Completed / Completada | Completed / Completada |
| Lotes procesados / totales | 3 / 3 | 3 / 3 |
| Evaluados | 120 | 120 |
| Creados | 120 | 0 |
| Ya existentes | 0 | 120 |
| Omitidos / fallidos / lotes fallidos | 0 / 0 / 0 | 0 / 0 / 0 |
| Seguimientos del conjunto al terminar | 120 | 120 |
| Incidencias / reconciliación | 0 / false | 0 / false |

Antes de repetir se prepararon técnicamente dos seguimientos nuevos: uno Cerrado con nota y otro En curso con nota. Esta preparación no acredita una operación desde una nueva sesión comercial. La comparación posterior de los 120 registros confirmó que la repetición no modificó datos persistidos, incluidos notas, estado, propietario y ejecución de origen. Resultado final: 118 Pendientes, uno En curso y uno Cerrado. Los 124 contratos conservan estado, vencimiento, cuenta y propietario previstos.

Dos contrastes manuales sobre los jobs terminados confirmaron el cierre normal. No se abortaron trabajos ni se indujeron fallos reales para simular recuperación en esta demostración.

## Acceso, informe y conservación

P06_OperadorRenovaciones y P06_Operadores solo se asignaron a la cuenta técnica existente. No se añadieron Author Apex ni permisos administrativos globales y no se alteraron asignaciones de A/B. La cuenta técnica conserva su perfil administrativo previo: el ensayo real no acredita ejecución de Apex anónimo con el Permission Set aislado.

UserRecordAccess confirma lectura y edición de los 120 seguimientos para A y B, lectura de los 120 contratos para ambos y edición de contratos solo para A. Ninguno puede eliminar esos registros. Informe y SOQL, bajo la misma cuenta técnica, coinciden exactamente en 126 registros: siete anteriores y 119 nuevos. El cerrado nuevo queda excluido y el En curso aparece. No se ejecutó de nuevo el informe en sesiones A/B; las evidencias de esas sesiones pertenecen a fase 2. Login As permanece false.

Se conservan 50/50 registros históricos sin cambios en campos persistidos y 34/34 archivos de evidencia histórica sin cambios de contenido. La comparación excluye LastViewedDate, LastReferencedDate y la fórmula temporal DiasRestantes; incluye los campos de auditoría de modificación. El inventario nuevo contiene 247 registros: una cuenta, 124 contratos, dos ejecuciones y 120 seguimientos. No se borró ningún registro.

## Procedimiento de lanzamiento manual

1. Verificar destino exclusivo y cuenta técnica contra los recibos locales. Los scripts Node de fase 3 lo hacen mediante connectP06; conservar explícitamente p06-renovaciones-dev en cada comando.
2. Confirmar permiso P06_ProcesarRenovaciones, CRUD/FLS y visibilidad de los registros. Ejecutar Apex anónimo requiere las capacidades técnicas previas; no concederlas a funciones comerciales.
3. Copiar scripts/fase-3/lanzar-renovaciones.apex a un archivo local excluido de Git. Informar Id reales del ámbito autorizado. La plantilla vacía selecciona cero. El lanzamiento ordinario sin filtro usa ServicioRenovaciones.lanzar(50) y debe revisarse porque puede seleccionar cualquier contrato visible que cumpla las reglas.
4. Ejecutar el archivo con destino explícito. Conservar el recibo de ejecución, job, corte, zona, alcance y tamaño. No repetir si el estado de una respuesta es incierto: localizar primero la ejecución y el job reales.
5. Esperar estado terminal y contrastar resultados persistidos. No usar JobItemsProcessed como número de contratos.

```powershell
sf apex run --target-org p06-renovaciones-dev --api-version 65.0 --file .sf/p06-fase-3/lanzamiento-manual.apex --debug-level DEBUGONLY --json
```

La demostración utiliza preparar-demostracion.cjs, preparar-lanzamiento.cjs, comprobar-lanzamiento.cjs y preparar-repeticion.cjs. Estos guardan estado privado y rechazan preparaciones o lanzamientos ya inventariados; no son un mecanismo de reintento ni deben reutilizarse borrando sus recibos. conservar.cjs impide sobrescribir la instantánea inicial. Los scripts no crean usuarios.

## Contraste y revisión manual

1. Copiar scripts/fase-3/contrastar-ejecucion.apex a un archivo local y sustituir null por el Id real de una ejecución del solicitante actual. La plantilla sin Id rechaza la ejecución.
2. Ejecutarlo con sf apex run, API 65.0 y destino p06-renovaciones-dev, igual que el lanzamiento. Consulta el job vinculado, su clase, solicitante, estado y contadores de lotes.
3. Si el job está en curso, el contraste no lo cierra. Si está terminado, el cierre es coherente y no hay incertidumbre, no cambia datos. Ante un problema, la versión corregida registra diagnóstico incluso si RequiereReconciliacion ya estaba activa. Repetir una observación no crea otra incidencia; novedades de estado, contadores del job o detalle saneado sí pueden registrarse. Se conserva la historia y se actualiza Fallida o Abortada con atomicidad entre modificación e incidencia.
4. Revisar las incidencias y los seguimientos realmente persistidos por ejecución y pareja. Conservar contadores individuales confirmados. Para LotesFallidos se aplica la [política por estado del job](REVISION-FASE-3.md): un resumen completo admitido permite aumentar el contador mediante máximo; un origen o resumen ambiguo conserva el valor previo y deja diagnóstico. No se deducen fallos restando lotes procesados a totales ni multiplicando por tamaño de lote.
5. No relanzar automáticamente ni borrar historia. La recuperación exige revisión explícita y un nuevo lanzamiento autorizado; el método no limpia la incertidumbre ni altera seguimientos anteriores. Si falla el propio contraste, conservar el error y revisar el job por separado; no se garantiza escritura durable cuando la plataforma o los permisos la impiden.

## Límites y siguiente fase

- Demostrados varios lotes y repetición consecutiva; no solapamiento real, colisiones simultáneas, bloqueos forzados, rendimiento general ni escalabilidad.
- Corte y zona se verifican con aserciones; no hubo cruce real de medianoche ni transición estacional durante los jobs.
- Relectura sin bloqueo de contratos: usa el estado observado y no garantiza aislamiento frente a cambios posteriores.
- Fallos parciales, rollback y cierre incoherente cubiertos en pruebas unitarias. Fallos reales de start, execute o finish, abortos y recuperación adversa siguen pendientes.
- Acceso a registros auditado para A/B; informe ejecutado con la cuenta técnica, sin nueva sesión comercial en fase 3.
- La protección de parejas históricas no canónicas conserva los datos; la inspección encontró los 17 seguimientos anteriores canónicos, por lo que no se hizo una migración ni un ensayo con historia no canónica persistente.

La siguiente fase debe ensayar solapamiento real, fallos adversos y recuperación manual conservando estos recibos e inventarios. Los resultados de fase 3 no cierran V1.

## Archivos y evidencias

Cambios de implementación: clases y trigger nuevos, permiso personalizado, Permission Set, grupo, cuatro sharingRules, carpeta del informe y manifest/fase-3.xml. Scripts en scripts/fase-3. Documentación actualizada: AGENTS.md, README, STATUS, modelo, acceso, entorno, definición y uso; decisiones y resultados de fase 3 nuevos.

[evidencias-fase-3.json](evidencias-fase-3.json) enlaza validación y despliegue, candidatos previos, conjunto, ambos resultados, muestras editadas, inventario, contraste manual, acceso/informe y conservación. No incluye autenticación ni logs completos. La revisión editorial mantiene redacción técnica, sin atribuciones de elaboración ni firmas automáticas.

La revisión local confirmó nueve scripts Node con sintaxis válida, 103 XML bien formados con namespace Metadata API, JSON legibles y 43 enlaces relativos válidos en los documentos afectados. Git conserva main y la referencia inicial, con índice vacío. El estado privado permanece excluido. [Recibo de revisión](evidencias-fase-3/revision-local.json).

# Definición del proyecto

## Objetivo y alcance

Preparar seguimiento comercial sobre contratos ficticios próximos a vencer en Salesforce, con trazabilidad de ejecuciones e incidencias y protección frente a duplicados.

La V1 utiliza Account y User estándar y cuatro objetos propios: ContratoComercial__c, SeguimientoRenovacion__c, EjecucionRenovacion__c e IncidenciaRenovacion__c. El [modelo técnico](MODELO_DATOS.md) concentra campos, relaciones, validaciones y diseño de acceso.

Se utilizarán páginas, listas e informes estándar. Se excluyen LWC, Flow, integraciones, comunicaciones externas, renovación automática, programación y reintentos automáticos. No se presuponen licencias adicionales ni usuarios de prueba suficientes.

## Selección y ventana

El lanzamiento de fase 3 fija una sola fecha de corte a partir de la fecha local del solicitante y conserva su TimeZoneSidKey. La ventana es `[fecha de corte, fecha de corte + 30 días]`: ambos extremos incluidos, 31 fechas de calendario. No es una duración de 720 horas.

Solo serán elegibles contratos Activos con vencimiento dentro de esa ventana. Los datos actuales se releerán antes de crear seguimientos de cada lote, usando siempre el corte original. Los contratos que entren después de la selección inicial podrán recogerse en otra ejecución. El procesamiento no recalculará el corte entre lotes ni al cruzar medianoche.

La relectura reduce la obsolescencia; no demuestra por sí sola aislamiento frente a cambios concurrentes. La política transaccional y sus pruebas se implementarán con el Batch.

## Identidad y cambios

La identidad prevista será `IdContrato18|YYYY-MM-DD`, de 29 caracteres. El Id se normalizará a 18 caracteres y la fecha se formará sin depender de la configuración regional. Responsable y ejecución quedan fuera de la clave.

El campo obligatorio y único está definido en metadatos. La fase 3 incorpora generación canónica y protección before insert: calcula la clave ausente y rechaza otra representación incompatible de la pareja. La unicidad del campo no demuestra la idempotencia del sistema completo.

La repetición y el solapamiento no deberán sobrescribir estado, notas, propietario ni ejecución de origen de un seguimiento existente. Los conflictos de unicidad deberán distinguir una identidad ya persistida de otros errores.

Un cambio de vencimiento conserva el seguimiento anterior y puede generar otro para la fecha nueva si es elegible. Restaurar una fecha anterior reutiliza su identidad sin crear otro seguimiento ni reabrirlo automáticamente. Un cambio de propietario del contrato afecta solo a la asignación inicial de seguimientos nuevos; los existentes se reasignan de forma explícita.

## Aplicabilidad y estados

Un seguimiento es aplicable cuando su contrato está Activo y el vencimiento capturado coincide con el vencimiento actual. No se incluye TODAY en esta condición: un pendiente aplicable ya vencido continúa visible como atrasado.

Los seguimientos se crean en Pendiente. Se permite pasar de Pendiente a En curso, Cerrado o Descartado; desde En curso solo a Cerrado o Descartado. Cerrado y Descartado son terminales. Cerrar o descartar requiere una nota con contenido. Mantener el mismo estado permite editar notas sin vaciarlas en estados terminales; la reasignación autorizada también es explícita. Cerrar un seguimiento no renueva ni modifica el contrato.

## Resultados e incidencias

En cada actualización persistida debe cumplirse:

`evaluados = creados + ya existentes + omitidos + fallidos`

Los contadores representan resultados confirmados por registro, no intentos en memoria. Los lotes completamente revertidos se contabilizan aparte y no permiten inferir cuántos resultados individuales se persistieron. finish y el contraste manual señalan reconciliación ante incertidumbre. Las pruebas verifican rollback y señalización de un cierre incoherente; la fase 4A demuestra rechazo individual y recuperación mediante otra ejecución. Interrupciones y reversión total de un lote siguen sin ensayo real.

La recuperación será manual, con revisión de resultados persistidos, incidencias y estado del trabajo antes de decidir un nuevo lanzamiento. No se inventarán resultados ni se alterarán evidencias anteriores para cuadrar contadores. La resolución de una incertidumbre podrá dejar constancia en una nueva incidencia de reconciliación sin borrar el contador histórico de lotes fallidos.

## Criterios de aceptación funcional

La tabla define la aceptación integral de V1. Fase 1B comprobó el modelo declarativo con 117 casos; fase 2 comprobó las funciones comerciales de AC-14, las denegaciones ordinarias de AC-15, el informe AC-16 y la conservación de AC-17. Fase 3 incorpora operador, procesamiento, identidad y repetición, con pruebas unitarias y dos jobs reales de tres lotes. [FASE-3.md](FASE-3.md) conserva esa evidencia histórica. [FASE-4A.md](FASE-4A.md) añade solapamiento observado, rechazo individual y recuperación manual. La colisión de inserción, el cruce real de medianoche, el cambio estacional y las interrupciones siguen sin demostración real; no se equipara esta cobertura con la aceptación completa de V1.

| ID | Escenario | Resultado exigido |
|---|---|---|
| AC-01 | Vencimientos en corte − 1, corte, corte + 30 y corte + 31 | Solo los dos límites interiores se seleccionan; Borrador e Inactivo quedan fuera |
| AC-02 | Fechas, estados y campos obligatorios inválidos | Salesforce rechaza los valores incompatibles y conserva datos válidos |
| AC-03 | Varios lotes y cruce de medianoche | Mismo corte y zona de referencia; relectura de cada lote antes de crear |
| AC-04 | Cambio de estado o fecha tras la selección | Se reevalúa elegibilidad; entradas posteriores pueden esperar a otra ejecución |
| AC-05 | Repetición con seguimientos ya editados o cerrados | No hay duplicados ni cambios en notas, estado, propietario u origen |
| AC-06 | Dos ejecuciones solapadas | Una sola identidad persistida por pareja; conflicto de unicidad tratado sin ocultar otros fallos |
| AC-07 | Fallos individuales junto a registros válidos | Se conservan resultados confirmados, incidencias y ecuación de contadores |
| AC-08 | Reversión completa de un lote | Error de lote diferenciado, sin resultados individuales inventados y con reconciliación identificada |
| AC-09 | Recuperación manual tras fallo o aborto | Verificación de datos y job; nuevo intento explícito sin reintentos automáticos ni pérdida de evidencias |
| AC-10 | Cambio de vencimiento y restauración del anterior | Historia conservada; fecha nueva elegible puede crear seguimiento; fecha restaurada no duplica ni reabre |
| AC-11 | Cambio de responsable | Los seguimientos anteriores conservan propietario; los nuevos toman el responsable actual |
| AC-12 | Transiciones, cierre y descarte | Solo transiciones previstas; nota no vacía; estados terminales no reabiertos |
| AC-13 | Cambio de aplicabilidad y paso del tiempo | Estado/fecha del contrato recalculan aplicabilidad; un pendiente aplicable vencido sigue atrasado |
| AC-14 | Acceso por comercial, coordinación y operador | CRUD, campos, registros y reasignación se ajustan a la matriz; acceso ajeno denegado |
| AC-15 | Identidad, origen, incidencias y eliminación | Se rechaza alterar referencias protegidas; permisos ordinarios no borran historia; se comprueban restricciones lookup |
| AC-16 | Informe operativo | Muestra Pendiente y En curso aplicables, incluidos atrasados, con responsable y días restantes; respeta acceso |
| AC-17 | Conservación entre sesiones | Datos ficticios, ejecuciones e incidencias siguen disponibles y las evidencias no contienen secretos |
| AC-18 | Claves mal formadas o distintas para la misma pareja | La protección canónica rechaza la inconsistencia; la aceptación integral exige verificar además inserción concurrente |
| AC-19 | Permisos de lanzamiento | Solo el operador autorizado lanza y consulta; los comerciales carecen de Author Apex |
| AC-20 | Zona horaria y cambio horario estacional | Corte coherente con la referencia capturada; los días de calendario no se convierten en intervalos horarios fijos |

## Cobertura añadida en fase 4A

| Criterio | Evidencia real añadida | Límite |
|---|---|---|
| AC-05 | Recuperación reconoce cuatro existentes y conserva propietario, origen, notas y estado, incluido Cerrado | Conjunto de cinco contratos |
| AC-06 | Dos jobs Processing en las mismas consultas; 30 parejas con un seguimiento cada una | Colisión de inserción y errores reales de bloqueo/acceso no acreditados |
| AC-07 | Un execute: cuatro creaciones y un rechazo, una incidencia, ecuación correcta y cero lotes fallidos | Rechazo individual por regla limitada a un Id |
| AC-09 | Lectura previa, causa desactivada, nueva ejecución crea solo el pendiente; historia y contraste conservados | No cubre aborto ni recuperación de lote totalmente revertido |
| AC-16 | Analytics y SOQL coinciden en 160 IDs, con 34 nuevos incluidos y un cerrado excluido | Cuenta técnica; no es una nueva sesión comercial |
| AC-17 | 297 registros anteriores y 51 evidencias intactos, 77 nuevos conservados | Campos temporales y de visualización separados |
| AC-18 | Claves canónicas del conjunto solapado coinciden con las parejas capturadas | Inserción concurrente sobre la misma identidad no demostrada |

AC-08, cruce real de medianoche de AC-03 y cambio estacional de AC-20 siguen pendientes de evidencia real. Tres regresiones locales verifican el observador del ensayo; las 20 pruebas Apex son el resultado histórico de la revisión de fase 3 y no se repitieron. V1 sigue abierta.

## Límites de fase 1A

Se preparan metadatos locales y diseño de seguridad. No se implementan Batch, servicio de lanzamiento, triggers, generación de clave, reconciliación, datos, permisos completos ni informe. La compilación, el despliegue y la comprobación funcional requieren un entorno dedicado y una fase posterior.

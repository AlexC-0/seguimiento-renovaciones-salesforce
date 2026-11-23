# Modelo de datos y acceso

## Convenciones

Modelo de fase 1A corregido, validado y desplegado en fase 1B; acceso comercial y dos reglas de reasignación añadidos en fase 2. Los cuatro objetos usan propietario independiente y visibilidad interna y externa `Private` en sus metadatos. No hay relaciones master-detail ni borrado en cascada.

Los nombres API de estados coinciden con sus etiquetas, incluidos espacios y acentos. Las listas son restringidas. Los valores no indicados como iniciales no se rellenan automáticamente. No se crean campos económicos ni objetos adicionales.

Cada objeto conserva los campos estándar Id, Name, OwnerId y auditoría de creación/modificación. Name es autonumérico: `CON-{000000}`, `SEG-{000000}`, `EJE-{000000}` e `INC-{000000}`. Los números son legibles; no sustituyen la identidad funcional ni garantizan una secuencia sin huecos. OwnerId es obligatorio por la plataforma. En contrato y seguimiento una validación limita su prefijo a usuarios `005`; no se configura ninguna cola.

## Diccionario de campos

La obligatoriedad declarativa se aplica al dato, no solo a la página. Las fórmulas son de solo lectura. Los campos numéricos persistidos son enteros `Number(18,0)`, obligatorios, con valor inicial 0.

### ContratoComercial__c

| Campo | Tipo | Obligatorio / inicial | Definición |
|---|---|---|---|
| `Cuenta__c` | Lookup → Account | Sí | Cuenta. Restrict impide borrar el padre mientras existan referencias activas. |
| `FechaInicio__c` | Date | Sí | Fecha de inicio |
| `FechaVencimiento__c` | Date | Sí | Fecha de vencimiento |
| `Estado__c` | Picklist | Sí; Borrador | Borrador, Activo, Inactivo |

### SeguimientoRenovacion__c

| Campo | Tipo | Obligatorio / inicial | Definición |
|---|---|---|---|
| `Contrato__c` | Lookup → ContratoComercial__c | Sí | Contrato. Restrict impide borrar el padre mientras existan referencias activas. |
| `FechaVencimientoCapturada__c` | Date | Sí | Vencimiento capturado |
| `ClaveIdentidad__c` | Text(29) | Sí | Identidad prevista: Id de contrato de 18 caracteres, separador \| y fecha YYYY-MM-DD. La generación y comprobación canónica mediante Apex están pendientes. |
| `Estado__c` | Picklist | Sí; Pendiente | Pendiente, En curso, Cerrado, Descartado |
| `Notas__c` | TextArea(255) | No | Nota comercial breve de hasta 255 caracteres. Obligatoria y no vacía al cerrar o descartar. |
| `Ejecucion__c` | Lookup → EjecucionRenovacion__c | Sí | Ejecución de origen. Restrict impide borrar el padre mientras existan referencias activas. |
| `Aplicable__c` | Fórmula Checkbox | Calculado | Activo y mismo vencimiento. No depende de la fecha actual ni del estado del seguimiento. |
| `DiasRestantes__c` | Fórmula Number(9,0) | Calculado | Días naturales hasta el vencimiento capturado: cero vence hoy; negativo indica atraso. TODAY depende del contexto de consulta. |

### EjecucionRenovacion__c

| Campo | Tipo | Obligatorio / inicial | Definición |
|---|---|---|---|
| `FechaCorte__c` | Date | Sí | Fecha de corte |
| `InicioVentana__c` | Date | Sí | Inicio de ventana |
| `FinVentana__c` | Date | Sí | Fin de ventana |
| `ZonaHoraria__c` | Text(80) | Sí | TimeZoneSidKey del solicitante capturada al lanzar. No cambia durante la ejecución. |
| `Solicitante__c` | Lookup → User | Sí, por validación | SolicitanteObligatorio rechaza el valor vacío; ContextoInmutable impide cambiarlo después de crear. Sin restricción de eliminación ni cascada sobre User. |
| `AsyncApexJobId__c` | Text(18) | No | Id de 18 caracteres devuelto por el futuro lanzamiento. Vacío hasta conocerlo; no es una relación ni acredita existencia del job. |
| `Inicio__c` | DateTime | Sí; NOW() | Instante de registro del lanzamiento, incluida la espera en cola. No mide exclusivamente el procesamiento del Batch. |
| `Finalizacion__c` | DateTime | No | Finalización |
| `Estado__c` | Picklist | Sí; Encolada | Encolada, En curso, Completada, Completada con incidencias, Fallida, Abortada |
| `Evaluados__c` | Number(18,0) | Sí; 0 | Registros con resultado confirmado y persistido. No incluye resultados desconocidos de lotes revertidos. |
| `Creados__c` | Number(18,0) | Sí; 0 | Seguimientos cuya creación se confirmó. |
| `YaExistentes__c` | Number(18,0) | Sí; 0 | Identidades ya presentes, sin sobrescribir sus datos. |
| `Omitidos__c` | Number(18,0) | Sí; 0 | Registros cuyo descarte se confirmó tras la relectura. |
| `Fallidos__c` | Number(18,0) | Sí; 0 | Registros con fallo individual confirmado. No es el número de lotes fallidos. |
| `LotesFallidos__c` | Number(18,0) | Sí; 0 | Lotes completamente revertidos cuya ocurrencia se confirmó. No se suma a Evaluados ni a Fallidos. |
| `RequiereReconciliacion__c` | Checkbox | No; false | Indica resultados incompletos o inciertos pendientes de revisión manual. El futuro procesamiento deberá marcarlo cuando proceda. |

### IncidenciaRenovacion__c

| Campo | Tipo | Obligatorio / inicial | Definición |
|---|---|---|---|
| `Ejecucion__c` | Lookup → EjecucionRenovacion__c | Sí | Ejecución. Restrict impide borrar el padre mientras existan referencias activas. |
| `Contrato__c` | Lookup → ContratoComercial__c | No | Contrato. Restrict impide borrar el padre mientras existan referencias activas. |
| `ClaveIntentada__c` | Text(255) | No | Valor intentado, si se conoce. Puede ser inválido y no está sujeto a la unicidad de los seguimientos. |
| `Etapa__c` | Picklist | Sí | Selección, Relectura, Creación, Lote, Finalización, Reconciliación. Etapa en la que se detectó la incidencia; sin valor inicial para evitar atribuciones incorrectas. |
| `CodigoError__c` | Text(255) | Sí | Código de error |
| `Mensaje__c` | LongTextArea(32768) | Sí, por validación | Detalle técnico sin secretos. Su presencia se exige mediante validación; el procesamiento deberá respetar el límite de longitud. |
| `CamposAfectados__c` | Text(255) | No | Nombres API separados por punto y coma, cuando estén disponibles. El procesamiento deberá gestionar el límite sin perder el registro de incidencia. |

## Relaciones y conservación

- Cuenta → contrato: lookup obligatorio con Restrict.
- Contrato → seguimiento: lookup obligatorio con Restrict.
- Ejecución → seguimiento e incidencia: lookups obligatorios con Restrict.
- Contrato → incidencia: lookup opcional con Restrict; se informa cuando se conoce el contrato.
- Usuario → ejecución: solicitante obligatorio mediante validación. El lookup declara required=false y omite deleteConstraint porque Salesforce rechaza la combinación de obligatoriedad universal y restricciones de eliminación sobre User. La regla SolicitanteObligatorio rechaza el valor vacío en cada guardado y ContextoInmutable conserva el solicitante original.

Los lookups no comparten propietario ni conceden acceso automáticamente al padre. La relación de origen de un seguimiento es obligatoria y no se puede cambiar; repetir una ejecución no religa seguimientos existentes.

Restrict protege referencias activas, pero no sustituye la retirada del permiso Delete. La propia eliminación de seguimientos, incidencias y ejecuciones debe impedirse mediante los permisos ordinarios de la fase de acceso. Las reglas de validación no interceptan eliminaciones. También deben probarse las particularidades de registros en la papelera antes de atribuir conservación completa. Véanse [relaciones y eliminación](https://help.salesforce.com/s/articleView?id=platform.overview_of_custom_object_relationships.htm&language=en_US&type=5) y [User](https://developer.salesforce.com/docs/platform/object-reference/references/standard-objects/object-user.html).

## Decisiones sobre identidad y textos

`ClaveIdentidad__c` es Text(29), obligatoria, única y sin distinción de mayúsculas. No es External ID: no se prevé upsert comercial ni integración. La futura representación canónica será Id de 18 caracteres, separador `|` y vencimiento ISO. La validación actual impide modificar contrato, fecha capturada, clave y ejecución después de insertar; no calcula ni valida esa representación al insertar.

`Notas__c` es TextArea de 255 caracteres para una nota comercial breve. `Mensaje__c` admite 32.768 caracteres para diagnóstico técnico y requiere contenido mediante una validación. El resto de textos de incidencia admite 255 caracteres; la clave intentada puede ser incorrecta y por eso admite más que la clave válida. La fase de procesamiento deberá gestionar longitudes y saneamiento de mensajes sin exponer secretos ni perder incidencias por un segundo error de registro. No se ha implementado ese tratamiento.

## Fórmulas

`Aplicable__c` combina contrato Activo y coincidencia de fechas. No depende del estado del seguimiento ni de TODAY. El informe operativo añade `Estado__c IN ('Pendiente', 'En curso')` y `Aplicable__c = true`.

`DiasRestantes__c = FechaVencimientoCapturada__c - TODAY()`: positivo antes del vencimiento, cero ese día y negativo tras vencer. Es información dinámica del contexto de consulta, no evidencia congelada ni criterio de selección del Batch. La zona del usuario que consulta puede diferir de la zona capturada al lanzar. La fecha de corte persistida de la ejecución permanece fija.

## Ejecución y reconciliación

Inicio representa el registro del lanzamiento, incluida la espera en cola; su valor inicial es NOW. Finalización queda vacía mientras la ejecución está Encolada o En curso y es obligatoria en los estados finales, nunca anterior a Inicio.

La fecha de corte, sus dos límites, la zona horaria, el solicitante y el inicio no pueden cambiar tras crear la ejecución. AsyncApexJobId puede asignarse una vez; es texto, no lookup y no valida que exista un trabajo real. El estado inicial es Encolada. El futuro servicio debe registrar el lanzamiento antes de encolar y completar el identificador de forma coherente con la transacción.

Los seis contadores son no negativos. Cinco corresponden a resultados confirmados por registro; LotesFallidos tiene unidad lote. La igualdad de resultados se exige en cada guardado: el futuro código debe actualizar los contadores de forma conjunta y transaccional. Una ejecución con fallos o reconciliación pendiente no puede presentarse como Completada.

RequiereReconciliacion parte de false y debe activarse ante incertidumbre; no hay automatismo en esta fase. Un lote fallido histórico puede seguir registrado tras resolver la incertidumbre, por lo que el indicador no se calcula a partir del contador. No se congela todavía el conjunto de resultados finales ni se implementa el ciclo completo de estados de ejecución: la reconciliación deberá poder añadir información confirmada sin reescribir el contexto de lanzamiento.

Las incidencias son anexos inmutables: cualquier actualización se rechaza. Una aclaración se guarda como otra incidencia de etapa Reconciliación. No se obliga a informar contrato o clave cuando el error sea de selección, lote o finalización y no se conozcan.

## Validaciones desplegadas

| Objeto | Reglas del modelo |
|---|---|
| Contrato | Vencimiento no anterior a inicio; propietario usuario |
| Seguimiento | Propietario usuario; creación en Pendiente; transiciones permitidas; nota con contenido en estados terminales; identidad y origen inmutables |
| Ejecución | Ventana exacta; solicitante obligatorio; contexto inmutable; job asignable una vez; finalización coherente y ajustada al estado; contadores no negativos; igualdad de resultados; creación Encolada; Completada sin errores ni reconciliación |
| Incidencia | Mensaje con contenido; rechazo de toda actualización |

Las listas restringidas y la obligatoriedad de los campos complementan estas 19 reglas activas. Salesforce aceptó y desplegó los 58 componentes del modelo. Los bloques anónimos verificaron 117 casos declarativos; no acreditan todas las operaciones o excepciones de plataforma ni la matriz de acceso.

## Acceso implementado en fase 2

La [matriz efectiva](ACCESO.md) concentra perfil, Permission Sets, grupos, funciones, compartición y procedimiento de transferencia. Comercial tiene lectura de contratos y actualización funcional de estado y notas de seguimientos asignados. Coordinación crea y edita contratos, gestiona y reasigna seguimientos y lee ejecuciones e incidencias. Ninguno elimina los cuatro objetos ni recibe permisos administrativos.

Se mantienen Private interno y externo. El permiso personalizado P06_Reasignar y dos reglas ReasignacionAutorizada controlan OwnerId en contratos y seguimientos existentes. El modelo conserva las 19 reglas anteriores y suma estas dos: 21 activas. Las transferencias comerciales se rechazaron por REST individual y de colecciones, Lightning y formulario Classic directo.

Los campos universalmente obligatorios pueden mantener controles de edición aunque el layout pida Readonly. La regla IdentidadYOrigenInmutables conserva la protección funcional de contrato, fecha capturada, clave y ejecución. El comercial no ve el lookup de ejecución por falta de acceso al objeto técnico. Los cambios protegidos fueron rechazados en sus sesiones reales.

La lectura del contrato tras transferencias se mantiene mediante concesiones Manual de lectura, con revisión explícita del propietario y de accesos anteriores. No hay sincronización automática. Account y User conservan su compartición global; no se afirma aislamiento de las cuentas estándar.

El operador de procesamiento sigue como diseño pendiente. No se ha creado un Permission Set de lanzamiento ni se ha implementado el servicio. P06_VerificacionModelo permanece limitado a la cuenta técnica.

### Lanzamiento y límites

El lanzamiento técnico de clases mediante Apex anónimo requiere permisos específicos, incluidos API Enabled y Author Apex. Author Apex no limita al usuario a un único lanzador: el operador es un rol técnico de confianza que exige autorización separada; nunca se asignará a comerciales. No se han concedido estos permisos. Véanse [bloques anónimos](https://developer.salesforce.com/docs/platform/apex-dev/references/apex-dev/apex-anonymous-block.html) y [ejecución en consola](https://help.salesforce.com/s/articleView?id=code_dev_console_execute_anonymous.htm&language=en_US&type=5).

La validación de propietario usuario cubre los guardados que ejecutan validaciones. Algunas operaciones de transferencia masiva o de Salesforce Classic no las ejecutan; no se habilitarán como alternativa a los controles de acceso. La fase 2 rechazó también la transferencia en el formulario Classic directo ensayado; no extrapola ese resultado a todas las operaciones. Véase [validaciones y cambios de propietario](https://help.salesforce.com/s/articleView?id=000385142&language=en_US&type=1).

Desplegado: Private, restricciones de referencias, campo único y reglas declarativas. El permiso técnico permite leer Aplicable__c, DiasRestantes__c y AsyncApexJobId__c, y leer/editar Notas__c, Solicitante__c, Finalizacion__c, RequiereReconciliacion__c, Contrato__c de incidencia, ClaveIntentada__c, Mensaje__c y CamposAfectados__c. No añade permisos de sistema, objetos o eliminación. La matriz comercial, la compartición y las transferencias se completaron en fase 2 con el alcance de ACCESO.md. El control canónico de identidad y el operador siguen pendientes.

## Comprobaciones realizadas en fase 1B

La validación remota detectó que el lookup a User no admite la configuración de obligatoriedad universal prevista. Se mantiene el requisito mediante SolicitanteObligatorio, sin cambiar ContextoInmutable. El modelo conserva cuatro objetos y 35 campos y pasa de 18 a 19 reglas activas. La obligatoriedad mediante validación sigue el [mecanismo documentado de Salesforce](https://help.salesforce.com/s/articleView?id=000003107&language=en_US&type=1). Las comprobaciones reproducibles de [FASE-1B.md](FASE-1B.md) están compiladas y ejecutadas: 12 casos de contratos, 51 de seguimientos y aplicabilidad, 37 de ejecuciones y 17 de incidencias, todos correctos.

Los scripts utilizan fixtures propios y verifican el código de error y, para las validaciones personalizadas, un fragmento específico del mensaje esperado. Un rechazo por otra causa no se contabiliza como éxito. Las operaciones exploratorias se revierten incluso si fueran aceptadas inesperadamente; los registros base se conservan y se incluyen en un inventario.

Las ejecuciones de comprobación no representan jobs Batch. Se conservan sin AsyncApexJobId y sin contadores de procesamiento ficticios; los valores sintéticos para comprobar la ecuación y sus rechazos quedan bajo rollback. La prueba de unicidad se limita a la misma clave exacta.

Al cierre de fase 1B no se habían ejecutado pruebas de eliminación ni por roles. Fase 2 incorpora esas comprobaciones para las funciones comerciales y de coordinación; los resultados anteriores siguen siendo históricos. La prueba de cambio de solicitante utilizó otro usuario estándar activo existente. También se rechazaron alta y actualización con solicitante vacío. No se crearon usuarios.

# Acceso comercial y reasignación

## Configuración efectiva

El perfil P06_BaseComercial no concede CRUD sobre Account ni los objetos P06. Los Permission Sets aportan el acceso funcional. La auditoría de fase 2 incluye el perfil, todas las asignaciones, grupos, función y UserRecordAccess; sus pruebas negativas se ejecutaron con sesiones reales, sin Author Apex ni simulaciones administrativas. La comprobación adicional de fase 3 se delimita más abajo.

| Objeto | P06_Comercial | P06_Coordinacion |
|---|---|---|
| Account | Lectura | Lectura |
| ContratoComercial__c | Lectura de registros accesibles | Creación, lectura y edición |
| SeguimientoRenovacion__c | Lectura y edición comercial de asignados | Lectura, edición comercial y reasignación |
| EjecucionRenovacion__c | Sin acceso | Lectura |
| IncidenciaRenovacion__c | Sin acceso | Lectura |

Ninguno concede Delete, View All Records, Modify All Records, View All Data, Modify All Data, Author Apex, View Setup, gestión de usuarios ni Transfer Any Entity. Ambos incorporan API Enabled, Run Reports, Lightning Experience User y Prevent Classic Experience. El perfil conserva cinco capacidades básicas de plataforma inventariadas en [acceso-final.json](evidencias-fase-2/acceso-final.json), sin CRUD adicional ni permisos administrativos. No hay grupos de Permission Sets asignados.

P06_VerificacionModelo permanece exclusivamente en la cuenta técnica. No constituye el permiso de operador: P06_OperadorRenovaciones se añade por separado en fase 3.

## Campos y propietario

El comercial puede actualizar funcionalmente Estado__c y Notas__c. Las fórmulas son de lectura. La identidad, fecha capturada y origen del seguimiento se protegen mediante la regla existente IdentidadYOrigenInmutables. Los campos universalmente obligatorios pueden seguir apareciendo editables aunque el layout solicite Readonly: se comprobó el rechazo al guardar. El lookup de ejecución queda además oculto al comercial por falta de acceso al objeto técnico.

OwnerId no utiliza una FLS convencional. El permiso personalizado P06_Reasignar, concedido solo por P06_Coordinacion, permite cambiar el propietario de contratos y seguimientos existentes. Dos reglas ReasignacionAutorizada rechazan ese cambio cuando falta el permiso; no contienen identificadores de usuario ni nombres de perfil.

Se comprobaron REST individual, REST de colecciones, formulario Lightning y formulario Classic directo. Todos rechazaron la transferencia comercial. PreventClassicExperience no bloqueó la URL Classic ensayada; no se utiliza como única barrera de seguridad. Las pruebas cubren esas rutas concretas, no todas las variantes futuras de la plataforma.

## Ámbito de registros

Los cuatro objetos mantienen Private interno y externo. P06_Comercial depende de propiedad y concesiones concretas. P06_Coordinacion se sitúa por encima de P06_Comercial en la jerarquía de funciones.

P06_Propietarios contiene los propietarios del ámbito del proyecto. Cuatro reglas de propietario comparten sus registros con P06_Coordinacion: Edit para contratos y seguimientos; Read para ejecuciones e incidencias. Los grupos públicos no incluyen automáticamente superiores. La carpeta del informe se comparte en lectura con P06_Comerciales y P06_Coordinacion.

La visión global corresponde a los propietarios incluidos en ese ámbito. Incorporar un usuario exige revisar perfil, permisos, función y grupos antes de asignarle registros. No se reutilizan usuarios ajenos ni se presupone que una asignación restrictiva quite permisos concedidos por otra vía.

Account conserva ReadWrite interno y User conserva Read. No se modificaron sus valores globales. Account es solo de lectura para estas funciones, pero sus cuentas visibles no quedan limitadas a las dos cuentas ficticias de fase 2.

## Procedimiento de transferencia y compartición

1. Identificar seguimiento, contrato, propietario anterior y nuevo responsable. Verificar que el destino pertenece al ámbito P06 y tiene los permisos comerciales previstos.
2. Registrar las concesiones manuales actuales y comprobar si el anterior responsable conserva otros seguimientos o la propiedad del contrato.
3. Desde coordinación, usar Cambiar propietario en el registro. Desactivar Enviar notificación por correo electrónico. La transferencia no modifica estado, notas, identidad ni ejecución.
4. Después del cambio, conceder Read sobre el contrato a cada responsable de sus seguimientos que lo necesite. Si cambia el propietario del contrato, volver a revisar esas concesiones. Salesforce puede retirar comparticiones manuales al transferir; no se ha cambiado esa política global.
5. Verificar con el nuevo responsable la lectura del seguimiento y su contrato y la edición de estado y notas. Verificar que el anterior no conserva escritura por propiedad, jerarquía, grupo o concesión manual improcedente.
6. Retirar únicamente las concesiones Manual inventariadas que ya no correspondan. No borrar reglas, concesiones Owner ni registros de negocio. Conservar la lectura del contrato cuando siga justificada por otro seguimiento o por su propiedad.

Las altas comprobadas utilizan el objeto estándar ContratoComercial__Share mediante REST autenticado como coordinación: ParentId del contrato, UserOrGroupId del responsable, AccessLevel=Read y RowCause=Manual. Para retirar una concesión se consulta esa combinación exacta y se elimina únicamente su registro de compartición. Los identificadores se obtienen del inventario del entorno; no se fijan en metadatos.

La reasignación por Lightning y la compartición por REST se verificaron por separado. No se presenta como probado el recorrido del botón Compartir de Lightning. El procedimiento de revisión es obligatorio: no hay sincronización automática de propietarios o accesos ni una restricción absoluta frente a nuevas concesiones de propietarios o administradores.

La [documentación de compartición manual de Salesforce](https://help.salesforce.com/s/articleView?id=granting_access_to_records.htm&language=en_US&type=5) describe la revisión necesaria tras cambios de propietario.

## Identidades de comprobación

Se crearon dos identidades ficticias sobre las dos licencias Salesforce libres, con correo reservado example.invalid, sin correo de bienvenida ni restablecimiento de contraseña. A y B se comprobaron primero como comerciales. A se reutilizó con configuración separada para coordinación, retirando antes el permiso y grupo anteriores. Después volvió a comercial para probar la pérdida de acceso y terminó como coordinación; B termina como comercial.

El cambio de función queda registrado en [configuracion.json](evidencias-fase-2/configuracion.json). Las identidades, usuarios y asignaciones concretas permanecen en el inventario privado. El acceso delegado temporal se restauró a false y se verificó por lectura.

## Operador de fase 3

P06_OperadorRenovaciones concede el permiso personalizado P06_ProcesarRenovaciones y acceso a ServicioRenovaciones y LoteRenovaciones. Exige autorización en servicio, constructor y callbacks del Batch, así como en el contraste. El job debe estar vinculado a la ejecución del solicitante actual.

| Objeto | CRUD del Permission Set de operador |
|---|---|
| Account y ContratoComercial__c | Lectura |
| SeguimientoRenovacion__c | Lectura y creación |
| EjecucionRenovacion__c | Lectura, creación y edición |
| IncidenciaRenovacion__c | Lectura y creación |

No concede eliminación, edición de contratos o seguimientos, View All, Modify All, Author Apex, View Setup ni gestión de usuarios. Concede API Enabled, Run Reports y once permisos sobre campos opcionales/calculados. Los campos universalmente obligatorios no admiten FLS restrictiva convencional.

P06_Operadores recibe cuatro reglas desde P06_Propietarios: Read de contratos, seguimientos e incidencias; Edit de ejecuciones. La carpeta del informe añade acceso View para ese grupo y conserva los grupos comerciales. Grupo y Permission Set se asignan solo a la cuenta técnica existente. A/B mantienen sus asignaciones anteriores y no reciben el permiso de procesamiento.

La demostración usa esa cuenta técnica con su perfil administrativo previo; no demuestra que el nuevo Permission Set sea por sí solo suficiente para ejecutar Apex anónimo. Las pruebas Apex sí ejercitan USER_MODE con usuarios transitorios de perfil base, incluyendo denegación sin permiso, sin CRUD y sin FLS para guardar el job. Esos usuarios se revierten al terminar las pruebas.

UserRecordAccess confirma que B puede leer y editar los 120 seguimientos nuevos y leer sus 120 contratos; no puede editar contratos ni eliminar registros. A conserva lectura y edición de los 120 seguimientos y contratos, sin eliminación. El informe se compara con SOQL bajo la misma cuenta técnica: 126 filas coincidentes, 119 nuevas, cerrado excluido y En curso incluido. No equivale a una nueva ejecución del informe como A o B; las sesiones comerciales comprobadas pertenecen a fase 2. Login As permanece false. Evidencia: [acceso-informe.json](evidencias-fase-3/acceso-informe.json).

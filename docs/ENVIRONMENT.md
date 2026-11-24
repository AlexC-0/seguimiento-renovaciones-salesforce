# Entorno

Inspección local y verificación del destino realizadas el 23/11/2026. Las versiones de herramientas corresponden al inventario inicial; no constituyen una revisión general de compatibilidad.

## Herramientas detectadas

| Herramienta | Versión | Comprobación y limitación |
|---|---|---|
| Git | 2.56.1.windows.1 | Versión consultada correctamente |
| Salesforce CLI | 2.158.7 | Devuelve versión; el lanzador emite avisos de acceso denegado al consultar procesos de Windows |
| Node.js | 24.13.0 | Versión consultada; runtime utilizado por la CLI instalada |
| Java en PATH | 1.8.0_503 | Runtime efectivo y compatibilidad del editor no verificados |
| VS Code | 1.147.0 | Versión del ejecutable instalado |
| Paquete principal Salesforce y extensión Apex | 68.12.0 | Manifiestos locales detectados; activación no comprobada |

Salesforce CLI se utilizó para validar, desplegar y comprobar el modelo en el destino P06. Git permite versionar el proyecto. Java y las extensiones son auxiliares del editor.

## Destino de fase 1B

Cuenta existente identificada expresamente para P06 y autenticada desde Chrome habitual. Alias local: `p06-renovaciones-dev`. La identidad recibida por la CLI coincidió con la cuenta indicada. No se ha creado otra organización ni se ha establecido un destino global.

La consulta de Organization confirmó Developer Edition, IsSandbox=false y conexión con API 65.0. La edición de desarrollo y la identidad explícita acreditan el destino no productivo; IsSandbox=false aislado no lo demuestra. No existían los cuatro nombres de objetos P06 antes del despliegue.

El identificador de organización se conserva en el estado local excluido de Git para vincular operaciones. No se publican usuarios, direcciones de instancia ni archivos de autenticación. Cada comando remoto especifica el destino.

## Capacidades y acceso al comienzo de fase 1B

| Capacidad | Resultado observado |
|---|---|
| Licencias Salesforce | 4 totales, 2 utilizadas |
| Licencias Salesforce Platform | 6 totales, 0 utilizadas |
| Usuarios activos de tipo Standard | 4 |
| Otros tipos activos | AutomatedProcess: 2; CloudIntegrationUser: 1; CsnOnly: 1 |
| Creación de Account por la cuenta técnica | Disponible |
| API 65.0 | Consultas, validación, despliegue y bloques anónimos correctos |
| Segundo usuario estándar para probar Solicitante | Disponible; comprobación ejecutada |

Los tipos Standard no equivalen necesariamente a cuatro cuentas comerciales utilizables. El inventario agregado de licencias no acredita permisos efectivos por rol ni garantiza disponibilidad para una configuración futura.

El despliegue de objetos no hizo visibles los campos opcionales y calculados a la cuenta técnica. P06_VerificacionModelo concede acceso a once campos del modelo: ocho editables y tres de lectura. Está asignado solo a la cuenta técnica existente, sin permisos de sistema, objetos ni eliminación y sin modificar perfiles. Se conservan permiso y asignación para reproducir las comprobaciones. Los roles comerciales siguen sin implementar.

## API y despliegues

sourceApiVersion=65.0, correspondiente a Winter ’26 según la [documentación de Salesforce](https://developer.salesforce.com/blogs/2025/09/take-a-deep-dive-into-metadata-api-deployments). Su compatibilidad con este destino quedó verificada mediante validación y despliegue del modelo y ejecución de los cuatro bloques anónimos.

El manifiesto del modelo incluye únicamente cuatro CustomObject y sus hijos: 35 campos y 19 reglas. El permiso técnico tiene un manifiesto separado. Se utilizó NoTestRun en Developer Edition; esto no acredita pruebas Apex automatizadas. Los identificadores y estados finales están en [STATUS.md](STATUS.md) y [evidencias-fase-1b.json](evidencias-fase-1b.json).

## Antecedentes locales

La inspección inicial no encontró los archivos globales de configuración comprobados ni valores en SF_TARGET_ORG, SF_TARGET_DEV_HUB, SFDX_DEFAULTUSERNAME o SFDX_DEFAULTDEVHUBUSERNAME. Ese resultado tenía alcance local y no acreditaba ausencia de organizaciones autenticadas por otras vías.

En fase 1A se convirtió el modelo inicial de cuatro objetos, 35 campos y 18 reglas con status 0, sin validación remota. Al preparar fase 1B se repitió la conversión con el manifiesto acotado, también correcta. Son resultados anteriores a la corrección del lookup y no se presentan como compilación de Salesforce.

El lanzador de CLI emitió avisos auxiliares de acceso denegado al consultar procesos de Windows en comprobaciones locales. No se cambiaron herramientas ni configuración global para eliminarlos. No se inspeccionaron otros repositorios ni se reutilizaron organizaciones ajenas. La asociación incorrecta inicial del alias P06 se retiró antes de consultar ese destino; las demás credenciales y alias se conservaron.

## Límites al cierre de fase 1B

No se ha comprobado el runtime Java efectivo de las extensiones ni el funcionamiento del servicio de lenguaje Apex. No se han creado usuarios, concedido privilegios administrativos, configurado roles comerciales ni ejecutado pruebas por rol. No hay servicios, túneles, integraciones o procesos Batch asociados a esta fase.

## Estado después de fase 2

El destino y API 65.0 se conservaron. Se ocuparon las dos licencias Salesforce libres con identidades ficticias: uso final 4/4; Salesforce Platform 0/6. La configuración final y la exclusividad del permiso técnico se verificaron en [configuracion.json](evidencias-fase-2/configuracion.json). No hubo contratación, correos de bienvenida ni restablecimientos.

Perfil mínimo propio, dos Permission Sets, roles y grupos P06 comprobados en sesiones reales. No se modificaron usuarios reales, perfiles compartidos, herramientas globales ni la compartición de Account o User. Los cuatro objetos P06 mantienen Private.

Las pruebas usaron el Chrome habitual mediante Playwright MCP 0.0.86 temporal en loopback. La configuración global de Playwright no se actualizó. Al cerrar, la conexión temporal se detuvo y el acceso delegado quedó restaurado a false, con [lectura de verificación](evidencias-fase-2/restauracion.json). Inventarios, identidades, cookies y autenticación quedan fuera de Git.

Los [resultados de fase 2](FASE-2.md) sustituyen los pendientes comerciales anteriores. La comprobación del runtime Java y del servicio de lenguaje Apex sigue fuera del alcance.

## Entorno de fase 3

Se reutiliza exclusivamente p06-renovaciones-dev, Developer Edition, API 65.0. Cada script remoto verifica Organization contra el recibo privado de fase 1B. No se crean usuarios persistentes ni se cambian destinos globales, herramientas o dependencias. Los scripts Node reutilizan los módulos de la CLI instalada mediante scripts/fase-2/salesforce.cjs; P06_SF_MODULES permite indicar esa ruta existente sin instalar paquetes.

La cuenta técnica recibe P06_OperadorRenovaciones y pertenencia a P06_Operadores; conserva su perfil previo. Las asignaciones A/B y P06_VerificacionModelo permanecen intactas. Login As=false confirmado por Metadata API al terminar. No se utiliza el navegador ni se restablece el puente temporal de fase 2.

El corte observado es 23/11/2026 y la zona del usuario Salesforce es Europe/Paris; se conserva esa zona real en las dos ejecuciones. La ventana termina el 23/12/2026. Los tiempos de evidencia JSON se guardan en UTC.

Validación 0Afg700000L0MUHCA3 y despliegue 0Afg700000L0NQLCA3 terminados correctamente, con 14 pruebas y 21 componentes procesados. El manifiesto contiene 13 miembros explícitos; Salesforce desglosa contenedores de compartición en sus componentes. Las huellas registradas corresponden a los bytes locales de los 19 archivos; la revisión posterior distingue su formato de los blobs publicados y de ApexClass.Body. [Resultados completos](evidencias-fase-3/despliegue-pruebas.json).

## Revisión del 24/11/2026

Se verificó la misma Developer Edition mediante el recibo privado y API 65.0 antes de cada operación remota. La sesión CLI/API existente permitió la inspección, validación, despliegue y contraste; no se requirió navegador ni cambios de autenticación.

Las lecturas de ApexClass.Body se guardan en carpetas privadas separadas antes y después del despliegue, sin sobrescribir las fuentes de trabajo. Los recibos de validación y despliegue también quedan separados de los de fase 3. El manifiesto acota tres clases y no despliega permisos, modelo ni configuración funcional adicional. Login As sigue false, con asignaciones comerciales intactas y sin usuarios persistentes nuevos.

La [trazabilidad inicial](evidencias-revision-fase-3/trazabilidad-inicial.json) diferencia bytes originales, UTF-8 con CRLF convertido a LF y contenido sin un LF final. La [comprobación final](evidencias-revision-fase-3/comprobacion-final.json) confirma fuentes remotas equivalentes al nuevo paquete validado, 20 pruebas y conservación de 297 registros.

## Entorno de fase 4A

El 24/11/2026 se comprobó el destino p06-renovaciones-dev con API 65.0 y la identidad técnica existente. Node 24.13.0 y Salesforce CLI 2.158.7 se reutilizaron sin instalaciones ni cambios globales. Al inicio había cero Batch activos, 14999 solicitudes API y 250000 ejecuciones asíncronas disponibles en los límites consultados; son una instantánea, no capacidad garantizada.

Los ensayos usaron CLI/API y no requirieron navegador ni Login As. Corte 2026-11-24, fin 2026-12-24 y zona Salesforce Europe/Paris. Los timestamps de evidencia están en UTC. Usuarios y permisos comerciales conservados.

La única configuración temporal fue P06_F4A_RechazoAcotado, inicialmente ausente, limitada a la creación para un contrato nuevo exacto. Se validó antes de cada despliegue y quedó inactiva verificada. Los paquetes MDAPI se conservan bajo docs/evidencias-fase-4a, fuera del paquete de aplicación. ZIP con manifiesto raíz y separadores /; los rechazos de empaquetado anteriores se conservan. No hubo cambios de aplicación, servicios, túneles ni reintentos automáticos. [Resultados y recibos](FASE-4A.md).

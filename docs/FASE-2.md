# Fase 2 — Gestión comercial, acceso e informe

## Resultado y alcance

Fase completada el 23/11/2026 sobre f779561036541b29e03fbf8f41e851c49bbea7c9, en p06-renovaciones-dev. La identidad de la Developer Edition se contrastó con el registro privado de fase 1B antes de las operaciones remotas. API 65.0.

Se incorporan aplicación Lightning estándar, cuatro pestañas, cuatro layouts, cinco listas, dos Permission Sets funcionales, un perfil mínimo, un permiso personalizado, dos reglas de reasignación, dos funciones, tres grupos, cuatro reglas de compartición y carpeta e informe. El manifiesto contiene 31 componentes explícitos; Salesforce contabilizó 35 al incluir los cuatro objetos contenedores. El modelo mantiene cuatro objetos y 35 campos y pasa a 21 validaciones.

No se añadieron Apex, LWC, Flow, procesamiento, integraciones, programación ni comunicaciones. La V1 completa sigue pendiente de Batch, servicio de lanzamiento, generación canónica y reconciliación.

## Despliegues

| Operación | Identificador | Resultado |
|---|---|---|
| Validación principal | 0Afg700000KyM3nCAF | Succeeded, 35/35, checkOnly=true |
| Despliegue principal | 0Afg700000KzRFuCAN | Succeeded, 35/35, checkOnly=false |
| Validación de ajuste del perfil | 0Afg700000KzYNpCAN | Succeeded |
| Despliegue de ajuste del perfil | 0Afg700000Kz9MECAZ | Succeeded |
| Validación de pestaña Informes | 0Afg700000KzeUrCAJ | Succeeded, 2/2 |
| Despliegue de pestaña Informes | 0Afg700000KzeoDCAR | Succeeded, 2/2 |

Las validaciones iniciales 0Afg700000KyzzaCAB, 0Afg700000KyniJCAR y 0Afg700000KzDw8CAF fallaron por configuración de funciones, referencias de propietario, columna agrupada duplicada y longitud del nombre del informe. Sus resultados se conservaron. Las correcciones preceden a la validación principal correcta.

Salesforce añadió capacidades de correo y lectura de tres objetos estándar al crear el perfil. El ajuste incremental las retiró antes de probar usuarios. La segunda corrección hizo visible Informes en los dos Permission Sets. Los ajustes se validaron antes de desplegar, sin componentes destructivos ni cambios globales de compartición. No se atribuye al primer paquete el contenido posterior de los ajustes.

## Acceso y configuración

La [matriz efectiva y el procedimiento](ACCESO.md) documentan CRUD, campos, propiedad, grupos y compartición. La [guía de uso](USO.md) describe la aplicación estándar. Las auditorías [comerciales](evidencias-fase-2/acceso-comerciales.json), [coordinación](evidencias-fase-2/acceso-coordinacion.json) y [final](evidencias-fase-2/acceso-final.json) incluyen todas las asignaciones y accesos observados.

A y B son identidades ficticias sin privilegios administrativos. Se reutilizó A secuencialmente para coordinación sin acumular Permission Sets. La configuración final es A con coordinación y B comercial. Hay 4 de 4 licencias Salesforce utilizadas y 0 de 6 Salesforce Platform; no se contrataron licencias. P06_VerificacionModelo sigue asignado solo a la cuenta técnica.

Los usuarios ordinarios no eliminan ninguno de los cuatro objetos. La regla de reasignación exige P06_Reasignar. Las fórmulas se consultan únicamente sobre los seguimientos accesibles en las pruebas de aislamiento. La compartición global existente de Account y User se conserva; no se acredita aislamiento de cuentas estándar.

## Comprobaciones

| Grupo | Resultado | Evidencia y alcance |
|---|---:|---|
| Comercial A | 19/19 | Lectura y notas propias, aislamiento, CRUD, identidad, origen, propietario y transiciones; sesión real por API |
| Comercial B | 8/8 | Aislamiento recíproco, edición propia y denegaciones de contrato, registros técnicos y propietario |
| Coordinación | 28/28 | Edición de contratos, aplicabilidad por fecha/estado, transferencias, lectura técnica y denegaciones de identidad y borrado |
| Acceso después de transferencias | 13/13 | B conserva contrato y recibe seguimiento; A sin coordinación pierde lectura/escritura; B recibe la transferencia de Lightning |
| Transferencia múltiple por API | 2/2 rechazadas | Dos resultados FIELD_CUSTOM_VALIDATION_EXCEPTION en una petición de colecciones |
| Creación de contrato por coordinación | Correcta | HTTP 201 y fixture conservado; caso adicional a los 28 anteriores |
| Interfaz | 4/4 | Nota persistida; transferencia comercial denegada en Lightning y Classic; transferencia de coordinación confirmada |
| Informe | Contrastes correctos | Mismos identificadores y totales que SOQL en la misma sesión; agrupación, orden y detalles completos |
| Conservación | 19/19 históricos y 31/31 nuevos | Lectura posterior; datos históricos persistidos sin cambios |
| Archivos históricos | 74/74 | Contenido textual conservado; se distingue LF de CRLF sin reescribir archivos |
| Configuración temporal | Restaurada | Login As=false confirmado por lectura; conexión temporal de navegador detenida |

Las 70 comprobaciones API agrupadas no son pruebas Apex automatizadas. No se concedió Author Apex a comerciales ni se utilizó una consulta administrativa como sustituto de pruebas negativas. La auditoría administrativa complementa los resultados de las sesiones reales. La creación del contrato, los recorridos de interfaz y los contrastes del informe se registran por separado.

La evaluación inicial de A no reconocía tres códigos de rechazo. Se conserva [el resultado inicial](evidencias-fase-2/comercial-a-criterios-iniciales.json) y [la revisión](evidencias-fase-2/comercial-a.json): CANNOT_INSERT_UPDATE_ACTIVATE_ENTITY deniega CRUD e INVALID_FIELD oculta el lookup técnico. Una petición adicional sin ese lookup confirmó la denegación de creación. No se repitieron transiciones terminales para reconstruir un resultado.

Los intentos de eliminación se limitaron a fixtures nuevos desechables, con datos previos conservados. No se intentó borrar ninguno de los 19 registros históricos. No se repitieron las 117 comprobaciones de fase 1B.

## Informe y contraste

El tipo estándar Seguimientos de renovación con Contrato proporciona las columnas necesarias; no se creó un tipo personalizado. El nombre visible es Seguimientos de renovación pendientes: el título solicitado tenía 41 caracteres y Salesforce limita el nombre a 40. La descripción conserva el título completo.

Filtros: Estado Pendiente o En curso y Aplicable=true. No se impone un límite inferior de fecha. El responsable es la agrupación; la fecha capturada ordena ascendentemente dentro de cada grupo.

| Contexto real | Filas del informe y consulta | Observación |
|---|---:|---|
| A comercial antes de transferencias | 4 | Interfaz y API; incluye el fixture atrasado dos días |
| B comercial inicial | 2 | Solo los dos seguimientos propios iniciales |
| A comercial tras la transferencia API | 3 | El seguimiento transferido desaparece de su acceso |
| B comercial tras la transferencia API | 3 | Incorpora el seguimiento recibido |
| B comercial final, tras Lightning | 4 | Incorpora el segundo seguimiento recibido |
| Coordinación inicial y final | 7 | Incluye un pendiente histórico y dos atrasados en total |

Cada contraste de API usa una consulta SOQL con los mismos filtros en la misma sesión autenticada. Se comparan identificadores, no solo totales. Se excluyen cerrados, descartados, contratos inactivos y fechas no coincidentes. Los cambios de fecha y estado se probaron y restauraron en fixtures nuevos.

## Conservación, entorno y límites

Se conservan las evidencias originales, los metadatos previos y los datos históricos. Las diferencias binarias de seis JSON corresponden únicamente a CRLF del checkout frente a LF de Git; los 74 contenidos normalizados coinciden. Los campos de actividad LastViewedDate y LastReferencedDate se excluyen del contraste de datos persistidos, no las fechas de modificación ni los campos del modelo.

Las pruebas usaron Chrome habitual y una conexión temporal compatible con Playwright MCP 0.0.86 en loopback. No se instalaron herramientas globales ni se cambió su configuración. Se cerró la sesión delegada, se restauró enableAdminLoginAsAnyUser=false y se detuvo el proceso temporal. Las pruebas de interfaz no constituyen una auditoría visual, de accesibilidad o de todas las rutas de Salesforce.

La compartición de contratos es manual y fue comprobada por REST como coordinación; no se verificó el recorrido del botón Compartir. La retirada de accesos futuros requiere revisión explícita. No hay sincronización automática, pruebas de todos los mecanismos de concesión ni garantías ante nuevos permisos administrativos o comparticiones añadidas fuera del procedimiento.

Los scripts de fase 2 son comprobaciones con estado y mutan fixtures. No deben repetirse sobre seguimientos terminales para atribuir resultados nuevos. Un nuevo ciclo requiere inventario y evidencias separados, identidad del destino verificada y configuración funcional registrada. Los archivos privados de sesión, usuarios y conexión no se publican.

Se revisaron los archivos afectados, metadatos, documentación, instrucciones locales y textos de interfaz observados, además del título y descripción propuestos. No se revisaron otras organizaciones, repositorios, todo el historial Git, todas las pantallas estándar ni superficies externas de publicación.

El [registro agregado](evidencias-fase-2.json) enlaza los resultados sanitizados. La finalización de esta fase no acredita procesamiento Batch, concurrencia, identidad canónica ni reconciliación.

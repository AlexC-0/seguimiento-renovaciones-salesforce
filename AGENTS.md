# P06 — Seguimiento de renovaciones

## Ámbito

Trabajar exclusivamente en este repositorio. No inspeccionar ni modificar otros proyectos. Conservar los cambios existentes y comprobar ruta, raíz, rama, remotos y estado Git antes de editar. Leer README.md, docs/PROJECT_BRIEF.md, docs/STATUS.md y docs/ENVIRONMENT.md; consultar docs/MODELO_DATOS.md para cambios en metadatos.

## Operaciones

No ejecutar staging, commits ni push. No configurar remotos, publicar ni reescribir historial sin un encargo expreso. No instalar o actualizar herramientas globales ni cambiar su configuración.

No crear, autenticar ni modificar organizaciones sin autorización específica. No reutilizar organizaciones, datos o configuraciones de otros proyectos. Antes de cualquier operación Salesforce autorizada, verificar la identidad del destino y especificarlo expresamente en el comando. La existencia de un alias local no autoriza su uso.

No imprimir ni versionar secretos, tokens, archivos de autenticación o enlaces reutilizables de acceso. No realizar comunicaciones externas ni introducir servicios de pago o privilegios amplios.

No delegar tareas. No atribuir éxito a pruebas no ejecutadas. Distinguir inspección local, revisión estática, conversión de formato, compilación por Salesforce, despliegue y comprobación funcional.

## Estado comprobado

Fase 2 completada: gestión comercial estándar, acceso por función, compartición e informe comprobados; 19 fixtures históricos y 31 nuevos conservados. Ver docs/FASE-2.md y docs/ACCESO.md. Login As restaurado a false y conexión temporal de navegador detenida. Las autorizaciones temporales de esta comprobación están cerradas; no son tareas pendientes. No iniciar el procesamiento de fases posteriores sin un nuevo encargo.

## Alcance

Fase 2: aplicación Lightning estándar, pestañas, layouts, listas, permisos comerciales, compartición acotada e informe operativo. Destino exclusivo p06-renovaciones-dev, Developer Edition; contrastar su identidad con .sf/p06-fase-1b/destino-verificado.json antes de escribir. No seleccionar otra organización ni cambiar destinos globales.

Conservar los 19 fixtures y las evidencias de fase 1B. Usar fixtures nuevos identificables de fase 2. No repetir las 117 comprobaciones salvo afectación justificada. Validar manifiestos acotados antes de aplicar los mismos archivos y comprobar el resultado final. Detenerse ante colisiones no atribuibles al proyecto. Sin despliegues destructivos ni eliminación de evidencias.

Están autorizados Permission Sets comerciales y de coordinación, permisos personalizados para excepciones funcionales y compartición limitada a P06. Mantener Private. No cambiar la compartición global de Account o User. No conceder View All Data, Modify All Data, Author Apex ni privilegios administrativos a comerciales. Mantener P06_VerificacionModelo separado y exclusivamente en la cuenta técnica.

Preparar las identidades ficticias mínimas dentro de licencias gratuitas. No modificar usuarios reales, cuentas de servicio ni perfiles compartidos. No enviar correos de bienvenida o restablecimiento, contratar licencias ni usar correos de terceros. Conservar identidades, credenciales y asignaciones en estado privado excluido de Git. Probar aislamiento con dos usuarios comerciales reales; coordinación puede comprobarse mediante configuración separada y registrada si se reutiliza secuencialmente una cuenta de prueba.

Probar CRUD/FLS y acceso a registros en contexto real de cada usuario, mediante interfaz o API. Distinguir pruebas de interfaz, API, automatizadas y revisiones de configuración. Ocultar controles o filtrar listas no constituye seguridad. Comprobar rutas de reasignación accesibles; no atribuir protección a una validación si una ruta la elude. Usar procedimientos explícitos para conceder y retirar compartición manual, sin prometer sincronización automática.

La interfaz será estándar y en castellano. Sin LWC, Flow, componentes personalizados, Batch, servicio de lanzamiento, generación canónica, reconciliación, integraciones, programación ni reintentos. No añadir Apex por anticipación. Los seguimientos de esta fase son fixtures técnicos, no resultados de procesamiento.

Utilizar Chrome habitual cuando haga falta interfaz; no abrir perfiles temporales ni otros navegadores. No acceder a Gmail ni inspeccionar sesiones de otras organizaciones. Las credenciales y desafíos de acceso se completan directamente en Salesforce cuando requieran intervención del titular.

## Documentación

Utilizar castellano y redacción técnica directa. Documentar objetivos, configuración, funcionalidades, decisiones, cambios, comprobaciones y limitaciones. Excluir relatos de conversaciones, asignaciones personales, atribuciones de elaboración y firmas o coautorías automáticas. Conservar las licencias y los créditos legítimos de terceros. No copiar encargos operativos a archivos versionados.

Los títulos propuestos de commit seguirán el formato `tipo: descripción`, sin paréntesis ni ámbitos entre paréntesis.

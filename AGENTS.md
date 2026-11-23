# P06 — Seguimiento de renovaciones

## Ámbito

Trabajar exclusivamente en este repositorio. No inspeccionar ni modificar otros proyectos. Conservar los cambios existentes y comprobar ruta, raíz, rama, remotos y estado Git antes de editar. Leer README.md, docs/PROJECT_BRIEF.md, docs/STATUS.md y docs/ENVIRONMENT.md; consultar docs/MODELO_DATOS.md para cambios en metadatos.

## Operaciones

No ejecutar staging, commits ni push. No configurar remotos, publicar ni reescribir historial sin un encargo expreso. No instalar o actualizar herramientas globales ni cambiar su configuración.

No crear, autenticar ni modificar organizaciones sin autorización específica. No reutilizar organizaciones, datos o configuraciones de otros proyectos. Antes de cualquier operación Salesforce autorizada, verificar la identidad del destino y especificarlo expresamente en el comando. La existencia de un alias local no autoriza su uso.

No imprimir ni versionar secretos, tokens, archivos de autenticación o enlaces reutilizables de acceso. No realizar comunicaciones externas ni introducir servicios de pago o privilegios amplios.

No delegar tareas. No atribuir éxito a pruebas no ejecutadas. Distinguir inspección local, revisión estática, conversión de formato, compilación por Salesforce, despliegue y comprobación funcional.

## Alcance

Fase 1B: validación y despliegue del modelo declarativo y comprobaciones acotadas con datos ficticios. Las operaciones remotas se limitan al destino exclusivo de P06 identificado expresamente y verificado como no productivo. No inferir autorización de alias, sesiones o destinos por defecto. Si falta identificación o autenticación, preparar el trabajo local y mantener bloqueada la ejecución remota. Utilizar la cuenta existente identificada expresamente para P06 y autenticarla mediante Chrome habitual. No iniciar otro registro ni abrir perfiles temporales de navegador. Contrastar el usuario autenticado con la identidad indicada antes de asignar el alias P06. Los desafíos de acceso y la introducción de credenciales se completarán directamente en Salesforce cuando requieran intervención del titular.

Antes de escribir en el destino, comprobar colisiones de nombres y detenerse ante componentes de origen desconocido. Validar sin aplicar cambios y desplegar solo los mismos metadatos aceptados. Conservar identificadores de operación, resultados e inventario de fixtures; no ejecutar limpiezas ni borrar evidencias. No desactivar validaciones para superar errores. Está autorizado el Permission Set P06_VerificacionModelo, limitado a once campos del modelo y asignado únicamente a la cuenta técnica P06: tres campos de lectura y ocho de lectura/escritura, sin permisos de sistema, objetos ni eliminación. Batch, triggers, servicios, generación canónica, permisos completos e informes siguen fuera de esta fase.

Conservar el alcance y las exclusiones de docs/PROJECT_BRIEF.md. No presentar el campo único como idempotencia integral ni el diseño de acceso como seguridad verificada. Mantener separados los resultados confirmados por registro y los lotes totalmente revertidos.

## Documentación

Utilizar castellano y redacción técnica directa. Documentar objetivos, configuración, funcionalidades, decisiones, cambios, comprobaciones y limitaciones. Excluir relatos de conversaciones, asignaciones personales, atribuciones de elaboración y firmas o coautorías automáticas. Conservar las licencias y los créditos legítimos de terceros. No copiar encargos operativos a archivos versionados.

Los títulos propuestos de commit seguirán el formato `tipo: descripción`, sin paréntesis ni ámbitos entre paréntesis.

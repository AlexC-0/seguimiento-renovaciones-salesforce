# P06 — Seguimiento de renovaciones

## Ámbito

Trabajar exclusivamente en este repositorio. No inspeccionar ni modificar otros proyectos. Conservar los cambios existentes y comprobar ruta, raíz, rama, remotos y estado Git antes de editar. Leer README.md, docs/PROJECT_BRIEF.md, docs/STATUS.md y docs/ENVIRONMENT.md; consultar docs/MODELO_DATOS.md para cambios en metadatos.

## Operaciones

No ejecutar staging, commits ni push. No configurar remotos, publicar ni reescribir historial sin un encargo expreso. No instalar o actualizar herramientas globales ni cambiar su configuración.

No crear, autenticar ni modificar organizaciones sin autorización específica. No reutilizar organizaciones, datos o configuraciones de otros proyectos. Antes de cualquier operación Salesforce autorizada, verificar la identidad del destino y especificarlo expresamente en el comando. La existencia de un alias local no autoriza su uso.

No imprimir ni versionar secretos, tokens, archivos de autenticación o enlaces reutilizables de acceso. No realizar comunicaciones externas ni introducir servicios de pago o privilegios amplios.

No delegar tareas. No atribuir éxito a pruebas no ejecutadas. Distinguir inspección local, revisión estática, conversión de formato, compilación por Salesforce, despliegue y comprobación funcional.

## Estado comprobado de fase 3

Lanzamiento manual, Batch, identidad canónica y contraste implementados. Validación 0Afg700000L0MUHCA3 y despliegue 0Afg700000L0NQLCA3: 14/14 Apex. Dos jobs consecutivos, tres lotes cada uno: 120 creados y luego 120 existentes sin cambios. Se conservan 50 registros históricos, 34 archivos históricos y 247 registros nuevos. Ver docs/FASE-3.md. Login As=false, asignaciones comerciales intactas. No presentar repetición como solapamiento ni cerrar V1; fallos adversos y recuperación corresponden a otro alcance.

## Estado histórico de fase 2

Fase 2 completada: gestión comercial estándar, acceso por función, compartición e informe comprobados; 19 fixtures históricos y 31 nuevos conservados. Ver docs/FASE-2.md y docs/ACCESO.md. Login As restaurado a false y conexión temporal de navegador detenida. Las autorizaciones temporales de esta comprobación están cerradas; no son tareas pendientes. No iniciar el procesamiento de fases posteriores sin un nuevo encargo.

## Alcance

Fase 3: lanzamiento técnico manual, Batch Apex, identidad canónica, resultados parciales, pruebas Apex y demostración aislada de 120 contratos en lotes de 50 seguida de repetición. Destino exclusivo p06-renovaciones-dev, Developer Edition, API 65.0; contrastar la identidad con el registro privado de fase 1B antes de escribir.

Conservar los 50 fixtures anteriores y las evidencias publicadas. No repetir baterías históricas completas. Documentar las decisiones transaccionales y modos de acceso; exigir autorización también al invocar directamente el Batch. Mantener Private, los permisos comerciales y el permiso técnico anterior. El permiso de operador es separado y se asigna únicamente a la cuenta técnica existente para la demostración.

Validar antes de desplegar mediante manifiestos acotados. No ignorar errores ni desplegar componentes destructivos. No conceder Author Apex a comerciales o coordinación ni privilegios administrativos globales. No crear usuarios persistentes adicionales ni alterar los usuarios de prueba existentes. No modificar Account o User globalmente.

Se permite un trigger mínimo de identidad al insertar; no automatizar lanzamientos ni renovaciones. No añadir LWC, Flow, integraciones, programación, reintentos ni infraestructura de eventos. Las autorizaciones temporales de navegador y Login As de fase 2 están cerradas; no reactivarlas por inercia. No acceder a Gmail ni abrir otros perfiles de navegador.

La demostración usa contratos nuevos inventariados y un filtro opcional de identificadores que solo restringe la selección. Un conjunto vacío selecciona cero, nunca todos. No modificar datos históricos para alterar su elegibilidad ni añadirles seguimientos durante la demostración. Contrastar corte, ventana, jobs, resultados persistidos, repetición, acceso e informe. No presentar lanzamientos consecutivos como solapamiento real ni declarar cerrada V1.

## Documentación

Utilizar castellano y redacción técnica directa. Documentar objetivos, configuración, funcionalidades, decisiones, cambios, comprobaciones y limitaciones. Excluir relatos de conversaciones, asignaciones personales, atribuciones de elaboración y firmas o coautorías automáticas. Conservar las licencias y los créditos legítimos de terceros. No copiar encargos operativos a archivos versionados.

Los títulos propuestos de commit seguirán el formato `tipo: descripción`, sin paréntesis ni ámbitos entre paréntesis.

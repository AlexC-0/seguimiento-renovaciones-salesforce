# P06 — Seguimiento de renovaciones de contratos en Salesforce

Proyecto independiente para gestionar el seguimiento comercial de contratos ficticios próximos a vencer.

## Estado

Fase 2 completada en la Developer Edition exclusiva P06, API 65.0. La aplicación Lightning estándar permite consultar contratos, editar estado y notas de seguimientos, reasignar desde coordinación y consultar el informe operativo. Los permisos y accesos se han comprobado con dos identidades ficticias sin privilegios administrativos.

Se mantienen cuatro objetos y 35 campos. Las 19 validaciones del modelo se complementan con dos controles de reasignación. Se conservan los 19 fixtures de fase 1B y 31 registros nuevos de fase 2. El acceso delegado temporal está restaurado a false.

La V1 completa sigue pendiente: todavía no existen Batch, servicio de lanzamiento, generación canónica de identidad ni reconciliación. Los seguimientos actuales son fixtures técnicos.

## Funciones

- Comercial: lectura de contratos y actualización de estado y notas de seguimientos asignados; sin creación, eliminación, edición de contratos ni lectura técnica.
- Coordinación: creación y edición de contratos, gestión comercial y reasignación de seguimientos, lectura de ejecuciones e incidencias e informe global del ámbito P06.
- Informe Seguimientos de renovación pendientes: Pendiente o En curso y Aplicable=true, incluidos atrasados; agrupación por responsable y orden de vencimiento.
- Compartición manual de contratos cuando cambia su propietario o se transfiere un seguimiento. Requiere revisión y retirada explícita de accesos que ya no correspondan.

Los detalles y límites están en [Acceso y reasignación](docs/ACCESO.md). Account conserva su compartición interna ReadWrite; el permiso comercial solo concede lectura. No se afirma aislamiento de las cuentas estándar de la organización.

## Estructura

| Ruta | Contenido |
|---|---|
| force-app/main/default | Modelo, aplicación, pestañas, layouts, listas, permisos, grupos, roles, compartición e informe |
| manifest/modelo-p06.xml | Modelo declarativo de fase 1B |
| manifest/verificacion-p06.xml | Permiso técnico separado |
| manifest/fase-2.xml | 31 componentes explícitos de gestión comercial |
| manifest/fase-2-navegacion.xml | Ajuste incremental de visibilidad de Informes |
| scripts/fase-1b | Comprobaciones históricas del modelo |
| scripts/fase-2 | Preparación y comprobaciones con identidades y fixtures de fase 2 |
| docs/evidencias-fase-2 | Resultados sanitizados, inventarios y conservación |

No hay clases Apex desplegables, LWC, Flow, integraciones, comunicaciones, programación ni reintentos. El estado de autenticación y los inventarios privados quedan excluidos de Git.

## Documentación

- [Definición y criterios de aceptación](docs/PROJECT_BRIEF.md)
- [Modelo de datos](docs/MODELO_DATOS.md)
- [Estado e historial](docs/STATUS.md)
- [Entorno](docs/ENVIRONMENT.md)
- [Resultados de fase 2](docs/FASE-2.md)
- [Uso de la aplicación](docs/USO.md)
- [Acceso y reasignación](docs/ACCESO.md)
- [Evidencias de fase 2](docs/evidencias-fase-2.json)
- [Fase 1B y sus límites](docs/FASE-1B.md)

La unicidad del campo no acredita generación canónica, concurrencia ni idempotencia integral. El procesamiento corresponde a un alcance posterior.

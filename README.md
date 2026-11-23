# P06 — Seguimiento de renovaciones de contratos en Salesforce

Proyecto independiente para gestionar el seguimiento comercial de contratos ficticios próximos a vencer.

## Estado

Fase 3 implementada, validada y desplegada en la Developer Edition exclusiva P06, API 65.0. El lanzamiento manual captura una fecha y zona horaria, selecciona contratos Activos en la ventana inclusiva de 30 días y crea seguimientos mediante Batch Apex. La identidad canónica protege las inserciones y la repetición conserva los seguimientos existentes.

Pruebas Apex: 14/14 correctas. Demostración real: 120 contratos elegibles, cuatro controles excluidos y tres lotes de tamaño máximo 50. El primer lanzamiento creó 120 seguimientos; la repetición reconoció los 120 existentes sin modificarlos. Se conservan los 50 registros históricos y 247 registros nuevos inventariados.

V1 sigue abierta: faltan las demostraciones de solapamiento real, interrupciones, fallos adversos y recuperación manual. Dos lanzamientos consecutivos no acreditan concurrencia ni rendimiento general.

## Funciones

- Comercial: lectura de contratos y actualización de estado y notas de seguimientos asignados.
- Coordinación: creación y edición de contratos, gestión y reasignación de seguimientos, lectura de ejecuciones e incidencias.
- Operador técnico: lanzamiento manual autorizado, resultados por ejecución y contraste con el trabajo real; permiso separado de las funciones comerciales.
- Informe Seguimientos de renovación pendientes: Pendiente o En curso y Aplicable=true, incluidos atrasados; agrupación por responsable y orden de vencimiento.
- Compartición manual de contratos tras transferencias, con revisión explícita de concesiones. No existe sincronización automática de propietarios.

Se mantienen cuatro objetos, 35 campos y 21 validaciones. Account conserva ReadWrite interno; el permiso comercial solo concede lectura. Los detalles están en [Acceso](docs/ACCESO.md).

## Estructura

| Ruta | Contenido |
|---|---|
| force-app/main/default | Modelo, aplicación estándar, permisos, compartición, informe, cuatro clases Apex y un trigger |
| manifest/modelo-p06.xml | Modelo declarativo de fase 1B |
| manifest/verificacion-p06.xml | Permiso técnico de verificación separado |
| manifest/fase-2.xml | Gestión comercial |
| manifest/fase-2-navegacion.xml | Navegación de Informes |
| manifest/fase-3.xml | 13 miembros explícitos; Salesforce procesó 21 componentes |
| scripts/fase-1b y scripts/fase-2 | Procedimientos y comprobaciones anteriores |
| scripts/fase-3 | Lanzamiento, contraste, demostración y conservación |
| docs/evidencias-fase-3 | Resultados sanitizados e inventario |

No se añaden LWC, Flow, integraciones, comunicaciones, programación ni reintentos. El estado de autenticación y los inventarios privados quedan excluidos de Git.

## Documentación

- [Fase 3: resultados y procedimiento](docs/FASE-3.md)
- [Decisiones transaccionales](docs/DECISIONES-FASE-3.md)
- [Evidencias de fase 3](docs/evidencias-fase-3.json)
- [Definición y criterios de aceptación](docs/PROJECT_BRIEF.md)
- [Modelo de datos](docs/MODELO_DATOS.md)
- [Estado e historial](docs/STATUS.md)
- [Entorno](docs/ENVIRONMENT.md)
- [Uso de la aplicación](docs/USO.md)
- [Acceso y reasignación](docs/ACCESO.md)
- [Fase 2](docs/FASE-2.md) y [sus evidencias](docs/evidencias-fase-2.json)
- [Fase 1B y sus límites](docs/FASE-1B.md)

# P06 — Seguimiento de renovaciones de contratos en Salesforce

Proyecto independiente para gestionar el seguimiento comercial de contratos ficticios próximos a vencer.

## Estado

Fase 3 implementada, validada y desplegada en la Developer Edition exclusiva P06, API 65.0. El lanzamiento manual captura una fecha y zona horaria, selecciona contratos Activos en la ventana inclusiva de 30 días y crea seguimientos mediante Batch Apex. La identidad canónica protege las inserciones y la repetición conserva los seguimientos existentes.

Revisión acotada del 24/11/2026: diagnóstico de reconciliación corregido y trazabilidad de fuentes contrastada. [Resultados y límites](docs/REVISION-FASE-3.md).

Pruebas Apex: 20/20 correctas, incluidas las 14 anteriores y seis regresiones. Demostración real: 120 contratos elegibles, cuatro controles excluidos y tres lotes de tamaño máximo 50. El primer lanzamiento creó 120 seguimientos; la repetición reconoció los 120 existentes sin modificarlos. Se conservan los 50 registros históricos y 247 registros nuevos inventariados.

Fase 4A comprobada el 24/11/2026: dos jobs observados simultáneamente en Processing sobre 30 contratos; rechazo individual real de uno entre cinco y recuperación manual con una creación y cuatro existentes. Los 297 registros anteriores y 51 archivos de evidencia se conservan; quedan 77 registros nuevos inventariados. La regla temporal de ensayo está inactiva. [Resultados y límites](docs/FASE-4A.md).

Fase 4B comprobada: reversión completa de un lote con conservación del otro, aborto antes de comenzar y dos recuperaciones manuales que conservan historia. Los 374 registros anteriores y 82 evidencias siguen intactos; quedan 48 nuevos. Las reglas temporales están inactivas y la traza retirada. [Resultados](docs/FASE-4B.md).

V1 sigue abierta. No se acreditan aborto a mitad del procesamiento, errores reales de start/finish, colisión de inserción, cruce de medianoche ni cambio estacional. Estos ensayos no acreditan rendimiento general.

## Funciones

- Comercial: lectura de contratos y actualización de estado y notas de seguimientos asignados.
- Coordinación: creación y edición de contratos, gestión y reasignación de seguimientos, lectura de ejecuciones e incidencias.
- Operador técnico: lanzamiento manual autorizado, resultados por ejecución y contraste con el trabajo real; permiso separado de las funciones comerciales.
- Informe Seguimientos de renovación pendientes: Pendiente o En curso y Aplicable=true, incluidos atrasados; agrupación por responsable y orden de vencimiento.
- Compartición manual de contratos tras transferencias, con revisión explícita de concesiones. No existe sincronización automática de propietarios.

El paquete de aplicación mantiene cuatro objetos, 35 campos y 21 validaciones. La organización conserva además tres reglas de ensayo inactivas, una de fase 4A y dos de fase 4B. Account conserva ReadWrite interno; el permiso comercial solo concede lectura. Los detalles están en [Acceso](docs/ACCESO.md).

## Estructura

| Ruta | Contenido |
|---|---|
| force-app/main/default | Modelo, aplicación estándar, permisos, compartición, informe, cuatro clases Apex y un trigger |
| manifest/modelo-p06.xml | Modelo declarativo de fase 1B |
| manifest/verificacion-p06.xml | Permiso técnico de verificación separado |
| manifest/fase-2.xml | Gestión comercial |
| manifest/fase-2-navegacion.xml | Navegación de Informes |
| manifest/fase-3.xml | 13 miembros explícitos; Salesforce procesó 21 componentes |
| manifest/revision-fase-3.xml | Tres clases de la corrección del diagnóstico |
| scripts/fase-1b y scripts/fase-2 | Procedimientos y comprobaciones anteriores |
| scripts/fase-3 | Lanzamiento, contraste, demostración y conservación |
| scripts/revision-fase-3 | Trazabilidad reproducible y conservación de la revisión |
| docs/evidencias-fase-3 | Resultados sanitizados e inventario |
| scripts/fase-4b y docs/evidencias-fase-4b | Reversión, aborto, recuperación, conservación y reglas temporales |
| scripts/fase-4a | Ensayos acotados, recuperación y conservación |
| docs/evidencias-fase-4a | Resultados por escenario y regla temporal fuera de la aplicación |

No se añaden LWC, Flow, integraciones, comunicaciones, programación ni reintentos. El estado de autenticación y los inventarios privados quedan excluidos de Git.

## Documentación

- [Fase 4B: reversión, aborto y recuperación](docs/FASE-4B.md)
- [Evidencias de fase 4B](docs/evidencias-fase-4b.json)
- [Fase 4A: solapamiento, rechazo individual y recuperación](docs/FASE-4A.md)
- [Evidencias de fase 4A](docs/evidencias-fase-4a.json)
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

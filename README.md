# P06 — Seguimiento de renovaciones de contratos en Salesforce

Proyecto independiente de CHAMBA DIARIA para preparar el seguimiento comercial de contratos ficticios próximos a vencer.

## Estado

Fase 1B completada en la Developer Edition exclusiva de P06, con API 65.0. Modelo validado y desplegado: cuatro objetos, 35 campos y 19 reglas activas. Los cuatro bloques de comprobación mediante Apex anónimo han superado 117 de 117 casos; se conservan 19 registros ficticios inventariados.

El lookup Solicitante__c mantiene su obligatoriedad mediante una regla de validación compatible con User. El permiso técnico P06_VerificacionModelo permite comprobar once campos con la cuenta técnica, sin añadir permisos administrativos ni de objeto.

Batch, generación canónica de identidad, matriz de acceso comercial e informe siguen pendientes. La fase 1 funcional completa no está terminada.

## Alcance de V1

- Ventana desde una fecha de corte fija hasta esa fecha más 30 días, con ambos límites incluidos.
- Lanzamiento técnico manual de Batch Apex.
- Un seguimiento por contrato y vencimiento, sin sobrescribir seguimientos anteriores al repetir.
- Gestión de pendientes, resultados confirmados e incidencias.
- Permisos por función e informe operativo mediante páginas, listas e informes estándar.

Quedan fuera LWC, Flow, integraciones, comunicaciones externas, renovación automática, programación y reintentos automáticos.

## Estructura

| Ruta | Contenido |
|---|---|
| `sfdx-project.json` | Paquete fuente force-app y API 65.0 verificada en el destino |
| `force-app/main/default/objects/` | Cuatro objetos, campos, fórmulas y validaciones |
| `force-app/main/default/permissionsets/` | Acceso técnico limitado para comprobar el modelo |
| `manifest/modelo-p06.xml` | Manifiesto explícito del modelo |
| `manifest/verificacion-p06.xml` | Manifiesto separado del permiso técnico |
| `scripts/fase-1b/` | Inspección del destino y comprobaciones con fixtures |
| `docs/evidencias-fase-1b/` | Resultados por grupo e inventarios de registros conservados |

Account y User se reutilizan sin modificar sus metadatos. No hay clases desplegables, informes ni automatizaciones. Los archivos de autenticación y estado privado de CLI quedan excluidos de Git.

## Documentación

- [Definición y criterios de aceptación](docs/PROJECT_BRIEF.md)
- [Modelo de datos y diseño de acceso](docs/MODELO_DATOS.md)
- [Estado y comprobaciones](docs/STATUS.md)
- [Entorno y versión API](docs/ENVIRONMENT.md)
- [Procedimiento de fase 1B](docs/FASE-1B.md)
- [Registro de evidencias](docs/evidencias-fase-1b.json)

El siguiente trabajo previsto es la gestión comercial y la configuración de acceso. La unicidad comprobada no acredita generación canónica, concurrencia ni idempotencia integral.

# P06 — Seguimiento de renovaciones de contratos en Salesforce

Proyecto independiente de CHAMBA DIARIA para preparar el seguimiento comercial de contratos ficticios próximos a vencer.

## Estado

Fase 1A preparada localmente: estructura Salesforce DX, cuatro objetos personalizados, 35 campos y 18 reglas de validación. La conversión local a formato Metadata API se ha completado; no equivale a compilación ni aceptación por Salesforce.

No hay organización seleccionada o validada para P06. No se han realizado despliegues ni pruebas funcionales. El Batch, la generación canónica de identidad, el acceso completo y el informe siguen pendientes.

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
| `sfdx-project.json` | Paquete fuente `force-app` y API provisional 65.0 |
| `force-app/main/default/objects/` | Objetos, campos, fórmulas y validaciones |
| `.forceignore` | Exclusiones de la conversión y operaciones de metadatos |
| `.gitignore` | Exclusiones de autenticación, secretos y archivos locales |
| `docs/` | Definición funcional, modelo, entorno y estado |

Account y User se reutilizan sin modificar sus metadatos. No se incluyen clases, permisos, datos de ejemplo, informes ni automatizaciones.

## Documentación

- [Definición y criterios de aceptación](docs/PROJECT_BRIEF.md)
- [Modelo de datos y diseño de acceso](docs/MODELO_DATOS.md)
- [Estado y comprobaciones](docs/STATUS.md)
- [Entorno y versión API](docs/ENVIRONMENT.md)

La fase 1B deberá concretar y verificar el entorno dedicado antes de cualquier operación remota. La fase 1 funcional no está completada.

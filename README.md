# P06 — Seguimiento de renovaciones de contratos en Salesforce

Proyecto independiente de CHAMBA DIARIA para preparar el seguimiento comercial de contratos ficticios próximos a vencer.

## Estado

Base documental inicial. La aplicación todavía no está implementada. No hay organización Salesforce seleccionada, autenticada ni validada para este proyecto. No se han realizado despliegues ni pruebas funcionales.

## Alcance previsto de V1

- Contratos con fecha de vencimiento, estado y responsable.
- Ventana de vencimiento de 30 días, con extremos incluidos.
- Lanzamiento técnico manual de Batch Apex.
- Un seguimiento por contrato y fecha de vencimiento, protegido mediante una clave única frente a repeticiones y solapamientos.
- Gestión de pendientes y registro de resultados e incidencias.
- Permisos por función e informe operativo mediante páginas, listas e informes estándar.

Quedan fuera LWC, Flow, integraciones, comunicaciones externas, renovación automática, programación y reintentos automáticos.

## Documentación

- [Definición del proyecto](docs/PROJECT_BRIEF.md)
- [Estado y comprobaciones](docs/STATUS.md)
- [Entorno y preparación](docs/ENVIRONMENT.md)

## Preparación

La estructura Salesforce y el diseño detallado se definirán en la fase 1. El entorno deberá ser exclusivo de P06, sin reutilizar organizaciones, datos ni configuración de otros proyectos. No se incluyen credenciales ni destinos implícitos.

# Definición del proyecto

## Objetivo

Preparar seguimiento comercial sobre contratos ficticios próximos a vencer en Salesforce, con trazabilidad de ejecuciones e incidencias y protección frente a seguimientos duplicados.

## Alcance previsto

La V1 incluirá fechas, estado y responsable de los contratos; selección dentro de una ventana de vencimiento de 30 días con extremos incluidos; ejecución técnica manual mediante Batch Apex; gestión de seguimientos pendientes; resultados e incidencias; permisos por función e informe operativo.

Cada combinación de contrato y fecha de vencimiento tendrá como máximo un seguimiento. Una clave única protegerá la repetición y el solapamiento de ejecuciones. El diseño de la clave, el tratamiento de conflictos y sus pruebas se definirán antes de implementar.

## Modelo propuesto

| Entidad | Finalidad prevista |
|---|---|
| Account | Cuenta asociada al contrato |
| User | Responsabilidad y acceso |
| ContratoComercial__c | Información del contrato y su vencimiento |
| SeguimientoRenovacion__c | Gestión comercial del vencimiento |
| EjecucionRenovacion__c | Registro de ejecución y resultados |
| IncidenciaRenovacion__c | Registro de incidencias |

Este modelo no está implementado. Los campos, relaciones, estados, reglas de acceso y criterios de selección requieren definición detallada.

## Interfaz y exclusiones

Se utilizarán páginas, listas e informes estándar. No se incluyen LWC, Flow, integraciones, comunicaciones externas, renovación automática, programación ni reintentos automáticos.

## Condiciones de diseño

- Proyecto, repositorio y entorno independientes.
- Datos ficticios conservables durante varias sesiones.
- Sin presuponer licencias adicionales ni usuarios de prueba suficientes.
- Identidad del destino comprobada antes de cualquier operación remota.
- Definición explícita de la fecha de referencia y los límites temporales antes de implementar la ventana de vencimiento.

## Preparación de fase 1

Seleccionar el entorno dedicado, verificar sus capacidades y concretar el modelo de datos, los permisos y los criterios de aceptación. Preparar después la estructura Salesforce y el plan de comprobación de límites temporales, repetición, solapamiento, acceso y registro de incidencias.

# Uso de Renovaciones de contratos

## Comercial

Abrir la aplicación Renovaciones de contratos desde el iniciador de aplicaciones. Contratos comerciales permite consultar fechas, estado, cuenta y seguimientos relacionados. Seguimientos de renovación ofrece la lista Mis pendientes y el detalle de cada seguimiento accesible.

Para trabajar un seguimiento, abrir su detalle y usar Modificar. Cambiar Estado y añadir Notas. Pendiente puede pasar a En curso, Cerrado o Descartado; En curso solo a Cerrado o Descartado. Los estados terminales necesitan una nota con contenido y no admiten reapertura. Guardar un cierre no modifica ni renueva el contrato.

Los campos obligatorios protegidos pueden mostrar controles de edición de Salesforce, pero sus cambios se rechazan. La interfaz no sustituye la seguridad de registros, objetos y validaciones. El comercial no crea seguimientos, modifica contratos, elimina registros ni consulta ejecución o incidencia.

## Coordinación

La misma aplicación incorpora Ejecuciones de renovación e Incidencias de renovación en lectura. Coordinación puede crear y editar contratos y usar Cambiar propietario en contratos o seguimientos. Debe desactivar el envío de notificación y completar el [procedimiento de acceso y reasignación](ACCESO.md), incluida la compartición de lectura del contrato.

Los seguimientos conservan su responsable cuando cambia el propietario del contrato, salvo reasignación explícita. Cambiar fecha o estado del contrato recalcula Aplicable; no altera la historia del seguimiento. Las ejecuciones e incidencias existentes son fixtures de comprobación, no trabajos Batch realizados.

## Informe operativo

Abrir Informes, carpeta Renovaciones de contratos, informe Seguimientos de renovación pendientes. La carpeta concede lectura a comerciales y coordinación.

El informe incluye Pendiente y En curso con Aplicable=true, sin filtro que excluya vencidos. Muestra seguimiento, contrato, cuenta, vencimiento capturado, estado y días restantes. Agrupa por responsable y ordena por vencimiento dentro de cada grupo. Un valor negativo de días indica atraso.

La visibilidad depende de la sesión: cada comercial obtiene sus registros accesibles y coordinación la visión del ámbito P06. Las listas y los filtros no conceden acceso. La ordenación inicial de Mis pendientes puede diferir de la ordenación por fecha del informe.

El nombre solicitado superaba el máximo de 40 caracteres de Salesforce. El título completo Pendientes de seguimiento de renovaciones se conserva en la descripción del informe.

# Cierre de V1

Fecha de aceptación: **24/11/2026**.

Referencia técnica revisada: **4af11abf473f0d1d7443e5539174c301f58e7d18**.

**V1 cerrada y aceptada dentro del alcance demostrado, con límites de verificación documentados. Sin implantación productiva ni datos reales.**

La aceptación corresponde a una demostración técnica de seguimiento de renovaciones de contratos en Salesforce. Sustituye la decisión pendiente al terminar fase 5; no equivale a haber superado íntegramente todos los escenarios de prueba. La referencia anterior identifica la versión técnica revisada, no el futuro commit de cierre documental. La publicación del cierre es un paso separado.

## Objetivo y funcionalidades entregadas

Preparar el seguimiento comercial de contratos ficticios próximos a vencer, con trazabilidad de procesamiento e incidencias y protección de la identidad contrato-vencimiento.

- Modelo de cuatro objetos propios, 35 campos y 21 validaciones, con Account y User como dependencias estándar.
- Gestión comercial mediante aplicación, páginas, listas e informe estándar; estados, notas y protección de cierres terminales.
- Acceso por función comercial, coordinación y operador técnico; reasignación explícita y compartición manual del contrato cuando es necesaria.
- Lanzamiento manual autorizado y Batch Apex para contratos Activos dentro de la ventana inclusiva entre corte y corte + 30 días; fecha y zona de referencia capturadas por ejecución.
- Identidad canónica contrato-vencimiento, repetición sin sobrescribir seguimientos existentes, cambios de vencimiento y restauración con conservación de historia.
- Resultados confirmados, incidencias, diagnóstico de reconciliación y recuperación mediante una nueva ejecución manual.
- Informe de seguimientos Pendiente y En curso aplicables, incluidos atrasados, sujeto al acceso de la identidad que lo consulta.

Quedan fuera de alcance la renovación automática de contratos, LWC, Flow, integraciones, comunicaciones externas, programación y reintentos automáticos. No se entrega una implantación productiva, tratamiento de datos reales ni una garantía general de rendimiento, volumen o aptitud productiva.

## Evidencias principales

Los resultados siguientes proceden de sus fases originales. El cierre documental no repite pruebas ni realiza consultas a Salesforce.

| Ámbito | Evidencia y resultado acreditado |
|---|---|
| Modelo declarativo | [Fase 1B](FASE-1B.md) y [resultados](evidencias-fase-1b.json): 117 comprobaciones correctas; intentos anteriores conservados |
| Gestión y acceso comercial | [Fase 2](FASE-2.md) y [resultados](evidencias-fase-2.json): sesiones comerciales y de coordinación, denegaciones ordinarias, compartición e informe |
| Procesamiento y repetición | [Fase 3](FASE-3.md) y [resultados](evidencias-fase-3.json): 120 creaciones y 120 existentes en dos jobs de tres lotes, sin sobrescritura |
| Regresiones y diagnóstico | [Revisión de fase 3](REVISION-FASE-3.md) y [comprobación final](evidencias-revision-fase-3/comprobacion-final.json): 20/20 pruebas Apex y fuentes contrastadas en esa revisión |
| Solapamiento y rechazo individual | [Fase 4A](FASE-4A.md) y [resultados](evidencias-fase-4a.json): dos Processing observados sobre 30 contratos; cuatro creaciones y un rechazo, seguidos de recuperación de uno y reconocimiento de cuatro |
| Reversión, aborto y recuperación | [Fase 4B](FASE-4B.md), [prueba de lote](evidencias-fase-4b/reversion-prueba-lotes.json) y [resultados](evidencias-fase-4b.json): execute revertido con otro lote conservado; aborto previo al inicio; recuperaciones manuales sin borrar historia |
| Vencimiento y responsable | [Fase 5](FASE-5.md) y [recorrido final](evidencias-fase-5/recorrido-final.json): tres jobs con creaciones 2, 2 y 0, y dos existentes al restaurar; cerrado no reabierto y propietarios anteriores conservados |
| Informe y conservación | [Índice de fase 5](evidencias-fase-5.json) y [conservación final](evidencias-fase-5/conservacion-final.json): seis contrastes informe/SOQL por IDs, 422 registros anteriores y diez nuevos; compartición adicional separada |
| Preparación de instalación | [Guía](INSTALACION.md), [inspección](evidencias-fase-5/instalacion-inspeccion.json) y [conversión](evidencias-fase-5/instalacion-conversion.json): manifiesto completo de 36 miembros y conversión local de 42 archivos; sin instalación limpia |

La [matriz AC-01 a AC-20](ACEPTACION-V1.md) conserva los criterios, referencias y niveles de prueba. Sus coberturas parciales siguen siendo parciales después de la aceptación.

## Límites aceptados

| Límite de verificación conservado | Relación con los criterios y alcance de la aceptación |
|---|---|
| Solapamiento observado, sin colisión simultánea de inserción acreditada sobre la misma identidad | AC-06 y AC-18 parcialmente cubiertos. Se acepta la demostración observada, sin atribuir una colisión real al ensayo |
| Relectura comprobada mediante pruebas controladas, sin modificación provocada entre start y execute de un job persistente | AC-04 parcialmente cubierto; también delimita la relectura de AC-03. La prueba controlada no se presenta como modificación concurrente real |
| Sin cruce real de medianoche, transición estacional ni observación del paso real de día | AC-03, AC-13 y AC-20 parcialmente cubiertos. Se conservan las pruebas de corte, zona, fórmulas y fechas pasadas; no acreditan esos eventos temporales reales |
| Aborto probado antes de comenzar, no durante el procesamiento; sin fallos reales inducidos en start o finish | AC-09 parcialmente cubierto. La reversión real de execute de AC-08 se conserva dentro de su caso probado, sin extenderla a start/finish |
| Operación técnica real con perfil administrativo previo, sin demostración integral con un perfil técnico mínimo independiente | AC-14 y AC-19 parcialmente cubiertos. Las sesiones comerciales y las barreras automatizadas no sustituyen esa demostración del operador |
| Denegaciones ordinarias de borrado comprobadas, sin ensayo de restricciones de padres con un usuario autorizado para eliminar ni particularidades de papelera | AC-15 parcialmente cubierto. La revisión estática de Restrict no se convierte en ensayo real de eliminación |
| Despliegues incrementales comprobados; manifiesto completo revisado y convertido localmente, sin validación remota de instalación limpia ni instalación limpia ejecutada | Límite de entrega adicional a AC-01 a AC-20. La conversión no acredita instalación ni funcionamiento sobre una organización vacía |
| Sin garantías generales de rendimiento, volumen o uso productivo | Límite global de la demostración. Las muestras y los lotes ensayados no constituyen una certificación de capacidad o producción |

Estos límites se aceptan expresamente para cerrar V1 como demostración técnica. No se rebajan ni reescriben los criterios originales, ni se declaran probados los escenarios sin evidencia. No quedan como tareas automáticas de V1. Cualquier ampliación, nuevo ensayo, instalación u operación posterior requiere un nuevo alcance explícito.

## Inventarios e historia conservados

El inventario de referencia contiene **432 registros de negocio**, suma de los 422 anteriores y los diez nuevos de fase 5. Estos diez son una cuenta, dos contratos, tres ejecuciones y cuatro seguimientos. Se conserva además **una compartición manual Read**, justificada por el seguimiento anterior de B; no se cuenta como registro de negocio.

La conservación final de fase 5 documenta 133 archivos de evidencia anteriores intactos, permiso temporal de reasignación retirado, tres reglas de ensayo inactivas, Login As=false y usuarios, asignaciones, grupos y trazas conservados. Son resultados históricos leídos localmente, no nuevas verificaciones remotas realizadas para el cierre.

Los documentos de fases y JSON, incluidos intentos fallidos y estados de V1 abierta en aquel momento, mantienen su contenido original. La aceptación posterior se registra aquí y en los documentos de estado, sin atribuirla retrospectivamente a los ensayos.

## Alcance del cierre documental

Solo se actualiza documentación de aceptación, estado e instrucciones vigentes. Código, metadatos, permisos, datos, configuración e inventarios quedan fuera de cualquier modificación. Las comprobaciones de cierre son locales: enlaces relativos, coherencia de cifras, conservación de criterios e históricos y diferencias Git. No se ejecutan pruebas de aplicación ni operaciones Salesforce.

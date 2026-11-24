# Fase 5 — Validación funcional y preparación del cierre

Comprobada el 24/11/2026 sobre 69622d3013fbc77fc69877dcadddfde3dbae6be2, destino exclusivo p06-renovaciones-dev y API 65.0. Organization e identidad técnica contrastadas con recibos privados antes de escribir. V1 permanece abierta; [matriz de aceptación](ACEPTACION-V1.md) y [guía de instalación](INSTALACION.md).

## Recorrido de vencimiento y responsable

Se prepararon una cuenta y dos contratos ficticios nuevos, propiedad inicial de B. Los tres lanzamientos usaron exclusivamente esos dos IDs, tamaño de lote cinco y un lote efectivo cada uno. Corte 2026-11-24, fin inclusivo 2026-12-24, zona Salesforce Europe/Paris. Timestamps de evidencias en UTC.

| Lanzamiento | Ejecución | Job | Creados | Existentes |
|---|---|---|---:|---:|
| Original | a01g700001MMoCIAA1 | 707g700001DZpg1AAD | 2 | 0 |
| Fecha alternativa | a01g700001MOIOPAA5 | 707g700001DaBDHAA3 | 2 | 0 |
| Fecha restaurada | a01g700001MNACoAAP | 707g700001DZw9XAAT | 0 | 2 |

Los tres jobs finalizaron Completed, cero errores; las ejecuciones Completada, Evaluados=2, sin omitidos, fallidos, lotes fallidos, incidencias ni reconciliación. [Resultado completo](evidencias-fase-5/recorrido-final.json).

| Contrato | Fecha original | Alternativa | Final | Propietario del contrato | Seguimiento original | Seguimiento alternativo |
|---|---|---|---|---|---|---|
| a00g700002bOEDBAA4 | 2026-12-04 | 2026-12-14 | 2026-12-04 | B → A | a03g700000tTyp7AAC | a03g700000tTz0PAAS |
| a00g700002bOEDCAA4 | 2026-12-05 | 2026-12-15 | 2026-12-05 | B → B | a03g700000tTyp8AAC | a03g700000tTz0QAAS |

| Paso | Resultado esperado y observado | Evidencia |
|---|---|---|
| Original | Dos seguimientos Pendiente, aplicables y propiedad de B | [Lanzamiento y resultado](evidencias-fase-5/vencimientos-original-resultado.json) |
| Gestión | Primero Cerrado con nota; segundo En curso con nota | [Estados](evidencias-fase-5/02-estados-comprobacion.json) |
| Responsable | Primer contrato pasa de B a A; seguimiento anterior conserva B. Read manual del contrato para B | [Compartición](evidencias-fase-5/03-comparticion.json) |
| Cambiar fechas | Ambos originales dejan de ser aplicables y conservan campos persistidos | [Cambio](evidencias-fase-5/04-fechas-alternativas-comprobacion.json) |
| Procesar fechas nuevas | Dos seguimientos nuevos Pendiente: primero de A y segundo de B; originales intactos | [Alternativa](evidencias-fase-5/05-alternativa-comprobacion.json) |
| Restaurar fechas | Originales aplicables otra vez; alternativas conservadas y no aplicables | [Restauración](evidencias-fase-5/06-restauracion-fechas-comprobacion.json) |
| Repetir | Cero creaciones y dos existentes; Cerrado no reabierto, En curso aplicable, notas y responsables conservados | [Repetición](evidencias-fase-5/07-repeticion-comprobacion.json) |

Se compararon identidad, estado, notas, propietario y origen junto con los restantes campos persistidos. Aplicable y DiasRestantes son fórmulas y se verifican por separado; cambios de fórmula no se presentan como escrituras sobre la historia.

Responsable y ejecución no forman parte de la clave: identifican asignación y procedencia, no la pareja contrato-vencimiento. Incluirlos permitiría duplicar la misma obligación al transferir o relanzar. La clave canónica conserva una sola identidad y permite que la fecha alternativa tenga su propia historia.

## Identidad técnica y acceso

La cuenta técnica carecía inicialmente de P06_Reasignar. Para la transferencia se validó y desplegó P06_F5_ReasignacionTemporal, con ese único permiso personalizado, asignado exclusivamente al operador existente. Tras transferir se retiraron asignación y componente mediante paquete destructivo limitado al Permission Set temporal, también validado previamente. No se modificaron perfiles, roles, grupos, usuarios ni permisos comerciales.

Recibos: [alta](evidencias-fase-5/permiso-alta-recibos.json), [retirada](evidencias-fase-5/permiso-retirada-recibos.json) y [restauración](evidencias-fase-5/permiso-restaurado.json). El permiso efectivo terminó false y el componente ausente. Los paquetes están fuera de force-app y del manifiesto de instalación.

[UserRecordAccess](evidencias-fase-5/05-alternativa-acceso.json) confirma que B lee el contrato transferido sin editarlo, conserva edición de su seguimiento original y no lee el nuevo seguimiento de A. A puede editar el contrato y el nuevo seguimiento. Se conserva una compartición Manual Read justificada por el seguimiento antiguo de B. Fueron operaciones técnicas y consultas de acceso; no se abrió una sesión comercial nueva ni se habilitó Login As. Las sesiones comerciales reales pertenecen a fase 2.

## Informe y conservación

Se compararon Analytics y SOQL con la misma identidad técnica, resultados completos e igualdad de IDs, además del conjunto nuevo incluido/excluido:

| Paso y evidencia | Filas del informe y SOQL | Nuevos incluidos |
|---|---:|---:|
| [01-original](evidencias-fase-5/01-original-informe.json) | 181 | 2 |
| [02-estados](evidencias-fase-5/02-estados-informe.json) | 180 | 1 |
| [04-fechas-alternativas](evidencias-fase-5/04-fechas-alternativas-informe.json) | 179 | 0 |
| [05-alternativa](evidencias-fase-5/05-alternativa-informe.json) | 181 | 2 |
| [06-restauracion-fechas](evidencias-fase-5/06-restauracion-fechas-informe.json) | 180 | 1 |
| [07-repeticion](evidencias-fase-5/07-repeticion-informe.json) | 180 | 1 |

El cerrado queda excluido por estado incluso cuando vuelve a ser aplicable. Los alternativos quedan excluidos al restaurar el vencimiento. El original En curso vuelve al informe.

[Conservación final](evidencias-fase-5/conservacion-final.json): 422 registros anteriores sin cambios persistidos, 133 archivos históricos idénticos en bytes y diez registros nuevos conservados: una cuenta, dos contratos, tres ejecuciones y cuatro seguimientos. La compartición adicional se cuenta por separado. Consultas completas por bloques de hasta 150 IDs, con verificación de cardinalidad y paginación. Se separan attributes, LastViewedDate, LastReferencedDate y DiasRestantes de la comparación persistida.

Cuatro parejas únicas, contadores coherentes y ejecuciones anteriores del recorrido sin cambios. Usuarios, asignaciones, grupos y trazas iguales al inicio; tres reglas F4A/F4B inactivas, Login As=false. Fuentes de aplicación y manifiestos históricos intactos.

## Entrega y comprobaciones

No apareció un defecto funcional nuevo y no se cambió ni desplegó código de aplicación. Las únicas operaciones de metadatos fueron el alta y retirada del permiso temporal. Se añaden procedimientos históricos de fase 5, evidencias sanitizadas, matriz AC-01 a AC-20, guía de instalación y manifiesto conjunto de 36 miembros. La conversión local produjo 42 archivos; no se ejecutó instalación limpia ni validación remota de ese paquete.

Las comprobaciones locales de sintaxis, XML, JSON, referencias, contenido público y conservación de fuentes figuran en [revision-local.json](evidencias-fase-5/revision-local.json). Los 20/20 Apex son evidencia histórica de la revisión de fase 3, no pruebas repetidas en esta fase. No se repitieron ensayos adversos de fase 4B.

La propuesta es revisar y aceptar posteriormente la cobertura documentada; no cerrar V1 de forma automática. Siguen pendientes las decisiones enumeradas en [ACEPTACION-V1](ACEPTACION-V1.md), incluidas colisión de inserción, aborto durante el procesamiento, fallos reales de start/finish, casos temporales, alcance técnico mínimo, eliminación con lookups e instalación limpia. No se ejecutaron staging, commit ni push.

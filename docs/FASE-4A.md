# Fase 4A — Solapamiento y fallos parciales reales

Fecha: 24/11/2026. Referencia: 563b4399447898a1d86c5bc0312aded2c15ce897. Destino exclusivo p06-renovaciones-dev, Developer Edition, API 65.0. Organization e identidad técnica se contrastaron con los recibos privados antes de escribir. V1 sigue abierta.

## Resultado

| Escenario | Resultado observado | Evidencia |
|---|---|---|
| Solapamiento | Dos jobs sobre los mismos 30 contratos, ambos Processing en dos observaciones completas; 30 seguimientos únicos | [Confirmación final](evidencias-fase-4a/solapamiento-1-confirmacion-final.json) |
| Rechazo individual | Un execute sobre cinco contratos: cuatro creados, uno fallido, una incidencia y cero lotes fallidos | [Comprobación parcial](evidencias-fase-4a/parcial-comprobacion.json) |
| Recuperación manual | Nueva ejecución sobre los mismos cinco: uno creado y cuatro existentes sin cambios | [Recuperación](evidencias-fase-4a/recuperacion-comprobacion.json) |
| Contraste repetido | Dos contrastes por ejecución, sin cambios de resultados ni incidencias duplicadas | [Contraste](evidencias-fase-4a/contraste-repetido.json) |
| Informe | 160 filas e IDs coincidentes con SOQL; 34 nuevos incluidos y uno cerrado excluido | [Informe](evidencias-fase-4a/informe.json) |
| Conservación | 297 anteriores sin cambios persistidos, 77 nuevos conservados y 51 evidencias históricas idénticas en bytes | [Conservación final](evidencias-fase-4a/conservacion-final.json) |

## Contexto y trazabilidad

Los cuatro lanzamientos usan corte 2026-11-24, zona Salesforce Europe/Paris y ventana inclusiva hasta 2026-12-24. Cada lote tiene tamaño máximo cinco. Las marcas temporales de los JSON están en UTC. Los conjuntos nuevos parten sin seguimientos y se seleccionan exclusivamente por sus IDs inventariados; no se ejecuta una selección general.

| Escenario | Ejecución | AsyncApexJob | Lotes | Evaluados | Creados | Existentes | Omitidos | Fallidos | Lotes fallidos |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| Solapamiento A | a01g700001MMo2bAAD | 707g700001DZaILAA1 | 6/6 | 30 | 30 | 0 | 0 | 0 | 0 |
| Solapamiento B | a01g700001MMo2cAAD | 707g700001DZaINAA1 | 6/6 | 30 | 0 | 30 | 0 | 0 | 0 |
| Rechazo individual | a01g700001MMzdxAAD | 707g700001DaDwPAAV | 1/1 | 5 | 4 | 0 | 0 | 1 | 0 |
| Recuperación | a01g700001MLpryAAD | 707g700001DYEnkAAH | 1/1 | 5 | 1 | 4 | 0 | 0 | 0 |

Los cuatro jobs terminaron Completed, NumberOfErrors=0. La ejecución del rechazo conserva Completada con incidencias; las otras tres terminaron Completada. RequiereReconciliacion=false en todas. Completed del trabajo no sustituye la lectura del resultado de negocio ni acredita ausencia de rechazos individuales. Los estados y contadores de plataforma se describen en [AsyncApexJob](https://developer.salesforce.com/docs/platform/object-reference/references/standard-objects/object-asyncapexjob.html).

## Solapamiento observado

Los dos trabajos se encolaron en una misma transacción sobre exactamente los mismos 30 IDs. La observación Holding dentro de esa transacción precede al commit y solo acredita encolado. El sondeo posterior encontró ambos Processing en una misma respuesta SOQL a las 08:21:42.630Z, con 2/6 lotes cada uno, y a las 08:21:43.230Z, con 5/6. Se observó solapamiento en el primer par ejecutado y no se lanzaron conjuntos adicionales.

Las 30 claves coinciden con IdContrato18 y vencimiento capturado. Las creaciones confirmadas suman 30 y existen exactamente 30 seguimientos; el segundo trabajo reconoce 30 existentes. No hay incidencias ni sobrescrituras de propietario, estado, notas u origen entre las primeras lecturas disponibles y la confirmación final. Los registros conservan estado Pendiente, notas vacías y propietario del contrato; CreatedDate y LastModifiedDate coinciden.

No está demostrada una colisión de inserción sobre la misma identidad. YaExistentes no diferencia una consulta previa de una confirmación posterior a DUPLICATE_VALUE; no se instrumentó esa ruta interna. La revisión del código mantiene separados los demás errores, pero estos trabajos no produjeron errores reales de bloqueo o acceso. No se atribuye esa cobertura adversa al ensayo. Tampoco se infiere simultaneidad física de CPU, rendimiento o capacidad general.

La primera lectura vio ambos jobs Completed mientras una ejecución aún figuraba En curso. Se conserva la [comprobación inicial negativa](evidencias-fase-4a/solapamiento-1-comprobacion.json) y su [resultado original](evidencias-fase-4a/solapamiento-1-doble-corregido-resultado.json). La consulta posterior confirmó ambos cierres, a las 08:21:47Z y 08:21:43Z, sin relanzar ni modificar resultados. El observador ahora espera también el cierre persistido de cada ejecución vinculada. Tres regresiones Node cubren el cierre pendiente, la vinculación y el trabajo activo. No se atribuye una causa interna a esa diferencia temporal ni un defecto de aplicación.

## Rechazo individual y restauración

El conjunto independiente contiene cinco contratos. La regla temporal P06_F4A_RechazoAcotado estaba ausente inicialmente y rechaza solo ISNEW con Contrato__c igual a a00g700002bMxmHAAS. Se conservan su [estado inicial y alcance](evidencias-fase-4a/regla-inicial.json), [definición activa](evidencias-fase-4a/regla-activa/objects/SeguimientoRenovacion__c.object) y [definición inactiva](evidencias-fase-4a/regla-inactiva/objects/SeguimientoRenovacion__c.object), fuera de force-app y de los manifiestos de aplicación. La propiedad active forma parte de [ValidationRule en Metadata API](https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-validationrule.html).

| Operación temporal | Validación | Despliegue | Resultado |
|---|---|---|---|
| Activación | 0Afg700000L73gDCAR | 0Afg700000L73mfCAB | Succeeded; lectura active=true |
| Desactivación | 0Afg700000L74FhCAJ | 0Afg700000L74NlCAJ | Succeeded; lectura active=false |

Cada paquete contiene una única ValidationRule. Se utilizó NoTestRun para el componente de ensayo en Developer Edition; no constituye una ejecución de pruebas Apex. Se conservaron las reglas anteriores del objeto y se verificó la definición exacta al leerla después. La regla temporal permanece en la organización **inactiva**, verificada también al terminar; no se afirma que vuelva a estar ausente. [Recibos de activación](evidencias-fase-4a/regla-activa-recibos.json) y [desactivación](evidencias-fase-4a/regla-inactiva-recibos.json).

El único execute creó cuatro registros y conservó una incidencia FIELD_CUSTOM_VALIDATION_EXCEPTION en etapa Creación, con contrato, clave, campo afectado y mensaje ficticio acotado. El quinto seguimiento no existía. Se cumple 5 = 4 + 0 + 0 + 1 y LotesFallidos=0: el rechazo individual no se contabiliza como reversión del lote completo.

## Recuperación y repetición

Antes del nuevo lanzamiento se consultaron el trabajo original, su ejecución, su incidencia y los cuatro seguimientos. Tras verificar la regla inactiva, se prepararon técnicamente dos seguimientos nuevos: uno Cerrado con nota y otro En curso con nota. Esta preparación está [inventariada](evidencias-fase-4a/recuperacion-preparacion.json); no acredita una nueva sesión comercial.

La nueva ejecución creó solo el seguimiento previamente rechazado y reconoció los otros cuatro. Estos conservaron todos los campos comparados, incluidos propietario, estado, notas y ejecución de origen. El nuevo registro se vincula a la ejecución de recuperación. El intento original sigue Completada con incidencias y conserva su diagnóstico inmutable; no se convirtió en éxito ni se borró. Dos contrastes posteriores sobre cada ejecución no cambiaron sus campos ni aumentaron la única incidencia.

Repetir un lanzamiento es una acción manual nueva que reconoce identidades persistidas. El solapamiento añade observaciones de procesamiento coincidente. Un rechazo individual conserva los éxitos del mismo lote. La recuperación retira la causa del rechazo y crea otra ejecución para completar lo pendiente, preservando ambos resultados. No hay reintentos automáticos.

## Informe y conservación

Analytics REST y SOQL se ejecutaron con la misma conexión e identidad técnica existente, que conserva su perfil previo. No es una nueva comprobación desde sesión comercial. Ambos devolvieron los mismos 160 IDs, con allData=true y consulta completa. Aparecen los 30 seguimientos de solapamiento y cuatro del conjunto parcial, incluido En curso y el recuperado; el Cerrado queda excluido. El JSON enumera los IDs incluidos y excluidos.

El inventario nuevo conserva 2 Account, 35 contratos, 4 ejecuciones, 35 seguimientos y 1 incidencia: 77 registros. Se verificaron también los 297 anteriores y sus campos persistidos. Se excluyen de la comparación attributes, LastViewedDate, LastReferencedDate y la fórmula temporal DiasRestantes__c. Los demás campos, incluidos LastModifiedDate y SystemModstamp cuando están presentes, se comparan sin normalizarlos.

Las lecturas por inventario usan bloques de hasta 150 IDs, verifican IDs y recuentos completos y no confunden LIMIT 200 con un inventario completo. Las consultas generales consumen todos los cursores y contrastan filas con totalSize; las lecturas acotadas verifican COUNT antes de aceptar el resultado. El informe y el inventario final quedaron completos en las páginas registradas.

Los 51 archivos históricos de evidencia y todos los archivos de force-app y manifest conservan sus bytes iniciales. Usuarios comerciales, perfiles, roles y asignaciones consultados siguen iguales. SeguimientoRenovacion mantiene Private interno y externo; Login As=false. No se modificaron usuarios, permisos, configuración global ni otros proyectos. Los recibos completos, datos de identidad e instantáneas privadas permanecen en .sf, excluido de Git.

## Intentos no satisfactorios conservados

- Un bloque anónimo inicial no compiló por WITH SYSTEM_MODE en su consulta de observación. No creó jobs ni seguimientos. El observador se cambió a USER_MODE y se reutilizó el mismo conjunto nuevo tras comprobar ausencia de efectos. [Recibo resumido](evidencias-fase-4a/solapamiento-1-compilacion-inicial.json).
- La validación 0Afg700000L70yTCAR rechazó el paquete por ausencia de package.xml. Se consultó su estado final después del timeout de CLI. [Recibo](evidencias-fase-4a/regla-validacion-inicial-fallida.json).
- La validación 0Afg700000L72c5CAB rechazó el componente: el ZIP contenía un separador de Windows en la entrada del objeto. La versión aceptada usa package.xml en la raíz y entradas explícitas con /. La fórmula no cambió. [Recibo y entradas observadas](evidencias-fase-4a/regla-validacion-zip-fallida.json).
- El primer resultado del observador de solapamiento fue negativo por consultar antes del cierre persistido; se conserva separado de la confirmación posterior satisfactoria.

Las dos validaciones de empaquetado fueron checkOnly y no activaron la regla. Los errores locales de preparación del ZIP no generaron trabajos Batch. No se ocultaron ni convirtieron estos recibos en éxitos.

## Procedimientos y comprobaciones

Los scripts de scripts/fase-4a reutilizan la conexión de la CLI instalada y los recibos privados de P06. No instalan dependencias. inspeccionar.cjs captura la base una sola vez; solapamiento.cjs prepara y observa un par; parcial.cjs activa el rechazo y lo desactiva en finally; recuperar.cjs prepara la muestra, lanza una nueva ejecución y contrasta dos veces; finalizar.cjs verifica conservación e informe. confirmar-solapamiento.cjs solo relee los trabajos del primer ensayo.

No volver a ejecutar los lanzamientos sobre este estado terminado. Los procedimientos bloquean nombres de conjunto o ejecución ya registrados; ante interrupción se inspeccionan primero los recibos y Salesforce. Los IDs de la regla publicada pertenecen exclusivamente a este ensayo y no son una configuración de aplicación para instalar en otro destino. Un futuro ensayo requiere alcance propio y otro inventario.

Se ejecutaron tres pruebas locales de observación con node --test scripts/fase-4a/observacion.test.cjs. Los ensayos Salesforce son comprobaciones reales separadas de esas regresiones. No se modificó ni desplegó código de aplicación, y no se repitió la batería Apex histórica: sus 20/20 corresponden a la revisión anterior. La comprobación local de entrega registra sintaxis, XML, JSON, enlaces y diferencias Git en [revision-local.json](evidencias-fase-4a/revision-local.json).

## Límites pendientes

La fase 4A queda comprobada dentro de este alcance. Sigue sin acreditarse colisión real de inserción; tampoco se ensayaron abortos, fallos que reviertan un lote completo, recuperación tras esos estados, cruce real de medianoche o cambio horario estacional. Los resultados no prometen rendimiento o volumen general. V1 sigue abierta y no se inicia fase 4B.

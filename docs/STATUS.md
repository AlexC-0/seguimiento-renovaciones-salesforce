# Estado del proyecto

Fecha: 24/11/2026.

## Fase 4A

Comprobada sobre 563b4399447898a1d86c5bc0312aded2c15ce897. Dos trabajos sobre los mismos 30 contratos se observaron Processing en dos consultas completas, con 2/6 y 5/6 lotes cada uno. Resultado final: 30 creados y 30 existentes entre ambas ejecuciones, 30 identidades únicas y ningún seguimiento sobrescrito. No se acredita una colisión de inserción.

Un lote independiente de cinco contratos creó cuatro seguimientos y rechazó uno mediante regla temporal limitada a un Id nuevo. Conserva una incidencia, Completada con incidencias y cero lotes fallidos. La regla quedó inactiva antes de recuperar. Una nueva ejecución creó solo el pendiente y reconoció cuatro existentes, incluido un cerrado y otro con notas. El intento original y su incidencia siguen intactos; dos contrastes por ejecución no duplicaron diagnósticos.

Conservación final: 297 registros anteriores sin cambios persistidos, 77 nuevos inventariados y 51 archivos históricos de evidencia idénticos en bytes. Informe y SOQL coinciden en 160 IDs bajo la misma cuenta técnica: 34 nuevos incluidos y uno cerrado excluido. Login As=false, usuarios y asignaciones comerciales intactos.

Sin cambios ni despliegue de aplicación. Se corrigieron observación y empaquetado de los procedimientos del ensayo; tres regresiones Node correctas. Se conservan el fallo de compilación inicial, dos validaciones de empaquetado rechazadas y la comprobación prematura de cierre. Las validaciones y despliegues finales de la única regla temporal terminaron Succeeded; su estado final es inactiva, no ausencia.

V1 sigue abierta. Colisión de inserción, abortos, reversión total de lote y recuperación posterior, medianoche y cambio estacional permanecen fuera de la evidencia real obtenida. [Detalle de fase 4A](FASE-4A.md) y [evidencias](evidencias-fase-4a.json).

## Revisión acotada de fase 3

Completada sobre 31528e267a3f2d65ba41015dc1ef9a5838c56195. Las tres discrepancias de huella se explican por un CRLF final local convertido a LF en el blob Git. Los recibos originales coinciden con los bytes locales capturados. La lectura de las clases remotas omite el LF final; el contenido coincide al aplicar las normalizaciones explícitas N1 y N2. Se conservan las huellas originales y se añade un contraste reproducible; no había una diferencia funcional oculta.

finish y contrastar comparten diagnóstico atómico, incluso con reconciliación previamente marcada. Una huella de la observación evita incidencias repetidas y conserva novedades. LotesFallidos solo aumenta con información admitida por la política documentada; los cinco contadores individuales no se reconstruyen ni se modifica automáticamente la marca de incertidumbre.

Validación 0Afg700000L6u8HCAR y despliegue 0Afg700000L6huECAR terminados Succeeded: tres clases y 20/20 pruebas. Fuentes remotas contrastadas después del despliegue. Conservación: 297/297 registros, 47/47 archivos históricos de evidencia y asignaciones comerciales intactas. Cero jobs Batch persistentes nuevos; Login As=false. La primera validación registró 19/20 por una aserción del tipo de excepción CRUD; su recibo se conserva separado.

Los estados adversos de las regresiones son observaciones controladas en memoria, vinculadas a jobs reales de prueba sin fallos. No se ejecutaron ensayos reales de solapamiento, aborto o recuperación, ni se relanzaron demostraciones. V1 sigue abierta. Véanse [REVISION-FASE-3.md](REVISION-FASE-3.md) y [comprobacion-final.json](evidencias-revision-fase-3/comprobacion-final.json).

## Situación al cierre inicial de fase 3

Fase 3 completada dentro del alcance de lanzamiento manual y procesamiento, sobre 0716f9fc41d2b2142a79d9abd495f8236783ce03. Validación 0Afg700000L0MUHCA3 y despliegue 0Afg700000L0NQLCA3 terminados Succeeded, con 21/21 componentes y 14/14 pruebas Apex. La comprobación original comparó las huellas de archivos locales del paquete; el contraste adicional con blobs publicados y Body remoto figura en la revisión del 24/11/2026.

Dos jobs reales completaron tres lotes cada uno: 707g700001DKOHsAAP creó 120 seguimientos y 707g700001DLwdpAAD reconoció los mismos 120 sin cambios. Corte 23/11/2026, zona del solicitante Europe/Paris, fin 23/12/2026. Cero fallidos, omitidos, incidencias o lotes fallidos. Los cuatro controles excluidos no generaron seguimientos.

Informe y SOQL coinciden en 126 registros, incluidos 119 nuevos y excluido el nuevo cerrado. Consulta realizada con la cuenta técnica y su perfil administrativo previo; UserRecordAccess confirma acceso de A y B a los 120 seguimientos y contratos. No se repitieron sesiones comerciales ni se habilitó Login As. Se conservan las asignaciones de A/B, los 50 fixtures y 34 archivos históricos de evidencia. Quedan 247 registros nuevos inventariados.

V1 no está cerrada. Solapamiento real, interrupciones y recuperación adversa son el siguiente alcance. El contraste manual normal está ejecutado; la detección de cierre incoherente y rollback se ensayan en pruebas unitarias, sin presentarlos como incidentes reales recuperados. Véanse [FASE-3.md](FASE-3.md) y [evidencias-fase-3.json](evidencias-fase-3.json).

## Situación al cierre de fase 2

Fase 2 completada sobre f779561036541b29e03fbf8f41e851c49bbea7c9. Aplicación Lightning, permisos comerciales y de coordinación, compartición e informe desplegados y comprobados con dos identidades ficticias sin privilegios administrativos. Cuatro objetos, 35 campos y 21 validaciones.

Resultado: 70 comprobaciones API agrupadas correctas, creación de contrato adicional, cuatro comprobaciones de interfaz y contrastes de informe en las mismas sesiones. Se conservan 19 fixtures históricos sin cambios y 31 nuevos. Login As está restaurado a false. La función de coordinación y el permiso comercial se probaron con asignaciones separadas.

Los [resultados de fase 2](FASE-2.md), la [matriz de acceso](ACCESO.md) y las [evidencias](evidencias-fase-2.json) delimitan el alcance. Al cierre de fase 2 no había Batch, servicio de lanzamiento, generación canónica ni contraste de reconciliación. La fase 3 incorpora ese procesamiento con los límites indicados arriba.

## Situación al cierre de fase 1B

Fase 1B completada sobre la referencia publicada 3c6341eff29d9faee09c8d248f516377de45029d. Destino exclusivo P06 verificado como Developer Edition, API 65.0, sin colisiones iniciales con los cuatro objetos del modelo.

El modelo está aplicado: cuatro objetos, 35 campos y 19 validaciones. Se han ejecutado 117 comprobaciones correctas mediante cuatro bloques de Apex anónimo y se conservan 19 fixtures. La matriz de acceso comercial y el procesamiento siguen pendientes; esta fase no completa toda la funcionalidad de V1.

El repositorio permanece en main, con el remoto del proyecto conservado. No se han ejecutado staging, commits ni push.

## Antecedentes

La fase 0 inspeccionó el entorno sin modificaciones. Después se preparó la base documental inicial como cambio separado. El inventario original se conserva en [ENVIRONMENT.md](ENVIRONMENT.md).

## Cambios de fase 1A

- Proyecto DX con force-app como paquete fuente y API provisional 65.0.
- Cuatro objetos, 35 campos personalizados y 18 reglas activas en los archivos locales.
- Dos campos de fórmula para aplicabilidad y días restantes.
- Relaciones lookup con propietarios independientes y restricciones de eliminación donde proceden.
- Clave de seguimiento obligatoria y única; protección declarativa de identidad y origen tras insertar.
- Ventana y contexto de ejecución inmutables, resultados confirmados y lotes fallidos diferenciados.
- Incidencias con mensaje obligatorio e inmutabilidad después de crear.
- Diseño de acceso por función y criterios de aceptación pendientes, documentados sin atribuir seguridad verificada.
- Actualización de instrucciones y exclusiones de metadatos; se conserva .gitignore.

El [modelo técnico](MODELO_DATOS.md) contiene el diccionario y las decisiones. Los [criterios de aceptación](PROJECT_BRIEF.md) describen las comprobaciones funcionales posteriores.

## Comprobaciones locales de fase 1A

| Comprobación | Resultado y alcance |
|---|---|
| Configuración DX | JSON legible; un paquete force-app; API 65.0; sin destino ni URL de organización configurados |
| XML | 57 archivos bien formados con namespace Metadata API: 4 objetos, 35 campos y 18 validaciones |
| Referencias | Nombres de archivos y componentes coherentes; destinos lookup, campos de fórmulas, campos de error y valores de picklist comprobados |
| Tipos y estructura de fórmulas | Longitudes, precisión, obligatoriedad, unicidad y paréntesis revisados; no constituye compilación de fórmulas |
| Conversión local | sf project convert source con API 65.0 terminó con status 0; paquete temporal con los mismos 35 campos y 18 reglas |
| Documentación | Diccionario contrastado con los 35 campos; enlaces relativos revisados |
| Archivos propuestos | Revisión de exclusiones, contenido sensible, cambios y redacción técnica |

La conversión se escribió en una carpeta temporal fuera del repositorio. El lanzador mantiene avisos auxiliares de acceso denegado al consultar procesos de Windows; la operación local devolvió éxito. No se cambió la configuración global para eliminarlos.

En fase 1A no se creó infraestructura de pruebas ni se instalaron herramientas. La revisión de fórmulas incluye su lógica declarativa y referencias, pero no ejecuta las reglas en Salesforce.

## Resultados de fase 1B

| Operación | Identificador | Resultado |
|---|---|---|
| Primera validación del modelo | 0Afg700000KyMYSCA3 | Fallida: lookup a User obligatorio sin restricción; error dependiente en ContextoInmutable |
| Segunda validación del modelo | 0Afg700000Kyf3ECAR | Fallida: User no admite Restrict; error dependiente en ContextoInmutable |
| Validación final del modelo | 0Afg700000KytqwCAB | Succeeded, checkOnly=true, 58/58 componentes |
| Despliegue del modelo | 0Afg700000KzBhNCAV | Succeeded, checkOnly=false, 58/58 componentes |
| Validación del permiso técnico | 0Afg700000KydvrCAB | Succeeded, checkOnly=true, 1/1 componente |
| Despliegue del permiso técnico | 0Afg700000KzDmPCAV | Succeeded, checkOnly=false, 1/1 componente |

Las operaciones finales constan terminadas, con success=true y cero errores. Se aplicaron los mismos archivos validados, con contraste de hashes. No se ejecutaron despliegues destructivos.

La corrección del lookup Solicitante__c cambia required a false y omite deleteConstraint, porque Salesforce rechaza la obligatoriedad universal junto a las restricciones de eliminación sobre User. La nueva regla SolicitanteObligatorio rechaza valores vacíos en cada guardado. ContextoInmutable conserva la prohibición de modificar el solicitante. Se comprobaron alta sin solicitante, intento de vaciarlo y cambio a otro usuario existente; el requisito funcional se mantiene.

La cuenta técnica no veía los campos opcionales y calculados tras desplegar el modelo. Se añadió P06_VerificacionModelo: once campos, ocho de lectura/escritura y tres de lectura, asignado solo a esa cuenta. No concede permisos de sistema, de objeto ni eliminación; no modifica perfiles ni configura roles comerciales.

## Comprobaciones funcionales

| Grupo | Casos correctos | Registros conservados |
|---|---:|---:|
| Contratos | 12/12 | 2 |
| Seguimientos y aplicabilidad | 51/51 | 10 |
| Ejecuciones | 37/37 | 1 |
| Incidencias | 17/17 | 6 |
| Total | 117/117 | 19 |

Se conservan 3 cuentas, 4 contratos, 5 ejecuciones de modelo, 5 seguimientos y 2 incidencias. Las operaciones exploratorias se revirtieron mediante savepoints; no se borraron fixtures. Una lectura posterior por sus identificadores confirma la conservación de los 19 registros.

El primer bloque de seguimientos no compiló por falta de acceso a Notas__c y no creó registros. Se conserva su JSON original sin convertirlo en éxito; el intento posterior con acceso técnico es independiente. El ejecutor recoge errores de compilación desde result o data según la respuesta de la CLI.

Las ejecuciones son fixtures Encolada, sin AsyncApexJobId ni resultados inventados de procesamiento. Los valores sintéticos usados para probar contadores se revirtieron. Hubo un segundo usuario estándar activo disponible para la comprobación del solicitante; no se crearon usuarios.

## Niveles de validación al cierre de fase 1B

| Nivel | Estado |
|---|---|
| Revisión estática y conversión local de fase 1A | Realizadas; evidencia histórica conservada |
| Compilación y aceptación del modelo por Salesforce | Correctas, API 65.0 |
| Despliegue aplicado | Modelo y permiso técnico, con resultados finales verificados |
| Pruebas Apex automatizadas | No ejecutadas; no hay clases desplegables |
| Comprobaciones mediante Apex anónimo | Cuatro bloques compilados y ejecutados; 117/117 casos |
| Conservación de fixtures | 19/19 registros confirmados por lectura posterior |
| Seguridad completa por roles | Pendiente |
| Batch, concurrencia e identidad canónica | Pendientes |

## Evidencias y límites

El [procedimiento](FASE-1B.md), el [registro agregado](evidencias-fase-1b.json) y los JSON de [conservación](evidencias-fase-1b/conservacion.json) contienen resultados e inventarios. No se publican tokens, credenciales, usuarios reales, direcciones de instancia ni logs completos.

La clave única solo acredita rechazo de una clave exacta duplicada. No demuestra generación canónica, idempotencia integral ni solapamiento. Las comprobaciones con la cuenta técnica no acreditan la matriz comercial, las transferencias ni la protección completa frente a eliminación. La inmutabilidad de AsyncApexJobId una vez asignado no se prueba mediante identificadores ficticios.

Las comprobaciones locales finales cubren sintaxis de scripts, XML, enlaces, coherencia de evidencias, exclusiones y diferencias Git. La documentación distingue resultados actuales e históricos y conserva las limitaciones.

## Trabajo posterior al cierre de fase 1B

La gestión comercial y el acceso se completaron en fase 2. La fase 3 incorpora Batch, lanzamiento e identificación de incertidumbre mediante contraste manual. Programación e integración permanecen fuera del alcance. La cobertura actual figura en PROJECT_BRIEF.md y FASE-3.md; las comprobaciones declarativas históricas no sustituyen la aceptación integral.

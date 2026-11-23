# Estado del proyecto

Fecha: 23/11/2026.

## Situación de fase 2

Fase 2 completada sobre f779561036541b29e03fbf8f41e851c49bbea7c9. Aplicación Lightning, permisos comerciales y de coordinación, compartición e informe desplegados y comprobados con dos identidades ficticias sin privilegios administrativos. Cuatro objetos, 35 campos y 21 validaciones.

Resultado: 70 comprobaciones API agrupadas correctas, creación de contrato adicional, cuatro comprobaciones de interfaz y contrastes de informe en las mismas sesiones. Se conservan 19 fixtures históricos sin cambios y 31 nuevos. Login As está restaurado a false. La función de coordinación y el permiso comercial se probaron con asignaciones separadas.

Los [resultados de fase 2](FASE-2.md), la [matriz de acceso](ACCESO.md) y las [evidencias](evidencias-fase-2.json) delimitan el alcance. La V1 completa sigue pendiente de procesamiento; no hay Batch, servicio de lanzamiento, generación canónica ni reconciliación.

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

La gestión comercial y la configuración de acceso eran el siguiente alcance previsto y se completaron en fase 2. El procesamiento sigue pendiente: Batch, servicio de lanzamiento, reconciliación de lotes, programación e integración no se han iniciado. La cobertura actual de los criterios figura en PROJECT_BRIEF.md y FASE-2.md; las comprobaciones declarativas históricas no sustituyen su aceptación integral.

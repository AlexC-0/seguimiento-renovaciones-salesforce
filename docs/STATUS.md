# Estado del proyecto

Fecha: 23/11/2026.

## Situación

Fase 1A preparada localmente sobre la referencia ee75f7650491caf4c3b4e80ac079867dc35b2fa8. La fase 1 funcional no está completada: no hay organización seleccionada, compilación por Salesforce, despliegue ni pruebas funcionales.

La inspección previa encontró el repositorio en main, sin cambios pendientes, con el remoto del proyecto ya configurado. No se ha modificado el remoto ni el historial.

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

## Comprobaciones locales

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

No se ha creado infraestructura de pruebas ni instalado herramientas. La revisión de fórmulas incluye su lógica declarativa y referencias, pero no ejecuta las reglas en Salesforce.

## Niveles de validación

| Nivel | Estado |
|---|---|
| Metadatos locales | Preparados |
| Revisión estática y conversión de formato | Realizadas |
| Compilación y aceptación por Salesforce | Pendientes |
| Despliegue | No realizado |
| Pruebas Apex | No realizadas; no existen clases en esta fase |
| Pruebas funcionales de AC-01 a AC-20 | Pendientes |
| Seguridad completa y verificación por roles | Pendientes |

## Revisión editorial

Alcance: archivos nuevos o modificados de fase 1A, incluidas las instrucciones locales. Se revisaron atribuciones, firmas automáticas, nombres personales, relatos internos y redacción de limitaciones. No se revisó contenido remoto ni se reescribió historial.

## Trabajo posterior

La API es provisional hasta verificar el destino dedicado. La clave única no sustituye la generación y comprobación canónica. Batch, servicio de lanzamiento, concurrencia, persistencia de errores de lotes revertidos y reconciliación siguen sin implementar.

No hay permission sets, compartición completa, controles de reasignación comprobados, informe ni datos. Las restricciones declarativas no demuestran por sí solas seguridad o conservación integral del historial.

El siguiente paso para fase 1B es seleccionar el entorno exclusivo de P06, identificar sus capacidades y usuarios disponibles, comprobar la API y preparar la validación del modelo en Salesforce. La creación y autenticación son manuales; cualquier despliegue o comprobación remota requiere autorización específica de esa fase.

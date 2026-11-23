# Entorno

Inspección local realizada el 23/11/2026. Las versiones corresponden a las herramientas detectadas; no constituyen una validación completa de compatibilidad.

## Herramientas detectadas

| Herramienta | Versión | Comprobación y limitación |
|---|---|---|
| Git | 2.56.1.windows.1 | Versión consultada correctamente |
| Salesforce CLI | 2.158.7 | Devuelve versión; el lanzador emite avisos de acceso denegado al consultar procesos de Windows |
| Node.js | 24.13.0 | Versión consultada; runtime utilizado por la CLI instalada |
| Java en PATH | 1.8.0_503 | Runtime efectivo y compatibilidad del editor no verificados |
| VS Code | 1.147.0 | Versión del ejecutable instalado |
| Paquete principal Salesforce y extensión Apex | 68.12.0 | Manifiestos locales detectados; activación no comprobada |

Salesforce CLI permitirá desplegar y ejecutar pruebas cuando exista un destino autorizado. Git permite versionar el proyecto. Java y las extensiones son auxiliares del editor.

## Organización

No se ha seleccionado ni validado una organización para P06. La inspección encontró alias locales de otros proyectos, que no constituyen destinos autorizados para este proyecto.

No se encontraron los archivos globales de configuración comprobados ni valores en SF_TARGET_ORG, SF_TARGET_DEV_HUB, SFDX_DEFAULTUSERNAME o SFDX_DEFAULTDEVHUBUSERNAME. El alcance fue la configuración global y esas variables del proceso; no se inspeccionaron configuraciones de otros proyectos ni archivos de autenticación.

No se comprobaron conexiones, tipos de organización ni vigencia de sesiones. La ausencia de valores en esas fuentes no demuestra que no existan organizaciones autenticadas o un Dev Hub disponible por otra vía.

## Entorno propuesto

Se propone una Developer Edition dedicada o un Playground exclusivo, sujeto a confirmar disponibilidad, capacidades y usuarios suficientes. La elección debe permitir conservar datos y evidencias durante varias sesiones.

Una scratch org queda condicionada a disponer de un Dev Hub autorizado y a definir cómo se conservarán datos y evidencias. No se ha identificado un Dev Hub en las fuentes locales revisadas.

La creación y autenticación del entorno se realizarán manualmente. No se reutilizarán organizaciones, datos ni configuración de otros proyectos.

## Comprobaciones pendientes

- Identidad y tipo de la organización exclusiva de P06.
- Capacidades y usuarios disponibles para verificar permisos por función.
- Conexión de la CLI con el destino autorizado.
- Runtime Java utilizado por las extensiones y funcionamiento del servicio de lenguaje Apex.
- Compilación y aceptación de los metadatos por Salesforce; alcance de los avisos auxiliares del lanzador de la CLI.

## Novedades comprobadas en fase 1A

El repositorio contiene ahora sfdx-project.json con un único paquete fuente force-app. No configura target-org, Dev Hub ni URL de organización. No se ha repetido el inventario de herramientas ni comprobado una conexión remota.

Se consultó la ayuda local de sf project convert source. La conversión local con --root-dir force-app y --api-version 65.0 finalizó con status 0 y conservó los cuatro objetos, 35 campos y 18 validaciones en formato Metadata API. La salida se generó en una carpeta temporal externa al repositorio. Los avisos de acceso denegado a consultas de procesos siguen apareciendo; no impidieron esta conversión.

## Versión API provisional

sourceApiVersion se fija en 65.0, correspondiente a Winter ’26, como referencia explícita y conservadora para los tipos de metadatos utilizados. La decisión no procede de la versión de las extensiones ni afirma que sea la API más reciente. Salesforce identifica esa correspondencia en su [documentación de Metadata API para Winter ’26](https://developer.salesforce.com/blogs/2025/09/take-a-deep-dive-into-metadata-api-deployments).

La CLI instalada ha aceptado esa versión para convertir los archivos localmente. Esto no demuestra compatibilidad con una organización: antes de desplegar se deberá comprobar que el destino dedicado admite API 65.0, los tipos y propiedades empleados, y compila las fórmulas y validaciones. Si no la admite, se revisará explícitamente la configuración y el modelo antes de operar.

No se incluyen dependencias, plantillas de ejemplo ni configuración de creación de organizaciones. Los metadatos tienen deploymentStatus=Deployed como definición del estado previsto del objeto al instalarlo; ese valor no significa que se haya ejecutado un despliegue.

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
- Operación de la CLI más allá de la consulta de versión y alcance de sus avisos locales.

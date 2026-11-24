# Instalación de Renovaciones de contratos

Guía revisada a 24/11/2026 contra los metadatos actuales. La aplicación está desplegada incrementalmente en la organización de demostración. **No se ha ejecutado ni validado remotamente una instalación limpia con el manifiesto completo.** Los comandos siguientes son un procedimiento para un destino futuro autorizado, no operaciones realizadas en fase 5.

## Requisitos y comprobación del destino

Organización Salesforce dedicada que admita Apex, objetos personalizados, API 65.0, funciones, grupos, perfiles, Permission Sets e informes. El entorno comprobado es Developer Edition. El perfil P06_BaseComercial declara licencia Salesforce; los usuarios comerciales requieren licencias compatibles y disponibles. No se garantiza compatibilidad de cualquier edición o conjunto de funciones.

Se reutilizaron Node 24.13.0 y Salesforce CLI 2.158.7. No es necesario instalar herramientas globales como parte de esta guía. Disponer de una copia revisada del proyecto DX y de una identidad con capacidad de desplegar metadatos; el acceso de despliegue es distinto del acceso comercial.

La creación, autenticación e identificación del destino son pasos manuales previos. Comprobar alias, organización, usuario previsto y ausencia de colisiones con los nombres P06 antes de desplegar. No reutilizar el alias de demostración ni recibos privados como valores predeterminados. En PowerShell, indicar un alias ya autenticado y autorizado:

~~~powershell
$destinoP06 = 'ALIAS_EXPLICITO_DEL_DESTINO_AUTORIZADO'
sf data query --target-org $destinoP06 --api-version 65.0 --query "SELECT Id, OrganizationType, IsSandbox FROM Organization"
~~~

Contrastar el identificador devuelto con el destino aprobado antes de continuar. No publicar recibos de autenticación, secretos ni enlaces de acceso. Revisar también la zona horaria del operador: será la referencia de cada lanzamiento, no la zona del equipo local.

## Paquete y dependencias

Usar [manifest/instalacion-v1.xml](../manifest/instalacion-v1.xml), con 36 miembros explícitos y API 65.0. Es un paquete conjunto: no una secuencia de manifiestos históricos.

| Grupo | Componentes y dependencias |
|---|---|
| Modelo | Cuatro CustomObject con 35 campos, 21 validaciones y cinco listas; relaciones a Account, User y objetos P06 |
| Autorización y lógica | Dos CustomPermission, cuatro clases incluyendo RenovacionesTest y un trigger. Las validaciones de reasignación dependen de P06_Reasignar; servicio y Batch de P06_ProcesarRenovaciones |
| Acceso a registros | Cuatro grupos, dos funciones y cuatro SharingRules. P06_Comercial depende jerárquicamente de P06_Coordinacion; las reglas referencian grupos de coordinación y operadores |
| Interfaz | Cuatro pestañas, aplicación P06_Renovaciones y cuatro layouts P06 Gestión |
| Permisos | P06_BaseComercial y tres Permission Sets: P06_Comercial, P06_Coordinacion y P06_OperadorRenovaciones. Referencian objetos, campos, clases, permisos personalizados, aplicación y layouts |
| Informe | Carpeta P06_Renovaciones e informe PendientesRenovaciones, dependientes del modelo y grupos de acceso |

Desplegar juntos modelo, permisos personalizados, código, grupos, funciones, interfaz, acceso e informe permite incluir sus referencias cruzadas. El orden conceptual es modelo/autorización, lógica, acceso/interfaz e informe; no se afirma que el orden de las secciones XML controle el orden interno de Salesforce.

Los manifiestos de fases anteriores documentan incrementos sobre un entorno ya preparado. Sus archivos actuales contienen referencias posteriores: las reglas del modelo usan P06_Reasignar y las reglas de compartición y carpeta incluyen P06_Operadores. Reproducirlos uno por uno no constituye una instalación limpia verificada.

El perfil también contiene referencias estándar a ContractLineItem, QuickText y ServiceContract, con acceso deshabilitado. Verificar su disponibilidad y la de los permisos de plataforma en el destino durante la validación. No retirar referencias ni ampliar privilegios automáticamente para superar errores.

## Validación y despliegue futuro

Desde la raíz del proyecto, una vez comprobado el destino y revisado el paquete:

~~~powershell
sf project deploy start --target-org $destinoP06 --api-version 65.0 --manifest manifest/instalacion-v1.xml --dry-run --test-level RunSpecifiedTests --tests RenovacionesTest --wait 20
~~~

Revisar el resultado terminal, errores de componentes, pruebas y cobertura exigida por Salesforce. Un tiempo de espera agotado no es un resultado final: consultar el identificador devuelto mediante project deploy report con el mismo destino. No desplegar si la validación falla o los archivos cambian sin nueva validación. Con los mismos archivos validados y autorización para ese destino:

~~~powershell
sf project deploy start --target-org $destinoP06 --api-version 65.0 --manifest manifest/instalacion-v1.xml --test-level RunSpecifiedTests --tests RenovacionesTest --wait 20
~~~

Conservar recibos sanitizados y verificar componentes efectivos. No usar ignore-errors, cambios destructivos ni borrado de datos como procedimiento de instalación. Referencia: [Salesforce CLI project deploy start](https://developer.salesforce.com/docs/platform/salesforce-cli-reference/guide/cli_reference_project_deploy_start.html).

## Configuración manual de acceso

Las identidades, asignaciones y miembros de grupos no están incluidos en el paquete. Configurarlos con usuarios propios del destino y revisar todos sus permisos efectivos, no solo los añadidos por P06.

| Función | Configuración |
|---|---|
| Comercial | Perfil P06_BaseComercial, Permission Set P06_Comercial, función P06_Comercial, grupo P06_Comerciales |
| Coordinación | Perfil P06_BaseComercial, Permission Set P06_Coordinacion, función P06_Coordinacion y grupo P06_Coordinacion |
| Operador técnico | P06_OperadorRenovaciones y grupo P06_Operadores sobre una identidad técnica autorizada. El Permission Set no concede Author Apex ni es un perfil técnico autónomo |
| Propietarios del ámbito | Añadir a P06_Propietarios los propietarios de registros P06, incluidos los de ejecuciones e incidencias. Un propietario fuera del grupo no queda cubierto automáticamente por sus reglas |

El lanzamiento documentado usa Apex anónimo y requiere que el operador ya tenga esa capacidad autorizada. La demostración utilizó un perfil administrativo previo; no demuestra suficiencia del Permission Set aislado ni justifica conceder privilegios administrativos nuevos. No asignar Author Apex a comerciales o coordinación. La definición y comprobación de un perfil técnico mínimo siguen pendientes de aceptación.

Verificar Private de los cuatro objetos, jerarquía, grupos sin inclusión automática de superiores, reglas efectivas, acceso a carpeta, aplicación, pestañas y layouts. Las asignaciones de layout del perfil comercial están en metadatos; revisar por separado los perfiles técnicos existentes. Account y User son dependencias estándar: la aplicación no configura su compartición global. Documentar su visibilidad efectiva; en demostración Account conserva ReadWrite interno y solo lectura por permisos comerciales.

Para transferencias, seguir [ACCESO](ACCESO.md): el propietario de un seguimiento necesita acceso al contrato, que no se hereda automáticamente del lookup. Revisar y conceder Read manual después de cada transferencia cuando corresponda. No hay sincronización automática de propietarios ni de comparticiones.

## Comprobaciones posteriores

Comprobar las funciones con sus propias sesiones: lectura permitida/ajena, edición de notas y estado, denegación de reasignación comercial y acceso técnico limitado. Preparar datos ficticios propios y un conjunto explícito de contratos elegibles; seguir [USO](USO.md) para lanzar, observar, repetir y revisar incidencias. Conservar todos los registros y contrastar el informe con consultas completas de la misma identidad.

No ejecutar los generadores históricos contra el destino nuevo. Los programas Node de scripts/fase-1b a scripts/fase-5 dependen de inventarios y recibos privados de demostración, y algunos modifican datos o componentes de ensayo. Las plantillas Apex de lanzamiento y contraste de fase 3 se pueden copiar y completar con identificadores obtenidos en el nuevo destino; no incorporan inventarios históricos. El conjunto vacío selecciona cero y el contraste con identificador vacío se rechaza.

## Exclusiones y nivel de comprobación

El manifiesto excluye P06_VerificacionModelo, las tres reglas temporales F4A/F4B, P06_F5_ReasignacionTemporal, datos de ensayo, usuarios, asignaciones, trazas, recibos privados y paquetes bajo docs/evidencias. RenovacionesTest sí es una clase de prueba de la aplicación e integra el paquete.

La [inspección del manifiesto](evidencias-fase-5/instalacion-inspeccion.json) y la [conversión local](evidencias-fase-5/instalacion-conversion.json) verifican 36 miembros y 42 archivos MDAPI, con cuatro objetos, 35 campos, 21 reglas, cinco listas y tres Permission Sets. Una primera conversión produjo solo package.xml pese a devolver estado cero; se conserva como insuficiente. La segunda indicó force-app como raíz y un directorio temporal externo a .sf, y produjo el contenido completo. No se atribuye una causa interna no demostrada.

La conversión es local y no prueba compilación, compatibilidad de una organización vacía, asignaciones manuales ni funcionamiento tras instalar. Referencia: [Salesforce CLI project convert source](https://developer.salesforce.com/docs/platform/salesforce-cli-reference/guide/cli_reference_project_convert_source.html). La decisión sobre instalación limpia sigue abierta en [ACEPTACION-V1](ACEPTACION-V1.md).

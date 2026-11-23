# Fase 1B — Validación del modelo declarativo

## Estado

Completada en la Developer Edition exclusiva de P06 con API 65.0. Validación y despliegue finalizados correctamente; cuatro bloques anónimos con 117/117 casos y 19 fixtures conservados. El [registro de evidencias](evidencias-fase-1b.json) contiene las operaciones, los resultados actuales y los intentos históricos fallidos.

El modelo publicado en 3c6341eff29d9faee09c8d248f516377de45029d contiene cuatro objetos, 35 campos y 18 validaciones. La corrección de fase 1B mantiene el solicitante obligatorio mediante una regla adicional compatible con el lookup a User, hasta un total de 19 validaciones.

## Acceso al destino

Se utilizará la cuenta existente identificada expresamente para P06, con el alias local `p06-renovaciones-dev`. Deben verificarse la edición de desarrollo y la identidad de su organización. El alias propuesto no acredita autenticación ni aislamiento del destino.

Autenticar la cuenta identificada en Chrome habitual y contrastar el usuario devuelto por la CLI antes de asignar el alias. No iniciar un registro adicional. Introducir credenciales y resolver desafíos de acceso directamente en Salesforce. Si se dispone del My Domain confirmado de P06, este comando inicia el acceso web sin establecer un destino global:

```powershell
$p06Domain = Read-Host 'My Domain de P06, solo el dominio'
if ($p06Domain -notmatch '^[a-z0-9][a-z0-9.-]+\.my\.salesforce\.com$') {
    throw 'Indicar únicamente un dominio My Domain, sin rutas ni parámetros.'
}
sf org login web --alias p06-renovaciones-dev --instance-url ("https://" + $p06Domain) --browser chrome
```

Verificar en el navegador que se está entrando en el destino P06 identificado. No utilizar sesiones de proyectos anteriores ni copiar contraseñas, enlaces de activación o salidas de autenticación al repositorio.

## Inspección del destino

Ejecutar desde la raíz P06 únicamente después de identificar expresamente el alias dedicado:

```powershell
$p06Alias = Read-Host 'Alias exclusivo de P06'
$p06Target = ./scripts/fase-1b/inspeccionar-destino.ps1 -TargetOrg $p06Alias -ExpectedType 'Developer Edition'
$p06Target | Select-Object OrganizationType, IsSandbox, ApiVersion, ConnectionVerified, ExistingComponents, AccountCreateable
```

Antes de cualquier consulta remota, el script comprueba localmente que el alias no comparte identidad con otros alias. Si la comparte, se detiene para evitar reutilizar otro entorno. Después consulta identidad, edición, disponibilidad de API 65.0, coincidencias de los cuatro objetos, licencias y número de usuarios activos por tipo. No solicita nombres, correos o contraseñas de usuarios y no concede permisos. El identificador real queda en `$p06Target.OrganizationId` para vincular las operaciones; no se publica el objeto completo.

Una Developer Edition puede tener IsSandbox=false sin ser una organización productiva. Deben coincidir la edición observada, la declaración de destino dedicado y la identidad de la sesión. Un Playground necesita además identificación manual de su procedencia; su edición no basta para distinguirlo.

La disponibilidad de licencias o usuarios no demuestra sus permisos efectivos. Se utilizará una cuenta técnica ya autorizada. No se crean usuarios ni se amplían privilegios para superar una comprobación.

### Colisiones

```powershell
if (@($p06Target.ExistingComponents).Count -gt 0) {
    throw 'Hay componentes con los nombres P06. Verificar su procedencia antes de escribir.'
}
```

Si aparece contenido anterior, contrastar su procedencia y metadatos con evidencias propias antes de continuar. Una coincidencia de nombre no basta para atribuirlo al proyecto. Detener la escritura ante contenido desconocido. En una repetición tras un despliegue propio, conservar y comprobar su identificador; no borrar componentes ni usar ignore-conflicts.

## Validación sin aplicar cambios

El [manifiesto](../manifest/modelo-p06.xml) enumera solo los cuatro CustomObject; incluye sus campos y reglas. No contiene comodines, componentes ajenos ni instrucciones destructivas. Los scripts de comprobación están fuera de force-app y no se despliegan.

La CLI instalada admite `project deploy start --dry-run --test-level NoTestRun` para entornos de desarrollo. Se utiliza este comando, en vez de presumir que `project deploy validate` admite las mismas opciones. La [referencia de despliegue](https://developer.salesforce.com/docs/platform/salesforce-cli-reference/guide/cli_reference_project_deploy_start.html) describe dry-run y las opciones de prueba. NoTestRun no demuestra ejecución de pruebas Apex.

Conservar una huella de los archivos que se validarán:

```powershell
function Get-P06ModelFingerprint {
    $files = @(Get-ChildItem -LiteralPath 'force-app/main/default/objects' -Recurse -File)
    $files += Get-Item -LiteralPath 'manifest/modelo-p06.xml'
    $files += Get-Item -LiteralPath 'sfdx-project.json'
    ($files | Sort-Object FullName | ForEach-Object {
        $_.FullName + ':' + (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash
    }) -join [Environment]::NewLine
}
$p06ModelFingerprint = Get-P06ModelFingerprint
. ./scripts/fase-1b/cli.ps1
$p06ValidationStart = Invoke-P06SfJson -Arguments @(
    'project', 'deploy', 'start', '--target-org', $p06Alias,
    '--manifest', 'manifest/modelo-p06.xml', '--api-version', '65.0',
    '--test-level', 'NoTestRun', '--dry-run', '--async'
)
$p06ValidationId = $p06ValidationStart.result.id
```

El identificador obtenido no acredita finalización. Consultar el estado con el mismo destino y conservar el resultado final:

```powershell
$p06Validation = Invoke-P06SfJson -AllowCliFailure -Arguments @(
    'project', 'deploy', 'report', '--target-org', $p06Alias, '--job-id', $p06ValidationId
)
$p06Validation.result | Select-Object id, status, done, success, checkOnly, numberComponentErrors
```

Mientras no termine, volver a consultar únicamente report; no iniciar otro despliegue. Exigir done=true, success=true, status=Succeeded y checkOnly=true. Revisar los errores de componentes de forma acotada, corregir solo lo necesario y repetir las comprobaciones afectadas. No desactivar reglas ni rebajar protecciones.

## Despliegue de los mismos metadatos

Antes de aplicar, comprobar que la validación terminó correctamente y que los archivos no cambiaron. Volver a verificar la identidad del alias si la sesión o su asociación han cambiado. Mantener API 65.0.

```powershell
if ($p06Validation.result.done -ne $true -or $p06Validation.result.success -ne $true -or
    $p06Validation.result.status -ne 'Succeeded' -or $p06Validation.result.checkOnly -ne $true) {
    throw 'La validación no ha finalizado satisfactoriamente.'
}
if ((Get-P06ModelFingerprint) -cne $p06ModelFingerprint) {
    throw 'Los metadatos han cambiado. Repetir la validación antes de desplegar.'
}
$p06DeploymentStart = Invoke-P06SfJson -Arguments @(
    'project', 'deploy', 'start', '--target-org', $p06Alias,
    '--manifest', 'manifest/modelo-p06.xml', '--api-version', '65.0',
    '--test-level', 'NoTestRun', '--async'
)
$p06DeploymentId = $p06DeploymentStart.result.id
$p06Deployment = Invoke-P06SfJson -AllowCliFailure -Arguments @(
    'project', 'deploy', 'report', '--target-org', $p06Alias, '--job-id', $p06DeploymentId
)
$p06Deployment.result | Select-Object id, status, done, success, checkOnly, numberComponentErrors
```

Consultar report hasta su finalización. Solo se considera aplicado cuando done=true, success=true, status=Succeeded y checkOnly=false. No usar flags para ignorar conflictos, errores o avisos. No se incluyen cambios destructivos.

Registrar en evidencias los identificadores, API, estados finales, nombres de componentes aceptados y correcciones realizadas. Los errores de autenticación se revisan de forma privada; no se guardan respuestas completas de CLI ni logs sin sanitizar.

## Acceso técnico para las comprobaciones

El Permission Set `P06_VerificacionModelo` se valida y despliega con [verificacion-p06.xml](../manifest/verificacion-p06.xml), separado del manifiesto del modelo. Su nombre se comprobó libre antes de crearlo. Se asigna únicamente a la cuenta técnica P06 ya autenticada.

| Objeto | Lectura/escritura | Solo lectura |
|---|---|---|
| SeguimientoRenovacion__c | Notas__c | Aplicable__c, DiasRestantes__c |
| EjecucionRenovacion__c | Solicitante__c, Finalizacion__c, RequiereReconciliacion__c | AsyncApexJobId__c |
| IncidenciaRenovacion__c | Contrato__c, ClaveIntentada__c, Mensaje__c, CamposAfectados__c | Ninguno |

Son once campos: ocho editables y tres de lectura. No concede permisos de sistema, CRUD de objetos, eliminación, Author Apex, View All Data ni Modify All Data; tampoco modifica perfiles. La cuenta técnica ya disponía de los permisos de ejecución necesarios. No constituye la matriz de acceso comercial.

La primera compilación de seguimientos falló porque el usuario no veía Notas__c; el campo sí figuraba en FieldDefinition y no aparecía en describe para esa cuenta. No se ejecutó el bloque ni se crearon fixtures en ese intento. El acceso acotado permite compilar y comprobar los campos opcionales y calculados, conforme a [PermissionSet](https://developer.salesforce.com/docs/platform/api-metadata/references/meta-types/metadata-permissionset.html).

Para reproducirlo, comprobar primero que el destino y la cuenta son P06, que el modelo ya está aplicado y que un Permission Set existente con ese nombre es atribuible al proyecto. Usar el mismo procedimiento de hash, dry-run y report hasta éxito descrito para el modelo, sustituyendo el manifiesto por `manifest/verificacion-p06.xml`. Aplicar después esos mismos archivos y verificar success=true y checkOnly=false antes de asignar:

```powershell
sf org assign permset --target-org $p06Alias --name P06_VerificacionModelo
```

Sin on-behalf-of, la asignación se dirige al usuario autenticado del destino indicado. No asignar a otros usuarios. El permiso técnico y su asignación se conservan para reproducir las comprobaciones y consultar los fixtures.

## Comprobaciones funcionales

El [ejecutor](../scripts/fase-1b/ejecutar-comprobacion.ps1) requiere alias, Id de organización previamente verificado, identificador de despliegue aplicado y grupo de casos. Comprueba de nuevo identidad y carácter no productivo y exige un despliegue finalizado antes de escribir datos.

Ejecutar un grupo cada vez y revisar su evidencia antes de continuar:

```powershell
./scripts/fase-1b/ejecutar-comprobacion.ps1 -TargetOrg $p06Alias -ExpectedOrgId $p06Target.OrganizationId -DeploymentId $p06DeploymentId -Suite contratos
./scripts/fase-1b/ejecutar-comprobacion.ps1 -TargetOrg $p06Alias -ExpectedOrgId $p06Target.OrganizationId -DeploymentId $p06DeploymentId -Suite seguimientos
./scripts/fase-1b/ejecutar-comprobacion.ps1 -TargetOrg $p06Alias -ExpectedOrgId $p06Target.OrganizationId -DeploymentId $p06DeploymentId -Suite ejecuciones
./scripts/fase-1b/ejecutar-comprobacion.ps1 -TargetOrg $p06Alias -ExpectedOrgId $p06Target.OrganizationId -DeploymentId $p06DeploymentId -Suite incidencias
```

Resultados: contratos 12/12, seguimientos y aplicabilidad 51/51, ejecuciones 37/37 e incidencias 17/17. Total: 117/117, sin casos omitidos.

Cada invocación utiliza una marca P06-1B única. Los archivos Apex de casos se combinan con soporte.apex en un bloque anónimo temporal; no deben ejecutarse por separado. La utilidad de soporte tiene alcance local al bloque y no se guarda como clase en la organización, según la [documentación de bloques anónimos](https://developer.salesforce.com/docs/platform/apex-dev/references/apex-dev/apex-anonymous-block.html).

| Grupo | Casos preparados | Estado actual |
|---|---|---|
| Contratos | Alta válida; valores iniciales; tres campos obligatorios; fechas; estados válidos e inválidos | Correctos |
| Seguimientos | Pendiente inicial; duplicado exacto; cuatro campos inmutables; matriz de 16 transiciones; notas; estados inválidos | Correctos |
| Aplicabilidad | Contrato activo, cambio y restauración de fecha sin reabrir, inactividad y vencimiento pasado | Correctos |
| Ejecuciones | Solicitante obligatorio, ventana, contexto, contadores, finalización, estados y Completada con errores | Correctos |
| Incidencias | Mensaje válido, nulo, vacío o con espacios; inmutabilidad; referencias conservadas y contrato opcional | Correctos |

### Datos e inventario

Los fixtures válidos se conservan; las comprobaciones no borran datos. Las cuentas se nombran con la marca de la invocación. Los contratos y seguimientos se vinculan a esas cuentas. El inventario enumera Id, objeto y función de todos los registros insertados, incluidas las ejecuciones que no tienen un nombre de cuenta propio.

Cada operación de prueba se aísla con savepoint, rollback y liberación del savepoint. Incluso una escritura negativa inesperadamente aceptada se revierte. Las operaciones positivas usadas para explorar transiciones también se revierten; se mantienen los fixtures base y los cambios finales expresamente identificados. Véase [control transaccional](https://developer.salesforce.com/docs/platform/apex-dev/references/apex-dev/langcon-apex-transaction-control.html).

El conjunto real conservado y confirmado por lectura posterior es de 19 registros: 3 cuentas, 4 contratos, 5 ejecuciones de modelo, 5 seguimientos y 2 incidencias. Una ejecución parcial puede conservar menos; el inventario real prevalece. Los autonuméricos pueden presentar huecos tras intentos revertidos.

Las ejecuciones son exclusivamente fixtures, permanecen Encolada, sin AsyncApexJobId y con contadores finales cero. Las variaciones sintéticas de contadores se prueban bajo rollback y no representan resultados de procesamiento. No se comprueba la inmutabilidad de un job asignado mediante identificadores inventados.

El cambio de solicitante se comprobó con otro usuario estándar activo existente. Para repetir esta comprobación se requiere otro usuario estándar activo. Si no está disponible, el caso queda no ejecutado, sin crear usuarios. Esa omisión impide afirmar cobertura completa de la inmutabilidad del contexto.

### Evidencia y fallos

El ejecutor guarda un JSON por invocación en docs/evidencias-fase-1b, sin sobrescribir evidencias anteriores. Incluye casos, resultado esperado y observado, compilación, ejecución e inventario de fixtures. Recoge el resultado desde result o data según la respuesta de la CLI y guarda el diagnóstico de compilación cuando lo devuelve. El primer JSON histórico, anterior a esa mejora, conserva el fallo sin diagnóstico; su causa está documentada en el registro agregado. Los scripts temporales con el Id del destino quedan en .sf/p06-fase-1b, excluido de Git.

Solo se publican campos seleccionados; no se guardan respuestas de autenticación, nombres reales de usuarios, direcciones de instancia ni logs completos. Una ejecución Apex terminada correctamente no implica que todas las comprobaciones hayan pasado: también debe ser correcto el informe de casos y no haber omisiones.

Si falta el marcador de resultados pese a que Apex terminó, se registra inventarioPendiente=true. No repetir a ciegas: recuperar primero los registros por la marca y la evidencia privada de la invocación. Un error de compilación no crea fixtures; un error de ejecución no controlado revierte la transacción. No borrar datos como limpieza.

## Límites y siguiente fase

No se ejecutan pruebas automatizadas de clases Apex. Los cuatro bloques anónimos han compilado y superado sus comprobaciones en Salesforce. La revisión local y la conversión del manifiesto no sustituyen esa comprobación.

La repetición de clave exacta solo acredita unicidad. Quedan fuera generación canónica, idempotencia integral, solapamiento, Batch, reconciliación de procesamiento, permisos completos e informe. Las comprobaciones de modelo con una cuenta técnica no acreditan la matriz de acceso. No se incluyen pruebas de eliminación en este conjunto.

Tras validar, desplegar y comprobar el modelo, el siguiente trabajo será la gestión comercial y la configuración de acceso; no el Batch.

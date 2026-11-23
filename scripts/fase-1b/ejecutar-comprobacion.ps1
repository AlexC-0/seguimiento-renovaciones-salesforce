[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[A-Za-z0-9][A-Za-z0-9_.@-]*$')]
    [string]$TargetOrg,
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^00D[A-Za-z0-9]{12}([A-Za-z0-9]{3})?$')]
    [string]$ExpectedOrgId,
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^0Af[A-Za-z0-9]{12}([A-Za-z0-9]{3})?$')]
    [string]$DeploymentId,
    [Parameter(Mandatory = $true)]
    [ValidateSet('contratos', 'seguimientos', 'ejecuciones', 'incidencias')]
    [string]$Suite
)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'cli.ps1')
Assert-P06AliasIsolation -TargetOrg $TargetOrg
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$config = Get-Content -LiteralPath (Join-Path $projectRoot 'sfdx-project.json') -Raw | ConvertFrom-Json
if ($config.name -ne 'seguimiento-renovaciones-salesforce' -or $config.sourceApiVersion -ne '65.0') {
    throw 'Proyecto o versión API inesperados.'
}

$identity = Invoke-P06SfJson -Arguments @(
    'data', 'query', '--target-org', $TargetOrg, '--api-version', '65.0',
    '--query', 'SELECT Id, OrganizationType, IsSandbox FROM Organization LIMIT 1'
)
$organizations = @($identity.result.records)
if ($organizations.Count -ne 1) { throw 'Identidad de destino no verificable.' }
$organization = $organizations[0]
# Los primeros 15 caracteres conservan la distinción de mayúsculas del Id.
if (-not ([string]$organization.Id).Substring(0, 15).Equals($ExpectedOrgId.Substring(0, 15), [StringComparison]::Ordinal)) {
    throw 'El alias apunta a una organización distinta de la verificada.'
}
if ($organization.IsSandbox -ne $true -and $organization.OrganizationType -ne 'Developer Edition') {
    throw 'No se permite ejecutar fixtures en este tipo de organización.'
}
$deployment = Invoke-P06SfJson -Arguments @(
    'project', 'deploy', 'report', '--target-org', $TargetOrg, '--job-id', $DeploymentId
)
if ($deployment.result.done -ne $true -or $deployment.result.success -ne $true -or
    $deployment.result.status -ne 'Succeeded' -or $deployment.result.checkOnly -ne $false) {
    throw 'Se necesita un despliegue aplicado y finalizado, no una validación ni una operación pendiente.'
}

$runTag = 'P06-1B-' + [DateTime]::UtcNow.ToString('yyyyMMddTHHmmss') + '-' + [guid]::NewGuid().ToString('N').Substring(0, 8)
$localDirectory = Join-Path $projectRoot '.sf/p06-fase-1b'
$evidenceDirectory = Join-Path $projectRoot 'docs/evidencias-fase-1b'
foreach ($directory in @($localDirectory, $evidenceDirectory)) {
    if (-not (Test-Path -LiteralPath $directory)) { New-Item -ItemType Directory -Path $directory -Force | Out-Null }
}
$source = (Get-Content -LiteralPath (Join-Path $PSScriptRoot 'soporte.apex') -Raw -Encoding UTF8) +
    [Environment]::NewLine + (Get-Content -LiteralPath (Join-Path $PSScriptRoot ($Suite + '.apex')) -Raw -Encoding UTF8)
$source = $source.Replace('__P06_RUN_TAG__', $runTag).Replace('__P06_ORG_ID__', $ExpectedOrgId)
$temporaryScript = Join-Path $localDirectory ($runTag + '-' + $Suite + '.apex')
$evidencePath = Join-Path $evidenceDirectory ($runTag + '-' + $Suite + '.json')
if ((Test-Path -LiteralPath $temporaryScript) -or (Test-Path -LiteralPath $evidencePath)) { throw 'La evidencia ya existe; no se sobrescribe.' }
$encoding = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($temporaryScript, $source, $encoding)

# No hay reintentos automáticos. Cada invocación crea fixtures propios.
$response = Invoke-P06SfJson -AllowCliFailure -Arguments @(
    'apex', 'run', '--target-org', $TargetOrg, '--api-version', '65.0',
    '--file', $temporaryScript, '--debug-level', 'DEBUGONLY'
)
$executionResult = if ($null -ne $response.result) { $response.result } else { $response.data }
$compiled = $executionResult.compiled -eq $true
$executed = $executionResult.success -eq $true -and $response.status -eq 0
$report = $null
if ($compiled -and $executed) {
    $markers = [regex]::Matches([string]$executionResult.logs, '(?m)P06_RESULT=(\{[^\r\n]+\})')
    if ($markers.Count -eq 1) {
        $candidate = $markers[0].Groups[1].Value | ConvertFrom-Json
        if ($candidate.marca -eq $runTag -and $candidate.suite -eq $Suite -and $candidate.api -eq '65.0') {
            $report = $candidate
        }
    }
}
$evidence = [ordered]@{
    api = '65.0'
    suite = $Suite
    marca = $runTag
    fechaUtc = [DateTime]::UtcNow.ToString('o')
    despliegue = $DeploymentId
    compilado = $compiled
    ejecutado = $executed
    inventarioPendiente = $executed -and $null -eq $report
    correcto = $null -ne $report -and $report.correcto -eq $true
    diagnosticoCompilacion = if (-not $compiled) {
        [ordered]@{ linea = $executionResult.line; columna = $executionResult.column; problema = $executionResult.compileProblem }
    } else { $null }
    casos = @()
    registrosConservados = @()
}
if ($null -ne $report) {
    # Lista explícita: nunca se guardan logs completos ni datos de autenticación.
    $evidence.casos = @($report.casos | ForEach-Object {
        [ordered]@{ caso = $_.caso; esperado = $_.esperado; observado = $_.observado; resultado = $_.resultado }
    })
    $evidence.registrosConservados = @($report.registrosConservados | ForEach-Object {
        [ordered]@{ objeto = $_.objeto; id = $_.id; funcion = $_.funcion }
    })
}
[System.IO.File]::WriteAllText($evidencePath, ($evidence | ConvertTo-Json -Depth 12) + [Environment]::NewLine, $encoding)
Write-Output $evidencePath
if (-not $evidence.correcto) {
    throw 'Comprobación no acreditada por completo. Revisar la evidencia; no repetir ni borrar fixtures automáticamente.'
}

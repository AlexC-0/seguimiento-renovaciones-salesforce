[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[A-Za-z0-9][A-Za-z0-9_.@-]*$')]
    [string]$TargetOrg,
    [Parameter(Mandatory = $true)]
    [ValidateSet('Developer Edition', 'Trailhead Playground', 'Sandbox')]
    [string]$ExpectedType
)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'cli.ps1')
Assert-P06AliasIsolation -TargetOrg $TargetOrg

$identity = Invoke-P06SfJson -Arguments @(
    'data', 'query', '--target-org', $TargetOrg, '--api-version', '65.0',
    '--query', 'SELECT Id, OrganizationType, IsSandbox FROM Organization LIMIT 1'
)
$organizations = @($identity.result.records)
if ($organizations.Count -ne 1) { throw 'No se obtuvo una identidad de organización inequívoca.' }
$organization = $organizations[0]
if ($ExpectedType -eq 'Sandbox') {
    if ($organization.IsSandbox -ne $true) { throw 'El destino no es una sandbox.' }
} elseif ($organization.OrganizationType -ne 'Developer Edition' -or $organization.IsSandbox -eq $true) {
    throw 'El destino no coincide con la edición de desarrollo declarada. Detener antes de escribir.'
}

$components = Invoke-P06SfJson -Arguments @(
    'data', 'query', '--target-org', $TargetOrg, '--api-version', '65.0', '--use-tooling-api',
    '--query', "SELECT QualifiedApiName FROM EntityDefinition WHERE QualifiedApiName IN ('ContratoComercial__c','SeguimientoRenovacion__c','EjecucionRenovacion__c','IncidenciaRenovacion__c')"
)
$licenses = Invoke-P06SfJson -Arguments @(
    'data', 'query', '--target-org', $TargetOrg, '--api-version', '65.0',
    '--query', 'SELECT Name, TotalLicenses, UsedLicenses FROM UserLicense'
)
$users = Invoke-P06SfJson -Arguments @(
    'data', 'query', '--target-org', $TargetOrg, '--api-version', '65.0',
    '--query', 'SELECT UserType, COUNT(Id) Total FROM User WHERE IsActive = true GROUP BY UserType'
)
$account = Invoke-P06SfJson -Arguments @(
    'sobject', 'describe', '--sobject', 'Account', '--target-org', $TargetOrg, '--api-version', '65.0'
)

# OrganizationId sirve para vincular las operaciones posteriores; no publicar este objeto completo.
[pscustomobject]@{
    OrganizationId = [string]$organization.Id
    OrganizationType = [string]$organization.OrganizationType
    IsSandbox = [bool]$organization.IsSandbox
    ApiVersion = '65.0'
    ConnectionVerified = $true
    ExistingComponents = @($components.result.records | ForEach-Object { [string]$_.QualifiedApiName })
    Licenses = @($licenses.result.records | ForEach-Object {
        [pscustomobject]@{ Name = $_.Name; Total = $_.TotalLicenses; Used = $_.UsedLicenses }
    })
    ActiveUsersByType = @($users.result.records | ForEach-Object {
        [pscustomobject]@{ Type = $_.UserType; Count = $_.Total }
    })
    AccountCreateable = [bool]$account.result.createable
}

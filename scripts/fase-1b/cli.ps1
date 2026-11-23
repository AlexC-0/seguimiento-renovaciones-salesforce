# Función de captura: no inicia sesiones ni vuelca respuestas completas.
function Invoke-P06SfJson {
    param(
        [Parameter(Mandatory = $true)][string[]]$Arguments,
        [switch]$AllowCliFailure
    )
    $previousPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $raw = & sf.cmd @Arguments --json 2>$null
        $nativeExitCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $previousPreference
    }
    try { $response = ($raw -join [Environment]::NewLine) | ConvertFrom-Json }
    catch { throw 'La CLI no devolvió JSON interpretable. No se publica la salida sin sanitizar.' }
    if ($null -eq $response -or $null -eq $response.status) { throw 'Respuesta de CLI incompleta.' }
    if (-not $AllowCliFailure -and ($nativeExitCode -ne 0 -or $response.status -ne 0)) {
        throw "La operación de CLI falló con código $nativeExitCode y estado $($response.status). Revisar de forma privada; no continuar."
    }
    return $response
}

function Assert-P06AliasIsolation {
    param([Parameter(Mandatory = $true)][string]$TargetOrg)
    $aliases = Invoke-P06SfJson -Arguments @('alias', 'list')
    $selected = @($aliases.result | Where-Object { $_.alias -eq $TargetOrg })
    if ($selected.Count -ne 1 -or [string]::IsNullOrWhiteSpace([string]$selected[0].value)) {
        throw 'Se requiere un alias local identificado y autenticado de forma inequívoca.'
    }
    $otherAliases = @($aliases.result | Where-Object { $_.alias -ne $TargetOrg -and $_.value -eq $selected[0].value })
    if ($otherAliases.Count -gt 0) {
        throw 'La identidad está asociada a otros alias. Detener antes de consultar o escribir en un destino posiblemente ajeno.'
    }
}

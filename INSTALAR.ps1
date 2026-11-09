$ErrorActionPreference = 'Stop'
$root = Join-Path $env:USERPROFILE 'Desktop\IA_LOCAL_WINDOWS'
if (-not (Test-Path -LiteralPath $root -PathType Container)) {
    throw "No se encontro IA_LOCAL_WINDOWS en: $root. No se instalara en otra carpeta sin confirmar la ruta."
}
$source = Join-Path $PSScriptRoot 'modulo'
$dest = Join-Path $root 'pentest_lab_v11'
if (-not (Test-Path -LiteralPath (Join-Path $source 'herramienta.js'))) { throw 'Faltan archivos del modulo' }
if (Test-Path -LiteralPath $dest) {
    throw "Ya existe $dest. No se sobreescribio nada; revisa la carpeta antes de reinstalar."
}
Copy-Item -LiteralPath $source -Destination $dest -Recurse -ErrorAction Stop
Write-Host 'Modulo instalado sin modificar server.js ni agente.js:' -ForegroundColor Green
Write-Host $dest
Push-Location $dest
try {
    & node --test 'tests/test-herramienta.js'
    if ($LASTEXITCODE -ne 0) { throw 'Fallo una prueba de validacion de alcance' }
} finally { Pop-Location }
Write-Host 'Pruebas de permisos finalizadas. El agente NO esta integrado al chat todavia.' -ForegroundColor Cyan
Write-Host 'Para primera auditoria: cd "' $dest '"; node herramienta.js investigar http://127.0.0.1:3417'

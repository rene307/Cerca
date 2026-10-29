$ErrorActionPreference = 'Stop'
$raiz = Join-Path $env:USERPROFILE 'Downloads\Cerca_Fase1.5'
$paquete = Join-Path $PSScriptRoot 'ACTUALIZACION'
if (-not (Test-Path (Join-Path $raiz 'frontend\src\app\app.component.ts'))) {
  Write-Host '[ERROR] No encuentro Cerca_Fase1.5 dentro de Descargas. No he modificado nada.' -ForegroundColor Red
  exit 1
}
$hashes = @{"frontend\src\app\app.component.ts"="326fb9ca1244e275718fd5c9358c5cf5bcb071e460d93d43eb540da29ec2e032";"INICIAR_CERCA_SEO.bat"="086580dae5cdb75937aa45fcebe13cedf5cc3ed056e7b01c2c2343ddc9bfcd04";"INICIAR_CERCA_UN_SERVIDOR.bat"="0f90f940147a595680fe4719ba2f44a585a723ff8ebf691526deef9cc95d0462";"backend\src\calidad-negocios.js"="1548d1a27acf362e8ab7c9125008cb882eebf7779d371c7e21dd29910c320434";"backend\src\seo-pages.js"="38fd81b0f4f9797d1ba52320db178893ef13e38b56f9eec3ba555f80692c2c0a";"backend\src\server.js"="9de66748a5558cbcadf5773d9a684adbd1250107d8dde46a3017980374443b05";}
$existentes = @("frontend\src\app\app.component.ts","backend\src\server.js","backend\src\calidad-negocios.js","backend\src\seo-pages.js","INICIAR_CERCA_SEO.bat","INICIAR_CERCA_UN_SERVIDOR.bat")
$nuevos = @("frontend\src\app\cafeterias-nunoa.ts","backend\seed\nunoa-cafes.json","backend\src\nunoa-importacion.js","backend\src\importar-cafes-nunoa.js","backend\tests\nunoa-cafeterias.test.js","AGREGAR_20_CAFETERIAS_NUNOA.bat","frontend\public\assets\cerca-nunoa-cafeterias\nunoa-001.webp","frontend\public\assets\cerca-nunoa-cafeterias\nunoa-002.webp","frontend\public\assets\cerca-nunoa-cafeterias\nunoa-003.webp","frontend\public\assets\cerca-nunoa-cafeterias\nunoa-004.webp","frontend\public\assets\cerca-nunoa-cafeterias\nunoa-005.webp","frontend\public\assets\cerca-nunoa-cafeterias\nunoa-006.webp","frontend\public\assets\cerca-nunoa-cafeterias\nunoa-007.webp","frontend\public\assets\cerca-nunoa-cafeterias\nunoa-008.webp","frontend\public\assets\cerca-nunoa-cafeterias\nunoa-009.webp","frontend\public\assets\cerca-nunoa-cafeterias\nunoa-010.webp","frontend\public\assets\cerca-nunoa-cafeterias\nunoa-011.webp","frontend\public\assets\cerca-nunoa-cafeterias\nunoa-012.webp","frontend\public\assets\cerca-nunoa-cafeterias\nunoa-013.webp","frontend\public\assets\cerca-nunoa-cafeterias\nunoa-014.webp","frontend\public\assets\cerca-nunoa-cafeterias\nunoa-015.webp","frontend\public\assets\cerca-nunoa-cafeterias\nunoa-016.webp","frontend\public\assets\cerca-nunoa-cafeterias\nunoa-017.webp","frontend\public\assets\cerca-nunoa-cafeterias\nunoa-018.webp","frontend\public\assets\cerca-nunoa-cafeterias\nunoa-019.webp","frontend\public\assets\cerca-nunoa-cafeterias\nunoa-020.webp")
# Revisar antes de copiar: no sobrescribir ediciones posteriores ni archivos nuevos distintos.
foreach ($ruta in $existentes) {
 $dest = Join-Path $raiz $ruta
 $src = Join-Path $paquete $ruta
 if (-not (Test-Path $dest)) { Write-Host "[ERROR] No existe $ruta. Sin cambios."; exit 1 }
 $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $dest).Hash.ToLowerInvariant()
 $nuevo = (Get-FileHash -Algorithm SHA256 -LiteralPath $src).Hash.ToLowerInvariant()
 if ($actual -ne $hashes[$ruta].ToLowerInvariant() -and $actual -ne $nuevo) {
   Write-Host "[CONFLICTO] $ruta cambio despues del archivo RAR que analizamos. NO SE INSTALO NADA." -ForegroundColor Yellow
   Write-Host 'Conserva tu archivo actual. Necesitamos revisar esta version nueva antes de sobrescribirla.'
   exit 1
 }
}
foreach ($ruta in $nuevos) {
 $dest = Join-Path $raiz $ruta
 $src = Join-Path $paquete $ruta
 if (Test-Path $dest) {
   $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $dest).Hash.ToLowerInvariant()
   $nuevo = (Get-FileHash -Algorithm SHA256 -LiteralPath $src).Hash.ToLowerInvariant()
   if ($actual -ne $nuevo) { Write-Host "[CONFLICTO] Ya existe una version distinta de $ruta. Sin cambios." -ForegroundColor Yellow;exit 1 }
 }
}
$respaldo = Join-Path $raiz ('RESPALDO_ANTES_NUNOA_' + (Get-Date -Format 'yyyyMMdd_HHmmss'))
foreach ($ruta in $existentes) {
 $anterior=Join-Path $raiz $ruta
 $backup=Join-Path $respaldo $ruta
 New-Item -ItemType Directory -Force -Path (Split-Path $backup -Parent) | Out-Null
 Copy-Item -LiteralPath $anterior -Destination $backup -Force
}
foreach ($ruta in @($existentes)+@($nuevos)) {
 $dest=Join-Path $raiz $ruta
 New-Item -ItemType Directory -Force -Path (Split-Path $dest -Parent) | Out-Null
 Copy-Item -LiteralPath (Join-Path $paquete $ruta) -Destination $dest -Force
}
Write-Host '[OK] Archivos de CERCA actualizados. Copias previas guardadas en:' -ForegroundColor Green
Write-Host $respaldo
Push-Location (Join-Path $raiz 'backend')
try {
 if (-not (Test-Path 'node_modules\pg')) {
    Write-Host 'Instalando dependencias necesarias para PostgreSQL...'
    & npm.cmd install --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'No fue posible instalar dependencias. Los archivos originales estan respaldados.' }
 }
 Write-Host 'Insertando solo las 20 cafeterias nuevas en la base cerca...'
 & node src\importar-cafes-nunoa.js
 if ($LASTEXITCODE -ne 0) { throw 'No se pudo conectar a PostgreSQL. Los archivos ya estan listos: inicia PostgreSQL y vuelve a ejecutar AGREGAR_20_CAFETERIAS_NUNOA.bat.' }
} catch { Write-Host "[AVISO] $_" -ForegroundColor Yellow; exit 2 }
finally { Pop-Location }
Write-Host '[LISTO] Recarga CERCA con Ctrl+F5. Si deseas activar el SEO, reinicia INICIAR_CERCA_SEO.bat.' -ForegroundColor Green
Write-Host 'URL: http://localhost:4200/nunoa/cafes'
exit 0

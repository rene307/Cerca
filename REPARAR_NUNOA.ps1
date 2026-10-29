$ErrorActionPreference = 'Stop'
function Fallo($mensaje) { Write-Host "[ERROR] $mensaje" -ForegroundColor Red; exit 1 }
$proyecto = Join-Path $env:USERPROFILE 'Downloads\Cerca_Fase1.5'
$backend = Join-Path $proyecto 'backend'
$frontend = Join-Path $proyecto 'frontend'
$archivo = Join-Path $PSScriptRoot 'datos\nunoa-cafes.json'
$script = Join-Path $PSScriptRoot 'importar-nunoa-directo.mjs'
if (!(Test-Path (Join-Path $backend 'src\db.js'))) { Fallo "No encuentro el proyecto en $proyecto. Sin cambios." }
if (!(Test-Path (Join-Path $backend '.env'))) { Fallo 'No encuentro backend\.env. Conserva tu configuracion actual y no compartas contrasenas.' }
if (!(Test-Path (Join-Path $backend 'node_modules\pg'))) { Fallo 'No veo pg instalado. Abre backend en PowerShell y ejecuta npm install antes de reintentar.' }
if (!(Test-Path $archivo) -or !(Test-Path $script)) { Fallo 'Faltan los archivos de este paquete. Descomprime todo el ZIP primero.' }
try { $null = Get-Command node -ErrorAction Stop } catch { Fallo 'No se encontro Node.js instalado o disponible en PATH.' }
Write-Host '============================================================'
Write-Host 'CERCA.CL / NUNOA - SOLO DATOS, SIN MODIFICAR CODIGO' -ForegroundColor Cyan
Write-Host "Proyecto: $proyecto"
Write-Host '============================================================'
Write-Host '[1/3] Comprobando y agregando solo cafeterias faltantes en PostgreSQL...'
Push-Location $backend
try {
  & node $script $archivo
  if ($LASTEXITCODE -ne 0) { Fallo 'La insercion no se completo. Revisa el mensaje de Node.js arriba. No se reemplazo codigo.' }
} finally { Pop-Location }
Write-Host '[2/3] Agregando SOLO imagenes de las nuevas cafeterias (sin sobrescribir existentes)...'
$destino = Join-Path $frontend 'public\assets\cerca-nunoa-cafeterias'
New-Item -ItemType Directory -Path $destino -Force | Out-Null
$nuevas = 0
for ($i=1; $i -le 20; $i++) {
  $nombre = 'nunoa-{0:D3}.webp' -f $i
  $origen = Join-Path $PSScriptRoot ('imagenes\'+$nombre)
  $salida = Join-Path $destino $nombre
  if (!(Test-Path $origen)) { Write-Host "[AVISO] Falta imagen $nombre" -ForegroundColor Yellow; continue }
  if (!(Test-Path $salida)) { Copy-Item -LiteralPath $origen -Destination $salida; $nuevas++ }
  elseif ((Get-FileHash $origen -Algorithm SHA256).Hash -ne (Get-FileHash $salida -Algorithm SHA256).Hash) {
    Write-Host "[AVISO] $nombre ya existia; se conserva tu version." -ForegroundColor Yellow
  }
}
Write-Host "Imagenes nuevas copiadas: $nuevas. No se reemplazo ninguna imagen anterior."
Write-Host '[3/3] Comprobando API y fichas SEO del servidor activo...'
try {
  $r = Invoke-RestMethod -Uri 'http://localhost:4200/api/negocios' -TimeoutSec 8 -ErrorAction Stop
  $lista = @($r)
  $enNunoa = @($lista | Where-Object { $_.comuna -eq 'Ñuñoa' -and $_.categoria -eq 'Cafés' }).Count
  Write-Host "La API publica devuelve $enNunoa cafeterias de Nunoa." -ForegroundColor Cyan
  if ($enNunoa -lt 21) {
    Write-Host '[AVISO] PostgreSQL fue actualizado, pero el servidor del puerto 4200 aun no muestra las 21 fichas.' -ForegroundColor Yellow
    Write-Host 'Cierra el servidor antiguo y vuelve a iniciar CERCA desde Cerca_Fase1.5\INICIAR_CERCA_SEO.bat.'
    Write-Host 'Si sigue igual, envia una foto de ESTA ventana para diagnosticar la conexion.'
  } else {
    Write-Host '[OK] Los negocios ya estan disponibles en el catalogo publico.' -ForegroundColor Green
  }
  try {
    $seo = Invoke-WebRequest -Uri 'http://localhost:4200/nunoa/cafes/kalopsia-cafe' -UseBasicParsing -TimeoutSec 7 -ErrorAction Stop
    Write-Host "Ruta SEO /nunoa/cafes/kalopsia-cafe: HTTP $($seo.StatusCode)." -ForegroundColor Green
  } catch { Write-Host '[AVISO] La ruta SEO individual aun no responde: inicia el servidor SEO de CERCA.' -ForegroundColor Yellow }
} catch {
  Write-Host '[AVISO] No pude consultar localhost:4200. El servidor no esta encendido o la API fallo.' -ForegroundColor Yellow
  Write-Host 'Abre Cerca_Fase1.5\INICIAR_CERCA_SEO.bat y recarga Ctrl+F5.'
}
Write-Host '============================================================'
Write-Host 'Listo: no se han tocado HTML, CSS, componentes, rutas, panel ni fichas anteriores.' -ForegroundColor Green
Write-Host 'En CERCA abre: http://localhost:4200/nunoa/cafes'
Write-Host '============================================================'

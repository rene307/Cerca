@echo off
setlocal
cd /d "%~dp0"
title CERCA - URLs SEO directamente en Express
 echo CERCA - RUTAS SEO REALES
 echo El backend Express entrega HTML SEO en el puerto 3100.
 echo Inicia 01_API_CERCA.bat primero. El frontend Angular puede abrirse por separado en 4200.
 echo.
 echo Comprobando si el backend responde...
 powershell -NoProfile -Command "try { $r=Invoke-WebRequest 'http://127.0.0.1:3100/api/salud' -UseBasicParsing -TimeoutSec 4; Write-Host ('PostgreSQL y API: HTTP '+$r.StatusCode) } catch { Write-Host 'ERROR: el backend o PostgreSQL no responde. Ejecuta 04_DIAGNOSTICAR_URLS_SEO.bat.' }"
 echo.
 start "" "http://127.0.0.1:3100/la-florida/cafes"
 start "" "http://127.0.0.1:3100/la-florida/peluquerias"
 start "" "http://127.0.0.1:3100/la-florida/peluquerias/estudio-norte"
 echo.
 echo URL a traves del proxy Angular: http://localhost:4200/la-florida/cafes
 echo Administrador: http://localhost:4200/panel-admin.html
 echo Mapa del sitio: http://127.0.0.1:3100/sitemap.xml
 pause

@echo off
setlocal
cd /d "%~dp0backend"
title CERCA - COMPROBAR LAS PELUQUERIAS REALES
if not exist .env (echo FALTA backend\.env con PGDATABASE=cerca & pause & exit /b 1)
if not exist node_modules\pg (echo Instalando dependencias... & call npm install)
node src\comprobar-peluquerias.js
if errorlevel 1 (pause & exit /b 1)
echo.
echo Comprobando si la API responde en 3100 y si Angular responde en 4200...
powershell -NoProfile -Command "foreach($url in @('http://127.0.0.1:3100/api/negocios','http://127.0.0.1:4200/api/negocios')){try{$res=Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 5; Write-Host ($url+' : HTTP '+$res.StatusCode+'; contenido '+$res.Headers['Content-Type'])}catch{Write-Host ($url+' : NO RESPONDE - '+$_.Exception.Message) -ForegroundColor Red}}"
echo.
pause

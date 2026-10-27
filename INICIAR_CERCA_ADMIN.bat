@echo off
setlocal
cd /d "%~dp0"
title CERCA CL - INICIADOR ADMIN
if not exist "backend\.env" (
 echo.
 echo FALTA CONFIGURAR EL CORREO Y POSTGRESQL.
 echo 1. Copia tu backend\.env antiguo aqui, o crea uno desde backend\.env.example.
 echo 2. Configura el correo de administrador y SMTP en backend\.env.
 echo 3. Ejecuta nuevamente este archivo.
 echo No cambies el archivo .env de tus proyectos CCC u otros.
 pause
 exit /b 1
)
echo Iniciando backend y frontend de CERCA...
start "CERCA - API" cmd /k ""%~dp001_API_CERCA.bat""
start "CERCA - Angular" cmd /k ""%~dp002_WEB_CERCA.bat""
echo.
echo Las dos ventanas deben quedar abiertas. Si Windows pregunta por el puerto 4200,
echo cierra la version vieja de Angular y ejecuta de nuevo este archivo.
echo.
echo Comprobando que ambos servicios respondan...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ok=$false;for($i=0;$i -lt 50;$i++){try{$b=Invoke-RestMethod 'http://127.0.0.1:3100/api/admin/estado' -TimeoutSec 2;if($b.servicio -eq 'CERCA_ADMIN_OTP_V2'){$p=Invoke-WebRequest 'http://localhost:4200/panel-admin.html' -UseBasicParsing -TimeoutSec 2;if($p.StatusCode -eq 200 -and $p.Content.Contains('CERCA_ADMIN_OTP_V2')){$ok=$true;break}}}catch{};Start-Sleep -Seconds 2};if($ok){Write-Host 'CERCA conectado. Se abrira el panel.'}else{Write-Host 'No se verificaron ambos servicios. Revisa las 2 ventanas; ver DIAGNOSTICAR_CERCA.bat.'}"
start "" "http://localhost:4200/panel-admin.html"
echo Si aun muestra servidor antiguo, cierra las ventanas viejas y vuelve a ejecutar.
pause

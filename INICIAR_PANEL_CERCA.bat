@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title CERCA - Panel administrador (PUERTO 3215)
echo ================================================
echo CERCA.CL ADMIN - CORRECCION ERROR 500
 echo ================================================
echo La web se abrira desde la API. NO uses localhost:4200.
where node >nul 2>nul
if errorlevel 1 (
 echo FALTA NODE.JS 20 o superior.
 pause
 exit /b 1
)
node scripts\preparar-entorno.mjs
if errorlevel 3 (
 echo.
 echo Configura la clave de aplicacion Gmail para enviar codigos reales.
 call CONFIGURAR_GMAIL.bat
 if errorlevel 1 (echo El servidor no se inicia sin Gmail configurado. & pause & exit /b 1)
 node scripts\preparar-entorno.mjs
)
if errorlevel 1 (echo ERROR de configuracion. Revisa backend\.env & pause & exit /b 1)
cd backend
if not exist node_modules\express\package.json (
 echo Instalando dependencias del backend...
 call npm install
 if errorlevel 1 (echo Fallo npm install. & pause & exit /b 1)
)
echo.
echo Verificando tablas faltantes en PostgreSQL cerca (sin borrar negocios)...
call npm run migrate
if errorlevel 1 (echo Fallo PostgreSQL. Revisa que el servicio este encendido y los datos PG del .env. & pause & exit /b 1)
echo.
echo Abre http://127.0.0.1:3215/panel-admin.html
 echo NO uses la pestaña anterior localhost:4200
set PORT=3215
start "CERCA ABRIR" /min powershell -NoProfile -Command "Start-Sleep -Seconds 3; Start-Process 'http://127.0.0.1:3215/panel-admin.html'"
call npm start
if errorlevel 1 echo No se pudo iniciar el servidor. Si el puerto 3215 ya esta en uso, cierra el otro servidor CERCA.
pause

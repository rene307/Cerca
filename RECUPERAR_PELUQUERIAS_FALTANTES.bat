@echo off
setlocal
cd /d "%~dp0backend"
title CERCA - RECUPERAR SOLO PELUQUERIAS FALTANTES
if not exist .env (echo FALTA backend\.env & pause & exit /b 1)
if not exist node_modules\pg (echo Instalando dependencias... & call npm install)
echo Se comprobara la base existente sin borrarla.
node src\recuperar-peluquerias.js
if errorlevel 1 (pause & exit /b 1)
echo.
choice /C SN /M "Deseas agregar SOLO las peluquerias que faltan del catalogo antiguo"
if errorlevel 2 (echo No se realizaron cambios & pause & exit /b 0)
node src\recuperar-peluquerias.js --aplicar
pause

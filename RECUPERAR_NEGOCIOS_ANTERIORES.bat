@echo off
setlocal
cd /d "%~dp0backend"
title CERCA - RECUPERACION NO DESTRUCTIVA DE FICHAS ANTERIORES
if not exist .env (echo Falta backend\.env & pause & exit /b 1)
if not exist node_modules\pg (call npm install --no-audit --no-fund & if errorlevel 1 (pause & exit /b 1))
echo Mostrar los negocios anteriores que faltan, sin borrar ni modificar ninguno...
node src\recuperar-fichas-faltantes.js
if errorlevel 1 (pause & exit /b 1)
echo.
echo ATENCION: la recuperacion usa fichas anteriores aun no verificadas.
choice /C SN /M "Insertar UNICAMENTE las fichas que faltan del catalogo anterior (S/N)"
if errorlevel 2 (echo No se efectuaron cambios. & pause & exit /b 0)
node src\recuperar-fichas-faltantes.js --aplicar
pause

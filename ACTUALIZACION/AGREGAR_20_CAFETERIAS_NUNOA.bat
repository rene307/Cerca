@echo off
setlocal
cd /d "%~dp0backend"
title CERCA - Agregar 20 cafeterias Nunoa sin borrar
if not exist ".env" (
 echo [ERROR] Falta backend\.env. Conserva el que ya tenias en tu proyecto.
 pause
 exit /b 1
)
if not exist "node_modules\pg" (
 echo Preparando dependencias del backend...
 call npm install --no-audit --no-fund
 if errorlevel 1 goto :FALLO
)
echo Conectando con PostgreSQL base cerca...
node src\importar-cafes-nunoa.js
if errorlevel 1 goto :FALLO
echo.
echo LISTO. Recarga CERCA con Ctrl+F5.
echo Las fichas SEO estaran disponibles al reiniciar con INICIAR_CERCA_SEO.bat.
pause
exit /b 0
:FALLO
echo No se completo la importacion. Los datos existentes permanecen intactos.
pause
exit /b 1

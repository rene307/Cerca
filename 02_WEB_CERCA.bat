@echo off
setlocal
cd /d "%~dp0frontend"
title CERCA CL - PAGINA 4200
where node >nul 2>nul
if errorlevel 1 (
 echo Necesitas instalar Node.js version 20 o superior.
 pause
 exit /b 1
)
if not exist node_modules\@angular\cli (
 echo Instalando dependencias de Angular...
 call npm install
 if errorlevel 1 (echo Error instalando dependencias & pause & exit /b 1)
)
echo.
echo CERCA WEB en http://localhost:4200/panel-admin.html
echo Esta ventana debe permanecer abierta mientras uses CERCA.
call npm start -- --host 127.0.0.1 --port 4200
pause

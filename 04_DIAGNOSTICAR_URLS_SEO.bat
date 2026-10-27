@echo off
setlocal
cd /d "%~dp0"
title CERCA - Revisar error SEO 500
where node >nul 2>nul
if errorlevel 1 (
 echo No se encontro Node.js. Instala Node.js 20 o superior.
 pause
 exit /b 1
)
node DIAGNOSTICAR_URLS_SEO.mjs
pause

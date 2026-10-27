@echo off
cd /d "%~dp0"
title DIAGNOSTICO CERCA UN SERVIDOR 4200
where node >nul 2>&1
if errorlevel 1 (echo Instala Node.js 20 o superior. & pause & exit /b 1)
node DIAGNOSTICO_CERCA_UN_SERVIDOR.mjs
pause

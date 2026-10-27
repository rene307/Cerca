@echo off
setlocal
cd /d "%~dp0"
title CERCA CL - Diagnostico de login
where node >nul 2>nul
if errorlevel 1 (echo Node.js no esta instalado. & pause & exit /b 1)
node DIAGNOSTICAR_CERCA.mjs
pause

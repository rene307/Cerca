@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0CONFIGURAR_GMAIL.ps1"
if errorlevel 1 (echo No se configuro Gmail. & pause & exit /b 1)
exit /b 0

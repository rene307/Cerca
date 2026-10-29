@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title CERCA - Instalar 20 cafeterias Nunoa sin cambiar diseno
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0INSTALAR_EN_CERCA.ps1"
if errorlevel 1 (
 echo.
 echo Revisa el mensaje anterior. No borres tu proyecto original.
)
echo.
pause

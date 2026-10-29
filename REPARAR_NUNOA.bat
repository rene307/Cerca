@echo off
chcp 65001 >nul
setlocal EnableExtensions
cd /d "%~dp0"
title CERCA - SOLO AGREGAR CAFETERIAS NUNOA
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0REPARAR_NUNOA.ps1"
if errorlevel 1 (
  echo.
  echo IMPORTANTE: Si hay un mensaje de ERROR, envia una foto de esta ventana.
)
echo.
pause

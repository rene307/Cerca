@echo off
setlocal
cd /d "%~dp0"
title CERCA.cl - Cafe Macondo Puente Alto
if not exist "backend\src\db.js" (
 echo ERROR: Copia estos dos archivos a Cerca_Fase1.5, junto a frontend y backend.
 pause
 exit /b 1
)
node .\CERCA_CORREGIR_CAFE_MACONDO.cjs --aplicar
if errorlevel 1 echo La correccion no se completo. Revisa el error mostrado.
pause

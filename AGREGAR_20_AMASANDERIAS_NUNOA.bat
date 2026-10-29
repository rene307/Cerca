@echo off
setlocal
chcp 65001 >nul
title CERCA.cl - Agregar amasanderias Nunoa SIN reemplazar negocios
set "PROYECTO=%~dp0"
if not exist "%PROYECTO%backend\src\db.js" set "PROYECTO=%USERPROFILE%\Downloads\Cerca_Fase1.5\"
if not exist "%PROYECTO%backend\src\db.js" (
  echo NO ENCONTRE LA CARPETA Cerca_Fase1.5.
  echo Extrae el ZIP en Descargas o copia estos tres archivos dentro de Cerca_Fase1.5.
  echo No se ha cambiado nada.
  pause
  exit /b 1
)
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js no esta disponible. Debes ejecutar desde el equipo donde funciona CERCA.
  pause
  exit /b 1
)
echo.
echo PROYECTO: %PROYECTO%
echo Se conservara la web actual y las fichas existentes.
echo.
node "%~dp0INSTALAR_AMASANDERIAS_NUNOA.mjs" "%PROYECTO%"
if errorlevel 1 (
 echo.
 echo La importacion NO termino correctamente. Muestra una captura de este error.
) else (
 echo.
 echo Revisa http://localhost:4200/nunoa/panaderias y actualiza con Ctrl+F5.
 echo El navegador puede requerir reiniciar el servidor CERCA para ver los cambios.
)
echo.
pause

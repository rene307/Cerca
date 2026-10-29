@echo off
chcp 65001 >nul
setlocal EnableExtensions
title CERCA.cl - 20 cafeterias de Nunoa sin cambiar tu pagina
color 0F
echo ===============================================================
echo CERCA.CL - AGREGAR 20 FICHAS A NUNOA SIN BORRAR NADA
echo ===============================================================
where node >nul 2>nul
if errorlevel 1 (
 echo ERROR: No encuentro Node.js.
 goto FINAL_ERROR
)
if exist "%~dp0backend\src\db.js" (
 set "CARPETA_CERCA=%~dp0"
) else (
 set "CARPETA_CERCA=%USERPROFILE%\Downloads\Cerca_Fase1.5"
)
if not exist "%CARPETA_CERCA%\backend\src\db.js" (
 echo ERROR: No encontre backend\src\db.js en %CARPETA_CERCA%
 echo Conserva la carpeta original y dime donde esta si esta en otra ruta.
 goto FINAL_ERROR
)
if not exist "%CARPETA_CERCA%\backend\.env" (
 echo ERROR: Falta backend\.env. NO agregue datos.
 goto FINAL_ERROR
)
echo Proyecto encontrado: %CARPETA_CERCA%
node "%~dp0REPARACION_NUNOA_20.mjs" "%CARPETA_CERCA%"
if errorlevel 1 goto FINAL_ERROR
echo.
echo Si la API sigue mostrando 1 cafe, REINICIA el servidor CERCA SEO.
echo No ejecutes ningun importador anterior.
echo.
pause
exit /b 0
:FINAL_ERROR
echo.
echo La importacion no se completo. NO borres tu proyecto.
echo Toma captura de ESTA ventana y enviala a ChatGPT.
pause
exit /b 1

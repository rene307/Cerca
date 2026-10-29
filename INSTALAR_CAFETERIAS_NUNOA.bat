@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo ERROR: Node.js no esta instalado o no esta en PATH.
 pause
 exit /b 1
)
echo.
echo CERCA.CL - NUNOA - 20 fichas nuevas + Casa Miga
if not exist "backend\package.json" (
 echo ERROR: Copia estos archivos a la raiz de Cerca_Fase1.5
 pause
 exit /b 1
)
node "CONECTAR_NUNOA_A_CERCA.cjs"
if errorlevel 1 (
 echo ERROR: No se completaron las fichas. Se detuvo sin ejecutar el parche adicional.
 pause
 exit /b 1
)
node "CORREGIR_VISUALIZACION_NUNOA.cjs"
if errorlevel 1 (
 echo ADVERTENCIA: Revisa el error. La base puede haber sido actualizada.
 pause
 exit /b 1
)
echo.
echo LISTO: Reinicia el servidor y comprueba http://localhost:4200/nunoa/cafes
pause

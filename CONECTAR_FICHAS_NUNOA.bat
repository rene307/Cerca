@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
where node >nul 2>nul
if errorlevel 1 (echo ERROR: Falta Node.js 20 o superior.& pause & exit /b 1)
echo ========================================
echo  CERCA.cl - 20 cafes Nunoa, reseñas breves
echo ========================================
echo.
node "CONECTAR_NUNOA_A_CERCA.cjs"
if errorlevel 1 (echo. & echo NO COMPLETADO. Revisa el error anterior.& pause & exit /b 1)
echo.
echo IMPORTACION COMPLETADA. Reinicia CERCA con INICIAR_CERCA_SEO.bat
pause

@echo off
cd /d "%~dp0"
echo ADVERTENCIA: PUBLICA datos NO verificados. Revisar todas las fichas primero.
node importar_pizzerias.mjs --aplicar --publicar
echo.
pause

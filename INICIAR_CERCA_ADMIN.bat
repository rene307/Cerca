@echo off
setlocal
cd /d "%~dp0"
if not exist "backend\.env" (
 echo.
 echo FALTA backend\.env - debes configurarlo antes del acceso por correo.
 echo Copia backend\.env.example como backend\.env, sin publicar tus claves.
 echo Revisa LEEME_ADMIN_ENTRADA.txt
 echo.
 pause
 exit /b 1
)
where node >nul 2>&1
if errorlevel 1 (
 echo Node.js no esta instalado o no esta en PATH.
 pause
 exit /b 1
)
netstat -ano | findstr /R /C:":3000 .*LISTENING" >nul
if not errorlevel 1 (
 echo.
 echo ADVERTENCIA: Ya hay un servidor usando el puerto 3000.
 echo Puede ser la version vieja que causaba "Ruta no encontrada".
 echo Deten el servidor viejo con Ctrl+C en su ventana.
 echo Luego vuelve a ejecutar este archivo.
 pause
 exit /b 1
)
start "CERCA - Backend" cmd /k "cd /d ""%~dp0backend"" && (if not exist node_modules npm install) && npm run migrate && npm start"
start "CERCA - Frontend" cmd /k "cd /d ""%~dp0frontend"" && (if not exist node_modules npm install) && npm start"
echo.
echo CERCA: se abrieron dos consolas.
echo Cuando ambos servidores esten activos, visita:
echo http://localhost:4200
 echo Desde arriba haz clic en "Mi administracion".
echo.
pause

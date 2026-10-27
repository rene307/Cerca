@echo off
setlocal
cd /d "%~dp0backend"
title CERCA CL - API ADMINISTRADOR 3100
if not exist .env (
 echo.
 echo [FALTA CONFIGURAR] No existe backend\.env
 echo Copia backend\.env.example a backend\.env y agrega tus claves.
 echo No pongas contrasenas dentro de los archivos que compartas.
 pause
 exit /b 1
)
where node >nul 2>nul
if errorlevel 1 (
 echo Necesitas instalar Node.js version 20 o superior.
 pause
 exit /b 1
)
if not exist node_modules\express (
 echo Instalando dependencias del backend...
 call npm install
 if errorlevel 1 (echo Error instalando dependencias & pause & exit /b 1)
)
REM Evita conectar a una API vieja por error.
set PORT=3100
echo Verificando y creando tablas faltantes, sin borrar negocios existentes...
call npm run migrate
if errorlevel 1 (
 echo ERROR: Revisa usuario, clave y nombre de base de datos PostgreSQL en backend\.env.
 pause
 exit /b 1
)
echo.
echo Revisando el catalogo inicial SOLO si la base cerca no tiene ningun negocio...
call npm run rescatar-si-vacia
if errorlevel 1 (
 echo No se pudo revisar la base. No se ha borrado ningun negocio.
 pause
 exit /b 1
)
echo.
echo CERCA ADMIN API en http://127.0.0.1:3100/api/admin/estado
echo Esta ventana debe permanecer abierta mientras uses CERCA.
call npm start
pause

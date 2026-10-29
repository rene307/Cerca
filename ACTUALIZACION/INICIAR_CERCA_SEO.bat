\
@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title CERCA SEO - Iniciar portada, rutas y administrador
color 0F

echo =======================================================
echo      CERCA - PORTADA + RUTAS SEO + API EN PUERTO 4200
echo =======================================================
echo.
echo Esta version usa UN SOLO SERVIDOR. NO necesita ng serve.
echo Cierra las otras terminales antiguas de Angular y Node.
echo.
where node >nul 2>nul
if errorlevel 1 (echo ERROR: Necesitas Node.js 20 o superior.&pause&exit /b 1)
where npm >nul 2>nul
if errorlevel 1 (echo ERROR: Falta npm.&pause&exit /b 1)

powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 4200 -State Listen -ErrorAction SilentlyContinue) { exit 1 } else { exit 0 }" >nul 2>nul
if errorlevel 1 (
  echo [PUERTO 4200 OCUPADO] Hay otra version de CERCA/Angular activa.
  echo Cierra la terminal antigua que tiene ng serve, npm start o node.
  echo Si quieres identificarla ejecuta: netstat -ano ^| findstr :4200
  pause
  exit /b 1
)

if not exist "backend\.env" (
  echo [FALTA] backend\.env
  echo Copia backend\.env.example a backend\.env y completa PGHOST, PGDATABASE,
  echo PGUSER, PGPASSWORD. No compartas ese archivo.
  pause
  exit /b 1
)

echo [1/5] Instalando dependencias del backend...
cd backend
call npm install --no-audit --no-fund
if errorlevel 1 (echo ERROR: npm install backend.&pause&exit /b 1)

echo [2/5] Verificando la base cerca en la migracion...

echo [3/5] Comprobando tablas existentes sin borrar datos...
call npm run migrate
if errorlevel 1 (echo ERROR: Comprueba PostgreSQL y backend\.env. No se borro ningun negocio.&pause&exit /b 1)
echo Agregando solo cafeterias faltantes de Nunoa, sin reemplazar negocios...
node src\importar-cafes-nunoa.js
if errorlevel 1 (echo ERROR importacion Nunoa, revisa la conexion PostgreSQL.&pause&exit /b 1)

echo [4/5] Compilando la portada Angular para servirla desde Node...
cd ..\frontend
call npm install --no-audit --no-fund
if errorlevel 1 (echo ERROR: npm install frontend.&pause&exit /b 1)
call npm run build
if errorlevel 1 (echo ERROR: Fallo compilacion Angular. Revisa el error en esta ventana.&pause&exit /b 1)

cd ..\backend
set PORT=4200
set SITE_URL=http://localhost:4200
set CORS_ORIGINS=http://localhost:4200
set NODE_ENV=production
echo.
echo [5/5] Iniciando CERCA en el puerto 4200...
echo.
echo Abre en el navegador:
echo   http://localhost:4200/
echo   http://localhost:4200/la-florida/cafes
echo   http://localhost:4200/panel-admin.html
echo.
echo Para diagnosticar las rutas ejecuta VERIFICAR_URLS_SEO.bat
call npm start
if errorlevel 1 echo ERROR: El servidor finalizo. Revisa el mensaje de arriba.
pause

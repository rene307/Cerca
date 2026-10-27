@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title CERCA.CL - UN SOLO SERVIDOR: 4200
color 0F
echo ================================================================
echo          CERCA.CL - WEB + NEGOCIOS + SEO + ADMINISTRADOR
 echo                SOLO http://localhost:4200
 echo ================================================================
echo.
where node >nul 2>&1
if errorlevel 1 (echo ERROR: Instala Node.js 20 o superior. & goto :FALLO)
where npm >nul 2>&1
if errorlevel 1 (echo ERROR: No se encontro npm. & goto :FALLO)
if not exist "backend\.env" (
 echo ERROR: Falta backend\.env. No puedo conocer tu contrasena de PostgreSQL.
 echo Copia TU archivo anterior backend\.env a la carpeta backend de esta version.
 echo O copia backend\.env.example a backend\.env y configura PGHOST/PGUSER/PGPASSWORD/PGDATABASE.
 goto :FALLO
)
echo [1/6] Comprobando que el puerto 4200 este libre...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p=Get-NetTCPConnection -LocalPort 4200 -State Listen -ErrorAction SilentlyContinue; if($p){Write-Host 'Puerto 4200 ocupado. Cierra el npm start anterior en VS Code con Ctrl+C.' -ForegroundColor Red; $p|Select-Object LocalPort,OwningProcess|Format-Table; exit 1}"
if errorlevel 1 goto :FALLO
echo [2/6] Preparando dependencias del backend...
cd /d "%~dp0backend"
if not exist "node_modules\pg" (
 call npm install --no-audit --no-fund
 if errorlevel 1 goto :FALLO
)
echo [3/6] Verificando base cerca, credenciales y negocios...
node src\diagnosticar-db.js
if errorlevel 1 goto :FALLO
echo [4/6] Comprobando tablas sin borrar tus datos...
call npm run migrate
if errorlevel 1 goto :FALLO
node src\conteo-negocios.js
if errorlevel 2 (
 echo.
 echo ATENCION: PostgreSQL tiene CERO negocios. Puedes recuperar 65 fichas antiguas,
 echo que vienen en el ZIP y estan pendientes de verificacion. NO son nuevos registros reales.
 choice /C SN /M "Quieres importar ese catalogo antiguo en la base VACIA (S/N)"
 if errorlevel 2 (
  echo No se importa el catalogo de respaldo. La base sigue vacia.
 ) else (
  call npm run rescatar-si-vacia
  if errorlevel 1 goto :FALLO
 )
) else (
 if errorlevel 1 goto :FALLO
)
cd /d "%~dp0frontend"
echo [5/6] Compilando tu portada Angular original y las fichas...
if not exist "node_modules\@angular\cli" (
 call npm install --no-audit --no-fund
 if errorlevel 1 goto :FALLO
)
call npm run build
if errorlevel 1 goto :FALLO
if not exist "dist\cerca\browser\index.html" (
 echo ERROR: Angular no genero dist\cerca\browser\index.html.
 goto :FALLO
)
cd /d "%~dp0backend"
echo [6/6] Iniciando web, SEO y PostgreSQL en el MISMO servidor...
set "PORT=4200"
echo.
echo ABRE EN TU NAVEGADOR:
echo   http://localhost:4200/
echo   http://localhost:4200/la-florida/panaderias
echo   http://localhost:4200/la-florida/peluquerias
echo   http://localhost:4200/panel-admin.html
echo.
echo Mantener esta ventana abierta. Presiona Ctrl+C para detener CERCA.
echo.
node src\server.js
if errorlevel 1 goto :FALLO
exit /b 0
:FALLO
echo.
echo CERCA no pudo iniciar completamente. NO SE BORRARON NEGOCIOS.
echo Revisa el mensaje de error anterior. Puedes ejecutar DIAGNOSTICO_CERCA_UN_SERVIDOR.bat.
pause
exit /b 1

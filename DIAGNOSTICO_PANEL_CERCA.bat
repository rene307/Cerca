@echo off
 echo DIAGNOSTICO CERCA ADMIN
 powershell -NoProfile -Command "try {$x=Invoke-RestMethod -Uri 'http://127.0.0.1:3215/api/admin/estado' -TimeoutSec 6; $x | ConvertTo-Json -Depth 5} catch {Write-Host 'No hay servidor CERCA en el puerto 3215. Ejecuta INICIAR_PANEL_CERCA.bat.' -ForegroundColor Red}"
 pause

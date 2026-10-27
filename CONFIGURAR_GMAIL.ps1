$ErrorActionPreference='Stop'
$envPath = Join-Path $PSScriptRoot 'backend\.env'
if (-not (Test-Path -LiteralPath $envPath)) {Write-Host 'Falta backend\.env. Ejecuta primero INICIAR_PANEL_CERCA.bat.' -ForegroundColor Red; exit 1}
Write-Host ''
Write-Host 'CONFIGURAR GMAIL — CERCA.CL' -ForegroundColor Cyan
Write-Host 'Correo destinatario autorizado: renerivaslabarca@gmail.com'
Write-Host 'Necesitas la clave de aplicacion de Google (16 caracteres), no tu contrasena habitual.' -ForegroundColor Yellow
Write-Host 'Si aun no la tienes, activa la verificacion en 2 pasos y usa https://myaccount.google.com/apppasswords'
Write-Host 'La clave NO se mostrara mientras escribes.'
$secure=Read-Host 'Introduce la clave de aplicacion Gmail (o Enter para salir)' -AsSecureString
$bstr=[IntPtr]::Zero
try {
  $bstr=[System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  $value=[System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  $value=$value -replace '\s',''
  if ([string]::IsNullOrEmpty($value)) {Write-Host 'No se guardo clave alguna.';exit 1}
  if($value -notmatch '^[a-zA-Z0-9]{16}$') {Write-Host 'La clave de aplicacion Google debe tener 16 caracteres (sin espacios).' -ForegroundColor Red;exit 1}
  $raw=[System.IO.File]::ReadAllText($envPath)
  $pattern='(?m)^SMTP_PASS=.*$'
  if ([regex]::IsMatch($raw,$pattern)) {$raw=[regex]::Replace($raw,$pattern,('SMTP_PASS='+$value))}
  else {$raw=$raw.TrimEnd()+[Environment]::NewLine+'SMTP_PASS='+$value+[Environment]::NewLine}
  [System.IO.File]::WriteAllText($envPath,$raw,[System.Text.UTF8Encoding]::new($false))
  Write-Host 'SMTP configurado en este equipo. No subas backend/.env a GitHub.' -ForegroundColor Green
} finally {if ($bstr -ne [IntPtr]::Zero) {[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)}; $value=$null}

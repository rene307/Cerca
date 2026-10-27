$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$envPath = Join-Path $root 'backend\.env'
$example = Join-Path $root 'backend\.env.example'
if (!(Test-Path -LiteralPath $envPath)) {
  Copy-Item -LiteralPath $example -Destination $envPath
  Write-Host 'Se creo backend\.env de ejemplo. Si ya tienes PostgreSQL configurado, copia tus valores PG* de tu archivo anterior.' -ForegroundColor Yellow
}
$raw = [System.IO.File]::ReadAllText($envPath)
# robust function rewritten below for PowerShell callback quirks
function Upsert([string]$key,[string]$value) {
  $pattern = '(?m)^' + [regex]::Escape($key) + '=.*\r?\n?'
  $script:raw = [regex]::Replace($script:raw,$pattern,'')
  $script:raw = $script:raw.TrimEnd() + [Environment]::NewLine + $key + '=' + $value + [Environment]::NewLine
}
Write-Host 'CONFIGURACION GMAIL - CERCA ADMIN' -ForegroundColor Cyan
Write-Host 'Destino UNICO: renerivaslabarca@gmail.com'
Write-Host 'Se conservaran tus claves PG* de PostgreSQL.'
Upsert 'ADMIN_EMAIL' 'renerivaslabarca@gmail.com'
Upsert 'SMTP_HOST' 'smtp.gmail.com'
Upsert 'SMTP_PORT' '465'
Upsert 'SMTP_SECURE' 'true'
Upsert 'SMTP_USER' 'renerivaslabarca@gmail.com'
Upsert 'SMTP_FROM' '"CERCA.cl <renerivaslabarca@gmail.com>"'
Upsert 'CORS_ORIGINS' 'http://localhost:4201,http://127.0.0.1:4201'
Upsert 'PORT' '3100'
$oldSecret=[regex]::Match($raw,'(?m)^JWT_SECRET=(.+)$')
if (!$oldSecret.Success -or $oldSecret.Groups[1].Value.Trim().Length -lt 32) {
  $bytes = New-Object byte[] 48
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  Upsert 'JWT_SECRET' (([BitConverter]::ToString($bytes) -replace '-', ''))
  Write-Host 'JWT_SECRET seguro generado.' -ForegroundColor Green
}
Write-Host 'Pega la CONTRASENA DE APLICACION de Google, no tu contrasena normal.'
Write-Host 'Al escribir, no se mostrara en pantalla.'
$secure=Read-Host 'Contrasena de aplicacion Gmail (Enter para conservar SMTP_PASS existente)' -AsSecureString
$bstr=[IntPtr]::Zero
try {
  $bstr=[System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  $password=[System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  if (![string]::IsNullOrWhiteSpace($password)) {
    $password=($password -replace '\s','')
    Upsert 'SMTP_PASS' $password
  }
} finally {
  if($bstr -ne [IntPtr]::Zero){[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)}
  $password=$null
}
[System.IO.File]::WriteAllText($envPath,$raw,[System.Text.UTF8Encoding]::new($false))
Write-Host 'Archivo backend\.env actualizado (no lo publiques en GitHub).' -ForegroundColor Green
Write-Host 'Ahora ejecuta INICIAR_CERCA_ADMIN.bat.'

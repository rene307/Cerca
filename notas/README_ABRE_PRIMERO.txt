CERCA.CL — REPARACIÓN DE ERROR 500 — 22 OCT 2026
====================================================

1. Extrae este ZIP COMPLETO en la carpeta Descargas. No lo mezcles con el antiguo.
   Mantiene la portada, fichas y panel de administración en el paquete.
2. Si tu proyecto sigue en Descargas/Cerca_Fase1.5, el iniciador intentará COPIAR
   el .env desde esa carpeta. Si no, copia manualmente tu archivo original
   Cerca_Fase1.5/backend/.env a NUEVA_CARPETA/backend/.env.
3. Doble clic en INICIAR_PANEL_CERCA.bat. Si falta la clave de aplicación de
   Gmail, el programa la pedirá una vez SIN mostrarla en la pantalla.
   Genera esa clave en https://myaccount.google.com/apppasswords usando tu cuenta
   renerivaslabarca@gmail.com (requiere verificación en 2 pasos).
4. Espera que aparezca el texto CERCA API conectada y se abra el navegador:
   http://127.0.0.1:3215/panel-admin.html
5. PULSA "Enviarme clave mágica". Si Gmail está disponible, llegará un código
   de 8 dígitos válido por 6 minutos, de un solo uso.

IMPORTANTE: No uses localhost:4200/panel-admin.html. Ese es el Angular
anterior; puede apuntar a una API distinta. El nuevo panel en puerto 3215
usa la misma dirección para las llamadas y el HTML, sin proxy Angular.

SEGURIDAD:
- Único correo autorizado: renerivaslabarca@gmail.com.
- Nunca se incluye una contraseña PostgreSQL/SMTP dentro de este ZIP.
- Este programa NO ejecuta npm run seed, NO elimina la BD y NO borra negocios.
- Solo utiliza la base llamada "cerca"; migración CREATE TABLE IF NOT EXISTS.
- Conserva tu backend/.env; no subas este archivo con claves a GitHub.
- Sin acceso real a tu PostgreSQL ni a la contraseña de aplicación de Gmail,
  no se puede confirmar el envío de códigos desde este entorno.
- Si aparece un problema, ejecuta DIAGNOSTICO_PANEL_CERCA.bat o mira la terminal.

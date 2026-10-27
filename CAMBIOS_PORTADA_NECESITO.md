# CERCA.cl — Portada orientada a NECESITO y DESCUBRIR

Se trabajó sobre el proyecto `CERCA_POSTGRESQL_BASE_CERCA.zip` existente (Angular 19, Node/Express, PostgreSQL). Se mantienen sin modificación las rutas de backend y la estructura de la web fuera del bloque principal de portada.

## Cambios
- En la portada ahora hay 2 opciones: **Necesito algo** y **Quiero descubrir**.
- Caja de búsqueda con comuna existente y sugerencias rápidas.
- Clasificación de frases simples en categorías: «necesito comprar pan» -> Panaderías; «cambiar una rueda» -> Vulcanización/Mecánicos; «papel lustre» -> Tiendas; «tomar café» -> Cafés.
- Si la solicitud no coincide con ninguna regla, busca palabras en la información disponible de los locales.
- Encabezado de resultados explica que son locales relacionados, NO stock confirmado.
- No se han cambiado administración, formularios, API, base de datos, campañas, mapa o las fichas existentes.

## Archivos modificados
- `frontend/src/app/app.component.html`
- `frontend/src/app/app.component.ts`
- `frontend/src/app/app.component.css`

## Instalación
1. Descomprimir el proyecto completo.
2. Para el frontend (Windows PowerShell):
   ```powershell
   cd CERCA_POSTGRESQL_REAL/frontend
   npm install
   npm start
   ```
3. La API de CERCA y PostgreSQL deben ejecutarse según el README original (`README_CERCA_POSTGRESQL.md`): la portada consulta sus locales mediante las rutas actuales.
4. Para probar solo la clasificación de intención, escribe en la portada frases como «Necesito pan», «Cambiar una rueda», «Papel lustre», «Tomar café».

## Limitaciones honestas
- Esto **NO envía mensajes automáticos por WhatsApp**. Ese proceso requiere el backend de solicitudes, identificación de proveedores autorizados y la API oficial de Meta.
- No verifica stock, precios ni disponibilidad. Muestra posibles negocios del rubro.
- El proyecto mantiene sus configuraciones actuales, incluido el bloqueo de acceso por la burbuja de suscripción si está habilitado.
- Se verificó sintaxis TypeScript y clasificación con varias frases. La instalación Angular mediante npm no se completó en este entorno; falta confirmar `ng build` en el equipo del usuario.

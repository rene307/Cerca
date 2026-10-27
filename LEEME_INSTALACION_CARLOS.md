# CERCA.cl — ficha destacada Carlos Mecánico

Este ZIP contiene una copia del proyecto CERCA.cl guardado en la Biblioteca y la actualización de Carlos.
NO reemplaza ni modifica por sí solo tu carpeta local ni la base PostgreSQL.

## IMPORTANTE ANTES DE PUBLICAR
- Confirma con Carlos autorización para usar su fotografía y teléfono en una ficha pública.
- Confirma la comuna: **La Florida** es PROVISIONAL, elegida porque es la comuna que estabas explorando en la app. No se dispone de una dirección ni horario verificados.
- 5.0 representa la **recomendación personal/editorial que indicaste**, no un promedio de opiniones CERCA. No atribuimos las 12 reseñas que figuraban en el boceto anterior.
- Al abrir el enlace de WhatsApp, el cliente verá un mensaje redactado y decidirá enviarlo. No se envía automáticamente.

## OPCIÓN A: instalar Carlos sin perder tus cambios locales (RECOMENDADA)
1. Haz una copia de seguridad de tu `Cerca_Fase1.5` local.
2. Copia estos archivos del ZIP a tu proyecto existente:
   - `frontend/public/assets/carlos-mecanico.jpg` a la misma ubicación
   - `frontend/src/assets/carlos-mecanico.jpg` a la misma ubicación (si tu Angular usa `src/assets`)
   - `backend/src/agregar-carlos.js` a `backend/src/agregar-carlos.js`
3. En tu terminal `backend`, puedes usar `node src/agregar-carlos.js` directamente. Usa tus credenciales de `.env` actuales; NO se incluyen credenciales.
4. Para que la ficha tenga el aspecto especial de estrella/5.0 y WhatsApp personalizado, integra manualmente los cambios de los archivos `frontend/src/app/app.component.ts`, `.html`, `.css` con tu código actual (no los sobrescribas si hiciste cambios desde esta copia).
5. Si prefieres hacerlo desde pgAdmin en la base `cerca`, ejecuta `backend/sql/002_carlos_mecanico.sql` **en vez de** `node src/agregar-carlos.js`; ambos actualizan o crean una sola ficha sin duplicarla.
6. Con el backend `npm start` y frontend `npm start`, recarga la app y selecciona La Florida / Mecánicos.
7. En Chrome verifica `http://localhost:3100/api/negocios` para confirmar la ficha de Carlos.

## OPCIÓN B: ejecutar el proyecto completo del ZIP
Copia la carpeta a otro directorio, traslada SOLO tu `.env` local a la carpeta `backend/` en tu PC (no viene incluido), luego en terminales separadas:
````
cd backend
npm install
node src/agregar-carlos.js
npm start
````
````
cd frontend
npm install
npm start
````
Abre `http://localhost:4200`. Necesitas tu PostgreSQL actual (`cerca`) y sus 65 negocios existentes. Nunca ejecutes un seed/migrate sobre tu base sin verificar su efecto.

## Vista previa
Abre `VISTA_PREVIA_CARLOS.html` con doble clic. Funciona sin Node/PostgreSQL; el botón dirige a WhatsApp con el mensaje listo.

## Información de Carlos
- Nombre: Carlos Mecánico
- Categoría: Mecánicos
- Comuna: La Florida (provisional)
- WhatsApp: +56 9 5769 1917
- Destacado: sí (prioridad 1)
- Calificación: 5.0, recomendación personal/editorial (no reseña CERCA ni promedio)
- Foto: recortada de la imagen del contacto que compartiste
- Dirección / Horario: por confirmar

## Eventos y medición
El botón WhatsApp conserva `registrarEvento('whatsapp', negocio)` y el backend ya guarda ese clic en la tabla `eventos` de PostgreSQL cuando la API está disponible. Es un clic de contacto, NO una venta ni un mensaje efectivamente enviado.

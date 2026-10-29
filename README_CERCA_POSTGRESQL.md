# CERCA.cl — Edición con API real y PostgreSQL

Esta entrega integra la última versión de las 65 fichas, logo, tarjetas, reputación, campañas y dashboard con un backend **Node.js + Express + PostgreSQL**.


## Base de datos de este proyecto: cerca (PostgreSQL 18)

En pgAdmin 4, **DondeAhi** es otra base de datos. CERCA utiliza una base **independiente** llamada `cerca`. No debes renombrar ni borrar DondeAhi, `ccc_db` u otras bases.

1. En el árbol **Servers > PostgreSQL 18 > Databases**, selecciona **postgres** (no DondeAhi) y abre **Query Tool**.
2. Ejecuta **una sola vez** el contenido de `backend/sql/000_crear_base_cerca.sql`: `CREATE DATABASE cerca;`. Si ya existe, no repitas el comando.
3. En **Databases**, clic derecho > **Refresh** y verifica que aparezca la base `cerca`.
4. En `backend`, crea tu archivo privado `.env` a partir de `.env.example` y completa tu contraseña:

```env
PGHOST=localhost
PGPORT=5432
PGDATABASE=cerca
PGUSER=postgres
PGPASSWORD=TU_CONTRASENA_LOCAL
```

Los demás campos de `.env` (`JWT_SECRET`, `ADMIN_PASSWORD_HASH`, etc.) deben configurarse como se explica más abajo. **No publiques `.env` ni compartas contraseñas**. Si tienes una `DATABASE_URL`, esa configuración puede prevalecer sobre las variables `PG*`; verifica que apunte igualmente a `/cerca`.

5. Instala las dependencias del backend y ejecuta primero `npm run migrate` (crea las tablas **dentro de cerca**) y luego `npm run seed` (carga las 65 fichas).

El backend **comprueba el nombre real de la base** antes de iniciar y antes de ejecutar las migraciones o la carga inicial. Si por error conectas con DondeAhi u otra base, se detiene sin modificarla. La versión actual no necesita PostGIS.

## Arranque local

**Requisitos:** Node.js 20 o superior y PostgreSQL 18 local (o PostgreSQL remoto compatible) y la base `cerca` creada. No se incluyen credenciales.

1. `backend`: copiar `.env.example` como `.env` y completar configuración real de PostgreSQL (`DATABASE_URL` o PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE), `JWT_SECRET` aleatorio de 32+ caracteres y `ADMIN_PASSWORD_HASH`. Para generar el hash: en `backend` instalar dependencias con `npm install` y ejecutar `npm run hash-password`. Copiar solo el hash al archivo `.env`.
2. `backend`: ejecutar `npm run migrate`, después `npm run seed` (importa las **65 fichas iniciales** sin sobreescribir registros existentes), y luego `npm start`.
3. `frontend`: ejecutar `npm install`, después `npm start`. Abrir `http://localhost:4200`.
4. En `http://localhost:4200/#admin` ingresar la contraseña que usaste al generar el hash; entonces podrás gestionar negocios, ver estadísticas y filtrar suscriptores.

Los comandos están escritos sin presuponer PowerShell ni otro intérprete. Puedes usar el terminal integrado de VS Code.

### Endpoint de comprobación
`GET /api/salud` debe mostrar `{"ok":true,"postgresql":true}` cuando PostgreSQL esté conectado (con el proxy de Angular o consultando la API directamente).

### Producción
El frontend utiliza **rutas relativas `/api`**. Debes configurar tu hosting o proxy inverso para enviar `/api/*` a la API Express protegida por HTTPS. En Angular local se usa `frontend/proxy.conf.json`, cuyo objetivo coincide con PORT=3000 por defecto. Si cambias el puerto del backend, cambia también ese archivo. Ajusta `CORS_ORIGINS` para la URL pública exacta. **No** publiques `.env`, contraseñas, claves JWT ni `node_modules`.

No exponer directamente PostgreSQL a internet: solo el backend debe conectarse. Aplica TLS y copias de seguridad gestionadas en producción. No compartas el archivo `.env`.

### Migración de datos que editaste previamente en tu navegador
El backend se inicializa con los 65 negocios del último ZIP. Tus ediciones antiguas en localStorage no pueden transferirse de manera automática entre dispositivos. Con la sesión de administrador iniciada, entra en **Anuncios > Importar mis anuncios antiguos de este navegador**, después de exportar una copia. La importación **sobrescribe los ID existentes** con tus datos locales por decisión explícita. No lo ejecutes dos veces sin revisar la lista. Ni la importación ni la semilla generan duplicados por ID.

### Lo que sí guarda PostgreSQL
- Negocios / cambios / publicación / destacados de la administración, visibles desde otros dispositivos.
- Inscripciones voluntarias: nombre, canal, contacto, consentimiento, fecha, comuna, rubros, intención **ahora / pronto / explorando**, frecuencia **diaria / semanal / mensual**, estado y baja.
- Eventos: búsquedas, visitas, apertura de fichas, clics a WhatsApp / web / teléfono / cómo llegar y otras acciones.
- Evaluaciones CERCA de 1 a 5 estrellas y motivos, reclamos y estado, respuestas de administración.
- Programaciones de campañas (solo configuración; **no realiza envíos**).

### Límites importantes
- **Pendiente de verificación**: los registros reales de correo o WhatsApp aún NO acreditan que su titular dio consentimiento. La confirmación de propiedad del canal necesita un proveedor transaccional; por seguridad no se marca ningún contacto confirmado automáticamente ni se envían campañas.
- El mecanismo de opiniones limita una valoración por navegador mediante identificador local y hash en backend; **no verifica compras**. No debe anunciarse como valoración de cliente verificada. La moderación y verificación más fuertes son una etapa adicional.
- El panel obtiene de PostgreSQL estadísticas globales exactas mediante `/api/admin/resumen`. Los gráficos por negocio basados en eventos cargan las últimas 5.000 interacciones (muestreo operativo); **no** son acumulados completos cuando se supera ese límite. Para informes exhaustivos por dimensión hacen falta más consultas agregadas SQL.
- Google Search Console, pagos/ingresos, campañas automáticas, envío de email y WhatsApp oficial no están conectados. No se muestran cifras simuladas de ventas.
- `#admin` ya NO abre el editor sin contraseña; el token tiene duración de cuatro horas y vive solo en memoria hasta cerrar la página.
- Los 65 negocios originales incluyen imágenes genéricas y algunos datos de fuentes públicas sin confirmar con los comercios. No se convierten automáticamente en datos verificados.
- Se eliminó el bloqueo al elegir **No** para promociones: el directorio es público y aceptar publicidad no es requisito para visitarlo; esto también facilita rastreo SEO.

### Archivos principales
- `backend/sql/001_schema.sql`: tablas e índices PostgreSQL
- `backend/seed/negocios.json`: catálogo inicial de 65 fichas
- `backend/src/server.js`: rutas, autenticación, registro y consultas
- `backend/tests/validation.test.js`: pruebas de validación `npm test`
- `frontend/src/app/app.component.ts|html|css`: UI e integración con `/api`
- `frontend/proxy.conf.json`: proxy local a backend
- `frontend/src/index.html`, `src/main.ts`: arranque de Angular standalone

**Recomendación antes del uso comercial:** contratar/activar hosting backend y base PostgreSQL, configurar secretos, HTTPS y políticas de privacidad y verificación de contactos. La creación de archivos de código no implica que haya quedado desplegado en tu servidor o dominio.

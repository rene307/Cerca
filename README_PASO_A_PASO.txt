CERCA.CL - EMPADRONAMIENTO DE 25 PIZZERÍAS | 05-11-2026
=====================================================

CONTENIDO
- negocios_para_importar.json: 25 fichas del backend (no publicadas).
- fichas_seo_25.json: títulos, metadescripciones y rutas SEO propuestas.
- catalogo_auditoria_25.csv: datos de los locales para revisar en Excel.
- solo_ticket_referencial.csv: gasto estimado por persona, NO ticket real de ventas.
- importar_pizzerias.mjs: importación segura usando tu API Node/Express existente.
- 01_PREVISUALIZAR.bat: no graba nada.
- 02_IMPORTAR_BORRADORES.bat: crea solo fichas nuevas, sin publicar.
- 03_PUBLICAR_SOLO_DESPUES_DE_VERIFICAR.bat: opcional y no recomendado antes de revisar.
- AJUSTE_CATEGORIA_PIZZERIAS.md: compatibilidad con versiones antiguas del frontend.

PASOS EN WINDOWS
1) Descomprime el archivo ZIP con WinZip o Windows en una carpeta.
2) Arranca PostgreSQL y el backend CERCA.cl. La API de desarrollo debe responder en:
     http://localhost:3000/api/salud
   Si usas otro puerto, ejecuta desde PowerShell:
     node importar_pizzerias.mjs --url http://localhost:PUERTO
3) Instala Node.js 18 o superior, si no lo tienes.
4) Haz doble clic en 02_IMPORTAR_BORRADORES.bat (recomendado).
   El programa muestra primero la PREVISUALIZACIÓN, sin modificar nada.
   Ingresa el correo administrador y el código temporal de 8 dígitos.
   Para confirmar escribe IMPORTAR. Se crea un respaldo automático y se
   agregan solo las fichas nuevas con publicado=false.
5) Si SOLO quieres revisar, usa 01_PREVISUALIZAR.bat.
   No necesitas ejecutar ambos archivos: el 02 ya permite previsualizar.
   Por seguridad, la API limita los códigos por correo y puede bloquear una
   segunda solicitud durante un minuto tras la primera.
6) Revisa en el panel administrador cada ficha: dirección, teléfono, web,
   funcionamiento, fotos reales autorizadas y valores. Luego publícala
   desde tu panel administrativo. NO cambies los datos existentes sin revisar.

SEGURIDAD Y COMPATIBILIDAD
- No reemplaza archivos de tu frontend, server.js ni base de datos.
- No modifica negocios antiguos: usa GET /api/admin/negocios para saltar
  nombres+comuna existentes y POST /api/admin/negocios para crear nuevos.
- Al repetirlo evita duplicar las mismas fichas por nombre+comuna.
- La API real requiere token administrador JWT. El script permite usar
  tu código por email, o CERCA_ADMIN_TOKEN si ya tienes sesión válida.
- No guarda claves ni tokens en disco. Guarda respaldo previo de negocios
  en la carpeta privada respaldos/ del computador donde se ejecuta.
- El backend usado como referencia fue CERCA_server_corregido_fotos(1).js.
  Hay que corroborar que tu versión desplegada conserve esos endpoints.
- La versión del frontend revisada no incluye 'Pizzerías' como categoría.
  Se debe agregar ese rubro a tus filtros/rutas antes de verla en público.
  No se añade automáticamente por seguridad (ver ajuste de categoría).

FOTOS
Las 25 fichas llevan una imagen genérica de pizza, NO fotografías reales de
los comercios. Están marcadas fotoRealAutorizada=false y datosVerificados=false.
Sustituye la imagen genérica en tu administrador con foto autorizada usando
tu carga de imágenes /api/admin/imagenes. No se inventaron fotos de locales.

DATOS PENDIENTES
- Più Pizzeria: primera dirección en el listado puede estar desactualizada.
- La Rústica: verificar vigencia / funcionamiento.
- Davvero: teléfono sin verificar.
- Locura: local en strip center, revisar criterio 'fuera de mall'.
- Tiramisú: revisar si cumple el criterio de independiente/no cadena.
- Todos: verificar vigencia, carta, datos de contacto e imágenes reales.
- Sitios web vacíos: no se encontró web OFICIAL sustentada por el material.
- No se inventaron latitud, longitud, horario, WhatsApp ni puntuaciones.

TICKET MEDIO
Valores aproximados de consumo por PERSONA de un listado previo, NO ventas
ni tickets medios calculados desde boletas. Úsalos solo como referencias.
El backend puede descartar campos extra, por eso están en CSV separados.

NO ES UNA IMPORTACIÓN EJECUTADA
El ZIP solo contiene datos e instalador. Tú debes ejecutar el importador
en tu computador con la API, PostgreSQL y tu correo admin configurados.
Si no recibes correo, revisa el SMTP del backend o entra con sesión válida.

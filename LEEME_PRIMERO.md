# CERCA — Fase 1 corregida · diseño original blanco, negro y naranja

Este proyecto conserva el backend Java Spring Boot y la carpeta database del original.
La interfaz Angular reproduce el prototipo elegido: ciudad oscura en la portada,
texto blanco/naranja, buscador dentro de la portada, ocho categorías circulares,
seis tarjetas iniciales con un mapa ilustrativo al costado, una franja de beneficios
y el llamado para publicar un negocio.

## INICIAR DESDE VS CODE

1. Descomprime el ZIP (no ejecutes nada dentro del archivo comprimido).
2. Abre la carpeta `Cerca_Fase1` en VS Code.
3. Abre la terminal e introduce, en este orden:

   cd frontend
   npm install
   npm start

4. Angular abrirá normalmente `http://localhost:4200/`.

**IMPORTANTE:** el `npm start` debe ejecutarse en `frontend`, NUNCA en
`Cerca_Fase1` ni en `backend`. No abras `src/index.html` mediante el explorador
de Windows, porque es la entrada del compilador de Angular, no la página estática.

## QUÉ ARCHIVOS TIENE EL DISEÑO

- `frontend/src/app/app.component.html` — portada, menú, búsqueda, categorías, listado, mapa y pie.
- `frontend/src/app/app.component.css` — diseño en blanco/negro/naranja y adaptación a móviles.
- `frontend/src/app/app.component.ts` — datos y funcionalidades de demostración.
- `frontend/src/index.html` — sólo la etiqueta `<app-root>` que Angular necesita.
- `frontend/src/global.scss` — estilos base de Ionic.

Se eliminaron `src/styles.css` y `src/LEEME.txt` porque eran sobrantes
no utilizados de una maqueta anterior y confundían al abrir el proyecto.

## SOBRE LOS NEGOCIOS

Los negocios, valoraciones, puntos del mapa y distancias son de EJEMPLO.
El mapa NO usa GPS real. Los favoritos duran lo que dure la página abierta.
El formulario para publicar muestra una ventana informativa; aún no crea cuentas
ni guarda negocios en una base de datos. Las fotos y fuentes externas necesitan internet.

## BACKEND ORIGINAL

Se conserva `backend/` y `database/` sin modificaciones. No es necesario
arrancar Java para visualizar el diseño de Angular; su integración real se hará
posteriormente. El archivo `frontend/src/app/business.service.ts` queda disponible
para una futura integración con `http://localhost:8080/api/negocios`.

## REVISIÓN

- Se comprobó la existencia de todos los archivos Angular y la estructura del ZIP.
- Se alinearon las versiones de Angular 20.3.24 y se dejó `npm start` configurado.
- No se pudo completar una instalación/compilación Angular en este entorno por
  falta de respuesta del registro de npm. El ZIP no contiene `node_modules`.

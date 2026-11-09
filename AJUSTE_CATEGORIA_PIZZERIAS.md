# Categoría «Pizzerías» en CERCA.cl — compatibilidad

Las fichas incluidas usan `categoria: "Pizzerías"` e `icono: "🍕"`.
En el archivo anterior **CERCA_app.component_COMPLETO_CORREGIDO.ts** la unión
`Categoria` no incluía «Pizzerías» y los filtros/rutas tampoco.
No se modificó tu frontend: no sabemos si el código del 5 de noviembre ya
tiene esa categoría y sería arriesgado sobrescribirlo con una versión antigua.

## Comprobación mínima antes de publicar

En el frontend actual, revisa y agrega **solo si faltan** estas entradas:
- En el tipo `Categoria`, añade `| 'Pizzerías'`.
- En `readonly categorias`, añade `{ nombre: 'Pizzerías', icono: '🍕' }`.
- En el objeto de rutas `categorias`, añade `pizzerias: 'Pizzerías'`.
- En la búsqueda por intención, incluye `['Pizzerías']` para `pizza`,
  y conserva los otros rubros presentes en tu diseño.
- En `fotoPorCategoria`, agrega una foto genérica pertinente solo para
  nuevas fichas, sin sobrescribir fotos existentes.
- Si el validador de `backend/.../validation.js` mantiene una lista cerrada
  de categorías, añade «Pizzerías» a sus valores permitidos.

## Ruta esperada

Ejemplo: `/nunoa/pizzerias/davvero-pizzeria`.
El archivo `fichas_seo_25.json` incluye rutas SUGERIDAS; la visibilidad real
requiere que las rutas y filtros del frontend actual las reconozcan.

## No hacer

- No reemplazar el componente Angular completo por uno antiguo.
- No poner estas pizzerías bajo `Cafés` ni `Bares` solo para que aparezcan.
- No poner `datosVerificados: true` sin confirmación directa.
- No atribuir ratings inventados ni teléfonos móviles a WhatsApp por defecto.

/* CERCA.cl: parche mínimo para agregar Restaurantes > Pizzerías / Pollo asado.
   Ejecutar desde la carpeta raíz Cerca_Fase1.5: node agregar_restaurantes_cerca.cjs
   Preserva las demás funciones, crea copias .bak-restaurantes y no toca PostgreSQL. */
const fs = require('node:fs');
const path = require('node:path');

const base = process.cwd();
const tsFile = path.join(base, 'frontend', 'src', 'app', 'app.component.ts');
const htmlFile = path.join(base, 'frontend', 'src', 'app', 'app.component.html');
const cssFile = path.join(base, 'frontend', 'src', 'app', 'app.component.css');

function replaceRequired(source, oldText, newText, note) {
  if (!source.includes(oldText)) throw new Error(`No encuentro ${note}. No he modificado ningún archivo.`);
  return source.replace(oldText, newText);
}

try {
  for (const file of [tsFile, htmlFile, cssFile]) {
    if (!fs.existsSync(file)) throw new Error(`Falta archivo: ${file}`);
  }
  const tsOriginal = fs.readFileSync(tsFile, 'utf8');
  const htmlOriginal = fs.readFileSync(htmlFile, 'utf8');
  const cssOriginal = fs.readFileSync(cssFile, 'utf8');
  if (tsOriginal.includes('mostrarPanelRestaurantes') || htmlOriginal.includes('cerca-restaurantes-subcategorias')) {
    throw new Error('Parece que la categoría Restaurantes ya fue agregada. Revisa antes de aplicar otra vez.');
  }

  let ts = tsOriginal;
  ts = replaceRequired(ts, '  mostrarPanelOficios = false;', `  // Menú de restaurantes: filtro visual sin modificar el esquema de PostgreSQL.\n  mostrarPanelRestaurantes = false;\n  tipoRestauranteActivo: 'Pizzerías' | 'Pollo asado' | null = null;\n\n  mostrarPanelOficios = false;`, 'el panel de oficios en app.component.ts');

  ts = replaceRequired(ts, '  abrirPanelOficios(): void {', `  // Abre o cierra las opciones dentro de Restaurantes.\n  abrirPanelRestaurantes(): void {\n    this.mostrarPanelRestaurantes = !this.mostrarPanelRestaurantes;\n    this.cerrarPanelOficios();\n  }\n\n  // Al elegir un tipo, filtramos los negocios existentes de la comuna.\n  filtrarRestaurante(tipo: 'Pizzerías' | 'Pollo asado'): void {\n    this.tipoRestauranteActivo = tipo;\n    this.mostrarPanelRestaurantes = true;\n    this.oficioSeleccionado = null;\n    this.categoriaActiva = 'Todos';\n    this.categoriasIntencion = null;\n    this.consultaActiva = '';\n    this.busqueda = '';\n    this.mostrarSoloFavoritos = false;\n    this.registrarEvento('categoria');\n    this.irA('explorar');\n  }\n\n  // Filtra por palabras de las fichas ya almacenadas, sin inventar negocios.\n  // A futuro conviene guardar subcategoria de forma explícita en PostgreSQL.\n  private coincideRestaurante(n: Negocio): boolean {\n    if (!this.tipoRestauranteActivo) return true;\n    const texto = [n.nombre, n.categoria, n.descripcion]\n      .filter(Boolean).join(' ').normalize('NFD')\n      .replace(/[\\u0300-\\u036f]/g, '').toLowerCase();\n    if (this.tipoRestauranteActivo === 'Pizzerías') {\n      return /\\bpizzerias?\\b|\\bpizzas?\\b/.test(texto);\n    }\n    return /\\bpollos?\\s+(?:a\\s+la\\s+)?(?:asados?|rostizados?|brasa|parrilla)\\b|\\bpollerias?\\b|\\brostiserias?\\b|\\brotiserias?\\b/.test(texto);\n  }\n\n  abrirPanelOficios(): void {`, 'el método abrirPanelOficios');

  ts = replaceRequired(ts, '      const coincideComuna = negocio.comuna === this.comuna;', `      const coincideRestaurante = this.coincideRestaurante(negocio);\n      const coincideComuna = negocio.comuna === this.comuna;`, 'el filtro de comuna');
  ts = replaceRequired(ts, 'return coincideCategoria && coincideOficio && coincideComuna', 'return coincideCategoria && coincideOficio && coincideRestaurante && coincideComuna', 'la condición final de filtrado');
  ts = replaceRequired(ts, '  seleccionarCategoria(categoria: Categoria): void {', `  seleccionarCategoria(categoria: Categoria): void {\n    this.tipoRestauranteActivo = null;\n    this.mostrarPanelRestaurantes = false;`, 'seleccionarCategoria');
  ts = replaceRequired(ts, '  filtrarOficio(nombre: string): void {', `  filtrarOficio(nombre: string): void {\n    this.tipoRestauranteActivo = null;\n    this.mostrarPanelRestaurantes = false;`, 'filtrarOficio');
  ts = replaceRequired(ts, '  buscar(): void {', `  buscar(): void {\n    this.tipoRestauranteActivo = null;\n    this.mostrarPanelRestaurantes = false;`, 'buscar');

  let html = htmlOriginal;
  const inicio = html.indexOf('<div class="hero-categories"');
  if (inicio < 0) throw new Error('No encuentro el contenedor hero-categories en app.component.html');
  const cierre = html.indexOf('</div>', inicio);
  if (cierre < 0) throw new Error('No encuentro el cierre del contenedor hero-categories');
  const resto = html.slice(inicio, cierre);
  if (!resto.includes('hero-category')) throw new Error('La estructura de categorías cambió; no se aplicaron cambios.');

  const boton = `\n          <!-- CERCA: nueva categoría principal -->\n          <button type="button" class="hero-category"\n                  (click)="abrirPanelRestaurantes()"\n                  [class.selected]="mostrarPanelRestaurantes || tipoRestauranteActivo !== null"\n                  [attr.aria-expanded]="mostrarPanelRestaurantes"\n                  aria-controls="cerca-restaurante-subcategorias">\n            <span class="category-circle" aria-hidden="true">🍽️</span>\n            <span class="category-label">Restaurantes</span>\n          </button>\n        `;
  html = html.slice(0, cierre) + boton + html.slice(cierre);
  const afterDiv = cierre + boton.length + '</div>'.length;
  const subcategorias = `\n        <!-- Subcategorías independientes de restaurantes -->\n        <div *ngIf="mostrarPanelRestaurantes" id="cerca-restaurante-subcategorias"\n             class="cerca-restaurantes-subcategorias" aria-label="Tipos de restaurante">\n          <button type="button" class="hero-category"\n                  [class.selected]="tipoRestauranteActivo === 'Pizzerías'"\n                  (click)="filtrarRestaurante('Pizzerías')">\n            <span class="category-circle" aria-hidden="true">🍕</span>\n            <span class="category-label">Pizzerías</span>\n          </button>\n          <button type="button" class="hero-category"\n                  [class.selected]="tipoRestauranteActivo === 'Pollo asado'"\n                  (click)="filtrarRestaurante('Pollo asado')">\n            <span class="category-circle" aria-hidden="true">🍗</span>\n            <span class="category-label">Pollo asado</span>\n          </button>\n        </div>\n`;
  html = html.slice(0, afterDiv) + subcategorias + html.slice(afterDiv);

  const css = cssOriginal + `\n/* CERCA: subcategorías de Restaurantes. No cambia otras categorías. */\n.cerca-restaurantes-subcategorias {\n  display:flex; flex-wrap:wrap; align-items:center; gap:12px;\n  margin-top:14px; padding:12px 0;\n}\n.cerca-restaurantes-subcategorias .hero-category {\n  min-width:90px;\n}\n`;

  // Respaldo previo a sobrescribir archivos. Se conserva solo al realizar cambios.
  for (const [file, content] of [[tsFile,tsOriginal],[htmlFile,htmlOriginal],[cssFile,cssOriginal]]) {
    const backup = file + '.bak-restaurantes';
    if (!fs.existsSync(backup)) fs.writeFileSync(backup, content, 'utf8');
  }
  fs.writeFileSync(tsFile, ts, 'utf8');
  fs.writeFileSync(htmlFile, html, 'utf8');
  fs.writeFileSync(cssFile, css, 'utf8');
  console.log('CERCA: Restaurantes 🍽️ > Pizzerías 🍕 / Pollo asado 🍗 agregado al frontend.');
  console.log('Archivos: app.component.ts, app.component.html, app.component.css');
  console.log('Respaldo: archivos .bak-restaurantes');
  console.log('Revisa con npm start dentro de frontend. No se modificó PostgreSQL ni el backend.');
} catch (error) {
  console.error('No se aplicó el parche:', error.message);
  process.exitCode = 1;
}

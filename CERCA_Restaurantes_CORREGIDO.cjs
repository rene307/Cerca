/*
  CERCA.cl - Restaurantes > Pizzerías y Pollo asado
  Uso: ejecutar desde la raíz Cerca_Fase1.5:
       node .\CERCA_Restaurantes_CORREGIDO.cjs

  Modifica únicamente el frontend (TS/HTML/CSS); NO toca backend ni PostgreSQL.
  Es transaccional respecto de la detección de anclajes: primero prepara los tres
  contenidos en memoria; crea respaldos antes de escribir. Repetirlo no duplica botones.
*/
const fs = require('node:fs');
const path = require('node:path');

const raiz = process.cwd();
const carpeta = path.join(raiz, 'frontend', 'src', 'app');
const archivos = ['app.component.ts', 'app.component.html', 'app.component.css'];
const rutas = Object.fromEntries(archivos.map(x => [x, path.join(carpeta, x)]));

function error(mensaje) { throw new Error(mensaje); }

function insertarEnMetodo(ts, nombre, contenido, obligatorio = false) {
  // El método puede tener modificadores, espacios y parámetros distintos.
  const re = new RegExp('\\b' + nombre + '\\s*\\([^)]*\\)\\s*(?::\\s*(?:void|Promise<void>))?\\s*\\{', 'm');
  const m = re.exec(ts);
  if (!m) {
    if (obligatorio) error('No encuentro el método ' + nombre + ' en app.component.ts.');
    return ts;
  }
  return ts.slice(0, m.index + m[0].length) + contenido + ts.slice(m.index + m[0].length);
}

function cierreDivBalanceado(html, inicio) {
  const tags = /<\/?div\b[^>]*>/gi;
  tags.lastIndex = inicio;
  let nivel = 0;
  let m;
  while ((m = tags.exec(html))) {
    if (/^<div\b/i.test(m[0])) nivel++;
    else if (--nivel === 0) return { inicio: m.index, fin: tags.lastIndex };
  }
  error('No encontré el cierre del bloque de categorías.');
}

try {
  for (const nombre of archivos) {
    if (!fs.existsSync(rutas[nombre])) error('No se encuentra: ' + rutas[nombre]);
  }

  const original = Object.fromEntries(archivos.map(x => [x, fs.readFileSync(rutas[x], 'utf8')]));
  let ts = original['app.component.ts'];
  let html = original['app.component.html'];
  let css = original['app.component.css'];

  if (ts.includes('mostrarPanelRestaurantes') && html.includes('cerca-restaurantes-subcategorias')) {
    console.log('Restaurantes YA está instalado. No se modificó nada.');
    process.exit(0);
  }
  if (ts.includes('mostrarPanelRestaurantes') || html.includes('cerca-restaurantes-subcategorias')) {
    error('Hay una instalación parcial de Restaurantes. Por seguridad no se modificó nada.');
  }

  // 1. Estado del menú: independiente de las categorías de la base de datos.
  const clase = /export\s+class\s+AppComponent\b[^\{]*\{/m.exec(ts);
  if (!clase) error('No encuentro la clase AppComponent.');
  ts = ts.slice(0, clase.index + clase[0].length) + `
  // CERCA - Menú de restaurantes.
  mostrarPanelRestaurantes = false;
  tipoRestauranteActivo: 'Pizzerías' | 'Pollo asado' | null = null;
` + ts.slice(clase.index + clase[0].length);

  // 2. Métodos: listados reales desde PostgreSQL; solo filtrado en pantalla.
  const anclaMetodo = /\b(?:abrirPanelOficios|seleccionarCategoria)\s*\(/.exec(ts);
  if (!anclaMetodo) error('No encuentro el método de selección de categorías.');
  const comienzoLinea = ts.lastIndexOf('\n', anclaMetodo.index) + 1;
  const metodos = `  // Abre/cierra Restaurantes sin modificar otros botones ni datos.
  abrirPanelRestaurantes(): void {
    this.mostrarPanelRestaurantes = !this.mostrarPanelRestaurantes;
    if (this.mostrarPanelRestaurantes) {
      this.mostrarPanelOficios = false;
      this.oficioSeleccionado = null;
    } else {
      this.tipoRestauranteActivo = null;
    }
  }

  filtrarRestaurante(tipo: 'Pizzerías' | 'Pollo asado'): void {
    this.tipoRestauranteActivo = tipo;
    this.mostrarPanelRestaurantes = true;
    this.mostrarPanelOficios = false;
    this.oficioSeleccionado = null;
    this.categoriaActiva = 'Todos';
    this.categoriasIntencion = null;
    this.consultaActiva = '';
    this.busqueda = '';
    this.mostrarSoloFavoritos = false;
    this.registrarEvento('categoria');
    this.irA('explorar');
  }

  // Coincidencia por contenido de la ficha; no inventa negocios.
  // Para más precisión, después puede añadirse 'subcategoria' a PostgreSQL.
  private coincideRestaurante(n: Negocio): boolean {
    if (!this.tipoRestauranteActivo) return true;
    const texto = [n.nombre, n.categoria, n.descripcion]
      .filter(Boolean).join(' ').normalize('NFD')
      .replace(/[\\u0300-\\u036f]/g, '').toLowerCase();
    if (this.tipoRestauranteActivo === 'Pizzerías') {
      return /\\bpizzerias?\\b|\\bpizzas?\\b/.test(texto);
    }
    return /\\bpollos?\\s+(?:a\\s+la\\s+)?(?:asados?|rostizados?|a\\s+las?\\s+brasas?|a\\s+las?\\s+parrillas?)\\b|\\bpollerias?\\b|\\brotiserias?\\b/.test(texto);
  }

`;
  ts = ts.slice(0, comienzoLinea) + metodos + ts.slice(comienzoLinea);

  // 3. Inserta el filtro al COMIENZO de la lista de negocios, en vez de
  // depender del nombre o formato de la condición 'coincideComuna'.
  const getter = /\bget\s+negociosFiltrados\s*\(\s*\)\s*(?::\s*Negocio\[\])?\s*\{/m.exec(ts);
  if (!getter) error('No encuentro el getter negociosFiltrados; necesito su código actual.');
  const resto = ts.slice(getter.index + getter[0].length);
  const callback = /\.filter\(\s*(?:\(\s*([A-Za-z_$][\w$]*)(?:\s*:\s*[\w<>\[\]]+)?\s*\)|([A-Za-z_$][\w$]*))\s*=>\s*\{/m.exec(resto);
  if (!callback || callback.index > 6500) {
    error('No pude identificar de forma segura el filtro de negocios; necesito app.component.ts actual.');
  }
  const variable = callback[1] || callback[2];
  const posicion = getter.index + getter[0].length + callback.index + callback[0].length;
  ts = ts.slice(0, posicion) + `\n      if (!this.coincideRestaurante(${variable})) return false;` + ts.slice(posicion);

  // 4. Elegir otra categoría o buscar deja de aplicar el filtro de restaurante.
  const reset = '\n    this.tipoRestauranteActivo = null;\n    this.mostrarPanelRestaurantes = false;';
  ts = insertarEnMetodo(ts, 'seleccionarCategoria', reset, true);
  ts = insertarEnMetodo(ts, 'buscar', reset);
  ts = insertarEnMetodo(ts, 'filtrarOficio', reset);
  ts = insertarEnMetodo(ts, 'abrirPanelOficios', reset);

  // 5. Botón de menú en la portada. La búsqueda del cierre soporta divs internos.
  const divMenu = /<div\b[^>]*class=["'][^"']*\bhero-categories\b[^"']*["'][^>]*>/i.exec(html);
  if (!divMenu) error('No encuentro hero-categories en app.component.html.');
  const inicio = divMenu.index;
  const cierre = cierreDivBalanceado(html, inicio);
  if (!html.slice(inicio, cierre.inicio).includes('hero-category')) {
    error('Los botones de categorías tienen una estructura no reconocida.');
  }

  const boton = `
          <!-- Nueva categoría principal: Restaurantes -->
          <button type="button" class="hero-category"
                  (click)="abrirPanelRestaurantes()"
                  [class.selected]="mostrarPanelRestaurantes || tipoRestauranteActivo !== null"
                  [attr.aria-expanded]="mostrarPanelRestaurantes"
                  aria-controls="cerca-restaurantes-subcategorias">
            <span class="category-circle" aria-hidden="true">🍽️</span>
            <span class="category-label">Restaurantes</span>
          </button>`;
  html = html.slice(0, cierre.inicio) + boton + '\n        ' + html.slice(cierre.inicio);
  const cierreActualizado = cierreDivBalanceado(html, inicio);
  const opciones = `
        <!-- Subcategorías de Restaurantes -->
        <div *ngIf="mostrarPanelRestaurantes" id="cerca-restaurantes-subcategorias"
             class="cerca-restaurantes-subcategorias" aria-label="Tipos de restaurante">
          <button type="button" class="hero-category"
                  (click)="filtrarRestaurante('Pizzerías')"
                  [class.selected]="tipoRestauranteActivo === 'Pizzerías'">
            <span class="category-circle" aria-hidden="true">🍕</span>
            <span class="category-label">Pizzerías</span>
          </button>
          <button type="button" class="hero-category"
                  (click)="filtrarRestaurante('Pollo asado')"
                  [class.selected]="tipoRestauranteActivo === 'Pollo asado'">
            <span class="category-circle" aria-hidden="true">🍗</span>
            <span class="category-label">Pollo asado</span>
          </button>
        </div>`;
  html = html.slice(0, cierreActualizado.fin) + opciones + html.slice(cierreActualizado.fin);

  // Evita que el círculo 'Todos' quede seleccionado cuando un subtipo está activo.
  html = html.replace(
    '[class.selected]="categoriaActiva === item.nombre"',
    '[class.selected]="categoriaActiva === item.nombre && !tipoRestauranteActivo"'
  );

  css += `
/* CERCA - Subcategorías de Restaurantes; conserva los estilos originales. */
.cerca-restaurantes-subcategorias {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
  margin-top: 10px;
  padding: 12px 0;
}
.cerca-restaurantes-subcategorias .hero-category { min-width: 90px; }
`;

  // Valida cada resultado ANTES de escribir un solo archivo.
  if (!ts.includes('if (!this.coincideRestaurante(') ||
      !html.includes('filtrarRestaurante(\'Pizzerías\')') ||
      !html.includes('filtrarRestaurante(\'Pollo asado\')')) {
    error('No se completaron los cambios esperados; se mantuvo el proyecto original.');
  }

  const nuevo = {'app.component.ts':ts, 'app.component.html':html, 'app.component.css':css};
  const fecha = new Date().toISOString().replace(/[:.]/g, '-');
  for (const nombre of archivos) {
    fs.writeFileSync(rutas[nombre] + '.bak-restaurantes-' + fecha, original[nombre], 'utf8');
  }
  for (const nombre of archivos) fs.writeFileSync(rutas[nombre], nuevo[nombre], 'utf8');

  console.log('LISTO: instalado 🍽️ Restaurantes > 🍕 Pizzerías / 🍗 Pollo asado.');
  console.log('Se actualizaron app.component.ts, app.component.html y app.component.css.');
  console.log('Se crearon respaldos .bak-restaurantes-' + fecha);
  console.log('No se modificó backend ni PostgreSQL. Recarga localhost:4200.');
} catch (e) {
  console.error('SIN CAMBIOS: ' + e.message);
  process.exitCode = 1;
}

// CERCA.cl - Agrega Restaurantes > Pizzerías y Pollo asado.
// Ejecutar desde la carpeta Cerca_Fase1.5: node .\CERCA_Restaurantes_SIN_ZIP.cjs
// No modifica backend ni PostgreSQL.
const fs = require('node:fs');
const path = require('node:path');
const base = path.join(process.cwd(), 'frontend', 'src', 'app');
const files = ['app.component.ts', 'app.component.html', 'app.component.css'];
try {
  const original = Object.fromEntries(files.map(n => [n, fs.readFileSync(path.join(base, n), 'utf8')]));
  let ts = original['app.component.ts'];
  let html = original['app.component.html'];
  let css = original['app.component.css'];
  if (ts.includes('mostrarPanelRestaurantes') || html.includes('cerca-restaurantes-subcategorias')) {
    throw Error('Restaurantes ya parece estar agregado. No se aplicaron cambios.');
  }
  function cambiar(texto, buscar, agregar) {
    if (!texto.includes(buscar)) throw Error('No se encontró el código esperado: ' + buscar.slice(0, 50));
    return texto.replace(buscar, agregar);
  }
  ts = cambiar(ts, '  mostrarPanelOficios = false;', `  mostrarPanelRestaurantes = false;
  tipoRestauranteActivo: 'Pizzerías' | 'Pollo asado' | null = null;
  mostrarPanelOficios = false;`);

  ts = cambiar(ts, '  abrirPanelOficios(): void {', `  // Menú principal de restaurantes.
  abrirPanelRestaurantes(): void {
    this.mostrarPanelRestaurantes = !this.mostrarPanelRestaurantes;
    this.cerrarPanelOficios();
  }

  // Filtra negocios ya almacenados en PostgreSQL.
  filtrarRestaurante(tipo: 'Pizzerías' | 'Pollo asado'): void {
    this.tipoRestauranteActivo = tipo;
    this.mostrarPanelRestaurantes = true;
    this.oficioSeleccionado = null;
    this.categoriaActiva = 'Todos';
    this.categoriasIntencion = null;
    this.consultaActiva = '';
    this.busqueda = '';
    this.mostrarSoloFavoritos = false;
    this.registrarEvento('categoria');
    this.irA('explorar');
  }

  private coincideRestaurante(n: Negocio): boolean {
    if (!this.tipoRestauranteActivo) return true;
    const texto = [n.nombre, n.categoria, n.descripcion].filter(Boolean)
      .join(' ').toLowerCase().normalize('NFD')
      .replace(/[\\u0300-\\u036f]/g, '');
    return this.tipoRestauranteActivo === 'Pizzerías'
      ? /\\bpizzerias?\\b|\\bpizzas?\\b/.test(texto)
      : /\\bpollos?\\s+(?:a\\s+la\\s+)?(?:asados?|rostizados?|brasa|parrilla)\\b|\\bpollerias?\\b|\\brotiserias?\\b/.test(texto);
  }

  abrirPanelOficios(): void {`);
  ts = cambiar(ts, '      const coincideComuna = negocio.comuna === this.comuna;', `      const coincideRestaurante = this.coincideRestaurante(negocio);
      const coincideComuna = negocio.comuna === this.comuna;`);
  ts = cambiar(ts, 'return coincideCategoria && coincideOficio && coincideComuna', 'return coincideCategoria && coincideOficio && coincideRestaurante && coincideComuna');
  for (const metodo of ['  seleccionarCategoria(categoria: Categoria): void {', '  filtrarOficio(nombre: string): void {', '  buscar(): void {']) {
    ts = cambiar(ts, metodo, `${metodo}\n    this.tipoRestauranteActivo = null;\n    this.mostrarPanelRestaurantes = false;`);
  }

  const inicio = html.indexOf('<div class="hero-categories"');
  if (inicio === -1) throw Error('No se encontró hero-categories en el HTML.');
  const cierre = html.indexOf('\n        </div>', inicio);
  if (cierre === -1 || !html.slice(inicio, cierre).includes('hero-category')) throw Error('La estructura de botones es diferente.');
  const boton = `
          <button type="button" class="hero-category"
                  (click)="abrirPanelRestaurantes()"
                  [class.selected]="mostrarPanelRestaurantes || tipoRestauranteActivo !== null"
                  [attr.aria-expanded]="mostrarPanelRestaurantes"
                  aria-controls="cerca-restaurantes-subcategorias">
            <span class="category-circle" aria-hidden="true">🍽️</span>
            <span class="category-label">Restaurantes</span>
          </button>`;
  html = html.slice(0, cierre) + boton + html.slice(cierre);
  const trasCierre = cierre + boton.length + '\n        </div>'.length;
  html = html.slice(0, trasCierre) + `
        <div *ngIf="mostrarPanelRestaurantes" id="cerca-restaurantes-subcategorias"
             class="cerca-restaurantes-subcategorias">
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
        </div>` + html.slice(trasCierre);

  css += `\n/* CERCA: menú desplegable de Restaurantes */
.cerca-restaurantes-subcategorias {
  display: flex; align-items: center; flex-wrap: wrap;
  gap: 14px; padding: 12px 0; margin-top: 10px;
}
.cerca-restaurantes-subcategorias .hero-category { min-width: 90px; }
`;
  const actualizado = {'app.component.ts': ts, 'app.component.html': html, 'app.component.css': css};
  for (const n of files) {
    const destino = path.join(base, n);
    if (!fs.existsSync(destino + '.bak-restaurantes')) {
      fs.writeFileSync(destino + '.bak-restaurantes', original[n], 'utf8');
    }
    fs.writeFileSync(destino, actualizado[n], 'utf8');
  }
  console.log('LISTO: agregado Restaurantes 🍽️ > Pizzerías 🍕 y Pollo asado 🍗.');
  console.log('Copias de seguridad: *.bak-restaurantes');
} catch (error) {
  console.error('No se modificó el proyecto:', error.message);
  process.exitCode = 1;
}

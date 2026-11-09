/* CERCA.cl: hace visible el menú Restaurantes en la zona de resultados.
   Conserva las otras categorías, el buscador, el backend y los registros.
   Uso desde Cerca_Fase1.5: node .\CERCA_REPARAR_MENU_RESTAURANTES.cjs
*/
const fs = require('node:fs');
const path = require('node:path');
const raiz = process.cwd();
const dir = path.join(raiz, 'frontend', 'src', 'app');
const rutas = Object.fromEntries(['app.component.ts','app.component.html','app.component.css'].map(n=>[n,path.join(dir,n)]));
function fallar(m){ throw Error(m); }
try {
  const prev = Object.fromEntries(Object.entries(rutas).map(([n,p])=>[n,fs.readFileSync(p,'utf8')]));
  let ts=prev['app.component.ts'], html=prev['app.component.html'], css=prev['app.component.css'];
  if (!ts.includes('mostrarPanelRestaurantes') || !html.includes('cerca-restaurantes-subcategorias')) {
    fallar('Primero hay que instalar Restaurantes. No se encontró el menú anterior.');
  }
  if (html.includes('cerca-restaurantes-panel-resultado')) {
    console.log('Menú visible en resultados ya instalado. No hay cambios.'); process.exit(0);
  }
  // Ubicar botón principal existente y llevarlo delante de las otras categorías.
  const reBoton = /\s*<!-- Nueva categoría principal: Restaurantes -->\s*<button\b[\s\S]*?aria-controls="cerca-restaurantes-subcategorias"[\s\S]*?<\/button>/;
  const mBoton=html.match(reBoton);
  if (!mBoton) fallar('No localizo el botón Restaurantes generado por el instalador anterior.');
  const boton=mBoton[0].trim();
  html=html.replace(reBoton,'');
  const reCategorias=/<div\b[^>]*class="[^"]*hero-categories[^\"]*"[^>]*>/;
  const mCategoria=html.match(reCategorias);
  if (!mCategoria) fallar('No localizo hero-categories.');
  const posCategoria=mCategoria.index+mCategoria[0].length;
  html=html.slice(0,posCategoria)+'\n          '+boton+'\n'+html.slice(posCategoria);

  // Submenú original: se encontraba fuera de la fila de botones y podía quedar oculto
  // por el tamaño del hero. Reubicar en la sección de resultados, que siempre es visible.
  const rePanel=/<div\s+\*ngIf="mostrarPanelRestaurantes"\s+id="cerca-restaurantes-subcategorias"[\s\S]*?<\/div>/;
  const mPanel=html.match(rePanel);
  if(!mPanel) fallar('No localizo el bloque del submenú.');
  let panel=mPanel[0];
  html=html.replace(rePanel,'');
  panel=panel.replace('class="cerca-restaurantes-subcategorias"','class="cerca-restaurantes-subcategorias cerca-restaurantes-panel-resultado"');
  panel=panel.replace('aria-label="Tipos de restaurante">', 'aria-label="Tipos de restaurante">\n          <p class="cerca-restaurantes-label">🍽️ Restaurantes: elige una especialidad</p>');
  const reResultados=/<section\b[^>]*class="[^"]*results-section[^\"]*"[^>]*id="explorar"[^>]*>\s*<div class="layout">/;
  const mResultados=html.match(reResultados);
  if(!mResultados) fallar('No encuentro el inicio de resultados.');
  const posResultados=mResultados.index+mResultados[0].length;
  html=html.slice(0,posResultados)+'\n        '+panel+'\n'+html.slice(posResultados);

  const reAbrir=/abrirPanelRestaurantes\s*\(\)\s*:\s*void\s*\{/;
  const mAbrir=reAbrir.exec(ts);
  if(!mAbrir) fallar('No encuentro abrirPanelRestaurantes().');
  const inicio=mAbrir.index+mAbrir[0].length;
  let nivel=1, fin=inicio;
  for(;fin<ts.length;fin++) {
    if(ts[fin]==='{')nivel++;
    else if(ts[fin]==='}') {nivel--;if(nivel===0)break;}
  }
  if(fin>=ts.length)fallar('Método abrirPanelRestaurantes incompleto.');
  const bloque=ts.slice(inicio,fin);
  if (!bloque.includes('this.mostrarPanelRestaurantes = !this.mostrarPanelRestaurantes')) {
    fallar('El método Restaurantes difiere del esperado. No se cambiará a ciegas.');
  }
  if(!bloque.includes("this.irA('explorar')")) {
    ts=ts.slice(0,fin)+"\n    if (this.mostrarPanelRestaurantes) this.irA('explorar');\n  "+ts.slice(fin);
  }
  css+=`\n/* CERCA: Especialidades visibles debajo del hero. */
.cerca-restaurantes-panel-resultado {
  display: flex !important;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  border: 1px solid #f4d9c9;
  border-radius: 16px;
  background: #fff9f5;
  padding: 16px;
  margin: 0 0 24px;
}
.cerca-restaurantes-panel-resultado .cerca-restaurantes-label {
  flex-basis: 100%;
  font-weight: 750;
  color: #202832;
  margin: 0;
}
.cerca-restaurantes-panel-resultado .hero-category,
.cerca-restaurantes-panel-resultado .category-label { color: #202832 !important; }
.cerca-restaurantes-panel-resultado .category-circle {
  background: #fff;
  color: #202832;
  border: 1px solid #eed9cc;
}
.cerca-restaurantes-panel-resultado .hero-category { min-width: 100px; }
`;
  const ahora={'app.component.ts':ts,'app.component.html':html,'app.component.css':css};
  const stamp=new Date().toISOString().replace(/[:.]/g,'-');
  for(const [n,p] of Object.entries(rutas))fs.copyFileSync(p,p+'.bak-menu-restaurantes-'+stamp);
  for(const [n,p] of Object.entries(rutas))fs.writeFileSync(p,ahora[n],'utf8');
  console.log('OK: menú Restaurantes reubicado en resultados. Al hacer clic se abre y se desplaza.');
  console.log('Respaldos: *.bak-menu-restaurantes-'+stamp);
  console.log('No se modificó backend ni PostgreSQL.');
} catch(e){ console.error('SIN CAMBIOS: '+e.message);process.exitCode=1; }

/*
 CERCA.cl - Restaurantes COMO Oficios y Profesiones
 Ejecutar desde C:\Users\usuario\Downloads\Cerca_Fase1.5
   node .\CERCA_RESTAURANTES_COMO_OFICIOS_V3.cjs

 Modifica SOLO frontend/src/app/app.component.{ts,html,css}.
 Conserva PostgreSQL, 25 borradores, fotos, backend y otros menús.
 Antes de escribir, comprueba todos los anclajes y crea respaldos.
*/
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const dir = path.join(root, 'frontend', 'src', 'app');
const names = ['app.component.ts', 'app.component.html', 'app.component.css'];
const paths = Object.fromEntries(names.map(name => [name, path.join(dir, name)]));
const fail = m => { throw new Error(m); };

function balancedDivEnd(html, start) {
  const re = /<\/?div\b[^>]*>/gi;
  re.lastIndex = start;
  let depth = 0, m;
  while ((m = re.exec(html))) {
    depth += /^<div\b/i.test(m[0]) ? 1 : -1;
    if (depth === 0) return re.lastIndex;
  }
  fail('No pude encontrar el cierre del contenedor HTML.');
}
function findDiv(html, match) {
  const re = /<div\b[^>]*>/gi; let m;
  while ((m = re.exec(html))) if (match(m[0])) return m;
  return null;
}
function findMethod(src, name) {
  const rx = new RegExp('\\b' + name + '\\s*\\([^)]*\\)\\s*(?::\\s*(?:void|boolean))?\\s*\\{');
  const m = rx.exec(src);
  if (!m) fail('No se encuentra el método '+name+' en app.component.ts.');
  const start = m.index+m[0].length-1;
  let depth=0, quote=null, escape=false;
  for (let k=start; k<src.length; k++) {
    const c=src[k];
    if (quote) {
      if (escape) escape=false;
      else if (c==='\\') escape=true;
      else if (c===quote) quote=null;
      continue;
    }
    if (c==='"'||c==="'"||c==='`') {quote=c;continue;}
    if (c==='{') depth++;
    else if (c==='}') {
      depth--;
      if (depth===0) return {start,end:k,body:src.slice(start+1,k)};
    }
  }
  fail('Método sin cierre: '+name);
}
function appendCommunes(ts) {
  const re = /(readonly\s+comunas\s*(?::\s*string\[\])?\s*=\s*\[)([^\]]*)(\]\s*;)/m;
  const m = re.exec(ts);
  if (!m) return {ts,found:false};
  const add = ['Las Condes', 'Vitacura', 'Maipú', 'San Miguel'];
  const missing = add.filter(c => !new RegExp('[\x27\"]'+c+'[\x27\"]').test(m[2]));
  if (!missing.length) return {ts,found:true};
  let inside = m[2].trimEnd();
  if (inside.trim() && !inside.trimEnd().endsWith(',')) inside += ',';
  inside += '\n    ' + missing.map(c=>JSON.stringify(c)).join(',\n    ');
  return {ts:ts.slice(0,m.index)+m[1]+inside+'\n  '+m[3]+ts.slice(m.index+m[0].length),found:true,missing};
}
try {
  for (const name of names) if (!fs.existsSync(paths[name])) fail('No se encuentra '+paths[name]+'; ejecuta desde la raíz Cerca_Fase1.5.');
  const prev = Object.fromEntries(names.map(n=>[n,fs.readFileSync(paths[n],'utf8')]));
  let ts=prev['app.component.ts'], html=prev['app.component.html'], css=prev['app.component.css'];
  if (html.includes('CERCA_RESTAURANTES_V3_DESPLEGABLE')) {
    console.log('Restaurantes ya funciona como Oficios (V3). No se modificó nada.');
    process.exit(0);
  }
  if (!ts.includes('mostrarPanelRestaurantes') || !html.includes('abrirPanelRestaurantes()')) {
    fail('No está el menú Restaurantes anterior. No se modificó nada.');
  }

  // 1) Sacar el panel blanco de la sección Explorar, independientemente del orden de atributos.
  const menuOld = findDiv(html, tag=>/\bid\s*=\s*["']cerca-restaurantes-subcategorias["']/.test(tag));
  if (!menuOld) fail('No encuentro el submenú Restaurantes instalado.');
  const endOld = balancedDivEnd(html,menuOld.index);
  html = html.slice(0,menuOld.index)+html.slice(endOld);
  html = html.replace('<!-- CERCA: especialidades visibles dentro de los resultados -->','');

  // 2) Hallar los botones circulares existentes, aunque hayan cambiado el orden de sus atributos.
  const menuMain = findDiv(html,tag=>/class\s*=\s*["'][^"']*\bhero-categories\b/.test(tag));
  if (!menuMain) fail('No encuentro los círculos hero-categories; no se modificó nada.');
  if (!/abrirPanelRestaurantes\(\)/.test(html.slice(menuMain.index,balancedDivEnd(html,menuMain.index)))) {
    fail('El botón principal Restaurantes no está en hero-categories.');
  }

  // 3) Ocultar las categorías cuando se abre Restaurantes, sin tocar la vista Oficios.
  const rawTag=menuMain[0];
  const extra=' [class.cerca-restaurantes-ocultar]="mostrarPanelRestaurantes"';
  const newTag=rawTag.replace(/>$/, extra+'>');
  html=html.slice(0,menuMain.index)+newTag+html.slice(menuMain.index+rawTag.length);
  const updatedMenu=findDiv(html,tag=>/class\s*=\s*["'][^"']*\bhero-categories\b/.test(tag));
  const endMenu=balancedDivEnd(html,updatedMenu.index);

  // 4) Submenú DENTRO de la portada oscura, como Oficios: botón volver, título y círculos.
  const submenu = `
        <!-- CERCA_RESTAURANTES_V3_DESPLEGABLE: equivalente a Oficios y Profesiones -->
        <div *ngIf="mostrarPanelRestaurantes" id="cerca-restaurantes-subcategorias"
             class="cerca-restaurantes-como-oficios" aria-label="Especialidades de restaurantes">
          <div class="cerca-restaurantes-cabecera">
            <button type="button" class="cerca-restaurantes-volver"
                    (click)="cerrarPanelRestaurantes()">← Volver a categorías</button>
            <strong>Restaurantes</strong>
          </div>
          <div class="cerca-restaurantes-circulos">
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
          </div>
        </div>
`;
  html=html.slice(0,endMenu)+submenu+html.slice(endMenu);

  // 5) Al pulsar el botón principal NO desplazar la vista a resultados.
  const abrir=findMethod(ts,'abrirPanelRestaurantes');
  if (!abrir.body.includes('this.mostrarPanelRestaurantes')) fail('No se reconoce abrirPanelRestaurantes, sin cambios.');
  let newBody=abrir.body.replace(/\s*if\s*\(\s*this\.mostrarPanelRestaurantes\s*\)\s*this\.irA\(\s*["']explorar["']\s*\)\s*;/g,'');
  if (newBody.includes("this.irA('explorar')") || newBody.includes('this.irA("explorar")')) {
    fail('abrirPanelRestaurantes contiene otro desplazamiento no identificado.');
  }
  ts=ts.slice(0,abrir.start+1)+newBody+ts.slice(abrir.end);

  // 6) Añadir botón volver sin interferir con otros menús.
  if (!/\bcerrarPanelRestaurantes\s*\(/.test(ts)) {
    const where=findMethod(ts,'abrirPanelRestaurantes').end+1;
    ts=ts.slice(0,where)+`

  cerrarPanelRestaurantes(): void {
    this.mostrarPanelRestaurantes = false;
    this.tipoRestauranteActivo = null;
    this.categoriaActiva = 'Todos';
    this.categoriasIntencion = null;
    this.busqueda = '';
  }
`+ts.slice(where);
  }

  // 7) Dar prioridad a la subcategoría de la ficha PostgreSQL.
  const matcher=findMethod(ts,'coincideRestaurante');
  const body=matcher.body;
  if (!body.includes('this.tipoRestauranteActivo')) fail('El filtro restaurante no tiene la estructura esperada.');
  const exactSub=`
    // Priorizar la subcategoría real registrada en PostgreSQL (datos JSONB).
    const subcategoria = String((n as Negocio & { subcategoria?: string }).subcategoria || '')
      .normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase();
    if (subcategoria === 'pizzerias') return this.tipoRestauranteActivo === 'Pizzerías';
    if (subcategoria === 'pollo asado') return this.tipoRestauranteActivo === 'Pollo asado';
`;
  if (!body.includes('subcategoria = String(')) {
    // Inserta antes de la lectura de texto libre, manteniendo los filtros ya existentes.
    const at=body.indexOf('const texto');
    if (at<0) fail('No encontré el texto a filtrar en coincideRestaurante; sin cambios.');
    const adjusted=body.slice(0,at)+exactSub+'    '+body.slice(at);
    ts=ts.slice(0,matcher.start+1)+adjusted+ts.slice(matcher.end);
  }

  // 8) Nuevas comunas de los locales ya empadronados (11 en total).
  const com=appendCommunes(ts);
  ts=com.ts;

  // 9) Apariencia oscura, igual que el menú Oficios; no hay recuadro blanco.
  css+=`
/* CERCA_RESTAURANTES_V3_DESPLEGABLE — menú dentro de la portada como Oficios. */
.hero-categories.cerca-restaurantes-ocultar { display: none !important; }
.cerca-restaurantes-como-oficios { width: 100%; margin-top: 23px; color: #fff; }
.cerca-restaurantes-cabecera { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 22px; }
.cerca-restaurantes-cabecera strong { color: #fff; font-size: 14px; font-weight: 800; }
.cerca-restaurantes-volver { background: transparent; border: 1px solid rgba(255,255,255,.65); color: #fff;
  border-radius: 28px; padding: 11px 17px; font-weight: 800; font-size: 12px; cursor: pointer; }
.cerca-restaurantes-volver:hover { background: rgba(255,255,255,.12); }
.cerca-restaurantes-circulos { display: flex; align-items: flex-start; flex-wrap: wrap; gap: 18px; }
.cerca-restaurantes-circulos .hero-category { flex: 0 0 92px; width: 92px; color: #fff; min-width: 0; }
.cerca-restaurantes-circulos .category-circle { width: 55px; height: 55px; background: rgba(43,45,47,.93);
  border: 1px solid #686a6b; color: #fff; }
.cerca-restaurantes-circulos .category-label { color: #fff; white-space: normal; text-align: center; }
.cerca-restaurantes-circulos .hero-category.selected .category-circle,
.cerca-restaurantes-circulos .hero-category:hover .category-circle { background: #ff6525; border-color: #ff6525; }
@media(max-width:720px) { .cerca-restaurantes-cabecera { gap: 10px; } .cerca-restaurantes-circulos { gap: 12px; } }
`;

  // Validar antes de escribir: una sola instancia del submenú, en la portada y no en Explorar.
  if ((html.match(/id="cerca-restaurantes-subcategorias"/g)||[]).length!==1) fail('Submenú duplicado, sin cambios.');
  const posPanel=html.indexOf('id="cerca-restaurantes-subcategorias"');
  const posHeroEnd=html.indexOf('</section>',html.indexOf('class="hero"'));
  if (!(posPanel>0 && posPanel<posHeroEnd)) fail('El submenú no quedó dentro de la portada.');
  if (!ts.includes('cerrarPanelRestaurantes(): void') || !css.includes('CERCA_RESTAURANTES_V3_DESPLEGABLE')) fail('Verificación de consistencia incompleta.');

  const next={'app.component.ts':ts,'app.component.html':html,'app.component.css':css};
  const stamp=new Date().toISOString().replace(/[:.]/g,'-');
  const suffix='.bak-restaurantes-v3-'+stamp;
  for (const n of names) fs.copyFileSync(paths[n],paths[n]+suffix);
  try { for (const n of names) fs.writeFileSync(paths[n],next[n],'utf8'); }
  catch(e) { for (const n of names) fs.copyFileSync(paths[n]+suffix,paths[n]); throw e; }
  console.log('LISTO: Restaurantes abre dentro de la portada, igual que Oficios.');
  console.log('Pizzerías y Pollo asado tienen círculos; Volver a categorías funciona.');
  if (com.missing?.length) console.log('Comunas agregadas al selector:', com.missing.join(', '));
  console.log('Respaldos creados:',suffix);
  console.log('NO se modificaron los registros de PostgreSQL, backend ni las fotografías.');
  console.log('Los 25 locales siguen empadronados como borradores hasta publicarse.');
} catch(e) { console.error('SIN CAMBIOS: '+e.message); process.exitCode=1; }

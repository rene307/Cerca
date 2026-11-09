/* CERCA.cl - REPARACION V2 del despliegue Restaurantes.
   Ejecutar desde Cerca_Fase1.5 con Node.js:
       node .\CERCA_REPARAR_MENU_RESTAURANTES_V2.cjs
   Mantiene intactos backend, PostgreSQL, fichas y demás categorías.
*/
const fs = require('node:fs');
const path = require('node:path');
const folder = path.join(process.cwd(), 'frontend', 'src', 'app');
const names = ['app.component.ts', 'app.component.html', 'app.component.css'];
const file = n => path.join(folder, n);
const fail = message => { throw new Error(message); };

function matchOpeningDiv(src, id) {
  const tags = /<div\b[^>]*>/gi;
  let m;
  while ((m = tags.exec(src))) {
    const attrs = m[0];
    if (attrs.includes('id="'+id+'"') || attrs.includes("id='"+id+"'")) return m;
  }
  return null;
}
function balancedDivEnd(src, startAt) {
  // startAt es el comienzo de <div...>.
  const tags = /<\/?div\b[^>]*>/gi;
  tags.lastIndex = startAt;
  let depth = 0, token;
  while ((token = tags.exec(src))) {
    if (/^<div\b/i.test(token[0])) depth++;
    else depth--;
    if (depth === 0) return tags.lastIndex;
  }
  fail('No se pudo ubicar el cierre del submenú Restaurantes.');
}
function findMethod(src, name) {
  const m = new RegExp('\\b' + name + '\\s*\\([^)]*\\)\\s*(?::\\s*void)?\\s*\\{').exec(src);
  if (!m) fail('No existe el método ' + name + ' en app.component.ts');
  const open = m.index + m[0].length - 1;
  let depth=0, inString=null, esc=false;
  for (let i=open; i<src.length; i++) {
    const c=src[i];
    if (inString) {
      if (esc) esc=false;
      else if (c==='\\') esc=true;
      else if (c===inString) inString=null;
      continue;
    }
    if (c==='\'' || c==='"' || c==='`') {inString=c;continue;}
    if (c==='{') depth++;
    if (c==='}' && --depth===0) return {open, end:i, body:src.slice(open+1,i)};
  }
  fail('Método incompleto: '+name);
}
try {
  if (!names.every(n=>fs.existsSync(file(n)))) fail('No encuentro los archivos en frontend/src/app. Ejecuta desde Cerca_Fase1.5.');
  const initial = Object.fromEntries(names.map(n=>[n,fs.readFileSync(file(n),'utf8')]));
  let ts=initial['app.component.ts'], html=initial['app.component.html'], css=initial['app.component.css'];
  if (!ts.includes('mostrarPanelRestaurantes')) fail('No está instalado el botón Restaurantes; no se modificó nada.');
  if (html.includes('cerca-restaurantes-panel-resultado')) {
    console.log('El menú en resultados YA está instalado. No se hicieron cambios.'); process.exit(0);
  }
  const panelStart=matchOpeningDiv(html,'cerca-restaurantes-subcategorias');
  if (!panelStart) fail('No localizo el submenú original. No se modificó nada.');
  const panelEnd=balancedDivEnd(html,panelStart.index);
  let panel=html.slice(panelStart.index,panelEnd);
  html=html.slice(0,panelStart.index)+html.slice(panelEnd);
  panel=panel.replace(/\bclass="([^"]*)"/, (_s,cls)=>`class="${cls} cerca-restaurantes-panel-resultado"`);
  if (!panel.includes('cerca-restaurantes-panel-resultado')) {
    panel=panel.replace('<div','<div class="cerca-restaurantes-panel-resultado"');
  }
  if (!panel.includes('cerca-restaurantes-label')) {
    const endTag=panel.indexOf('>');
    panel=panel.slice(0,endTag+1)+'\n        <p class="cerca-restaurantes-label">🍽️ Restaurantes: elige una especialidad</p>'+panel.slice(endTag+1);
  }
  // Buscar primero sección con id="explorar" en cualquier orden de atributos.
  let anchor;
  const sections=/<section\b[^>]*>/gi;
  let match;
  while ((match=sections.exec(html))) {
    if (/\bid\s*=\s*["']explorar["']/.test(match[0])) {anchor=match;break;}
  }
  if (!anchor) fail('No se encontró una sección <section id="explorar">, no se modificó nada.');
  // El submenú vive DENTRO de resultados, en contenedor propio, sin depender del div.layout.
  const pos=anchor.index+anchor[0].length;
  const insert='\n    <!-- CERCA: especialidades visibles dentro de los resultados -->\n    '+panel+'\n';
  html=html.slice(0,pos)+insert+html.slice(pos);
  const abrir=findMethod(ts,'abrirPanelRestaurantes');
  if (!abrir.body.includes("this.irA('explorar')")) {
    if (!abrir.body.includes('this.mostrarPanelRestaurantes')) fail('El método Restaurantes cambió; no lo modificaré sin revisarlo.');
    ts=ts.slice(0,abrir.end)+"\n    if (this.mostrarPanelRestaurantes) this.irA('explorar');\n  "+ts.slice(abrir.end);
  }
  css += `\n/* CERCA: menú Restaurantes visible dentro de la sección explorar. */
.cerca-restaurantes-panel-resultado {
  box-sizing: border-box;
  display: flex !important;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 14px;
  width: calc(100% - 32px);
  max-width: 1180px;
  margin: 20px auto 24px;
  padding: 16px 20px;
  border: 1px solid #f4d9c9;
  border-radius: 16px;
  background: #fff9f5;
  color: #202832;
}
.cerca-restaurantes-panel-resultado .cerca-restaurantes-label {
  width: 100%; flex-basis: 100%; margin: 0;
  font-weight: 750; font-size: 15px; color: #202832;
}
.cerca-restaurantes-panel-resultado .hero-category,
.cerca-restaurantes-panel-resultado .category-label { color: #202832 !important; }
.cerca-restaurantes-panel-resultado .category-circle {
  background: #fff; color: #202832; border: 1px solid #eed9cc;
}
.cerca-restaurantes-panel-resultado .hero-category { min-width: 100px; }
`;
  if (!html.includes("filtrarRestaurante('Pizzerías')") || !html.includes("filtrarRestaurante('Pollo asado')")) fail('Faltan botones Pizzerías o Pollo asado; no se modificó nada.');
  if (!html.includes('cerca-restaurantes-panel-resultado')) fail('No se completó la reparación; no se modificó nada.');
  const next={'app.component.ts':ts, 'app.component.html':html, 'app.component.css':css};
  const suffix='.bak-restaurantes-v2-'+new Date().toISOString().replace(/[:.]/g,'-');
  for (const name of names) fs.writeFileSync(file(name)+suffix,initial[name]);
  for (const name of names) fs.writeFileSync(file(name),next[name]);
  console.log('LISTO: Reparado el menú Restaurantes. Se abre en la zona Explorar.');
  console.log('Respaldos creados: '+suffix);
  console.log('No se modificó PostgreSQL, backend ni las 25 fichas empadronadas.');
} catch (error) {console.error('SIN CAMBIOS: '+error.message); process.exitCode=1;}

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const raiz = path.resolve(process.argv[2] || process.cwd());
const chequeo = process.argv.includes('--comprobar');
const seco = process.argv.includes('--simular');
// Resolver archivo por URL, para funcionar en Windows con espacios/tildes.
const fuente = new URL('./amasanderias_nunoa_2026.json', import.meta.url);
const lista = JSON.parse(fs.readFileSync(fuente, 'utf8'));

function slug(texto='') {
  return String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}
function revisarDatos() {
  if (!Array.isArray(lista) || lista.length !== 20) throw new Error('Se requieren las 20 fichas.');
  const nombres = new Set();
  for (const n of lista) {
    if (!n.nombre || !n.direccion || n.comuna !== 'Ñuñoa' ||
      !['Panaderías','Tiendas'].includes(n.categoria) || n.publicado !== true ||
      n.datosVerificados !== false || !n.descripcion || !n.resenaBreve ||
      n.resenaBreve.length > 68 || n.slugSeo !== slug(n.nombre)) {
      throw new Error('Ficha incorrecta: ' + n.nombre);
    }
    if (nombres.has(slug(n.nombre))) throw new Error('Nombre repetido: ' + n.nombre);
    nombres.add(slug(n.nombre));
  }
  console.log('20 fichas comprobadas; 19 panaderías/empanaderías y 1 minimarket.');
  console.log('SEO: /nunoa/panaderias/nombre-del-negocio; Masaluna: /nunoa/tiendas/masaluna');
}
function checkProy() {
  if (!fs.existsSync(path.join(raiz,'backend','src','db.js')) ||
      !fs.existsSync(path.join(raiz,'frontend','src','app','app.component.html'))) {
    throw new Error('La ruta no corresponde a Cerca_Fase1.5: '+raiz);
  }
}
function mostrarAyuda() {
  console.log('Proyecto:', raiz);
  console.log('Instala: solo INSERT de faltantes en la tabla negocios.');
  console.log('No modifica negocios existentes, calificaciones ni rutas SEO.');
}
function actualizarSoloPlantillaNuevos() {
  const ts = path.join(raiz,'frontend','src','app','app.component.ts');
  const html = path.join(raiz,'frontend','src','app','app.component.html');
  if (!fs.existsSync(ts) || !fs.existsSync(html)) return {estado:'no encontrado'};
  const originalTs=fs.readFileSync(ts,'utf8');
  const originalHtml=fs.readFileSync(html,'utf8');
  let nuevoTs=originalTs, nuevoHtml=originalHtml;
  if (!nuevoTs.includes('resenaBreve?: string;')) {
    const busqueda='interface Negocio {\n  id: number;';
    if (!nuevoTs.includes(busqueda)) return {estado:'versión Angular diferente; no modificada'};
    nuevoTs=nuevoTs.replace(busqueda, 'interface Negocio {\n  resenaBreve?: string;\n  id: number;');
  }
  if (!nuevoHtml.includes('negocio.resenaBreve')) {
    const ancla='<p *ngIf="!negocio.direccion">{{ negocio.descripcion }}</p>';
    if (!nuevoHtml.includes(ancla)) return {estado:'plantilla diferente; no modificada'};
    const adicional='<p *ngIf="negocio.direccion && negocio.resenaBreve" class="card-address" style="display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden">{{ negocio.resenaBreve }}</p>';
    nuevoHtml=nuevoHtml.replace(ancla,ancla+'\n                '+adicional);
  }
  // Respaldar antes de añadir exclusivamente el campo resenaBreve para las fichas nuevas.
  const cambiados=[];
  for (const [file,original,nuevo] of [[ts,originalTs,nuevoTs],[html,originalHtml,nuevoHtml]]) {
    if (original!==nuevo) {
      fs.copyFileSync(file,file+'.bak-amasanderias-nunoa-2026');
      fs.writeFileSync(file,nuevo,'utf8'); cambiados.push(path.basename(file));
    }
  }
  return {estado:cambiados.length ? 'añadida línea de reseña breve únicamente a nuevos negocios' : 'reseñas ya preparadas',archivos:cambiados};
}

let db;
let cliente;
let abrio=false;
try {
  revisarDatos();
  checkProy();
  mostrarAyuda();
  if (chequeo) { console.log('COMPROBACIÓN correcta. No se modificó nada.'); process.exit(0); }
  if (seco) { console.log('SIMULACIÓN: no se modificó nada.'); process.exit(0); }
  process.chdir(path.join(raiz,'backend'));
  ({db}=await import(pathToFileURL(path.join(raiz,'backend','src','db.js')).href));
  const nombreDb=(await db.query('SELECT current_database() AS nombre')).rows[0]?.nombre;
  if (nombreDb!=='cerca') throw new Error('Conectado a '+nombreDb+'. Se requiere la base cerca. No se insertó nada.');
  cliente=await db.connect();
  await cliente.query('BEGIN'); abrio=true;
  await cliente.query('LOCK TABLE negocios IN SHARE ROW EXCLUSIVE MODE');
  const actuales=(await cliente.query("SELECT id,datos FROM negocios WHERE lower(datos->>'comuna') IN ('ñuñoa','nunoa')")).rows;
  const existentes=new Set(actuales.map(x=>slug(x.datos.nombre||'')));
  let agregadas=0,omitidas=0;
  for (const n of lista) {
    if (existentes.has(slug(n.nombre))) {omitidas++; continue;}
    await cliente.query('INSERT INTO negocios (datos) VALUES ($1::jsonb)',[JSON.stringify(n)]);
    existentes.add(slug(n.nombre));agregadas++;
  }
  const conteos=(await cliente.query(`SELECT datos->>'categoria' AS categoria,count(*)::int AS total
    FROM negocios WHERE datos->>'comuna'='Ñuñoa' AND datos->>'categoria' IN ('Panaderías','Tiendas')
    AND COALESCE(datos->>'publicado','true') <> 'false'
    GROUP BY datos->>'categoria'`)).rows;
  await cliente.query('COMMIT'); abrio=false;
  console.log('\nIMPORTACIÓN REALIZADA EN POSTGRESQL:',nombreDb);
  console.log('Nuevos:',agregadas,'| Ya existentes (no modificados):',omitidas);
  for (const c of conteos) console.log(c.categoria+':',c.total,'publicados en Ñuñoa');
  const resultado=actualizarSoloPlantillaNuevos();
  console.log('Reseñas en tarjetas:',resultado.estado);
  console.log('Sin cambios a fichas anteriores. Sin calificaciones CERCA inventadas.');
  try {
    const respuesta=await fetch('http://localhost:8080/api/negocios',{signal:AbortSignal.timeout(4000)});
    if (!respuesta.ok) throw new Error('HTTP '+respuesta.status);
    const datos=await respuesta.json();
    if (!Array.isArray(datos)) throw new Error('La API no devolvió un arreglo');
    const importados=datos.filter(x=>x.comuna==='Ñuñoa' && x.loteImportacion==='amasanderias-nunoa-2026-10').length;
    console.log('API: fichas de este lote visibles:',importados,'/ 20');
    if (importados!==20) console.log('AVISO: reinicia la API y confirma que esté conectada a esta misma base cerca.');
  } catch(e) {console.log('AVISO: la API en puerto 8080 no respondió ('+e.message+'). Inicia CERCA y recarga.');}
} catch (e) {
  if (abrio && cliente) await cliente.query('ROLLBACK').catch(()=>{});
  console.error('\nERROR. Revisa esta línea:',e.message);
  process.exitCode=1;
} finally {cliente?.release();if(db)await db.end().catch(()=>{});}

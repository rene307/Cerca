/*
 CERCA.cl | Reparación PUNTUAL de tarjetas de 25 pizzerías existentes.
 Diseñado para C:\Users\usuario\Downloads\Cerca_Fase1.5.

 Vista previa:  node .\CERCA_ARREGLAR_TARJETAS_PIZZERIAS.cjs
 Aplicar:       node .\CERCA_ARREGLAR_TARJETAS_PIZZERIAS.cjs --aplicar

 NO crea tarjetas, NO altera el molde HTML/CSS, NO empadrona negocios,
 NO inventa imágenes, calificaciones, horarios ni datos verificados.
 Cuando corresponde, enlaza el filtro de restaurantes existente.
 Publica SOLO registros originales con IDs 87...111 que sean Pizzerías.
 El modo --aplicar es explícito; antes comprueba y respalda los 25 JSON.
*/
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const {pathToFileURL} = require('node:url');

const root = process.cwd();
const args = process.argv.slice(2);
if (args.length > 1 || args.some(a => a !== '--aplicar')) {
  console.error('Uso: node .\\CERCA_ARREGLAR_TARJETAS_PIZZERIAS.cjs [--aplicar]');
  process.exit(1);
}
const aplicar = args.includes('--aplicar');
const appdir = path.join(root, 'frontend', 'src', 'app');
const tsFile = path.join(appdir, 'app.component.ts');
const htmlFile = path.join(appdir, 'app.component.html');
const cssFile = path.join(appdir, 'app.component.css');
const backend = path.join(root, 'backend');
const backendPackage = path.join(backend, 'package.json');
const dbFile = path.join(backend, 'src', 'db.js');
const ids = Array.from({length:25}, (_, i) => String(i + 87));
const fail = m => { throw Error(m); };
const isDraft = v => v === false || String(v).toLowerCase() === 'false';
function countMatches(s, rx){return (s.match(rx)||[]).length;}
function singlePos(text, regex, what){
  const ms=[...text.matchAll(new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags+'g'))];
  if(ms.length!==1)fail(`No pude reconocer una única sección ${what} (encontradas: ${ms.length}). No se hizo ningún cambio.`);
  return ms[0];
}
function closingBrace(text,start) {
  let depth=0,quote='',esc=false,line=false,block=false;
  for(let i=start;i<text.length;i++){
    const c=text[i], n=text[i+1];
    if(line){if(c==='\n')line=false;continue;}
    if(block){if(c==='*'&&n==='/'){block=false;i++;}continue;}
    if(quote){if(esc)esc=false;else if(c==='\\')esc=true;else if(c===quote)quote='';continue;}
    if(c==='/'&&n==='/'){line=true;i++;continue;}
    if(c==='/'&&n==='*'){block=true;i++;continue;}
    if(c==='\''||c==='"'||c==='`'){quote=c;continue;}
    if(c==='{')depth++;
    if(c==='}'&&--depth===0)return i;
  }
  fail('No pude reconocer el cierre de un método; no se modifica el frontend.');
}
function methodRange(ts,rx,what) {
  const m=singlePos(ts,rx,what);
  const at=ts.indexOf('{',m.index);
  return {start:m.index,open:at,close:closingBrace(ts,at),header:m[0]};
}
function planFrontend(ts,html) {
  // Reusar, NO rehacer: el mismo <article> que ya funciona con panaderías.
  if(!/class\s*=\s*["'][^"']*\bbusiness-card\b/.test(html) ||
     !/\*ngFor\s*=\s*["']let\s+negocio\s+of\s+negociosFiltrados\b/.test(html) ||
     !/\babrirDetalle\(negocio\)/.test(html)){
    fail('No se encontró el molde original (business-card / negociosFiltrados / Ver negocio). No crearé otro diseño.');
  }
  if(!/\bfiltrarRestaurante\s*\(/.test(ts) ||
     !/\bcoincideRestaurante\s*\(/.test(ts) ||
     !/\btipoRestauranteActivo\b/.test(ts) ||
     !/filtrarRestaurante\(['"]Pizzerías['"]\)/.test(html)){
    fail('No coincide el menú Restaurantes/Pizzerías instalado. Hay que revisar el app.component.ts ACTUAL antes de editarlo.');
  }
  let changes=[];
  const matcher=methodRange(ts,/\bcoincideRestaurante\s*\(\s*n\s*:\s*Negocio\s*\)\s*:\s*boolean\s*\{/m,'coincideRestaurante');
  const method=ts.slice(matcher.open+1,matcher.close);
  if(!/subcategoria\s*===\s*['"]pizzerias['"]/.test(method)){
    if(!method.includes('if (!this.tipoRestauranteActivo) return true;') || !/\bconst\s+texto\s*=/.test(method)){
      fail('El filtro coincideRestaurante es distinto al conocido. Se necesita el TS actual, no se hará un parche a ciegas.');
    }
    const insert=`\n    // CERCA_TARJETAS_PIZZERIAS_V1: campo real registrado en PostgreSQL.\n    const subcategoria = String((n as Negocio & { subcategoria?: string }).subcategoria || '')\n      .normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase();\n    if (subcategoria === 'pizzerias') return this.tipoRestauranteActivo === 'Pizzerías';\n    if (subcategoria === 'pollo asado') return this.tipoRestauranteActivo === 'Pollo asado';\n    `;
    const pos = matcher.open+1+method.search(/\bconst\s+texto\s*=/);
    ts=ts.slice(0,pos)+insert+ts.slice(pos);
    changes.push('Prioridad al campo subcategoria real para Pizzerías / Pollo asado');
  }
  const getter=methodRange(ts,/\bget\s+negociosFiltrados\s*\(\s*\)\s*(?::\s*Negocio\s*\[\s*\])?\s*\{/m,'negociosFiltrados');
  const body=ts.slice(getter.open+1,getter.close);
  if(!/this\.coincideRestaurante\s*\(/.test(body)){
    const cb=/\.filter\s*\(\s*(?:\(\s*([A-Za-z_$][\w$]*)\s*\)|([A-Za-z_$][\w$]*))\s*=>\s*\{/m.exec(body);
    if(!cb || cb.index>6500)fail('No pude identificar el filtro actual de negocios. No se cambia Angular.');
    const variable=cb[1]||cb[2];
    const pos=getter.open+1+cb.index+cb[0].length;
    ts=ts.slice(0,pos)+`\n      // CERCA_TARJETAS_PIZZERIAS_V1: sin alterar el resto de filtros.\n      if (!this.coincideRestaurante(${variable})) return false;`+ts.slice(pos);
    changes.push('Conectar coincideRestaurante al filtro original de tarjetas');
  }
  return {ts,changes};
}
async function main(){
  for(const f of [tsFile,htmlFile,cssFile,backendPackage,dbFile]){
    if(!fs.existsSync(f))fail('No se encuentra '+f+'; ejecuta desde la raíz de Cerca_Fase1.5.');
  }
  const oldTS=fs.readFileSync(tsFile,'utf8');
  const html=fs.readFileSync(htmlFile,'utf8');
  const patch=planFrontend(oldTS,html);
  console.log('CERCA.cl | Tarjetas: se conserva íntegro el molde existente (HTML y CSS).');
  console.log('Cambios de frontend necesarios:',patch.changes.length ? patch.changes.join(' | ') : 'NINGUNO; filtro ya conectado.');
  const load=createRequire(backendPackage);
  load('dotenv').config({path:path.join(backend,'.env')});
  const {db}=await import(pathToFileURL(dbFile).href);
  let client=null,transaction=false,backTS=null;
  try{
    client=await db.connect();
    const name=(await client.query('SELECT current_database() AS nombre')).rows[0].nombre;
    if(name!=='cerca') fail('Se conectó a la base '+name+' en lugar de cerca. Sin cambios.');
    await client.query('BEGIN');transaction=true;
    const {rows}=await client.query(`SELECT id::text AS id,datos FROM negocios WHERE id::text=ANY($1::text[]) ORDER BY id FOR UPDATE`,[ids]);
    if(rows.length!==25) fail('Se encontraron '+rows.length+'/25 registros del lote original. No se publica nada.');
    const unexpected=rows.filter(x=>x.datos?.categoria!=='Restaurantes'||x.datos?.subcategoria!=='Pizzerías');
    if(unexpected.length)fail('Hay IDs 87-111 con otra categoría/subcategoría. No se publica nada.');
    const drafts=rows.filter(x=>isDraft(x.datos?.publicado));
    const unverified=rows.filter(x=>x.datos?.datosVerificados!==true);
    const noPhoto=rows.filter(x=>!String(x.datos?.foto??'').trim());
    const byComuna={};
    for(const x of rows){
      const com=String(x.datos?.comuna||'Sin comuna');
      byComuna[com]??={comuna:com,total:0,borrador:0,publicadas:0};
      byComuna[com].total++;
      if(isDraft(x.datos?.publicado))byComuna[com].borrador++;else byComuna[com].publicadas++;
    }
    console.table(Object.values(byComuna));
    console.log('BASE:',name,'| Lote original:',rows.length,'| Borradores:',drafts.length,'| Ya publicadas:',rows.length-drafts.length);
    console.log('Sin datos verificados:',unverified.length,'| Sin fotografía:',noPhoto.length);
    console.log('Las fotos vacías NO se reemplazarán con fotos de otros negocios.');
    if(!aplicar){
      console.log('VISTA PREVIA: NO se modificó ni PostgreSQL ni el frontend.');
      console.log('Revisa antes los datos sin verificar; para aplicar usa:');
      console.log('  node .\\CERCA_ARREGLAR_TARJETAS_PIZZERIAS.cjs --aplicar');
      await client.query('ROLLBACK');transaction=false;return;
    }
    // Respaldo del lote ANTES de escribir, incluyendo los registros ya publicados.
    const folder=path.join(root,'respaldos_cerca');fs.mkdirSync(folder,{recursive:true});
    const stamp=new Date().toISOString().replace(/[:.]/g,'-');
    const backupDB=path.join(folder,'pizzerias25_tarjetas_antes_'+stamp+'.json');
    fs.writeFileSync(backupDB,JSON.stringify({base:name,fecha:new Date().toISOString(),negocios:rows},null,2),{flag:'wx'});
    console.log('Respaldo 25 registros:',backupDB);
    if(patch.changes.length){
      backTS=tsFile+'.bak-tarjetas-'+stamp;
      fs.copyFileSync(tsFile,backTS);
      fs.writeFileSync(tsFile,patch.ts,'utf8');
      console.log('TS respaldado y corregido:',backTS);
    }
    if(drafts.length){
      const out=await client.query(`UPDATE negocios SET datos=jsonb_set(datos::jsonb,'{publicado}','true'::jsonb,true), actualizado_en=NOW()
        WHERE id::text=ANY($1::text[]) AND datos->>'categoria'='Restaurantes'
        AND datos->>'subcategoria'='Pizzerías' AND datos->>'publicado'='false' RETURNING id`,[ids]);
      if(out.rowCount!==drafts.length) fail('Se actualizaron '+out.rowCount+'/'+drafts.length+' borradores. Se revierte.');
    }
    await client.query('COMMIT');transaction=false;
    console.log('OK: 25 fichas publicadas o previamente publicadas, sin duplicar ninguna.');
    console.log('No se alteraron nombres, direcciones, fotos, verificaciones ni el HTML/CSS.');
    console.log('Después: abre http://localhost:4200, elige Restaurantes > Pizzerías y Ctrl+F5.');
    console.log('Si no aparecen, verifica que frontend esté consumiendo /api/negocios del backend activo.');
  }catch(e){
    if(transaction&&client)try{await client.query('ROLLBACK');}catch{}
    if(backTS)try{fs.copyFileSync(backTS,tsFile);console.error('TS restaurado desde el respaldo por error en PostgreSQL.');}catch(err){console.error('Revisa el respaldo TS:',backTS,err.message);}
    throw e;
  }finally{
    if(client)client.release();
    if(typeof db.end==='function')await db.end();
  }
}
main().catch(e=>{console.error('SIN CAMBIOS / NO COMPLETADO:',e.message);process.exitCode=1;});

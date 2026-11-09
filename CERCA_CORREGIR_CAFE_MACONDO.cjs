/*
  CERCA.cl - Corrección selectiva de comuna: Café Macondo -> Puente Alto.
  Ejecutar desde raíz Cerca_Fase1.5:
    node .\CERCA_CORREGIR_CAFE_MACONDO.cjs           (solo vista previa)
    node .\CERCA_CORREGIR_CAFE_MACONDO.cjs --aplicar (corrige)
  Cambia únicamente el campo comuna de un registro exacto en PostgreSQL y
  de su copia inicial Angular/catálogo de respaldo si aparecen.
*/
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {createRequire}=require('node:module');
const {pathToFileURL}=require('node:url');
const root=process.cwd();
const backend=path.join(root,'backend');
const pkg=path.join(backend,'package.json');
const dbpath=path.join(backend,'src','db.js');
const aplicar=process.argv.includes('--aplicar');
const slug=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const esMacondo=x=>slug(x.nombre)==='cafe macondo' && slug(x.categoria)==='cafes';
const now=()=>new Date().toISOString().replace(/[:.]/g,'-');
const backupDir=path.join(root,'respaldos_cerca');
function guardarRespaldo(f,tag) {
  fs.mkdirSync(backupDir,{recursive:true});
  const dst=path.join(backupDir, path.basename(f)+'.antes-macondo-'+tag+'.bak');
  fs.copyFileSync(f,dst);
  return dst;
}
function informar(){console.log('\nCORRECCION CERCA.cl: CAFE MACONDO -> PUENTE ALTO'); console.log('Modo:',aplicar?'APLICAR CAMBIOS':'VISTA PREVIA - sin modificaciones');}
function parcheAngular(f, tag) {
  if(!fs.existsSync(f)){console.log('Angular: no encontre',f);return;}
  const src=fs.readFileSync(f,'utf8');
  const re=/(\bnombre\s*:\s*['"]Caf[eé] Macondo['"]\s*,\s*categoria\s*:\s*['"]Caf[eé]s['"]\s*,\s*comuna\s*:\s*['"])(La Florida|Puente Alto)(['"])/g;
  const matches=[...src.matchAll(re)];
  if(matches.length!==1){console.log('Angular:',matches.length===0?'No hay una entrada de prueba con ese formato.':'Hay varias entradas; no se tocara el archivo.');return;}
  if(matches[0][2]==='Puente Alto'){console.log('Angular: Macondo ya esta en Puente Alto.');return;}
  console.log('Angular: contiene una copia antigua, La Florida -> Puente Alto');
  if(aplicar){const dest=guardarRespaldo(f,tag);const next=src.replace(re,(_,a,b,c)=>a+'Puente Alto'+c);fs.writeFileSync(f,next,'utf8');console.log('  Actualizado:',f);console.log('  Respaldo:',dest);}
}
function parcheCatalogo(f,tag) {
  if(!fs.existsSync(f))return;
  const src=fs.readFileSync(f,'utf8');
  let data;try{data=JSON.parse(src);}catch{console.log('Catálogo no es JSON válido; se omite:',f);return;}
  if(!Array.isArray(data)){console.log('Catálogo no es arreglo; se omite:',f);return;}
  const matches=data.filter(esMacondo);
  if(matches.length===0)return;
  if(matches.length>1){console.log('Catálogo tiene más de una ficha de Café Macondo; no se modifica:',f);return;}
  console.log('Catálogo:',f,'comuna actual:',matches[0].comuna);
  if(matches[0].comuna==='Puente Alto')return;
  if(!aplicar)return;
  // Cambia el campo de un único objeto preservando el resto del JSON.
  // La serialización no modifica los datos, pero puede normalizar formato/indentación.
  const dest=guardarRespaldo(f,tag);
  matches[0].comuna='Puente Alto';
  fs.writeFileSync(f,JSON.stringify(data,null,2)+'\n','utf8');
  console.log('  Actualizado catálogo. Respaldo:',dest);
}
async function main(){
  informar();
  if(!fs.existsSync(pkg)||!fs.existsSync(dbpath))throw Error('Ejecuta desde Cerca_Fase1.5 (debe existir backend/src/db.js).');
  createRequire(pkg)('dotenv').config({path:path.join(backend,'.env')});
  const {db}=await import(pathToFileURL(dbpath).href);
  const tag=now();
  let conn;
  try{
    conn=await db.connect();
    const {rows:[r]}=await conn.query('SELECT current_database() AS nombre');
    if(r.nombre!=='cerca')throw Error('Base conectada incorrecta: '+r.nombre+'. Debe ser cerca.');
    const {rows}=await conn.query("SELECT id, datos FROM negocios WHERE lower(datos->>'nombre') LIKE '%macondo%' ORDER BY id");
    const found=rows.filter(x=>esMacondo(x.datos));
    console.log('Base PostgreSQL:',r.nombre,'| Coincidencias exactas Café Macondo:',found.length);
    for(const x of found){console.log('  ID',x.id,'| Nombre:',x.datos.nombre,'| Comuna:',x.datos.comuna,'| Dirección:',x.datos.direccion||'no informada');}
    if(found.length!==1){
      console.log('SIN CAMBIOS: Se esperaba exactamente 1 negocio Café Macondo en PostgreSQL.');
      console.log('Si hay 0 o más de 1, comparte esta salida para identificar el registro correcto.');
      return;
    }
    if(!aplicar){console.log('VISTA PREVIA: no se modificó nada.');console.log('Para aplicar: node .\\CERCA_CORREGIR_CAFE_MACONDO.cjs --aplicar');return;}
    const item=found[0];
    if(item.datos.comuna!=='Puente Alto'){
      fs.mkdirSync(backupDir,{recursive:true});
      const backup=path.join(backupDir,'cafe-macondo-id-'+item.id+'-antes-'+tag+'.json');
      fs.writeFileSync(backup,JSON.stringify(item,null,2)+'\n','utf8');
      console.log('Respaldo PostgreSQL:',backup);
      try{
        await conn.query('BEGIN');
        const updated=await conn.query("UPDATE negocios SET datos=jsonb_set(datos,'{comuna}',to_jsonb($1::text),true) WHERE id=$2 AND datos->>'nombre'=$3 RETURNING id, datos->>'nombre' AS nombre, datos->>'comuna' AS comuna",['Puente Alto',item.id,item.datos.nombre]);
        if(updated.rowCount!==1 || updated.rows[0].comuna!=='Puente Alto')throw Error('No se pudo verificar la actualización exacta');
        await conn.query('COMMIT');
        console.log('PostgreSQL ACTUALIZADO:',JSON.stringify(updated.rows[0]));
      }catch(e){await conn.query('ROLLBACK').catch(()=>{});throw e;}
    }else console.log('PostgreSQL ya dice Puente Alto; no se altera ese registro.');
    parcheAngular(path.join(root,'frontend','src','app','app.component.ts'),tag);
    for(const p of [path.join(root,'frontend','public','catalogo-respaldo.json'),path.join(root,'frontend','src','assets','catalogo-respaldo.json'),path.join(root,'frontend','src','catalogo-respaldo.json')])parcheCatalogo(p,tag);
    console.log('\nLISTO. Actualiza http://localhost:4200 con Ctrl+F5 y revisa Cafés > Puente Alto.');
    console.log('Si el frontend está corriendo con ng serve, Angular debe recargar los cambios.');
  }finally{if(conn)conn.release();await db.end();}
}
main().catch(e=>{console.error('ERROR:',e.message);process.exitCode=1;});

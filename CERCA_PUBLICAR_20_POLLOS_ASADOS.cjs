/*
  CERCA.cl — VISIBILIDAD DE LAS 20 FICHAS DE POLLO ASADO YA EMPADRONADAS
  Desde Cerca_Fase1.5:
    node .\CERCA_PUBLICAR_20_POLLOS_ASADOS.cjs           (SOLO LECTURA)
    node .\CERCA_PUBLICAR_20_POLLOS_ASADOS.cjs --publicar (CAMBIA SOLO publicado)

  No crea fichas, no modifica Angular, CSS, backend, fotos o datosVerificados.
  Precaución: en la importación original estas fichas estaban pendientes de
  verificación; --publicar es una decisión explícita del administrador.
*/
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {createRequire} = require('node:module');
const {pathToFileURL} = require('node:url');

const ESPERADOS = [{"id":112,"nombre":"El Sabrosón, pollo a las brasas","comuna":"La Florida"},{"id":113,"nombre":"Maxi pollo","comuna":"La Florida"},{"id":114,"nombre":"Pollos Asados","comuna":"La Florida"},{"id":115,"nombre":"Pollería Loret's Sucursal La Florida","comuna":"La Florida"},{"id":116,"nombre":"Chicken Factory","comuna":"La Florida"},{"id":117,"nombre":"Chicken Factory","comuna":"La Florida"},{"id":118,"nombre":"Pollos asados La Rueda","comuna":"La Florida"},{"id":119,"nombre":"El Gallo de las papas","comuna":"La Florida"},{"id":120,"nombre":"Pollos El 18","comuna":"La Florida"},{"id":121,"nombre":"El Pollo Caballo Av. La Florida","comuna":"La Florida"},{"id":122,"nombre":"Katta Pollo & Burger","comuna":"La Florida"},{"id":123,"nombre":"Torito Pollo","comuna":"La Florida"},{"id":124,"nombre":"Oh My Chicken Pollos a las Brasas","comuna":"La Florida"},{"id":125,"nombre":"Brasa brava","comuna":"La Florida"},{"id":126,"nombre":"El Pisco Perú","comuna":"La Florida"},{"id":127,"nombre":"Pollos asados Tía Marisol","comuna":"La Florida"},{"id":128,"nombre":"Vamos Donde Carlito","comuna":"Peñalolén"},{"id":129,"nombre":"Pollos Asados Monumental","comuna":"Macul"},{"id":130,"nombre":"El Pollo del Ocho","comuna":"San Joaquín"},{"id":131,"nombre":"Pollos asados a las brasas Quifer","comuna":"Peñalolén"}];
const raiz = process.cwd();
const backend = path.join(raiz, 'backend');
const paquete = path.join(backend, 'package.json');
const dbFile = path.join(backend, 'src', 'db.js');
const argumentos = process.argv.slice(2);
if (argumentos.some(a=>a!=='--publicar') || argumentos.length > 1) {
  console.error('Uso: node .\\CERCA_PUBLICAR_20_POLLOS_ASADOS.cjs [--publicar]');
  process.exit(1);
}
const publicar = argumentos.includes('--publicar');
if (!fs.existsSync(paquete) || !fs.existsSync(dbFile)) {
  console.error('ERROR: ejecuta en Cerca_Fase1.5 (deben existir backend/package.json y backend/src/db.js).');
  process.exit(1);
}
try { createRequire(paquete)('dotenv').config({path:path.join(backend,'.env')}); }
catch(e) { console.error('No se pudo cargar dotenv del backend:',e.message); process.exit(1); }
const ids = ESPERADOS.map(x=>String(x.id));
const normal = value => String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLowerCase();
const borrador = value => value===false || normal(value)==='false';

function revisarFrontend() {
  const carpeta=path.join(raiz,'frontend','src','app');
  const ts=path.join(carpeta,'app.component.ts');
  const html=path.join(carpeta,'app.component.html');
  if(!fs.existsSync(ts)||!fs.existsSync(html)) {
    console.log('AVISO: No encontré frontend/src/app actual; no se tocó el frontend.');
    return;
  }
  const codigo=fs.readFileSync(ts,'utf8');
  const plantilla=fs.readFileSync(html,'utf8');
  const usaMolde=/\bbusiness-card\b/.test(plantilla) && /\bnegociosFiltrados\b/.test(plantilla);
  const usaFiltro=/\bcoincideRestaurante\s*\(/.test(codigo) && /\btipoRestauranteActivo\b/.test(codigo);
  console.log('Molde existente business-card:',usaMolde?'ENCONTRADO':'NO IDENTIFICADO');
  console.log('Filtro Angular Restaurantes:',usaFiltro?'ENCONTRADO':'NO IDENTIFICADO');
  if(!usaMolde||!usaFiltro) console.log('AVISO: Revisa los archivos ACTUALES del frontend si tras publicar sigue en 0. Este script no los cambia.');
}
function consultarApi(port) {
  return new Promise(resolve=>{
    const req=http.get({hostname:'127.0.0.1',port,path:'/api/negocios',timeout:3500,headers:{Accept:'application/json'}},res=>{
      let cuerpo='';
      res.setEncoding('utf8');
      res.on('data',trozo=>{ cuerpo+=trozo; if(cuerpo.length>5_000_000)res.destroy(new Error('Respuesta demasiado grande')); });
      res.on('end',()=>{
        if(res.statusCode!==200){resolve({error:'HTTP '+res.statusCode});return;}
        try{
          const items=JSON.parse(cuerpo);
          if(!Array.isArray(items)){resolve({error:'Respuesta no es una lista'});return;}
          const found=items.filter(n=>ids.includes(String(n.id)));
          resolve({total:items.length,pollo:found.length,florida:found.filter(x=>normal(x.comuna)==='la florida').length});
        }catch(e){resolve({error:'JSON inválido: '+e.message});}
      });
    });
    req.on('timeout',()=>req.destroy(new Error('Tiempo de espera agotado')));
    req.on('error',e=>resolve({error:e.message}));
  });
}
async function ejecutar(){
  const {db}=await import(pathToFileURL(dbFile).href);
  let cliente,transaccion=false;
  try {
    cliente=await db.connect();
    const {rows:[base]}=await cliente.query('SELECT current_database() AS nombre');
    if(base.nombre!=='cerca')throw Error('La base es '+base.nombre+'; se esperaba cerca. No se realizaron cambios.');
    const {rows:columnas}=await cliente.query("SELECT udt_name FROM information_schema.columns WHERE table_schema='public' AND table_name='negocios' AND column_name='datos'");
    if(columnas.length!==1||columnas[0].udt_name!=='jsonb')throw Error('La columna negocios.datos no coincide con JSONB esperado.');
    if(publicar){
      await cliente.query('BEGIN');transaccion=true;
      await cliente.query('SELECT pg_advisory_xact_lock($1)',[20562012]);
    }
    const {rows}=await cliente.query(`SELECT id::text AS id, datos FROM negocios
      WHERE id::text = ANY($1::text[]) ORDER BY id${publicar?' FOR UPDATE':''}`,[ids]);
    if(rows.length!==20)throw Error('Encontré '+rows.length+'/20 IDs originales; no publicaré registros diferentes.');
    const porId=new Map(rows.map(r=>[r.id,r]));
    for(const ficha of ESPERADOS){
      const r=porId.get(String(ficha.id));
      if(!r||normal(r.datos?.nombre)!==normal(ficha.nombre)||normal(r.datos?.comuna)!==normal(ficha.comuna)||
         normal(r.datos?.categoria)!=='restaurantes'||normal(r.datos?.subcategoria)!=='pollo asado'){
        throw Error('El registro ID '+ficha.id+' no coincide con la importación original. Se cancela todo.');
      }
      if(!r.datos || typeof r.datos!=='object')throw Error('JSON inválido en ID '+ficha.id);
      if(r.datos.publicado!==true && !borrador(r.datos.publicado))throw Error('Estado publicado inesperado en ID '+ficha.id);
    }
    const porPublicar=rows.filter(x=>borrador(x.datos.publicado));
    const sinFoto=rows.filter(x=>!String(x.datos.foto||'').trim()).length;
    const noVerificadas=rows.filter(x=>x.datos.datosVerificados!==true).length;
    const resumen={};
    for(const r of rows){
      const c=r.datos.comuna;
      resumen[c]??={comuna:c,total:0,borradores:0,publicadas:0};
      resumen[c].total++;
      if(borrador(r.datos.publicado))resumen[c].borradores++;
      else resumen[c].publicadas++;
    }
    console.log('\n=== CERCA.cl / 20 POLLOS ASADOS ===');
    console.log('Base:',base.nombre,'| Identificados:',rows.length,'| Borradores:',porPublicar.length,'| Publicadas:',rows.length-porPublicar.length);
    console.table(Object.values(resumen));
    console.log('Datos NO verificados:',noVerificadas,'| Sin foto:',sinFoto);
    console.log('IMPORTANTE: la publicación NO verifica direcciones, contactos ni fotos.');
    revisarFrontend();
    if(!publicar){
      console.log('\nVISTA PREVIA: no se modificó nada.');
      console.log('Tras revisar los datos, ejecuta: node .\\CERCA_PUBLICAR_20_POLLOS_ASADOS.cjs --publicar');
      return;
    }
    if(porPublicar.length){
      // Respaldo de TODOS los documentos tal como están antes del UPDATE.
      const dir=path.join(raiz,'respaldos_cerca');fs.mkdirSync(dir,{recursive:true});
      const nombre='pollos_asados_20_antes_publicar_'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';
      const ruta=path.join(dir,nombre);
      fs.writeFileSync(ruta,JSON.stringify({base:base.nombre,fecha:new Date().toISOString(),negocios:rows},null,2),{encoding:'utf8',flag:'wx'});
      console.log('RESPALDO:',ruta);
      // Solo modifica el booleano publicado, conservando TODO el resto del JSON.
      const {rowCount}=await cliente.query(`UPDATE negocios
        SET datos=jsonb_set(datos,'{publicado}','true'::jsonb,true)
        WHERE id::text=ANY($1::text[])
        AND datos->>'categoria'='Restaurantes'
        AND datos->>'subcategoria'='Pollo asado'
        AND datos->>'publicado'='false'`,[ids]);
      if(rowCount!==porPublicar.length)throw Error('Actualizados '+rowCount+' de '+porPublicar.length+' borradores: se revierte.');
    }
    const {rows:[verificacion]}=await cliente.query(`SELECT COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE datos->>'publicado'='true')::int AS publicadas
      FROM negocios WHERE id::text=ANY($1::text[])`,[ids]);
    if(verificacion.total!==20||verificacion.publicadas!==20)throw Error('Verificación final en DB falló; se revierte.');
    await cliente.query('COMMIT');transaccion=false;
    console.log('\nLISTO: 20 fichas PUBLICADAS en PostgreSQL; 0 borradores en este lote.');
    console.log('Ninguna ficha se duplicó ni se modificaron nombres, contactos, fotos o datosVerificados.');
    const puerto=Number(process.env.PORT||3000);
    if(Number.isSafeInteger(puerto)&&puerto>0&&puerto<65536){
      const api=await consultarApi(puerto);
      if(api.error)console.log('AVISO API localhost:'+puerto+': '+api.error+'. Verifica que el backend esté iniciado.');
      else {
        console.log('API localhost:'+puerto+': /api/negocios devuelve',api.total,'negocios; de este lote',api.pollo,'(La Florida:',api.florida+').');
        if(api.pollo!==20)console.log('AVISO: PostgreSQL publicó 20, pero la API no devuelve los 20. Revisa puerto/base del backend en ejecución.');
      }
    }
    console.log('Abre http://localhost:4200 → Restaurantes → Pollo asado → La Florida; luego Ctrl+F5.');
    console.log('En La Florida se esperan 16 fichas con las tarjetas ya existentes.');
  }catch(e){
    if(transaccion&&cliente)try{await cliente.query('ROLLBACK');}catch{}
    console.error('ERROR / OPERACIÓN CANCELADA:',e.message);process.exitCode=1;
  }finally{
    if(cliente)cliente.release();
    if(typeof db.end==='function')await db.end();
  }
}
ejecutar().catch(e=>{console.error('ERROR:',e.message);process.exitCode=1;});

/* CERCA.cl: verificador SOLO LECTURA de negocios con subcategoria Pollo asado. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {createRequire}=require('node:module');
const backend=path.join(process.cwd(),'backend'),pkg=path.join(backend,'package.json');
if(!fs.existsSync(pkg)){console.error('Ejecuta desde Cerca_Fase1.5.');process.exit(1);}
createRequire(pkg)('dotenv').config({path:path.join(backend,'.env')});
async function main(){
 const {db}=await import(pathToFileURL(path.join(backend,'src','db.js')).href);
 try{
  const base=(await db.query('SELECT current_database() AS nombre')).rows[0].nombre;
  if(base!=='cerca')throw Error('Base incorrecta: '+base);
  const {rows}=await db.query("SELECT id, datos->>'nombre' AS nombre,datos->>'comuna' AS comuna,datos->>'direccion' AS direccion,COALESCE(datos->>'publicado','true') AS publicado,COALESCE(datos->>'datosVerificados','false') AS verificado FROM negocios WHERE datos->>'categoria'='Restaurantes' AND lower(COALESCE(datos->>'subcategoria',''))='pollo asado' ORDER BY comuna,nombre,id");
  console.log('Base:',base,'| Fichas Pollo asado:',rows.length);
  console.table(rows.map(x=>({id:x.id,nombre:x.nombre,comuna:x.comuna,estado:x.publicado==='false'?'BORRADOR':'PUBLICADA',datosConfirmados:x.verificado==='true'?'SI':'NO'})));
  const resumen={};for(const x of rows){const r=resumen[x.comuna]??={total:0,borradores:0,publicadas:0};r.total++;if(x.publicado==='false')r.borradores++;else r.publicadas++;}
  console.table(Object.entries(resumen).map(([comuna,r])=>({comuna,...r})));
  console.log('Las fichas BORRADOR no aparecen en resultados publicos.');
 }finally{await db.end();}
}
main().catch(e=>{console.error('ERROR:',e.message);process.exitCode=1;});

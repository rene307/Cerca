/* CERCA.cl — verificación SOLO LECTURA de pizzerías ya empadronadas.
   Uso desde Cerca_Fase1.5:
   node .\CERCA_VERIFICAR_25_PIZZERIAS.cjs
   No inserta, publica, elimina ni actualiza fichas.
*/
'use strict';
const path=require('node:path');
const fs=require('node:fs');
const {createRequire}=require('node:module');
const {pathToFileURL}=require('node:url');
const backend=path.join(process.cwd(),'backend');
const pkg=path.join(backend,'package.json');
if(!fs.existsSync(pkg)) {console.error('Ejecuta desde Cerca_Fase1.5.');process.exit(1);}
const load=createRequire(pkg);
load('dotenv').config({path:path.join(backend,'.env')});
async function check(){
 const {db}=await import(pathToFileURL(path.join(backend,'src','db.js')).href);
 try {
  const dbname=(await db.query('SELECT current_database() AS nombre')).rows[0].nombre;
  if(dbname!=='cerca')throw Error('La base conectada no es cerca: '+dbname);
  const q=`SELECT id,datos->>'nombre' AS nombre,datos->>'comuna' AS comuna,
    COALESCE(datos->>'publicado','true') AS publicado,
    COALESCE(datos->>'datosVerificados','false') AS verificado
    FROM negocios WHERE datos->>'categoria'='Restaurantes'
      AND datos->>'subcategoria'='Pizzerías'
    ORDER BY comuna,nombre`;
  const {rows}=await db.query(q);
  console.log('Base:',dbname,'| Pizzerías empadronadas:',rows.length);
  const resumen={};
  for(const n of rows){
    const x=resumen[n.comuna]??={total:0,borradores:0,publicadas:0};
    x.total++;
    if(n.publicado==='false')x.borradores++;else x.publicadas++;
  }
  console.table(Object.entries(resumen).map(([comuna,val])=>({comuna,...val})));
  console.table(rows.map(n=>({id:n.id,nombre:n.nombre,comuna:n.comuna,estado:n.publicado==='false'?'BORRADOR':'PUBLICADA',datosConfirmados:n.verificado==='true'?'SÍ':'NO'})));
  console.log('Nota: las fichas en BORRADOR no aparecen en el frontend público.');
 } finally {await db.end();}
}
check().catch(e=>{console.error('ERROR:',e.message);process.exitCode=1;});

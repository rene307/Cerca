/*
CERCA.cl - Empadronamiento seguro de los 20 locales de pollos asados de las capturas.
NO modifica frontend, CSS, backend, registros existentes ni publica fichas.
- Vista previa (solo lectura): node .\CERCA_EMPADRONAR_20_POLLOS_ASADOS.cjs
- Insertar borradores:       node .\CERCA_EMPADRONAR_20_POLLOS_ASADOS.cjs --aplicar
- Verificar:                 node .\CERCA_VERIFICAR_POLLOS_ASADOS.cjs
Lee el archivo CERCA_POLLOS_ASADOS_20_DATOS.json desde la misma carpeta.
*/
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {createRequire}=require('node:module');
const root=process.cwd();
const backend=path.join(root,'backend');
const pkg=path.join(backend,'package.json');
const dbFile=path.join(backend,'src','db.js');
const dataFile=path.join(__dirname,'CERCA_POLLOS_ASADOS_20_DATOS.json');
const aplicar=process.argv.includes('--aplicar');
function stop(message){throw Error(message);}
if(!fs.existsSync(pkg)||!fs.existsSync(dbFile)){
 console.error('Ejecuta desde la raiz Cerca_Fase1.5 (debe existir backend/).');process.exit(1);
}
if(!fs.existsSync(dataFile)){
 console.error('Falta CERCA_POLLOS_ASADOS_20_DATOS.json junto al script.');process.exit(1);
}
const load=createRequire(pkg);
try{load('dotenv').config({path:path.join(backend,'.env')});}
catch(e){console.error('No se pudo cargar dotenv del backend:',e.message);process.exit(1);}
const candidatos=JSON.parse(fs.readFileSync(dataFile,'utf8'));
const camposNecesarios=['nombre','categoria','subcategoria','comuna','direccion','publicado','datosVerificados'];
if(!Array.isArray(candidatos)||candidatos.length!==20)stop('El archivo de datos no contiene las 20 fichas esperadas.');
for(const n of candidatos){
 if(camposNecesarios.some(k=>!Object.prototype.hasOwnProperty.call(n,k)))stop('Faltan campos en un registro.');
 if(!n.nombre||!n.comuna||!n.direccion||n.categoria!=='Restaurantes'||n.subcategoria!=='Pollo asado'||n.publicado!==false||n.datosVerificados!==false)stop('Registro incorrecto: '+n.nombre);
}
function normal(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
 .replace(/\b(avenida|avda|av)\b/g,'av').replace(/\b(local|loc)\b/g,'loc')
 .replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();}
// Las sucursales de cadenas mantienen nombre igual pero direccion diferente.
function dirKey(n){return normal(n.comuna)+'|'+normal(n.direccion);}
function nameKey(n){return normal(n.comuna)+'|'+normal(n.nombre);}
async function run(){
 const {db}=await import(pathToFileURL(dbFile).href);
 let client,inTransaction=false;
 try{
  client=await db.connect();
  if(aplicar){await client.query('BEGIN');inTransaction=true;await client.query('SELECT pg_advisory_xact_lock($1)',[20562011]);}
  const {rows:[dbName]}=await client.query('SELECT current_database() AS nombre');
  if(dbName.nombre!=='cerca')stop('La base conectada no es cerca, sino: '+dbName.nombre);
  const cols=await client.query("SELECT udt_name FROM information_schema.columns WHERE table_schema='public' AND table_name='negocios' AND column_name='datos'");
  if(cols.rows.length!==1||cols.rows[0].udt_name!=='jsonb')stop('Esquema no esperado: negocios.datos debe ser JSONB. No se cambia nada.');
  const {rows}=await client.query('SELECT id, datos FROM negocios ORDER BY id');
  const previos=rows.map(r=>({...r.datos,id:r.id}));
  const nuevos=[],ya=[],ambig=[];
  const byAddress=new Map();const byName=new Map();
  for(const n of previos){
   if(n.direccion) {let k=dirKey(n);byAddress.set(k,[...(byAddress.get(k)||[]),n]);}
   let k=nameKey(n);byName.set(k,[...(byName.get(k)||[]),n]);
  }
  for(const n of candidatos){
   const key=dirKey(n),matchAddress=byAddress.get(key)||[],matchName=byName.get(nameKey(n))||[];
   const exact=matchAddress.find(x=>nameKey(x)===nameKey(n));
   if(exact){ya.push({nombre:n.nombre,comuna:n.comuna,motivo:'Mismo nombre y direccion',id:exact.id});continue;}
   // Si ya hay un negocio en esa direccion, no es seguro crear otra ficha automatica.
   if(matchAddress.length){ambig.push({nombre:n.nombre,comuna:n.comuna,motivo:'Direccion ocupada por ficha distinta: '+matchAddress.map(x=>x.nombre).join(', ')});continue;}
   // Misma marca y comuna, distinto domicilio: son sucursales distintas.
   // Pero si la existente no tiene domicilio, dejar pendiente para evitar duplicados.
   if(matchName.some(x=>!x.direccion)){
    ambig.push({nombre:n.nombre,comuna:n.comuna,motivo:'Ya hay nombre igual sin direccion'});continue;
   }
   nuevos.push(n);
   byAddress.set(key,[n]);
   byName.set(nameKey(n),[...matchName,n]);
  }
  console.log('=== CERCA.cl | POLLO ASADO ===');
  console.log('Base:',dbName.nombre,'| Existentes:',previos.length,'| Candidatos:',candidatos.length);
  console.log('Nuevos:',nuevos.length,'| Ya registrados:',ya.length,'| Requieren revision:',ambig.length);
  console.table(Object.entries(nuevos.reduce((x,n)=>(x[n.comuna]=(x[n.comuna]||0)+1,x),{})).map(([comuna,nuevos])=>({comuna,nuevos})));
  if(ya.length)console.table(ya);
  if(ambig.length)console.table(ambig);
  if(!aplicar){
   console.log('SOLO VISTA PREVIA: ninguna escritura.');
   console.log('Para crear los borradores: node .\\CERCA_EMPADRONAR_20_POLLOS_ASADOS.cjs --aplicar');
   return;
  }
  if(ambig.length) {
   console.log('Se omiten todas las coincidencias dudosas; no se cambian fichas existentes.');
  }
  const inserted=[];
  for(const n of nuevos){
   const result=await client.query('INSERT INTO negocios(datos) VALUES($1::jsonb) RETURNING id',[JSON.stringify(n)]);
   inserted.push({id:result.rows[0].id,nombre:n.nombre,comuna:n.comuna,direccion:n.direccion});
  }
  await client.query('COMMIT');inTransaction=false;
  // Auditoria local tras confirmar transaccion; no contiene fichas de terceros previas.
  try{
   const log=path.join(root,'CERCA_POLLOS_INSERTADOS_'+new Date().toISOString().replace(/[:.]/g,'-')+'.json');
   fs.writeFileSync(log,JSON.stringify({fecha:new Date().toISOString(),base:dbName.nombre,insertados:inserted},null,2),'utf8');
   console.log('Registro de inserciones:',log);
  }catch(e){console.warn('Inserciones confirmadas; no se pudo escribir auditoria local:',e.message);}
  console.log('LISTO: '+inserted.length+' nuevas fichas guardadas COMO BORRADOR.');
  console.log('No se publico nada. No se modifico frontend, backend, fotos ni fichas existentes.');
  console.log('Faltan fotos autorizadas y revisar horarios/contactos antes de publicarlas.');
 }catch(e){
  if(inTransaction&&client)await client.query('ROLLBACK').catch(()=>{});
  console.error('ERROR:',e.message);process.exitCode=1;
 }finally{if(client)client.release();await db.end();}
}
run().catch(e=>{console.error('ERROR:',e.message);process.exitCode=1;});

import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { db } from './db.js';
import { requireCercaDatabase } from './require-cerca-database.js';

// Preview by default; --aplicar is an opt-in import. Never overwrites a stored business.
const aplicar = process.argv.includes('--aplicar');
const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ');
const llave=n=>[n.nombre,n.comuna,n.categoria].map(norm).join('|');
let client;
try{
 await requireCercaDatabase();
 const catalogo=JSON.parse(await readFile(new URL('../seed/negocios.json',import.meta.url),'utf8'));
 client=await db.connect();
 await client.query('BEGIN');
 await client.query('LOCK TABLE negocios IN SHARE ROW EXCLUSIVE MODE');
 const {rows}=await client.query('SELECT datos FROM negocios');
 const existentes=new Set(rows.map(r=>llave(r.datos)));
 const faltantes=[];
 for(const negocio of catalogo){
  if(typeof negocio.nombre!=='string'||typeof negocio.comuna!=='string'||typeof negocio.categoria!=='string')throw Error('Hay una ficha de respaldo no valida');
  const key=llave(negocio);
  if(existentes.has(key))continue;
  existentes.add(key);
  const {id,...datos}=negocio;
  // El respaldo no ha sido confirmado por los comercios: no declararlo verificado.
  datos.datosVerificados=false;
  faltantes.push(datos);
 }
 console.log(`NEGOCIOS EN LA BASE: ${rows.length}. CATALOGO DE RESPALDO: ${catalogo.length}. FALTANTES: ${faltantes.length}.`);
 for(const n of faltantes)console.log(' + '+n.comuna+' / '+n.categoria+' / '+n.nombre);
 if(aplicar){
  for(const datos of faltantes){
   await client.query('INSERT INTO negocios(datos) VALUES($1::jsonb)',[JSON.stringify(datos)]);
  }
  await client.query('COMMIT');
  console.log(`Se incorporaron ${faltantes.length} fichas antiguas pendientes de verificacion. NINGUNA ficha existente se modifico.`);
 }else{
  await client.query('ROLLBACK');
  console.log('VISTA PREVIA. No se ha insertado, actualizado ni borrado ningun negocio.');
 }
}catch(e){
 if(client)await client.query('ROLLBACK').catch(()=>{});
 console.error('ERROR:',e.message);process.exitCode=1;
}finally{if(client)client.release();await db.end();}

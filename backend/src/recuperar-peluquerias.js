import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { db } from './db.js';
import { requireCercaDatabase } from './require-cerca-database.js';
// Rescata fichas del catálogo del ZIP si NO existen en la base.
// Uso normal: vista previa; --aplicar: inserta faltantes, sin UPDATE, DELETE ni TRUNCATE.
const aplicar = process.argv.includes('--aplicar');
const clave = x => String(x || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLocaleLowerCase('es-CL').replace(/\s+/g,' ');
const llave = n => [n.nombre,n.comuna,n.categoria].map(clave).join('|');
let client;
try {
  await requireCercaDatabase();
  const catalogo = JSON.parse(await readFile(new URL('../seed/negocios.json',import.meta.url),'utf8'))
    .filter(n => clave(n.categoria) === 'peluqueria' && clave(n.comuna) === 'la florida');
  client = await db.connect();
  await client.query('BEGIN');
  await client.query('LOCK TABLE negocios IN SHARE ROW EXCLUSIVE MODE');
  const {rows} = await client.query('SELECT datos FROM negocios');
  const existentes = new Set(rows.map(r=>llave(r.datos)));
  const faltan = catalogo.filter(n=>!existentes.has(llave(n)));
  console.log(`\nBase cerca: ${rows.length} negocios existentes. Catálogo antiguo: ${catalogo.length} peluquerías de La Florida.`);
  console.log(faltan.length ? 'PELUQUERÍAS QUE FALTAN:' : 'No falta ninguna peluquería del catálogo antiguo.');
  for(const n of faltan)console.log(' + '+n.nombre);
  if(aplicar){
    for(const n of faltan) {
      // Eliminamos el ID antiguo: nunca pisar el ID de un negocio real distinto.
      const {id:antiguoId,...datos} = n;
      const {rows:[insertado]} = await client.query('INSERT INTO negocios (datos) VALUES ($1::jsonb) RETURNING id',[JSON.stringify(datos)]);
      console.log('Recuperada:',n.nombre,'nuevo ID:',insertado.id);
    }
    await client.query('COMMIT');
    console.log('\nFinalizado. No se cambió ni borró ningún negocio anterior.');
  } else {
    await client.query('ROLLBACK');
    console.log('\nVISTA PREVIA, no se cambió la base. Para importar, ejecuta RECUPERAR_PELUQUERIAS_FALTANTES.bat y confirma.');
  }
} catch (e) {
  if(client)await client.query('ROLLBACK').catch(()=>{});
  console.error('ERROR:',e.message); process.exitCode=1;
} finally {if(client)client.release();await db.end();}

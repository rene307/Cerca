import { readFile } from 'node:fs/promises';
import { db } from './db.js';
import { requireCercaDatabase } from './require-cerca-database.js';
try {
  await requireCercaDatabase();
  const negocios=JSON.parse(await readFile(new URL('../seed/negocios.json',import.meta.url),'utf8'));
  const c=await db.connect();
  try {
    await c.query('BEGIN');
    for (const n of negocios) await c.query('INSERT INTO negocios (id,datos) VALUES ($1,$2::jsonb) ON CONFLICT (id) DO NOTHING',[n.id,JSON.stringify(n)]);
    await c.query("SELECT setval(pg_get_serial_sequence('negocios','id'), COALESCE((SELECT MAX(id) FROM negocios), 1), true)");
    await c.query('COMMIT');
  } catch(e) {await c.query('ROLLBACK');throw e;} finally{c.release();}
  console.log('Seed CERCA importado sin sobrescribir ediciones ni duplicar:',negocios.length);
} catch(e) {console.error(e.message);process.exitCode=1;}finally{await db.end();}

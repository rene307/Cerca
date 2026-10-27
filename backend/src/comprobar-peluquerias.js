import 'dotenv/config';
import { db } from './db.js';
import { requireCercaDatabase } from './require-cerca-database.js';
try {
  await requireCercaDatabase();
  const {rows} = await db.query(`SELECT id, datos->>'nombre' AS nombre,
    datos->>'categoria' AS categoria, datos->>'comuna' AS comuna,
    datos->>'publicado' AS publicado
    FROM negocios
    WHERE lower(coalesce(datos->>'categoria','')) LIKE 'peluquer%'
    ORDER BY id`);
  console.log('\nPELUQUERÍAS QUE REALMENTE ESTÁN EN POSTGRESQL (base cerca):');
  if (!rows.length) console.log('No hay peluquerías en PostgreSQL. No se ha eliminado ni agregado nada.');
  for (const r of rows) {
    console.log(`[${r.id}] ${r.nombre} | ${r.comuna} | ${r.categoria} | ${r.publicado === 'false' ? 'NO PUBLICADA' : 'publicada'}`);
  }
  console.log('\nTOTAL:', rows.length);
} catch (e) { console.error('ERROR DE CONEXIÓN:', e.message); process.exitCode = 1; }
finally { await db.end(); }

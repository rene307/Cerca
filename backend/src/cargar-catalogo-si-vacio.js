import { readFile } from 'node:fs/promises';
import { db } from './db.js';
import { requireCercaDatabase } from './require-cerca-database.js';
// Rescate no destructivo del catalogo local anterior. Ejecutar solo con la BD totalmente vacia.
// Fuente: backend/seed/negocios.json del proyecto, con fichas y datos por verificar.
try {
  await requireCercaDatabase();
  const cliente = await db.connect();
  try {
    await cliente.query('BEGIN');
    await cliente.query('LOCK TABLE negocios IN SHARE ROW EXCLUSIVE MODE');
    const {rows:[conteo]} = await cliente.query('SELECT count(*)::int AS total FROM negocios');
    if (conteo.total !== 0) {
      console.log(`CERCA: ${conteo.total} negocios existentes en PostgreSQL. No se agrega ni reemplaza nada.`);
    } else {
      const negocios = JSON.parse(await readFile(new URL('../seed/negocios.json', import.meta.url), 'utf8'));
      const ids = new Set();
      for (const n of negocios) {
        if (!Number.isSafeInteger(n.id) || n.id <= 0 || ids.has(n.id) || !n.nombre || !n.categoria || !n.comuna)
          throw Error('El catalogo inicial tiene registros invalidos o repetidos. No se importo.');
        ids.add(n.id);
        await cliente.query('INSERT INTO negocios (id,datos) VALUES ($1,$2::jsonb) ON CONFLICT(id) DO NOTHING',
          [n.id,JSON.stringify(n)]);
      }
      await cliente.query("SELECT setval(pg_get_serial_sequence('negocios','id'), (SELECT MAX(id) FROM negocios), true)");
      console.log(`CERCA: base vacia. Catalogo inicial recuperado: ${negocios.length} fichas (datos sin verificar, NO indexables hasta revision).`);
    }
    await cliente.query('COMMIT');
  } catch(e) { await cliente.query('ROLLBACK'); throw e; }
  finally { cliente.release(); }
} catch(e) { console.error('CERCA: error al revisar catalogo:',e.message); process.exitCode=1; }
finally { await db.end(); }

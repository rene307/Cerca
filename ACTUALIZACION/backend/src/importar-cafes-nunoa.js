import { db } from './db.js';
import { requireCercaDatabase } from './require-cerca-database.js';
import { leerCafesNunoa, agregarSoloFaltantes } from './nunoa-importacion.js';

let cliente;
try {
  const fichas = await leerCafesNunoa();
  await requireCercaDatabase();
  cliente = await db.connect();
  await cliente.query('BEGIN');
  // Evita la carrera de dos importaciones y protege las ediciones de administración.
  await cliente.query('LOCK TABLE negocios IN SHARE ROW EXCLUSIVE MODE');
  // Reparar secuencia solo si ha quedado atrás por importaciones con id explícito.
  await cliente.query(`SELECT setval(pg_get_serial_sequence('negocios','id'),
    GREATEST((SELECT COALESCE(MAX(id),0) FROM negocios), nextval(pg_get_serial_sequence('negocios','id'))), true)`);
  const resultado = await agregarSoloFaltantes(cliente, fichas);
  await cliente.query('COMMIT');
  const { rows: [conteo] } = await db.query(`SELECT COUNT(*)::int AS total FROM negocios
    WHERE datos->>'comuna' = 'Ñuñoa' AND datos->>'categoria' = 'Cafés'
      AND COALESCE(datos->>'publicado','true') <> 'false'`);
  console.log(`CERCA / Ñuñoa: ${resultado.agregadas} nuevas cafeterías insertadas; ${resultado.omitidas} ya estaban. Total público en Ñuñoa, Cafés: ${conteo.total}.`);
  console.log('SEO vigente: /nunoa/cafes y /nunoa/cafes/nombre-de-cafeteria.');
  console.log('No se modificaron las fichas, evaluaciones ni fotografías anteriores.');
} catch (error) {
  if (cliente) await cliente.query('ROLLBACK').catch(() => {});
  console.error('No se pudo importar Ñuñoa. No se alteraron las fichas existentes:', error.message);
  process.exitCode = 1;
} finally {
  cliente?.release();
  await db.end();
}

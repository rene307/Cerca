import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

export const limpio = x => String(x ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export function validar(fichas) {
  if (!Array.isArray(fichas) || fichas.length !== 20) throw new Error('El archivo debe contener 20 fichas.');
  const nombres = new Set();
  for (const f of fichas) {
    if (f.comuna !== 'Ñuñoa' || f.categoria !== 'Cafés' || f.publicado !== true || f.datosVerificados !== false ||
        !f.nombre || !f.descripcion || !f.direccion || !f.foto || !f.slugSeo || !/^\/assets\/cerca-nunoa-cafeterias\/nunoa-\d{3}\.webp$/.test(f.foto) ||
        limpio(f.nombre) !== f.slugSeo) throw new Error('Ficha inválida: '+(f.nombre||'sin nombre'));
    const clave = limpio(f.nombre);
    if (nombres.has(clave)) throw new Error('Nombre duplicado: '+f.nombre);
    nombres.add(clave);
  }
}
export async function agregarSoloFaltantes(client, fichas) {
  const { rows } = await client.query('SELECT datos FROM negocios');
  const presentes = new Set(rows.filter(x => limpio(x.datos?.comuna)==='nunoa')
    .map(x => limpio(x.datos?.nombre)));
  let nuevas=0,omitidas=0;
  for (const ficha of fichas) {
    const clave = limpio(ficha.nombre);
    if (presentes.has(clave)) { omitidas++; continue; }
    await client.query('INSERT INTO negocios(datos) VALUES ($1::jsonb)',[JSON.stringify(ficha)]);
    presentes.add(clave);nuevas++;
  }
  return { nuevas,omitidas };
}
export async function ejecutar(archivo, modDb) {
  const fichas = JSON.parse(await readFile(archivo,'utf8'));
  validar(fichas);
  const db = modDb.db;
  let client;
  try {
    client = await db.connect();
    const {rows:actual} = await client.query('SELECT current_database() AS nombre');
    if (actual[0]?.nombre !== 'cerca') throw new Error('La conexión no usa la base cerca. Revisa PGDATABASE/DATABASE_URL de backend/.env.');
    await client.query('BEGIN');
    await client.query('LOCK TABLE negocios IN SHARE ROW EXCLUSIVE MODE');
    // Mantener la secuencia al día ante registros anteriores con id explícito.
    await client.query(`SELECT setval(pg_get_serial_sequence('negocios','id'),
      GREATEST((SELECT COALESCE(MAX(id),0) FROM negocios), nextval(pg_get_serial_sequence('negocios','id'))), true)`);
    const res=await agregarSoloFaltantes(client,fichas);
    const {rows:total} = await client.query(`SELECT COUNT(*)::int AS total FROM negocios
      WHERE LOWER(datos->>'categoria') IN ('cafés','cafes')
        AND LOWER(datos->>'comuna') IN ('ñuñoa','nunoa')
        AND COALESCE(datos->>'publicado','true') <> 'false'`);
    await client.query('COMMIT');
    console.log(`RESULTADO: ${res.nuevas} nuevas, ${res.omitidas} ya existentes. Ñuñoa/Cafés: ${total[0]?.total ?? '?'} registros publicados en la base cerca.`);
    console.log('No se modificaron ni se eliminaron negocios anteriores.');
    return res;
  } catch(e) {
    if (client) await client.query('ROLLBACK').catch(()=>{});
    throw e;
  } finally { client?.release(); await db.end(); }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  try {
    const path = resolve(process.argv[2] || '');
    const mod = await import(pathToFileURL(resolve(process.cwd(),'src/db.js')).href);
    await ejecutar(path,mod);
  } catch(e) { console.error('[ERROR DE IMPORTACION]', e.message); process.exitCode=1; }
}

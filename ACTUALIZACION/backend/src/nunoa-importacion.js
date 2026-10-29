import { readFile } from 'node:fs/promises';
import { slug, rutaNegocio } from './seo-utils.js';

export async function leerCafesNunoa() {
  const fichas = JSON.parse(await readFile(new URL('../seed/nunoa-cafes.json', import.meta.url), 'utf8'));
  if (!Array.isArray(fichas) || fichas.length !== 20) throw new Error('Se esperaban exactamente 20 fichas de Ñuñoa.');
  const identificadores = new Set();
  for (const n of fichas) {
    if (!n.nombre?.trim() || n.comuna !== 'Ñuñoa' || n.categoria !== 'Cafés' || !n.direccion ||
        n.datosVerificados !== false || n.publicado !== true || !n.descripcion || !n.foto || !n.slugSeo) {
      throw new Error('Ficha de Ñuñoa incorrecta: ' + (n.nombre || 'sin nombre'));
    }
    if (rutaNegocio(n, [n]) !== `/nunoa/cafes/${n.slugSeo}`) throw new Error('Ruta SEO no válida: ' + n.nombre);
    const clave = slug(n.nombre);
    if (identificadores.has(clave)) throw new Error('Ficha repetida: '+n.nombre);
    identificadores.add(clave);
  }
  return fichas;
}

// Solo inserciones. Nunca UPDATE/DELETE, ni modificación de una ficha existente.
// Recibe cliente conectado a la BD cerca y se ejecuta bajo una transacción.
export async function agregarSoloFaltantes(cliente, fichas) {
  const { rows } = await cliente.query(`SELECT id, datos FROM negocios
    WHERE lower(datos->>'comuna') IN ('ñuñoa','nunoa')`);
  const existentes = new Set(rows.map(r => slug(r.datos?.nombre || '')));
  let agregadas = 0, omitidas = 0;
  for (const ficha of fichas) {
    const clave = slug(ficha.nombre);
    if (existentes.has(clave)) { omitidas++; continue; }
    // PostgreSQL asigna un id nuevo, respetando cualquier negocio agregado por admin.
    await cliente.query('INSERT INTO negocios (datos) VALUES ($1::jsonb)', [JSON.stringify(ficha)]);
    existentes.add(clave);
    agregadas++;
  }
  return {agregadas, omitidas};
}

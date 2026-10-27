import { db } from './db.js';

/** Evita crear tablas o insertar negocios de CERCA en bases de otros proyectos. */
export async function requireCercaDatabase() {
  const { rows } = await db.query('SELECT current_database() AS nombre');
  const nombre = rows[0]?.nombre;
  if (nombre !== 'cerca') {
    throw new Error(
      `CERCA requiere la base "cerca", pero la conexión está usando "${nombre}". ` +
      'Revisa PGDATABASE y DATABASE_URL en backend/.env.'
    );
  }
  return nombre;
}

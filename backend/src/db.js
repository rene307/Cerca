import 'dotenv/config';
import pg from 'pg';
const options = {
  // CERCA usa su propia base, separada de otros proyectos.
  database: process.env.PGDATABASE || 'cerca',
  max: Number(process.env.PG_POOL_MAX || 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
};
if (process.env.DATABASE_URL) options.connectionString = process.env.DATABASE_URL;
if (process.env.PGSSLMODE === 'require') options.ssl = { rejectUnauthorized: true };
export const db = new pg.Pool(options);
db.on('error', err => console.error('PostgreSQL: fallo de conexión inactiva:', err.message));

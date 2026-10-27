import 'dotenv/config';
import { db } from './db.js';
import { requireCercaDatabase } from './require-cerca-database.js';

try {
  console.log('Verificando PostgreSQL sin alterar negocios...');
  const nombre = await requireCercaDatabase();
  console.log('OK. Conexion autenticada a base:', nombre);
  const {rows:[tabla]}=await db.query("SELECT to_regclass('public.negocios') AS tabla");
  if (tabla.tabla) {
    const {rows:[n]}=await db.query("SELECT count(*)::integer AS cantidad, count(*) FILTER (WHERE COALESCE(datos->>'publicado','true') <> 'false')::integer AS visibles FROM negocios");
    console.log(`Negocios en la base: ${n.cantidad}; publicados: ${n.visibles}.`);
    const {rows:r}=await db.query(`SELECT datos->>'comuna' AS comuna, datos->>'categoria' AS categoria, count(*)::integer AS total FROM negocios
      WHERE datos->>'comuna'='La Florida' AND COALESCE(datos->>'publicado','true')<>'false' GROUP BY 1,2 ORDER BY 2`);
    console.log('Categorias publicadas en La Florida:',r.length?JSON.stringify(r):'ninguna');
  } else {
    console.log('La base existe pero todavia no tiene tabla negocios. La migracion la creara sin borrar los negocios.');
  }
} catch(e){
  const code=e.code || '';
  console.error('ERROR DE CONEXION:',e.message);
  if(code==='ECONNREFUSED')console.error('PostgreSQL no esta ejecutandose o PGHOST/PGPORT son incorrectos. Abre Servicios de Windows y comprueba postgresql-x64-18.');
  else if(code==='28P01')console.error('Contrasena o usuario de PostgreSQL incorrectos: revisa PGUSER/PGPASSWORD en backend/.env.');
  else if(code==='3D000')console.error('No existe la base de datos cerca. Compruebala en pgAdmin, sin borrar ninguna otra base.');
  else if(code==='28000')console.error('Acceso PostgreSQL denegado: revisa pg_hba.conf y PGUSER.');
  else console.error('Revisa PGDATABASE=cerca, DATABASE_URL, PGHOST, PGPORT y los permisos PostgreSQL.');
  process.exitCode=1;
} finally { await db.end(); }

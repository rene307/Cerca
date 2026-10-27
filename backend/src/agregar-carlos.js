import { db } from './db.js';
import { requireCercaDatabase } from './require-cerca-database.js';

// Instalación segura: agrega o actualiza la ficha en PostgreSQL, sin reimportar los 65 negocios.
// Antes de hacerla pública, confirmar comuna y permiso para fotografía/teléfono.
const ficha = {
  "nombre": "Carlos Mecánico",
  "categoria": "Mecánicos",
  "comuna": "La Florida",
  "descripcion": "Mecánico de confianza, recomendado por una familia que conoce su trabajo. Destaca por su excelente atención, buena disposición y servicio profesional. Consulta directamente por WhatsApp para coordinar tu vehículo.",
  "foto": "assets/carlos-mecanico.jpg",
  "icono": "🔧",
  "origen": "manual",
  "publicado": true,
  "destacado": true,
  "prioridadDestacado": 1,
  "whatsapp": "+56957691917",
  "telefono": "+56 9 5769 1917",
  "calificacion": 5.0,
  "recomendacionEditorial": true,
  "opiniones": 0,
  "datosVerificados": false,
  "observacionRevision": "5.0 corresponde a una recomendación editorial personal; no representa un promedio de reseñas. Comuna provisional; confirmar con Carlos antes de publicar."
};
try {
  await requireCercaDatabase();
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const {rows} = await client.query(`
      SELECT id FROM negocios
      WHERE lower(btrim(datos->>'nombre')) = lower($1)
         OR regexp_replace(coalesce(datos->>'whatsapp',''), '[^0-9]', '', 'g') = $2
      ORDER BY id LIMIT 1 FOR UPDATE
    `, [ficha.nombre, '56957691917']);
    const actual = rows[0]?.id;
    const result = actual
      ? await client.query(`UPDATE negocios SET datos = datos || $2::jsonb, actualizado_en = NOW()
          WHERE id = $1 RETURNING id`, [actual, JSON.stringify(ficha)])
      : await client.query('INSERT INTO negocios(datos) VALUES($1::jsonb) RETURNING id', [JSON.stringify(ficha)]);
    await client.query('COMMIT');
    console.log('✅ Carlos Mecánico', actual ? 'actualizado' : 'creado', 'con ID', result.rows[0].id);
    console.log('✅ Recarga http://localhost:4200 y filtra Mecánicos en La Florida.');
  } catch(e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
} catch(e) { console.error('❌ No se pudo guardar Carlos:', e.message); process.exitCode=1; }
finally { await db.end(); }

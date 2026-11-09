// CERCA.cl — fotos persistentes en PostgreSQL
// Dependencias: npm i multer sharp (express y pg ya usados por el backend)
// Importar y montar las rutas como indica el LEEME.
import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';

const subir = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});
const mimePermitidos = new Set(['image/jpeg', 'image/png', 'image/webp']);
const formatosPermitidos = new Set(['jpeg', 'png', 'webp']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function crearRutasImagenesAdmin(pool) {
  const router = Router();
  // IMPORTANTÍSIMO: montar router detrás del mismo verificador JWT que /api/admin/negocios.
  router.post('/imagenes', (req, res, next) => {
    subir.single('imagen')(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'La foto supera el límite de 5 MB.' : 'Error al procesar la imagen.' });
      next();
    });
  }, async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'Adjunta un archivo de imagen.' });
      if (!mimePermitidos.has(req.file.mimetype)) return res.status(400).json({ error: 'Formato no permitido. Usa JPG, PNG o WEBP.' });
      const imagen = sharp(req.file.buffer, { limitInputPixels: 20000000 });
      const meta = await imagen.metadata();
      if (!formatosPermitidos.has(meta.format)) return res.status(400).json({ error: 'El contenido del archivo no es una imagen válida.' });
      if (!meta.width || !meta.height) return res.status(400).json({ error: 'Imagen dañada o sin dimensiones.' });
      const contenido = await imagen.rotate().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80, effort: 4 }).toBuffer();
      const id = randomUUID();
      await pool.query('INSERT INTO cerca_imagenes (id, mime_type, contenido, bytes) VALUES ($1,$2,$3,$4)', [id, 'image/webp', contenido, contenido.length]);
      return res.status(201).json({ url: '/api/imagenes/' + id, id });
    } catch (error) {
      console.error('Error de imagen en CERCA.cl:', error);
      return res.status(500).json({ error: 'No fue posible almacenar la imagen.' });
    }
  });
  return router;
}

export function crearRutasImagenesPublicas(pool) {
  const router = Router();
  router.get('/imagenes/:id', async (req, res) => {
    if (!uuid.test(req.params.id)) return res.status(400).end();
    try {
      const r = await pool.query('SELECT contenido, mime_type FROM cerca_imagenes WHERE id=$1', [req.params.id]);
      if (!r.rows.length) return res.status(404).end();
      res.set('Content-Type', r.rows[0].mime_type);
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
      res.set('X-Content-Type-Options', 'nosniff');
      return res.send(r.rows[0].contenido);
    } catch (error) {
      console.error('Error mostrando imagen CERCA.cl:', error);
      return res.status(500).end();
    }
  });
  return router;
}

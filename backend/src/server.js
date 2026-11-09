import 'dotenv/config';

import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'node:crypto';
import {
  mkdir,
  unlink,
  writeFile,
} from 'node:fs/promises';
import {
  dirname,
  join,
  resolve,
} from 'node:path';
import { fileURLToPath } from 'node:url';

import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
// FOTOGRAFÍAS CERCA:
// Almacenamiento en backend/uploads/negocios.
import multer from 'multer';
import nodemailer from 'nodemailer';

import {
  codigoValido,
  DURACION_CODIGO_SEGUNDOS,
  emailValido,
  firmarCodigo,
  normalizarCorreo,
} from './admin-magic.js';
import {
  compararCalidadNegocios,
  conCalidad,
} from './calidad-negocios.js';
import { db } from './db.js';
import { registerSeoPages } from './seo-pages.js';
import { requireCercaDatabase } from './require-cerca-database.js';
import {
  frecuencias,
  tiposEvento,
  validarNegocio,
  validarOpinion,
  validarSuscriptor,
} from './validation.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
// Las fichas SEO muestran fotos https (Unsplash, etc.): el CSP por defecto de helmet las bloquearía.
const cspBase = helmet.contentSecurityPolicy.getDefaultDirectives();
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...cspBase,
      'img-src': ["'self'", 'data:', 'https:']
    }
  }
}));

const origins = (
  process.env.CORS_ORIGINS || 'http://localhost:4200'
).split(',').map(x => x.trim()).filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    if (!origin || origins.includes(origin)) {
      return cb(null, true);
    }

    return cb(new Error('Origen no autorizado'));
  }
}));

app.use(express.json({ limit: '300kb' }));

const slow = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false
});

const sensitive = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Demasiadas solicitudes; intenta más tarde.'
  }
});

const limiteCorreoAdmin = rateLimit({
  windowMs: 15 * 60_000,
  limit: 8,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Demasiadas solicitudes; intenta más tarde.'
  }
});

const limiteCodigoAdmin = rateLimit({
  windowMs: 15 * 60_000,
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Demasiados intentos; solicita un nuevo código más tarde.'
  }
});

app.use('/api', (req, res, next) => {
  if (!req.path.startsWith('/imagenes')) {
    res.set('X-Robots-Tag', 'noindex, nofollow');
  }
  next();
});

app.use('/api', slow);

const wrap = fn => (req, res, next) =>
  Promise.resolve(fn(req, res)).catch(next);

const err = (res, msg, status = 400) =>
  res.status(status).json({ error: msg });

// =====================================================
// AUTENTICACIÓN DE ADMINISTRADOR
// =====================================================

function admin(req, res, next) {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    return err(res, 'Autenticación no configurada.', 503);
  }

  const match = /^Bearer (.+)$/i.exec(
    req.headers.authorization || ''
  );

  if (!match) {
    return err(
      res,
      'Inicia sesión para administrar CERCA.',
      401
    );
  }

  try {
    const p = jwt.verify(match[1], secret, {
      algorithms: ['HS256']
    });

    if (p.role !== 'admin') throw Error();

    next();
  } catch {
    return err(res, 'Sesión vencida o inválida.', 401);
  }
}

// =====================================================
// NUEVO: SISTEMA DE FOTOGRAFÍAS CERCA.CL
// =====================================================
//
// Carpeta física:
// backend/uploads/negocios/
//
// URL pública:
// /api/imagenes/foto-xxxxxxxx.jpg
//
// La foto se almacena como archivo.
// PostgreSQL conserva su ruta en datos.foto.
//
// =====================================================

const carpetaFotos = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../uploads/negocios'
);

// Máximo 5 MB por fotografía.
const maxBytesFoto = 5 * 1024 * 1024;

// Solo aceptamos rutas de imágenes generadas por CERCA.
const imagenLocalValida =
  /^\/api\/imagenes\/foto-[a-f0-9]{32}\.(?:jpg|png|webp)$/;

// Las fotografías son públicas para poder mostrarse
// en las fichas de negocios.
//
// La subida requiere autenticación de administrador.
app.use(
  '/api/imagenes',
  express.static(carpetaFotos, {
    index: false,
    dotfiles: 'deny',
    maxAge: '1d',

    setHeaders(res) {
      res.setHeader(
        'X-Content-Type-Options',
        'nosniff'
      );

      res.setHeader(
        'Cross-Origin-Resource-Policy',
        'cross-origin'
      );

      res.setHeader(
        'Cache-Control',
        'public, max-age=86400'
      );
    }
  })
);

// Multer recibe las imágenes enviadas desde el panel.
const recibirFoto = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: maxBytesFoto,
    files: 1,
    fields: 8,
    parts: 9
  }
}).any();

// =====================================================
// VALIDACIÓN REAL DE ARCHIVOS DE IMAGEN
// =====================================================
//
// No confiamos solamente en la extensión del archivo.
// Revisamos sus primeros bytes.
//
// =====================================================

function extensionFoto(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return null;
  }

  // JPG
  if (
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'jpg';
  }

  // PNG
  if (
    buffer.subarray(0, 8).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
    )
  ) {
    return 'png';
  }

  // WEBP
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }

  return null;
}

// =====================================================
// VALIDAR NEGOCIOS CON FOTOGRAFÍAS LOCALES
// =====================================================
//
// Conserva la validación anterior de negocios.
// Además permite las nuevas rutas /api/imagenes/.
//
// =====================================================

function validarNegocioConFotoLocal(datos) {
  if (
    !datos ||
    typeof datos !== 'object' ||
    !imagenLocalValida.test(datos.foto || '')
  ) {
    return validarNegocio(datos);
  }

  const validado = validarNegocio({
    ...datos,
    foto: 'https://example.org/imagen-cerca.jpg'
  });

  if (validado) {
    validado.foto = datos.foto;
  }

  return validado;
}

// =====================================================
// NUEVA API: SUBIR FOTOGRAFÍA
// =====================================================
//
// POST /api/admin/imagenes
//
// Acepta FormData con una imagen.
//
// Campos admitidos para el archivo:
// foto, imagen, archivo o file.
//
// Campo opcional:
// negocioId
//
// Si viene negocioId, PostgreSQL actualiza
// la fotografía de ese negocio.
//
// Si no viene, la API devuelve la URL para que
// el panel la guarde con el resto del formulario.
//
// =====================================================

app.post(
  '/api/admin/imagenes',

  admin,

  (req, res, next) => {
    recibirFoto(req, res, error => {
      if (!error) return next();

      if (error.code === 'LIMIT_FILE_SIZE') {
        return err(
          res,
          'La fotografía supera el máximo de 5 MB.',
          413
        );
      }

      return err(
        res,
        'No se pudo procesar la fotografía: ' +
          error.message,
        400
      );
    });
  },

  wrap(async (req, res) => {
    const archivos = req.files || [];

    if (archivos.length !== 1) {
      return err(
        res,
        'Selecciona una fotografía JPG, PNG o WebP.'
      );
    }

    const archivo = archivos[0];
    const extension = extensionFoto(archivo.buffer);

    if (!extension || archivo.size > maxBytesFoto) {
      return err(
        res,
        'Imagen inválida. Se permiten JPG, PNG y WebP de hasta 5 MB.'
      );
    }

    // Identificamos a qué negocio corresponde.
    const idTexto =
      req.body?.negocioId ??
      req.body?.negocio_id ??
      null;

    const id =
      idTexto == null || String(idTexto).trim() === ''
        ? null
        : Number(idTexto);

    if (
      id !== null &&
      (!Number.isSafeInteger(id) || id < 1)
    ) {
      return err(res, 'El ID del negocio no es válido.');
    }

    // Nombre aleatorio para evitar sobrescribir fotografías.
    const nombre =
      `foto-${randomBytes(16).toString('hex')}.${extension}`;

    const url = `/api/imagenes/${nombre}`;

    // Crear carpeta si todavía no existe.
    await mkdir(carpetaFotos, {
      recursive: true
    });

    // Guardar físicamente la fotografía.
    const destino = join(carpetaFotos, nombre);

    await writeFile(
      destino,
      archivo.buffer,
      { flag: 'wx' }
    );

    // =================================================
    // GUARDAR RUTA EN POSTGRESQL
    // =================================================

    if (id !== null) {
      try {
        const { rowCount } = await db.query(
          `UPDATE negocios
           SET datos = jsonb_set(
             datos,
             '{foto}',
             to_jsonb($2::text),
             true
           ),
           actualizado_en = NOW()
           WHERE id = $1`,
          [id, url]
        );

        if (!rowCount) {
          // No dejamos archivos asociados a negocios inexistentes.
          await unlink(destino).catch(() => {});

          return err(
            res,
            'El negocio no existe en PostgreSQL.',
            404
          );
        }
      } catch (error) {
        // Si falla PostgreSQL, eliminamos el archivo recién creado.
        await unlink(destino).catch(() => {});

        throw error;
      }
    }

    // Devolvemos la ruta al frontend.
    res.status(201).json({
      ok: true,
      url,
      foto: url,
      ruta: url,
      imagen: url,
      negocioId: id,
      guardadoEnPostgresql: id !== null
    });
  })
);

// =====================================================
// SALUD DEL SERVIDOR Y POSTGRESQL
// =====================================================

app.get('/api/salud', wrap(async (_req, res) => {
  await db.query('SELECT 1');

  res.json({
    ok: true,
    postgresql: true
  });
}));

// =====================================================
// NEGOCIOS PÚBLICOS
// =====================================================

app.get('/api/negocios', wrap(async (_req, res) => {
  const { rows } = await db.query(
    `SELECT id, datos
     FROM negocios
     WHERE COALESCE(datos->>'publicado','true') <> 'false'
     ORDER BY id`
  );

  res.json(
    rows.map(r =>
      conCalidad({
        ...r.datos,
        id: Number(r.id)
      })
    ).sort(compararCalidadNegocios)
  );
}));

// =====================================================
// SUSCRIPCIONES
// =====================================================

app.post(
  '/api/suscripciones',
  sensitive,
  wrap(async (req, res) => {
    if (
      typeof req.body?.sitio_web_oculto === 'string' &&
      req.body.sitio_web_oculto.trim()
    ) {
      return err(res, 'No fue posible procesar.', 400);
    }

    const v = validarSuscriptor(req.body);

    if (!v) {
      return err(
        res,
        'Revisa contacto, frecuencia, comuna, intereses y consentimiento.'
      );
    }

    const token = randomBytes(32).toString('hex');
    const hash = createHash('sha256')
      .update(token)
      .digest('hex');

    const { rows } = await db.query(
      `INSERT INTO suscriptores
       (canal,nombre,contacto,comuna,intereses,
        intencion,frecuencia,contenido,
        consentimiento_en,baja_token_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),$9)
       ON CONFLICT (canal,contacto)
       DO UPDATE SET
         nombre=EXCLUDED.nombre,
         comuna=EXCLUDED.comuna,
         intereses=EXCLUDED.intereses,
         intencion=EXCLUDED.intencion,
         frecuencia=EXCLUDED.frecuencia,
         contenido=EXCLUDED.contenido,
         consentimiento_en=NOW(),
         consentimiento_version='v1',
         estado='pendiente_verificacion',
         baja_token_hash=EXCLUDED.baja_token_hash,
         actualizado_en=NOW()
       RETURNING id,estado`,
      [
        v.canal,
        v.nombre,
        v.contacto,
        v.comuna,
        v.intereses,
        v.intencion,
        v.frecuencia,
        v.contenido,
        hash
      ]
    );

    res.status(201).json({
      id: Number(rows[0].id),
      estado: rows[0].estado,
      mensaje: 'Preferencias recibidas. Pendiente de verificar el contacto.',
      tokenBaja: token
    });
  })
);

app.post(
  '/api/suscripciones/baja',
  sensitive,
  wrap(async (req, res) => {
    if (
      typeof req.body?.token !== 'string' ||
      !/^[a-f0-9]{64}$/.test(req.body.token)
    ) {
      return err(res, 'Token de baja inválido.');
    }

    const hash = createHash('sha256')
      .update(req.body.token)
      .digest('hex');

    await db.query(
      `UPDATE suscriptores
       SET estado='baja',actualizado_en=NOW()
       WHERE baja_token_hash=$1`,
      [hash]
    );

    res.json({
      ok: true,
      mensaje: 'Baja procesada, si el token existía.'
    });
  })
);

// =====================================================
// EVENTOS Y MÉTRICAS
// =====================================================

app.post('/api/eventos', wrap(async (req, res) => {
  const {
    tipo,
    negocioId,
    comuna,
    categoria
  } = req.body || {};

  if (!tiposEvento.includes(tipo)) {
    return err(res, 'Tipo de evento inválido.');
  }

  if (
    negocioId != null &&
    (!Number.isInteger(negocioId) || negocioId < 1)
  ) {
    return err(res, 'Negocio inválido.');
  }

  const id = negocioId == null ? null : negocioId;

  await db.query(
    `INSERT INTO eventos
     (tipo,negocio_id,comuna,categoria)
     VALUES ($1,$2,$3,$4)`,
    [
      tipo,
      id,
      typeof comuna === 'string'
        ? comuna.slice(0, 90)
        : null,
      typeof categoria === 'string'
        ? categoria.slice(0, 90)
        : null
    ]
  );

  res.status(201).json({ ok: true });
}));

// =====================================================
// OPINIONES PÚBLICAS
// =====================================================

app.get('/api/opiniones', wrap(async (req, res) => {
  const n = Number(req.query.negocioId);

  if (!Number.isInteger(n) || n < 1) {
    return err(res, 'Negocio inválido.');
  }

  const { rows } = await db.query(
    `SELECT id,
            negocio_id AS "negocioId",
            estrellas,motivos,comentario,
            creado_en AS fecha,estado,respuesta
     FROM opiniones
     WHERE negocio_id=$1
     ORDER BY actualizado_en DESC
     LIMIT 100`,
    [n]
  );

  res.json(
    rows.map(x => ({
      ...x,
      id: String(x.id),
      negocioId: Number(x.negocioId),
      dispositivo: ''
    }))
  );
}));

app.post(
  '/api/opiniones',
  sensitive,
  wrap(async (req, res) => {
    const v = validarOpinion(req.body);

    if (!v) {
      return err(
        res,
        'Completa las estrellas y al menos un motivo.'
      );
    }

    if (
      !process.env.JWT_SECRET ||
      process.env.JWT_SECRET.length < 32
    ) {
      return err(res, 'Servidor sin configurar.', 503);
    }

    const deviceHash = createHmac(
      'sha256',
      process.env.JWT_SECRET
    ).update(v.dispositivo).digest('hex');

    const { rows } = await db.query(
      `INSERT INTO opiniones
       (negocio_id,dispositivo_hash,estrellas,motivos,comentario)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT(negocio_id,dispositivo_hash)
       DO UPDATE SET
         estrellas=EXCLUDED.estrellas,
         motivos=EXCLUDED.motivos,
         comentario=EXCLUDED.comentario,
         actualizado_en=NOW()
       RETURNING id`,
      [
        v.negocioId,
        deviceHash,
        v.estrellas,
        v.motivos,
        v.comentario
      ]
    );

    res.status(201).json({
      id: String(rows[0].id),
      estado: 'registrada',
      advertencia: 'Opinión del dispositivo sin experiencia de compra verificada.'
    });
  })
);

// =====================================================
// ACCESO AL ADMINISTRADOR POR CÓDIGO TEMPORAL
// =====================================================

const adminEmail = () =>
  String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();

const respuestaSolicitud = {
  mensaje: 'Si el correo corresponde al administrador, recibirás un código para ingresar. Revisa también spam.',
  duracionSegundos: DURACION_CODIGO_SEGUNDOS
};

function correoConfigurado() {
  return (
    emailValido(adminEmail()) &&
    Boolean(
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM
    ) &&
    Boolean(
      process.env.JWT_SECRET &&
      process.env.JWT_SECRET.length >= 32
    )
  );
}

app.get('/api/admin/estado', (_req, res) => {
  res.set('Cache-Control', 'no-store').json({
    servicio: 'CERCA_ADMIN_OTP_V1',
    disponible: true,
    correoConfigurado: correoConfigurado()
  });
});

function transportarCorreo() {
  const puerto = Number(process.env.SMTP_PORT || 587);

  if (
    !Number.isInteger(puerto) ||
    puerto < 1 ||
    puerto > 65535
  ) {
    throw Error('Puerto SMTP incorrecto.');
  }

  const secure =
    String(process.env.SMTP_SECURE || 'false')
      .toLowerCase() === 'true';

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: puerto,
    secure,
    requireTLS: !secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: true
    }
  });
}

// =====================================================
// SOLICITAR CÓDIGO DE ACCESO
// =====================================================

app.post(
  '/api/admin/solicitar-codigo',
  limiteCorreoAdmin,
  wrap(async (req, res) => {
    res.set('Cache-Control', 'no-store');

    if (!correoConfigurado()) {
      return err(
        res,
        'El correo del administrador aún no está configurado en el servidor.',
        503
      );
    }

    const correo = normalizarCorreo(req.body?.email);

    if (!emailValido(correo)) {
      return err(
        res,
        'Introduce una dirección de correo válida.'
      );
    }

    if (correo !== adminEmail()) {
      return res.json(respuestaSolicitud);
    }

    const { rows: [limites] } = await db.query(
      `SELECT
         COUNT(*) FILTER (
           WHERE creado_en > NOW() - INTERVAL '15 minutes'
         )::int AS cantidad,
         MAX(creado_en) AS ultimo
       FROM codigos_acceso_admin
       WHERE correo=$1`,
      [correo]
    );

    if (
      limites.cantidad >= 3 ||
      (
        limites.ultimo &&
        Date.now() - new Date(limites.ultimo).getTime()
          < 60_000
      )
    ) {
      return res.json(respuestaSolicitud);
    }

    const codigo = String(
      randomInt(0, 100_000_000)
    ).padStart(8, '0');

    const sal = randomBytes(16).toString('hex');

    const hash = firmarCodigo(
      correo,
      sal,
      codigo,
      process.env.JWT_SECRET
    );

    const { rows: [registro] } = await db.query(
      `INSERT INTO codigos_acceso_admin
       (correo,sal,codigo_hash,expira_en)
       VALUES(
         $1,$2,$3,
         NOW() + INTERVAL '6 minutes'
       )
       RETURNING id`,
      [correo, sal, hash]
    );

    try {
      await transportarCorreo().sendMail({
        from: process.env.SMTP_FROM,
        to: correo,

        subject: 'CERCA.cl · Tu código de acceso (6 minutos)',

        text:
          `Tu código de acceso a la administración de CERCA.cl es: ${codigo}\n\n` +
          `Caduca en 6 minutos. Solo se puede usar una vez.\n` +
          `Si no solicitaste este código, ignora este mensaje.`,

        html:
          `<div style="font-family:Arial,sans-serif;max-width:500px;padding:24px">` +
          `<h2>Acceso a CERCA.cl</h2>` +
          `<p>Tu código temporal es:</p>` +
          `<p style="font-size:32px;font-weight:bold;letter-spacing:6px">${codigo}</p>` +
          `<p>Caduca en <strong>6 minutos</strong> y solo se puede usar una vez.</p>` +
          `<p>Si no lo solicitaste, ignora este correo.</p>` +
          `</div>`
      });

    } catch (error) {
      await db.query(
        'DELETE FROM codigos_acceso_admin WHERE id=$1',
        [registro.id]
      );

      console.error(
        'CERCA: envío SMTP de acceso fallido (revisa configuración y conexión).'
      );

      return err(
        res,
        'No se pudo enviar el correo. Verifica la configuración SMTP del servidor.',
        503
      );
    }

    await db.query(
      `UPDATE codigos_acceso_admin
       SET usado_en=NOW()
       WHERE correo=$1
       AND id<>$2
       AND usado_en IS NULL`,
      [correo, registro.id]
    );

    return res.json(respuestaSolicitud);
  })
);

// =====================================================
// VERIFICAR CÓDIGO DE ACCESO
// =====================================================

app.post(
  '/api/admin/verificar-codigo',
  limiteCodigoAdmin,
  wrap(async (req, res) => {
    res.set('Cache-Control', 'no-store');

    if (!correoConfigurado()) {
      return err(res, 'Administrador sin configurar.', 503);
    }

    const correo = normalizarCorreo(req.body?.email);
    const codigo = req.body?.codigo;

    if (
      !emailValido(correo) ||
      !codigoValido(codigo) ||
      correo !== adminEmail()
    ) {
      return err(res, 'Código inválido o vencido.', 401);
    }

    const cliente = await db.connect();

    try {
      await cliente.query('BEGIN');

      const { rows: [registro] } = await cliente.query(
        `SELECT id,sal,codigo_hash,intentos,usado_en,
                (expira_en > NOW()) AS vigente
         FROM codigos_acceso_admin
         WHERE correo=$1
         ORDER BY id DESC
         LIMIT 1
         FOR UPDATE`,
        [correo]
      );

      if (
        !registro ||
        registro.usado_en ||
        !registro.vigente ||
        registro.intentos >= 5
      ) {
        await cliente.query('COMMIT');

        return err(
          res,
          'Código inválido o vencido. Solicita uno nuevo.',
          401
        );
      }

      const calculado = Buffer.from(
        firmarCodigo(
          correo,
          registro.sal,
          codigo,
          process.env.JWT_SECRET
        ),
        'hex'
      );

      const esperado = Buffer.from(
        registro.codigo_hash,
        'hex'
      );

      const coincide =
        esperado.length === calculado.length &&
        timingSafeEqual(esperado, calculado);

      if (!coincide) {
        await cliente.query(
          `UPDATE codigos_acceso_admin
           SET intentos=intentos+1
           WHERE id=$1`,
          [registro.id]
        );

        await cliente.query('COMMIT');

        return err(
          res,
          'Código inválido o vencido.',
          401
        );
      }

      await cliente.query(
        `UPDATE codigos_acceso_admin
         SET usado_en=NOW(),
             intentos=intentos+1
         WHERE id=$1`,
        [registro.id]
      );

      await cliente.query('COMMIT');

      const token = jwt.sign(
        { role: 'admin' },
        process.env.JWT_SECRET,
        {
          algorithm: 'HS256',
          expiresIn: '4h'
        }
      );

      return res.json({
        token,
        expiresIn: 14400
      });

    } catch (e) {
      await cliente.query('ROLLBACK');
      throw e;

    } finally {
      cliente.release();
    }
  })
);

// =====================================================
// ADMINISTRACIÓN DE NEGOCIOS
// =====================================================

app.get(
  '/api/admin/negocios',
  admin,
  wrap(async (_req, res) => {
    const { rows } = await db.query(
      'SELECT id,datos FROM negocios ORDER BY id'
    );

    res.json(
      rows.map(r =>
        conCalidad({
          ...r.datos,
          id: Number(r.id)
        })
      )
    );
  })
);

// =====================================================
// IMPORTACIÓN DE NEGOCIOS
// =====================================================

app.post(
  '/api/admin/importar',
  admin,
  wrap(async (req, res) => {
    const lista = req.body?.negocios;

    if (
      !Array.isArray(lista) ||
      lista.length === 0 ||
      lista.length > 500
    ) {
      return err(res, 'Lista inválida (máximo 500).');
    }

    const datos = lista.map(validarNegocioConFotoLocal);

    if (
      datos.some(x =>
        !x ||
        !Number.isSafeInteger(x.id) ||
        x.id < 1
      )
    ) {
      return err(res, 'Uno o más anuncios inválidos.');
    }

    const client = await db.connect();

    try {
      await client.query('BEGIN');

      for (const n of datos) {
        const id = n.id;
        delete n.id;

        await client.query(
          `INSERT INTO negocios (id,datos)
           VALUES ($1,$2::jsonb)
           ON CONFLICT (id)
           DO UPDATE SET
             datos=EXCLUDED.datos,
             actualizado_en=NOW()`,
          [id, JSON.stringify(n)]
        );
      }

      await client.query(
        `SELECT setval(
          pg_get_serial_sequence('negocios','id'),
          (SELECT MAX(id) FROM negocios),
          true
        )`
      );

      await client.query('COMMIT');

    } catch (e) {
      await client.query('ROLLBACK');
      throw e;

    } finally {
      client.release();
    }

    res.json({
      importados: datos.length,
      mensaje: 'Importación realizada por administrador.'
    });
  })
);

// =====================================================
// REPUTACIÓN
// =====================================================

app.get('/api/reputacion/resumen', wrap(async (_req, res) => {
  const { rows } = await db.query(
    `SELECT
       negocio_id AS id,
       count(*)::int AS total,
       round(avg(estrellas)::numeric,2) AS promedio
     FROM opiniones
     GROUP BY negocio_id`
  );

  res.json(
    Object.fromEntries(
      rows.map(r => [
        Number(r.id),
        {
          total: r.total,
          promedio: Number(r.promedio)
        }
      ])
    )
  );
}));

app.get('/api/reputacion', wrap(async (_req, res) => {
  const { rows } = await db.query(
    `SELECT
       id,
       negocio_id AS "negocioId",
       estrellas,motivos,comentario,
       creado_en AS fecha,estado,respuesta
     FROM opiniones
     ORDER BY actualizado_en DESC
     LIMIT 2000`
  );

  res.json(
    rows.map(o => ({
      ...o,
      id: String(o.id),
      negocioId: Number(o.negocioId),
      dispositivo: ''
    }))
  );
}));

// =====================================================
// CREAR NEGOCIO
// =====================================================

app.post(
  '/api/admin/negocios',
  admin,
  wrap(async (req, res) => {
    const v = validarNegocioConFotoLocal(req.body);

    if (!v) {
      return err(res, 'Datos del negocio inválidos.');
    }

    delete v.id;

    const { rows } = await db.query(
      `INSERT INTO negocios(datos)
       VALUES ($1::jsonb)
       RETURNING id`,
      [JSON.stringify(v)]
    );

    res.status(201).json({
      ...v,
      id: Number(rows[0].id)
    });
  })
);

// =====================================================
// EDITAR NEGOCIO
// =====================================================

app.put(
  '/api/admin/negocios/:id',
  admin,
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    const v = validarNegocioConFotoLocal(req.body);

    if (
      !Number.isSafeInteger(id) ||
      id < 1 ||
      !v
    ) {
      return err(res, 'Datos inválidos.');
    }

    delete v.id;

    const { rows } = await db.query(
      `UPDATE negocios
       SET datos=$2::jsonb,
           actualizado_en=NOW()
       WHERE id=$1
       RETURNING id`,
      [id, JSON.stringify(v)]
    );

    if (!rows.length) {
      return err(res, 'Negocio no encontrado.', 404);
    }

    res.json({
      ...v,
      id
    });
  })
);

// =====================================================
// ELIMINAR NEGOCIO
// =====================================================

app.delete(
  '/api/admin/negocios/:id',
  admin,
  wrap(async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return err(res, 'Id inválido.');
    }

    const { rowCount } = await db.query(
      'DELETE FROM negocios WHERE id=$1',
      [id]
    );

    if (!rowCount) {
      return err(res, 'Negocio no encontrado.', 404);
    }

    res.json({ ok: true });
  })
);

// =====================================================
// ADMINISTRACIÓN DE SUSCRIPTORES
// =====================================================

app.get(
  '/api/admin/suscriptores',
  admin,
  wrap(async (req, res) => {
    const {
      estado,
      comuna,
      frecuencia,
      canal,
      intencion,
      interes
    } = req.query;

    const { rows } = await db.query(
      `SELECT
         id,nombre,canal,contacto,comuna,
         intereses,intencion,frecuencia,contenido,
         estado,consentimiento_en,creado_en
       FROM suscriptores
       WHERE ($1::text IS NULL OR estado=$1)
       AND ($2::text IS NULL OR comuna=$2)
       AND ($3::text IS NULL OR frecuencia=$3)
       AND ($4::text IS NULL OR canal=$4)
       AND ($5::text IS NULL OR intencion=$5)
       AND ($6::text IS NULL OR $6=ANY(intereses))
       ORDER BY creado_en DESC
       LIMIT 1000`,
      [
        estado || null,
        comuna || null,
        frecuencia || null,
        canal || null,
        intencion || null,
        interes || null
      ]
    );

    res.set('Cache-Control', 'no-store').json(rows);
  })
);

// =====================================================
// RESUMEN DEL ADMINISTRADOR
// =====================================================

app.get(
  '/api/admin/resumen',
  admin,
  wrap(async (req, res) => {
    const periodo =
      ['hoy','semana','mes','anio'].includes(req.query.periodo)
        ? req.query.periodo
        : 'mes';

    const comuna =
      typeof req.query.comuna === 'string' &&
      req.query.comuna.length <= 90
        ? req.query.comuna
        : 'Todas';

    const categoria =
      typeof req.query.categoria === 'string' &&
      req.query.categoria.length <= 90
        ? req.query.categoria
        : 'Todas';

    const inicio = {
      hoy: "date_trunc('day',now() AT TIME ZONE 'America/Santiago') AT TIME ZONE 'America/Santiago'",
      semana: "now() - interval '7 days'",
      mes: "now() - interval '30 days'",
      anio: "now() - interval '365 days'"
    }[periodo];

    const [
      eventos,
      negocios,
      suscripciones,
      opiniones
    ] = await Promise.all([
      db.query(
        `SELECT tipo,COUNT(*)::int AS total
         FROM eventos
         WHERE creado_en >= ${inicio}
         AND ($1='Todas' OR comuna=$1)
         AND ($2='Todas' OR categoria=$2)
         GROUP BY tipo`,
        [comuna, categoria]
      ),

      db.query(
        `SELECT count(*)::int AS total
         FROM negocios
         WHERE ($1='Todas' OR datos->>'comuna'=$1)
         AND ($2='Todas' OR datos->>'categoria'=$2)`,
        [comuna, categoria]
      ),

      db.query(
        `SELECT estado,COUNT(*)::int AS total
         FROM suscriptores
         WHERE ($1='Todas' OR comuna=$1)
         AND ($2='Todas' OR $2=ANY(intereses))
         GROUP BY estado`,
        [comuna, categoria]
      ),

      db.query(
        `SELECT
           COUNT(*)::int AS total,
           ROUND(AVG(o.estrellas)::numeric,2) AS promedio,
           COUNT(*) FILTER (WHERE o.estrellas<=2)::int AS reclamos,
           COUNT(*) FILTER (
             WHERE o.estrellas<=2
             AND o.estado='pendiente'
           )::int AS pendientes,
           COUNT(*) FILTER (
             WHERE o.estrellas>=4
           )::int AS felicitaciones
         FROM opiniones o
         INNER JOIN negocios n ON n.id=o.negocio_id
         WHERE o.creado_en >= ${inicio}
         AND ($1='Todas' OR n.datos->>'comuna'=$1)
         AND ($2='Todas' OR n.datos->>'categoria'=$2)`,
        [comuna, categoria]
      )
    ]);

    res.set('Cache-Control', 'no-store').json({
      periodo,
      comuna,
      categoria,
      negocios: negocios.rows[0].total,

      eventos: Object.fromEntries(
        eventos.rows.map(r => [r.tipo, r.total])
      ),

      suscripciones: Object.fromEntries(
        suscripciones.rows.map(r => [r.estado, r.total])
      ),

      reputacion: opiniones.rows[0]
    });
  })
);

// =====================================================
// EVENTOS ADMINISTRATIVOS
// =====================================================

app.get(
  '/api/admin/eventos',
  admin,
  wrap(async (req, res) => {
    const limit = Math.min(
      5000,
      Math.max(1, Number(req.query.limit) || 2500)
    );

    const { rows } = await db.query(
      `SELECT
         tipo,
         negocio_id AS "negocioId",
         comuna,
         categoria,
         creado_en AS fecha
       FROM eventos
       ORDER BY id DESC
       LIMIT $1`,
      [limit]
    );

    res.json(
      rows.reverse().map(e => ({
        ...e,
        negocioId:
          e.negocioId == null
            ? undefined
            : Number(e.negocioId)
      }))
    );
  })
);

// =====================================================
// MÓDULO NECESITO
// =====================================================

app.post(
  '/api/solicitudes',
  sensitive,
  wrap(async (req, res) => {
    const {
      texto,
      comuna,
      categoria
    } = req.body || {};

    if (
      typeof texto !== 'string' ||
      texto.trim().length < 5 ||
      texto.length > 500 ||
      typeof comuna !== 'string' ||
      !comuna.trim() ||
      comuna.length > 90 ||
      (
        categoria !== undefined &&
        (
          typeof categoria !== 'string' ||
          categoria.length > 90
        )
      )
    ) {
      return err(
        res,
        'Revisa la solicitud y la comuna.'
      );
    }

    const { rows } = await db.query(
      `INSERT INTO solicitudes
       (texto,comuna,categoria)
       VALUES ($1,$2,$3)
       RETURNING id`,
      [
        texto.trim(),
        comuna.trim(),
        (categoria || 'Por clasificar').trim()
      ]
    );

    res.status(201).json({
      id: Number(rows[0].id),
      estado: 'nueva'
    });
  })
);

app.get(
  '/api/admin/solicitudes',
  admin,
  wrap(async (_req, res) => {
    const { rows } = await db.query(
      `SELECT
         id,texto,comuna,categoria,
         estado,creado_en,actualizado_en
       FROM solicitudes
       ORDER BY id DESC
       LIMIT 1000`
    );

    res.set('Cache-Control', 'no-store').json(
      rows.map(r => ({
        ...r,
        id: Number(r.id)
      }))
    );
  })
);

app.put(
  '/api/admin/solicitudes/:id',
  admin,
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    const estado = req.body?.estado;

    if (
      !Number.isSafeInteger(id) ||
      id < 1 ||
      !['nueva','atendida','cerrada'].includes(estado)
    ) {
      return err(
        res,
        'Solicitud o estado inválidos.'
      );
    }

    const { rowCount } = await db.query(
      `UPDATE solicitudes
       SET estado=$2,actualizado_en=now()
       WHERE id=$1`,
      [id, estado]
    );

    if (!rowCount) {
      return err(res, 'Solicitud no encontrada.', 404);
    }

    res.json({ ok: true });
  })
);

// =====================================================
// OPINIONES ADMINISTRATIVAS
// =====================================================

app.get(
  '/api/admin/opiniones',
  admin,
  wrap(async (_req, res) => {
    const { rows } = await db.query(
      `SELECT
         id,
         negocio_id AS "negocioId",
         estrellas,motivos,comentario,
         creado_en AS fecha,estado,respuesta
       FROM opiniones
       ORDER BY id DESC
       LIMIT 2000`
    );

    res.json(
      rows.map(o => ({
        ...o,
        id: String(o.id),
        negocioId: Number(o.negocioId),
        dispositivo: ''
      }))
    );
  })
);

app.put(
  '/api/admin/opiniones/:id',
  admin,
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    const estado = req.body?.estado;
    const respuesta = req.body?.respuesta;

    if (
      !Number.isSafeInteger(id) ||
      id < 1 ||
      !['pendiente','resuelto'].includes(estado) ||
      typeof respuesta !== 'string' ||
      respuesta.length > 400
    ) {
      return err(
        res,
        'Respuesta/estado inválidos.'
      );
    }

    const { rowCount } = await db.query(
      `UPDATE opiniones
       SET estado=$2,
           respuesta=$3,
           actualizado_en=NOW()
       WHERE id=$1`,
      [id, estado, respuesta]
    );

    if (!rowCount) {
      return err(
        res,
        'Opinión no encontrada.',
        404
      );
    }

    res.json({ ok: true });
  })
);

// =====================================================
// CAMPAÑAS SEGMENTADAS
// =====================================================

app.get(
  '/api/admin/campanas',
  admin,
  wrap(async (_req, res) => {
    const { rows } = await db.query(
      'SELECT frecuencia,programacion FROM campanas'
    );

    res.json(
      Object.fromEntries(
        rows.map(r => [
          r.frecuencia,
          r.programacion
        ])
      )
    );
  })
);

app.put(
  '/api/admin/campanas/:frecuencia',
  admin,
  wrap(async (req, res) => {
    const f = req.params.frecuencia;
    const v = req.body;

    if (
      ![...frecuencias, 'anual'].includes(f) ||
      !v ||
      v.frecuencia !== f ||
      typeof v.hora !== 'string' ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(v.hora) ||
      typeof v.activa !== 'boolean'
    ) {
      return err(res, 'Configuración inválida.');
    }

    // Guarda únicamente la programación.
    // No envía mensajes automáticamente.
    await db.query(
      `INSERT INTO campanas
       (frecuencia,programacion)
       VALUES ($1,$2::jsonb)
       ON CONFLICT(frecuencia)
       DO UPDATE SET
         programacion=EXCLUDED.programacion,
         actualizado_en=NOW()`,
      [f, JSON.stringify(v)]
    );

    res.json({
      ok: true,
      enviosRealizados: 0
    });
  })
);

// =====================================================
// PANEL DE ADMINISTRACIÓN (mismo origen, nunca indexable)
// =====================================================

const carpetaPublica = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../frontend/public'
);

function archivoPrivado(nombre) {
  return (_req, res) => {
    res.set({
      'X-Robots-Tag': 'noindex, nofollow',
      'Cache-Control': 'no-store'
    });

    res.sendFile(join(carpetaPublica, nombre), e => {
      if (e && !res.headersSent) res.sendStatus(404);
    });
  };
}

app.get('/panel-admin.html', archivoPrivado('panel-admin.html'));
app.get('/admin.js', archivoPrivado('admin.js'));

// =====================================================
// API NO ENCONTRADA
// =====================================================

app.use('/api', (_req, res) => {
  return err(res, 'Ruta no encontrada.', 404);
});

// =====================================================
// PÁGINAS PÚBLICAS SEO: /comuna, /comuna/rubro, /comuna/rubro/negocio,
// sitemap.xml y robots.txt. Va después de la API y antes del manejador de errores.
// =====================================================

registerSeoPages(app, db);

// =====================================================
// MANEJO DE ERRORES
// =====================================================

app.use((error, _req, res, _next) => {
  console.error('API CERCA:', error.message);

  res.status(500).json({
    error: 'Ocurrió un error en el servidor. Revisa sus registros.'
  });
});

// =====================================================
// INICIAR SERVIDOR Y COMPROBAR POSTGRESQL
// =====================================================

const port = Number(process.env.PORT || 3100);

try {
  await requireCercaDatabase();

  app.listen(port, () => {
    console.log(
      `CERCA API conectada a la base cerca; puerto ${port}`
    );
  });

} catch (error) {
  console.error(
    'CERCA: no se pudo iniciar el servidor:',
    error.message
  );

  await db.end();

  process.exitCode = 1;
}

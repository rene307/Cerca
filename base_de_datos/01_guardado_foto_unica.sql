-- UNA FOTO por negocio. No requiere columna adicional: usa negocios.foto existente.
-- Esta tabla persiste los bytes convertidos a WEBP (útil en despliegues como Render).
-- Ejecuta solamente con copia de seguridad y apuntando a la BD correcta.
CREATE TABLE IF NOT EXISTS cerca_imagenes (
  id UUID PRIMARY KEY,
  mime_type TEXT NOT NULL CHECK (mime_type = 'image/webp'),
  contenido BYTEA NOT NULL,
  bytes INTEGER NOT NULL CHECK (bytes > 0 AND bytes <= 5242880),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

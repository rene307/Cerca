-- CERCA.cl - almacenamiento persistente: las imágenes se guardan en PostgreSQL
-- Ejecutar sobre la misma base de datos del backend antes de montar las rutas.
BEGIN;
CREATE TABLE IF NOT EXISTS cerca_imagenes (
  id UUID PRIMARY KEY,
  mime_type TEXT NOT NULL CHECK (mime_type = 'image/webp'),
  contenido BYTEA NOT NULL,
  bytes INTEGER NOT NULL CHECK (bytes > 0 AND bytes <= 5242880),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- IMPORTANTE: si la tabla real de fichas no se llama negocios,
-- adaptar el nombre antes de ejecutar estas tres sentencias.
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS fotos TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
UPDATE negocios SET fotos=ARRAY[foto] WHERE COALESCE(foto,'')<>'' AND cardinality(fotos)=0;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='negocios_max_tres_fotos') THEN
    ALTER TABLE negocios ADD CONSTRAINT negocios_max_tres_fotos CHECK (cardinality(fotos) <= 3);
  END IF;
END $$;
COMMIT;

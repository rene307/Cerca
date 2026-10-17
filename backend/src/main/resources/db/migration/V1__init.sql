CREATE EXTENSION IF NOT EXISTS postgis;
CREATE TABLE categorias (id BIGSERIAL PRIMARY KEY, nombre VARCHAR(90) NOT NULL UNIQUE);
CREATE TABLE negocios (
 id BIGSERIAL PRIMARY KEY,
 nombre VARCHAR(255) NOT NULL,
 categoria VARCHAR(255) NOT NULL,
 comuna VARCHAR(255) NOT NULL,
 direccion VARCHAR(255) NOT NULL,
 descripcion VARCHAR(500) NOT NULL,
 latitud NUMERIC(10,7) NOT NULL CHECK(latitud BETWEEN -90 AND 90),
 longitud NUMERIC(10,7) NOT NULL CHECK(longitud BETWEEN -180 AND 180),
 imagen_url VARCHAR(800) NOT NULL,
 telefono VARCHAR(255),
 publicado BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_negocios_publicados ON negocios(publicado,categoria,comuna);
-- Preparado para futura búsqueda espacial directa con ST_DWithin.
CREATE INDEX idx_negocios_geo ON negocios USING gist ((ST_SetSRID(ST_MakePoint(longitud::double precision,latitud::double precision),4326)::geography));
INSERT INTO categorias(nombre) VALUES ('Cafés'),('Bares'),('Peluquerías'),('Mascotas'),('Vulcanización'),('Tiendas'),('Servicios');

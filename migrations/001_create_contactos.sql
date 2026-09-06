CREATE SCHEMA IF NOT EXISTS {{schema}};

CREATE TABLE IF NOT EXISTS {{schema}}.contactos (
  id UUID PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(254) NOT NULL,
  asunto VARCHAR(150) NOT NULL,
  mensaje VARCHAR(2000) NOT NULL,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS contactos_fecha_creacion_idx
  ON {{schema}}.contactos (fecha_creacion DESC);

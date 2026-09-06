import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import pg from 'pg';

const { Pool } = pg;
const migrationUrl = new URL(
  '../../migrations/001_create_contactos.sql',
  import.meta.url,
);

function quoteIdentifier(identifier) {
  if (!/^[a-z][a-z0-9_]*$/.test(identifier)) {
    throw new Error(
      'DATABASE_SCHEMA debe comenzar con una letra y usar solo minúsculas, números o guiones bajos.',
    );
  }

  return `"${identifier}"`;
}

export function createContactStorage({
  connectionString,
  schema,
  ssl = false,
  pool,
}) {
  if (!pool && !connectionString) {
    throw new Error('DATABASE_URL es obligatoria para iniciar la aplicación.');
  }

  const quotedSchema = quoteIdentifier(schema);
  const tableName = `${quotedSchema}."contactos"`;
  const databasePool =
    pool ??
    new Pool({
      connectionString,
      ssl: ssl ? { rejectUnauthorized: false } : false,
      max: 5,
    });
  const ownsPool = pool === undefined;

  async function ensureStorage() {
    const migration = await readFile(migrationUrl, 'utf8');
    await databasePool.query(migration.replaceAll('{{schema}}', quotedSchema));
  }

  async function healthCheck() {
    await databasePool.query('SELECT 1');
  }

  async function readContacts() {
    const result = await databasePool.query(
      `SELECT
        id,
        nombre,
        correo,
        asunto,
        mensaje,
        fecha_creacion AS "fechaCreacion"
      FROM ${tableName}
      ORDER BY fecha_creacion DESC`,
    );
    return result.rows;
  }

  async function save(contact) {
    const id = randomUUID();
    const result = await databasePool.query(
      `INSERT INTO ${tableName}
        (id, nombre, correo, asunto, mensaje)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        nombre,
        correo,
        asunto,
        mensaje,
        fecha_creacion AS "fechaCreacion"`,
      [id, contact.nombre, contact.correo, contact.asunto, contact.mensaje],
    );
    return result.rows[0];
  }

  async function close() {
    if (ownsPool) {
      await databasePool.end();
    }
  }

  return {
    close,
    ensureStorage,
    healthCheck,
    readContacts,
    save,
  };
}

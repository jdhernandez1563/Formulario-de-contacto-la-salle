import process from 'node:process';
import dotenv from 'dotenv';

const validEnvironments = new Set(['development', 'test', 'production']);
const requestedEnvironment = process.env.NODE_ENV || 'development';

if (!validEnvironments.has(requestedEnvironment)) {
  throw new Error(
    `NODE_ENV debe ser development, test o production; se recibió "${requestedEnvironment}".`,
  );
}

dotenv.config({
  path: [`.env.${requestedEnvironment}`, '.env'],
  override: false,
  quiet: requestedEnvironment === 'production',
});

const defaults = {
  development: {
    port: 3000,
    databaseSchema: 'development',
    debug: true,
  },
  test: {
    port: 3001,
    databaseSchema: 'test',
    debug: false,
  },
  production: {
    port: 8080,
    databaseSchema: 'production',
    debug: false,
  },
};

function parsePort(value) {
  const port = Number(value);

  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('PORT debe ser un número entero entre 0 y 65535.');
  }

  return port;
}

function parseBoolean(value, fallback, variableName) {
  if (value === undefined) {
    return fallback;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new Error(`${variableName} debe ser true o false.`);
}

const environmentDefaults = defaults[requestedEnvironment];
const debug = parseBoolean(
  process.env.ENABLE_DEBUG,
  environmentDefaults.debug,
  'ENABLE_DEBUG',
);
const databaseSsl = parseBoolean(
  process.env.DATABASE_SSL,
  false,
  'DATABASE_SSL',
);

if (requestedEnvironment === 'production' && debug) {
  throw new Error('ENABLE_DEBUG no puede estar habilitado en producción.');
}

export const config = Object.freeze({
  environment: requestedEnvironment,
  port: parsePort(process.env.PORT ?? environmentDefaults.port),
  databaseUrl: process.env.DATABASE_URL,
  databaseSchema:
    process.env.DATABASE_SCHEMA || environmentDefaults.databaseSchema,
  databaseSsl,
  debug,
});

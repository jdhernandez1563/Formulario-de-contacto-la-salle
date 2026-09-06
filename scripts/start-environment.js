import process from 'node:process';

const environment = process.argv[2];
const validEnvironments = new Set(['development', 'test', 'production']);

if (!validEnvironments.has(environment)) {
  console.error('Uso: node scripts/start-environment.js <development|test|production>');
  process.exit(1);
}

process.env.NODE_ENV = environment;
await import('../src/server.js');

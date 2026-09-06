import { config } from '../src/config/environment.js';
import { createContactStorage } from '../src/services/contactStorage.js';

const storage = createContactStorage({
  connectionString: config.databaseUrl,
  schema: config.databaseSchema,
  ssl: config.databaseSsl,
});

try {
  await storage.ensureStorage();
  console.log(
    `Migración PostgreSQL aplicada al esquema ${config.databaseSchema}.`,
  );
} finally {
  await storage.close();
}

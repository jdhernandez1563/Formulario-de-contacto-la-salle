import { createApp } from './app.js';
import { config } from './config/environment.js';
import { createContactStorage } from './services/contactStorage.js';

const storage = createContactStorage({
  connectionString: config.databaseUrl,
  schema: config.databaseSchema,
  ssl: config.databaseSsl,
});
await storage.ensureStorage();

const app = createApp({ config, storage });
const server = app.listen(config.port, () => {
  console.log(
    `Formulario La Salle disponible en el puerto ${config.port} (${config.environment}).`,
  );

  if (config.debug) {
    console.log(`[debug] Esquema PostgreSQL: ${config.databaseSchema}`);
  }
});

function shutdown(signal) {
  console.log(`Señal ${signal} recibida. Cerrando servidor.`);
  server.close(async (error) => {
    try {
      await storage.close();
      process.exit(error ? 1 : 0);
    } catch (closeError) {
      console.error('No fue posible cerrar la conexión PostgreSQL.');
      process.exit(1);
    }
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

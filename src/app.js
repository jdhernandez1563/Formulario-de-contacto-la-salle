import express from 'express';
import path from 'node:path';
import { config as defaultConfig } from './config/environment.js';
import { createContactStorage } from './services/contactStorage.js';
import { normalizeContact, validateContact } from './utils/validation.js';

export function createApp({
  config = defaultConfig,
  storage = createContactStorage({
    connectionString: config.databaseUrl,
    schema: config.databaseSchema,
    ssl: config.databaseSsl,
  }),
} = {}) {
  const app = express();
  const frontendDirectory = path.resolve(
    process.cwd(),
    'frontend/dist/frontend/browser',
  );

  app.disable('x-powered-by');
  app.use((request, response, next) => {
    response.set({
      'Content-Security-Policy':
        "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:; font-src 'self'; form-action 'self'; base-uri 'self'",
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    });
    next();
  });
  app.use(express.json({ limit: '20kb' }));
  app.use(express.static(frontendDirectory));

  app.get('/api/health', async (request, response, next) => {
    try {
      await storage.healthCheck();
      return response.json({
        status: 'ok',
        environment: config.environment,
        database: 'connected',
      });
    } catch (error) {
      return next(error);
    }
  });

  app.post('/api/contactos', async (request, response, next) => {
    const contact = normalizeContact(request.body);
    const validation = validateContact(contact);

    if (!validation.isValid) {
      return response.status(400).json({
        success: false,
        message: 'Revisa los datos ingresados.',
        errors: validation.errors,
      });
    }

    try {
      const storedContact = await storage.save(contact);

      if (config.debug) {
        console.log('[debug] Contacto almacenado', {
          id: storedContact.id,
          environment: config.environment,
          databaseSchema: config.databaseSchema,
        });
      }

      return response.status(201).json({
        success: true,
        message: '¡Gracias! Tu mensaje fue enviado correctamente.',
        contactId: storedContact.id,
      });
    } catch (error) {
      return next(error);
    }
  });

  app.use((request, response) => {
    if (request.path.startsWith('/api/')) {
      return response.status(404).json({
        success: false,
        message: 'Recurso no encontrado.',
      });
    }

    return response.sendFile('index.html', { root: frontendDirectory });
  });

  app.use((error, request, response, next) => {
    if (response.headersSent) {
      return next(error);
    }

    if (config.debug) {
      console.error('[debug] Error procesando la solicitud', error);
    }

    return response.status(500).json({
      success: false,
      message: 'No fue posible procesar la solicitud. Inténtalo más tarde.',
    });
  });

  return app;
}

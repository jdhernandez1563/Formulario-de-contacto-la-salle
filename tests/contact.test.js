import assert from 'node:assert/strict';
import { before, beforeEach, describe, it } from 'node:test';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.ENABLE_DEBUG = 'false';

const { createApp } = await import('../src/app.js');
const { createContactStorage } =
  await import('../src/services/contactStorage.js');

const testConfig = {
  environment: 'test',
  port: 0,
  databaseSchema: 'test',
  databaseSsl: false,
  debug: false,
};
const contacts = [];
const pool = {
  async query(sql, parameters = []) {
    if (sql.includes('CREATE SCHEMA') || sql === 'SELECT 1') {
      return { rows: [] };
    }

    if (sql.includes('INSERT INTO')) {
      const storedContact = {
        id: parameters[0],
        nombre: parameters[1],
        correo: parameters[2],
        asunto: parameters[3],
        mensaje: parameters[4],
        fechaCreacion: new Date().toISOString(),
      };
      contacts.push(storedContact);
      return { rows: [storedContact] };
    }

    if (sql.includes('FROM "test"."contactos"')) {
      return { rows: [...contacts] };
    }

    throw new Error(`Consulta inesperada en la prueba: ${sql}`);
  },
};
const storage = createContactStorage({ schema: 'test', pool });
const app = createApp({ config: testConfig, storage });

const validContact = {
  nombre: 'Ana Lasallista',
  correo: 'ana@example.com',
  asunto: 'Información académica',
  mensaje: 'Deseo recibir información sobre los programas disponibles.',
};

describe('POST /api/contactos', () => {
  before(async () => {
    await storage.ensureStorage();
  });

  beforeEach(() => {
    contacts.length = 0;
  });

  it('a) procesa y almacena un formulario correcto', async () => {
    const response = await request(app)
      .post('/api/contactos')
      .send(validContact)
      .expect(201);

    assert.equal(response.body.success, true);
    assert.match(response.body.contactId, /^[0-9a-f-]{36}$/);

    assert.equal(contacts.length, 1);
    assert.equal(contacts[0].nombre, validContact.nombre);
    assert.equal(contacts[0].correo, validContact.correo);
  });

  it('b) rechaza un formulario con un campo obligatorio vacío', async () => {
    const response = await request(app)
      .post('/api/contactos')
      .send({ ...validContact, asunto: '   ' })
      .expect(400);

    assert.equal(response.body.success, false);
    assert.equal(response.body.errors.asunto, 'Este campo es obligatorio.');
    assert.equal(contacts.length, 0);
  });

  it('c) rechaza un formulario con correo electrónico inválido', async () => {
    const response = await request(app)
      .post('/api/contactos')
      .send({ ...validContact, correo: 'correo-invalido' })
      .expect(400);

    assert.equal(response.body.success, false);
    assert.equal(
      response.body.errors.correo,
      'Ingresa un correo electrónico válido.',
    );
    assert.equal(contacts.length, 0);
  });
});

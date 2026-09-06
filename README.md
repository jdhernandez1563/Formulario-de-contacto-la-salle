# Formulario de contacto Universidad de La Salle

Aplicación web multiambiente con frontend Angular 21, API Node.js/Express y
PostgreSQL. La interfaz utiliza el logo suministrado de la Universidad de La
Salle y su paleta institucional:

- Azul: `#113250`.
- Amarillo: `#F7A800`.

## Funcionalidad

- Formulario reactivo Angular con nombre, correo, asunto y mensaje.
- Validación de campos obligatorios, correo y longitudes en frontend y backend.
- Confirmación o error accesible en pantalla después del envío.
- Persistencia PostgreSQL separada por esquema para cada ambiente.
- Migración idempotente de la tabla `contactos`.
- Logs detallados habilitados solamente en desarrollo.
- Pruebas automatizadas de integración para los tres casos obligatorios.
- Blueprint de Render que crea y conecta automáticamente Render PostgreSQL.

## Requisitos

- Node.js 20.19 o superior.
- npm 10 o superior.
- PostgreSQL 14 o superior para ejecución local.

## Estructura

```text
formulario-contacto-la-salle/
├── frontend/
│   ├── public/
│   │   ├── favicon.ico
│   │   └── logo-universidad-de-la-salle.png
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── alert/           (alerta modal reutilizable)
│   │   │   │   ├── header/          (encabezado institucional)
│   │   │   │   ├── identity-panel/  (panel visual izquierdo)
│   │   │   │   ├── contact-form/    (formulario de contacto)
│   │   │   │   └── footer/          (pie de página)
│   │   │   ├── app.config.ts
│   │   │   ├── app.html
│   │   │   ├── app.scss
│   │   │   ├── app.ts
│   │   │   └── contact.service.ts
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── styles.scss
│   ├── angular.json
│   ├── package.json
│   ├── package-lock.json
│   ├── proxy.conf.json
│   └── tsconfig*.json
├── migrations/
│   └── 001_create_contactos.sql
├── scripts/
│   ├── development.js
│   ├── migrate.js
│   └── start-environment.js
├── src/
│   ├── config/environment.js
│   ├── services/contactStorage.js
│   ├── utils/validation.js
│   ├── app.js
│   └── server.js
├── tests/contact.test.js
├── .env.example
├── .env.development.example
├── .env.test.example
├── .env.production.example
├── package.json
├── package-lock.json
├── render.yaml
└── README.md
```

`node_modules/`, `frontend/node_modules/`, `frontend/dist/` y los archivos
`.env` reales no se versionan ni forman parte del entregable.

## Instalación

Desde la raíz del proyecto:

```bash
npm run setup
```

## Crear la base de datos local

Con PostgreSQL instalado, crear una base vacía:

```bash
createdb formulario_lasalle
```

Alternativamente:

```bash
psql -U postgres -c "CREATE DATABASE formulario_lasalle;"
```

La aplicación crea automáticamente el esquema, la tabla y el índice requeridos.

## Variables de entorno

| Variable          | Descripción                          | Ejemplo                                                        |
| ----------------- | ------------------------------------ | -------------------------------------------------------------- |
| `NODE_ENV`        | `development`, `test` o `production` | `development`                                                  |
| `PORT`            | Puerto HTTP de Express               | `3000`                                                         |
| `DATABASE_URL`    | URL privada de conexión PostgreSQL   | `postgresql://usuario:clave@localhost:5432/formulario_lasalle` |
| `DATABASE_SCHEMA` | Esquema aislado del ambiente         | `development`                                                  |
| `DATABASE_SSL`    | Activa TLS para la conexión          | `false`                                                        |
| `ENABLE_DEBUG`    | Habilita logs detallados             | `true`                                                         |

El backend carga primero `.env.<ambiente>` y después `.env`. Las variables
definidas directamente en el sistema tienen prioridad.

Nunca se debe confirmar un archivo `.env` al repositorio. Render inyecta
`DATABASE_URL` automáticamente y no almacena la contraseña en el código.

## Migración PostgreSQL

La migración `migrations/001_create_contactos.sql` crea:

- el esquema configurado en `DATABASE_SCHEMA`;
- la tabla `contactos`;
- un índice por fecha de creación.

Es idempotente, por lo que puede ejecutarse varias veces:

```bash
npm run migrate
```

El servidor también verifica la migración durante cada arranque.

## Desarrollo

Copiar y editar la configuración:

```bash
cp .env.development.example .env.development
```

```dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://usuario:contrasena@localhost:5432/formulario_lasalle
DATABASE_SCHEMA=development
DATABASE_SSL=false
ENABLE_DEBUG=true
```

Iniciar Angular y Express:

```bash
npm run dev
```

Abrir `http://localhost:4200`. Angular redirige `/api` al backend Express en
`http://localhost:3000`. Los registros se guardan en
`development.contactos`.

## Build del frontend Angular

```bash
npm run build
```

El resultado se genera en `frontend/dist/frontend/browser/`. Express sirve ese
directorio en pruebas y producción.

## Ambiente de pruebas

Para ejecutar manualmente el servidor de pruebas:

```bash
cp .env.test.example .env.test
npm run migrate
npm run build
npm run start:test
```

Abrir `http://localhost:3001`. Este ambiente usa `test.contactos`, separado de
desarrollo y producción.

### Pruebas automatizadas obligatorias

```bash
npm test
```

`tests/contact.test.js` comprueba:

1. Envío correcto: respuesta `201` y persistencia del contacto.
2. Campo obligatorio vacío: respuesta `400` y error asociado al campo.
3. Correo inválido: respuesta `400` y mensaje de formato.

Las pruebas inyectan un doble controlado del pool PostgreSQL, por lo que no
modifican datos de una base real ni requieren credenciales.

## Ambiente de producción

Fuera de Render, copiar y editar:

```bash
cp .env.production.example .env.production
npm run migrate
npm run build
npm run start:production
```

El ambiente usa `production.contactos`. La aplicación detiene el arranque si se
intenta usar `ENABLE_DEBUG=true` con `NODE_ENV=production`.

## Separación de ambientes

| Ambiente      | Esquema predeterminado | Debug         |
| ------------- | ---------------------- | ------------- |
| `development` | `development`          | Habilitado    |
| `test`        | `test`                 | Deshabilitado |
| `production`  | `production`           | Deshabilitado |

Para aislamiento máximo también se puede asignar un `DATABASE_URL` de una
instancia PostgreSQL diferente a cada ambiente. El esquema sigue protegiendo
contra cruces accidentales si varios ambientes comparten una instancia.

## Comprobaciones

```bash
npm run check
npm test
npm audit --omit=dev
npm --prefix frontend audit
```

`npm run check` valida la sintaxis del backend y produce un build Angular de
producción, incluyendo la comprobación estricta de TypeScript y plantillas.

## API

### Estado

```http
GET /api/health
```

```json
{
  "status": "ok",
  "environment": "development",
  "database": "connected"
}
```

El endpoint solo responde `200` cuando PostgreSQL acepta la consulta de salud.

### Enviar contacto

```http
POST /api/contactos
Content-Type: application/json
```

```json
{
  "nombre": "Ana Lasallista",
  "correo": "ana@example.com",
  "asunto": "Información académica",
  "mensaje": "Deseo conocer los programas disponibles."
}
```

Respuesta exitosa:

```json
{
  "success": true,
  "message": "¡Gracias! Tu mensaje fue enviado correctamente.",
  "contactId": "identificador-uuid"
}
```

## Despliegue en Render

`render.yaml` declara dos recursos:

1. El servicio web Node.js que compila Angular y ejecuta Express.
2. Una base administrada Render PostgreSQL.

Render asigna la cadena privada de la base a `DATABASE_URL` mediante
`fromDatabase`. El comando `preDeployCommand` ejecuta la migración antes de
publicar cada versión.

Pasos:

1. Subir el proyecto a un repositorio Git.
2. En Render, seleccionar **New > Blueprint**.
3. Conectar el repositorio que contiene `render.yaml`.
4. Revisar los recursos y aplicar el Blueprint.
5. Confirmar que `/api/health` devuelve `database: "connected"`.

No se necesita disco persistente: los contactos permanecen en PostgreSQL entre
despliegues y pueden ser consultados desde el panel de Render.

## Seguridad

- No se incluyen contraseñas, tokens ni credenciales reales.
- Los archivos `.env` están ignorados por Git.
- Las consultas usan parámetros PostgreSQL, no concatenan datos del formulario.
- El nombre de esquema se valida antes de construir identificadores SQL.
- El backend no registra nombres, correos ni mensajes.
- El cuerpo JSON está limitado a 20 KB.
- Producción no permite activar depuración detallada.

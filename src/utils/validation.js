const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const fieldLimits = {
  nombre: 100,
  correo: 254,
  asunto: 150,
  mensaje: 2000,
};

export function normalizeContact(payload = {}) {
  return {
    nombre: typeof payload.nombre === 'string' ? payload.nombre.trim() : '',
    correo:
      typeof payload.correo === 'string'
        ? payload.correo.trim().toLowerCase()
        : '',
    asunto: typeof payload.asunto === 'string' ? payload.asunto.trim() : '',
    mensaje: typeof payload.mensaje === 'string' ? payload.mensaje.trim() : '',
  };
}

export function validateContact(contact) {
  const errors = {};

  for (const [field, maxLength] of Object.entries(fieldLimits)) {
    if (!contact[field]) {
      errors[field] = 'Este campo es obligatorio.';
    } else if (contact[field].length > maxLength) {
      errors[field] = `No puede superar ${maxLength} caracteres.`;
    }
  }

  if (contact.correo && !emailPattern.test(contact.correo)) {
    errors.correo = 'Ingresa un correo electrónico válido.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

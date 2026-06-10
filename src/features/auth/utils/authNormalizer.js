// Tipos de documento disponibles para el registro
export const TIPOS_DOCUMENTO = {
  CC:        'Cédula de Ciudadanía',
  CE:        'Cédula de Extranjería',
  PASAPORTE: 'Pasaporte',
  PEP:       'Permiso Especial de Permanencia',
};

// Placeholder de ejemplo por tipo de documento
export const DOC_PLACEHOLDERS = {
  CC:        'Ej: 12345678',
  CE:        'Ej: 123456789012',
  PASAPORTE: 'Ej: AB123456',
  PEP:       'Ej: PEP2023001',
};

// Devuelve el estado inicial del formulario de registro
export const getRegisterInitialData = () => ({
  nombre:             '',
  apellido:           '',
  correo:             '',
  telefono:           '',
  fechaNacimiento:    '',
  tipoDocumento:      'CC',
  numeroDocumento:    '',
  contrasenia:        '',
  confirmContrasenia: '',
  agreeTerms:         false,
});

// Arma el payload con snake_case para el endpoint de registro
export const buildRegisterPayload = (formData) => ({
  nombre:           formData.nombre,
  apellido:         formData.apellido,
  correo:           formData.correo,
  contrasenia:      formData.contrasenia,
  numeroDocumento: formData.numeroDocumento,  // correcto
  fechaNacimiento: formData.fechaNacimiento,  // correcto  
  tipoDocumento:   formData.tipoDocumento,    // correcto
  telefono:         formData.telefono,
});

// Normaliza el error de login según el status y mensaje del backend
export const normalizeLoginError = (err) => {
  const status  = err.response?.status;
  const mensaje = err.response?.data?.error || err.message || '';

  if (mensaje.includes('inactiva')) return 'Tu cuenta está inactiva. Contacta al administrador.';
  if (status === 401) return 'Correo o contraseña incorrectos';
  if (status >= 500) return 'Error del servidor. Intenta más tarde.';
  return mensaje || 'Correo o contraseña incorrectos';
};

// Normaliza error de registro
export const normalizeRegisterError = (err) => {
  const mensaje = err.response?.data?.error || err.message || '';

  if (mensaje.includes('correo ya está registrado'))
    return 'Este correo ya está registrado. Inicia sesión o usa otro correo.';
  if (mensaje.includes('documento'))
    return 'Este número de documento ya está registrado.';
  if (mensaje.includes('Código'))
    return 'Código de verificación incorrecto o expirado.';
  return mensaje || 'Error en el registro. Intenta de nuevo.';
};

// Normaliza error de recuperación
export const normalizeForgotError = (err) => {
  const mensaje = err.response?.data?.error || err.message || '';

  if (mensaje.includes('empleado'))
    return 'Esta función solo está disponible para empleados.';
  if (mensaje.includes('Código'))
    return 'Código incorrecto o expirado. Solicita uno nuevo.';
  return mensaje || 'Error al recuperar contraseña. Intenta de nuevo.';
};

// Indica si el error de reset proviene de un código inválido
export const isInvalidCodeError = (err) => {
  const mensaje = err.response?.data?.error || '';
  return mensaje.includes('Código') || mensaje.includes('código');
};
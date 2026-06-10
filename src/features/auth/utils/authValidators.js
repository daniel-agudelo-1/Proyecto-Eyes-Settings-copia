const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Lista de patrones débiles comunes
const WEAK_PATTERNS = [
  'password', 'contraseña', '123456', '12345678', '12345', '123456789',
  'qwerty', 'abc123', 'admin', 'letmein', 'welcome', 'monkey', 'dragon',
  'master', 'hello', 'football', 'baseball', 'shadow', 'sunshine'
];

const DOC_VALIDATIONS = {
  CC:        /^\d{8,10}$/,
  CE:        /^\d{6,12}$/,
  PASAPORTE: /^[A-Z0-9]{6,12}$/,
  PEP:       /^[A-Z0-9]{6,15}$/,
};

const DOC_ERRORS = {
  CC:        'La cédula debe tener entre 8 y 10 dígitos',
  CE:        'La cédula de extranjería debe tener entre 6 y 12 dígitos',
  PASAPORTE: 'El pasaporte debe tener entre 6 y 12 caracteres alfanuméricos',
  PEP:       'El PEP debe tener entre 6 y 15 caracteres alfanuméricos',
};

// ============================================================
// FUNCIONES DE VALIDACIÓN DE FORTALEZA DE CONTRASEÑA
// ============================================================

// Detectar secuencias (abc, 123, qwert, etc.)
const hasSequence = (str, len = 3) => {
  const lower = str.toLowerCase();
  for (let i = 0; i <= lower.length - len; i++) {
    const sub = lower.slice(i, i + len);
    // Secuencia numérica ascendente
    if (/^[0-9]{3}$/.test(sub) && parseInt(sub[2]) === parseInt(sub[1]) + 1 && parseInt(sub[1]) === parseInt(sub[0]) + 1) return true;
    // Secuencia numérica descendente
    if (/^[0-9]{3}$/.test(sub) && parseInt(sub[2]) === parseInt(sub[1]) - 1 && parseInt(sub[1]) === parseInt(sub[0]) - 1) return true;
    // Secuencia alfabética ascendente (abc, bcd)
    if (/^[a-z]{3}$/.test(sub) && sub.charCodeAt(2) === sub.charCodeAt(1) + 1 && sub.charCodeAt(1) === sub.charCodeAt(0) + 1) return true;
    // Secuencia alfabética descendente (cba, zyx)
    if (/^[a-z]{3}$/.test(sub) && sub.charCodeAt(2) === sub.charCodeAt(1) - 1 && sub.charCodeAt(1) === sub.charCodeAt(0) - 1) return true;
    // Teclado QWERTY
    const qwertyRows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
    for (const row of qwertyRows) {
      if (row.includes(sub)) return true;
    }
  }
  return false;
};

// Detectar repeticiones (aaaa, 1111)
const hasRepetition = (str, len = 3) => {
  const regex = new RegExp(`(.)\\1{${len - 1},}`);
  return regex.test(str);
};

// Detectar si contiene nombre, apellido o parte del correo
const containsPersonalInfo = (password, nombre, apellido, correo) => {
  const lowerPass = password.toLowerCase();
  const personal = [nombre, apellido, correo?.split('@')[0]].filter(Boolean).map(s => s.toLowerCase());
  for (const word of personal) {
    if (word && word.length >= 3 && lowerPass.includes(word)) return true;
  }
  return false;
};

// Función principal: contraseña fuerte
export const isStrongPassword = (password, nombre = '', apellido = '', correo = '') => {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  // Opcional: exigir al menos un símbolo (descomentar si se desea)
  // if (!/[^A-Za-z0-9]/.test(password)) return false;
  if (WEAK_PATTERNS.some(p => password.toLowerCase().includes(p))) return false;
  if (hasSequence(password)) return false;
  if (hasRepetition(password)) return false;
  if (containsPersonalInfo(password, nombre, apellido, correo)) return false;
  return true;
};

// ============================================================
// CÁLCULO DE EDAD
// ============================================================
export const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return 0;
  const hoy = new Date();
  const birth = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - birth.getFullYear();
  const diff = hoy.getMonth() - birth.getMonth();
  if (diff < 0 || (diff === 0 && hoy.getDate() < birth.getDate())) edad--;
  return edad;
};

// ============================================================
// VALIDACIÓN DE LOGIN
// ============================================================
export const validateLoginForm = (correo, contrasenia) => {
  if (!correo?.trim() || !contrasenia?.trim())
    return 'Ingresa correo y contraseña para continuar';
  if (!EMAIL_REGEX.test(correo))
    return 'Ingresa un correo electrónico válido';
  if (contrasenia.length < 6)
    return 'La contraseña debe tener al menos 6 caracteres';
  return null;
};

// ============================================================
// VALIDACIÓN DE REGISTRO
// ============================================================
export const validateRegisterForm = (formData) => {
  const errors = {};

  // Nombre
  if (!formData.nombre?.trim())
    errors.nombre = 'El nombre es requerido';

  // Apellido
  if (!formData.apellido?.trim())
    errors.apellido = 'El apellido es requerido';

  // Correo
  if (!formData.correo?.trim())
    errors.correo = 'El correo electrónico es requerido';
  else if (!EMAIL_REGEX.test(formData.correo))
    errors.correo = 'Ingresa un correo electrónico válido';

  // Fecha de nacimiento
  if (!formData.fechaNacimiento)
    errors.fechaNacimiento = 'La fecha de nacimiento es obligatoria';
  else if (calcularEdad(formData.fechaNacimiento) < 18)
    errors.fechaNacimiento = 'Debes ser mayor de 18 años para registrarte';

  // Tipo documento
  if (!formData.tipoDocumento)
    errors.tipoDocumento = 'Selecciona un tipo de documento';

  // Número documento
  if (!formData.numeroDocumento?.trim()) {
    errors.numeroDocumento = 'El número de documento es requerido';
  } else if (
    formData.tipoDocumento &&
    DOC_VALIDATIONS[formData.tipoDocumento] &&
    !DOC_VALIDATIONS[formData.tipoDocumento].test(formData.numeroDocumento)
  ) {
    errors.numeroDocumento = DOC_ERRORS[formData.tipoDocumento];
  }

  // Contraseña (validación mejorada)
  if (!formData.contrasenia) {
    errors.contrasenia = 'La contraseña es requerida';
  } else if (!isStrongPassword(formData.contrasenia, formData.nombre, formData.apellido, formData.correo)) {
    errors.contrasenia = 'La contraseña debe tener al menos 8 caracteres, incluir mayúscula, minúscula, número, y no ser una contraseña común (ej: 12345678, password) ni contener tu nombre o correo.';
  }

  // Confirmar contraseña
  if (formData.contrasenia !== formData.confirmContrasenia)
    errors.confirmContrasenia = 'Las contraseñas no coinciden';

  // Términos
  if (!formData.agreeTerms)
    errors.agreeTerms = 'Debes aceptar los términos y condiciones';

  return errors;
};

// ============================================================
// VALIDACIÓN DE RECUPERACIÓN
// ============================================================
export const validateForgotEmail = (correo) => {
  if (!correo?.trim()) return 'Ingresa tu correo electrónico';
  if (!EMAIL_REGEX.test(correo)) return 'Ingresa un correo electrónico válido';
  return null;
};

export const validateOtpCode = (codigo) => {
  if (!codigo?.trim() || codigo.length !== 6) return 'Ingresa el código de 6 dígitos';
  return null;
};

export const validateResetPassword = (nuevaContrasenia, confirmarContrasenia, nombre = '', apellido = '', correo = '') => {
  if (!nuevaContrasenia?.trim())
    return 'Ingresa tu nueva contraseña';
  if (!isStrongPassword(nuevaContrasenia, nombre, apellido, correo)) {
    return 'La contraseña debe tener al menos 8 caracteres, incluir mayúscula, minúscula, número, y no ser una contraseña común ni contener tu nombre o correo.';
  }
  if (nuevaContrasenia !== confirmarContrasenia)
    return 'Las contraseñas no coinciden';
  return null;
};
// ============================
// Validación de documento por tipo
// ============================
export const validateDocumento = (tipoDocumento, numero_documento) => {
  const doc = numero_documento?.trim() || '';
  
  if (!doc) {
    return { isValid: false, message: "El número de documento es requerido" };
  }

  if (tipoDocumento === "CC" || tipoDocumento === "CE") {
    if (!/^[0-9]{6,10}$/.test(doc)) {
      return { isValid: false, message: "Documento inválido (6-10 dígitos)" };
    }
  } else if (tipoDocumento === "PA") {
    if (!/^[A-Za-z0-9]{6,12}$/.test(doc)) {
      return { isValid: false, message: "Pasaporte inválido (6-12 caracteres)" };
    }
  }

  return { isValid: true, message: "" };
};

// ============================
// Validación de teléfono
// ============================
export const validateTelefono = (telefono) => {
  const telefonoRegex = /^[0-9]{7,15}$/;
  const cleaned = telefono?.replace(/\s/g, "") || '';
  
  if (!cleaned) {
    return { isValid: false, message: "El teléfono es requerido" };
  }
  
  if (!telefonoRegex.test(cleaned)) {
    return { isValid: false, message: "Teléfono inválido (7-15 dígitos)" };
  }
  
  return { isValid: true, message: "" };
};

// ============================
// Validación de email
// ============================
export const validateEmail = (correo) => {
  if (!correo) return { isValid: true, message: "" };
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(correo)) {
    return { isValid: false, message: "Formato de email inválido" };
  }
  
  return { isValid: true, message: "" };
};

// ============================
// Validación de fecha de ingreso
// ============================
export const validateFechaIngreso = (fecha_ingreso) => {
  if (!fecha_ingreso) {
    return { isValid: false, message: "La fecha de ingreso es requerida" };
  }
  
  const fechaIngreso = new Date(fecha_ingreso);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  if (fechaIngreso > hoy) {
    return { isValid: false, message: "La fecha no puede ser futura" };
  }
  
  return { isValid: true, message: "" };
};

// ============================
// Validación de nombre
// ============================
export const validateNombre = (nombre) => {
  const trimmed = nombre?.trim() || '';
  
  if (!trimmed) {
    return { isValid: false, message: "El nombre es requerido" };
  }
  
  if (trimmed.length < 3) {
    return { isValid: false, message: "Mínimo 3 caracteres" };
  }
  
  return { isValid: true, message: "" };
};

// ============================
// Validación de apellido
// ============================
export const validateApellido = (apellido) => {
  const trimmed = apellido?.trim() || '';
  
  if (!trimmed) {
    return { isValid: false, message: "El apellido es requerido" };
  }
  
  if (trimmed.length < 3) {
    return { isValid: false, message: "Mínimo 3 caracteres" };
  }
  
  return { isValid: true, message: "" };
};

// ============================
// Normalizar empleado (API -> Formulario)
// ============================
export const normalizeEmpleadoForForm = (empleado) => ({
  id: empleado.id,
  nombre: empleado.nombre || "",
  apellido: empleado.apellido || "",
  tipoDocumento: empleado.tipo_documento || empleado.tipoDocumento || "CC",
  numero_documento: empleado.numero_documento || "",
  telefono: empleado.telefono || "",
  correo: empleado.correo || empleado.email || "",
  direccion: empleado.direccion || "",
  fecha_ingreso: empleado.fecha_ingreso || "",
  cargo: empleado.cargo || "",
  estado: empleado.estado === true ? "activo" : "inactivo"
});

// ============================
// Opciones de select
// ============================
export const tipoDocumentoOptions = [
  { value: "CC", label: "Cédula de Ciudadanía" },
  { value: "CE", label: "Cédula de Extranjería" },
  { value: "PA", label: "Pasaporte" },
];

export const cargoOptions = [
  { value: "", label: "-- Seleccione un cargo --" },
  { value: "Optómetra", label: "Optómetra" },
  { value: "Recepcionista", label: "Recepcionista" },
];

export const estadoOptions = [
  { value: "activo", label: "Activo" },
  { value: "inactivo", label: "Inactivo" },
];
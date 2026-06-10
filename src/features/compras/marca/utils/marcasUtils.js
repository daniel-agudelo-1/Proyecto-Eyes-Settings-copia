// ============================
// Formatear nombre (primera letra mayúscula)
// ============================
export const formatNombre = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// ============================
// Validar nombre de marca
// ============================
export const validateNombre = (nombre, nombreExists) => {
  const trimmed = nombre?.trim() || '';
  
  if (!trimmed) {
    return { isValid: false, message: "El nombre de la marca es requerido" };
  }
  if (trimmed.length < 2) {
    return { isValid: false, message: "El nombre debe tener al menos 2 caracteres" };
  }
  if (trimmed.length > 50) {
    return { isValid: false, message: "El nombre no puede exceder 50 caracteres" };
  }
  if (nombreExists) {
    return { isValid: false, message: "Ya existe una marca con este nombre" };
  }
  
  return { isValid: true, message: "" };
};

// ============================
// Normalizar marca para formulario
// ============================
export const normalizeMarcaForForm = (marca) => ({
  id: marca.id,
  nombre: marca.nombre || "",
  estado: typeof marca.estado === 'boolean' 
    ? marca.estado 
    : marca.estado === 'activa'
});

// ============================
// Normalizar marca para listado
// ============================
export const normalizeMarcaForList = (marca) => ({
  id: marca.id,
  nombre: marca.nombre,
  estado: marca.estado ? 'activa' : 'inactiva',
  estadosDisponibles: ['activa', 'inactiva'] 
});

// ============================
// Opciones de estado (para formulario)
// ============================
export const estadoOptions = [
  { value: true, label: "Activa" },
  { value: false, label: "Inactiva" }
];

// ============================
// Columnas de tabla
// ============================
export const columns = [
  { field: "nombre", header: "Nombre" }
];
import api from "../../../../lib/axios";

// ============================
// Obtener todos los empleados
// ============================
export async function getAllEmpleados() {
  const res = await api.get("/empleados");
  return res.data;
}

// ============================
// Obtener empleado por ID
// ============================
export async function getEmpleadoById(id) {
  if (!id || isNaN(Number(id))) {
    console.error("ID inválido:", id);
    return null;
  }
  try {
    const res = await api.get(`/empleados/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error al obtener empleado por ID:", error);
    return null;
  }
}

// ============================
// Crear empleado
// ============================
export async function createEmpleado(data) {
  const payload = {
    nombre: data.nombre,
    apellido: data.apellido,
    tipo_documento: data.tipoDocumento,
    numero_documento: data.numero_documento,
    telefono: data.telefono,
    correo: data.correo,
    direccion: data.direccion,
    fecha_ingreso: data.fecha_ingreso,
    cargo: data.cargo,
    estado: data.estado === "activo"
  };

  try {
    const res = await api.post("/empleados", payload);
    return res.data;
  } catch (error) {
    const mensaje = error.response?.data?.error || error.response?.data?.message || "Error al crear el empleado";
    throw new Error(mensaje);
  }
}

// ============================
// Actualizar empleado
// ============================
export async function updateEmpleado(id, data) {
  if (!id || isNaN(Number(id))) {
    throw new Error("ID de empleado inválido");
  }
  const payload = {
    nombre: data.nombre,
    apellido: data.apellido,
    tipo_documento: data.tipoDocumento,
    numero_documento: data.numero_documento,
    telefono: data.telefono,
    correo: data.correo,
    direccion: data.direccion,
    fecha_ingreso: data.fecha_ingreso,
    cargo: data.cargo,
    estado: data.estado === "activo"
  };

  try {
    const res = await api.put(`/empleados/${id}`, payload);
    return res.data;
  } catch (error) {
    const mensaje = error.response?.data?.error || error.response?.data?.message || "Error al actualizar el empleado";
    throw new Error(mensaje);
  }
}

// ============================
// Eliminar empleado
// ============================
export async function deleteEmpleado(id) {
  if (!id || isNaN(Number(id))) {
    throw new Error("ID de empleado inválido");
  }
  try {
    const res = await api.delete(`/empleados/${id}`);
    return res.data;
  } catch (error) {
    const mensaje = error.response?.data?.error || error.response?.data?.message || "Error al eliminar el empleado";
    throw new Error(mensaje);
  }
}

// ============================
// Cambiar estado empleado
// ============================
export async function updateEstadoEmpleado(id, nuevoEstado) {
  if (!id || isNaN(Number(id))) {
    throw new Error("ID de empleado inválido");
  }
  const payload = {
    estado: nuevoEstado === "activo"
  };

  try {
    const res = await api.put(`/empleados/${id}`, payload);
    return res.data;
  } catch (error) {
    const mensaje = error.response?.data?.error || error.response?.data?.message || "Error al cambiar el estado del empleado";
    throw new Error(mensaje);
  }
}

// ============================
// Verificar si documento ya existe
// ============================
export async function checkDocumentoExists(numero_documento, excludeId = null) {
  try {
    const empleados = await getAllEmpleados();
    return empleados.some(empleado => {
      const docMatch = empleado.numero_documento === numero_documento;
      if (excludeId && empleado.id === parseInt(excludeId)) {
        return false;
      }
      return docMatch;
    });
  } catch (error) {
    console.error("Error al verificar documento:", error);
    return false;
  }
}

// ============================
// Verificar si email ya existe
// ============================
export async function checkEmailExists(correo, excludeId = null) {
  try {
    const empleados = await getAllEmpleados();
    return empleados.some(empleado => {
      const emailMatch = empleado.correo === correo;
      if (excludeId && empleado.id === parseInt(excludeId)) {
        return false;
      }
      return emailMatch;
    });
  } catch (error) {
    console.error("Error al verificar email:", error);
    return false;
  }
}
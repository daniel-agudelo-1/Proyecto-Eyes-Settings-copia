import api from "../../../../lib/axios";

// ============================
// Obtener todas las citas con paginación y filtros
// ============================
export async function getAllCitas({
  page = 1,
  perPage = 10,
  search = "",
  estado_cita_id = "",
}) {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("per_page", perPage);
  if (search) params.append("search", search);
  if (estado_cita_id) params.append("estado_cita_id", estado_cita_id);

  const res = await api.get(`/citas?${params.toString()}`);
  return res.data; // { data, total, page, per_page, total_pages }
}

// ============================
// Obtener cita por ID
// ============================
export async function getCitaById(id) {
  try {
    const res = await api.get(`/citas/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error al obtener cita por ID:", error);
    return null;
  }
}

// ============================
// Verificar disponibilidad
// ============================
export async function verificarDisponibilidad(empleadoId, fecha, hora, duracion = 30, excludeCitaId = null) {
  try {
    let fechaFormateada;
    if (fecha instanceof Date) {
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      fechaFormateada = `${year}-${month}-${day}`;
    } else {
      fechaFormateada = fecha;
    }

    let horaFormateada;
    if (hora instanceof Date) {
      const hours = String(hora.getHours()).padStart(2, '0');
      const minutes = String(hora.getMinutes()).padStart(2, '0');
      horaFormateada = `${hours}:${minutes}`;
    } else if (typeof hora === 'string' && hora.includes('T')) {
      const dateObj = new Date(hora);
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      horaFormateada = `${hours}:${minutes}`;
    } else {
      horaFormateada = hora;
    }

    const params = {
      empleado_id: empleadoId,
      fecha: fechaFormateada,
      hora: horaFormateada,
      duracion: duracion
    };
    if (excludeCitaId) params.exclude_cita_id = excludeCitaId;
    
    const res = await api.get("/verificar-disponibilidad", { params });
    return { success: true, data: res.data };
  } catch (error) {
    console.error("Error verificando disponibilidad:", error);
    const errorMsg = error.response?.data?.mensaje || error.response?.data?.error || "Error al verificar disponibilidad";
    return { success: false, error: errorMsg };
  }
}

// ============================
// Crear cita
// ============================
export async function createCita(data) {
  const payload = {
    cliente_id: data.cliente_id,
    servicio_id: data.servicio_id,
    empleado_id: data.empleado_id,
    estado_cita_id: data.estado_cita_id,
    metodo_pago: data.metodo_pago,
    hora: data.hora,
    duracion: data.duracion,
    fecha: data.fecha
  };

  try {
    const res = await api.post("/citas", payload);
    return { success: true, data: res.data };
  } catch (error) {
    if (error.response?.data) {
      const errorData = error.response.data;
      return { 
        success: false, 
        error: errorData.error,
        codigo: errorData.codigo,
        horario: errorData.horario_inicio ? {
          inicio: errorData.horario_inicio,
          fin: errorData.horario_fin
        } : null
      };
    }
    throw error;
  }
}

// ============================
// Actualizar cita completa
// ============================
export async function updateCita(id, data) {
  const payload = {
    cliente_id: data.cliente_id,
    servicio_id: data.servicio_id,
    empleado_id: data.empleado_id,
    estado_cita_id: data.estado_cita_id,
    metodo_pago: data.metodo_pago,
    hora: data.hora,
    duracion: data.duracion,
    fecha: data.fecha
  };

  try {
    const res = await api.put(`/citas/${id}`, payload);
    return { success: true, data: res.data };
  } catch (error) {
    if (error.response?.data) {
      const errorData = error.response.data;
      return { 
        success: false, 
        error: errorData.error,
        codigo: errorData.codigo
      };
    }
    throw error;
  }
}

// ============================
// Actualizar solo el estado de la cita
// ============================
export async function updateCitaStatus(id, estado_cita_id) {
  const citaActual = await getCitaById(id);
  if (!citaActual) {
    throw new Error("No se pudo obtener la cita actual");
  }
  
  const payload = {
    cliente_id: citaActual.cliente_id,
    servicio_id: citaActual.servicio_id,
    empleado_id: citaActual.empleado_id,
    estado_cita_id: estado_cita_id,
    metodo_pago: citaActual.metodo_pago,
    hora: citaActual.hora,
    duracion: citaActual.duracion,
    fecha: citaActual.fecha
  };

  const res = await api.put(`/citas/${id}`, payload);
  return res.data;
}

// ============================
// Eliminar cita
// ============================
export async function deleteCita(id) {
  const res = await api.delete(`/citas/${id}`);
  return res.data;
}
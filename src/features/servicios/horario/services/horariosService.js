import api from "../../../../lib/axios";

export async function getAllHorarios() {
  try {
    const res = await api.get("/horario");
    // El backend devuelve un array de horarios
    return res.data || [];
  } catch (error) {
    console.error("Error cargando horarios:", error);
    return [];
  }
}

export async function getHorarioById(id) {
  try {
    const res = await api.get(`/horario/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error cargando horario:", error);
    return null;
  }
}

export async function getHorariosByEmpleado(empleadoId) {
  try {
    const res = await api.get(`/horario/empleado/${empleadoId}`);
    return res.data;
  } catch (error) {
    console.error("Error cargando horarios del empleado:", error);
    return [];
  }
}

export async function createHorario(data) {
  const payload = {
    empleado_id: Number(data.empleado_id),
    dia: Number(data.dia),
    hora_inicio: data.hora_inicio,
    hora_final: data.hora_final,
  };

  try {
    const res = await api.post("/horario", payload);
    return { success: true, data: res.data };
  } catch (error) {
    console.error("Error creando horario:", error);
    const errorMsg = error.response?.data?.error || "Error al crear horario";
    return { success: false, error: errorMsg };
  }
}

export async function updateHorario(id, data) {
  const payload = {
    empleado_id: Number(data.empleado_id),
    dia: Number(data.dia),
    hora_inicio: data.hora_inicio,
    hora_final: data.hora_final,
    activo: data.activo !== undefined ? data.activo : true,
  };

  try {
    const res = await api.put(`/horario/${id}`, payload);
    return { success: true, data: res.data };
  } catch (error) {
    console.error("Error actualizando horario:", error);
    const errorMsg = error.response?.data?.error || "Error al actualizar horario";
    return { success: false, error: errorMsg };
  }
}

export async function deleteHorario(id) {
  try {
    const res = await api.delete(`/horario/${id}`);
    return { success: true, data: res.data };
  } catch (error) {
    console.error("Error eliminando horario:", error);
    const errorMsg = error.response?.data?.error || "Error al eliminar horario";
    return { success: false, error: errorMsg };
  }
}

export async function updateEstadoHorario(id, activo) {
  const horario = await getHorarioById(id);
  if (!horario) return { success: false, error: "Horario no encontrado" };
  return updateHorario(id, {
    empleado_id: horario.empleado_id,
    dia: horario.dia,
    hora_inicio: horario.hora_inicio?.substring(0, 5),
    hora_final: horario.hora_final?.substring(0, 5),
    activo: activo,
  });
}
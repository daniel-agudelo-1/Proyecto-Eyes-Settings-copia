import api from "../../../../lib/axios";

// Obtener proveedores paginados (para la tabla)
export async function getProveedores({ page = 1, per_page = 10, search = '', estado = '' } = {}) {
  const params = new URLSearchParams();
  params.append('page', page);
  params.append('per_page', per_page);
  if (search) params.append('search', search);
  if (estado) params.append('estado', estado === 'activo' ? 'true' : 'false');

  const res = await api.get(`/proveedores?${params.toString()}`);
  return res.data; // { data: [...], pagination: {...} }
}

// Obtener todos los proveedores (sin paginación) – se mantiene para compatibilidad
export async function getAllProveedores() {
  const res = await api.get("/proveedores");
  return res.data;
}

export async function getProveedoresActivos() {
  const proveedores = await getAllProveedores();
  return proveedores
    .filter(p => p.estado === true)
    .map(p => ({
      id: p.id,
      razonSocial: p.razon_social_o_nombre || p.razonSocial || p.nombre || "Sin nombre",
    }));
}

export async function getProveedorById(id) {
  try {
    const res = await api.get(`/proveedores/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error al obtener proveedor:", error);
    return null;
  }
}

function buildPayload(data, estadoBool) {
  return {
    tipo_proveedor:        data.tipoProveedor        || "",
    tipo_documento:        data.tipoDocumento        || "",
    documento:             data.documento            || "",
    razon_social_o_nombre: data.razonSocial          || "",
    contacto:              data.contactoNombre       || "",
    telefono:              data.telefono             || "",
    correo:                data.correo               || "",
    departamento:          data.departamento         || "",
    municipio:             data.municipio            || "",
    direccion:             data.direccion            || "",
    estado:                estadoBool,
  };
}

export async function createProveedor(data) {
  const estadoBool = data.estado === "activo" || data.estado === true;
  const res = await api.post("/proveedores", buildPayload(data, estadoBool));
  return res.data;
}

export async function updateProveedor(id, data) {
  const estadoBool = data.estado === "activo" || data.estado === true;
  const res = await api.put(`/proveedores/${id}`, buildPayload(data, estadoBool));
  return res.data;
}

export async function toggleEstadoProveedor(id, nuevoEstadoBool, rowData) {
  const payload = buildPayload(rowData, nuevoEstadoBool);
  console.warn("PAYLOAD TOGGLE:", JSON.stringify(payload));
  try {
    const res = await api.put(`/proveedores/${id}`, payload);
    return res.data;
  } catch (error) {
    console.error("BACKEND ERROR RESPONSE:", JSON.stringify(error.response?.data));
    throw error;
  }
}

export async function deleteProveedor(id) {
  const res = await api.delete(`/proveedores/${id}`);
  return res.data;
}
import api from '@lib/axios';

const BASE_URL = '/campanas-salud';

// Función para asegurar formato HH:MM
const asegurarFormatoHora = (hora) => {
  if (!hora) return null;
  // Si ya es HH:MM, devolver igual
  if (/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(hora)) return hora;
  // Si tiene segundos, quitarlos
  if (/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(hora)) {
    return hora.substring(0, 5);
  }
  // Si tiene otro formato, intentar extraer horas y minutos
  const parts = hora.split(':');
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(h) && !isNaN(m)) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }
  return hora; // fallback
};

export const campanasSaludService = {
  getAll: () => api.get(BASE_URL).then(res => res.data),
  getById: (id) => api.get(`${BASE_URL}/${id}`).then(res => res.data),
  create: async (data) => {
    const payload = { ...data };
    if (payload.hora) payload.hora = asegurarFormatoHora(payload.hora);
    const res = await api.post(BASE_URL, payload);
    return res.data;
  },
  update: async (id, data) => {
    const payload = { ...data };
    if (payload.hora) payload.hora = asegurarFormatoHora(payload.hora);
    const res = await api.put(`${BASE_URL}/${id}`, payload);
    return res.data;
  },
  delete: (id) => api.delete(`${BASE_URL}/${id}`).then(() => true),
};

export const getAllCampanasSalud = campanasSaludService.getAll;
export const getCampanaSaludById = campanasSaludService.getById;
export const createCampanaSalud = campanasSaludService.create;
export const updateCampanaSalud = campanasSaludService.update;
export const deleteCampanaSalud = campanasSaludService.delete;
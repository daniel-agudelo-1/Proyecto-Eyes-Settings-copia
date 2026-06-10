import axios from '@lib/axios';

export const ServicioData = {
  // Obtener servicios paginados (para la tabla)
  async getServicios({ page = 1, per_page = 10, search = '', estado = '' } = {}) {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('per_page', per_page);
    if (search) params.append('search', search);
    if (estado) params.append('estado', estado === 'activo' ? 'true' : 'false');

    const response = await axios.get(`/servicios?${params.toString()}`);
    return response.data; // { data: [...], pagination: {...} }
  },

  // Mantener getAllServicios por compatibilidad (devuelve todos sin paginación)
  async getAllServicios() {
    const response = await axios.get('/servicios');
    return response.data;
  },

  async getServicioById(id) {
    const response = await axios.get(`/servicios/${id}`);
    return response.data;
  },

  async createServicio(data) {
    const response = await axios.post('/servicios', {
      nombre: data.nombre,
      descripcion: data.descripcion || '',
      duracion_min: data.duracion_min,
      precio: data.precio,
      estado: data.estado !== undefined ? data.estado : true
    });
    return response.data;
  },

  async updateServicio(id, data) {
    const payload = {
      nombre: data.nombre,
      descripcion: data.descripcion || '',
      duracion_min: Number(data.duracion_min),
      precio: Number(data.precio),
      estado: data.estado === true
    };
    const response = await axios.put(`/servicios/${id}`, payload);
    return response.data;
  },

  async deleteServicio(id) {
    try {
      await axios.delete(`/servicios/${id}`);
      return true;
    } catch (error) {
      if (error.response) {
        const errorMessage = error.response.data?.error || "Error al eliminar el servicio";
        const enhancedError = new Error(errorMessage);
        enhancedError.response = error.response;
        throw enhancedError;
      }
      throw error;
    }
  },

  async checkServicioExists(nombre, excludeId = null) {
    const response = await axios.get('/servicios');
    const servicios = response.data;
    const nombreTrimmed = nombre.trim().toLowerCase();
    return servicios.some(servicio =>
      servicio.nombre.toLowerCase().trim() === nombreTrimmed &&
      (excludeId ? servicio.id !== excludeId : true)
    );
  },

  async updateEstadoServicio(id, nuevoEstado) {
    if (!id || isNaN(Number(id))) throw new Error('ID de servicio inválido');
    const estado = nuevoEstado === 'activo';
    const response = await axios.put(`/servicios/${id}`, { estado });
    return response.data;
  },

  async getEstadosCita() {
    const response = await axios.get('/estado-cita');
    return response.data;
  },

  async getEstadosQueBloquean() {
    try {
      const estados = await this.getEstadosCita();
      const estadosBloqueantes = estados.filter(
        estado => estado.nombre.toLowerCase() === 'pendiente' ||
                  estado.nombre.toLowerCase() === 'confirmada'
      );
      return estadosBloqueantes.map(estado => estado.id);
    } catch {
      return [1, 2];
    }
  },

  getEstadoTexto(estado) {
    return estado ? 'activo' : 'inactivo';
  },

  getEstadoBadge(estado) {
    return estado ? 'success' : 'error';
  }
};
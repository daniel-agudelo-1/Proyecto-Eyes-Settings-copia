import api from '@lib/axios';

let pendingRequests = new Map();

export const marcasService = {
  // Obtener marcas con paginación, búsqueda y filtro de estado
  async getMarcas({ page = 1, per_page = 10, search = '', estado = '' } = {}) {
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('per_page', per_page);
      if (search) params.append('search', search);
      if (estado) params.append('estado', estado === 'activa' ? 'true' : 'false');

      const response = await api.get(`/marcas?${params.toString()}`);
      return response.data; // { data: [...], pagination: {...} }
    } catch (error) {
      console.error('Error al obtener marcas paginadas:', error);
      throw error;
    }
  },

  // Mantener getAllMarcas por compatibilidad (devuelve todas sin paginación)
  async getAllMarcas() {
    try {
      const response = await api.get('/marcas');
      return response.data;
    } catch (error) {
      console.error('Error al obtener marcas:', error);
      throw error;
    }
  },

  async getMarcaById(id) {
    if (!id) throw new Error('ID de marca no proporcionado');
    try {
      const response = await api.get(`/marcas/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener marca:', error);
      throw error;
    }
  },

  async createMarca(data) {
    const requestKey = JSON.stringify({ url: '/marcas', data });
    if (pendingRequests.has(requestKey)) {
      throw new Error('Ya hay una solicitud de creación en proceso');
    }
    try {
      pendingRequests.set(requestKey, true);
      const response = await api.post('/marcas', {
        nombre: data.nombre,
        estado: true
      });
      return response.data;
    } catch (error) {
      console.error('Error al crear marca:', error);
      throw error;
    } finally {
      pendingRequests.delete(requestKey);
    }
  },

  // Verificar existencia usando el endpoint dedicado
  async checkMarcaExists(nombre, excludeId = null) {
    try {
      const params = new URLSearchParams();
      params.append('nombre', nombre.trim());
      if (excludeId) params.append('exclude_id', excludeId);
      const response = await api.get(`/marcas/verificar-existencia?${params.toString()}`);
      return response.data.exists;
    } catch (error) {
      console.error('Error al verificar marca:', error);
      // Fallback: obtener todas y filtrar localmente
      const all = await this.getAllMarcas();
      const nombreTrimmed = nombre.trim().toLowerCase();
      return all.some(marca => 
        marca.nombre.toLowerCase().trim() === nombreTrimmed &&
        (excludeId ? marca.id !== parseInt(excludeId) : true)
      );
    }
  },

  async updateMarca(id, data) {
    if (!id) throw new Error('ID de marca no proporcionado');
    try {
      const response = await api.put(`/marcas/${id}`, {
        nombre: data.nombre,
        estado: data.estado
      });
      return response.data;
    } catch (error) {
      console.error('Error al actualizar marca:', error);
      throw error;
    }
  },

  async deleteMarca(id) {
    if (!id) return true;
    try {
      await api.delete(`/marcas/${id}`);
      return true;
    } catch (error) {
      if (error.response?.status === 404) return true;
      console.error('Error al eliminar marca:', error);
      throw error;
    }
  },

  async hasMarcaProductosAsociados(id) {
    if (!id) return false;
    try {
      const response = await api.get(`/marcas/${id}/productos-asociados`);
      return response.data.hasProductos;
    } catch (error) {
      console.error('Error al verificar productos asociados:', error);
      return false;
    }
  },

  async toggleMarcaEstado(id, nuevoEstado) {
    if (!id) throw new Error('ID de marca no proporcionado');
    try {
      const estadoBooleano = nuevoEstado === true || nuevoEstado === "true" || nuevoEstado === "activa";
      const response = await api.put(`/marcas/${id}`, { estado: estadoBooleano });
      return response.data;
    } catch (error) {
      console.error('Error al cambiar estado de marca:', error);
      throw error;
    }
  },

  getEstadoTexto(estado) {
    return estado ? 'Activa' : 'Inactiva';
  },

  getEstadoBadge(estado) {
    return estado ? 'success' : 'error';
  },

  getEstadoColor(estado) {
    return estado ? 'success' : 'error';
  }
};
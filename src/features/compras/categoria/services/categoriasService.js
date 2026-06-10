import api from '@lib/axios';

// ============================
// FUNCIONES BASE
// ============================

// Obtener categorías con paginación, búsqueda y filtro de estado
export async function getCategorias({ page = 1, per_page = 10, search = '', estado = '' } = {}) {
  try {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('per_page', per_page);
    if (search) params.append('search', search);
    if (estado) params.append('estado', estado === 'activa' ? 'true' : 'false');

    const response = await api.get(`/categorias?${params.toString()}`);
    // El backend devuelve { data: [...], pagination: {...} }
    return response.data;
  } catch (error) {
    console.error('Error al obtener categorías paginadas:', error);
    throw error;
  }
}

// Obtener todas las categorías (sin paginación) – se mantiene para compatibilidad
export async function getAllCategorias() {
  try {
    const response = await api.get('/categorias');
    return response.data;
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    throw error;
  }
}

export async function getCategoriaById(id) {
  try {
    const response = await api.get(`/categorias/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    throw error;
  }
}

export async function createCategoria(data) {
  try {
    const response = await api.post('/categorias', {
      nombre: data.nombre,
      descripcion: data.descripcion || '',
      estado: data.estado !== undefined ? data.estado : true
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear categoría:', error);
    throw error;
  }
}

export async function updateCategoria(id, data) {
  try {
    const response = await api.put(`/categorias/${id}`, {
      nombre: data.nombre,
      descripcion: data.descripcion || '',
      estado: data.estado
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    throw error;
  }
}

export async function deleteCategoria(id) {
  try {
    await api.delete(`/categorias/${id}`);
    return true;
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    throw error;
  }
}

// ============================
// VALIDACIONES ADICIONALES
// ============================
export async function checkCategoriaExists(nombre, excludeId = null) {
  try {
    const response = await api.get('/categorias');
    const categorias = response.data;
    const nombreTrimmed = nombre.trim().toLowerCase();
    
    return categorias.some(categoria => {
      const nombreMatch = categoria.nombre.toLowerCase().trim() === nombreTrimmed;
      if (excludeId && categoria.id === parseInt(excludeId)) {
        return false;
      }
      return nombreMatch;
    });
  } catch (error) {
    console.error('Error al verificar categoría:', error);
    throw error;
  }
}

export async function hasCategoriaProductosAsociados(id) {
  try {
    const response = await api.get('/productos');
    const productos = response.data;
    return productos.some(producto => producto.categoria_id === parseInt(id));
  } catch (error) {
    console.error('Error al verificar productos asociados:', error);
    throw error;
  }
}

export async function toggleCategoriaEstado(id, estadoActual) {
  try {
    const response = await api.put(`/categorias/${id}`, {
      estado: !estadoActual
    });
    return response.data;
  } catch (error) {
    console.error('Error al cambiar estado de categoría:', error);
    throw error;
  }
}

// ============================
// UTILIDADES
// ============================
export const getEstadoTexto = (estado) => estado ? 'Activa' : 'Inactiva';
export const getEstadoBadge = (estado) => estado ? 'success' : 'error';
export const getEstadoColor = (estado) => estado ? 'success' : 'error';

// ============================
// OBJETO AGRUPADO PARA COMPATIBILIDAD
// ============================
export const CategoriaData = {
  getCategorias,
  getAllCategorias,
  getCategoriaById,
  createCategoria,
  checkCategoriaExists,
  updateCategoria,
  deleteCategoria,
  hasCategoriaProductosAsociados,
  toggleCategoriaEstado,
  getEstadoTexto,
  getEstadoBadge,
  getEstadoColor,
};
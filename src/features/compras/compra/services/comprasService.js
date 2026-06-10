import api from '@lib/axios';
import { getAllProveedores } from '../../proveedor/services/proveedoresService';

// ── Obtener compras con paginación y filtros ─────────────────────────────────
export async function getCompras({ page = 1, per_page = 10, search = '', estado_compra = null } = {}) {
  try {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('per_page', per_page);
    if (search) params.append('search', search);
    // El backend espera "true" o "false" como string
    if (estado_compra !== null) {
      params.append('estado_compra', estado_compra ? 'true' : 'false');
    }

    const comprasRes = await api.get(`/compras?${params.toString()}`);
    const comprasData = comprasRes.data;

    // Obtener proveedores para mapear nombres
    const proveedoresRes = await getAllProveedores();
    const proveedoresMap = {};
    (proveedoresRes || []).forEach((p) => {
      proveedoresMap[p.id] = p.razon_social_o_nombre || p.razonSocial || p.nombre || '';
    });

    let comprasList = [];
    let pagination = { current_page: 1, total_pages: 1, total: 0, has_next: false, has_prev: false };

    if (comprasData && typeof comprasData === 'object' && 'data' in comprasData) {
      comprasList = comprasData.data.map((c) => ({
        ...c,
        proveedor_nombre: proveedoresMap[c.proveedor_id] || 'Proveedor no encontrado',
      }));
      pagination = comprasData.pagination;
    } else if (Array.isArray(comprasData)) {
      comprasList = comprasData.map((c) => ({
        ...c,
        proveedor_nombre: proveedoresMap[c.proveedor_id] || 'Proveedor no encontrado',
      }));
    }

    return { data: comprasList, pagination };
  } catch (error) {
    console.error('Error en getCompras:', error);
    throw error;
  }
}

// ── Mantener getAllCompras para compatibilidad (si se usa en otro sitio) ──────
export async function getAllCompras() {
  try {
    const [comprasRes, proveedoresRes] = await Promise.all([
      api.get('/compras'),
      getAllProveedores(),
    ]);

    const proveedoresMap = {};
    (proveedoresRes || []).forEach((p) => {
      proveedoresMap[p.id] = p.razon_social_o_nombre || p.razonSocial || p.nombre || '';
    });

    // Asumimos que /compras sin paginación devuelve array directamente
    const rawCompras = Array.isArray(comprasRes.data) ? comprasRes.data : (comprasRes.data?.data || []);
    return rawCompras.map((compra) => ({
      ...compra,
      proveedor_nombre: proveedoresMap[compra.proveedor_id] || 'Proveedor no encontrado',
    }));
  } catch (error) {
    console.error('Error en getAllCompras:', error);
    throw error;
  }
}

// ── Obtener compra por ID con detalles ────────────────────────────────────────
export async function getCompraById(id) {
  try {
    const [compraRes, proveedoresRes, detallesRes] = await Promise.all([
      api.get(`/compras/${id}`),
      getAllProveedores(),
      api.get(`/compras/${id}/detalles`).catch(() => ({ data: [] })),
    ]);

    const compra = compraRes.data;
    const detalles = Array.isArray(detallesRes.data) ? detallesRes.data : [];

    const proveedoresMap = {};
    (proveedoresRes || []).forEach((p) => {
      proveedoresMap[p.id] = p.razon_social_o_nombre || p.razonSocial || p.nombre || '';
    });

    return {
      ...compra,
      proveedor_nombre: proveedoresMap[compra.proveedor_id] || 'Proveedor no encontrado',
      productos: detalles.map((d) => ({
        id: d.id,
        productoId: d.producto_id,
        nombre: d.nombre_producto || d.producto?.nombre || '',
        cantidad: Number(d.cantidad),
        precioCompra: Number(d.precio_unitario ?? d.precio_unidad ?? 0),
        precioVenta: Number(d.precio_venta ?? d.producto?.precio_venta ?? 0),
        total: Number(d.subtotal ?? Number(d.cantidad) * Number(d.precio_unitario ?? d.precio_unidad ?? 0)),
        stockActual: Number(d.producto?.stock ?? 0),
      })),
    };
  } catch (error) {
    console.error(`Error en getCompraById(${id}):`, error);
    if (error.response?.data?.error) throw new Error(error.response.data.error);
    throw error;
  }
}

// ── Crear compra ──────────────────────────────────────────────────────────────
export async function createCompra(data) {
  try {
    const payload = {
      proveedor_id: Number(data.proveedorId),
      observaciones: data.observaciones || '',
      estado_compra: true,
      detalles: data.productos.map((p) => ({
        producto_id: Number(p.productoId),
        cantidad: Number(p.cantidad),
        precio_unidad: Number(p.precioCompra),
        precio_venta: Number(p.precioVenta),
      })),
    };
    const res = await api.post('/compras', payload);
    return res.data;
  } catch (error) {
    console.error('Error en createCompra:', error);
    if (error.response?.data?.error) throw new Error(error.response.data.error);
    throw error;
  }
}

// ── Actualizar compra ─────────────────────────────────────────────────────────
export async function updateCompra(id, data) {
  try {
    const payload = {
      proveedor_id: Number(data.proveedorId),
      observaciones: data.observaciones || '',
      estado_compra: data.estado === 'completada',
      detalles: (data.productos || []).map((p) => ({
        producto_id: Number(p.productoId),
        cantidad: Number(p.cantidad),
        precio_unidad: Number(p.precioCompra),
        precio_venta: Number(p.precioVenta),
      })),
    };
    const res = await api.put(`/compras/${id}`, payload);
    return res.data;
  } catch (error) {
    console.error(`Error en updateCompra(${id}):`, error);
    if (error.response?.data?.error) throw new Error(error.response.data.error);
    throw error;
  }
}

// ── Eliminar compra ───────────────────────────────────────────────────────────
export async function deleteCompra(id) {
  try {
    const res = await api.delete(`/compras/${id}`);
    return res.data;
  } catch (error) {
    console.error(`Error en deleteCompra(${id}):`, error);
    if (error.response?.data?.error) throw new Error(error.response.data.error);
    throw error;
  }
}

// ── Anular compra ─────────────────────────────────────────────────────────────
export async function anularCompra(id) {
  try {
    const res = await api.put(`/compras/${id}`, { estado_compra: false });
    return res.data;
  } catch (error) {
    console.error(`Error en anularCompra(${id}):`, error);
    if (error.response?.data?.error) throw new Error(error.response.data.error);
    throw error;
  }
}

// ── Crear proveedor ───────────────────────────────────────────────────────────
export async function createProveedor(data) {
  try {
    const res = await api.post('/proveedores', {
      razon_social_o_nombre: data.razon_social_o_nombre,
      documento: data.documento || `TEMP-${Date.now()}`,
      telefono: data.telefono || undefined,
      correo: data.email || undefined,
      direccion: data.direccion || undefined,
      estado: true,
    });
    return res.data?.proveedor ?? res.data;
  } catch (error) {
    console.error('Error en createProveedor:', error);
    if (error.response?.data?.error) throw new Error(error.response.data.error);
    throw error;
  }
}
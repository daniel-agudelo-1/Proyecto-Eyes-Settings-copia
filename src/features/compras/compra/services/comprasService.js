import api from '@lib/axios';
import { getAllProveedores } from '../../proveedor/services/proveedoresService';

// ── Helper: extrae array de cualquier forma que devuelva el backend ────────────
function extractArray(data, keys = ['compras', 'data', 'items', 'results']) {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

// ── Helper: construye mapa id→nombre de proveedores ───────────────────────────
function buildProveedoresMap(proveedoresRes) {
  const list = extractArray(proveedoresRes);
  const map = {};
  list.forEach((p) => {
    map[p.id] = p.razon_social_o_nombre || p.razonSocial || p.nombre || '';
  });
  return map;
}

// ── Obtener todas las compras ─────────────────────────────────────────────────
export async function getAllCompras() {
  try {
    const [comprasRes, proveedoresRes] = await Promise.all([
      api.get('/compras'),
      getAllProveedores(),
    ]);

    const proveedoresMap = buildProveedoresMap(proveedoresRes);
    const rawCompras = extractArray(comprasRes.data);

    return rawCompras.map((compra) => ({
      ...compra,
      proveedor_nombre: proveedoresMap[compra.proveedor_id] || 'Proveedor no encontrado',
    }));
  } catch (error) {
    console.error('Error en getAllCompras:', error);
    throw error;
  }
}

// ── EXPORTACIÓN PRINCIPAL PARA useCompras.js ──────────────────────────────────
// 👇 Esta es la línea que faltaba
export const getCompras = getAllCompras;

// ── Obtener compra por ID con detalles ────────────────────────────────────────
export async function getCompraById(id) {
  try {
    const [compraRes, proveedoresRes, detallesRes] = await Promise.all([
      api.get(`/compras/${id}`),
      getAllProveedores(),
      api.get(`/compras/${id}/detalles`).catch(() => ({ data: [] })),
    ]);

    const compra = compraRes.data?.compra ?? compraRes.data?.data ?? compraRes.data;
    const detalles = extractArray(detallesRes.data, ['detalles', 'items', 'productos', 'data']);
    const proveedoresMap = buildProveedoresMap(proveedoresRes);

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

// ── Crear proveedor (si se necesita) ──────────────────────────────────────────
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
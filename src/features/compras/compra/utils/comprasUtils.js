// ============================
// Formatear moneda (COP)
// ============================
export const formatCurrency = (amount) => {
  return `$${Number(amount || 0).toLocaleString("es-CO")}`;
};

// ============================
// Formatear fecha
// ============================
export const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("es-ES");
};

// ============================
// Calcular subtotal, IVA y total
// ============================
export const calculateTotals = (productos) => {
  const subtotal = productos.reduce((s, p) => s + (p.total || 0), 0);
  const iva = Math.round(subtotal * 0.19);
  const total = subtotal + iva;
  return { subtotal, iva, total };
};

// ============================
// Fila vacía para productos
// ============================
export const EMPTY_PRODUCT_ROW = {
  productoId:  "",
  nombre:      "",
  stock:       0,
  cantidad:    1,
  precioCompra: 0,
  precioVenta:  0,
  total:       0,
};

// ============================
// Normalizador canónico de estado
// Único punto de verdad — igual que ComprasNormalizer.js
//   true / 1 / "completada" / "true" / "1"  → "Completada"
//   false EXPLÍCITO del backend              → null  (fila gris / Anulada)
//   null / undefined                         → "Completada" (creación nueva)
// ============================
export const normalizeEstadoCompra = (estado_compra) => {
  if (estado_compra === false || estado_compra === 0 ||
      estado_compra === "false" || estado_compra === "0" ||
      (typeof estado_compra === "string" &&
        estado_compra.toLowerCase() === "anulada")) {
    return null; // anulada — el form la muestra en gris
  }
  return "Completada";
};

// ============================
// Normalizar compra para formulario (DetalleCompra / CrearCompra)
// ============================
export const normalizeCompraForForm = (compra) => ({
  id:              compra.id,
  proveedorId:     compra.proveedor_id     || compra.proveedorId     || "",
  proveedorNombre: compra.proveedor_nombre || compra.proveedorNombre || "",
  observaciones:   compra.observaciones    ?? "",
  fecha:           compra.fecha,
  estado:          normalizeEstadoCompra(compra.estado_compra ?? compra.estado),
  numeroCompra:    compra.numeroCompra || compra.numero_compra || `C-${compra.id}`,
  subtotal:        Number(compra.subtotal ?? 0),
  iva:             Number(compra.iva      ?? 0),
  total:           Number(compra.total    ?? 0),
  productos: (compra.productos || compra.detalles || []).map((p) => ({
    id:           p.id,
    productoId:   p.producto_id   || p.productoId,
    nombre:       p.producto_nombre || p.nombre || "",
    stockActual:  Number(p.stock ?? p.stockActual ?? 0),
    cantidad:     Number(p.cantidad ?? 1),
    precioCompra: Number(p.precio_unidad  || p.precio_unitario || p.precioCompra  || 0),
    precioVenta:  Number(p.precio_venta   || p.precioVenta  || 0),
    total:        Number(p.subtotal       || p.total        || 0),
  })),
});
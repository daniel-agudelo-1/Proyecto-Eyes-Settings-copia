import api from '@lib/axios';

export const ventasService = {
  _toUI(v) {
    const esCita = !!v.cita_id && !v.pedido_id;
    const esPedido = !!v.pedido_id;
    const esDirecta = !v.cita_id && !v.pedido_id;

    const detalles = Array.isArray(v.detalles)
      ? v.detalles.map((d) => ({
          ...d,
          nombre_display: d.producto_nombre || d.servicio_nombre || d.nombre || "—",
        }))
      : [];

    return {
      id: v.id,
      cita_id: v.cita_id ?? null,
      pedido_id: v.pedido_id ?? null,
      esCita,
      esPedido,
      esDirecta,
      cliente_id: v.cliente_id,
      cliente_nombre: v.cliente_nombre ?? "—",
      fecha_venta: v.fecha_venta
        ? new Date(v.fecha_venta).toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—",
      total: v.total ?? 0,
      metodo_pago: v.metodo_pago ?? "",
      metodo_entrega: v.metodo_entrega ?? "",
      direccion_entrega: v.direccion_entrega ?? "",
      transferencia_comprobante: v.transferencia_comprobante ?? "",
      estado: (() => {
        const n = v.estado_nombre ?? v.estado ?? "completada";
        return n === "cancelada" ? "anulada" : n;
      })(),
      saldo_pendiente: v.saldo_pendiente ?? 0,
      detalles,
      abonos: Array.isArray(v.abonos)
        ? v.abonos.map((a) => ({
            ...a,
            monto_abonado: a.monto ?? a.monto_abonado ?? 0,
          }))
        : [],
    };
  },

  async getVentas({ page = 1, per_page = 10, search = "", estado_id = null } = {}) {
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("per_page", per_page);
    if (search) params.append("search", search);
    if (estado_id) params.append("estado_id", estado_id);

    const response = await api.get(`/ventas?${params.toString()}`);
    if (response.data && typeof response.data === "object" && "data" in response.data) {
      return {
        data: response.data.data.map((v) => this._toUI(v)),
        pagination: response.data.pagination,
      };
    }
    const dataArray = Array.isArray(response.data) ? response.data : [];
    return {
      data: dataArray.map((v) => this._toUI(v)),
      pagination: {
        current_page: 1,
        per_page: dataArray.length,
        total: dataArray.length,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
    };
  },

  async getEstados() {
    try {
      const response = await api.get("/estado-venta");
      const estados = Array.isArray(response.data) ? response.data : response.data?.data || [];
      return estados.map((e) => ({ id: e.id, nombre: e.nombre }));
    } catch (error) {
      return [
        { id: 1, nombre: "completada" },
        { id: 2, nombre: "cancelada" },
      ];
    }
  },

  async getVentaById(id) {
    const response = await api.get(`/ventas/${id}`);
    return this._toUI(response.data);
  },

  async createVenta(data) {
    const payload = {
      cliente_id: data.cliente_id,
      metodo_pago: data.metodo_pago,
      metodo_entrega: data.metodo_entrega ?? "tienda",
      ...(data.direccion_entrega && { direccion_entrega: data.direccion_entrega }),
      ...(data.transferencia_comprobante && { transferencia_comprobante: data.transferencia_comprobante }),
      items: (data.items ?? []).map((item) => ({
        ...(item.tipo === "servicio" || item.servicio_id
          ? { servicio_id: item.servicio_id ?? item.id }
          : { producto_id: item.producto_id ?? item.id }),
        cantidad: item.cantidad,
        precio_unitario: item.precio ?? item.precio_unitario,
        descuento: item.descuento ?? 0,
      })),
    };
    const response = await api.post("/ventas", payload);
    return this._toUI(response.data.venta ?? response.data);
  },

  async updateVenta(id, payload) {
    const response = await api.put(`/ventas/${id}`, payload);
    return this._toUI(response.data?.venta ?? response.data);
  },

  async getClientesActivos() {
    const response = await api.get("/clientes");
    const data = Array.isArray(response.data) ? response.data : [];
    return data
      .filter((c) => c.estado !== false)
      .map((c) => ({ id: c.id, nombre: `${c.nombre ?? ""} ${c.apellido ?? ""}`.trim() }));
  },

  async getProductosActivos() {
    const response = await api.get("/productos");
    const data = Array.isArray(response.data) ? response.data : [];
    return data
      .filter((p) => p.estado !== false && (p.stock ?? 0) > 0)
      .map((p) => ({
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion ?? "",
        precio: p.precio_venta,
        stock: p.stock ?? 0,
        tipo: "producto",
      }));
  },

  async getServiciosActivos() {
    const response = await api.get("/servicios");
    const data = Array.isArray(response.data) ? response.data : [];
    return data
      .filter((s) => s.estado !== false)
      .map((s) => ({
        id: s.id,
        nombre: s.nombre,
        descripcion: s.descripcion ?? "",
        precio: s.precio,
        stock: null,
        tipo: "servicio",
      }));
  },
};
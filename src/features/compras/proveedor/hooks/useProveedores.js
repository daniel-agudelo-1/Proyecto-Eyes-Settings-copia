import { useState, useEffect, useCallback } from "react";
import { getAllProveedores, deleteProveedor, toggleEstadoProveedor } from "../services/proveedoresService";
import { normalizeProveedorForForm } from "../utils/proveedoresUtils";

export function useProveedores({ onSuccess } = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [proveedores, setProveedores] = useState([]);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [page, setPage] = useState(1);
  const [modalDelete, setModalDelete] = useState({
    open: false,
    id: null,
    razonSocial: "",
  });

  // Cargar proveedores al montar
  useEffect(() => {
    cargarProveedores();
  }, []);

  const cargarProveedores = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllProveedores();
      const proveedoresNormalizados = (Array.isArray(data) ? data : []).map((p) => ({
        ...p,
        ...normalizeProveedorForForm(p),
        estadosDisponibles: ["activo", "inactivo"],
      }));
      setProveedores(proveedoresNormalizados);
    } catch (err) {
      console.error("Error cargando proveedores:", err);
      setError("No se pudieron cargar los proveedores");
      setProveedores([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const eliminarProveedor = useCallback(async (id) => {
    const razonSocial = modalDelete.razonSocial;
    try {
      await deleteProveedor(id);
      await cargarProveedores();
      onSuccess?.(`Proveedor "${razonSocial}" eliminado correctamente`, "success");
      return { success: true };
    } catch (err) {
      console.error("Error al eliminar:", err);
      const data = err.response?.data;
      const mensaje = data?.message || data?.error || data?.detail || "";
      const esMensajeNegocio = mensaje && typeof mensaje === "string" && mensaje.length < 200;
      onSuccess?.(esMensajeNegocio ? mensaje : "No se pudo eliminar el proveedor", "error");
      return { success: false, error: mensaje || "Error al eliminar el proveedor" };
    }
  }, [cargarProveedores, onSuccess, modalDelete.razonSocial]);

  const cambiarEstado = useCallback((row, nuevoEstado) => {
    const estadoAnterior = row.estado;
    const nuevoEstadoBool = nuevoEstado === "activo";

    setProveedores((prev) =>
      prev.map((p) => p.id === row.id ? { ...p, estado: nuevoEstado } : p)
    );

    toggleEstadoProveedor(row.id, nuevoEstadoBool, row)
      .then(() => {
        onSuccess?.(`Estado de "${row.razonSocial}" cambiado a ${nuevoEstado}`, "success");
      })
      .catch((err) => {
        console.error("Error al cambiar estado:", err);
        setProveedores((prev) =>
          prev.map((p) => p.id === row.id ? { ...p, estado: estadoAnterior } : p)
        );
        const data = err.response?.data;
        const mensaje = data?.message || data?.error || data?.detail || data?.msg || "";
        const esMensajeNegocio = mensaje && typeof mensaje === "string" && mensaje.length < 200;
        onSuccess?.(esMensajeNegocio ? mensaje : "No se pudo cambiar el estado", "error");
      });
  }, [onSuccess]);

  // Filtros y paginación
  const proveedoresFiltrados = proveedores.filter((proveedor) => {
    const matchesSearch =
      (proveedor.razonSocial || "").toLowerCase().includes(search.toLowerCase()) ||
      (proveedor.documento   || "").toLowerCase().includes(search.toLowerCase()) ||
      (proveedor.correo      || "").toLowerCase().includes(search.toLowerCase());
    const matchesEstado = !filterEstado || proveedor.estado === filterEstado;
    return matchesSearch && matchesEstado;
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(proveedoresFiltrados.length / itemsPerPage);
  const paginatedProveedores = proveedoresFiltrados.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const estadoFilters = [
    { value: "",         label: "Todos"    },
    { value: "activo",   label: "Activos"  },
    { value: "inactivo", label: "Inactivos"},
  ];

  const openDeleteModal = useCallback((id, razonSocial) => {
    setModalDelete({ open: true, id, razonSocial });
  }, []);

  const closeDeleteModal = useCallback(() => {
    setModalDelete({ open: false, id: null, razonSocial: "" });
  }, []);

  const handleSetSearch = useCallback((value) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleSetFilterEstado = useCallback((value) => {
    setFilterEstado(value);
    setPage(1);
  }, []);

  return {
    proveedores: paginatedProveedores,
    allProveedores: proveedoresFiltrados,
    loading,
    error,
    search,
    setSearch: handleSetSearch,
    filterEstado,
    setFilterEstado: handleSetFilterEstado,
    page,
    setPage,
    totalPages,
    estadoFilters,
    eliminarProveedor,
    cambiarEstado,
    recargar: cargarProveedores,
    modalDelete,
    openDeleteModal,
    closeDeleteModal,
  };
}
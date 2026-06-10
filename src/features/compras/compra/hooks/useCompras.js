import { useState, useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getCompras, deleteCompra, anularCompra } from "../services/comprasService";
import { formatCurrency, formatDate } from "../utils/comprasUtils";

// Normalización canónica de estado
const normalizarEstado = (estado_compra) => {
  if (estado_compra === true || estado_compra === 1 || estado_compra === "completada")
    return "completada";
  return "anulada";
};

const normalizarCompra = (compra) => ({
  id: compra.id,
  numeroCompra: compra.numeroCompra || compra.numero_compra || `C-${compra.id}`,
  proveedorNombre: compra.proveedor_nombre || compra.proveedorNombre || "—",
  fechaFormateada: formatDate(compra.fecha),
  totalFormateado: formatCurrency(compra.total),
  total: compra.total,
  observaciones: compra.observaciones || "",
  estado: normalizarEstado(compra.estado_compra ?? compra.estado),
});

export function useCompras() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // ── Obtener compras con React Query ─────────────────────────────────────────
  const {
    data: comprasRaw = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["compras"],
    queryFn: getCompras, // ✅ ahora sí existe
    staleTime: 1000 * 60 * 2,
  });

  const compras = comprasRaw.map(normalizarCompra);

  // Filtrado y paginación
  const comprasFiltradas = compras.filter((c) => {
    const term = search.toLowerCase();
    return (
      (!search || c.proveedorNombre.toLowerCase().includes(term) ||
        c.numeroCompra.toLowerCase().includes(term) ||
        c.observaciones.toLowerCase().includes(term) ||
        String(c.total).includes(term)) &&
      (!filterEstado || c.estado === filterEstado)
    );
  });

  const totalPages = Math.ceil(comprasFiltradas.length / itemsPerPage);
  const paginatedCompras = comprasFiltradas.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // ── Mutaciones ──────────────────────────────────────────────────────────────
  const eliminarMutation = useMutation({
    mutationFn: deleteCompra,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compras"] });
      closeDeleteModal();
    },
  });

  const anularMutation = useMutation({
    mutationFn: anularCompra,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compras"] });
      cerrarModalAnular();
    },
  });

  // Estados de modales
  const [modalDelete, setModalDelete] = useState({ open: false, id: null, numeroCompra: "" });
  const [deleteError, setDeleteError] = useState("");
  const [modalAnular, setModalAnular] = useState({ open: false, row: null });
  const [anularError, setAnularError] = useState("");

  const openDeleteModal = useCallback((id, numeroCompra) => {
    setDeleteError("");
    setModalDelete({ open: true, id, numeroCompra });
  }, []);

  const closeDeleteModal = useCallback(() => {
    setModalDelete({ open: false, id: null, numeroCompra: "" });
    setDeleteError("");
  }, []);

  const confirmarEliminar = useCallback(async () => {
    if (!modalDelete.id) return;
    try {
      await eliminarMutation.mutateAsync(modalDelete.id);
    } catch (err) {
      setDeleteError(err.message || "Error al eliminar");
    }
  }, [modalDelete.id, eliminarMutation]);

  const abrirModalAnular = useCallback((row) => {
    if (row.estado !== "completada") return;
    setAnularError("");
    setModalAnular({ open: true, row });
  }, []);

  const cerrarModalAnular = useCallback(() => {
    setModalAnular({ open: false, row: null });
    setAnularError("");
  }, []);

  const confirmarAnular = useCallback(async () => {
    if (!modalAnular.row) return;
    try {
      await anularMutation.mutateAsync(modalAnular.row.id);
    } catch (err) {
      setAnularError(err.message || "Error al anular");
    }
  }, [modalAnular.row, anularMutation]);

  const estadoFilters = [
    { value: "", label: "Todos" },
    { value: "completada", label: "Completadas" },
    { value: "anulada", label: "Anuladas" },
  ];

  const errorMessage = queryError?.message || (typeof queryError === "string" ? queryError : null);

  return {
    compras: paginatedCompras,
    allCompras: comprasFiltradas,
    loading,
    error: errorMessage,
    search, setSearch,
    filterEstado, setFilterEstado,
    estadoFilters,
    page, setPage,
    totalPages,
    eliminarCompra: openDeleteModal,
    anularCompra: abrirModalAnular,
    recargar: () => refetch(),
    modalDelete, closeDeleteModal, confirmarEliminar, deleteError,
    modalAnular, cerrarModalAnular, confirmarAnular, anularError,
  };
}
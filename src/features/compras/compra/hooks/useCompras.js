import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCompras, deleteCompra, anularCompra } from "../services/comprasService";
import { formatCurrency, formatDate } from "../utils/comprasUtils";

function normalizarEstado(estado_compra) {
  if (estado_compra === true || estado_compra === 1 || estado_compra === "true" || estado_compra === "1" || estado_compra === "completada")
    return "completada";
  return "anulada";
}

export function useCompras() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [page, setPage] = useState(1);

  const estadoBool = filterEstado === "completada" ? true : (filterEstado === "anulada" ? false : null);

  const {
    data: queryData,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["compras", page, search, filterEstado],
    queryFn: () =>
      getCompras({
        page,
        per_page: 10,
        search: search || undefined,
        estado_compra: estadoBool,
      }),
    keepPreviousData: true,
  });

  const comprasRaw = queryData?.data ?? [];
  const pagination = queryData?.pagination ?? {
    current_page: 1,
    total_pages: 1,
    total: 0,
    has_next: false,
    has_prev: false,
  };

  const compras = comprasRaw.map((c) => ({
    id: c.id,
    proveedorNombre: c.proveedor_nombre || "—",
    fechaFormateada: formatDate(c.fecha),
    totalFormateado: formatCurrency(c.total),
    total: c.total,
    numeroCompra: c.numeroCompra || `C-${c.id}`,
    observaciones: c.observaciones || "",
    estado: normalizarEstado(c.estado_compra),
  }));

  useEffect(() => {
    setPage(1);
  }, [search, filterEstado]);

  const [modalDelete, setModalDelete] = useState({ open: false, id: null, numeroCompra: "" });
  const [modalAnular, setModalAnular] = useState({ open: false, row: null });

  const eliminarCompra = useCallback(async (id) => {
    try {
      await deleteCompra(id);
      queryClient.invalidateQueries({ queryKey: ["compras"] });
      return { success: true };
    } catch (e) {
      const msg = e.response?.data?.error || e.message || "Error al eliminar la compra";
      return { success: false, error: msg };
    }
  }, [queryClient]);

  const confirmarAnular = useCallback(async () => {
    if (!modalAnular.row) return;
    try {
      await anularCompra(modalAnular.row.id);
      setModalAnular({ open: false, row: null });
      queryClient.invalidateQueries({ queryKey: ["compras"] });
      return { success: true };
    } catch (e) {
      const msg = e.response?.data?.error || e.message || "Error al anular la compra";
      setModalAnular({ open: false, row: null });
      return { success: false, error: msg };
    }
  }, [modalAnular.row, queryClient]);

  const abrirModalAnular = useCallback((row) => {
    if (row.estado !== "completada") return;
    setModalAnular({ open: true, row });
  }, []);

  const cerrarModalAnular = useCallback(() => {
    setModalAnular({ open: false, row: null });
  }, []);

  const estadoFilters = [
    { value: "",           label: "Todos"       },
    { value: "completada", label: "Completadas" },
    { value: "anulada",    label: "Anuladas"    },
  ];

  const openDeleteModal = useCallback((id, numeroCompra) => {
    setModalDelete({ open: true, id, numeroCompra });
  }, []);

  const closeDeleteModal = useCallback(() => {
    setModalDelete({ open: false, id: null, numeroCompra: "" });
  }, []);

  // Convertir error a string para evitar "Objects are not valid as React child"
  const errorMessage = error?.message || (typeof error === 'string' ? error : null);

  return {
    compras,
    loading,
    error: errorMessage,
    search, setSearch,
    filterEstado, setFilterEstado,
    estadoFilters,
    page, setPage,
    pagination,
    eliminarCompra,
    modalAnular, abrirModalAnular, cerrarModalAnular, confirmarAnular,
    modalDelete, openDeleteModal, closeDeleteModal,
    recargar: () => queryClient.invalidateQueries({ queryKey: ["compras"] }),
  };
}
import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProveedores, deleteProveedor, toggleEstadoProveedor } from "../services/proveedoresService";
import { normalizeProveedorForForm } from "../utils/proveedoresUtils";

export function useProveedores({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [page, setPage] = useState(1);
  const [modalDelete, setModalDelete] = useState({
    open: false,
    id: null,
    razonSocial: "",
  });

  // Estado para el filtro (activo/inactivo) como string para el backend
  const estadoParam = filterEstado === "activo" ? "activo" : filterEstado === "inactivo" ? "inactivo" : "";

  const {
    data: responseData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["proveedores", page, search, estadoParam],
    queryFn: () => getProveedores({ page, per_page: 10, search, estado: estadoParam }),
    keepPreviousData: true,
    staleTime: 1000 * 60,
  });

  const proveedoresRaw = responseData?.data || [];
  const pagination = responseData?.pagination || { total_pages: 1, current_page: 1 };
  const totalPages = pagination.total_pages;

  const proveedores = proveedoresRaw.map((p) => ({
    ...p,
    ...normalizeProveedorForForm(p),
    estadosDisponibles: ["activo", "inactivo"],
  }));

  const loading = isLoading;
  const error = isError ? "No se pudieron cargar los proveedores" : null;

  const cargarProveedores = useCallback(() => {
    refetch();
  }, [refetch]);

  const eliminarProveedor = useCallback(async (id) => {
    try {
      await deleteProveedor(id);
      await cargarProveedores();
      onSuccess?.("Proveedor eliminado correctamente", "success");
      return { success: true };
    } catch (error) {
      console.error("Error al eliminar:", error);
      const msg = "Error al eliminar el proveedor";
      onError?.(msg);
      return { success: false, error: msg };
    }
  }, [cargarProveedores, onSuccess, onError]);

  const cambiarEstado = useCallback(async (id, nuevoEstadoNombre) => {
    try {
      const nuevoEstadoBool = nuevoEstadoNombre === "activo";
      await toggleEstadoProveedor(id, nuevoEstadoBool);
      await cargarProveedores();
      onSuccess?.(`Estado cambiado a ${nuevoEstadoNombre}`, "success");
      return { success: true };
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      const msg = "Error al cambiar el estado";
      onError?.(msg);
      return { success: false, error: msg };
    }
  }, [cargarProveedores, onSuccess, onError]);

  const estadoFilters = [
    { value: "", label: "Todos" },
    { value: "activo", label: "Activos" },
    { value: "inactivo", label: "Inactivos" },
  ];

  const openDeleteModal = useCallback((id, razonSocial) => {
    setModalDelete({ open: true, id, razonSocial });
  }, []);

  const closeDeleteModal = useCallback(() => {
    setModalDelete({ open: false, id: null, razonSocial: "" });
  }, []);

  // Reiniciar página al cambiar búsqueda o filtro
  const handleSetSearch = useCallback((value) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleSetFilterEstado = useCallback((value) => {
    setFilterEstado(value);
    setPage(1);
  }, []);

  return {
    proveedores,
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
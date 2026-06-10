import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCategorias,
  deleteCategoria,
  toggleCategoriaEstado,
  hasCategoriaProductosAsociados,
} from "../services/categoriasService";

export function useCategorias() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [page, setPage] = useState(1);
  const [modalForm, setModalForm] = useState({
    open: false,
    mode: "create",
    title: "",
    initialData: null,
  });
  const [modalDelete, setModalDelete] = useState({
    open: false,
    id: null,
    nombre: "",
  });

  // Mapeo de filtro estado a valor esperado por el backend
  const estadoParam = filterEstado === "activa" ? "true" : filterEstado === "inactiva" ? "false" : "";

  const {
    data: responseData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["categorias", page, search, estadoParam],
    queryFn: () => getCategorias({ page, per_page: 10, search, estado: estadoParam }),
    keepPreviousData: true,
    staleTime: 1000 * 60,
  });

  const categoriasRaw = responseData?.data || [];
  const pagination = responseData?.pagination || { total_pages: 1, current_page: 1 };

  // Normalizar datos para la tabla
  const categorias = categoriasRaw.map((categoria) => ({
    id: categoria.id,
    nombre: categoria.nombre,
    descripcion: categoria.descripcion || "",
    estado: categoria.estado ? "activa" : "inactiva",
  }));

  const loading = isLoading;
  const error = isError ? "No se pudieron cargar las categorías" : null;
  const totalPages = pagination.total_pages;

  const loadCategorias = useCallback(() => {
    refetch();
  }, [refetch]);

  const eliminarCategoria = useCallback(
    async (id, nombre) => {
      if (!id) return { success: false, error: "ID de categoría inválido" };
      try {
        const hasProductos = await hasCategoriaProductosAsociados(id);
        if (hasProductos) {
          return {
            success: false,
            error: "No se puede eliminar la categoría porque tiene productos asociados",
          };
        }

        await deleteCategoria(id);
        await loadCategorias();
        return { success: true };
      } catch (error) {
        console.error("Error al eliminar:", error);
        return { success: false, error: "Error al eliminar la categoría" };
      }
    },
    [loadCategorias]
  );

  const cambiarEstado = useCallback(
    async (id, estadoActual) => {
      if (!id) return { success: false, error: "ID de categoría inválido" };
      try {
        const estadoActualBoolean = estadoActual === "activa";
        await toggleCategoriaEstado(id, estadoActualBoolean);
        await loadCategorias();
        return { success: true };
      } catch (error) {
        console.error("Error al cambiar estado:", error);
        return { success: false, error: "Error al cambiar el estado" };
      }
    },
    [loadCategorias]
  );

  // Reiniciar a página 1 cuando cambian búsqueda o filtro
  const handleSetSearch = useCallback((value) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleSetFilterEstado = useCallback((value) => {
    setFilterEstado(value);
    setPage(1);
  }, []);

  const openCreateModal = useCallback(() => {
    setModalForm({
      open: true,
      mode: "create",
      title: "Crear Nueva Categoría",
      initialData: null,
    });
  }, []);

  const openEditModal = useCallback((item) => {
    if (!item || !item.id) return;
    setModalForm({
      open: true,
      mode: "edit",
      title: `Editar Categoría: ${item.nombre}`,
      initialData: {
        id: item.id,
        nombre: item.nombre,
        descripcion: item.descripcion,
        estado: item.estado === "activa",
      },
    });
  }, []);

  const openViewModal = useCallback((item) => {
    if (!item || !item.id) return;
    setModalForm({
      open: true,
      mode: "view",
      title: `Detalle de Categoría: ${item.nombre}`,
      initialData: {
        id: item.id,
        nombre: item.nombre,
        descripcion: item.descripcion,
        estado: item.estado === "activa",
      },
    });
  }, []);

  const closeFormModal = useCallback(() => {
    setModalForm({ open: false, mode: "create", title: "", initialData: null });
  }, []);

  const openDeleteModal = useCallback((id, nombre) => {
    if (!id) return;
    setModalDelete({ open: true, id, nombre });
  }, []);

  const closeDeleteModal = useCallback(() => {
    setModalDelete({ open: false, id: null, nombre: "" });
  }, []);

  return {
    categorias,
    loading,
    error,
    search,
    setSearch: handleSetSearch,
    filterEstado,
    setFilterEstado: handleSetFilterEstado,
    page,
    setPage,
    totalPages,
    loadCategorias,
    eliminarCategoria,
    cambiarEstado,
    modalForm,
    modalDelete,
    openCreateModal,
    openEditModal,
    openViewModal,
    closeFormModal,
    openDeleteModal,
    closeDeleteModal,
  };
}
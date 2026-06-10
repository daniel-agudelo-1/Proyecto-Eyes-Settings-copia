import { useState, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { marcasService } from '../services/marcasService';
import { normalizeMarcaForList } from '../utils/marcasUtils';
import { useActionBlocker } from '@shared/hooks/useActionBlocker';

export function useMarcas() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [page, setPage] = useState(1);
  
  const [notification, setNotification] = useState({
    isVisible: false,
    message: "",
    type: "success"
  });
  
  const submitButtonRef = useRef(null);

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

  const { execute: executeDelete } = useActionBlocker();
  const { execute: executeStatusChange } = useActionBlocker();
  const { execute: executeSave, isProcessing: isProcessingSave } = useActionBlocker();

  const searchFilters = [
    { value: '', label: 'Todos' },
    { value: 'activa', label: 'Activas' },
    { value: 'inactiva', label: 'Inactivas' }
  ];

  const estadoParam = filterEstado === "activa" ? "activa" : filterEstado === "inactiva" ? "inactiva" : "";

  const {
    data: responseData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["marcas", page, search, estadoParam],
    queryFn: () => marcasService.getMarcas({ page, per_page: 10, search, estado: estadoParam }),
    keepPreviousData: true,
    staleTime: 1000 * 60,
  });

  const marcasRaw = responseData?.data || [];
  const pagination = responseData?.pagination || { total_pages: 1, current_page: 1 };
  const totalPages = pagination.total_pages;

  const marcas = marcasRaw.map(marca => normalizeMarcaForList(marca));
  const loading = isLoading;
  const error = isError ? "No se pudieron cargar las marcas" : null;

  const showNotification = useCallback((message, type = "success") => {
    setNotification({ isVisible: true, message, type });
  }, []);

  const handleCloseNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  }, []);

  const limpiarAriaHidden = useCallback(() => {
    setTimeout(() => {
      const root = document.getElementById('root');
      if (root && root.hasAttribute('aria-hidden')) {
        root.removeAttribute('aria-hidden');
      }
      document.body.style.pointerEvents = 'auto';
    }, 300);
  }, []);

  const handleCloseForm = useCallback(() => {
    setModalForm({ open: false, mode: "create", title: "", initialData: null });
    limpiarAriaHidden();
  }, [limpiarAriaHidden]);

  const loadMarcas = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["marcas"] });
  }, [queryClient]);

  const handleSetSearch = useCallback((value) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleSetFilterEstado = useCallback((value) => {
    setFilterEstado(value);
    setPage(1);
  }, []);

  const handleFormSubmit = useCallback(async (data) => {
    await executeSave(async () => {
      let success = false;
      
      if (modalForm.mode === "create") {
        await marcasService.createMarca(data);
        success = true;
        showNotification("Marca creada exitosamente", "success");
      } else if (modalForm.mode === "edit") {
        await marcasService.updateMarca(modalForm.initialData.id, data);
        success = true;
        showNotification("Marca actualizada exitosamente", "success");
      }
      
      if (success) {
        handleCloseForm();
        await loadMarcas();
      }
    });
  }, [modalForm.mode, modalForm.initialData, showNotification, loadMarcas, executeSave, handleCloseForm]);

  const handleDelete = useCallback((id, nombre) => {
    if (!id) {
      showNotification("Error: No se puede eliminar la marca", "error");
      return;
    }
    setModalDelete({ open: true, id, nombre });
  }, [showNotification]);

  const confirmDelete = useCallback(async () => {
    await executeDelete(async () => {
      if (!modalDelete.id) {
        showNotification("Error: No se pudo identificar la marca a eliminar", "error");
        setModalDelete({ open: false, id: null, nombre: "" });
        limpiarAriaHidden();
        return;
      }

      const tieneProductos = await marcasService.hasMarcaProductosAsociados(modalDelete.id);
      
      if (tieneProductos) {
        showNotification(
          `No se puede eliminar la marca "${modalDelete.nombre}" porque tiene productos asociados`, 
          "warning"
        );
        setModalDelete({ open: false, id: null, nombre: "" });
        limpiarAriaHidden();
        return;
      }
      
      await marcasService.deleteMarca(modalDelete.id);
      
      setModalDelete({ open: false, id: null, nombre: "" });
      limpiarAriaHidden();
      await loadMarcas();
      
      showNotification(`Marca "${modalDelete.nombre}" eliminada exitosamente`, "success");
    });
  }, [modalDelete.id, modalDelete.nombre, showNotification, loadMarcas, limpiarAriaHidden, executeDelete]);

  const handleStatusChange = useCallback(async (row, newStatus) => {
    await executeStatusChange(async () => {
      const estadoFinal = newStatus !== undefined 
        ? newStatus 
        : (row.estado === "activa" ? "inactiva" : "activa");

      await marcasService.toggleMarcaEstado(row.id, estadoFinal === "activa");
      await loadMarcas();
      
      const mensaje = estadoFinal === "activa" 
        ? `Marca "${row.nombre}" activada exitosamente`
        : `Marca "${row.nombre}" desactivada exitosamente`;
      
      showNotification(mensaje, "success");
    });
  }, [showNotification, loadMarcas, executeStatusChange]);

  const handleOpenCreate = useCallback(() => {
    setModalForm({ open: true, mode: "create", title: "Crear Nueva Marca", initialData: null });
    limpiarAriaHidden();
  }, [limpiarAriaHidden]);

  const handleOpenEdit = useCallback((item) => {
    if (!item?.id) {
      showNotification("Error: No se puede editar la marca", "error");
      return;
    }
    setModalForm({ open: true, mode: "edit", title: `Editar Marca: ${item.nombre}`, initialData: item });
    limpiarAriaHidden();
  }, [limpiarAriaHidden, showNotification]);

  const handleOpenView = useCallback((item) => {
    if (!item?.id) {
      showNotification("Error: No se puede ver la marca", "error");
      return;
    }
    setModalForm({ open: true, mode: "view", title: `Detalle de Marca: ${item.nombre}`, initialData: item });
    limpiarAriaHidden();
  }, [limpiarAriaHidden, showNotification]);

  const handleCancelDelete = useCallback(() => {
    setModalDelete({ open: false, id: null, nombre: "" });
    limpiarAriaHidden();
  }, [limpiarAriaHidden]);

  const handleModalConfirm = useCallback(() => {
    if (modalForm.mode === "view") {
      handleCloseForm();
      return;
    }
    if (submitButtonRef.current && !isProcessingSave()) {
      submitButtonRef.current.click();
    }
  }, [modalForm.mode, handleCloseForm, submitButtonRef, isProcessingSave]);

  return {
    marcas,
    loading,
    error,
    search,
    filterEstado,
    page,
    setPage,
    totalPages,
    notification,
    modalForm,
    modalDelete,
    submitButtonRef,
    isProcessingSave,
    searchFilters,
    setSearch: handleSetSearch,
    setFilterEstado: handleSetFilterEstado,
    loadMarcas,
    handleFormSubmit,
    handleDelete,
    confirmDelete,
    handleStatusChange,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenView,
    handleCloseForm,
    handleCancelDelete,
    handleCloseNotification,
    handleModalConfirm,
  };
}
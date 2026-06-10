import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ServicioData } from '../services/serviciosService';
import { useActionBlocker } from '@shared/hooks/useActionBlocker';
import { formatCOP } from '@shared/utils/formatCOP';
import axios from '@lib/axios';

const ESTADO = {
  ACTIVO: 'activo',
  INACTIVO: 'inactivo'
};

const MODAL_MODE = {
  CREATE: 'create',
  EDIT: 'edit',
  VIEW: 'view'
};

export const useServicios = () => {
  const queryClient = useQueryClient();
  const { execute: executeDelete } = useActionBlocker();
  const { execute: executeStatusChange } = useActionBlocker();

  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [page, setPage] = useState(1);
  const [notification, setNotification] = useState({
    isVisible: false,
    message: '',
    type: 'success'
  });
  const [modalForm, setModalForm] = useState({
    open: false,
    mode: MODAL_MODE.CREATE,
    title: '',
    initialData: null,
  });
  const [modalDelete, setModalDelete] = useState({
    open: false,
    id: null,
    nombre: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const clickLockRef = useRef(false);
  const submitButtonRef = useRef(null);

  // Estado para filtro (activo/inactivo) como string para el backend
  const estadoParam = filterEstado === 'activo' ? 'activo' : filterEstado === 'inactivo' ? 'inactivo' : '';

  // ---------- Queries con paginación ----------
  const { data: responseData, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['servicios', page, search, estadoParam],
    queryFn: () => ServicioData.getServicios({ page, per_page: 10, search, estado: estadoParam }),
    keepPreviousData: true,
    staleTime: 2 * 60 * 1000,
  });

  const serviciosRaw = responseData?.data || [];
  const pagination = responseData?.pagination || { total_pages: 1, current_page: 1 };
  const totalPages = pagination.total_pages;

  const servicios = serviciosRaw
    .map(servicio => ({
      id: servicio.id,
      nombre: servicio.nombre,
      descripcion: servicio.descripcion || '',
      duracion_min: servicio.duracion_min,
      precio: servicio.precio,
      estado: servicio.estado ? ESTADO.ACTIVO : ESTADO.INACTIVO
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));

  // ---------- Mutations ----------
  const createMutation = useMutation({
    mutationFn: ServicioData.createServicio,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['servicios'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => ServicioData.updateServicio(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['servicios'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: ServicioData.deleteServicio,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['servicios'] }),
  });

  // ---------- UI Helpers ----------
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ isVisible: true, message, type });
  }, []);

  const handleCloseNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  }, []);

  const cleanupModalState = useCallback(() => {
    setTimeout(() => {
      const root = document.getElementById('root');
      if (root?.hasAttribute('aria-hidden')) root.removeAttribute('aria-hidden');
      document.body.style.pointerEvents = 'auto';
    }, 300);
  }, []);

  const handleCloseForm = useCallback(() => {
    setModalForm({ open: false, mode: MODAL_MODE.CREATE, title: '', initialData: null });
    cleanupModalState();
  }, [cleanupModalState]);

  // ---------- CRUD Wrappers ----------
  const crearServicio = useCallback(async (data) => {
    setIsSaving(true);
    try {
      const result = await createMutation.mutateAsync(data);
      showNotification('Servicio creado exitosamente', 'success');
      handleCloseForm();
      return result;
    } catch (error) {
      showNotification(error.message || 'Error al crear servicio', 'error');
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [createMutation, showNotification, handleCloseForm]);

  const editarServicio = useCallback(async (id, data) => {
    setIsSaving(true);
    try {
      const result = await updateMutation.mutateAsync({ id, data });
      showNotification('Servicio actualizado exitosamente', 'success');
      handleCloseForm();
      return result;
    } catch (error) {
      showNotification(error.message || 'Error al actualizar servicio', 'error');
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [updateMutation, showNotification, handleCloseForm]);

  const eliminarServicio = useCallback(async (id, nombre) => {
    await executeDelete(async () => {
      try {
        await deleteMutation.mutateAsync(id);
        showNotification(`Servicio "${nombre}" eliminado exitosamente`, 'success');
        setModalDelete({ open: false, id: null, nombre: '' });
        cleanupModalState();
      } catch (err) {
        let errorMessage = 'Error al eliminar el servicio';
        if (err.response?.status === 500) {
          errorMessage = 'Este servicio tiene citas registradas y no puede eliminarse. Desactívelo en su lugar.';
        } else if (err.message) {
          errorMessage = err.message;
        }
        showNotification(errorMessage, 'warning');
        setModalDelete({ open: false, id: null, nombre: '' });
        cleanupModalState();
      }
    });
  }, [deleteMutation, executeDelete, showNotification, cleanupModalState]);

  const cambiarEstado = useCallback(async (row) => {
    await executeStatusChange(async () => {
      const shouldActivate = row.estado !== ESTADO.ACTIVO;

      // Validación antes de desactivar
      if (!shouldActivate) {
        const estadosQueBloquean = await ServicioData.getEstadosQueBloquean();
        const citasResponse = await axios.get('/citas');
        const citasList = citasResponse.data.data || citasResponse.data || [];
        const citasQueBloquean = citasList.filter(cita =>
          cita.servicio_id === row.id && estadosQueBloquean.includes(cita.estado_cita_id)
        );
        if (citasQueBloquean.length > 0) {
          const estadosUnicos = [...new Set(citasQueBloquean.map(c => c.estado_nombre))];
          showNotification(
            `No se puede desactivar "${row.nombre}" porque tiene ${citasQueBloquean.length} cita(s) en estado: ${estadosUnicos.join(' y ')}.`,
            'error'
          );
          return;
        }
      }

      const payload = {
        nombre: row.nombre,
        duracion_min: Number(row.duracion_min) || 0,
        precio: Number(row.precio) || 0,
        descripcion: row.descripcion || '',
        estado: shouldActivate
      };
      await updateMutation.mutateAsync({ id: row.id, data: payload });
      showNotification(`Servicio "${row.nombre}" ${shouldActivate ? 'activado' : 'desactivado'} exitosamente`, 'success');
    });
  }, [executeStatusChange, updateMutation, showNotification]);

  // ---------- Modal Handlers ----------
  const handleOpenCreate = useCallback(() => {
    setModalForm({ open: true, mode: MODAL_MODE.CREATE, title: 'Crear Nuevo Servicio', initialData: null });
    cleanupModalState();
  }, [cleanupModalState]);

  const handleOpenEdit = useCallback((item) => {
    setModalForm({ open: true, mode: MODAL_MODE.EDIT, title: `Editar Servicio: ${item.nombre}`, initialData: item });
    cleanupModalState();
  }, [cleanupModalState]);

  const handleOpenView = useCallback((item) => {
    setModalForm({ open: true, mode: MODAL_MODE.VIEW, title: `Detalle de Servicio: ${item.nombre}`, initialData: item });
    cleanupModalState();
  }, [cleanupModalState]);

  const handleDelete = useCallback((id, nombre) => {
    setModalDelete({ open: true, id, nombre });
  }, []);

  const handleCancelDelete = useCallback(() => {
    setModalDelete({ open: false, id: null, nombre: '' });
    cleanupModalState();
  }, [cleanupModalState]);

  // Reiniciar página al cambiar búsqueda o filtro
  const handleSetSearch = useCallback((value) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleSetFilterEstado = useCallback((value) => {
    setFilterEstado(value);
    setPage(1);
  }, []);

  // ---------- Filtros y Tabla ----------
  const searchFilters = [
    { value: '', label: 'Todos' },
    { value: ESTADO.ACTIVO, label: 'Activos' },
    { value: ESTADO.INACTIVO, label: 'Inactivos' }
  ];

  const columns = [
    { field: 'nombre', header: 'Nombre' },
    { field: 'duracion_min', header: 'Duración', render: (row) => `${row.duracion_min} min` },
    { field: 'precio', header: 'Precio', render: (row) => formatCOP(row.precio) }
  ];

  const tableActions = [
    { label: 'Ver Detalles', type: 'view', onClick: (item) => handleOpenView(item) },
    { label: 'Editar', type: 'edit', onClick: (item) => handleOpenEdit(item) },
    { label: 'Eliminar', type: 'delete', onClick: (item) => handleDelete(item.id, item.nombre) },
  ];

  const handleModalConfirm = useCallback(() => {
    if (clickLockRef.current) return;
    if (modalForm.mode === MODAL_MODE.VIEW) {
      // En modo vista, no hacemos nada; la acción de editar se maneja desde el footer del Dialog
      return;
    }
    if (submitButtonRef.current) {
      clickLockRef.current = true;
      submitButtonRef.current.click();
    }
  }, [modalForm.mode]);

  return {
    servicios,
    loading: isLoading,
    error: queryError,
    search,
    setSearch: handleSetSearch,
    filterEstado,
    setFilterEstado: handleSetFilterEstado,
    page,
    setPage,
    totalPages,
    searchFilters,
    notification,
    handleCloseNotification,
    modalForm,
    modalDelete,
    submitButtonRef,
    isSaving,
    columns,
    tableActions,
    crearServicio,
    editarServicio,
    eliminarServicio,
    cambiarEstado,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenView,
    handleCloseForm,
    handleCancelDelete,
    handleModalConfirm,
  };
};
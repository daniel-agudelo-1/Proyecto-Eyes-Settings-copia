import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllNovedades,
  createNovedad,
  updateNovedad,
  deleteNovedad,
} from '../services/novedadesService';
import { getEmpleadosAgenda } from '@servicios/agenda';
import { normalizeNovedadesForList } from '../utils/novedadesUtils';

const PAGE_SIZE = 10; // elementos por página

export function useNovedades() {
  const queryClient = useQueryClient();

  // Estados de UI
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState(''); // '', 'activo', 'inactivo'
  const [modalForm, setModalForm] = useState({
    open: false,
    mode: 'create',
    title: '',
    initialData: null,
  });
  const [modalDelete, setModalDelete] = useState({
    open: false,
    id: null,
    descripcion: '',
  });

  // Empleados
  const { data: empleados = [] } = useQuery({
    queryKey: ['empleados-agenda'],
    queryFn: getEmpleadosAgenda,
    staleTime: 10 * 60 * 1000,
  });

  // Novedades (todas)
  const {
    data: novedadesRaw = [],
    isLoading: loadingNovedades,
    error: novedadesError,
    refetch,
  } = useQuery({
    queryKey: ['novedades'],
    queryFn: getAllNovedades,
    staleTime: 2 * 60 * 1000,
  });

  const novedadesNormalizadas = useMemo(() => {
    return normalizeNovedadesForList(novedadesRaw, empleados);
  }, [novedadesRaw, empleados]);

  // Filtrado local
  const novedadesFiltradas = useMemo(() => {
    let filtered = novedadesNormalizadas;
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(n =>
        n.empleado_nombre?.toLowerCase().includes(lowerSearch) ||
        n.tipo_label?.toLowerCase().includes(lowerSearch) ||
        n.motivo?.toLowerCase().includes(lowerSearch)
      );
    }
    if (filterEstado) {
      filtered = filtered.filter(n => n.estado === filterEstado);
    }
    return filtered;
  }, [novedadesNormalizadas, search, filterEstado]);

  // Paginación local
  const totalItems = novedadesFiltradas.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const paginatedNovedades = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return novedadesFiltradas.slice(start, end);
  }, [novedadesFiltradas, page]);

  // Mutaciones
  const createMutation = useMutation({
    mutationFn: createNovedad,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['novedades'] });
      if (paginatedNovedades.length === PAGE_SIZE && totalItems % PAGE_SIZE === 0) {
        setPage(totalPages + 1);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateNovedad(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['novedades'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNovedad,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['novedades'] });
      if (paginatedNovedades.length === 1 && page > 1) {
        setPage(page - 1);
      }
    },
  });

  // Wrappers
  const crearNovedad = useCallback(async (data) => {
    return await createMutation.mutateAsync(data);
  }, [createMutation]);

  const editarNovedad = useCallback(async (id, data) => {
    return await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const eliminarNovedad = useCallback(async (id) => {
    return await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const cambiarEstado = useCallback(async (item, nuevoEstado) => {
    const activo = nuevoEstado === 'activo';
    if (item.activo === activo) return { success: true };
    const payload = {
      empleado_id: item.empleado_id,
      fecha_inicio: item.fecha_inicio,
      fecha_fin: item.fecha_fin,
      hora_inicio: item.hora_inicio || null,
      hora_fin: item.hora_fin || null,
      tipo: item.tipo,
      motivo: item.motivo,
      activo,
    };
    return await updateMutation.mutateAsync({ id: item.id, data: payload });
  }, [updateMutation]);

  // Handlers de modales (igual que antes)
  const openCreateModal = useCallback(() => {
    setModalForm({ open: true, mode: 'create', title: 'Crear Novedad', initialData: null });
  }, []);

  const openEditModal = useCallback((item) => {
    setModalForm({
      open: true,
      mode: 'edit',
      title: `Editar Novedad: ${item.descripcion}`,
      initialData: {
        id: item.id,
        empleado_id: item.empleado_id,
        fecha_inicio: item.fecha_inicio,
        fecha_fin: item.fecha_fin,
        hora_inicio: item.hora_inicio,
        hora_fin: item.hora_fin,
        tipo: item.tipo,
        motivo: item.motivo,
        activo: item.activo,
      },
    });
  }, []);

  const openViewModal = useCallback((item) => {
    setModalForm({
      open: true,
      mode: 'view',
      title: `Detalle Novedad: ${item.descripcion}`,
      initialData: {
        id: item.id,
        empleado_id: item.empleado_id,
        empleado_nombre: item.empleado_nombre,
        fecha_inicio: item.fecha_inicio,
        fecha_fin: item.fecha_fin,
        hora_inicio: item.hora_inicio,
        hora_fin: item.hora_fin,
        tipo: item.tipo,
        motivo: item.motivo,
        activo: item.activo,
      },
    });
  }, []);

  const closeFormModal = useCallback(() => {
    setModalForm({ open: false, mode: 'create', title: '', initialData: null });
  }, []);

  const openDeleteModal = useCallback((id, descripcion) => {
    setModalDelete({ open: true, id, descripcion });
  }, []);

  const closeDeleteModal = useCallback(() => {
    setModalDelete({ open: false, id: null, descripcion: '' });
  }, []);

  const estadoFilters = [
    { value: '', label: 'Todos los estados' },
    { value: 'activo', label: 'Activos' },
    { value: 'inactivo', label: 'Inactivos' },
  ];

  const recargar = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    novedades: paginatedNovedades,
    empleados,
    loading: loadingNovedades,
    error: novedadesError,
    // Paginación
    page,
    setPage,
    perPage: PAGE_SIZE,
    totalPages,
    // Filtros
    search,
    setSearch,
    filterEstado,
    setFilterEstado,
    estadoFilters,
    // Acciones
    eliminarNovedad,
    cambiarEstado,
    crearNovedad,
    editarNovedad,
    recargar,
    // Modales
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
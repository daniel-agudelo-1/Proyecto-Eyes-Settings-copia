import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllHorarios, createHorario, updateHorario, deleteHorario, updateEstadoHorario } from '../services/horariosService';
import { getEmpleadosAgenda } from '@servicios/agenda';
import { normalizeHorariosForList } from '../utils/horariosUtils';

const PAGE_SIZE = 10; // elementos por página

export function useHorarios() {
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

  // Carga de empleados
  const { data: empleados = [] } = useQuery({
    queryKey: ['empleados-agenda'],
    queryFn: getEmpleadosAgenda,
    staleTime: 10 * 60 * 1000,
  });

  // Carga de todos los horarios (sin paginación desde el backend)
  const {
    data: horariosRaw = [],
    isLoading: loadingHorarios,
    error: horariosError,
    refetch,
  } = useQuery({
    queryKey: ['horarios'],
    queryFn: getAllHorarios,
    staleTime: 2 * 60 * 1000,
  });

  // Normalización completa
  const horariosNormalizados = useMemo(() => {
    return normalizeHorariosForList(horariosRaw, empleados);
  }, [horariosRaw, empleados]);

  // Filtrado local
  const horariosFiltrados = useMemo(() => {
    let filtered = horariosNormalizados;
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(h =>
        h.empleado_nombre?.toLowerCase().includes(lowerSearch) ||
        h.dia_nombre?.toLowerCase().includes(lowerSearch) ||
        h.hora_inicio?.includes(search) ||
        h.hora_final?.includes(search)
      );
    }
    if (filterEstado) {
      filtered = filtered.filter(h => h.estado === filterEstado);
    }
    return filtered;
  }, [horariosNormalizados, search, filterEstado]);

  // Paginación local
  const totalItems = horariosFiltrados.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const paginatedHorarios = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return horariosFiltrados.slice(start, end);
  }, [horariosFiltrados, page]);

  // Mutaciones (invalidan la caché)
  const createMutation = useMutation({
    mutationFn: createHorario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horarios'] });
      // Si agregamos un horario y estamos en la última página, nos aseguramos de verlo
      if (paginatedHorarios.length === PAGE_SIZE && totalItems % PAGE_SIZE === 0) {
        setPage(totalPages + 1);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateHorario(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['horarios'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteHorario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horarios'] });
      if (paginatedHorarios.length === 1 && page > 1) {
        setPage(page - 1);
      }
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, activo }) => updateEstadoHorario(id, activo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['horarios'] }),
  });

  // Wrappers
  const eliminarHorario = useCallback(async (id) => {
    return await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const cambiarEstado = useCallback(async (row, nuevoEstado) => {
    const activo = nuevoEstado === 'activo';
    return await toggleStatusMutation.mutateAsync({ id: row.id, activo });
  }, [toggleStatusMutation]);

  const crearHorario = useCallback(async (data) => {
    return await createMutation.mutateAsync(data);
  }, [createMutation]);

  const editarHorario = useCallback(async (id, data) => {
    return await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  // Handlers de modales
  const openCreateModal = useCallback(() => {
    setModalForm({ open: true, mode: 'create', title: 'Crear Nuevo Horario', initialData: null });
  }, []);

  const openEditModal = useCallback((item) => {
    const horarioParaEditar = {
      id: item.id,
      empleado_id: item.empleado_id,
      dia: item.dia,
      hora_inicio: item.hora_inicio,
      hora_final: item.hora_final,
      activo: item.estado === 'activo',
    };
    setModalForm({
      open: true,
      mode: 'edit',
      title: `Editar Horario: ${item.empleado_nombre} - ${item.dia_nombre} ${item.hora_inicio}`,
      initialData: horarioParaEditar,
    });
  }, []);

  const openViewModal = useCallback((item) => {
    const horarioParaVer = {
      id: item.id,
      empleado_id: item.empleado_id,
      empleado_nombre: item.empleado_nombre,
      dia: item.dia,
      dia_nombre: item.dia_nombre,
      hora_inicio: item.hora_inicio,
      hora_final: item.hora_final,
      activo: item.estado === 'activo',
    };
    setModalForm({
      open: true,
      mode: 'view',
      title: `Detalle de Horario: ${item.empleado_nombre} - ${item.dia_nombre} ${item.hora_inicio}`,
      initialData: horarioParaVer,
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
    horarios: paginatedHorarios,
    horariosRaw: horariosNormalizados,
    empleados,
    loading: loadingHorarios,
    error: horariosError,
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
    eliminarHorario,
    cambiarEstado,
    crearHorario,
    editarHorario,
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
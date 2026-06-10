import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllCampanasSalud,
  updateCampanaSalud,
  deleteCampanaSalud,
} from '../services/campanasSaludService';
import { getEstadosCita } from '../services/estadosCitaCampanaService';
import { ESTADOS_BLOQUEADOS, ESTADO_CITA } from '../utils/constants';
import { formatearFechaLocal, horaA12 } from '../utils/campanasSaludUtils';

const PAGE_SIZE = 10;

/**
 * Hook para la gestión de la lista de campañas de salud.
 * Obtiene todas las campañas y estados de cita mediante React Query,
 * y proporciona paginación local, filtros y mutaciones.
 */
export const useCampanasSalud = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState(''); // '' o id del estado
  const [notification, setNotification] = useState({ open: false, type: 'success', message: '' });
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, empresa: '' });

  const showNotification = useCallback(
    (type, message) => setNotification({ open: true, type, message }),
    []
  );
  const hideNotification = useCallback(
    () => setNotification((prev) => ({ ...prev, open: false })),
    []
  );

  // Consulta de estados de cita
  const { data: estadosCita = [] } = useQuery({
    queryKey: ['estados-cita'],
    queryFn: getEstadosCita,
    staleTime: 10 * 60 * 1000,
  });

  // Consulta de todas las campañas (sin paginación del backend)
  const {
    data: rawCampanas = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['campanas-salud'],
    queryFn: getAllCampanasSalud,
    staleTime: 2 * 60 * 1000,
  });

  // Transformación de una campaña (para mostrar en tabla)
  const transformCampana = useCallback(
    (campana, estadosActuales) => {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const [y, m, d] = (campana.fecha || '').split('T')[0].split('-').map(Number);
      const fechaCampana = new Date(y, m - 1, d);
      fechaCampana.setHours(0, 0, 0, 0);

      const completadaId =
        estadosActuales.find((e) => e.nombre?.toLowerCase() === 'completada')?.id ||
        ESTADO_CITA.COMPLETADA;

      let estadoCitaId = campana.estado_cita_id;
      if (fechaCampana < hoy && !ESTADOS_BLOQUEADOS.includes(estadoCitaId)) {
        estadoCitaId = completadaId;
      }

      const estadoObj = estadosActuales.find((e) => e.id === estadoCitaId);
      const estadoObjOriginal = estadosActuales.find((e) => e.id === campana.estado_cita_id);
      const estadoNombre = estadoObj?.nombre || estadoObjOriginal?.nombre || 'Pendiente';
      const bloqueada = ESTADOS_BLOQUEADOS.includes(estadoCitaId);

      return {
        id: campana.id,
        empleado_id: campana.empleado_id,
        empleado_nombre: campana.empleado_nombre || 'No asignado',
        empresa: campana.empresa,
        contacto: campana.contacto || '-',
        fecha: campana.fecha,
        fechaFormateada: formatearFechaLocal((campana.fecha || '').split('T')[0]),
        fechaObj: fechaCampana,
        hora: campana.hora ? horaA12(campana.hora) : '-',
        horaRaw: campana.hora || '',
        direccion: campana.direccion || '-',
        observaciones: campana.observaciones || '-',
        estado_cita_id: estadoCitaId,
        estadoOriginal: campana.estado_cita_id,
        estado: estadoNombre,
        estadosDisponibles: estadosActuales.map((e) => e.nombre),
        esEditable: !bloqueada,
        esEliminable: !bloqueada,
      };
    },
    []
  );

  // Transformar todas las campañas usando los estados actuales
  const campanasNormalizadas = useMemo(() => {
    if (!rawCampanas.length || !estadosCita.length) return [];
    return rawCampanas.map((c) => transformCampana(c, estadosCita));
  }, [rawCampanas, estadosCita, transformCampana]);

  // Actualización automática de campañas vencidas en segundo plano
  useEffect(() => {
    if (!rawCampanas.length || !estadosCita.length) return;

    const updateVencidas = async () => {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const completadaId =
        estadosCita.find((e) => e.nombre?.toLowerCase() === 'completada')?.id ||
        ESTADO_CITA.COMPLETADA;

      const promises = [];
      for (const campana of rawCampanas) {
        if (ESTADOS_BLOQUEADOS.includes(campana.estado_cita_id)) continue;
        const [y, m, d] = (campana.fecha || '').split('T')[0].split('-').map(Number);
        const fechaCampana = new Date(y, m - 1, d);
        fechaCampana.setHours(0, 0, 0, 0);
        if (fechaCampana < hoy && campana.estado_cita_id !== completadaId) {
          promises.push(updateCampanaSalud(campana.id, { estado_cita_id: completadaId }));
        }
      }
      if (promises.length) {
        await Promise.all(promises);
        queryClient.invalidateQueries({ queryKey: ['campanas-salud'] });
      }
    };

    updateVencidas();
  }, [rawCampanas, estadosCita, queryClient]);

  // Filtrado local
  const campanasFiltradas = useMemo(() => {
    let filtered = campanasNormalizadas;
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.empresa.toLowerCase().includes(lowerSearch) ||
          (c.contacto !== '-' && c.contacto.toLowerCase().includes(lowerSearch))
      );
    }
    if (filterEstado) {
      const estadoId = parseInt(filterEstado, 10);
      filtered = filtered.filter((c) => c.estado_cita_id === estadoId);
    }
    return filtered;
  }, [campanasNormalizadas, search, filterEstado]);

  // Paginación local
  const totalItems = campanasFiltradas.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const paginatedCampanas = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return campanasFiltradas.slice(start, end);
  }, [campanasFiltradas, page]);

  // Mutaciones
  const deleteMutation = useMutation({
    mutationFn: deleteCampanaSalud,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campanas-salud'] });
      if (paginatedCampanas.length === 1 && page > 1) {
        setPage(page - 1);
      }
    },
  });

  const updateEstadoMutation = useMutation({
    mutationFn: ({ id, estado_cita_id }) => updateCampanaSalud(id, { estado_cita_id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campanas-salud'] }),
  });

  const handleDelete = useCallback(
    async (id) => {
      const campana = campanasNormalizadas.find((c) => c.id === id);
      if (campana && ESTADOS_BLOQUEADOS.includes(campana.estado_cita_id)) {
        showNotification(
          'warning',
          `No se puede eliminar la campaña "${campana.empresa}": está ${campana.estado.toLowerCase()} y no admite eliminación.`
        );
        return { success: false };
      }
      try {
        await deleteMutation.mutateAsync(id);
        showNotification('success', `Campaña "${campana?.empresa || ''}" eliminada correctamente`);
        return { success: true };
      } catch (err) {
        const msg = err.response?.data?.error || 'Error al eliminar la campaña';
        showNotification('error', msg);
        return { success: false, error: msg };
      }
    },
    [campanasNormalizadas, deleteMutation, showNotification]
  );

  const handleCambioEstado = useCallback(
    async (campana, nuevoEstadoNombre) => {
      let targetCampana = campana;
      let estadoNombre = nuevoEstadoNombre;
      if (typeof campana === 'number') {
        targetCampana = campanasNormalizadas.find((c) => c.id === campana);
        estadoNombre = nuevoEstadoNombre;
      }

      if (!targetCampana) {
        showNotification('error', 'Campaña no encontrada');
        return { success: false };
      }

      const estadoSeleccionado = estadosCita.find((e) => e.nombre === estadoNombre);
      if (!estadoSeleccionado) {
        showNotification('error', 'Estado no válido');
        return { success: false };
      }

      if (ESTADOS_BLOQUEADOS.includes(targetCampana.estado_cita_id)) {
        showNotification(
          'warning',
          `No se puede cambiar el estado: la campaña "${targetCampana.empresa}" está ${targetCampana.estado.toLowerCase()} y no admite modificaciones.`
        );
        return { success: false };
      }

      try {
        await updateEstadoMutation.mutateAsync({
          id: targetCampana.id,
          estado_cita_id: estadoSeleccionado.id,
        });
        showNotification(
          'success',
          `Estado de la campaña "${targetCampana.empresa}" actualizado correctamente`
        );
        return { success: true };
      } catch (err) {
        const msg = err.response?.data?.error || 'Error al actualizar el estado';
        showNotification('error', msg);
        return { success: false, error: msg };
      }
    },
    [campanasNormalizadas, estadosCita, updateEstadoMutation, showNotification]
  );

  // Opciones de filtro por estado
  const estadoFilterOptions = [
    { value: '', label: 'Todos los estados' },
    ...estadosCita
      .filter(est => ['Pendiente', 'Completada', 'Cancelada'].includes(est.nombre))
      .map(est => ({ value: est.id.toString(), label: est.nombre })),
  ];

  return {
    campanas: paginatedCampanas,
    totalPages,
    page,
    setPage,
    search,
    setSearch,
    filterEstado,
    setFilterEstado,
    estadoFilterOptions,
    loading: isLoading,
    error,
    notification,
    estadosCita,
    handleDelete,
    handleCambioEstado,
    hideNotification,
    showNotification,
    refetch,
  };
};
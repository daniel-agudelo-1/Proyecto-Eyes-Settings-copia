import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createCampanaSalud,
  updateCampanaSalud,
  getCampanaSaludById,
  getAllCampanasSalud,
} from '../services/campanasSaludService';
import { getEmpleadosAgenda } from '@servicios/agenda';
import { getHorariosByEmpleado } from '@servicios/horario';
import { getEstadosCita } from '../services/estadosCitaCampanaService';
import {
  formatearHora24,
  getBackendDay,
  generarSlotsHorarios,
} from '../utils/campanasSaludUtils';

const INITIAL_FORM_DATA = {
  empleado_id: '',
  empresa: '',
  nit_empresa: '',
  contacto: '',
  fecha: '',
  hora: '',
  direccion: '',
  observaciones: '',
  estado_cita_id: null,
};

export const useCampanaSaludForm = (id, mode = 'create') => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = mode === 'edit';
  const isView = mode === 'view';

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [originalData, setOriginalData] = useState(null);
  const [horariosEmpleado, setHorariosEmpleado] = useState([]);
  const [horasDisponibles, setHorasDisponibles] = useState([]);
  const [notification, setNotification] = useState({ open: false, type: 'success', message: '' });
  const [errorMessage, setErrorMessage] = useState('');

  const showNotification = (type, message) => setNotification({ open: true, type, message });
  const hideNotification = () => setNotification((prev) => ({ ...prev, open: false }));

  // ---------- Consultas ----------
  const { data: empleadosRaw = [] } = useQuery({
    queryKey: ['empleados-agenda'],
    queryFn: getEmpleadosAgenda,
    staleTime: 10 * 60 * 1000,
  });
  const empleados = empleadosRaw.filter(emp => emp.activo === true || emp.estado === true);

  const { data: estadosCita = [] } = useQuery({
    queryKey: ['estados-cita'],
    queryFn: getEstadosCita,
    staleTime: 10 * 60 * 1000,
  });

  // Obtener ID del estado "Pendiente" (o usar 2 como fallback)
  const estadoPendienteId = estadosCita.find(e => e.nombre?.toLowerCase() === 'pendiente')?.id || 2;

  useEffect(() => {
    if (estadoPendienteId && !formData.estado_cita_id && mode === 'create') {
      setFormData(prev => ({ ...prev, estado_cita_id: estadoPendienteId }));
    }
  }, [estadoPendienteId, mode]);

  const { data: campanaData, isLoading: loadingCampana } = useQuery({
    queryKey: ['campana-salud', id],
    queryFn: () => getCampanaSaludById(id),
    enabled: (isEdit || isView) && !!id,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (campanaData && (isEdit || isView)) {
      const loaded = {
        empleado_id: campanaData.empleado_id || '',
        empresa: campanaData.empresa || '',
        nit_empresa: campanaData.nit_empresa || '',
        contacto: campanaData.contacto || '',
        fecha: campanaData.fecha ? campanaData.fecha.substring(0, 10) : '',
        hora: campanaData.hora ? formatearHora24(campanaData.hora) : '',
        direccion: campanaData.direccion || '',
        observaciones: campanaData.observaciones || '',
        estado_cita_id: campanaData.estado_cita_id || estadoPendienteId,
      };
      setFormData(loaded);
      setOriginalData(loaded);
    }
  }, [campanaData, isEdit, isView, estadoPendienteId]);

  // ---------- Horarios ----------
  const loadHorariosEmpleado = useCallback(async (empleadoId) => {
    if (!empleadoId) {
      setHorariosEmpleado([]);
      return;
    }
    try {
      const data = await getHorariosByEmpleado(empleadoId);
      const activos = (data || []).filter((h) => h.activo !== false);
      setHorariosEmpleado(activos);
    } catch {
      setHorariosEmpleado([]);
    }
  }, []);

  useEffect(() => {
    if (formData.empleado_id) {
      loadHorariosEmpleado(formData.empleado_id);
    }
  }, [formData.empleado_id, loadHorariosEmpleado]);

  useEffect(() => {
    if (!formData.empleado_id || !formData.fecha) {
      setHorasDisponibles([]);
      return;
    }
    const [y, m, d] = formData.fecha.split('-').map(Number);
    const fechaObj = new Date(y, m - 1, d);
    const diaSemana = getBackendDay(fechaObj);
    const horariosDelDia = horariosEmpleado.filter((h) => h.dia === diaSemana);

    if (horariosDelDia.length === 0) {
      setHorasDisponibles([]);
      return;
    }

    let slots = [];
    horariosDelDia.forEach((h) => {
      slots = slots.concat(generarSlotsHorarios(h.hora_inicio, h.hora_final));
    });
    const vistos = new Set();
    slots = slots.filter((s) => {
      if (vistos.has(s.value)) return false;
      vistos.add(s.value);
      return true;
    });
    slots.sort((a, b) => a.value.localeCompare(b.value));
    setHorasDisponibles(slots);

    if (formData.hora && !slots.find((s) => s.value === formData.hora)) {
      setFormData((prev) => ({ ...prev, hora: '' }));
    }
  }, [formData.empleado_id, formData.fecha, horariosEmpleado]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!formData.empleado_id) return 'Debe seleccionar un empleado responsable';
    if (!formData.empresa?.trim()) return 'El nombre de la empresa es requerido';
    if (!formData.nit_empresa?.trim()) return 'El NIT de la empresa es requerido';
    if (formData.nit_empresa?.trim().length < 8) return 'El NIT debe tener al menos 8 dígitos';
    if (!formData.fecha) return 'La fecha es requerida';
    // Validar formato de fecha YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.fecha)) return 'Formato de fecha inválido (use YYYY-MM-DD)';
    if (!formData.hora) return 'La hora es requerida';
    // Validar formato de hora HH:MM
    if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(formData.hora)) return 'Formato de hora inválido (use HH:MM)';
    if (formData.contacto?.trim() && formData.contacto.trim().length !== 10) {
      return 'El teléfono de contacto debe tener exactamente 10 dígitos';
    }
    return null;
  };

  const validarDuplicados = async () => {
    try {
      const todas = await getAllCampanasSalud();
      const empresaNorm = formData.empresa.trim().toLowerCase();
      const fecha = formData.fecha;
      const nitNorm = formData.nit_empresa.trim();

      const duplicadoEmpresaFecha = todas.find((c) => {
        const mismaEmpresa = c.empresa.trim().toLowerCase() === empresaNorm;
        const mismaFecha = (c.fecha || '').substring(0, 10) === fecha;
        const esOtro = isEdit ? c.id !== parseInt(id, 10) : true;
        return mismaEmpresa && mismaFecha && esOtro;
      });
      if (duplicadoEmpresaFecha) {
        return `Ya existe una campaña para "${duplicadoEmpresaFecha.empresa}" en la fecha ${formData.fecha}.`;
      }

      if (nitNorm && (!isEdit || nitNorm !== originalData?.nit_empresa)) {
        const duplicadoNit = todas.find((c) => {
          const mismoNit = (c.nit_empresa || '').trim() === nitNorm;
          const esOtro = isEdit ? c.id !== parseInt(id, 10) : true;
          return mismoNit && esOtro;
        });
        if (duplicadoNit) {
          return `El NIT "${nitNorm}" ya está registrado en otra campaña.`;
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  const getChangedFields = () => {
    if (!originalData || !isEdit) return formData;
    const changed = {};
    if (formData.empleado_id !== originalData.empleado_id)
      changed.empleado_id = parseInt(formData.empleado_id, 10);
    if (formData.empresa !== originalData.empresa)
      changed.empresa = formData.empresa.trim();
    if (formData.nit_empresa !== originalData.nit_empresa)
      changed.nit_empresa = formData.nit_empresa.trim();
    if (formData.contacto !== originalData.contacto)
      changed.contacto = formData.contacto.trim() || null;
    if (formData.fecha !== originalData.fecha)
      changed.fecha = formData.fecha;
    if (formData.hora !== originalData.hora)
      changed.hora = formData.hora;
    if (formData.direccion !== originalData.direccion)
      changed.direccion = formData.direccion.trim() || null;
    if (formData.observaciones !== originalData.observaciones)
      changed.observaciones = formData.observaciones.trim() || null;
    if (formData.estado_cita_id !== originalData.estado_cita_id)
      changed.estado_cita_id = parseInt(formData.estado_cita_id, 10);
    return changed;
  };

  // ---------- Mutaciones ----------
  const createMutation = useMutation({
    mutationFn: createCampanaSalud,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campanas-salud'] });
      setErrorMessage('');
      showNotification('success', 'Campaña de salud creada correctamente');
      setTimeout(() => navigate('/admin/servicios/campanas-salud'), 1200);
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || err?.message || 'Error al crear la campaña';
      setErrorMessage(msg);
      showNotification('error', msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateCampanaSalud(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campanas-salud'] });
      queryClient.invalidateQueries({ queryKey: ['campana-salud', id] });
      setErrorMessage('');
      showNotification('success', 'Campaña actualizada correctamente');
      setTimeout(() => navigate('/admin/servicios/campanas-salud'), 1200);
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || err?.message || 'Error al actualizar la campaña';
      setErrorMessage(msg);
      showNotification('error', msg);
    },
  });

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      showNotification('error', validationError);
      return;
    }

    // Validar duplicados (empresa+fecha y NIT)
    const errorDuplicado = await validarDuplicados();
    if (errorDuplicado) {
      showNotification('error', errorDuplicado);
      return;
    }

    if (isEdit) {
      const changedFields = getChangedFields();
      if (Object.keys(changedFields).length === 0) {
        showNotification('info', 'No hay cambios para guardar');
        return;
      }
      // Asegurar formato de hora en los cambios
      if (changedFields.hora) changedFields.hora = changedFields.hora.substring(0, 5);
      updateMutation.mutate({ id: parseInt(id, 10), data: changedFields });
    } else {
      const dataToSubmit = {
        empleado_id: parseInt(formData.empleado_id, 10),
        empresa: formData.empresa.trim(),
        nit_empresa: formData.nit_empresa.trim(),
        fecha: formData.fecha,
        hora: formData.hora.substring(0, 5), // garantizar HH:MM
        estado_cita_id: estadoPendienteId,
      };
      if (formData.contacto?.trim()) dataToSubmit.contacto = formData.contacto.trim();
      if (formData.direccion?.trim()) dataToSubmit.direccion = formData.direccion.trim();
      if (formData.observaciones?.trim()) dataToSubmit.observaciones = formData.observaciones.trim();
      createMutation.mutate(dataToSubmit);
    }
  };

  const handleCancel = () => navigate('/admin/servicios/campanas-salud');
  const handleEdit = () => navigate(`/admin/servicios/campanas-salud/editar/${id}`);

  const isLoading = (isEdit || isView) && loadingCampana;

  return {
    formData,
    empleados,
    estadosCita,
    horasDisponibles,
    loading: isLoading,
    saving: createMutation.isPending || updateMutation.isPending,
    error: errorMessage,
    isEdit,
    isView,
    notification,
    handleChange,
    handleSubmit,
    handleCancel,
    handleEdit,
    hideNotification,
  };
};
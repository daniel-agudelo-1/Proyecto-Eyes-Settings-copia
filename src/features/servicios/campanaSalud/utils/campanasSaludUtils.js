import { ESTADO_CITA } from './constants';

export const formatearFechaLocal = (fechaStr) => {
  if (!fechaStr) return '-';
  const partes = fechaStr.split('-');
  if (partes.length !== 3) return '-';
  const [year, month, day] = partes;
  const fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  if (isNaN(fecha.getTime())) return '-';
  return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const horaA12 = (hora) => {
  if (!hora || hora === '-') return hora || '-';
  const partes = hora.split(':');
  let h = parseInt(partes[0], 10);
  const m = partes[1] ? partes[1].substring(0, 2) : '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

export const formatearHora24 = (hora) => {
  if (!hora) return '';
  // Si ya es HH:MM, devolver igual
  if (/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(hora)) return hora;
  // Si tiene segundos, quitar
  if (/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(hora)) {
    return hora.substring(0, 5);
  }
  // Si es otro formato, intentar convertir
  try {
    const date = new Date(`1970-01-01T${hora}`);
    if (!isNaN(date.getTime())) {
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
  } catch (e) {}
  return hora;
};

export const getEstadoBadgeColor = (estadoCitaId) => {
  const colors = {
    [ESTADO_CITA.PENDIENTE]: 'warning',
    [ESTADO_CITA.CONFIRMADA]: 'info',
    [ESTADO_CITA.COMPLETADA]: 'success',
    [ESTADO_CITA.CANCELADA]: 'error',
    [ESTADO_CITA.EN_PROGRESO]: 'primary',
  };
  return colors[estadoCitaId] || 'default';
};

export const getEstadoLabel = (estadoCitaId) => {
  const labels = {
    [ESTADO_CITA.PENDIENTE]: 'Pendiente',
    [ESTADO_CITA.CONFIRMADA]: 'Confirmada',
    [ESTADO_CITA.COMPLETADA]: 'Completada',
    [ESTADO_CITA.CANCELADA]: 'Cancelada',
    [ESTADO_CITA.EN_PROGRESO]: 'En Progreso',
  };
  return labels[estadoCitaId] || 'Desconocido';
};

/**
 * Convierte un objeto Date a número de día según backend (0=Lunes, 6=Domingo)
 * @param {Date} date - Fecha
 * @returns {number|null} Día en formato backend o null si no hay fecha
 */
export const getBackendDay = (date) => {
  if (!date) return null;
  const jsDay = date.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
};

/**
 * Genera slots de 30 minutos entre horaInicio y horaFinal
 * @param {string} horaInicio - Formato 'HH:MM'
 * @param {string} horaFinal - Formato 'HH:MM'
 * @returns {Array<{value: string, label: string}>} Lista de slots disponibles
 */
export const generarSlotsHorarios = (horaInicio, horaFinal) => {
  const slots = [];
  const [hI, mI] = horaInicio.split(':').map(Number);
  const [hF, mF] = horaFinal.split(':').map(Number);
  let minutos = hI * 60 + mI;
  const minFinal = hF * 60 + mF;
  while (minutos < minFinal) {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    const valor = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    slots.push({ value: valor, label: horaA12(valor) });
    minutos += 30;
  }
  return slots;
};
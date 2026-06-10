import { useState, useEffect } from "react";
import { getHorariosByEmpleado } from "../../horario/services/horariosService";

export function useHorariosEmpleado(empleadoId) {
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!empleadoId) {
      setHorarios([]);
      return;
    }

    setLoading(true);
    getHorariosByEmpleado(empleadoId)
      .then(data => {
        setHorarios(Array.isArray(data) ? data : []);
      })
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, [empleadoId]);

  return { horarios, loading, error };
}
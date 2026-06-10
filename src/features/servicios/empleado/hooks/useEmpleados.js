import { useState, useCallback, useMemo, useEffect } from "react";
import {
  getAllEmpleados,
  deleteEmpleado,
  updateEstadoEmpleado,
} from "../services/empleadosService";

const PAGE_SIZE = 10;

export function useEmpleados() {
  const [empleadosRaw, setEmpleadosRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState(""); // '', 'activo', 'inactivo'
  const [modalDelete, setModalDelete] = useState({
    open: false,
    id: null,
    nombre: "",
  });

  // Cargar todos los empleados
  const cargarEmpleados = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllEmpleados();
      const normalizados = (Array.isArray(data) ? data : []).map((e) => ({
        id: e.id,
        nombre: e.nombre,
        apellido: e.apellido || '',
        nombre_completo: `${e.nombre} ${e.apellido || ''}`.trim(),
        cargo: e.cargo,
        correo: e.correo,
        tipoDocumento: e.tipo_documento,
        numero_documento: e.numero_documento,
        telefono: e.telefono,
        direccion: e.direccion,
        fecha_ingreso: e.fecha_ingreso,
        estado: e.estado ? "activo" : "inactivo",
        estadosDisponibles: ["activo", "inactivo"],
      }));
      setEmpleadosRaw(normalizados);
    } catch (error) {
      console.error("Error cargando empleados:", error);
      setError("No se pudieron cargar los empleados");
      setEmpleadosRaw([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filtrado local
  const empleadosFiltrados = useMemo(() => {
    let filtered = empleadosRaw;
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.nombre_completo?.toLowerCase().includes(lowerSearch) ||
          e.numero_documento?.toLowerCase().includes(lowerSearch) ||
          e.cargo?.toLowerCase().includes(lowerSearch) ||
          e.correo?.toLowerCase().includes(lowerSearch)
      );
    }
    if (filterEstado) {
      filtered = filtered.filter((e) => e.estado === filterEstado);
    }
    return filtered;
  }, [empleadosRaw, search, filterEstado]);

  // Paginación local
  const totalItems = empleadosFiltrados.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const paginatedEmpleados = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return empleadosFiltrados.slice(start, end);
  }, [empleadosFiltrados, page]);

  // Operaciones CRUD
  const eliminarEmpleado = useCallback(
    async (id) => {
      try {
        await deleteEmpleado(id);
        await cargarEmpleados();
        // Si la página actual se queda vacía y no es la primera, retrocede
        if (paginatedEmpleados.length === 1 && page > 1) {
          setPage(page - 1);
        }
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error.message || "Error al eliminar el empleado",
        };
      }
    },
    [cargarEmpleados, paginatedEmpleados.length, page]
  );

  const cambiarEstado = useCallback(
    async (id, nuevoEstado) => {
      try {
        await updateEstadoEmpleado(id, nuevoEstado);
        await cargarEmpleados();
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error.message || "Error al cambiar el estado",
        };
      }
    },
    [cargarEmpleados]
  );

  // Handlers de modales
  const openDeleteModal = useCallback((id, nombre) => {
    setModalDelete({ open: true, id, nombre });
  }, []);

  const closeDeleteModal = useCallback(() => {
    setModalDelete({ open: false, id: null, nombre: "" });
  }, []);

  // Carga inicial
  useEffect(() => {
    cargarEmpleados();
  }, [cargarEmpleados]);

  const estadoFilters = [
    { value: "", label: "Todos los estados" },
    { value: "activo", label: "Activos" },
    { value: "inactivo", label: "Inactivos" },
  ];

  return {
    empleados: paginatedEmpleados,
    empleadosRaw,
    loading,
    error,
    page,
    setPage,
    totalPages,
    search,
    setSearch,
    filterEstado,
    setFilterEstado,
    estadoFilters,
    eliminarEmpleado,
    cambiarEstado,
    modalDelete,
    openDeleteModal,
    closeDeleteModal,
    recargar: cargarEmpleados,
  };
}
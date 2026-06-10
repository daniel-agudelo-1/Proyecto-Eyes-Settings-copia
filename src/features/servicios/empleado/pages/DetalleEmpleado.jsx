import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getEmpleadoById } from "../services/empleadosService";
import { normalizeEmpleadoForForm } from "../utils/empleadosUtils";
import EmpleadoForm from "../components/EmpleadoForm";
import Loading from "@shared/components/ui/Loading";
import CrudNotification from "@shared/styles/components/notifications/CrudNotification";

export default function DetalleEmpleado() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [empleado, setEmpleado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const empleadoId = parseInt(id, 10);
  if (isNaN(empleadoId)) {
    navigate("/admin/servicios/empleados");
    return null;
  }

  useEffect(() => {
    const cargarEmpleado = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getEmpleadoById(empleadoId);
        if (!data) {
          navigate("/admin/servicios/empleados");
          return;
        }
        const normalizado = normalizeEmpleadoForForm(data);
        setEmpleado(normalizado);
      } catch (error) {
        console.error("Error cargando empleado:", error);
        setError("No se pudo cargar la información del empleado");
      } finally {
        setLoading(false);
      }
    };
    cargarEmpleado();
  }, [empleadoId, navigate]);

  // Handlers dummy para modo vista
  const handleChange = () => {};
  const handleSubmit = async () => ({ success: true });
  const documentoExists = false;
  const emailExists = false;
  const errors = {};
  const submitting = false;

  if (loading) return <Loading text="Cargando información del empleado..." />;
  if (error) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <CrudNotification message={error} type="error" isVisible={true} onClose={() => {}} />
        <div style={{ marginTop: "20px" }}>
          <button onClick={() => navigate("/admin/servicios/empleados")} className="btn-primary">
            Volver a Empleados
          </button>
        </div>
      </div>
    );
  }
  if (!empleado) return null;

  return (
    <EmpleadoForm
      mode="view"
      title={`Detalle del Empleado: ${empleado.nombre} ${empleado.apellido}`}
      onCancel={() => navigate("/admin/servicios/empleados")}
      onEdit={() => navigate(`/admin/servicios/empleados/editar/${empleadoId}`)}
      formData={empleado}
      errors={errors}
      submitting={submitting}
      documentoExists={documentoExists}
      emailExists={emailExists}
      handleChange={handleChange}
      handleSubmit={handleSubmit}
    />
  );
}
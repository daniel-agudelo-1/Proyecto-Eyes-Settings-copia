import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useEmpleadoForm } from "../hooks/useEmpleadoForm";
import { getEmpleadoById } from "../services/empleadosService";
import { normalizeEmpleadoForForm } from "../utils/empleadosUtils";
import EmpleadoForm from "../components/EmpleadoForm";
import Loading from "@shared/components/ui/Loading";
import CrudNotification from "@shared/styles/components/notifications/CrudNotification";

export default function EditarEmpleado() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notification, setNotification] = useState({ visible: false, message: "", type: "error" });

  const [empleado, setEmpleado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const showNotification = (message, type = "error") => {
    setNotification({ visible: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, visible: false })), 5000);
  };

  const empleadoId = parseInt(id, 10);
  if (isNaN(empleadoId)) {
    navigate("/admin/servicios/empleados");
    return null;
  }

  const {
    formData,
    errors,
    submitting,
    documentoExists,
    emailExists,
    handleChange,
    handleSubmit,
    setFormData,
  } = useEmpleadoForm({
    mode: "edit",
    initialData: empleado,
    onSubmitSuccess: () => {
      navigate("/admin/servicios/empleados");
    },
    onError: (error) => {
      showNotification(error, "error");
    },
  });

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
        setFormData(normalizado);
      } catch (error) {
        console.error("Error cargando empleado:", error);
        setError("No se pudo cargar la información del empleado");
      } finally {
        setLoading(false);
      }
    };
    cargarEmpleado();
  }, [empleadoId, navigate, setFormData]);

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
    <>
      <CrudNotification
        message={notification.message}
        type={notification.type}
        isVisible={notification.visible}
        onClose={() => setNotification(prev => ({ ...prev, visible: false }))}
      />
      <EmpleadoForm
        mode="edit"
        title="Editar Empleado"
        onSubmit={() => navigate("/admin/servicios/empleados")}
        onCancel={() => navigate("/admin/servicios/empleados")}
        formData={formData}
        errors={errors}
        submitting={submitting}
        documentoExists={documentoExists}
        emailExists={emailExists}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
      />
    </>
  );
}
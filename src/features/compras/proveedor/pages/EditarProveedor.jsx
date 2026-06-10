import { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProveedorById } from "../services/proveedoresService";
import { normalizeProveedorForForm } from "../utils/proveedoresUtils";
import ProveedorForm from "../components/ProveedorForm";
import CrudNotification from "../../../../shared/styles/components/notifications/CrudNotification";
import Loading from "../../../../shared/components/ui/Loading";

export default function EditarProveedor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [proveedor, setProveedor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({
    message: "", type: "success", isVisible: false,
  });

  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, isVisible: true });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, isVisible: false }));
  }, []);

  useEffect(() => {
    getProveedorById(Number(id))
      .then((data) => {
        if (!data) navigate("/admin/compras/proveedores");
        else setProveedor(normalizeProveedorForForm(data));
      })
      .catch(() => navigate("/admin/compras/proveedores"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <Loading message="Cargando proveedor..." />;
  if (!proveedor) return null;

  return (
    <>
      <CrudNotification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
      <ProveedorForm
        mode="edit"
        title={`Editar Proveedor: ${proveedor.razonSocial}`}
        initialData={proveedor}
        onSubmit={() => {
          showNotification("Proveedor actualizado exitosamente", "success");
          setTimeout(() => navigate("/admin/compras/proveedores"), 1000);
        }}
        onCancel={() => navigate("/admin/compras/proveedores")}
      />
    </>
  );
}
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ProveedorForm from "../components/ProveedorForm";
import CrudNotification from "../../../../shared/styles/components/notifications/CrudNotification";

export default function CrearProveedor() {
  const navigate = useNavigate();
  const [notification, setNotification] = useState({
    message: "", type: "success", isVisible: false,
  });

  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, isVisible: true });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, isVisible: false }));
  }, []);

  return (
    <>
      <CrudNotification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
      <ProveedorForm
        mode="create"
        title="Crear Nuevo Proveedor"
        onSubmit={() => {
          showNotification("Proveedor creado exitosamente", "success");
          setTimeout(() => navigate("/admin/compras/proveedores"), 1000);
        }}
        onCancel={() => navigate("/admin/compras/proveedores")}
      />
    </>
  );
}
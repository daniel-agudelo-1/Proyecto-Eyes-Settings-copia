import { useNavigate } from "react-router-dom";
import VentaForm from "../components/VentaForm";

export default function CrearVenta() {
  const navigate = useNavigate();

  return (
    <VentaForm
      mode="create"
      title="Nueva Venta Directa"
      onCancel={() => navigate(-1)}
      onSuccess={() => navigate(-1)}
    />
  );
}

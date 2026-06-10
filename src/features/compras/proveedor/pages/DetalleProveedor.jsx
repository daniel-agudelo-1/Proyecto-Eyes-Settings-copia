import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getProveedorById } from "../services/proveedoresService";
import { normalizeProveedorForForm } from "../utils/proveedoresUtils";
import ProveedorForm from "../components/ProveedorForm";
import Loading from "../../../../shared/components/ui/Loading";

export default function DetalleProveedor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [proveedor, setProveedor] = useState(null);
  const [loading, setLoading] = useState(true);

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
    <ProveedorForm
      mode="view"
      title={`Detalle del Proveedor: ${proveedor.razonSocial}`}
      initialData={proveedor}
      onCancel={() => navigate("/admin/compras/proveedores")}
      extraActions={
        <button
          className="crud-btn crud-btn-primary"
          onClick={() => navigate(`/admin/compras/proveedores/editar/${proveedor.id}`)}
        >
          Editar
        </button>
      }
    />
  );
}
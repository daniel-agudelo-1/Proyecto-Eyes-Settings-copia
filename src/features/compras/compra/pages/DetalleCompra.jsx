import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCompraById } from "../services/comprasService";
import { normalizeCompraForForm } from "../utils/comprasUtils";
import ComprasForm from "../components/ComprasForm";
import Loading from "@shared/components/ui/Loading";

export default function DetalleCompra() {
  const navigate = useNavigate();
  const { id }   = useParams();
  const [compra,  setCompra]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCompraById(Number(id))
      .then((data) => {
        if (!data) navigate("/admin/compras");
        else setCompra(normalizeCompraForForm(data));
      })
      .catch(() => navigate("/admin/compras"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <Loading text="Cargando compra..." />;

  return (
    <ComprasForm
      mode="view"
      title={`Detalle Compra ${compra.numeroCompra || `#${id}`}`}
      initialData={compra}
      onCancel={() => navigate("/admin/compras")}
    />
  );
}

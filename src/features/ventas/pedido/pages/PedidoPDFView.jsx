import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { pedidosService } from "../services/pedidosService";
import {
  formatCurrency,
  COLORES_ESTADO,
  formatLocalDateFromISO,
} from "../utils/pedidosUtils";
import Loading from "@shared/components/ui/Loading";

export default function PedidoPDFView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const contentRef = useRef(null);
  const [pedido, setPedido] = useState(null);
  const [abonos, setAbonos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await pedidosService.getPedidoById(Number(id));
        if (!data) {
          navigate(-1);
          return;
        }
        setPedido(data);
        const info = await pedidosService.getInfoAbonos(
          Number(id),
          data.total ?? 0
        );
        setAbonos(info.abonos ?? []);
      } catch {
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [id, navigate]);

  if (loading) return <Loading text="Cargando pedido..." />;
  if (!pedido) return null;

  const totalAbonado = abonos.reduce((s, a) => s + (a.monto_abonado ?? 0), 0);
  const saldoPendiente = Math.max(0, (pedido.total ?? 0) - totalAbonado);
  const estadoColor = COLORES_ESTADO[pedido.estado] ?? { color: "#374151" };

  const itemsProducto = (pedido.items ?? []).filter(
    (i) => i.tipo === "producto"
  );
  const itemsServicio = (pedido.items ?? []).filter(
    (i) => i.tipo === "servicio"
  );

  const handleDescargar = async () => {
    const { default: html2canvas } = await import("html2canvas");
    const { default: jsPDF } = await import("jspdf");
    const canvas = await html2canvas(contentRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Pedido-${id}.pdf`);
  };

  const TablaItems = ({ items, titulo }) => (
    <div style={{ marginBottom: 20 }}>
      <p
        style={{
          margin: "0 0 8px",
          fontWeight: 700,
          fontSize: "0.9rem",
          color: "#374151",
        }}
      >
        {titulo}
      </p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#f3f4f6" }}>
            {["Nombre", "Cantidad", "Precio Unit.", "Subtotal"].map((h) => (
              <th
                key={h}
                style={{
                  border: "1px solid #d1d5db",
                  padding: "8px 12px",
                  textAlign: h === "Nombre" ? "left" : "right",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  color: "#374151",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr
              key={i}
              style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}
            >
              <td
                style={{
                  border: "1px solid #e5e7eb",
                  padding: "8px 12px",
                }}
              >
                {item.nombre}
              </td>
              <td
                style={{
                  border: "1px solid #e5e7eb",
                  padding: "8px 12px",
                  textAlign: "right",
                }}
              >
                {item.cantidad}
              </td>
              <td
                style={{
                  border: "1px solid #e5e7eb",
                  padding: "8px 12px",
                  textAlign: "right",
                }}
              >
                {formatCurrency(item.precio)}
              </td>
              <td
                style={{
                  border: "1px solid #e5e7eb",
                  padding: "8px 12px",
                  textAlign: "right",
                  fontWeight: 600,
                }}
              >
                {formatCurrency((item.precio ?? 0) * item.cantidad)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div
      style={{
        backgroundColor: "#f3f4f6",
        minHeight: "100vh",
        padding: "32px 16px",
      }}
    >
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto 20px auto",
          display: "flex",
          gap: 12,
          justifyContent: "flex-end",
        }}
      >
        <button
          className="crud-btn crud-btn-secondary"
          onClick={() => navigate(-1)}
        >
          Volver
        </button>
        <button
          className="crud-btn crud-btn-primary"
          onClick={handleDescargar}
        >
          Descargar PDF
        </button>
      </div>

      <div
        ref={contentRef}
        style={{
          maxWidth: 800,
          margin: "0 auto",
          backgroundColor: "#ffffff",
          padding: "48px 56px",
          borderRadius: 8,
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          fontFamily: "Roboto, Arial, sans-serif",
          color: "#111",
          fontSize: "0.95rem",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: 32,
            borderBottom: "2px solid #e5e7eb",
            paddingBottom: 20,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "1.6rem",
              color: "var(--primary-color, #1a2540)",
              letterSpacing: 1,
            }}
          >
            VISUAL OUTLET
          </h2>
          <p style={{ margin: "2px 0", color: "#6b7280", fontSize: "0.88rem" }}>
            Carrera 45 50-48 Edificio El Doral Oficina 102, Medellin, Antioquia
          </p>
          <p
            style={{
              margin: "16px 0 4px",
              fontWeight: 700,
              fontSize: "1.1rem",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Soporte de Pedido
          </p>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "0.88rem" }}>
            Pedido #{id} &nbsp;•&nbsp; Fecha:{" "}
            {formatLocalDateFromISO(pedido.fechaISO)}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 28,
            backgroundColor: "#f9fafb",
            padding: "16px 20px",
            borderRadius: 6,
            border: "1px solid #e5e7eb",
          }}
        >
          {[
            ["Cliente", pedido.cliente || "—"],
            [
              "Estado",
              pedido.estado?.charAt(0).toUpperCase() +
                (pedido.estado?.slice(1) ?? ""),
              estadoColor.color,
            ],
            ["Metodo de pago", pedido.metodo_pago || "—"],
            ["Metodo de entrega", pedido.metodo_entrega || "—"],
          ].map(([label, value, color]) => (
            <div key={label}>
              <p
                style={{
                  margin: "0 0 4px",
                  color: "#9ca3af",
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                {label}
              </p>
              <p
                style={{
                  margin: 0,
                  fontWeight: 600,
                  textTransform: "capitalize",
                  color: color || "#111",
                }}
              >
                {value}
              </p>
            </div>
          ))}
          {pedido.direccion_entrega && (
            <div style={{ gridColumn: "1 / -1" }}>
              <p
                style={{
                  margin: "0 0 4px",
                  color: "#9ca3af",
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                Direccion de entrega
              </p>
              <p style={{ margin: 0 }}>{pedido.direccion_entrega}</p>
            </div>
          )}
        </div>

        {itemsProducto.length > 0 && (
          <TablaItems items={itemsProducto} titulo="Productos" />
        )}
        {itemsServicio.length > 0 && (
          <TablaItems items={itemsServicio} titulo="Servicios" />
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <div
            style={{
              width: 290,
              backgroundColor: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "16px 20px",
              fontSize: "0.95rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <span style={{ color: "#6b7280" }}>Total</span>
              <span style={{ fontWeight: 700 }}>
                {formatCurrency(pedido.total)}
              </span>
            </div>

            {abonos.length > 0 && (
              <>
                <div
                  style={{
                    borderTop: "1px solid #e5e7eb",
                    marginTop: 8,
                    paddingTop: 8,
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 6px",
                      fontWeight: 600,
                      fontSize: "0.82rem",
                      color: "#6b7280",
                      textTransform: "uppercase",
                    }}
                  >
                    Historial de abonos
                  </p>
                  {abonos.map((a, i) => (
                    <div
                      key={a.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                        fontSize: "0.85rem",
                      }}
                    >
                      <span style={{ color: "#6b7280" }}>
                        {a.fecha
                          ? new Date(a.fecha).toLocaleDateString("es-CO", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : `Abono #${i + 1}`}
                      </span>
                      <span style={{ color: "#10b981", fontWeight: 600 }}>
                        +{formatCurrency(a.monto_abonado)}
                      </span>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderTop: "2px solid #e5e7eb",
                    paddingTop: 10,
                    marginTop: 8,
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: saldoPendiente <= 0 ? "#10b981" : "#ef4444",
                  }}
                >
                  <span>Saldo pendiente</span>
                  <span>
                    {saldoPendiente <= 0 ? "Pagado" : formatCurrency(saldoPendiente)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {pedido.transferencia_comprobante && (
          <div
            style={{
              marginTop: 28,
              padding: "14px 18px",
              backgroundColor: "#f9fafb",
              borderRadius: 6,
              border: "1px solid #e5e7eb",
            }}
          >
            <p style={{ margin: "0 0 4px", fontWeight: 600, color: "#374151" }}>
              Comprobante de transferencia
            </p>
            <p style={{ margin: 0, color: "#6b7280", wordBreak: "break-all" }}>
              {pedido.transferencia_comprobante}
            </p>
          </div>
        )}

        <div
          style={{
            marginTop: 48,
            textAlign: "center",
            color: "#9ca3af",
            fontSize: "0.8rem",
            borderTop: "1px solid #e5e7eb",
            paddingTop: 16,
          }}
        >
          Este documento no es una factura oficial. Generado el{" "}
          {new Date().toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
          .
        </div>
      </div>
    </div>
  );
}

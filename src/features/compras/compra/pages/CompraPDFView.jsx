import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCompraById } from "../services/comprasService";
import { formatCurrency, formatDate } from "../utils/comprasUtils";
import Loading from "@shared/components/ui/Loading";

export default function CompraPDFView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const contentRef = useRef(null);
  const [compra, setCompra] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCompraById(Number(id))
      .then((data) => {
        if (!data) navigate("/admin/compras");
        else setCompra(data);
      })
      .catch(() => navigate("/admin/compras"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <Loading text="Cargando compra..." />;
  if (!compra) return null;

  const subtotal = (compra.productos || []).reduce(
    (acc, p) => acc + Number(p.total || 0), 0
  );
  const iva = subtotal * 0.19;
  const total = compra.total ?? subtotal + iva;

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
    pdf.save(`Compra-${compra.numeroCompra || id}.pdf`);
  };

  // Estilos idénticos a PedidoPDFView
  const th = {
    border: "1px solid #d1d5db",
    padding: "8px 12px",
    textAlign: "left",
    fontWeight: 600,
    fontSize: "0.85rem",
    color: "#374151",
    backgroundColor: "#f3f4f6",
  };
  const tdRight = {
    border: "1px solid #e5e7eb",
    padding: "8px 12px",
    textAlign: "right",
  };
  const tdLeft = {
    border: "1px solid #e5e7eb",
    padding: "8px 12px",
    textAlign: "left",
  };
  const tdCenter = {
    border: "1px solid #e5e7eb",
    padding: "8px 12px",
    textAlign: "center",
  };

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
          onClick={() => navigate(`/admin/compras/detalle/${id}`)}
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
            Soporte de Compra
          </p>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "0.88rem" }}>
            N° {compra.numeroCompra || `C-${id}`} &nbsp;•&nbsp; Fecha:{" "}
            {formatDate(compra.fecha)}
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
          <div>
            <p style={{ margin: "0 0 4px", color: "#9ca3af", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 600 }}>
              Proveedor
            </p>
            <p style={{ margin: 0, fontWeight: 600 }}>{compra.proveedor_nombre || "—"}</p>
          </div>
          <div>
            <p style={{ margin: "0 0 4px", color: "#9ca3af", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 600 }}>
              Estado
            </p>
            <p style={{ margin: 0, fontWeight: 600, color: compra.estado_compra === true ? "#16a34a" : "#991b1b" }}>
              {compra.estado_compra === true ? "Completada" : "Anulada"}
            </p>
          </div>
          {compra.observaciones && (
            <div style={{ gridColumn: "1 / -1" }}>
              <p style={{ margin: "0 0 4px", color: "#9ca3af", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 600 }}>
                Observaciones
              </p>
              <p style={{ margin: 0 }}>{compra.observaciones}</p>
            </div>
          )}
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
          <thead>
            <tr style={{ backgroundColor: "#f3f4f6" }}>
              <th style={{ ...th, textAlign: "left", width: "40%" }}>Producto</th>
              <th style={{ ...th, textAlign: "center", width: "12%" }}>Cant.</th>
              <th style={{ ...th, textAlign: "right", width: "18%" }}>P. Compra</th>
              <th style={{ ...th, textAlign: "right", width: "18%" }}>P. Venta</th>
              <th style={{ ...th, textAlign: "right", width: "12%" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {(compra.productos || []).map((p, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                <td style={tdLeft}>{p.nombre}</td>
                <td style={tdCenter}>{p.cantidad}</td>
                <td style={tdRight}>{formatCurrency(p.precioCompra)}</td>
                <td style={tdRight}>{formatCurrency(p.precioVenta)}</td>
                <td style={tdRight}>{formatCurrency(p.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

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
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#6b7280" }}>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#6b7280" }}>IVA (19%)</span>
              <span>{formatCurrency(iva)}</span>
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
              }}
            >
              <span>TOTAL</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

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
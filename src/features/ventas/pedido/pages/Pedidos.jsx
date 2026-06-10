import { useNavigate } from "react-router-dom";
import CrudLayout from "@shared/components/crud/CrudLayout";
import CrudTable from "@shared/components/crud/CrudTable";
import CrudPagination from "@shared/components/crud/CrudPagination";
import Modal from "@shared/components/ui/Modal";
import CrudNotification from "@shared/styles/components/notifications/CrudNotification";
import { usePedidos } from "../hooks/usePedidos";
import { ESTADOS_ABONABLE, COLORES_ESTADO, formatLocalDateFromISO } from "../utils/pedidosUtils";
import "@shared/styles/components/crud-table.css";
import "@shared/styles/components/modal.css";

export default function Pedidos() {
  const navigate = useNavigate();
  const {
    pedidos,
    loading,
    pagination,
    page,
    setPage,
    search,
    setSearch,
    filterEstado,
    setFilterEstado,
    estadoFilters,
    notification,
    setNotification,
    modalDelete,
    handleDelete,
    confirmDelete,
    closeDeleteModal,
    modalAbono,
    montoAbono,
    setMontoAbono,
    abonoLoading,
    handleAbonar,
    confirmAbono,
    closeAbonoModal,
    formatCurrency,
    obtenerResumenItems,
  } = usePedidos();

  const columns = [
    {
      field: "cliente",
      header: "Cliente",
      render: (row) => row.cliente || "—",
    },
    {
      field: "fechaPedido",
      header: "Fecha",
      render: (row) => formatLocalDateFromISO(row.fechaISO),
    },
    {
      field: "items",
      header: "Items",
      render: (row) => (
        <span style={{ fontSize: "0.85rem" }}>{obtenerResumenItems(row)}</span>
      ),
    },
    {
      field: "total",
      header: "Total",
      render: (row) => formatCurrency(row.total),
    },
    {
      field: "estado",
      header: "Estado",
      render: (row) => {
        const col = COLORES_ESTADO[row.estado] ?? { bg: "#f3f4f6", color: "#374151" };
        const label = row.estado
          ? row.estado.charAt(0).toUpperCase() + row.estado.slice(1)
          : "—";
        return (
          <span
            style={{
              display: "inline-block",
              padding: "3px 10px",
              borderRadius: 12,
              fontSize: "0.75rem",
              fontWeight: 600,
              background: col.bg,
              color: col.color,
            }}
          >
            {label}
          </span>
        );
      },
    },
    {
      field: "abono",
      header: "Abonar",
      render: (row) => {
        const puedeAbonar = ESTADOS_ABONABLE.includes(row.estado);
        return (
          <button
            className="crud-btn crud-btn-primary"
            style={{ padding: "4px 10px", fontSize: "0.8rem" }}
            onClick={(e) => {
              e.stopPropagation();
              handleAbonar(row);
            }}
            disabled={!puedeAbonar || abonoLoading}
            title={
              !puedeAbonar
                ? "Solo se puede abonar en pedidos pendientes"
                : "Registrar abono"
            }
          >
            Abonar
          </button>
        );
      },
    },
  ];

  const tableActions = [
    {
      label: "Ver Detalles",
      type: "view",
      onClick: (row) => navigate(`detalle/${row.id}`),
    },
    {
      label: "Editar",
      type: "edit",
      onClick: (row) => navigate(`editar/${row.id}`),
    },
    {
      label: "Eliminar",
      type: "delete",
      onClick: (row) => handleDelete(row.id, row.cliente),
    },
  ];

  return (
    <>
      <CrudNotification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={() => setNotification({ ...notification, isVisible: false })}
      />

      <CrudLayout
        title="Pedidos"
        onAddClick={() => navigate("crear")}
        showSearch
        searchPlaceholder="Buscar por cliente..."
        searchValue={search}
        onSearchChange={setSearch}
        searchFilters={estadoFilters}
        filterEstado={filterEstado}
        onFilterChange={setFilterEstado}
      >
        <CrudTable
          columns={columns}
          data={pedidos}
          actions={tableActions}
          loading={loading}
          showStatusColumn={false}
          emptyMessage={
            search || filterEstado
              ? "No se encontraron pedidos para los filtros aplicados"
              : "No hay pedidos registrados"
          }
        />

        <CrudPagination
          totalPages={pagination?.total_pages ?? 1}
          page={page}
          onChange={setPage}
        />

        {/* Modal eliminar */}
        <Modal
          open={modalDelete.open}
          type="warning"
          title="Eliminar Pedido"
          message={`Esta accion eliminara el pedido de "${modalDelete.cliente}" permanentemente.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          showCancel
          onConfirm={confirmDelete}
          onCancel={closeDeleteModal}
        />

        {/* Modal abono */}
        <Modal
          open={modalAbono.open}
          type="info"
          title="Registrar Abono"
          confirmText={abonoLoading ? "Registrando..." : "Registrar Abono"}
          cancelText="Cerrar"
          showCancel
          onConfirm={modalAbono.saldoPendiente > 0 ? confirmAbono : undefined}
          onCancel={closeAbonoModal}
        >
          <div style={{ marginTop: 8 }}>
            <p>
              <strong>Cliente:</strong> {modalAbono.cliente}
            </p>
            <p>
              <strong>Total del pedido:</strong> {formatCurrency(modalAbono.total)}
            </p>
            <p>
              <strong>Total abonado:</strong>{" "}
              <span style={{ color: "#10b981", fontWeight: 600 }}>
                {formatCurrency(modalAbono.totalAbonado)}
              </span>
            </p>
            <p>
              <strong>Saldo pendiente:</strong>{" "}
              <span
                style={{
                  color: modalAbono.saldoPendiente > 0 ? "#ef4444" : "#10b981",
                  fontWeight: 600,
                }}
              >
                {formatCurrency(modalAbono.saldoPendiente)}
              </span>
            </p>
            {modalAbono.abonos.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <p
                  style={{
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    color: "#6b7280",
                    marginBottom: 4,
                  }}
                >
                  Historial de abonos:
                </p>
                <div style={{ maxHeight: 120, overflowY: "auto" }}>
                  {modalAbono.abonos.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.82rem",
                        padding: "4px 0",
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      <span style={{ color: "#6b7280" }}>
                        {a.fecha ? formatLocalDateFromISO(a.fecha) : "—"}
                      </span>
                      <span style={{ color: "#10b981", fontWeight: 600 }}>
                        +{formatCurrency(a.monto_abonado)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {modalAbono.saldoPendiente > 0 ? (
              <div style={{ marginTop: 15 }}>
                <label
                  htmlFor="montoAbono"
                  style={{ fontWeight: 600, fontSize: "0.9rem" }}
                >
                  Nuevo abono:
                </label>
                <input
                  id="montoAbono"
                  type="number"
                  min="1"
                  max={modalAbono.saldoPendiente}
                  value={montoAbono}
                  onChange={(e) => setMontoAbono(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginTop: 6,
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: "1rem",
                  }}
                  placeholder="Ingrese el monto"
                  autoFocus
                />
              </div>
            ) : (
              <p
                style={{
                  marginTop: 12,
                  color: "#10b981",
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                Pedido completamente pagado
              </p>
            )}
          </div>
        </Modal>
      </CrudLayout>
    </>
  );
}
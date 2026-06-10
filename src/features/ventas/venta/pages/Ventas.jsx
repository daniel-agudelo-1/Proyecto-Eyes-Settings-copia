import { useNavigate } from "react-router-dom";
import CrudLayout from "@shared/components/crud/CrudLayout";
import CrudTable from "@shared/components/crud/CrudTable";
import CrudPagination from "@shared/components/crud/CrudPagination";
import { useVentas } from "../hooks/useVentas";
import "@shared/styles/components/crud-table.css";

export default function Ventas() {
  const navigate = useNavigate();
  const {
    ventas,
    loading,
    search,
    setSearch,
    filterEstado,
    setFilterEstado,
    estadoFilters,
    page,
    setPage,
    pagination,
    formatCurrency,
    COLORES_ESTADO_VENTA,
    getEstadoLabelVenta,
  } = useVentas();

  const columns = [
    {
      field: "cliente_nombre",
      header: "Cliente",
      render: (row) => row.cliente_nombre || "—",
    },
    {
      field: "fecha_venta",
      header: "Fecha de Venta",
      render: (row) => row.fecha_venta || "—",
    },
    {
      header: "Tipo",
      render: (row) => {
        if (row.esCita)
          return (
            <span style={{ fontSize: "0.8rem", color: "#6366f1", fontWeight: 600 }}>
              Cita
            </span>
          );
        if (row.esPedido)
          return (
            <span style={{ fontSize: "0.8rem", color: "#0891b2", fontWeight: 600 }}>
              Pedido
            </span>
          );
        return (
          <span style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 600 }}>
            Directa
          </span>
        );
      },
    },
    {
      field: "total",
      header: "Total",
      render: (row) => formatCurrency(row.total),
    },
    {
      field: "metodo_pago",
      header: "Pago",
      render: (row) => (
        <span style={{ textTransform: "capitalize" }}>
          {row.metodo_pago || "—"}
        </span>
      ),
    },
    {
      header: "Estado",
      render: (row) => {
        const estilo = COLORES_ESTADO_VENTA[row.estado] ?? {
          bg: "#f3f4f6",
          color: "#374151",
        };
        return (
          <span
            style={{
              background: estilo.bg,
              color: estilo.color,
              padding: "3px 10px",
              borderRadius: 99,
              fontSize: "0.78rem",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            {getEstadoLabelVenta(row.estado)}
          </span>
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
  ];

  return (
    <>
      <CrudLayout
        title="Ventas"
        onAddClick={() => navigate("crear")}
        addButtonLabel="Nueva Venta"
        showSearch
        searchPlaceholder="Buscar por cliente..."
        searchValue={search}
        onSearchChange={setSearch}
        searchFilters={estadoFilters}
        filterEstado={filterEstado}
        onFilterChange={setFilterEstado}
        searchPosition="left"
      >
        <CrudTable
          columns={columns}
          data={ventas}
          actions={tableActions}
          loading={loading}
          showStatusColumn={false}
          emptyMessage={
            search || filterEstado
              ? "No se encontraron ventas para los filtros aplicados"
              : "No hay ventas registradas"
          }
        />

        <CrudPagination
          totalPages={pagination?.total_pages ?? 1}
          page={page}
          onChange={setPage}
        />
      </CrudLayout>
    </>
  );
}
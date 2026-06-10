import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tooltip, IconButton, Stack } from "@mui/material";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import RemoveRedEyeOutlinedIcon from "@mui/icons-material/RemoveRedEyeOutlined";
import CrudLayout from "@shared/components/crud/CrudLayout";
import CrudTable from "@shared/components/crud/CrudTable";
import CrudPagination from "@shared/components/crud/CrudPagination";
import Modal from "@shared/components/ui/Modal";
import CrudNotification from "@shared/styles/components/notifications/CrudNotification";
import { useCompras } from "../hooks/useCompras";
import "@shared/styles/components/crud-table.css";

export default function Compras() {
  const navigate = useNavigate();

  const [notification, setNotification] = useState({
    isVisible: false,
    message: "",
    type: "success",
  });

  const showNotification = (message, type = "success") =>
    setNotification({ isVisible: true, message, type });

  const handleCloseNotification = () =>
    setNotification((prev) => ({ ...prev, isVisible: false }));

  useEffect(() => {
    const pending = sessionStorage.getItem("crudNotification");
    if (pending) {
      const { message, type } = JSON.parse(pending);
      sessionStorage.removeItem("crudNotification");
      showNotification(message, type);
    }
  }, []);

  const {
    compras,
    loading,
    error,
    search,
    setSearch,
    filterEstado,
    setFilterEstado,
    estadoFilters,
    page,
    setPage,
    pagination,
    eliminarCompra,
    modalDelete,
    openDeleteModal,
    closeDeleteModal,
    modalAnular,
    abrirModalAnular,
    cerrarModalAnular,
    confirmarAnular,
  } = useCompras();

  const confirmDelete = async () => {
    const result = await eliminarCompra(modalDelete.id);
    if (result.success) {
      closeDeleteModal();
      showNotification(`Compra "${modalDelete.numeroCompra}" eliminada correctamente`);
    } else {
      showNotification(result.error, "error");
    }
  };

  const handleConfirmarAnular = async () => {
    const result = await confirmarAnular();
    if (result?.success) {
      showNotification("Compra anulada correctamente");
    } else if (result?.error) {
      showNotification(result.error, "error");
    }
  };

  const columns = [
    { field: "proveedorNombre", header: "Proveedor" },
    { field: "fechaFormateada", header: "Fecha" },
    { field: "totalFormateado", header: "Total" },
    {
      field: "estado",
      header: "Estado",
      render: (row) => {
        const completada = row.estado === "completada";
        return (
          <button
            onClick={() => completada && abrirModalAnular(row)}
            disabled={!completada}
            title={completada ? "Click para anular" : "Compra anulada"}
            style={{
              minWidth: 95,
              padding: "3px 10px",
              borderRadius: 4,
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: completada ? "pointer" : "default",
              border: `1px solid ${completada ? "#16a34a" : "#d1d5db"}`,
              backgroundColor: completada ? "#f0fdf4" : "#f3f4f6",
              color: completada ? "#16a34a" : "#9ca3af",
              whiteSpace: "nowrap",
            }}
          >
            {completada ? "Completada" : "Anulada"}
          </button>
        );
      },
    },
    {
      field: "_acciones",
      header: "Acciones",
      render: (row) => {
        const activa = row.estado === "completada";
        return (
          <Stack direction="row" spacing={0.5} justifyContent="center">
            <Tooltip title="Ver detalles">
              <span>
                <IconButton
                  size="small"
                  disabled={!activa}
                  onClick={() => activa && navigate(`/admin/compras/detalle/${row.id}`)}
                >
                  <RemoveRedEyeOutlinedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Generar PDF">
              <span>
                <IconButton
                  size="small"
                  disabled={!activa}
                  onClick={() => activa && navigate(`/admin/compras/detalle/${row.id}/pdf`)}
                >
                  <PictureAsPdfOutlinedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        );
      },
    },
  ];

  return (
    <>
      <CrudLayout
        title="Compras"
        onAddClick={() => navigate("/admin/compras/crear")}
        showSearch
        searchPlaceholder="Buscar por proveedor, observaciones..."
        searchValue={search}
        onSearchChange={setSearch}
        searchFilters={estadoFilters}
        filterEstado={filterEstado}
        onFilterChange={setFilterEstado}
        searchPosition="left"
      >
        {error && <div className="crud-error">⚠️ {error}</div>}

        <style>{`
          .compras-tabla tr:has(td button[disabled]) {
            background-color: #f9fafb !important;
            opacity: 0.65;
          }
          .compras-tabla tr:has(td button[disabled]) td {
            color: #9ca3af !important;
          }
        `}</style>

        <div className="compras-tabla">
          <CrudTable
            columns={columns}
            data={compras}
            actions={[]}
            loading={loading}
            showStatusColumn={false}
            emptyMessage={
              search || filterEstado
                ? "No se encontraron compras para los filtros aplicados"
                : "No hay compras registradas"
            }
          />
        </div>

        <CrudPagination
          totalPages={pagination?.total_pages ?? 1}
          page={page}
          onChange={setPage}
        />
      </CrudLayout>

      <Modal
        open={modalDelete.open}
        type="warning"
        title="¿Eliminar Compra?"
        message={`Esta acción eliminará la compra "${modalDelete.numeroCompra}" y no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        showCancel
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
      />

      <Modal
        open={modalAnular.open}
        type="warning"
        title="¿Anular Compra?"
        message="Esta acción anulará la compra de forma permanente. No se podrá revertir."
        confirmText="Sí, anular"
        cancelText="Cancelar"
        showCancel
        onConfirm={handleConfirmarAnular}
        onCancel={cerrarModalAnular}
      />

      <CrudNotification
        isVisible={notification.isVisible}
        message={notification.message}
        type={notification.type}
        onClose={handleCloseNotification}
      />
    </>
  );
}
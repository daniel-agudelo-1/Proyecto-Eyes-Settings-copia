import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CrudLayout from "@shared/components/crud/CrudLayout";
import CrudTable from "@shared/components/crud/CrudTable";
import CrudPagination from "@shared/components/crud/CrudPagination";
import Modal from "@shared/components/ui/Modal";
import CrudNotification from "@shared/styles/components/notifications/CrudNotification";
import { useProveedores } from "../hooks/useProveedores";
import "@shared/styles/components/crud-table.css";

export default function Proveedores() {
  const navigate = useNavigate();
  const [notification, setNotification] = useState({ isVisible: false, message: "", type: "success" });

  const showNotification = (message, type = "success") => {
    setNotification({ isVisible: true, message, type });
  };

  const {
    proveedores,
    loading,
    error,
    search,
    setSearch,
    filterEstado,
    setFilterEstado,
    page,
    setPage,
    totalPages,
    estadoFilters,
    eliminarProveedor,
    cambiarEstado,
    modalDelete,
    openDeleteModal,
    closeDeleteModal,
  } = useProveedores({
    onSuccess: showNotification,
    onError: (msg) => showNotification(msg, "error"),
  });

  const confirmDelete = async () => {
    const result = await eliminarProveedor(modalDelete.id);
    if (result.success) closeDeleteModal();
  };

  const handleChangeStatus = async (row, nuevoEstado) => {
    await cambiarEstado(row.id, nuevoEstado);
  };

  const columns = [
    {
      field: "tipoProveedor",
      header: "Tipo",
      render: (item) => (
        <span className={item.tipoProveedor === "Persona Jurídica" ? "juridica" : "natural"}>
          {item.tipoProveedor}
        </span>
      ),
    },
    { field: "razonSocial", header: "Razón Social" },
    {
      field: "documento",
      header: "Documento",
      render: (item) => item.documento || "—",
    },
    {
      field: "telefono",
      header: "Teléfono",
      render: (item) => item.telefono || "—",
    },
  ];

  const tableActions = [
    {
      label: "Ver",
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
      onClick: (row) => openDeleteModal(row.id, row.razonSocial),
    },
  ];

  return (
    <>
      <CrudNotification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={() => setNotification((prev) => ({ ...prev, isVisible: false }))}
      />

      <CrudLayout
        title="Proveedores"
        onAddClick={() => navigate("crear")}
        showSearch
        searchPlaceholder="Buscar proveedor..."
        searchValue={search}
        onSearchChange={setSearch}
        searchFilters={estadoFilters}
        filterEstado={filterEstado}
        onFilterChange={setFilterEstado}
      >
        {error && <div className="crud-error">{error}</div>}

        <CrudTable
          columns={columns}
          data={proveedores}
          actions={tableActions}
          loading={loading}
          onChangeStatus={handleChangeStatus}
          showStatusColumn
          emptyMessage={
            search || filterEstado
              ? "No se encontraron proveedores"
              : "No hay proveedores registrados"
          }
        />

        <CrudPagination
          totalPages={totalPages}
          page={page}
          onChange={setPage}
          show={true}
        />

        <Modal
          open={modalDelete.open}
          type="warning"
          title="Eliminar Proveedor"
          message={`Esta acción eliminará al proveedor "${modalDelete.razonSocial}" y no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          showCancel
          onConfirm={confirmDelete}
          onCancel={closeDeleteModal}
        />
      </CrudLayout>

      <style>{`
        .juridica {
          background: #e0f2fe;
          color: #0369a1;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
          display: inline-block;
        }
        .natural {
          background: #f0fdf4;
          color: #166534;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
          display: inline-block;
        }
      `}</style>
    </>
  );
}
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CrudLayout from "../../../../shared/components/crud/CrudLayout";
import CrudTable from "../../../../shared/components/crud/CrudTable";
import Modal from "../../../../shared/components/ui/Modal";
import Loading from "../../../../shared/components/ui/Loading";
import CrudNotification from "../../../../shared/styles/components/notifications/CrudNotification";
import { useProveedores } from "../hooks/useProveedores";
import "../../../../shared/styles/components/crud-table.css";
import "../../../../shared/styles/components/modal.css";

export default function Proveedores() {
  const navigate = useNavigate();
  const [notification, setNotification] = useState({ isVisible: false, message: "", type: "success" });

  const showNotification = (message, type = "success") =>
    setNotification({ isVisible: true, message, type });

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
  } = useProveedores({ onSuccess: showNotification });

  const confirmDelete = async () => {
    const result = await eliminarProveedor(modalDelete.id);
    if (result.success) closeDeleteModal();
  };

  const columns = [
    {
      field: "tipoProveedor",
      header: "Tipo",
      headerSx: { display: { xs: "none", md: "table-cell" } },
      cellSx: { display: { xs: "none", md: "table-cell" } },
    },
    { field: "razonSocial", header: "Razon Social" },
    {
      field: "documento",
      header: "Documento",
      headerSx: { display: { xs: "none", sm: "table-cell" } },
      cellSx: { display: { xs: "none", sm: "table-cell" } },
    },
    {
      field: "telefono",
      header: "Telefono",
      headerSx: { display: { xs: "none", md: "table-cell" } },
      cellSx: { display: { xs: "none", md: "table-cell" } },
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

  if (loading && proveedores.length === 0) {
    return <Loading message="Cargando proveedores..." />;
  }

  return (
    <>
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
        {error && <div className="crud-error">error {error}</div>}

        <CrudTable
          columns={columns}
          data={proveedores}
          actions={tableActions}
          loading={loading}
          onChangeStatus={cambiarEstado}
          showStatusColumn={true}
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
          title="Eliminar Proveedor?"
          message={`Esta accion eliminara al proveedor "${modalDelete.razonSocial}" y no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          showCancel
          onConfirm={confirmDelete}
          onCancel={closeDeleteModal}
        />
      </CrudLayout>

      <CrudNotification
        isVisible={notification.isVisible}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification((prev) => ({ ...prev, isVisible: false }))}
      />
    </>
  );
}
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CrudLayout from "@shared/components/crud/CrudLayout";
import CrudTable from "@shared/components/crud/CrudTable";
import CrudPagination from "@shared/components/crud/CrudPagination";
import Modal from "@shared/components/ui/Modal";
import CrudNotification from "@shared/styles/components/notifications/CrudNotification";
import { useEmpleados } from "../hooks/useEmpleados";
import "@shared/styles/components/crud-table.css";
import "@shared/styles/components/modal.css";

export default function Empleados() {
  const navigate = useNavigate();
  const {
    empleados,
    loading,
    error,
    page,
    setPage,
    totalPages,
    search,
    setSearch,
    filterEstado,
    setFilterEstado,
    estadoFilters,
    eliminarEmpleado,
    cambiarEstado,
    modalDelete,
    openDeleteModal,
    closeDeleteModal,
  } = useEmpleados();

  const [notification, setNotification] = useState({
    isVisible: false,
    message: "",
    type: "success",
  });

  const showNotification = (message, type = "success") => {
    setNotification({ isVisible: true, message, type });
  };

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, isVisible: false }));
  };

  useEffect(() => {
    if (notification.isVisible) {
      const timer = setTimeout(() => handleCloseNotification(), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification.isVisible]);

  const handleOpenCreate = () => {
    navigate("/admin/servicios/empleados/crear");
  };

  const handleOpenEdit = (item) => {
    navigate(`/admin/servicios/empleados/editar/${item.id}`);
  };

  const handleOpenView = (item) => {
    navigate(`/admin/servicios/empleados/detalle/${item.id}`);
  };

  const confirmDelete = async () => {
    const result = await eliminarEmpleado(modalDelete.id);
    if (result.success) {
      showNotification(`Empleado "${modalDelete.nombre}" eliminado exitosamente`, "success");
      closeDeleteModal();
    } else {
      showNotification(result.error || "Error al eliminar el empleado", "error");
    }
  };

  const handleChangeStatus = async (row, nuevoEstado) => {
    const estadoFinal = nuevoEstado !== undefined ? nuevoEstado : row.estado === "activo" ? "inactivo" : "activo";
    const result = await cambiarEstado(row.id, estadoFinal);
    if (result.success) {
      const mensaje = estadoFinal === "activo"
        ? `Empleado "${row.nombre}" activado exitosamente`
        : `Empleado "${row.nombre}" desactivado exitosamente`;
      showNotification(mensaje, "success");
    } else {
      showNotification(result.error || "Error al cambiar el estado", "error");
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const columns = [
    { field: "nombre", header: "Nombre" },
    { field: "apellido", header: "Apellido" },
    { field: "cargo", header: "Cargo" },
    { field: "correo", header: "Correo Electrónico" },
  ];

  const tableActions = [
    {
      label: "Cambiar estado",
      type: "toggle-status",
      onClick: (item) => handleChangeStatus(item, undefined),
    },
    {
      label: "Ver detalles",
      type: "view",
      onClick: (item) => handleOpenView(item),
    },
    {
      label: "Editar",
      type: "edit",
      onClick: (item) => handleOpenEdit(item),
    },
    {
      label: "Eliminar",
      type: "delete",
      onClick: (item) => openDeleteModal(item.id, `${item.nombre} ${item.apellido}`),
    },
  ];

  return (
    <>
      <CrudLayout
        title="Empleados"
        onAddClick={handleOpenCreate}
        showSearch
        searchPlaceholder="Buscar por nombre, documento, cargo, email..."
        searchValue={search}
        onSearchChange={setSearch}
        searchFilters={estadoFilters}
        filterEstado={filterEstado}
        onFilterChange={setFilterEstado}
      >
        {error && (
          <div
            style={{
              padding: "16px",
              backgroundColor: "#ffebee",
              color: "#c62828",
              borderRadius: "4px",
              marginBottom: "16px",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <CrudTable
          columns={columns}
          data={empleados}
          actions={tableActions}
          loading={loading}
          onChangeStatus={handleChangeStatus}
          emptyMessage={
            search || filterEstado
              ? "No se encontraron empleados para los filtros aplicados"
              : "No hay empleados registrados"
          }
        />

        <CrudPagination
          totalPages={totalPages}
          page={page}
          onChange={handlePageChange}
          show={true}
        />
      </CrudLayout>

      <Modal
        open={modalDelete.open}
        type="warning"
        title="¿Eliminar Empleado?"
        message={`Esta acción eliminará al empleado "${modalDelete.nombre}" y no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        showCancel
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
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
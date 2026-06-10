import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CrudLayout from "@shared/components/crud/CrudLayout";
import UnifiedCrudTable from "@shared/components/crud/CrudTable";
import Modal from "@shared/components/ui/Modal";
import CrudNotification from "@shared/styles/components/notifications/CrudNotification";
import CrudPagination from "@shared/components/crud/CrudPagination";
import { useCitas } from "../hooks/useCitas";
import "@shared/styles/components/crud-table.css";
import "@shared/styles/components/modal.css";

export default function Citas() {
  const navigate = useNavigate();
  const {
    citas,
    totalPages,
    page,
    setPage,
    perPage,
    setPerPage,
    loading,
    error,
    search,
    setSearch,
    filterEstado,
    setFilterEstado,
    estadoFilters,
    eliminarCita,
    cambiarEstado,
    modalDelete,
    openDeleteModal,
    closeDeleteModal,
  } = useCitas();

  const [notificacion, setNotificacion] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  const showNotification = (message, type = "success") => {
    setNotificacion({ visible: true, message, type });
    setTimeout(() => {
      setNotificacion(prev => ({ ...prev, visible: false }));
    }, 5000);
  };

  const closeNotification = () => {
    setNotificacion(prev => ({ ...prev, visible: false }));
  };

  const confirmDelete = async () => {
    const result = await eliminarCita(modalDelete.id);
    if (result.success) {
      showNotification("Cita eliminada correctamente", "success");
      closeDeleteModal();
    } else {
      showNotification(`Error al eliminar: ${result.error}`, "error");
    }
  };

  const handleChangeStatus = async (row, nuevoEstado) => {
    const result = await cambiarEstado(row.id, nuevoEstado);
    if (!result.success) {
      showNotification(`Error al cambiar estado: ${result.error}`, "error");
    } else {
      showNotification(`Estado cambiado a "${nuevoEstado}" correctamente`, "success");
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const columns = [
    { field: "cliente_nombre", header: "Cliente" },
    { field: "servicio_nombre", header: "Servicio" },
    { field: "fecha_formateada", header: "Fecha" },
    { field: "hora_formateada", header: "Hora" },
  ];

  const tableActions = [
    {
      label: "Ver detalles",
      type: "view",
      onClick: (item) => navigate(`detalle/${item.id}`),
    },
    {
      label: "Editar",
      type: "edit",
      onClick: (item) => navigate(`editar/${item.id}`),
    },
    {
      label: "Eliminar",
      type: "delete",
      onClick: (item) => openDeleteModal(item.id, `${item.cliente_nombre} - ${item.servicio_nombre}`),
    },
  ];

  return (
    <>
      <CrudLayout
        title="Citas"
        onAddClick={() => navigate("crear")}
        showSearch
        searchPlaceholder="Buscar por cliente, servicio, empleado..."
        searchValue={search}
        onSearchChange={setSearch}
        searchFilters={estadoFilters}
        filterEstado={filterEstado}
        onFilterChange={setFilterEstado}
      >
        <CrudNotification
          message={notificacion.message}
          type={notificacion.type}
          isVisible={notificacion.visible}
          onClose={closeNotification}
        />

        {error && (
          <CrudNotification
            message={`⚠️ Error al cargar datos: ${error}`}
            type="error"
            isVisible={true}
            onClose={() => {}}
          />
        )}

        <UnifiedCrudTable
          columns={columns}
          data={citas}
          actions={tableActions}
          loading={loading}
          onChangeStatus={handleChangeStatus}
          emptyMessage={
            search || filterEstado
              ? "No se encontraron citas para los filtros aplicados"
              : "No hay citas registradas"
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
        title="¿Eliminar Cita?"
        message={`Esta acción eliminará la cita "${modalDelete.descripcion}" y no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        showCancel
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
      />
    </>
  );
}
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button } from "@mui/material";
import CrudLayout from "@shared/components/crud/CrudLayout";
import UnifiedCrudTable from "@shared/components/crud/CrudTable";
import CrudPagination from "@shared/components/crud/CrudPagination";
import Modal from "@shared/components/ui/Modal";
import CrudNotification from "@shared/styles/components/notifications/CrudNotification";
import { useNovedades, useNovedadForm, NovedadForm } from "@servicios/novedades";
import "@shared/styles/components/crud-table.css";
import "@shared/styles/components/modal.css";

const BRAND_COLOR = "#1a2540";
const BRAND_HOVER = "#2d3a6b";

export default function Novedades() {
  const navigate = useNavigate();
  const [notificacion, setNotificacion] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  const showNotification = (message, type = "success") => {
    setNotificacion({ visible: true, message, type });
    setTimeout(() => setNotificacion(prev => ({ ...prev, visible: false })), 5000);
  };

  const closeNotification = () => setNotificacion(prev => ({ ...prev, visible: false }));

  const {
    novedades,
    empleados,
    loading,
    error,
    search,
    setSearch,
    filterEstado,
    setFilterEstado,
    estadoFilters,
    page,
    setPage,
    totalPages,
    eliminarNovedad,
    cambiarEstado,
    crearNovedad,
    editarNovedad,
    modalForm,
    modalDelete,
    openCreateModal,
    openEditModal,
    openViewModal,
    closeFormModal,
    openDeleteModal,
    closeDeleteModal,
  } = useNovedades();

  const {
    formData,
    errors,
    submitting,
    handleChange,
    handleSubmit: formHandleSubmit,
    resetForm,
  } = useNovedadForm({
    mode: modalForm.mode,
    initialData: modalForm.initialData,
  });

  const handleSave = async () => {
    const payload = await formHandleSubmit();
    if (!payload) return;

    let result;
    if (modalForm.mode === "create") {
      result = await crearNovedad(payload);
    } else {
      result = await editarNovedad(modalForm.initialData?.id, payload);
    }

    if (result?.success) {
      showNotification("Novedad guardada correctamente", "success");
      closeFormModal();
      resetForm();
    } else {
      showNotification(result?.error || "Error al guardar la novedad", "error");
    }
  };

  const handleEditFromView = () => {
    const viewData = modalForm.initialData;
    closeFormModal();
    openEditModal({
      ...viewData,
      estado: viewData.activo ? "activo" : "inactivo",
    });
  };

  const handleModalConfirm = () => {
    if (modalForm.mode === "view") {
      handleEditFromView();
    } else {
      handleSave();
    }
  };

  const confirmDelete = async () => {
    const result = await eliminarNovedad(modalDelete.id);
    if (result.success) {
      showNotification("Novedad eliminada correctamente", "success");
      closeDeleteModal();
    } else {
      showNotification(result.error, "error");
    }
  };

  const handleChangeStatus = async (row, nuevoEstado) => {
    const result = await cambiarEstado(row, nuevoEstado);
    if (result.success) {
      showNotification("Estado actualizado correctamente", "success");
    } else {
      showNotification(result.error, "error");
    }
  };

  const columns = [
    { field: "empleado_nombre", header: "Empleado" },
    { field: "tipo_label", header: "Tipo" },
    { field: "fechas_display", header: "Fechas" },
    { field: "motivo", header: "Motivo" },
  ];

  const tableActions = [
    {
      label: "Cambiar estado",
      type: "toggle-status",
      onClick: (item) => handleChangeStatus(item, item.estado === "activo" ? "inactivo" : "activo"),
    },
    { label: "Ver Detalles", type: "view", onClick: (item) => openViewModal(item) },
    { label: "Editar", type: "edit", onClick: (item) => openEditModal(item) },
    { label: "Eliminar", type: "delete", onClick: (item) => openDeleteModal(item.id, item.descripcion) },
  ];

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <>
      <Box sx={{ p: 2, pb: 0 }}>
        <Button
          onClick={() => navigate("/admin/servicios/agenda")}
          variant="outlined"
          size="small"
          sx={{
            mb: 2,
            borderColor: BRAND_COLOR,
            color: BRAND_COLOR,
            '&:hover': {
              borderColor: BRAND_HOVER,
              backgroundColor: 'rgba(26, 37, 64, 0.04)'
            }
          }}
        >
          Volver a Agenda
        </Button>
      </Box>

      <CrudLayout
        title="Novedades"
        onAddClick={openCreateModal}
        showSearch
        searchPlaceholder="Buscar por empleado, tipo, motivo..."
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
          data={novedades}
          actions={tableActions}
          loading={loading}
          onChangeStatus={cambiarEstado}
          emptyMessage={
            search || filterEstado
              ? "No se encontraron novedades para los filtros aplicados"
              : "No hay novedades registradas"
          }
        />

        <CrudPagination
          totalPages={totalPages}
          page={page}
          onChange={handlePageChange}
          show={true}
        />

        <Modal
          open={modalDelete.open}
          type="warning"
          title="¿Eliminar Novedad?"
          message={`Esta acción eliminará la novedad "${modalDelete.descripcion}" y no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          showCancel
          onConfirm={confirmDelete}
          onCancel={closeDeleteModal}
        />

        <Modal
          open={modalForm.open}
          type="info"
          title={modalForm.title}
          confirmText={modalForm.mode === "view" ? "Editar" : "Guardar"}
          cancelText={modalForm.mode === "view" ? "Cerrar" : "Cancelar"}
          showCancel
          onConfirm={handleModalConfirm}
          onCancel={closeFormModal}
          confirmButtonColor={BRAND_COLOR}
          confirmButtonHoverColor={BRAND_HOVER}
        >
          <NovedadForm
            id="novedad-form"
            mode={modalForm.mode}
            empleados={empleados}
            formData={formData}
            errors={errors}
            submitting={submitting}
            handleChange={handleChange}
            handleSubmit={formHandleSubmit}
            submitError={notificacion.type === "error" && notificacion.visible ? notificacion.message : null}
          />
        </Modal>
      </CrudLayout>
    </>
  );
}
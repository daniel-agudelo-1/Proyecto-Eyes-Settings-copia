import { useRef, useState } from "react";
import CrudLayout from "@shared/components/crud/CrudLayout";
import CrudTable from "@shared/components/crud/CrudTable";
import CrudPagination from "@shared/components/crud/CrudPagination";
import Modal from "@shared/components/ui/Modal";
import CrudNotification from "@shared/styles/components/notifications/CrudNotification";
import { useActionBlocker } from "@shared/hooks/useActionBlocker";
import { useCategorias } from "../hooks/useCategorias";
import { useCategoriaForm } from "../hooks/useCategoriaForm";
import CategoriaForm from "../components/CategoriaForm";
import "@shared/styles/components/crud-table.css";
import "@shared/styles/components/modal.css";

export default function Categorias() {
  const submitButtonRef = useRef(null);

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    type: "success",
  });

  const showNotification = (message, type = "success") => {
    setNotification({ open: true, message, type });
  };

  const closeNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  const {
    categorias,
    loading,
    error,
    search,
    setSearch,
    filterEstado,
    setFilterEstado,
    page,
    setPage,
    totalPages,
    modalForm,
    modalDelete,
    openCreateModal,
    openEditModal,
    openViewModal,
    closeFormModal,
    openDeleteModal,
    closeDeleteModal,
    eliminarCategoria,
    cambiarEstado,
    loadCategorias,
  } = useCategorias();

  const {
    formData,
    errors,
    nombreExists,
    submitting,
    handleChange,
    handleSubmit,
    resetForm,
  } = useCategoriaForm({
    mode: modalForm.mode,
    initialData: modalForm.initialData,
    onSubmitSuccess: () => {
      loadCategorias();
      showNotification(
        modalForm.mode === "create"
          ? "Categoría creada exitosamente"
          : "Categoría actualizada exitosamente",
        "success"
      );
    },
    onError: (errorMessage) => {
      showNotification(errorMessage, "error");
    },
  });

  const { execute: executeDelete } = useActionBlocker();
  const { execute: executeStatusChange } = useActionBlocker();

  const handleCloseFormModal = () => {
    closeFormModal();
    resetForm();
  };

  const handleModalConfirm = () => {
    if (modalForm.mode === "view") {
      handleCloseFormModal();
      return;
    }
    const formElement = document.getElementById("categoria-form");
    if (formElement && !submitting) {
      formElement.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    }
  };

  const confirmDelete = async () => {
    if (!modalDelete.id) {
      showNotification("Error: No se pudo identificar la categoría a eliminar", "error");
      closeDeleteModal();
      return;
    }
    await executeDelete(async () => {
      const result = await eliminarCategoria(modalDelete.id, modalDelete.nombre);
      if (result.success) {
        closeDeleteModal();
        showNotification(`Categoría "${modalDelete.nombre}" eliminada correctamente`, "success");
      } else {
        showNotification(
          result.error || `No se puede eliminar la categoría "${modalDelete.nombre}" porque está relacionada a un producto`,
          "error"
        );
      }
    });
  };

  const handleStatusChange = async (row) => {
    if (!row || !row.id) return;
    await executeStatusChange(async () => {
      const result = await cambiarEstado(row.id, row.estado);
      if (result.success) {
        const nuevoEstado = row.estado === "activa" ? "inactiva" : "activa";
        showNotification(`Categoría "${row.nombre}" cambiada a ${nuevoEstado}`, "success");
      } else {
        showNotification(result.error || "Error al cambiar el estado", "error");
      }
    });
  };

  const searchFilters = [
    { value: "", label: "Todos" },
    { value: "activa", label: "Activas" },
    { value: "inactiva", label: "Inactivas" },
  ];

  const columns = [{ field: "nombre", header: "Nombre" }];

  const tableActions = [
    {
      label: "Cambiar estado",
      type: "toggle-status",
      onClick: (item) => handleStatusChange(item),
    },
    {
      label: "Ver Detalles",
      type: "view",
      onClick: (item) => openViewModal(item),
    },
    {
      label: "Editar",
      type: "edit",
      onClick: (item) => openEditModal(item),
    },
    {
      label: "Eliminar",
      type: "delete",
      onClick: (item) => openDeleteModal(item.id, item.nombre),
    },
  ];

  return (
    <>
      <CrudNotification
        message={notification.message}
        type={notification.type}
        isVisible={notification.open}
        onClose={closeNotification}
        duration={5000}
      />

      <CrudLayout
        title="Categorías de Productos"
        onAddClick={openCreateModal}
        showSearch={true}
        searchPlaceholder="Buscar por nombre, descripción..."
        searchValue={search}
        onSearchChange={setSearch}
        searchFilters={searchFilters}
        filterEstado={filterEstado}
        onFilterChange={setFilterEstado}
        searchPosition="left"
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
            {error}
          </div>
        )}

        <CrudTable
          columns={columns}
          data={categorias}
          actions={tableActions}
          loading={loading}
          onChangeStatus={handleStatusChange}
          emptyMessage={
            search || filterEstado
              ? "No se encontraron categorías para los filtros aplicados"
              : "No hay categorías registradas"
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
          title="¿Eliminar Categoría?"
          message={`Esta acción eliminará la categoría "${modalDelete.nombre}" y no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          showCancel={true}
          onConfirm={confirmDelete}
          onCancel={closeDeleteModal}
        />
      </CrudLayout>

      <Modal
        open={modalForm.open}
        type="info"
        title={modalForm.title}
        confirmText={modalForm.mode === "view" ? "Cerrar" : "Guardar"}
        cancelText="Cancelar"
        showCancel={modalForm.mode !== "view"}
        onConfirm={handleModalConfirm}
        onCancel={handleCloseFormModal}
        confirmButtonColor="#1a2540"
        confirmButtonHoverColor="#2d3a6b"
      >
        <CategoriaForm
          id="categoria-form"
          mode={modalForm.mode}
          initialData={modalForm.initialData}
          onCancel={handleCloseFormModal}
          formData={formData}
          errors={errors}
          nombreExists={nombreExists}
          submitting={submitting}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
        />
      </Modal>
    </>
  );
}
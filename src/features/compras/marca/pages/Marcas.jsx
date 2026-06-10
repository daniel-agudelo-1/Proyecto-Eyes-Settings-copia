import { Alert, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import CrudLayout from "@shared/components/crud/CrudLayout";
import CrudTable from "@shared/components/crud/CrudTable";
import CrudPagination from "@shared/components/crud/CrudPagination";
import Modal from "@shared/components/ui/Modal";
import MarcaForm from "../components/MarcaForm";
import CrudNotification from "@shared/styles/components/notifications/CrudNotification";
import { useMarcas } from "../hooks/useMarcas";

export default function Marcas() {
  const {
    marcas,
    loading,
    error,
    search,
    filterEstado,
    page,
    setPage,
    totalPages,
    notification,
    modalForm,
    modalDelete,
    submitButtonRef,
    isProcessingSave,
    searchFilters,
    setSearch,
    setFilterEstado,
    handleFormSubmit,
    handleDelete,           // <--- AHORA SÍ ESTÁ
    confirmDelete,
    handleStatusChange,
    handleOpenCreate,
    handleCloseForm,
    handleCancelDelete,
    handleCloseNotification,
    handleModalConfirm,
    handleOpenEdit,
    handleOpenView,
  } = useMarcas();

  const isProcessing = modalForm.mode !== "view" && isProcessingSave();
  const isViewMode = modalForm.mode === "view";

  const columns = [
    { field: "nombre", header: "Nombre" },
  ];

  const tableActions = [
    {
      label: "Cambiar estado",
      type: "toggle-status",
      onClick: (item) => handleStatusChange(item),
    },
    {
      label: "Ver Detalles",
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
      onClick: (item) => handleDelete(item.id, item.nombre),
    },
  ];

  return (
    <>
      <CrudLayout
        title="Marcas"
        onAddClick={handleOpenCreate}
        showSearch
        searchPlaceholder="Buscar por nombre..."
        searchValue={search}
        onSearchChange={setSearch}
        searchFilters={searchFilters}
        filterEstado={filterEstado}
        onFilterChange={setFilterEstado}
        searchPosition="left"
      >
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <CrudTable
          columns={columns}
          data={marcas}
          actions={tableActions}
          loading={loading}
          onChangeStatus={handleStatusChange}
          emptyMessage={
            search || filterEstado
              ? "No se encontraron marcas para los filtros aplicados"
              : "No hay marcas registradas"
          }
        />

        <CrudPagination totalPages={totalPages} page={page} onChange={setPage} />

        <Modal
          open={modalDelete.open}
          type="warning"
          title="¿Eliminar Marca?"
          message={
            <>
              Advertencia: al continuar, la marca{" "}
              <Box component="span" sx={{ fontWeight: "bold", fontSize: "1.2rem" }}>
                {modalDelete.nombre}
              </Box>{" "}
              se eliminará permanentemente del sistema.
            </>
          }
          confirmText="Eliminar"
          cancelText="Cancelar"
          showCancel
          onConfirm={confirmDelete}
          onCancel={handleCancelDelete}
        />
      </CrudLayout>

      {/* Modal para crear/editar (componente compartido) */}
      {!isViewMode && (
        <Modal
          open={modalForm.open}
          type="info"
          title={modalForm.title}
          confirmText="Guardar"
          cancelText="Cancelar"
          showCancel
          onConfirm={handleModalConfirm}
          onCancel={handleCloseForm}
          confirmButtonColor="#1a2540"
          confirmButtonHoverColor="#2d3a6b"
          confirmDisabled={isProcessing}
        >
          <MarcaForm
            id="marca-form"
            mode={modalForm.mode}
            initialData={modalForm.initialData}
            onSubmit={handleFormSubmit}
            onCancel={handleCloseForm}
            embedded
            buttonRef={submitButtonRef}
          />
        </Modal>
      )}

      {/* Dialog personalizado para modo vista con botones Cerrar y Editar */}
      {isViewMode && (
        <Dialog
          open={modalForm.open}
          onClose={handleCloseForm}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pb: 1 }}>
            {modalForm.title}
          </DialogTitle>
          <DialogContent sx={{ pt: "8px !important" }}>
            <MarcaForm
              id="marca-form-view"
              mode="view"
              initialData={modalForm.initialData}
              onSubmit={handleFormSubmit}
              onCancel={handleCloseForm}
              embedded
              buttonRef={submitButtonRef}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
            <Button onClick={handleCloseForm}>
              Cerrar
            </Button>
            <Button
              onClick={() => {
                if (modalForm.initialData) {
                  handleCloseForm();
                  handleOpenEdit(modalForm.initialData);
                }
              }}
              sx={{
                backgroundColor: "#1a2540",
                color: "#fff",
                "&:hover": { backgroundColor: "#2d3a6b" },
              }}
            >
              Editar
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <CrudNotification
        isVisible={notification.isVisible}
        message={notification.message}
        type={notification.type}
        onClose={handleCloseNotification}
      />
    </>
  );
}
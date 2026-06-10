import { Alert, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import CrudLayout from '@shared/components/crud/CrudLayout';
import CrudTable from '@shared/components/crud/CrudTable';
import CrudPagination from '@shared/components/crud/CrudPagination';
import Modal from '@shared/components/ui/Modal';
import ServicioForm from '../components/ServicioForm';
import CrudNotification from '@shared/styles/components/notifications/CrudNotification';
import { useServicios } from '../hooks/useServicios';

const BRAND_COLOR = '#1a2540';
const BRAND_HOVER = '#2d3a6b';

export default function Servicios() {
  const {
    servicios,
    loading,
    error,
    search,
    setSearch,
    filterEstado,
    setFilterEstado,
    page,
    setPage,
    totalPages,
    notification,
    modalForm,
    modalDelete,
    submitButtonRef,
    isSaving,
    searchFilters,
    columns,
    tableActions,
    crearServicio,
    editarServicio,
    eliminarServicio,
    cambiarEstado,
    handleOpenCreate,
    handleOpenEdit,
    handleCloseForm,
    handleCancelDelete,
    handleCloseNotification,
    handleModalConfirm,
  } = useServicios();

  const isProcessing = modalForm.mode !== 'view' && isSaving;
  const isViewMode = modalForm.mode === 'view';

  const handleFormSubmit = async (data) => {
    if (modalForm.mode === 'create') {
      await crearServicio(data);
    } else {
      await editarServicio(modalForm.initialData.id, data);
    }
  };

  const handleEditFromView = () => {
    const viewData = modalForm.initialData;
    handleCloseForm();
    handleOpenEdit(viewData);
  };

  const handleModalConfirmClick = () => {
    if (modalForm.mode === 'view') {
      handleEditFromView();
    } else {
      if (submitButtonRef.current) {
        submitButtonRef.current.click();
      }
    }
  };

  return (
    <>
      <CrudLayout
        title="Servicios"
        onAddClick={handleOpenCreate}
        showSearch
        searchPlaceholder="Buscar por nombre o descripción..."
        searchValue={search}
        onSearchChange={setSearch}
        searchFilters={searchFilters}
        filterEstado={filterEstado}
        onFilterChange={setFilterEstado}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error?.message || 'No se pudieron cargar los servicios'}
          </Alert>
        )}

        <CrudTable
          columns={columns}
          data={servicios}
          actions={tableActions}
          loading={loading}
          onChangeStatus={(item, nuevoEstado) => cambiarEstado(item, nuevoEstado)}
          emptyMessage={
            search || filterEstado
              ? 'No se encontraron servicios para los filtros aplicados'
              : 'No hay servicios registrados'
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
          title="Eliminar Servicio"
          message={
            <>
              Esta acción eliminará el servicio{' '}
              <Box component="span" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                {modalDelete.nombre}
              </Box>{' '}
              y no se puede deshacer.
            </>
          }
          confirmText="Eliminar"
          cancelText="Cancelar"
          showCancel
          onConfirm={() => eliminarServicio(modalDelete.id, modalDelete.nombre)}
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
          confirmButtonColor={BRAND_COLOR}
          confirmButtonHoverColor={BRAND_HOVER}
          confirmDisabled={isProcessing}
          maxWidth="md"
        >
          <ServicioForm
            id="servicio-form"
            mode={modalForm.mode}
            initialData={modalForm.initialData}
            onSubmit={handleFormSubmit}
            onCancel={handleCloseForm}
            embedded
            submitButtonRef={submitButtonRef}
          />
        </Modal>
      )}

      {/* Dialog personalizado para modo vista con botones: Cerrar (outlined) y Editar (contained) */}
      {isViewMode && (
        <Dialog
          open={modalForm.open}
          onClose={handleCloseForm}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', pb: 1 }}>
            {modalForm.title}
          </DialogTitle>
          <DialogContent sx={{ pt: '8px !important' }}>
            <ServicioForm
              id="servicio-form-view"
              mode="view"
              initialData={modalForm.initialData}
              onSubmit={handleFormSubmit}
              onCancel={handleCloseForm}
              embedded
              submitButtonRef={submitButtonRef}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
            <Button
              variant="outlined"
              onClick={handleCloseForm}
              sx={{
                color: BRAND_COLOR,
                borderColor: BRAND_COLOR,
                '&:hover': {
                  backgroundColor: 'rgba(26, 37, 64, 0.04)',
                  borderColor: BRAND_HOVER,
                  color: BRAND_HOVER,
                },
                textTransform: 'none',
              }}
            >
              Cerrar
            </Button>
            <Button
              variant="contained"
              onClick={handleEditFromView}
              sx={{
                backgroundColor: BRAND_COLOR,
                '&:hover': { backgroundColor: BRAND_HOVER },
                textTransform: 'none',
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
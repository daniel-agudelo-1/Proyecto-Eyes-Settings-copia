import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import CrudLayout from "@shared/components/crud/CrudLayout";
import CrudTable from "@shared/components/crud/CrudTable";
import CrudPagination from "@shared/components/crud/CrudPagination";
import Modal from "@shared/components/ui/Modal";
import CrudNotification from "@shared/styles/components/notifications/CrudNotification";
import { deleteUser, updateEstadoUser, getAllRoles } from "@seguridad";
import { useUsuariosList } from "../hooks/useUsuariosList";

const STATUS_FILTERS = [
  { value: "",         label: "Todos los estados" },
  { value: "activo",   label: "Activos"           },
  { value: "inactivo", label: "Inactivos"         },
];

export default function GestionUsuarios() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    usuarios,
    loading,
    error,
    page,
    setPage,
    totalPages,
    search,
    setSearch,
    filterEstado,
    setFilterEstado,
  } = useUsuariosList();

  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: "" });
  const [notification, setNotification] = useState({ isVisible: false, message: "", type: "success" });

  const showNotification = (message, type = "success") =>
    setNotification({ isVisible: true, message, type });
  const handleCloseNotification = () =>
    setNotification((prev) => ({ ...prev, isVisible: false }));

  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: getAllRoles,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const pending = sessionStorage.getItem("crudNotification");
    if (pending) {
      const { message, type } = JSON.parse(pending);
      sessionStorage.removeItem("crudNotification");
      showNotification(message, type);
    }
  }, []);

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsuarios"] });
      setDeleteModal({ open: false, id: null, name: "" });
      showNotification(`Usuario "${deleteModal.name}" eliminado correctamente`);
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || err?.message || "Error al eliminar usuario";
      setDeleteModal({ open: false, id: null, name: "" });
      showNotification(msg, "error");
    },
  });

  const estadoMutation = useMutation({
    mutationFn: ({ id, estado }) => updateEstadoUser(id, estado),
    onSuccess: (_, { estado }) => {
      queryClient.invalidateQueries({ queryKey: ["allUsuarios"] });
      const label = estado === "activo" ? "activado" : "desactivado";
      showNotification(`Usuario ${label} correctamente`);
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || err?.message || "Error al cambiar el estado";
      showNotification(msg, "error");
    },
  });

  const handleDelete = (id, name) => setDeleteModal({ open: true, id, name });
  const confirmDelete = () => deleteMutation.mutate(deleteModal.id);
  const handleChangeStatus = async (row, nuevoEstado) => {
    await estadoMutation.mutateAsync({ id: row.id, estado: nuevoEstado });
  };

  const columns = [
    { field: "nombre", header: "Nombre",  render: (item) => item.nombre },
    { field: "correo", header: "Correo",  render: (item) => item.correo },
    {
      field: "rol_id",
      header: "Rol",
      render: ({ rol_id }) => roles.find((r) => r.id === rol_id)?.nombre ?? "Sin rol",
    },
  ];

  const tableActions = [
    { label: "Ver detalles", type: "view",   onClick: (row) => navigate(`detalle/${row.id}`) },
    { label: "Editar",       type: "edit",   onClick: (row) => navigate(`editar/${row.id}`)  },
    { label: "Eliminar",     type: "delete", onClick: (row) => handleDelete(row.id, row.nombre) },
  ];

  return (
    <>
      <CrudLayout
        title="Gestión de Usuarios"
        onAddClick={() => navigate("crear")}
        showSearch
        searchPlaceholder="Buscar por nombre o correo..."
        searchValue={search}
        onSearchChange={setSearch}
        searchFilters={STATUS_FILTERS}
        filterEstado={filterEstado}
        onFilterChange={setFilterEstado}
      >
        {error && (
          <div
            style={{
              padding: 16,
              backgroundColor: "#ffebee",
              color: "#c62828",
              borderRadius: 4,
              marginBottom: 16,
            }}
          >
            ⚠️ {error?.message || "No se pudieron cargar los usuarios"}
          </div>
        )}

        <CrudTable
          columns={columns}
          data={usuarios}
          actions={tableActions}
          loading={loading}
          onChangeStatus={handleChangeStatus}
          emptyMessage={
            search || filterEstado
              ? "No se encontraron usuarios para los filtros aplicados"
              : "No hay usuarios registrados"
          }
        />

        <CrudPagination
          totalPages={totalPages}
          page={page}
          onChange={setPage}
          show={true}
        />

        <Modal
          open={deleteModal.open}
          type="warning"
          title="¿Eliminar Usuario?"
          message={`Esta acción eliminará al usuario "${deleteModal.name}" y no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          showCancel
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal({ open: false, id: null, name: "" })}
        />
      </CrudLayout>

      <CrudNotification
        isVisible={notification.isVisible}
        message={notification.message}
        type={notification.type}
        onClose={handleCloseNotification}
      />
    </>
  );
}
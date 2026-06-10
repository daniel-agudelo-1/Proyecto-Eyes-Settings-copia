import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CrudLayout, CrudTable, Modal } from "@shared";
import CrudPagination from "@shared/components/crud/CrudPagination";
import CrudNotification from "@shared/styles/components/notifications/CrudNotification";
import { deleteRol, updateEstadoRol } from "../services/rolServices";
import { contarEntidadesConPermisos } from "../utils/rolHelpers";
import { useRolesList } from "../hooks/useRolesList";

const ESTADO_OPTIONS = [
  { value: "",        label: "Todos los estados" },
  { value: "activo",  label: "Activos"           },
  { value: "inactivo",label: "Inactivos"         },
];

const COLUMNS = [
  { field: "nombre", header: "Nombre" },
  {
    field: "permisos",
    header: "Permisos",
    render: (item) => `${contarEntidadesConPermisos(item.permisos || [])} permisos`,
  },
];

export default function Roles() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    roles,
    loading,
    error,
    page,
    setPage,
    totalPages,
    search,
    setSearch,
    filterEstado,
    setFilterEstado,
  } = useRolesList();

  const [notification, setNotification] = useState({ isVisible: false, message: "", type: "success" });
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, nombre: "" });

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

  const deleteMutation = useMutation({
    mutationFn: deleteRol,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allRoles"] });
      setDeleteModal({ open: false, id: null, nombre: "" });
      showNotification(`Rol "${deleteModal.nombre}" eliminado correctamente`);
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || err?.message || "Error al eliminar el rol";
      setDeleteModal({ open: false, id: null, nombre: "" });
      showNotification(msg, "error");
    },
  });

  const estadoMutation = useMutation({
    mutationFn: ({ id, estado }) => updateEstadoRol(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allRoles"] });
    },
  });

  const handleDelete = (id, nombre) => {
    if (nombre === "admin") {
      showNotification("No se puede eliminar el rol de administrador", "error");
      return;
    }
    setDeleteModal({ open: true, id, nombre });
  };

  const confirmDelete = () => deleteMutation.mutate(deleteModal.id);

  const handleChangeStatus = async (row, nuevoEstado) => {
    if (row.nombre === "admin") {
      showNotification("No se puede cambiar el estado del rol de administrador", "error");
      return;
    }
    try {
      await estadoMutation.mutateAsync({ id: row.id, estado: nuevoEstado });
      const label = nuevoEstado === "activo" ? "activado" : "desactivado";
      showNotification(`Rol "${row.nombre}" ${label} correctamente`);
    } catch (err) {
      showNotification(err?.response?.data?.error || "Error al cambiar estado", "error");
    }
  };

  const tableActions = [
    {
      label: "Ver detalles",
      type: "view",
      onClick: (row) => navigate(`detalle/${row.id}`),
    },
    {
      label: "Editar",
      type: "edit",
      onClick: (row) => {
        if (row.nombre === "admin") {
          showNotification("No se puede editar el rol de administrador", "error");
          return;
        }
        navigate(`editar/${row.id}`);
      },
    },
    {
      label: "Eliminar",
      type: "delete",
      onClick: (row) => {
        if (row.nombre === "admin") {
          showNotification("No se puede eliminar el rol de administrador", "error");
          return;
        }
        handleDelete(row.id, row.nombre);
      },
    },
  ];

  return (
    <>
      <CrudLayout
        title="Roles"
        onAddClick={() => navigate("crear")}
        showSearch
        searchPlaceholder="Buscar por nombre..."
        searchValue={search}
        onSearchChange={setSearch}
        searchFilters={ESTADO_OPTIONS}
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
            ⚠️ {error?.message || "Error al cargar roles"}
          </div>
        )}

        <CrudTable
          columns={COLUMNS}
          data={roles}
          actions={tableActions}
          loading={loading}
          onChangeStatus={handleChangeStatus}
          emptyMessage={
            search || filterEstado
              ? "No se encontraron roles para los filtros aplicados"
              : "No hay roles configurados"
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
          title="¿Eliminar Rol?"
          message={`Esta acción eliminará el rol "${deleteModal.nombre}" y no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          showCancel
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal({ open: false, id: null, nombre: "" })}
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
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import RolForm from '@seguridad/roles/components/RolForm';
import Loading from '@shared/components/ui/Loading';
import CrudNotification from '@shared/styles/components/notifications/CrudNotification';
import { createRol, getAllPermisos, buildRolCreatePayload } from '@seguridad';

export default function CrearRol() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [notification, setNotification] = useState({
    isVisible: false, message: '', type: 'success',
  });
  const showNotification = (message, type = 'success') =>
    setNotification({ isVisible: true, message, type });
  const handleCloseNotification = () =>
    setNotification((prev) => ({ ...prev, isVisible: false }));

  const { data: permisosDisponibles = [], isLoading: loadingPermisos } = useQuery({
    queryKey: ['permisos'],
    queryFn: getAllPermisos,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: createRol,
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ['allRoles'] });
      sessionStorage.setItem(
        'crudNotification',
        JSON.stringify({ message: `Rol "${data.nombre}" creado correctamente`, type: 'success' })
      );
      navigate('/admin/seguridad/roles');
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || err?.message || 'Error al crear el rol';
      showNotification(msg, 'error');
    },
  });

  const handleCreate = (data) => {
    const payload = buildRolCreatePayload(data);
    createMutation.mutate(payload);
  };

  if (loadingPermisos) return <Loading text="Cargando permisos..." />;

  return (
    <>
      <RolForm
        mode="create"
        title="Crear Rol"
        permisosDisponibles={permisosDisponibles}
        onSubmit={handleCreate}
        onCancel={() => navigate('/admin/seguridad/roles')}
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
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import RolForm from '@seguridad/roles/components/RolForm';
import Loading from '@shared/components/ui/Loading';
import CrudNotification from '@shared/styles/components/notifications/CrudNotification';
import { getRolById, updateRol, getAllPermisos, normalizarRolInitialData } from '@seguridad';

export default function EditarPermisos() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [notification, setNotification] = useState({
    isVisible: false, message: '', type: 'success',
  });
  const showNotification = (message, type = 'success') =>
    setNotification({ isVisible: true, message, type });
  const handleCloseNotification = () =>
    setNotification((prev) => ({ ...prev, isVisible: false }));

  const {
    data: rolData,
    isLoading: loadingRol,
    error: rolError,
  } = useQuery({
    queryKey: ['rol', id],
    queryFn: async () => {
      const rol = await getRolById(id);
      if (!rol) throw new Error('Rol no encontrado');
      return normalizarRolInitialData(rol);
    },
    enabled: !!id,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const { data: permisosDisponibles = [], isLoading: loadingPermisos } = useQuery({
    queryKey: ['permisos'],
    queryFn: getAllPermisos,
    staleTime: 5 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => updateRol(id, data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ['allRoles'] });
      queryClient.invalidateQueries({ queryKey: ['rol', id] });
      sessionStorage.setItem(
        'crudNotification',
        JSON.stringify({ message: `Rol "${data.nombre}" actualizado correctamente`, type: 'success' })
      );
      navigate('/admin/seguridad/roles');
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || err?.message || 'Error al actualizar el rol';
      showNotification(msg, 'error');
    },
  });

  const handleUpdate = (data) => updateMutation.mutate(data);

  if (loadingRol || loadingPermisos) return <Loading text="Cargando rol..." />;

  if (rolError || !rolData) {
    navigate('/admin/seguridad/roles');
    return null;
  }

  return (
    <>
      <RolForm
        mode="edit"
        title="Editar Rol"
        initialData={rolData}
        permisosDisponibles={permisosDisponibles}
        onSubmit={handleUpdate}
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
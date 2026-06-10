import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { getAllRoles } from "@seguridad/roles/services/rolServices";
import { createUser } from "../services/userServices";
import { validateAdminUserForm } from "../utils/userValidators";
import UserForm         from "../components/UserForm";
import Loading          from "@shared/components/ui/Loading";
import CrudNotification from "@shared/styles/components/notifications/CrudNotification";

export default function CrearUsuario() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    nombre:                "",
    correo:                "",
    rol_id:                "",
    contrasenia:           "",
    confirmar_contrasenia: "",
  });
  const [errors,       setErrors]       = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ isVisible: false, message: "", type: "success" });

  const { data: roles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ["roles"],
    queryFn:  getAllRoles,
    staleTime: 5 * 60 * 1000,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = validateAdminUserForm(formData, "create");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsuarios"] });
      sessionStorage.setItem(
        "crudNotification",
        JSON.stringify({ message: `Usuario "${formData.nombre}" creado correctamente`, type: "success" })
      );
      navigate("/admin/seguridad/usuarios");
    },
    onError: (error) => {
      const msg = error.message || "Error al crear usuario";
      if (error.message?.includes("correo")) {
        setErrors((prev) => ({ ...prev, correo: error.message }));
      } else {
        setNotification({ isVisible: true, message: msg, type: "error" });
      }
      setIsSubmitting(false);
    },
  });

  const handleSubmit = () => {
    if (!validate()) return;
    setIsSubmitting(true);
    createMutation.mutate({
      nombre:      formData.nombre,
      correo:      formData.correo,
      contrasenia: formData.contrasenia,
      rol_id:      Number(formData.rol_id),
      estado:      true,
    });
  };

  if (loadingRoles) return <Loading text="Cargando roles..." />;

  return (
    <>
      <UserForm
        mode="create"
        title="Crear Nuevo Usuario"
        initialData={formData}
        rolesDisponibles={roles}
        errors={errors}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={() => navigate("/admin/seguridad/usuarios")}
        isSubmitting={isSubmitting}
      />
      <CrudNotification
        isVisible={notification.isVisible}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification((prev) => ({ ...prev, isVisible: false }))}
      />
    </>
  );
}
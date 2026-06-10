import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { getAllRoles }              from "@seguridad/roles/services/rolServices";
import { getUserById, updateUser }  from "../services/userServices";
import { normalizeUserInitialData } from "../utils/userNormalizer";
import { validateAdminUserForm }    from "../utils/userValidators";
import UserForm         from "../components/UserForm";
import Loading          from "@shared/components/ui/Loading";
import CrudNotification from "@shared/styles/components/notifications/CrudNotification";

export default function EditarUsuario() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  const initializedRef = useRef(false);

  const [formData, setFormData] = useState({
    nombre:                "",
    correo:                "",
    rol_id:                "",
    estado:                true,
    contrasenia:           "",
    confirmar_contrasenia: "",
  });
  const [errors,       setErrors]       = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ isVisible: false, message: "", type: "success" });

  const { data: userData, isLoading: loadingUser, error: userError } = useQuery({
    queryKey: ["usuario", id],
    queryFn: async () => {
      const data = await getUserById(id);
      if (!data) throw new Error("Usuario no encontrado");
      return normalizeUserInitialData(data);
    },
    enabled:   !!id,
    retry:     false,
    staleTime: 5 * 60 * 1000,
  });

  const { data: roles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ["roles"],
    queryFn:  getAllRoles,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (userData && !initializedRef.current) {
      initializedRef.current = true;
      setFormData({
        nombre:                userData.nombre  || "",
        correo:                userData.correo  || "",
        rol_id:                userData.rol_id  || "",
        estado:                userData.estado  ?? true,
        contrasenia:           "",
        confirmar_contrasenia: "",
      });
    }
  }, [userData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = validateAdminUserForm(formData, "edit");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateMutation = useMutation({
    mutationFn: (payload) => updateUser(id, payload),
    onSuccess: () => {
      sessionStorage.setItem(
        "crudNotification",
        JSON.stringify({
          message: `Usuario "${formData.nombre}" actualizado correctamente`,
          type: "success",
        })
      );
      navigate("/admin/seguridad/usuarios");
      queryClient.invalidateQueries({ queryKey: ["allUsuarios"] });
      queryClient.invalidateQueries({ queryKey: ["usuario", id] });
    },
    onError: (error) => {
      const msg = error.message || "Error al editar usuario";
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

    const payload = {
      nombre: formData.nombre,
      correo: formData.correo,
      rol_id: Number(formData.rol_id),
      estado: formData.estado,
    };
    if (formData.contrasenia) payload.contrasenia = formData.contrasenia;

    updateMutation.mutate(payload);
  };

  if (loadingUser || loadingRoles) return <Loading text="Cargando usuario..." />;

  if (userError || !userData) {
    navigate("/admin/seguridad/usuarios");
    return null;
  }

  return (
    <>
      <UserForm
        mode="edit"
        title={`Editar Usuario: ${formData.nombre}`}
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
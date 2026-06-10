import { useState, useEffect, useCallback } from "react";
import { createProveedor, updateProveedor } from "../services/proveedoresService";
import { DEFAULT_PROVEEDOR_FORM, validateProveedor } from "../utils/proveedoresUtils";

export function useProveedorForm({ mode = "create", initialData = null, onSubmitSuccess, onError }) {
  const isView   = mode === "view";
  const isCreate = mode === "create";

  const [formData,   setFormData]   = useState(DEFAULT_PROVEEDOR_FORM);
  const [errors,     setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);

  // ============================
  // Cargar datos iniciales
  // ============================
  useEffect(() => {
    if (!initialData) return;
    setFormData({
      tipoProveedor:  initialData.tipoProveedor  || DEFAULT_PROVEEDOR_FORM.tipoProveedor,
      tipoDocumento:  initialData.tipoDocumento  || DEFAULT_PROVEEDOR_FORM.tipoDocumento,
      documento:      initialData.documento      || "",
      razonSocial:    initialData.razonSocial    || "",
      contactoNombre: initialData.contactoNombre || "",
      telefono:       initialData.telefono       || "",
      correo:         initialData.correo         || "",
      departamento:   initialData.departamento   || "",
      municipio:      initialData.municipio      || "",
      direccion:      initialData.direccion      || "",
      estado:         initialData.estado ?? "activo",
    });
  }, [initialData]);

  // ============================
  // Handle change — resetea municipio si cambia departamento
  // ============================
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name === "departamento") {
      setFormData((prev) => ({ ...prev, departamento: value, municipio: "" }));
      setErrors((prev) => ({ ...prev, departamento: "", municipio: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }, [errors]);

  // ============================
  // Handle document change (solo números)
  // ============================
  const handleDocumentChange = useCallback((e) => {
    const soloNumeros = e.target.value.replace(/\D/g, "");
    setFormData((prev) => ({ ...prev, documento: soloNumeros }));
    if (errors.documento) setErrors((prev) => ({ ...prev, documento: "" }));
  }, [errors]);

  // ============================
  // Handle phone change (solo números)
  // ============================
  const handlePhoneChange = useCallback((e) => {
    const soloNumeros = e.target.value.replace(/\D/g, "");
    setFormData((prev) => ({ ...prev, telefono: soloNumeros }));
    if (errors.telefono) setErrors((prev) => ({ ...prev, telefono: "" }));
  }, [errors]);

  // ============================
  // Submit
  // ============================
  const handleSubmit = useCallback(async () => {
    const newErrors = validateProveedor(formData);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return { success: false };
    }

    setSubmitting(true);
    try {
      const payload = { ...formData, estado: formData.estado === "activo" };
      const result  = isCreate
        ? await createProveedor(payload)
        : await updateProveedor(initialData.id, payload);

      onSubmitSuccess?.(result);
      return { success: true, data: result };
    } catch (error) {
      console.error("Error al guardar proveedor:", error);
      const errorMessage = error.response?.data?.message || "Error al guardar el proveedor";
      onError?.(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSubmitting(false);
    }
  }, [formData, isCreate, initialData, onSubmitSuccess, onError]);

  // ============================
  // Reset form
  // ============================
  const resetForm = useCallback(() => {
    setFormData(DEFAULT_PROVEEDOR_FORM);
    setErrors({});
  }, []);

  return {
    formData,
    errors,
    submitting,
    isView,
    isCreate,
    handleChange,
    handleDocumentChange,
    handlePhoneChange,
    handleSubmit,
    resetForm,
    setFormData,
  };
}
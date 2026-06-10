import { useState, useEffect, useCallback } from "react";
import { createEmpleado, updateEmpleado, checkDocumentoExists, checkEmailExists } from "../services/empleadosService";
import {
  validateNombre,
  validateApellido,
  validateDocumento,
  validateTelefono,
  validateEmail,
  validateFechaIngreso,
} from "../utils/empleadosUtils";

export function useEmpleadoForm({ mode = "create", initialData = null, onSubmitSuccess, onError } = {}) {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    tipoDocumento: "CC",
    numero_documento: "",
    telefono: "",
    correo: "",
    direccion: "",
    fecha_ingreso: "",
    cargo: "",
    estado: "activo",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [documentoExists, setDocumentoExists] = useState(false);
  const [emailExists, setEmailExists] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || "",
        apellido: initialData.apellido || "",
        tipoDocumento: initialData.tipo_documento || initialData.tipoDocumento || "CC",
        numero_documento: initialData.numero_documento || "",
        telefono: initialData.telefono || "",
        correo: initialData.correo || "",
        direccion: initialData.direccion || "",
        fecha_ingreso: initialData.fecha_ingreso || "",
        cargo: initialData.cargo || "",
        estado: initialData.estado ?? "activo",
      });
    }
  }, [initialData]);

  // Verificar duplicados
  const verificarDocumentoDuplicado = useCallback(async (numero_documento) => {
    const trimmed = numero_documento?.trim();
    if (trimmed && trimmed.length >= 6) {
      try {
        const exists = await checkDocumentoExists(trimmed, initialData?.id);
        setDocumentoExists(exists);
        return exists;
      } catch (error) {
        console.error("Error verificando documento:", error);
        return false;
      }
    } else {
      setDocumentoExists(false);
      return false;
    }
  }, [initialData]);

  const verificarEmailDuplicado = useCallback(async (correo) => {
    const trimmed = correo?.trim();
    if (trimmed && trimmed.includes('@')) {
      try {
        const exists = await checkEmailExists(trimmed, initialData?.id);
        setEmailExists(exists);
        return exists;
      } catch (error) {
        console.error("Error verificando email:", error);
        return false;
      }
    } else {
      setEmailExists(false);
      return false;
    }
  }, [initialData]);

  // Handle change
  const handleChange = useCallback(async (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (name === "numero_documento") {
      await verificarDocumentoDuplicado(value);
    }
    if (name === "correo") {
      await verificarEmailDuplicado(value);
    }
  }, [errors, verificarDocumentoDuplicado, verificarEmailDuplicado]);

  // Validaciones
  const validate = useCallback(() => {
    const newErrors = {};

    const nombreValidation = validateNombre(formData.nombre);
    if (!nombreValidation.isValid) newErrors.nombre = nombreValidation.message;

    const apellidoValidation = validateApellido(formData.apellido);
    if (!apellidoValidation.isValid) newErrors.apellido = apellidoValidation.message;

    if (!formData.tipoDocumento) newErrors.tipoDocumento = "Seleccione un tipo de documento";

    const docValidation = validateDocumento(formData.tipoDocumento, formData.numero_documento);
    if (!docValidation.isValid) {
      newErrors.numero_documento = docValidation.message;
    } else if (documentoExists && formData.numero_documento?.trim()) {
      newErrors.numero_documento = "Este número de documento ya está registrado";
    }

    const telefonoValidation = validateTelefono(formData.telefono);
    if (!telefonoValidation.isValid) newErrors.telefono = telefonoValidation.message;

    const emailValidation = validateEmail(formData.correo);
    if (!emailValidation.isValid) {
      newErrors.correo = emailValidation.message;
    } else if (emailExists && formData.correo?.trim()) {
      newErrors.correo = "Este correo electrónico ya está registrado";
    }

    if (!formData.cargo) newErrors.cargo = "Seleccione un cargo";

    const fechaValidation = validateFechaIngreso(formData.fecha_ingreso);
    if (!fechaValidation.isValid) newErrors.fecha_ingreso = fechaValidation.message;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, documentoExists, emailExists]);

  // Submit
  const handleSubmit = useCallback(async () => {
    if (!validate()) return null;

    setSubmitting(true);
    try {
      let result;
      if (mode === "create") {
        result = await createEmpleado(formData);
      } else {
        if (!initialData?.id) throw new Error("ID de empleado no disponible");
        result = await updateEmpleado(initialData.id, formData);
      }

      onSubmitSuccess?.(result);
      return { success: true, data: result };
    } catch (error) {
      console.error("Error al guardar empleado:", error);
      const errorMessage = error.message || "Error al guardar el empleado";
      onError?.(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSubmitting(false);
    }
  }, [formData, mode, initialData, validate, onSubmitSuccess, onError]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      nombre: "",
      apellido: "",
      tipoDocumento: "CC",
      numero_documento: "",
      telefono: "",
      correo: "",
      direccion: "",
      fecha_ingreso: "",
      cargo: "",
      estado: "activo",
    });
    setErrors({});
    setDocumentoExists(false);
    setEmailExists(false);
  }, []);

  return {
    formData,
    errors,
    submitting,
    documentoExists,
    emailExists,
    handleChange,
    handleSubmit,
    resetForm,
    setFormData,
  };
}
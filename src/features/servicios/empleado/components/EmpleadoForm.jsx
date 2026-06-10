import { useState, useEffect } from "react";
import { Box, FormHelperText } from "@mui/material";
import BaseFormLayout from "@shared/components/base/BaseFormLayout";
import BaseFormSection from "@shared/components/base/BaseFormSection";
import BaseFormField from "@shared/components/base/BaseFormField";
import BaseFormActions from "@shared/components/base/BaseFormActions";
import BaseInputField from "@shared/components/base/BaseInputField";
import CrudNotification from "@shared/styles/components/notifications/CrudNotification";
import {
  tipoDocumentoOptions,
  cargoOptions,
  estadoOptions,
} from "../utils/empleadosUtils";

export default function EmpleadoForm({
  mode = "create",
  title,
  onSubmit,
  onCancel,
  onEdit,
  formData,
  errors,
  submitting,
  handleChange,
  handleSubmit,
  documentoExists,
  emailExists,
}) {
  const isView = mode === "view";
  const isDisabled = isView || submitting;

  const [errorNotification, setErrorNotification] = useState({ visible: false, message: "" });

  useEffect(() => {
    if (errors.submit) {
      setErrorNotification({ visible: true, message: errors.submit });
    } else {
      setErrorNotification({ visible: false, message: "" });
    }
  }, [errors.submit]);

  const closeErrorNotification = () => setErrorNotification({ visible: false, message: "" });

  return (
    <BaseFormLayout title={title}>
      <BaseFormSection title="Información del Empleado">
        <Box sx={{ minHeight: 70, mb: 2 }}>
          <CrudNotification
            message={errorNotification.message}
            type="error"
            isVisible={errorNotification.visible}
            onClose={closeErrorNotification}
          />
        </Box>

        {/* Nombre */}
        <BaseFormField>
          <BaseInputField
            label="Nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            disabled={isDisabled}
            required
            error={!!errors.nombre}
            helperText={errors.nombre}
            fullWidth
          />
        </BaseFormField>

        {/* Apellido */}
        <BaseFormField>
          <BaseInputField
            label="Apellido"
            name="apellido"
            value={formData.apellido}
            onChange={handleChange}
            disabled={isDisabled}
            required
            error={!!errors.apellido}
            helperText={errors.apellido}
            fullWidth
          />
        </BaseFormField>

        {/* Cargo */}
        <BaseFormField>
          <BaseInputField
            label="Cargo"
            name="cargo"
            value={formData.cargo}
            onChange={handleChange}
            select
            options={cargoOptions}
            disabled={isDisabled}
            required
            error={!!errors.cargo}
            helperText={errors.cargo}
            fullWidth
          />
        </BaseFormField>

        {/* Tipo de Documento */}
        <BaseFormField>
          <BaseInputField
            label="Tipo de Documento"
            name="tipoDocumento"
            value={formData.tipoDocumento}
            onChange={handleChange}
            select
            options={tipoDocumentoOptions}
            disabled={isDisabled}
            required
            error={!!errors.tipoDocumento}
            helperText={errors.tipoDocumento}
            fullWidth
          />
        </BaseFormField>

        {/* Número de Documento */}
        <BaseFormField>
          <BaseInputField
            label="Número de Documento"
            name="numero_documento"
            value={formData.numero_documento}
            onChange={(e) => {
              const soloNumeros = e.target.value.replace(/\D/g, "");
              handleChange({ target: { name: "numero_documento", value: soloNumeros } });
            }}
            disabled={isDisabled}
            required
            error={!!errors.numero_documento || documentoExists}
            helperText={errors.numero_documento || (documentoExists && "Este documento ya está registrado")}
            fullWidth
          />
        </BaseFormField>

        {/* Teléfono */}
        <BaseFormField>
          <BaseInputField
            label="Teléfono"
            name="telefono"
            value={formData.telefono}
            onChange={(e) => {
              const soloNumeros = e.target.value.replace(/\D/g, "");
              handleChange({ target: { name: "telefono", value: soloNumeros } });
            }}
            disabled={isDisabled}
            required
            error={!!errors.telefono}
            helperText={errors.telefono}
            fullWidth
          />
        </BaseFormField>

        {/* Correo Electrónico */}
        <BaseFormField>
          <BaseInputField
            label="Correo Electrónico"
            name="correo"
            type="email"
            value={formData.correo}
            onChange={handleChange}
            disabled={isDisabled}
            error={!!errors.correo || emailExists}
            helperText={errors.correo || (emailExists && "Este correo ya está registrado")}
            fullWidth
          />
        </BaseFormField>

        {/* Fecha de Ingreso */}
        <BaseFormField>
          <BaseInputField
            label="Fecha de Ingreso"
            name="fecha_ingreso"
            type="date"
            value={formData.fecha_ingreso}
            onChange={handleChange}
            disabled={isDisabled}
            required
            error={!!errors.fecha_ingreso}
            helperText={errors.fecha_ingreso}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </BaseFormField>

        {/* Dirección */}
        <BaseFormField>
          <BaseInputField
            label="Dirección"
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            disabled={isDisabled}
            multiline
            rows={1}
            error={!!errors.direccion}
            helperText={errors.direccion}
            fullWidth
          />
        </BaseFormField>

        {/* Estado (solo visible en edición o vista) */}
        {mode !== "create" && (
          <BaseFormField>
            <BaseInputField
              label="Estado"
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              select
              options={estadoOptions}
              disabled={isDisabled}
              required
              fullWidth
            />
          </BaseFormField>
        )}
      </BaseFormSection>

      <BaseFormActions
        onCancel={onCancel}
        onSave={async () => {
          const result = await handleSubmit();
          if (result?.success && onSubmit) onSubmit(result.data);
        }}
        onEdit={onEdit}
        showSave={mode !== "view"}
        showEdit={mode === "view"}
        saveDisabled={submitting}
        saveLabel={submitting ? "Guardando..." : "Guardar"}
      />
    </BaseFormLayout>
  );
}
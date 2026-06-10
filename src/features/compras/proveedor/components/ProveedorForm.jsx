import BaseFormLayout from "@shared/components/base/BaseFormLayout";
import BaseFormSection from "@shared/components/base/BaseFormSection";
import BaseFormField from "@shared/components/base/BaseFormField";
import BaseFormActions from "@shared/components/base/BaseFormActions";
import BaseInputField from "@shared/components/base/BaseInputField";
import {
  tipoProveedorOptions,
  tipoDocumentoOptions,
  estadoOptions,
} from "../utils/proveedoresUtils";
import { useProveedorForm } from "../hooks/useProveedorForm";

export default function ProveedorForm({
  mode = "create",
  title,
  initialData = null,
  onSubmit,
  onCancel,
  onEdit,
}) {
  const isView = mode === "view";

  const {
    formData,
    errors,
    submitting,
    handleChange,
    handleDocumentChange,
    handlePhoneChange,
    handleSubmit,
  } = useProveedorForm({
    mode,
    initialData,
    onSubmitSuccess: onSubmit,
    onError: (error) => console.error(error),
  });

  const onSubmitForm = async () => {
    const result = await handleSubmit();
    if (result?.success && onSubmit) {
      onSubmit(result.data);
    }
  };

  const isDisabled = isView || submitting;

  return (
    <BaseFormLayout title={title}>
      <BaseFormSection title="Información del Proveedor">

        <BaseFormField>
          <BaseInputField
            label="Tipo de Proveedor"
            name="tipoProveedor"
            value={formData.tipoProveedor}
            onChange={handleChange}
            select
            options={tipoProveedorOptions}
            disabled={isDisabled}
          />
        </BaseFormField>

        <BaseFormField>
          <BaseInputField
            label={formData.tipoProveedor === "Persona Jurídica" ? "Razón Social" : "Nombre Completo"}
            name="razonSocial"
            value={formData.razonSocial}
            onChange={handleChange}
            disabled={isDisabled}
            required
            error={!!errors.razonSocial}
            helperText={errors.razonSocial}
          />
        </BaseFormField>

        <BaseFormField>
          <BaseInputField
            label="Tipo de Documento"
            name="tipoDocumento"
            value={formData.tipoDocumento}
            onChange={handleChange}
            select
            options={tipoDocumentoOptions}
            disabled={isDisabled}
          />
        </BaseFormField>

        <BaseFormField>
          <BaseInputField
            label="Número de Documento"
            name="documento"
            value={formData.documento}
            onChange={handleDocumentChange}
            disabled={isDisabled}
            required
            error={!!errors.documento}
            helperText={errors.documento}
          />
        </BaseFormField>

        <BaseFormField>
          <BaseInputField
            label="Persona de Contacto"
            name="contactoNombre"
            value={formData.contactoNombre}
            onChange={handleChange}
            disabled={isDisabled}
            required
            error={!!errors.contactoNombre}
            helperText={errors.contactoNombre}
          />
        </BaseFormField>

        <BaseFormField>
          <BaseInputField
            label="Teléfono"
            name="telefono"
            value={formData.telefono}
            onChange={handlePhoneChange}
            disabled={isDisabled}
            required
            error={!!errors.telefono}
            helperText={errors.telefono}
          />
        </BaseFormField>

        <BaseFormField>
          <BaseInputField
            label="Correo Electrónico"
            name="correo"
            value={formData.correo}
            onChange={handleChange}
            disabled={isDisabled}
            required
            error={!!errors.correo}
            helperText={errors.correo}
          />
        </BaseFormField>

        <BaseFormField>
          <BaseInputField
            label="Departamento"
            name="departamento"
            value={formData.departamento}
            onChange={handleChange}
            disabled={isDisabled}
            required
            error={!!errors.departamento}
            helperText={errors.departamento}
          />
        </BaseFormField>

        <BaseFormField>
          <BaseInputField
            label="Municipio"
            name="municipio"
            value={formData.municipio}
            onChange={handleChange}
            disabled={isDisabled}
            required
            error={!!errors.municipio}
            helperText={errors.municipio}
          />
        </BaseFormField>

        <BaseFormField>
          <BaseInputField
            label="Dirección"
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            disabled={isDisabled}
            required
            error={!!errors.direccion}
            helperText={errors.direccion}
          />
        </BaseFormField>

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
            />
          </BaseFormField>
        )}

      </BaseFormSection>

      <BaseFormActions
        onCancel={onCancel}
        onSave={onSubmitForm}
        onEdit={onEdit}
        showSave={mode !== "view"}
        showEdit={mode === "view"}
        saveLabel={submitting ? "Guardando..." : "Guardar"}
        saveDisabled={submitting}
      />
    </BaseFormLayout>
  );
}
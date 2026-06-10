import { useState, useEffect } from "react";
import BaseFormLayout from "../../../../shared/components/base/BaseFormLayout";
import BaseFormSection from "../../../../shared/components/base/BaseFormSection";
import BaseFormField from "../../../../shared/components/base/BaseFormField";
import BaseFormActions from "../../../../shared/components/base/BaseFormActions";
import BaseInputField from "../../../../shared/components/base/BaseInputField";
import {
  tipoProveedorOptions,
  tipoDocumentoOptions,
  estadoOptions,
  fetchDepartamentos,
  fetchMunicipios,
} from "../utils/proveedoresUtils";
import { useProveedorForm } from "../hooks/useProveedorForm";

export default function ProveedorForm({
  mode = "create",
  title,
  initialData = null,
  onSubmit,
  onCancel,
  onError,
  extraActions = null,
}) {
  const [departamentos,     setDepartamentos]     = useState([]);
  const [municipios,        setMunicipios]        = useState([]);
  const [loadingDepto,      setLoadingDepto]      = useState(false);
  const [loadingMunicipio,  setLoadingMunicipio]  = useState(false);

  const {
    formData,
    errors,
    submitting,
    isView,
    isCreate,
    handleChange,
    handleDocumentChange,
    handlePhoneChange,
    handleSubmit,
  } = useProveedorForm({
    mode,
    initialData,
    onSubmitSuccess: onSubmit,
    onError: onError ?? ((error) => console.error(error)),
  });

  const onSubmitForm = async () => {
    const result = await handleSubmit();
    if (result?.success && onSubmit) {
      onSubmit(result.data);
    }
  };

  const isDisabled = isView || submitting;

  // ============================
  // Cargar departamentos al montar
  // ============================
  useEffect(() => {
    setLoadingDepto(true);
    fetchDepartamentos()
      .then(setDepartamentos)
      .catch(() => setDepartamentos([]))
      .finally(() => setLoadingDepto(false));
  }, []);

  // ============================
  // Cargar municipios cuando cambia departamento
  // ============================
  useEffect(() => {
    if (!formData.departamento) {
      setMunicipios([]);
      return;
    }
    // Buscar el id del departamento seleccionado
    const depto = departamentos.find((d) => d.value === formData.departamento);
    if (!depto) return;

    setLoadingMunicipio(true);
    fetchMunicipios(depto.id)
      .then(setMunicipios)
      .catch(() => setMunicipios([]))
      .finally(() => setLoadingMunicipio(false));
  }, [formData.departamento, departamentos]);

  return (
    <BaseFormLayout title={title}>
      <BaseFormSection title="Información del Proveedor">

        {/* Tipo de Proveedor */}
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

        {/* Razón Social / Nombre */}
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
          />
        </BaseFormField>

        {/* Número de Documento */}
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

        {/* Persona de Contacto */}
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

        {/* Teléfono */}
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

        {/* Correo Electrónico */}
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

        {/* Departamento */}
        <BaseFormField>
          <BaseInputField
            label={loadingDepto ? "Cargando departamentos..." : "Departamento"}
            name="departamento"
            value={formData.departamento}
            onChange={handleChange}
            select
            options={departamentos}
            disabled={isDisabled || loadingDepto}
            required
            error={!!errors.departamento}
            helperText={errors.departamento}
          />
        </BaseFormField>

        {/* Municipio — encadenado al departamento */}
        <BaseFormField>
          <BaseInputField
            label={loadingMunicipio ? "Cargando municipios..." : "Municipio"}
            name="municipio"
            value={formData.municipio}
            onChange={handleChange}
            select
            options={municipios}
            disabled={isDisabled || loadingMunicipio || (!isView && !formData.departamento)}
            required
            error={!!errors.municipio}
            helperText={
              errors.municipio ||
              (!formData.departamento && !isView ? "Seleccione primero un departamento" : "")
            }
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
            required
            error={!!errors.direccion}
            helperText={errors.direccion}
          />
        </BaseFormField>

        {/* Estado — solo en editar y ver detalle, nunca en crear */}
        {!isCreate && (
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

      {/* Botones vista */}
      {isView && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24 }}>
          {extraActions}
          <button className="crud-btn crud-btn-secondary" onClick={onCancel}>
            Volver
          </button>
        </div>
      )}

      {/* Botones crear/editar */}
      {!isView && (
        <BaseFormActions
          onCancel={onCancel}
          onSave={onSubmitForm}
          showSave
          saveLabel={submitting ? "Guardando..." : isCreate ? "Crear Proveedor" : "Guardar Cambios"}
          saveDisabled={submitting}
        />
      )}
    </BaseFormLayout>
  );
}
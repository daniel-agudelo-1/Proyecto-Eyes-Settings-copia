import { FormHelperText, MenuItem, TextField, Box, Button } from "@mui/material";
import { TextFieldAlphanumeric } from "@shared/index";
import { useMarcaForm } from "../hooks/useMarcaForm";

export default function MarcaForm({
  mode = "create",
  initialData,
  onSubmit,
  onCancel,
  onEdit,               // función para abrir edición
  id,
  buttonRef
}) {
  const {
    formData,
    errors,
    nombreExists,
    isView,
    submitting,
    handleChange,
    handleSubmit,
    handleCancel
  } = useMarcaForm({ mode, initialData, onSubmit, onCancel });

  return (
    <form id={id} onSubmit={handleSubmit}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <TextFieldAlphanumeric
            label="Nombre de la Marca"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            disabled={isView || submitting}
            placeholder="Ej: Ray-Ban, Oakley, etc."
            inputProps={{ maxLength: 50 }}
            fullWidth
            required
            error={!!errors.nombre || nombreExists}
            helperText={errors.nombre}
          />
          {errors.nombre && (
            <FormHelperText error sx={{ mt: 1 }}>
              {errors.nombre}
            </FormHelperText>
          )}
          {nombreExists && !errors.nombre && (
            <FormHelperText error sx={{ mt: 1 }}>
              Ya existe una marca con este nombre
            </FormHelperText>
          )}
        </Box>

        {mode !== "create" && (
          <Box>
            <TextField
              select
              fullWidth
              label="Estado"
              name="estado"
              value={formData.estado ? "true" : "false"}
              onChange={handleChange}
              disabled={isView || submitting}
              size="medium"
              variant="outlined"
            >
              <MenuItem value="true">Activa</MenuItem>
              <MenuItem value="false">Inactiva</MenuItem>
            </TextField>
          </Box>
        )}

        {/* Botón Editar en modo vista, alineado a la derecha con el mismo estilo que el modal */}
        {isView && onEdit && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button
              variant="contained"
              onClick={onEdit}
              sx={{
                backgroundColor: "#1a2540",
                color: "#fff",
                "&:hover": { backgroundColor: "#2d3a6b" },
                textTransform: "none",
                fontWeight: 500,
                px: 2,
                py: 0.75
              }}
            >
              Editar
            </Button>
          </Box>
        )}
      </Box>
      
      <button 
        type="submit" 
        ref={buttonRef} 
        style={{ display: 'none' }}
        disabled={submitting}
      />
    </form>
  );
}
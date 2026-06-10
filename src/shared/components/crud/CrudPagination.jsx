import { Box, Pagination } from "@mui/material";

/**
 * Componente de paginación global reutilizable.
 *
 * Props:
 *  - totalPages  {number}   Total de páginas (requerido)
 *  - page        {number}   Página actual (requerido)
 *  - onChange    {function} Callback (nuevoNumero) => void (requerido)
 *  - show        {boolean}  Si es false, no renderiza nada (default: auto, oculta si totalPages <= 1)
 */
export default function CrudPagination({ totalPages = 1, page = 1, onChange, show }) {
  const visible = show !== undefined ? show : totalPages > 1;
  if (!visible) return null;

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 3, mb: 2 }}>
      <Pagination
        count={totalPages}
        page={page}
        onChange={(_, value) => onChange(value)}
        shape="rounded"
        sx={{
          "& .MuiPaginationItem-root": {
            color: "#4b5563",
            border: "none",
            backgroundColor: "transparent",
            "&:hover": {
              backgroundColor: "#f3f4f6",
            },
          },
          "& .Mui-selected": {
            backgroundColor: "#e5e7eb !important",
            color: "#111827",
            fontWeight: 500,
            "&:hover": {
              backgroundColor: "#d1d5db",
            },
          },
        }}
      />
    </Box>
  );
}
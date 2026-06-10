import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ventasService } from "../services/ventasService";
import { formatCurrency, COLORES_ESTADO_VENTA, getEstadoLabelVenta } from "../utils/ventasUtils";

export function useVentas() {
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [page, setPage] = useState(1);
  const [estadoMap, setEstadoMap] = useState({});

  useEffect(() => {
    ventasService.getEstados().then((estados) => {
      const map = {};
      estados.forEach((e) => {
        map[e.nombre] = e.id;
      });
      setEstadoMap(map);
    });
  }, []);

  const estadoId = filterEstado
    ? filterEstado === "anulada"
      ? estadoMap["cancelada"]
      : estadoMap[filterEstado]
    : null;

  const {
    data: queryData,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ["ventas", page, search, filterEstado, estadoId],
    queryFn: () =>
      ventasService.getVentas({
        page,
        per_page: 10,
        search: search || undefined,
        estado_id: estadoId || undefined,
      }),
    keepPreviousData: true,
  });

  const ventas = queryData?.data ?? [];
  const pagination = queryData?.pagination ?? {
    current_page: 1,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  };

  useEffect(() => {
    setPage(1);
  }, [search, filterEstado]);

  const estadoFilters = [
    { value: "", label: "Todos los estados" },
    { value: "completada", label: "Completada" },
    { value: "anulada", label: "Anulada" },
  ];

  return {
    ventas,
    loading,
    search,
    setSearch,
    filterEstado,
    setFilterEstado,
    estadoFilters,
    page,
    setPage,
    pagination,
    formatCurrency,
    COLORES_ESTADO_VENTA,
    getEstadoLabelVenta,
    refetch,
  };
}
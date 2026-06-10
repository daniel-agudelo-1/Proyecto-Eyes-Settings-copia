// =============================================================
// ProductsGrid.jsx — 3 columnas, paginación, fondo imagen blanco
// =============================================================

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import ProductCard from "./ProductCard";
import LoadingSpinner from "../Shared/LoadingSpinner";
import { getAllProductosLanding } from "../Services/productosLandingData";

const POR_PAGINA = 9;
const MAX_NUMS   = 5;

function getNumeros(total, actual) {
  if (total <= MAX_NUMS) return Array.from({ length: total }, (_, i) => i + 1);
  const half = Math.floor(MAX_NUMS / 2);
  let ini = Math.max(1, actual - half);
  let fin = ini + MAX_NUMS - 1;
  if (fin > total) { fin = total; ini = Math.max(1, fin - MAX_NUMS + 1); }
  return Array.from({ length: fin - ini + 1 }, (_, i) => ini + i);
}

const ProductsGrid = () => {
  const [search,    setSearch]    = useState("");
  const [categoria, setCategoria] = useState("Todos");
  const [pagina,    setPagina]    = useState(1);

  const { data: productos = [], isLoading, error } = useQuery({
    queryKey: ["productos-landing"],
    queryFn:  getAllProductosLanding,
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });

  const categorias = useMemo(() => {
    const cats = [...new Set(productos.map(p => p.categoria).filter(Boolean))];
    return ["Todos", ...cats];
  }, [productos]);

  const filtrados = useMemo(() => {
    const t = search.toLowerCase();
    return productos.filter(p =>
      (!search
        || p.nombre.toLowerCase().includes(t)
        || (p.marca     || "").toLowerCase().includes(t)
        || (p.categoria || "").toLowerCase().includes(t))
      && (categoria === "Todos" || p.categoria === categoria)
    );
  }, [productos, search, categoria]);

  const cambiarSearch = (v) => { setSearch(v);    setPagina(1); };
  const cambiarCat    = (c) => { setCategoria(c); setPagina(1); };

  const totalPags = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const pag       = Math.min(pagina, totalPags);
  const slice     = filtrados.slice((pag - 1) * POR_PAGINA, pag * POR_PAGINA);
  const numeros   = getNumeros(totalPags, pag);

  const irA = (p) => {
    setPagina(Math.max(1, Math.min(p, totalPags)));
    const el = document.getElementById("productos");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="pg-section" id="productos">

      <style>{`
        /* 3 columnas */
        .pg-grid--3col {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr) !important;
          gap: 1rem !important;
        }
        @media (max-width: 860px) { .pg-grid--3col { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 520px) { .pg-grid--3col { grid-template-columns: 1fr !important; } }

        /* Imagen: altura reducida, fondo BLANCO, foto completa */
        .pg-grid--3col .pc-image-wrap {
          height: 145px !important;
          background: #ffffff !important;
        }
        .pg-grid--3col .pc-image {
          object-fit: contain !important;
          padding: 8px !important;
          box-sizing: border-box !important;
        }

        /* Cuerpo ligeramente más compacto */
        .pg-grid--3col .pc-body   { padding: .5rem .65rem .6rem !important; }
        .pg-grid--3col .pc-meta   { font-size: .6rem !important; }
        .pg-grid--3col .pc-name   { font-size: .76rem !important; }
        .pg-grid--3col .pc-price  { font-size: .82rem !important; }
        .pg-grid--3col .pc-stock  { font-size: .58rem !important; }

        /* ── Paginación ── */
        .pg-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 2.25rem;
          gap: .5rem;
        }
        .pg-pag-nums {
          display: flex;
          align-items: center;
          gap: .3rem;
          flex-wrap: wrap;
          justify-content: center;
          flex: 1;
        }

        /* Botón verde siempre visible */
        .pg-pb {
          min-width: 36px;
          height: 36px;
          padding: 0 .75rem;
          border-radius: .45rem;
          border: 1.5px solid #3d8080;
          background: transparent;
          color: #6aaeae;
          font-size: .78rem;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: .3rem;
          user-select: none;
          white-space: nowrap;
          flex-shrink: 0;
          transition: background .15s, color .15s;
        }
        .pg-pb:hover:not(:disabled):not(.pg-pb--on) {
          background: rgba(61,128,128,.2);
          color: #fff;
        }

        /* Número activo — verde sólido */
        .pg-pb--on {
          background: #3d8080 !important;
          border-color: #3d8080 !important;
          color: #fff !important;
          cursor: default;
        }

        /* Anterior / Siguiente */
        .pg-pb--nav { min-width: unset; padding: 0 .9rem; }
        .pg-pb--nav:disabled { opacity: .3; cursor: not-allowed; }

        /* Puntos suspensivos */
        .pg-pag-dots {
          color: #6aaeae;
          font-size: .85rem;
          user-select: none;
          padding: 0 .1rem;
        }
      `}</style>

      <div className="pg-container">

        <div className="pg-header">
          <h2 className="pg-title">
            Nuestra <span className="pg-title-accent">Colección</span>
          </h2>
          <p className="pg-subtitle">
            Descubre cada producto en detalle — haz click para explorar
          </p>
        </div>

        {!isLoading && !error && productos.length > 0 && (
          <div className="pg-controls">
            <div className="pg-search-wrap">
              <svg className="pg-search-icon" viewBox="0 0 20 20" fill="none">
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M14 14l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                className="pg-search"
                placeholder="Buscar por nombre, marca o categoría…"
                value={search}
                onChange={e => cambiarSearch(e.target.value)}
              />
              {search && (
                <button className="pg-search-clear" onClick={() => cambiarSearch("")} aria-label="Limpiar">×</button>
              )}
            </div>
            <div className="pg-cats">
              {categorias.map(cat => (
                <button
                  key={cat}
                  className={`pg-cat-btn${categoria === cat ? " pg-cat-btn--active" : ""}`}
                  onClick={() => cambiarCat(cat)}
                >{cat}</button>
              ))}
            </div>
          </div>
        )}

        {!isLoading && !error && filtrados.length > 0 && (
          <p className="pg-results-count">
            {filtrados.length} {filtrados.length === 1 ? "producto" : "productos"}
            {(search || categoria !== "Todos") ? " encontrados" : " en total"}
          </p>
        )}

        {isLoading && <LoadingSpinner mensaje="Cargando productos..." />}

        {error && !isLoading && (
          <div className="pg-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>No pudimos cargar los productos. Por favor intenta más tarde.</p>
          </div>
        )}

        {!isLoading && !error && filtrados.length === 0 && (
          <div className="pg-empty">
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="8" y="16" width="32" height="24" rx="3"/>
              <path d="M16 16v-4a8 8 0 0116 0v4"/>
              <line x1="20" y1="28" x2="28" y2="28"/>
            </svg>
            <p>No se encontraron productos{search ? ` para "${search}"` : ""}.</p>
            {(search || categoria !== "Todos") && (
              <button className="pg-reset-btn" onClick={() => { cambiarSearch(""); cambiarCat("Todos"); }}>
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {!isLoading && !error && slice.length > 0 && (
          <div className="pg-grid pg-grid--3col">
            {slice.map(p => <ProductCard key={p.id} producto={p} />)}
          </div>
        )}

        {/* Paginación siempre visible cuando hay productos */}
        {!isLoading && !error && filtrados.length > 0 && (
          <nav className="pg-pagination" aria-label="Paginación">

            {/* Anterior — extremo izquierdo */}
            <button
              className="pg-pb pg-pb--nav"
              onClick={() => irA(pag - 1)}
              disabled={pag === 1}
            >
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" width="11" height="11">
                <polyline points="8 2 4 6 8 10"/>
              </svg>
              Anterior
            </button>

            {/* Números — centro */}
            <div className="pg-pag-nums">
              {numeros[0] > 1 && (
                <>
                  <button className="pg-pb" onClick={() => irA(1)}>1</button>
                  {numeros[0] > 2 && <span className="pg-pag-dots">…</span>}
                </>
              )}
              {numeros.map(n => (
                <button
                  key={n}
                  className={`pg-pb${n === pag ? " pg-pb--on" : ""}`}
                  onClick={() => irA(n)}
                  aria-current={n === pag ? "page" : undefined}
                >{n}</button>
              ))}
              {numeros[numeros.length - 1] < totalPags && (
                <>
                  {numeros[numeros.length - 1] < totalPags - 1 && (
                    <span className="pg-pag-dots">…</span>
                  )}
                  <button className="pg-pb" onClick={() => irA(totalPags)}>{totalPags}</button>
                </>
              )}
            </div>

            {/* Siguiente — extremo derecho */}
            <button
              className="pg-pb pg-pb--nav"
              onClick={() => irA(pag + 1)}
              disabled={pag === totalPags}
            >
              Siguiente
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" width="11" height="11">
                <polyline points="4 2 8 6 4 10"/>
              </svg>
            </button>

          </nav>
        )}

      </div>
    </section>
  );
};

export default ProductsGrid;
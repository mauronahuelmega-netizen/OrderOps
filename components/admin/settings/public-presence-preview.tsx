"use client";

import { useId, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import { normalizeHexColor } from "@/components/admin/settings/brand-palette";
import styles from "./public-presence-preview.module.css";

export type PublicPresencePreviewMode = "landing" | "catalog";

export type PublicPresencePreviewProps = {
  defaultMode?: PublicPresencePreviewMode;
  businessName: string;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  primaryColor?: string | null;
  landing?: {
    description?: string | null;
    instagramUrl?: string | null;
    publicUrl?: string | null;
  };
  catalog?: {
    headline?: string | null;
    badge?: string | null;
    microcopy?: string | null;
    publicUrl?: string | null;
  };
  catalogNeutralMessage?: string | null;
};

const DEFAULT_LANDING_DESCRIPTION = "Hacé tu pedido online y confirmalo por WhatsApp.";
const DEFAULT_CATALOG_HEADLINE = "Listo para pedir.";
const DEFAULT_CATALOG_BADGE = "Te confirmamos por WhatsApp";
const DEFAULT_CATALOG_MICROCOPY = "Hacé tu pedido y seguimos por WhatsApp.";

const EXAMPLE_PRODUCTS = [
  { name: "Producto ejemplo A", price: "$1.200" },
  { name: "Producto ejemplo B", price: "$980" }
];

export default function PublicPresencePreview({
  defaultMode = "landing",
  businessName,
  logoUrl,
  coverImageUrl,
  primaryColor,
  landing,
  catalog,
  catalogNeutralMessage
}: PublicPresencePreviewProps) {
  const headingId = useId();
  const landingTabId = useId();
  const catalogTabId = useId();
  const landingPanelId = useId();
  const catalogPanelId = useId();
  const [mode, setMode] = useState<PublicPresencePreviewMode>(defaultMode);

  const previewBusinessName = businessName.trim() || "Tu negocio";
  const previewInitial = previewBusinessName.charAt(0).toUpperCase();
  const previewBrandColor =
    normalizeHexColor(primaryColor ?? "") ?? "var(--accent-primary)";

  const previewDescription =
    landing?.description?.trim() || DEFAULT_LANDING_DESCRIPTION;
  const previewInstagram = landing?.instagramUrl?.trim() ?? "";

  const hasCatalogCopy =
    Boolean(catalog?.headline?.trim()) ||
    Boolean(catalog?.badge?.trim()) ||
    Boolean(catalog?.microcopy?.trim());

  const previewHeadline = catalog?.headline?.trim() || DEFAULT_CATALOG_HEADLINE;
  const previewBadge = catalog?.badge?.trim() || DEFAULT_CATALOG_BADGE;
  const previewMicrocopy = catalog?.microcopy?.trim() || DEFAULT_CATALOG_MICROCOPY;

  const activePublicUrl =
    mode === "landing" ? landing?.publicUrl : catalog?.publicUrl;
  const activePublicLabel =
    mode === "landing" ? "Ver landing pública" : "Ver catálogo público";

  function handleLandingTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setMode("catalog");
      document.getElementById(catalogTabId)?.focus();
    }
  }

  function handleCatalogTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setMode("landing");
      document.getElementById(landingTabId)?.focus();
    }
  }

  return (
    <section className={styles.panel} aria-labelledby={headingId}>
      <header className={styles.header}>
        <h3 id={headingId} className={styles.title}>
          Vista previa aproximada
        </h3>
        <p className={styles.helper}>
          La versión pública puede variar según dispositivo, productos disponibles y estado del
          negocio.
        </p>
      </header>

      <div className={styles.tabs} role="tablist" aria-label="Canal de vista previa">
        <button
          type="button"
          id={landingTabId}
          role="tab"
          className={`${styles.tab} ${mode === "landing" ? styles.tabActive : ""}`}
          aria-selected={mode === "landing"}
          aria-controls={landingPanelId}
          tabIndex={mode === "landing" ? 0 : -1}
          onClick={() => setMode("landing")}
          onKeyDown={handleLandingTabKeyDown}
        >
          Landing
        </button>
        <button
          type="button"
          id={catalogTabId}
          role="tab"
          className={`${styles.tab} ${mode === "catalog" ? styles.tabActive : ""}`}
          aria-selected={mode === "catalog"}
          aria-controls={catalogPanelId}
          tabIndex={mode === "catalog" ? 0 : -1}
          onClick={() => setMode("catalog")}
          onKeyDown={handleCatalogTabKeyDown}
        >
          Catálogo
        </button>
      </div>

      <div
        id={landingPanelId}
        role="tabpanel"
        aria-labelledby={landingTabId}
        hidden={mode !== "landing"}
        className={styles.tabPanel}
      >
        <div
          className="admin-settings-preview admin-settings-preview--landing"
          style={{ "--preview-brand": previewBrandColor } as CSSProperties}
        >
          <p className="admin-settings-preview__mock-label">Encabezado público</p>

          <div className="admin-settings-preview__hero">
            <div className="admin-settings-preview__brand">
              {logoUrl ? (
                <img
                  className="admin-settings-preview__logo"
                  src={logoUrl}
                  alt="Vista previa del logo"
                />
              ) : (
                <div className="admin-settings-preview__logo admin-settings-preview__logo--placeholder">
                  {previewInitial}
                </div>
              )}

              <div className="admin-settings-preview__content">
                <p className="admin-settings-preview__kicker">Pedido online</p>
                <strong className="admin-settings-preview__title">{previewBusinessName}</strong>
                <p className="admin-settings-preview__description">{previewDescription}</p>
              </div>

              <p className="admin-settings-preview__actions-caption">Botones de ejemplo</p>

              <div className="admin-settings-preview__actions" aria-hidden="true">
                <span className="admin-settings-preview__cta admin-settings-preview__cta--primary">
                  Ver catálogo
                </span>
                <span className="admin-settings-preview__cta admin-settings-preview__cta--secondary">
                  Consultar por WhatsApp
                </span>
              </div>

              {previewInstagram ? (
                <p className="admin-settings-preview__instagram">Instagram</p>
              ) : null}
            </div>

            <div className="admin-settings-preview__showcase">
              {coverImageUrl ? (
                <img
                  className="admin-settings-preview__cover"
                  src={coverImageUrl}
                  alt="Vista previa de la portada"
                />
              ) : (
                <div className="admin-settings-preview__cover admin-settings-preview__cover--placeholder">
                  Imagen de portada
                </div>
              )}

              <div className="admin-settings-preview__summary" aria-hidden="true">
                <div className="admin-settings-preview__summary-item">
                  <strong>Pedido claro</strong>
                  <p>Elegí productos, completá tus datos y enviá un pedido ordenado.</p>
                </div>
                <div className="admin-settings-preview__summary-item">
                  <strong>Confirmación directa</strong>
                  <p>El último paso sigue siendo una confirmación simple por WhatsApp.</p>
                </div>
              </div>
            </div>
          </div>

          <p className="admin-settings-preview__note">
            Los bloques inferiores son referencia visual. Abrí la landing pública para ver el
            resultado completo.
          </p>
        </div>
      </div>

      <div
        id={catalogPanelId}
        role="tabpanel"
        aria-labelledby={catalogTabId}
        hidden={mode !== "catalog"}
        className={styles.tabPanel}
      >
        {catalogNeutralMessage && !hasCatalogCopy ? (
          <p className={styles.catalogNeutral}>{catalogNeutralMessage}</p>
        ) : null}

        <div
          className={`admin-settings-preview ${styles.catalogPreview}`}
          style={{ "--preview-brand": previewBrandColor } as CSSProperties}
        >
          <header className={styles.catalogHeader}>
            <div className={styles.catalogBrand}>
              {logoUrl ? (
                <img
                  className={styles.catalogLogo}
                  src={logoUrl}
                  alt="Vista previa del logo"
                />
              ) : (
                <div className={`${styles.catalogLogo} ${styles.catalogLogoPlaceholder}`}>
                  {previewInitial}
                </div>
              )}
              <div className={styles.catalogBrandCopy}>
                <span className={styles.catalogBrandKicker}>Pedido online</span>
                <strong>{previewBusinessName}</strong>
              </div>
            </div>
          </header>

          {coverImageUrl ? (
            <img
              className={styles.catalogCover}
              src={coverImageUrl}
              alt="Vista previa de la portada del catálogo"
            />
          ) : (
            <div className={`${styles.catalogCover} ${styles.catalogCoverPlaceholder}`}>
              Imagen de portada
            </div>
          )}

          <div className={styles.catalogHeroCopy}>
            <p className={styles.catalogEyebrow}>Pedí online</p>
            <p className={styles.catalogHeadline}>{previewHeadline}</p>
          </div>

          <div className={styles.catalogNotes}>
            <span className={styles.catalogBadge}>{previewBadge}</span>
            <p className={styles.catalogMicrocopy}>{previewMicrocopy}</p>
          </div>

          <div className={styles.catalogProducts} aria-hidden="true">
            <p className={styles.catalogProductsLabel}>
              Bloques de ejemplo para visualizar el encabezado del catálogo.
            </p>
            <div className={styles.catalogProductGrid}>
              {EXAMPLE_PRODUCTS.map((product) => (
                <div key={product.name} className={styles.catalogProductCard}>
                  <div className={styles.catalogProductMedia}>Ejemplo</div>
                  <div className={styles.catalogProductBody}>
                    <strong>{product.name}</strong>
                    <span>{product.price}</span>
                  </div>
                </div>
              ))}
            </div>
            <span className={styles.catalogProductsCta}>Ver productos</span>
          </div>
        </div>
      </div>

      {activePublicUrl ? (
        <div className={styles.publicLink}>
          <a
            href={activePublicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.publicLinkAnchor}
          >
            {activePublicLabel}
          </a>
          <p className={styles.publicLinkHelper}>
            Abrí la versión real en una nueva pestaña para revisar cómo la ven tus clientes.
          </p>
        </div>
      ) : null}
    </section>
  );
}

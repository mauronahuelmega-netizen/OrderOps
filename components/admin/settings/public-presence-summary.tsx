import Link from "next/link";

import PublicPresenceReadiness from "@/components/admin/settings/public-presence-readiness";
import {
  buildPublicPresenceReadinessSections,
  computePublicPresenceSummaryStats,
  getSectionReadinessCounts,
  type PublicPresenceReadinessInput
} from "@/components/admin/settings/public-presence-readiness-model";
import styles from "./public-presence-summary.module.css";

export type PublicPresenceSummaryProps = PublicPresenceReadinessInput & {
  publicLandingHref?: string | null;
  publicCatalogHref?: string | null;
};

const SECTION_META: Record<
  string,
  { description: string; editHref?: string; editLabel?: string }
> = {
  identity: {
    description: "Logo, portada y color de marca",
    editHref: "/admin/settings/public/landing",
    editLabel: "Editar en Landing"
  },
  landing: {
    description: "Descripción e Instagram",
    editHref: "/admin/settings/public/landing",
    editLabel: "Editar Landing"
  },
  catalog: {
    description: "Encabezado, badge y microcopy",
    editHref: "/admin/settings/public/catalogo",
    editLabel: "Editar catálogo"
  },
  publication: {
    description: "Enlaces públicos de tu negocio"
  }
};

function formatSectionStatus(sectionId: string, readyCount: number, totalCount: number) {
  if (sectionId === "publication") {
    return readyCount === totalCount ? "Lista" : "Pendiente";
  }

  if (readyCount === totalCount) {
    return `${readyCount}/${totalCount} listo`;
  }

  return `${readyCount}/${totalCount} configurado`;
}

export default function PublicPresenceSummary({
  publicLandingHref = null,
  publicCatalogHref = null,
  ...readinessInput
}: PublicPresenceSummaryProps) {
  const sections = buildPublicPresenceReadinessSections(readinessInput);
  const stats = computePublicPresenceSummaryStats(sections);
  const hasPublicUrls = Boolean(publicLandingHref || publicCatalogHref);
  const allRequiredReady = stats.completedRequiredItems === stats.totalRequiredItems;

  const generalStatusPrimary = `${stats.completedRequiredItems} de ${stats.totalRequiredItems} elementos principales listos`;

  const generalStatusSecondary = allRequiredReady
    ? stats.optionalReadyItems > 0
      ? `${stats.optionalReadyItems} opcional${stats.optionalReadyItems === 1 ? "" : "es"} configurado${stats.optionalReadyItems === 1 ? "" : "s"}`
      : null
    : `${stats.pendingRequiredItems} pendiente${stats.pendingRequiredItems === 1 ? "" : "s"}`;

  return (
    <div className={styles.summary}>
      <section className={styles.overview} aria-labelledby="public-presence-overview-heading">
        <header className={styles.overviewHeader}>
          <h3 id="public-presence-overview-heading" className={styles.overviewTitle}>
            Estado general
          </h3>
          <p className={styles.overviewStatus}>
            <span className={styles.overviewStatusPrimary}>{generalStatusPrimary}</span>
            {generalStatusSecondary ? (
              <span className={styles.overviewStatusSecondary}>{generalStatusSecondary}</span>
            ) : null}
          </p>
        </header>

        <div className={styles.sectionGrid}>
          {sections.map((section) => {
            const meta = SECTION_META[section.id];
            const { readyCount, totalCount } = getSectionReadinessCounts(section);
            const statusLabel = formatSectionStatus(section.id, readyCount, totalCount);
            const isComplete = readyCount === totalCount;

            return (
              <article
                key={section.id}
                className={styles.sectionCard}
                aria-labelledby={`public-presence-section-${section.id}`}
              >
                <div className={styles.sectionCardHeader}>
                  <h4 id={`public-presence-section-${section.id}`} className={styles.sectionCardTitle}>
                    {section.title}
                  </h4>
                  <span
                    className={`${styles.sectionPill} ${
                      isComplete ? styles.sectionPillReady : styles.sectionPillPending
                    }`}
                  >
                    {statusLabel}
                  </span>
                </div>
                <p className={styles.sectionCardDescription}>{meta.description}</p>

                {section.id === "publication" ? (
                  hasPublicUrls ? (
                    <>
                      <p className={styles.sectionHelper}>
                        Tus enlaces públicos están disponibles.
                      </p>
                      <div className={styles.sectionLinks}>
                      {publicLandingHref ? (
                        <a
                          href={publicLandingHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.sectionPublicLink}
                        >
                          Ver landing
                        </a>
                      ) : null}
                      {publicCatalogHref ? (
                        <a
                          href={publicCatalogHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.sectionPublicLink}
                        >
                          Ver catálogo
                        </a>
                      ) : null}
                    </div>
                    </>
                  ) : (
                    <p className={styles.sectionHelper}>
                      Configurá el slug de tu negocio para habilitar enlaces públicos.
                    </p>
                  )
                ) : meta.editHref ? (
                  <Link href={meta.editHref} className={styles.sectionEditLink}>
                    {meta.editLabel}
                  </Link>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <PublicPresenceReadiness variant="compact" {...readinessInput} />

      <section className={styles.quickActions} aria-labelledby="public-presence-quick-actions-heading">
        <h3 id="public-presence-quick-actions-heading" className={styles.quickActionsTitle}>
          Accesos rápidos
        </h3>
        <div className={styles.quickActionsGrid}>
          <Link href="/admin/settings/public/landing" className={styles.quickAction}>
            Editar Landing
          </Link>
          <Link href="/admin/settings/public/catalogo" className={styles.quickAction}>
            Editar Catálogo
          </Link>
          {publicLandingHref ? (
            <a
              href={publicLandingHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.quickAction} ${styles.quickActionExternal}`}
            >
              Ver Landing pública
            </a>
          ) : (
            <span className={`${styles.quickAction} ${styles.quickActionDisabled}`} aria-disabled="true">
              Ver Landing pública
              <span className={styles.quickActionHint}>Pendiente de publicación</span>
            </span>
          )}
          {publicCatalogHref ? (
            <a
              href={publicCatalogHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.quickAction} ${styles.quickActionExternal}`}
            >
              Ver Catálogo público
            </a>
          ) : (
            <span className={`${styles.quickAction} ${styles.quickActionDisabled}`} aria-disabled="true">
              Ver Catálogo público
              <span className={styles.quickActionHint}>Pendiente de publicación</span>
            </span>
          )}
        </div>
      </section>
    </div>
  );
}

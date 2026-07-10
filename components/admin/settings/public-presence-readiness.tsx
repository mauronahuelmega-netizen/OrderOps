"use client";

import {
  buildPublicPresenceReadinessSections,
  type PublicPresenceReadinessInput,
  type ReadinessItemStatus
} from "@/components/admin/settings/public-presence-readiness-model";
import styles from "./public-presence-readiness.module.css";

export {
  buildPublicPresenceReadinessSections,
  computePublicPresenceSummaryStats,
  getAssetReadinessStatus,
  getFieldReadinessStatus,
  getOptionalFieldReadinessStatus,
  getSectionReadinessCounts,
  type PublicPresenceReadinessInput,
  type PublicPresenceSummaryStats,
  type ReadinessItem,
  type ReadinessItemStatus,
  type ReadinessSection
} from "@/components/admin/settings/public-presence-readiness-model";

const STATUS_LABEL: Record<ReadinessItemStatus, string> = {
  ready: "Listo",
  optional: "Opcional",
  pending: "Pendiente",
  "pending-save": "Pendiente de guardar"
};

type PublicPresenceReadinessProps = PublicPresenceReadinessInput;

export default function PublicPresenceReadiness({
  variant = "panel",
  ...input
}: PublicPresenceReadinessProps) {
  const sections = buildPublicPresenceReadinessSections(input);
  const panelClassName =
    variant === "compact"
      ? `${styles.panel} ${styles.panelCompact}`
      : styles.panel;

  return (
    <section className={panelClassName} aria-labelledby="public-presence-readiness-heading">
      <header className={styles.header}>
        <h4 id="public-presence-readiness-heading" className={styles.title}>
          Estado de presencia pública
        </h4>
        <p className={styles.subtitle}>
          Revisá qué partes de tu presencia pública ya están listas para tus clientes.
        </p>
      </header>

      <div className={styles.sections}>
        {sections.map((section) => (
          <div key={section.id} className={styles.section}>
            <h5 className={styles.sectionTitle}>{section.title}</h5>
            <ul className={styles.list}>
              {section.items.map((item) => (
                <li key={item.id} className={styles.item}>
                  <span
                    className={`${styles.indicator} ${styles[`indicator--${item.status}`]}`}
                    aria-hidden="true"
                  />
                  <span className={styles.copy}>
                    <span className={styles.label}>{item.label}</span>
                    <span className={styles.status}>
                      {STATUS_LABEL[item.status]}
                      {item.detail ? ` · ${item.detail}` : ""}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

"use client";

import {
  Activity,
  Banknote,
  Clock3,
  CookingPot,
  PackageCheck,
  ReceiptText,
  Star,
  Timer,
  type LucideIcon
} from "lucide-react";
import OperatorPresencePill from "@/components/admin/orders/operator-presence-pill";
import type {
  DashboardTopSectionInsightViewModel,
  DashboardTopSectionKpiViewModel,
  DashboardTopSectionMeta,
  DashboardTopSectionViewModel
} from "@/lib/orders/dashboard-top-section-view-model";
import styles from "./DashboardMobileOverview.module.css";

export type DashboardMobileOverviewProps = {
  viewModel: DashboardTopSectionViewModel;
};

const KPI_ICON_MAP: Record<string, LucideIcon> = {
  banknote: Banknote,
  receipt: ReceiptText,
  activity: Activity,
  star: Star,
  chef: CookingPot,
  clock: Clock3,
  timer: Timer,
  "package-ready": PackageCheck
};

function resolveKpiIcon(iconKey?: string) {
  const Icon = (iconKey && KPI_ICON_MAP[iconKey]) || Activity;
  return <Icon className={styles.kpiIcon} aria-hidden="true" strokeWidth={2} />;
}

type HeaderSectionProps = {
  meta: DashboardTopSectionMeta;
};

function HeaderSection({ meta }: HeaderSectionProps) {
  const metaLine = meta.statusLabel
    ? `${meta.sessionLabel} · ${meta.statusLabel}`
    : meta.sessionLabel;

  return (
    <header className={styles.headerSection}>
      <div className={styles.headerCopy}>
        <h1>{meta.title}</h1>
        <div className={styles.headerMetaLine}>
          <span
            className={styles.liveIndicator}
            data-scope-indicator={meta.scopeIndicator}
            aria-label={meta.scopeAriaLabel}
          >
            {meta.showScopeDot ? <span className={styles.liveDot} aria-hidden="true" /> : null}
            {metaLine}
          </span>
          {meta.showPresence && meta.presenceLabel ? (
            <OperatorPresencePill
              label={meta.presenceLabel}
              ariaLabel={`Operadores online: ${meta.presenceLabel}`}
            />
          ) : null}
        </div>
      </div>
    </header>
  );
}

type KpiGridProps = {
  title: string;
  items: DashboardTopSectionKpiViewModel[];
  variant: "business" | "operational";
};

function KpiGrid({ title, items, variant }: KpiGridProps) {
  return (
    <section className={styles.kpiSection} data-section={variant} aria-label={title}>
      <h2 className={styles.kpiSectionTitle}>{title}</h2>
      <div className={styles.kpiGrid}>
        {items.map((item) => (
          <article
            key={item.id}
            className={styles.kpiCard}
            data-kpi-id={item.id}
            data-tone={item.tone}
            data-priority={item.priority}
          >
            <div className={styles.iconWrapper}>{resolveKpiIcon(item.iconKey)}</div>
            <span className={styles.kpiValue}>{item.value}</span>
            <span className={styles.kpiLabel}>{item.label}</span>
            {item.detail ? <span className={styles.kpiDetail}>{item.detail}</span> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

type InsightsRowProps = {
  insights: DashboardTopSectionInsightViewModel[];
};

function InsightsRow({ insights }: InsightsRowProps) {
  return (
    <section className={styles.insightsRow} aria-label="Señales de la sesión">
      <h2 className={styles.insightsRowTitle}>Señales de la sesión</h2>
      <div className={styles.insightsStrip} data-insight-count={insights.length}>
        {insights.map((insight) => (
          <article
            key={insight.id}
            className={styles.insightCard}
            data-insight-id={insight.id}
            data-tone={insight.tone}
            data-action-key={insight.futureActionKey ?? undefined}
          >
            <strong className={styles.insightTitle}>{insight.title}</strong>
            <span className={styles.insightDetail}>{insight.detail}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function DashboardMobileOverview({ viewModel }: DashboardMobileOverviewProps) {
  return (
    <section className={styles.root} aria-label="Resumen operativo mobile del dashboard">
      <HeaderSection meta={viewModel.meta} />
      <KpiGrid title="Negocio" items={viewModel.businessKpis} variant="business" />
      <KpiGrid title="Operación" items={viewModel.operationalKpis} variant="operational" />
      <InsightsRow insights={viewModel.insights} />
    </section>
  );
}

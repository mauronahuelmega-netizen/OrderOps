import Link from "next/link";
import { registerPromoterBusiness } from "@/app/promoter/actions";
import { BusinessContactActions } from "@/components/promoter/business-contact-actions";
import { PendingButton } from "@/components/promoter/pending-button";
import { requirePromoterPrincipal } from "@/lib/commercial/promoters/require-promoter-principal";
import {
  buildPortfolio,
  labelClaimStatus,
  labelOpportunityStage
} from "@/lib/commercial/promoters/portfolio-summary";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/components/promoter/promoter-panel.module.css";

type Overview = {
  ok?: boolean;
  businesses?: Array<{ id?: string; display_name?: string; normalized_phone?: string | null }>;
  opportunities?: Array<{ id?: string; stage?: string; business_id?: string }>;
  claims?: Array<{ status?: string; business_id?: string }>;
};

export default async function PromoterBusinessesPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requirePromoterPrincipal();
  const query = ((await searchParams).q ?? "").trim().toLocaleLowerCase("es");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("promoter_overview");
  const overview = (data ?? null) as Overview | null;
  const overviewReady = overview?.ok === true;
  const businesses = (overviewReady
    ? buildPortfolio({
        businesses: overview.businesses ?? [],
        opportunities: overview.opportunities ?? [],
        claims: overview.claims ?? []
      })
    : []
  ).filter((business) => !query || business.displayName.toLocaleLowerCase("es").includes(query));

  return (
    <section className={styles.card}>
      <h1>Cartera</h1>
      <form className={styles.filters} method="get">
        <label>
          Nombre
          <input name="q" defaultValue={(await searchParams).q ?? ""} />
        </label>
        <button type="submit">Buscar</button>
      </form>
      {!overviewReady ? <p className={styles.muted} role="alert">No se pudo cargar la cartera.</p> : null}
      {overviewReady && businesses.length === 0 ? <p className={styles.muted}>No hay comercios para esta búsqueda.</p> : null}
      <ul className={styles.list}>
        {businesses.map((business) => {
          const opportunity = (overview?.opportunities ?? []).find((item) => item.business_id === business.id && item.id);
          return (
            <li key={business.id} className={styles.row}>
              <strong>{business.displayName}</strong>
              <p className={styles.muted}>
                {business.stages.length > 0 ? business.stages.map(labelOpportunityStage).join(", ") : "Sin oportunidad visible"}
                {" · "}
                {business.claimStatuses.length > 0 ? business.claimStatuses.map(labelClaimStatus).join(", ") : "Sin reclamación visible"}
              </p>
              <BusinessContactActions
                businessId={business.id}
                phone={(overview?.businesses ?? []).find((item) => item.id === business.id)?.normalized_phone}
              />
              {opportunity?.id ? <Link href={`/promoter/opportunities/${opportunity.id}`}>Abrir oportunidad</Link> : null}
              <Link href="/promoter/onboarding">Ver asistencia</Link>
            </li>
          );
        })}
      </ul>
      <h2>Registrar comercio</h2>
      <form action={registerPromoterBusiness} className={styles.form}>
        <input name="tradeName" placeholder="Nombre del comercio" disabled={!session.can_operate} />
        <input name="whatsapp" placeholder="WhatsApp" disabled={!session.can_operate} />
        <input name="tradeCategory" placeholder="Rubro" disabled={!session.can_operate} />
        <PendingButton disabled={!session.can_operate}>Registrar comercio</PendingButton>
      </form>
    </section>
  );
}

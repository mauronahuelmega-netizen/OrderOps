import Link from "next/link";
import { requirePromoterPrincipal } from "@/lib/commercial/promoters/require-promoter-principal";
import {
  formatOnboardingWhen,
  onboardingStatusLabel,
  type OnboardingBusinessView
} from "@/lib/commercial/onboarding/read-model";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/components/commercial/onboarding-ui.module.css";
import { RequestAssistanceForm } from "./request-form";

export default async function PromoterOnboardingPage() {
  const session = await requirePromoterPrincipal();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("promoter_onboarding_businesses");
  const result = (data ?? null) as { ok?: boolean; businesses?: OnboardingBusinessView[] } | null;
  const businesses = result?.ok ? (result.businesses ?? []) : [];

  return (
    <section className={styles.page}>
      <header className={styles.card}>
        <h1>Asistencia</h1>
        <p className={styles.muted}>
          Pedí autorización para editar el contenido de un comercio ya convertido. El comercio aprueba el acceso.
        </p>
      </header>
      {error || !result?.ok ? (
        <p className={styles.error} role="alert">No pudimos cargar tus comercios.</p>
      ) : null}
      {session.can_operate !== true ? (
        <p className={styles.muted}>Tu cuenta no puede operar solicitudes de asistencia.</p>
      ) : null}
      {businesses.length === 0 ? (
        <div className={styles.card}>
          <p>No hay acompañamientos disponibles actualmente.</p>
          <p><Link href="/promoter/businesses">Cartera</Link> · <Link href="/promoter/opportunities">Oportunidades</Link></p>
        </div>
      ) : (
        <ul className={styles.list}>
          {businesses.map((business) => {
            const openGrant = business.grants.find((grant) => grant.display_status === "pending_client" || grant.can_edit);
            return (
              <li key={business.business_id} className={styles.card}>
                <h2>{business.name}</h2>
                <p className={styles.muted}>{business.slug}</p>
                {business.grants.length === 0 ? <p>Sin solicitudes.</p> : null}
                <ul className={styles.list}>
                  {business.grants.map((grant) => (
                    <li key={grant.grant_id}>
                      <p>{onboardingStatusLabel(grant.display_status)}</p>
                      {grant.starts_at || grant.ends_at ? (
                        <p className={styles.muted}>
                          Desde {formatOnboardingWhen(grant.starts_at)} hasta {formatOnboardingWhen(grant.ends_at)}
                        </p>
                      ) : (
                        <p className={styles.muted}>Todavía sin vigencia.</p>
                      )}
                    </li>
                  ))}
                </ul>
                {business.can_edit ? (
                  <Link href={`/promoter/onboarding/${business.business_id}`}>Editar contenido</Link>
                ) : null}
                {session.can_operate === true && !openGrant ? (
                  <RequestAssistanceForm businessId={business.business_id} />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

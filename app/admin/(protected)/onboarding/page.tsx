import { requireAdminPermission } from "@/lib/admin/context";
import {
  formatOnboardingWhen,
  onboardingStatusLabel,
  type OnboardingGrantView
} from "@/lib/commercial/onboarding/read-model";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/components/commercial/onboarding-ui.module.css";
import { OnboardingDecisionForm } from "./decision-form";

export default async function AdminOnboardingPage() {
  await requireAdminPermission("manageProducts");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("business_onboarding_requests");
  const result = (data ?? null) as { ok?: boolean; requests?: OnboardingGrantView[] } | null;
  const requests = result?.ok ? (result.requests ?? []) : [];

  return (
    <section className={styles.page}>
      <header className={styles.card}>
        <h1>Asistencia de promotores</h1>
        <p className={styles.muted}>
          Estas solicitudes permiten editar contenido del catálogo. No abren el portal comercial.
        </p>
      </header>
      {error || !result?.ok ? (
        <p className={styles.error} role="alert">No pudimos cargar las solicitudes.</p>
      ) : null}
      {requests.length === 0 ? <p className={styles.card}>No hay solicitudes para este negocio.</p> : null}
      <ul className={styles.list}>
        {requests.map((grant) => (
          <li key={grant.grant_id} className={styles.card}>
            <h2>{grant.promoter_name}</h2>
            <p className={styles.muted}>{grant.promoter_code}</p>
            <p>{onboardingStatusLabel(grant.display_status)}</p>
            {grant.starts_at || grant.ends_at ? (
              <p className={styles.muted}>
                Desde {formatOnboardingWhen(grant.starts_at)} hasta {formatOnboardingWhen(grant.ends_at)}
              </p>
            ) : (
              <p className={styles.muted}>Todavía sin vigencia.</p>
            )}
            {grant.can_decide ? (
              <div className={styles.row}>
                <OnboardingDecisionForm grantId={grant.grant_id} decision="approve" label="Aprobar" />
                <OnboardingDecisionForm grantId={grant.grant_id} decision="reject" label="Rechazar" />
              </div>
            ) : null}
            {grant.can_revoke ? (
              <OnboardingDecisionForm grantId={grant.grant_id} decision="revoke" label="Revocar" />
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

import { requirePromoterPrincipal } from "@/lib/commercial/promoters/require-promoter-principal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/components/promoter/promoter-panel.module.css";

type Claim = { id?: string; status?: string };
type Overview = { claims?: Claim[] };

export default async function PromoterClaimsPage() {
  await requirePromoterPrincipal();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("promoter_overview");
  const claims = ((data ?? {}) as Overview).claims ?? [];
  return (
    <section className={styles.card}>
      <h1>Reclamaciones</h1>
      <ul>
        {claims.map((claim) => (
          <li key={claim.id}>
            {claim.status} · {claim.id}
          </li>
        ))}
      </ul>
    </section>
  );
}

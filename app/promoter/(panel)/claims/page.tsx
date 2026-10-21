import { requirePromoterPrincipal } from "@/lib/commercial/promoters/require-promoter-principal";
import { labelClaimStatus } from "@/lib/commercial/promoters/portfolio-summary";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/components/promoter/promoter-panel.module.css";

type Claim = { id?: string; status?: string; business_id?: string };
type Overview = {
  ok?: boolean;
  claims?: Claim[];
  businesses?: Array<{ id?: string; display_name?: string }>;
};

const STATUSES = ["provisional", "expired", "rejected", "confirmed", "superseded"] as const;

export default async function PromoterClaimsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; estado?: string }>;
}) {
  await requirePromoterPrincipal();
  const params = await searchParams;
  const query = (params.q ?? "").trim().toLocaleLowerCase("es");
  const status = params.estado ?? "";
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("promoter_overview");
  const overview = (data ?? null) as Overview | null;
  const overviewReady = overview?.ok === true;
  const names = new Map((overview?.businesses ?? []).map((business) => [business.id, business.display_name]));
  const claims = (overviewReady ? (overview.claims ?? []) : []).filter((claim) => {
    const name = (names.get(claim.business_id ?? "") ?? "").toLocaleLowerCase("es");
    if (query && !name.includes(query)) return false;
    if (status && claim.status !== status) return false;
    return true;
  });

  return (
    <section className={styles.card}>
      <h1>Reclamaciones</h1>
      <form className={styles.filters} method="get">
        <label>
          Comercio
          <input name="q" defaultValue={params.q ?? ""} />
        </label>
        <label>
          Estado
          <select name="estado" defaultValue={status}>
            <option value="">Todos</option>
            {STATUSES.map((item) => (
              <option key={item} value={item}>{labelClaimStatus(item)}</option>
            ))}
          </select>
        </label>
        <button type="submit">Filtrar</button>
      </form>
      {!overviewReady ? <p className={styles.muted} role="alert">No se pudieron cargar las reclamaciones.</p> : null}
      {overviewReady && claims.length === 0 ? <p className={styles.muted}>No hay reclamaciones para esta búsqueda.</p> : null}
      <ul className={styles.list}>
        {claims.map((claim) => (
          <li key={claim.id} className={styles.row}>
            <strong>{names.get(claim.business_id ?? "") ?? "Comercio sin nombre"}</strong>
            <p className={styles.muted}>{labelClaimStatus(claim.status)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

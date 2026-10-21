import { registerPromoterBusiness } from "@/app/promoter/actions";
import { requirePromoterPrincipal } from "@/lib/commercial/promoters/require-promoter-principal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/components/promoter/promoter-panel.module.css";

type Named = { id?: string; display_name?: string };
type Overview = { businesses?: Named[] };

export default async function PromoterBusinessesPage() {
  const session = await requirePromoterPrincipal();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("promoter_overview");
  const businesses = ((data ?? {}) as Overview).businesses ?? [];
  return (
    <section className={styles.card}>
      <h1>Comercios</h1>
      <ul>
        {businesses.map((business) => (
          <li key={business.id}>{business.display_name}</li>
        ))}
      </ul>
      <form action={registerPromoterBusiness} className={styles.form}>
        <input name="tradeName" placeholder="Nombre del comercio" disabled={!session.can_operate} />
        <input name="whatsapp" placeholder="WhatsApp" disabled={!session.can_operate} />
        <input name="tradeCategory" placeholder="Rubro" disabled={!session.can_operate} />
        <button type="submit" disabled={!session.can_operate}>
          Registrar comercio
        </button>
      </form>
    </section>
  );
}

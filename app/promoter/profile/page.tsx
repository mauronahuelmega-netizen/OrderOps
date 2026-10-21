import { requirePromoterPrincipal } from "@/lib/commercial/promoters/require-promoter-principal";
import { VERIFICATION_NOTICE } from "@/lib/commercial/promoters/verification-copy";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/components/promoter/promoter-panel.module.css";

export default async function PromoterProfilePage() {
  const session = await requirePromoterPrincipal();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("read_own_bank");
  const bank = (data ?? {}) as { accounts?: { holder_name?: string; is_current?: boolean }[] };
  return (
    <section className={styles.card}>
      <h1>Perfil</h1>
      <p>Estado: {session.status}</p>
      <p>Código: {session.public_code}</p>
      <p>{VERIFICATION_NOTICE}</p>
      <h2>CBU propio</h2>
      <ul>
        {(bank.accounts ?? []).map((account) => (
          <li key={`${account.holder_name}-${String(account.is_current)}`}>
            {account.holder_name} {account.is_current ? "vigente" : "anterior"}
          </li>
        ))}
      </ul>
    </section>
  );
}

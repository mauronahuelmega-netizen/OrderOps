import { labelPromoterStatus } from "@/lib/commercial/promoters/portfolio-summary";
import { requirePromoterPrincipal } from "@/lib/commercial/promoters/require-promoter-principal";
import { VERIFICATION_NOTICE } from "@/lib/commercial/promoters/verification-copy";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/components/promoter/promoter-panel.module.css";

export default async function PromoterProfilePage() {
  const session = await requirePromoterPrincipal();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("read_own_bank");
  const bank = (data ?? null) as { ok?: boolean; accounts?: { holder_name?: string; is_current?: boolean }[] } | null;
  const accounts = bank?.ok === true ? (bank.accounts ?? []) : null;
  return (
    <section className={styles.card}>
      <h1>Perfil</h1>
      <p>Estado: {labelPromoterStatus(session.status)}</p>
      <p>Código de promotor: {session.public_code}</p>
      <p className={styles.muted}>Esta pantalla no ofrece campos editables: el backend no expone una acción de actualización para estos datos.</p>
      <p>{VERIFICATION_NOTICE}</p>
      {accounts === null ? (
        <p className={styles.muted} role="alert">No se pudo cargar la cuenta de cobro.</p>
      ) : accounts.length === 0 ? (
        <p className={styles.muted}>No hay una cuenta de cobro registrada en esta lectura.</p>
      ) : (
        <>
          <h2>CBU propio</h2>
          <ul>
            {accounts.map((account) => (
              <li key={`${account.holder_name}-${String(account.is_current)}`}>
                {account.holder_name} {account.is_current ? "vigente" : "anterior"}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

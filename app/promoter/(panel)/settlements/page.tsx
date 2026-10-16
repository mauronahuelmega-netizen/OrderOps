import { requirePromoterPrincipal } from "@/lib/commercial/promoters/require-promoter-principal";
import { formatArsFromCents } from "@/lib/commercial/money";
import { loadSettlementWorkspace } from "@/lib/commercial/settlements/load-workspace";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { submitOwnInvoice } from "./actions";
import styles from "@/components/promoter/promoter-settlements.module.css";

type SettlementRow = {
  id: string;
  period_key: string;
  status: string;
  total_cents: number;
  due_on: string;
};

type InvoiceRow = {
  id: string;
  settlement_id: string;
  status: string;
  amount_cents: number;
  rejection_reason: string | null;
};

const NOTICES: Record<string, string> = {
  ok: "La documentación quedó presentada.",
  forbidden: "No se puede presentar esta documentación.",
  validation: "La liquidación o el archivo no admiten esta presentación.",
  error: "La presentación no se completó."
};

export default async function PromoterSettlementsPage({
  searchParams
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  await requirePromoterPrincipal();
  const notice = (await searchParams).notice;
  const supabase = await createSupabaseServerClient();
  const loaded = await loadSettlementWorkspace(supabase);
  const settlements = loaded.ok ? (loaded.workspace.settlements as SettlementRow[]) : [];
  const invoices = loaded.ok ? (loaded.workspace.invoices as InvoiceRow[]) : [];

  return (
    <section className={styles.page}>
      <h1>Liquidaciones</h1>
      <p className={styles.meta}>
        Una factura aceptada habilita la posibilidad de pago. Finanzas registra la transferencia simulada. No se emite una factura fiscal.
      </p>
      {loaded.ok && notice ? <p>{NOTICES[notice] ?? notice}</p> : null}
      {!loaded.ok ? (
        <p>
          {notice === "ok"
            ? "La documentación se envió, pero no se pudo confirmar el listado."
            : "No se pudieron cargar las liquidaciones."}
        </p>
      ) : null}
      {loaded.ok && settlements.length === 0 ? <p className={styles.meta}>No hay liquidaciones.</p> : null}
      {settlements.map((settlement) => {
        const ownInvoices = invoices.filter((invoice) => invoice.settlement_id === settlement.id);
        const accepted = ownInvoices.some((invoice) => invoice.status === "accepted");
        return (
          <article key={settlement.id} className={styles.card}>
            <strong>
              {settlement.period_key} · {settlement.status}
            </strong>
            <p className={styles.meta}>
              {formatArsFromCents(settlement.total_cents)} · vence {settlement.due_on}
            </p>
            {accepted ? <p className={styles.meta}>La factura aceptada habilita la posibilidad de pago.</p> : null}
            {ownInvoices.map((invoice) => (
              <p key={invoice.id} className={styles.meta}>
                {invoice.status} · {formatArsFromCents(invoice.amount_cents)}
                {invoice.rejection_reason ? ` · ${invoice.rejection_reason}` : ""}
              </p>
            ))}
            {settlement.status === "approved" ? (
              <form className={styles.form} action={submitOwnInvoice}>
                <input type="hidden" name="settlementId" value={settlement.id} />
                <input name="amount" placeholder="Importe en pesos" required />
                <input name="fileName" placeholder="Nombre de archivo, por ejemplo factura.pdf" required />
                <button type="submit">Presentar documentación</button>
              </form>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}

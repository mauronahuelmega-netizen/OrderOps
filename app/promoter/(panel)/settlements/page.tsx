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

type ItemRow = {
  id: string;
  settlement_id: string;
  label: string;
  amount_cents: number;
};

type PaymentRow = {
  id: string;
  settlement_id: string;
  status: string;
  amount_cents: number;
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
  const items = loaded.ok ? (loaded.workspace.items as ItemRow[]) : [];
  const payments = loaded.ok ? (loaded.workspace.payments as PaymentRow[]) : [];

  return (
    <section className={styles.page}>
      <h1>Ingresos</h1>
      <p className={styles.meta}>Las comisiones individuales no se listan en esta lectura. Esta pantalla no aprueba, reversa, concilia ni ejecuta pagos.</p>
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
        const ownItems = items.filter((item) => item.settlement_id === settlement.id);
        const ownPayments = payments.filter((payment) => payment.settlement_id === settlement.id);
        const accepted = ownInvoices.some((invoice) => invoice.status === "accepted");
        return (
          <article key={settlement.id} className={styles.card}>
            <strong>
              {settlement.period_key} · {settlement.status}
            </strong>
            <p className={styles.meta}>
              {formatArsFromCents(settlement.total_cents)} · vence {settlement.due_on}
            </p>
            {ownItems.length === 0 ? <p className={styles.meta}>Esta liquidación no trae ítems en la lectura.</p> : null}
            {ownItems.map((item) => (
              <p key={item.id} className={styles.meta}>{item.label} · {formatArsFromCents(item.amount_cents)}</p>
            ))}
            {ownPayments.length === 0 ? <p className={styles.meta}>No hay un pago externo registrado en esta lectura. OrderOps no afirma una transferencia.</p> : null}
            {ownPayments.map((payment) => (
              <p key={payment.id} className={styles.meta}>Pago externo {payment.status} · {formatArsFromCents(payment.amount_cents)}</p>
            ))}
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

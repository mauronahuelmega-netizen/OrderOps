import { requireCommercialArea } from "@/lib/commercial/auth/require-commercial-principal";
import { formatArsFromCents } from "@/lib/commercial/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  approveSettlement,
  prepareSettlement,
  recordPayment,
  replaceSettlement,
  reviewInvoice
} from "./actions";
import styles from "@/components/commercial/settlements-panel.module.css";

type SettlementRow = {
  id: string;
  promoter_id: string;
  period_key: string;
  status: string;
  total_cents: number;
  due_on: string;
  prepared_by: string;
  approved_by: string | null;
  replaces_settlement_id: string | null;
  invalidation_reason: string | null;
  reconciliation_reason: string | null;
};

type ItemRow = { id: string; settlement_id: string; label: string; amount_cents: number; lineage: string };
type InvoiceRow = { id: string; settlement_id: string; status: string; amount_cents: number; rejection_reason: string | null };
type PaymentRow = { id: string; settlement_id: string; status: string; amount_cents: number; idempotency_key: string };

const NOTICES: Record<string, string> = {
  ok: "La operación quedó registrada.",
  forbidden: "Este rol no puede ejecutar la operación.",
  sod_violation: "La segregación de funciones impide que el mismo usuario apruebe o pague.",
  invoice_required: "El pago exige una factura aceptada por el total de esta liquidación.",
  invoice_amount_mismatch: "El importe de la factura no coincide con el total.",
  payment_exceeds_total: "El pago supera el total.",
  idempotent_replay: "La clave ya se usó con otro cuerpo. No se creó otro pago.",
  settlement_invalidated: "La liquidación está invalidada.",
  reconciliation_required: "La liquidación está congelada para conciliación manual.",
  replacement_required: "El período invalidado se reemplaza con una solicitud explícita.",
  settlement_exists: "Ya hay una liquidación activa para ese período.",
  validation: "La operación no es válida para el estado actual.",
  error: "La operación no se completó."
};

export default async function CommercialSettlementsPage({
  searchParams
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const session = await requireCommercialArea();
  const notice = (await searchParams).notice;
  const supabase = await createSupabaseServerClient();
  const settlementsResult = await supabase
    .schema("commercial")
    .from("promoter_settlements")
    .select("id, promoter_id, period_key, status, total_cents, due_on, prepared_by, approved_by, replaces_settlement_id, invalidation_reason, reconciliation_reason")
    .order("period_key", { ascending: false });
  const itemsResult = await supabase.schema("commercial").from("settlement_items").select("id, settlement_id, label, amount_cents, lineage");
  const invoicesResult = await supabase.schema("commercial").from("promoter_invoices").select("id, settlement_id, status, amount_cents, rejection_reason");
  const paymentsResult = await supabase.schema("commercial").from("settlement_payments").select("id, settlement_id, status, amount_cents, idempotency_key");
  const settlements = (settlementsResult.data ?? []) as SettlementRow[];
  const items = (itemsResult.data ?? []) as ItemRow[];
  const invoices = (invoicesResult.data ?? []) as InvoiceRow[];
  const payments = (paymentsResult.data ?? []) as PaymentRow[];
  const roles = session.roles ?? [];
  const canOperate = roles.includes("finance");

  return (
    <main className={styles.page}>
      <section className={styles.list}>
        <h1>Liquidaciones</h1>
        {notice ? <p className={styles.notice}>{NOTICES[notice] ?? notice}</p> : null}
        {canOperate ? (
          <form className={styles.form} action={prepareSettlement}>
            <h2>Preparar</h2>
            <input name="promoterId" placeholder="Promotor" required />
            <input name="periodKey" placeholder="Período YYYY-MM" required />
            <input name="adjustmentIds" placeholder="Ajustes, separados por coma" />
            <button type="submit">Preparar liquidación</button>
          </form>
        ) : (
          <p className={styles.meta}>Este rol consulta. Finanzas ejecuta la preparación, la revisión y el pago simulado.</p>
        )}
        {settlements.length === 0 ? <p className={styles.meta}>No hay liquidaciones visibles.</p> : null}
        {settlements.map((settlement) => {
          const ownItems = items.filter((item) => item.settlement_id === settlement.id);
          const ownInvoices = invoices.filter((invoice) => invoice.settlement_id === settlement.id);
          const ownPayments = payments.filter((payment) => payment.settlement_id === settlement.id);
          const frozen = settlement.status === "invalidated" || settlement.status === "reconciliation_required";
          return (
            <article key={settlement.id} className={styles.card}>
              <strong>
                {settlement.period_key} · {settlement.status}
              </strong>
              <p className={styles.meta}>
                {formatArsFromCents(settlement.total_cents)} · vence {settlement.due_on}
              </p>
              {settlement.replaces_settlement_id ? (
                <p className={styles.meta}>Reemplaza {settlement.replaces_settlement_id}</p>
              ) : null}
              {settlement.invalidation_reason ? <p className={styles.meta}>Invalidada: {settlement.invalidation_reason}</p> : null}
              {settlement.reconciliation_reason ? (
                <p className={styles.meta}>Conciliación manual: {settlement.reconciliation_reason}</p>
              ) : null}
              <ul>
                {ownItems.map((item) => (
                  <li key={item.id}>
                    {item.label} · {formatArsFromCents(item.amount_cents)} · {item.lineage}
                  </li>
                ))}
              </ul>
              <h3>Documentación</h3>
              {ownInvoices.length === 0 ? <p className={styles.meta}>Sin facturas.</p> : null}
              {ownInvoices.map((invoice) => (
                <div key={invoice.id}>
                  <p className={styles.meta}>
                    {invoice.status} · {formatArsFromCents(invoice.amount_cents)}
                    {invoice.rejection_reason ? ` · ${invoice.rejection_reason}` : ""}
                  </p>
                  {canOperate && invoice.status === "submitted" && !frozen ? (
                    <form className={styles.form} action={reviewInvoice}>
                      <input type="hidden" name="invoiceId" value={invoice.id} />
                      <input name="reason" placeholder="Motivo si se rechaza" />
                      <button type="submit" name="decision" value="accepted">
                        Aceptar
                      </button>
                      <button type="submit" name="decision" value="rejected">
                        Rechazar
                      </button>
                    </form>
                  ) : null}
                </div>
              ))}
              <h3>Pagos simulados</h3>
              {ownPayments.length === 0 ? <p className={styles.meta}>Sin pagos.</p> : null}
              {ownPayments.map((payment) => (
                <p key={payment.id} className={styles.meta}>
                  {payment.status} · {formatArsFromCents(payment.amount_cents)} · {payment.idempotency_key}
                </p>
              ))}
              {canOperate && settlement.status === "draft" ? (
                <form action={approveSettlement}>
                  <input type="hidden" name="settlementId" value={settlement.id} />
                  <button type="submit">Aprobar</button>
                </form>
              ) : null}
              {canOperate && settlement.status === "invalidated" ? (
                <form className={styles.form} action={replaceSettlement}>
                  <input type="hidden" name="settlementId" value={settlement.id} />
                  <input name="reason" placeholder="Motivo del reemplazo" required />
                  <button type="submit">Crear reemplazo</button>
                </form>
              ) : null}
              {canOperate && (settlement.status === "payable" || settlement.status === "partially_paid") ? (
                <form className={styles.form} action={recordPayment}>
                  <input type="hidden" name="settlementId" value={settlement.id} />
                  <input name="amount" placeholder="Importe en pesos" required />
                  <input name="idempotencyKey" placeholder="Clave de idempotencia" required />
                  <select name="status" defaultValue="recorded">
                    <option value="recorded">Registrado</option>
                    <option value="failed">Fallido</option>
                  </select>
                  <input name="reference" placeholder="Referencia" />
                  <button type="submit">Registrar pago simulado</button>
                </form>
              ) : null}
            </article>
          );
        })}
      </section>
    </main>
  );
}

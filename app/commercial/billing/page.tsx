import Link from "next/link";
import { requireCommercialArea } from "@/lib/commercial/auth/require-commercial-principal";
import { formatArsFromCents } from "@/lib/commercial/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  closeReceipt,
  imputeReceipt,
  recordServiceStart,
  reopenObligation,
  retryWebhook,
  voidFiscalDocument
} from "./actions";
import styles from "@/components/commercial/settlements-panel.module.css";

type Workspace = {
  ok?: boolean;
  commercial_error_code?: string;
  reconciliation_receipts?: {
    id: string;
    business_name: string;
    external_transaction_id: string;
    gross_amount_cents: number | null;
    observed_at: string | null;
    review_reason: string | null;
    terms_id: string | null;
  }[];
  imputed_receipts?: {
    id: string;
    business_name: string;
    external_transaction_id: string;
    gross_amount_cents: number | null;
    observed_at: string | null;
  }[];
  dead_webhooks?: { id: string; business_name: string; external_transaction_id: string; attempts: number; last_error: string | null }[];
  reopenable_obligations?: { id: string; business_name: string; kind: string; period_on: string | null }[];
  pending_service_starts?: { terms_id: string; business_name: string }[];
  businesses?: { id: string; name: string }[];
  fiscal_documents?: {
    id: string;
    business_name: string;
    kind: string;
    document_number: string;
    issued_on: string;
    amount_cents: number;
    voided_at: string | null;
  }[];
};

const NOTICES: Record<string, string> = {
  ok: "La operación quedó registrada.",
  forbidden: "Solo Finanzas ejecuta estas operaciones.",
  validation: "Los datos no son válidos para el estado actual.",
  file_invalid: "El archivo tiene que ser un PDF de hasta 5 MB.",
  upload_failed: "No se pudo guardar el archivo. No se registró el comprobante.",
  duplicate: "Ya existe un comprobante con ese número para el negocio.",
  collection_mismatch: "La cobranza indicada no pertenece a ese negocio.",
  receipt_already_closed: "La transferencia ya tiene un cierre registrado.",
  imputed_requires_refund: "Una transferencia imputada solo se cierra como devolución.",
  already_voided: "El comprobante ya estaba anulado.",
  error: "La operación no se completó."
};

const REVIEW_REASONS: Record<string, string> = {
  activation_not_covered: "La activación no está cubierta",
  amount_mismatch: "Importe distinto al esperado",
  service_start_required: "Falta registrar el inicio de servicio",
  eligibility_changed: "Cambió la elegibilidad entre la acreditación y el proceso",
  no_eligible_period: "No hay período elegible",
  ambiguous_period: "Período ambiguo"
};

const DOCUMENT_KINDS: Record<string, string> = {
  invoice: "Factura",
  credit_note: "Nota de crédito",
  receipt: "Recibo"
};

function money(cents: number | null): string {
  return typeof cents === "number" ? formatArsFromCents(cents) : "—";
}

export default async function CommercialBillingPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const session = await requireCommercialArea();
  const notice = (await searchParams).notice;
  const canOperate = (session.roles ?? []).includes("finance");
  const supabase = await createSupabaseServerClient();
  const { data } = canOperate ? await supabase.rpc("finance_billing_workspace") : { data: null };
  const workspace = (data ?? null) as Workspace | null;
  const loaded = workspace?.ok === true;

  return (
    <main className={styles.page}>
      <section className={styles.list}>
        <h1>Cobranzas de suscripción</h1>
        <p className={styles.meta}>
          <Link href="/commercial/settlements">Liquidaciones</Link>
        </p>
        {notice ? <p className={styles.notice}>{NOTICES[notice] ?? notice}</p> : null}
        {!canOperate ? <p className={styles.meta}>Solo Finanzas opera cobranzas y comprobantes.</p> : null}
        {canOperate && !loaded ? <p className={styles.notice}>No se pudo cargar el espacio de Finanzas.</p> : null}

        {loaded ? (
          <>
            <article className={styles.card}>
              <h2>Transferencias en revisión</h2>
              {(workspace.reconciliation_receipts ?? []).length === 0 ? <p className={styles.meta}>No hay transferencias pendientes.</p> : null}
              {(workspace.reconciliation_receipts ?? []).map((receipt) => (
                <div key={receipt.id} className={styles.card}>
                  <strong>
                    {receipt.business_name} · {money(receipt.gross_amount_cents)}
                  </strong>
                  <p className={styles.meta}>
                    {receipt.observed_at ?? "—"} · {receipt.external_transaction_id} ·{" "}
                    {REVIEW_REASONS[receipt.review_reason ?? ""] ?? receipt.review_reason ?? "—"}
                  </p>
                  {receipt.terms_id ? (
                    <form className={styles.form} action={imputeReceipt}>
                      <input type="hidden" name="receiptId" value={receipt.id} />
                      <input type="hidden" name="termsId" value={receipt.terms_id} />
                      <label className={styles.meta}>
                        Período (aniversario AAAA-MM-DD). Vacío imputa la activación.
                        <input name="periodOn" type="date" />
                      </label>
                      <input name="note" placeholder="Nota de conciliación (mínimo 8 caracteres)" minLength={8} required />
                      <button type="submit">Imputar</button>
                    </form>
                  ) : (
                    <p className={styles.meta}>El negocio no tiene términos únicos: no se puede imputar desde acá.</p>
                  )}
                  <form className={styles.form} action={closeReceipt}>
                    <input type="hidden" name="receiptId" value={receipt.id} />
                    <select name="kind" defaultValue="refunded">
                      <option value="refunded">Devuelta fuera de OrderOps</option>
                      <option value="dismissed">Descartada</option>
                    </select>
                    <input name="reference" placeholder="Referencia de la devolución (obligatoria si se devolvió)" />
                    <input name="note" placeholder="Nota (mínimo 8 caracteres)" minLength={8} required />
                    <button type="submit">Cerrar</button>
                  </form>
                </div>
              ))}
            </article>

            <article className={styles.card}>
              <h2>Devolver una transferencia ya imputada</h2>
              <p className={styles.meta}>Revierte la cobranza; si la comisión ya estaba pagada genera un ajuste. No se netea solo.</p>
              {(workspace.imputed_receipts ?? []).length === 0 ? <p className={styles.meta}>Sin transferencias imputadas.</p> : null}
              {(workspace.imputed_receipts ?? []).map((receipt) => (
                <form key={receipt.id} className={styles.form} action={closeReceipt}>
                  <strong>
                    {receipt.business_name} · {money(receipt.gross_amount_cents)} · {receipt.observed_at ?? "—"}
                  </strong>
                  <input type="hidden" name="receiptId" value={receipt.id} />
                  <input type="hidden" name="kind" value="refunded" />
                  <input name="reference" placeholder="Referencia de la devolución" required />
                  <input name="note" placeholder="Nota (mínimo 8 caracteres)" minLength={8} required />
                  <button type="submit">Registrar devolución</button>
                </form>
              ))}
            </article>

            <article className={styles.card}>
              <h2>Inicio de servicio Founder</h2>
              {(workspace.pending_service_starts ?? []).length === 0 ? <p className={styles.meta}>No hay inicios pendientes.</p> : null}
              {(workspace.pending_service_starts ?? []).map((start) => (
                <form key={start.terms_id} className={styles.form} action={recordServiceStart}>
                  <strong>{start.business_name}</strong>
                  <input type="hidden" name="termsId" value={start.terms_id} />
                  <input name="startedOn" type="date" required />
                  <button type="submit">Registrar inicio</button>
                </form>
              ))}
            </article>

            <article className={styles.card}>
              <h2>Períodos revertidos</h2>
              {(workspace.reopenable_obligations ?? []).length === 0 ? <p className={styles.meta}>Nada para reabrir.</p> : null}
              {(workspace.reopenable_obligations ?? []).map((obligation) => (
                <form key={obligation.id} className={styles.form} action={reopenObligation}>
                  <strong>
                    {obligation.business_name} · {obligation.kind === "setup" ? "Activación" : obligation.period_on}
                  </strong>
                  <input type="hidden" name="obligationId" value={obligation.id} />
                  <input name="note" placeholder="Motivo (mínimo 8 caracteres)" minLength={8} required />
                  <button type="submit">Reabrir para nuevo cobro</button>
                </form>
              ))}
            </article>

            <article className={styles.card}>
              <h2>Avisos de Talo sin procesar</h2>
              {(workspace.dead_webhooks ?? []).length === 0 ? <p className={styles.meta}>Sin avisos detenidos.</p> : null}
              {(workspace.dead_webhooks ?? []).map((inbox) => (
                <form key={inbox.id} className={styles.form} action={retryWebhook}>
                  <strong>
                    {inbox.business_name} · {inbox.external_transaction_id}
                  </strong>
                  <p className={styles.meta}>
                    {inbox.attempts} intentos · {inbox.last_error ?? "—"}
                  </p>
                  <input type="hidden" name="inboxId" value={inbox.id} />
                  <button type="submit">Reintentar lectura</button>
                </form>
              ))}
            </article>

            <article className={styles.card}>
              <h2>Comprobantes fiscales</h2>
              <p className={styles.meta}>Se emiten fuera de OrderOps; acá se cargan para que el negocio los descargue.</p>
              <form className={styles.form} action="/commercial/billing/documents" method="post" encType="multipart/form-data">
                <select name="businessId" required defaultValue="">
                  <option value="" disabled>
                    Negocio
                  </option>
                  {(workspace.businesses ?? []).map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name}
                    </option>
                  ))}
                </select>
                <select name="kind" defaultValue="invoice">
                  <option value="invoice">Factura</option>
                  <option value="credit_note">Nota de crédito</option>
                  <option value="receipt">Recibo</option>
                </select>
                <input name="documentNumber" placeholder="Número (por ejemplo A-0001-00000001)" maxLength={60} required />
                <input name="issuedOn" type="date" required />
                <input name="amount" placeholder="Importe en pesos" required />
                <input name="collectionId" placeholder="Cobranza asociada (opcional)" />
                <input name="file" type="file" accept="application/pdf" required />
                <button type="submit">Cargar comprobante</button>
              </form>
              {(workspace.fiscal_documents ?? []).map((document) => (
                <div key={document.id} className={styles.form}>
                  <p className={styles.meta}>
                    {document.business_name} · {DOCUMENT_KINDS[document.kind] ?? document.kind} {document.document_number} · {document.issued_on} ·{" "}
                    {formatArsFromCents(document.amount_cents)}
                    {document.voided_at ? " · anulado" : ""}
                  </p>
                  {document.voided_at ? null : (
                    <form className={styles.form} action={voidFiscalDocument}>
                      <input type="hidden" name="documentId" value={document.id} />
                      <input name="reason" placeholder="Motivo de anulación (mínimo 8 caracteres)" minLength={8} required />
                      <button type="submit">Anular</button>
                    </form>
                  )}
                </div>
              ))}
            </article>
          </>
        ) : null}
      </section>
    </main>
  );
}

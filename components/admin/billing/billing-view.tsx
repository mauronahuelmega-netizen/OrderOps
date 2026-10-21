import { formatArsFromCents } from "@/lib/commercial/money";
import {
  computeBillingNotices,
  type BillingNotice,
  type BillingSummary,
  type ServiceAccessState
} from "@/lib/commercial/billing/billing-summary";
import styles from "./billing.module.css";

const STATE_LABELS: Record<ServiceAccessState, string> = {
  invalid: "En revisión",
  exempt: "Habilitado",
  no_terms: "Sin plan asignado",
  review_required: "En revisión",
  pending_activation: "Activación pendiente",
  active: "Activo",
  grace: "Período de gracia",
  suspended: "Suspendido"
};

const RECEIPT_LABELS: Record<string, string> = {
  received: "En proceso",
  pending_review: "En proceso",
  confirmed: "En proceso",
  imputed: "Acreditada",
  reconciliation_required: "En revisión por OrderOps"
};

const DOCUMENT_LABELS: Record<string, string> = {
  invoice: "Factura",
  credit_note: "Nota de crédito",
  receipt: "Recibo"
};

function formatDay(day: string | null | undefined): string {
  if (!day) return "—";
  const [year, month, date] = day.slice(0, 10).split("-");
  return `${date}/${month}/${year}`;
}

function formatInstant(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(iso));
}

function noticeText(notice: BillingNotice): string {
  switch (notice.kind) {
    case "suspended":
      return "El servicio está suspendido: no se pueden recibir pedidos nuevos. Los pedidos ya aceptados se pueden terminar. Al acreditarse la transferencia del período, el servicio se reactiva solo.";
    case "grace":
      return `El período actual no está pago. Tenés tiempo hasta el ${formatInstant(notice.date)} para transferir sin que se suspendan los pedidos nuevos.`;
    case "activation_pending":
      return "La activación todavía no está acreditada. Transferí el importe de activación a la cuenta indicada abajo.";
    case "review":
      return "OrderOps está revisando el plan de este negocio. Si necesitás ayuda, contactá a tu asesor de OrderOps.";
    case "t_minus_3":
      return `Faltan 3 días o menos para el próximo período (${formatDay(notice.date)}). Transferí la mensualidad para evitar la suspensión.`;
    case "t_minus_10":
      return `Ya podés pagar el próximo período, que empieza el ${formatDay(notice.date)}.`;
    case "service_start_pending":
      return "La activación está acreditada. OrderOps va a registrar la fecha de inicio del servicio, que fija el aniversario mensual.";
    case "payment_received":
      return "Recibimos tu pago. Gracias.";
    case "reversal":
      return "Un pago reciente fue revertido o devuelto y ya no cubre su período. Revisá el historial.";
  }
}

export default function BillingView({ summary, now }: { summary: BillingSummary; now: Date }) {
  if (summary.kind === "error") {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <h1>Facturación</h1>
        </header>
        <section className={styles.card}>
          <p className={styles.meta}>No pudimos cargar la facturación en este momento. Probá de nuevo en unos minutos.</p>
        </section>
      </main>
    );
  }

  if (summary.kind === "restricted") {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <h1>Facturación</h1>
        </header>
        <section className={styles.card}>
          <p className={styles.meta}>
            La facturación de OrderOps la gestiona el responsable del negocio.
            {summary.allowsOrders ? "" : " Hoy no se pueden crear pedidos nuevos; avisale al responsable."}
          </p>
        </section>
      </main>
    );
  }

  const { access, paymentDestination, receipts, history, fiscalDocuments } = summary;
  const notices = computeBillingNotices(access, history, now);
  const amountDue = access.state === "pending_activation" ? access.setup_price_cents : access.monthly_price_cents;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Facturación</h1>
        <p>Estado del servicio de OrderOps, cómo pagar y tus comprobantes.</p>
      </header>

      {notices.length > 0 ? (
        <section className={styles.notices} aria-label="Avisos">
          {notices.map((notice) => (
            <p key={notice.kind} className={`${styles.notice} ${styles[notice.tone]}`}>
              {noticeText(notice)}
            </p>
          ))}
        </section>
      ) : null}

      <section className={styles.card}>
        <h2>Servicio</h2>
        <dl className={styles.facts}>
          <div>
            <dt>Estado</dt>
            <dd>{STATE_LABELS[access.state]}</dd>
          </div>
          {access.current_period_on ? (
            <div>
              <dt>Período actual</dt>
              <dd>Desde {formatDay(access.current_period_on)}</dd>
            </div>
          ) : null}
          {access.next_period_on ? (
            <div>
              <dt>Próximo aniversario</dt>
              <dd>{formatDay(access.next_period_on)}</dd>
            </div>
          ) : null}
          {typeof amountDue === "number" ? (
            <div>
              <dt>{access.state === "pending_activation" ? "Activación" : "Mensualidad"}</dt>
              <dd>{formatArsFromCents(amountDue)}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      {access.state !== "exempt" ? (
        <section className={styles.card}>
          <h2>Cómo pagar</h2>
          {paymentDestination ? (
            <>
              <dl className={styles.facts}>
                <div>
                  <dt>CVU</dt>
                  <dd className={styles.destination}>{paymentDestination.cvu}</dd>
                </div>
                <div>
                  <dt>Alias</dt>
                  <dd className={styles.destination}>{paymentDestination.alias}</dd>
                </div>
              </dl>
              <ol className={styles.steps}>
                <li>Transferí el importe exacto desde cualquier banco o billetera a este CVU o alias, que es exclusivo de tu negocio.</li>
                <li>La acreditación se registra sola; puede demorar unos minutos.</li>
                <li>Desde 10 días antes del aniversario podés pagar el período siguiente. Un importe distinto queda en revisión.</li>
              </ol>
            </>
          ) : (
            <p className={styles.meta}>
              Todavía no hay una cuenta de pago asignada a tu negocio. Tu asesor de OrderOps te la va a informar.
            </p>
          )}
        </section>
      ) : null}

      <section className={styles.card}>
        <h2>Transferencias recibidas</h2>
        {receipts.length === 0 ? (
          <p className={styles.meta}>Todavía no hay transferencias registradas.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Importe</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((receipt) => (
                <tr key={receipt.id}>
                  <td>{formatInstant(receipt.observed_at)}</td>
                  <td>{typeof receipt.gross_amount_cents === "number" ? formatArsFromCents(receipt.gross_amount_cents) : "—"}</td>
                  <td>{RECEIPT_LABELS[receipt.status] ?? "En proceso"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className={styles.card}>
        <h2>Historial de períodos</h2>
        {history.length === 0 ? (
          <p className={styles.meta}>Sin períodos registrados.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Período</th>
                <th>Precio</th>
                <th>Pagos</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr key={entry.obligation_id}>
                  <td>{entry.kind === "setup" ? "Activación (incluye el primer mes)" : formatDay(entry.period_on)}</td>
                  <td>{formatArsFromCents(entry.list_price_cents)}</td>
                  <td>
                    {entry.collections.length === 0
                      ? "Sin pago"
                      : entry.collections
                          .map((collection) =>
                            collection.status === "reversed"
                              ? `Revertido el ${formatInstant(collection.reversed_at)}`
                              : `Pagado el ${formatInstant(collection.posted_at)}`
                          )
                          .join(" · ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className={styles.card}>
        <h2>Comprobantes fiscales</h2>
        {fiscalDocuments.length === 0 ? (
          <p className={styles.meta}>Todavía no hay comprobantes emitidos.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Comprobante</th>
                <th>Fecha</th>
                <th>Importe</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {fiscalDocuments.map((document) => (
                <tr key={document.id}>
                  <td>
                    {DOCUMENT_LABELS[document.kind] ?? document.kind} {document.document_number}
                  </td>
                  <td>{formatDay(document.issued_on)}</td>
                  <td>{formatArsFromCents(document.amount_cents)}</td>
                  <td>
                    <a className={styles.link} href={`/admin/billing/documents/${document.id}`}>
                      Descargar
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

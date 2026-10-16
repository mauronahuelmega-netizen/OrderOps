import { createSupabaseServerClient } from "@/lib/supabase/server";

import { archiveOpportunity, openPrivacyRequest, resolvePrivacyRequest } from "./actions";
import styles from "./privacy-requests.module.css";

type PrivacyRequest = {
  id: string;
  subject_kind: string;
  request_kind: string;
  status: string;
  created_at: string;
};

const NOTICES: Record<string, string> = {
  ok: "La operación quedó registrada.",
  forbidden: "Este rol no puede ejecutar la operación.",
  validation: "La operación no es válida para el estado actual.",
  error: "La operación no se completó."
};

export default async function SuperAdminPrivacyPage({
  searchParams
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const notice = (await searchParams).notice;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("list_privacy_requests");
  const payload = data as { ok?: boolean; commercial_error_code?: string; requests?: PrivacyRequest[] } | null;
  const requests = payload?.ok ? payload.requests ?? [] : [];
  const loadFailed = Boolean(error) || payload?.ok !== true;

  return (
    <section className={styles.panel}>
      <h2>Solicitudes de privacidad</h2>
      <p className={styles.notice}>
        Los plazos legales de conservación no están definidos. BLK-PRIV-01 sigue abierto. Esta lista no borra comisiones, liquidaciones ni pagos.
      </p>
      {notice ? <p className={styles.notice}>{NOTICES[notice] ?? NOTICES.error}</p> : null}
      {loadFailed ? <p className={styles.empty}>No se pudieron cargar las solicitudes.</p> : null}
      {!loadFailed && requests.length === 0 ? <p className={styles.empty}>No hay solicitudes.</p> : null}
      {requests.length > 0 ? (
        <ul className={styles.list}>
          {requests.map((request) => (
            <li key={request.id}>
              {request.request_kind} · {request.status} · {request.id}
            </li>
          ))}
        </ul>
      ) : null}
      <form action={archiveOpportunity} className={styles.form}>
        <label>
          Oportunidad
          <input name="opportunityId" required />
        </label>
        <label>
          Motivo
          <input name="reason" required />
        </label>
        <button type="submit">Archivar</button>
      </form>
      <form action={openPrivacyRequest} className={styles.form}>
        <label>
          Contacto
          <input name="contactId" required />
        </label>
        <button type="submit">Abrir supresión</button>
      </form>
      <form action={resolvePrivacyRequest} className={styles.form}>
        <label>
          Solicitud
          <input name="requestId" required />
        </label>
        <label>
          Nota
          <input name="notes" required />
        </label>
        <button type="submit">Anonimizar contacto</button>
      </form>
    </section>
  );
}

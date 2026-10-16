import { createSupabaseServerClient } from "@/lib/supabase/server";

import styles from "./privacy-requests.module.css";

type PrivacyRequest = {
  id: string;
  subject_kind: string;
  request_kind: string;
  status: string;
  created_at: string;
};

export default async function SuperAdminPrivacyPage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("list_privacy_requests");
  const payload = data as { ok?: boolean; requests?: PrivacyRequest[] } | null;
  const requests = payload?.ok ? payload.requests ?? [] : [];

  return (
    <section className={styles.panel}>
      <h2>Solicitudes de privacidad</h2>
      <p className={styles.notice}>
        Los plazos legales de conservación no están definidos. BLK-PRIV-01 sigue abierto. Esta lista no borra comisiones, liquidaciones ni pagos.
      </p>
      {error || !payload?.ok ? <p className={styles.empty}>No se pudieron cargar las solicitudes.</p> : null}
      {payload?.ok && requests.length === 0 ? <p className={styles.empty}>No hay solicitudes.</p> : null}
      {requests.length > 0 ? (
        <ul className={styles.list}>
          {requests.map((request) => (
            <li key={request.id}>
              {request.request_kind} · {request.status}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

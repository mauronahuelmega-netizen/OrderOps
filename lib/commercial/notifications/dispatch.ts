import { deliverToInbucket, resolveEmailSink } from "@/lib/commercial/notifications/email-sink";

const TEMPLATES: Record<string, { title: string; body: string }> = {
  "demo.submitted": {
    title: "Nueva solicitud de demo",
    body: "Hay una solicitud nueva en el panel comercial."
  },
  "opportunity.assigned": {
    title: "Oportunidad asignada",
    body: "Una oportunidad quedó asignada."
  },
  "task.due": {
    title: "Tarea próxima o vencida",
    body: "Hay una tarea comercial que vence."
  },
  "attribution.confirmed": {
    title: "Atribución confirmada",
    body: "La atribución de una oportunidad quedó confirmada."
  },
  "attribution.rejected": {
    title: "Atribución rechazada",
    body: "La atribución de una oportunidad quedó rechazada."
  },
  "dispute.opened": {
    title: "Disputa para revisión",
    body: "Una disputa comercial necesita revisión."
  },
  "onboarding.authorized": {
    title: "Onboarding autorizado",
    body: "Un onboarding quedó autorizado."
  },
  "settlement.approved": {
    title: "Liquidación aprobada",
    body: "Una liquidación quedó aprobada."
  },
  "invoice.observed": {
    title: "Documentación observada",
    body: "La documentación de una liquidación fue observada."
  },
  "payment.recorded": {
    title: "Pago simulado registrado",
    body: "Un pago simulado quedó registrado."
  }
};

export type ClaimedOutboxEvent = {
  id: string;
  event_name: string;
  payload: { recipient_account_id?: string; email?: string };
  attempts: number;
};

export type DispatchStore = {
  claim(limit: number): Promise<ClaimedOutboxEvent[]>;
  recordInbox(eventId: string, accountId: string, title: string, body: string): Promise<void>;
  recordEmail(eventId: string, destination: string, status: "sent" | "failed", error: string | null): Promise<void>;
  release(eventId: string, outcome: "delivered" | "retry"): Promise<void>;
};

export function templateFor(eventName: string): { title: string; body: string } {
  return TEMPLATES[eventName] ?? { title: "Aviso comercial", body: "Hay un evento comercial pendiente." };
}

export async function dispatchClaimedEvents(input: {
  env: Record<string, string | undefined>;
  events: ClaimedOutboxEvent[];
  store: DispatchStore;
}): Promise<{ delivered: number; retried: number }> {
  const sink = resolveEmailSink(input.env);
  if (!sink.ok) {
    throw new Error(sink.reason);
  }

  let delivered = 0;
  let retried = 0;
  for (const event of input.events) {
    const template = templateFor(event.event_name);
    const accountId = event.payload.recipient_account_id;
    if (accountId) {
      await input.store.recordInbox(event.id, accountId, template.title, template.body);
    }

    if (sink.mode === "off") {
      await input.store.release(event.id, "delivered");
      delivered += 1;
      continue;
    }

    const recipient = event.payload.email;
    if (!recipient) {
      await input.store.release(event.id, "delivered");
      delivered += 1;
      continue;
    }

    const sent = await deliverToInbucket({
      origin: sink.origin,
      recipient,
      subject: template.title,
      body: template.body
    });
    if (sent.ok) {
      await input.store.recordEmail(event.id, recipient, "sent", null);
      await input.store.release(event.id, "delivered");
      delivered += 1;
    } else {
      await input.store.recordEmail(event.id, recipient, "failed", sent.error);
      await input.store.release(event.id, "retry");
      retried += 1;
    }
  }
  return { delivered, retried };
}

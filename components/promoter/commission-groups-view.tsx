import { formatArsFromCents } from "@/lib/commercial/money";

export type CommissionRecord = {
  amount_cents?: number;
  status?: string;
  created_at?: string | null;
  available_at?: string | null;
};

export type CommissionSlot = {
  slot?: number;
  commission?: CommissionRecord | null;
};

export type CommissionGroup = {
  business_id?: string;
  display_name?: string;
  max_recurring_slots?: number;
  setup?: CommissionRecord | null;
  slots?: CommissionSlot[];
};

function commissionInstant(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function commissionRecordText(label: string, record: CommissionRecord) {
  const created = commissionInstant(record.created_at);
  const available = commissionInstant(record.available_at);
  return [
    label,
    record.status,
    formatArsFromCents(record.amount_cents ?? 0),
    created ? `creada ${created}` : "sin fecha de creación en esta lectura",
    available ? `disponible ${available}` : "sin fecha de disponibilidad en esta lectura"
  ].join(" · ");
}

export function CommissionGroupsView({
  ready,
  businesses,
  metaClassName
}: {
  ready: boolean;
  businesses: CommissionGroup[];
  metaClassName?: string;
}) {
  return (
    <>
      <h2>Comisiones</h2>
      {!ready ? <p role="alert">No se pudieron cargar las comisiones.</p> : null}
      {ready && businesses.length === 0 ? (
        <p className={metaClassName}>No hay comercios con contrato de comisión en esta lectura.</p>
      ) : null}
      {(ready ? businesses : []).map((business) => (
        <article key={business.business_id}>
          <h3>{business.display_name}</h3>
          <p className={metaClassName}>Slots del contrato: {business.max_recurring_slots}</p>
          {business.setup ? (
            <p className={metaClassName}>{commissionRecordText("Activación", business.setup)}</p>
          ) : null}
          {(business.slots ?? []).map((slot) => (
            <p key={slot.slot} className={metaClassName}>
              {slot.commission
                ? commissionRecordText(`Slot ${slot.slot}`, slot.commission)
                : `Slot ${slot.slot}: sin comisión registrada.`}
            </p>
          ))}
        </article>
      ))}
    </>
  );
}

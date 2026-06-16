export type ScheduledDeliveryRules = {
  scheduled_min_lead_time_hours: number;
  scheduled_max_days_in_advance: number;
  scheduled_cutoff_time: string;
  inactive_working_days: number[];
};

export const DEFAULT_SCHEDULED_DELIVERY_RULES: ScheduledDeliveryRules = {
  scheduled_min_lead_time_hours: 24,
  scheduled_max_days_in_advance: 30,
  scheduled_cutoff_time: "18:00:00",
  inactive_working_days: []
};

type ScheduledDeliveryRulesInput = Partial<ScheduledDeliveryRules> | null | undefined;

function toPositiveInteger(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.trunc(parsed);
}

function toInactiveDays(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => Number(entry))
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
}

export function normalizeScheduledDeliveryRules(
  input: ScheduledDeliveryRulesInput
): ScheduledDeliveryRules {
  return {
    scheduled_min_lead_time_hours: toPositiveInteger(
      input?.scheduled_min_lead_time_hours,
      DEFAULT_SCHEDULED_DELIVERY_RULES.scheduled_min_lead_time_hours
    ),
    scheduled_max_days_in_advance: Math.max(
      1,
      toPositiveInteger(
        input?.scheduled_max_days_in_advance,
        DEFAULT_SCHEDULED_DELIVERY_RULES.scheduled_max_days_in_advance
      )
    ),
    scheduled_cutoff_time:
      typeof input?.scheduled_cutoff_time === "string" &&
      input.scheduled_cutoff_time.trim().length > 0
        ? input.scheduled_cutoff_time
        : DEFAULT_SCHEDULED_DELIVERY_RULES.scheduled_cutoff_time,
    inactive_working_days: toInactiveDays(input?.inactive_working_days)
  };
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addLocalDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return startOfLocalDay(next);
}

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return startOfLocalDay(parsed);
}

function parseCutoffMinutes(cutoffTime: string): number {
  const [hoursPart, minutesPart] = cutoffTime.slice(0, 5).split(":");
  const hours = Number.parseInt(hoursPart ?? "18", 10);
  const minutes = Number.parseInt(minutesPart ?? "0", 10);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return 18 * 60;
  }

  return hours * 60 + minutes;
}

function isPastCutoff(now: Date, cutoffTime: string): boolean {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= parseCutoffMinutes(cutoffTime);
}

function isInactiveDay(date: Date, inactiveDays: number[]): boolean {
  return inactiveDays.includes(date.getDay());
}

function advancePastInactiveDays(date: Date, inactiveDays: number[]): Date {
  let candidate = startOfLocalDay(date);
  let guard = 0;

  while (isInactiveDay(candidate, inactiveDays) && guard < 366) {
    candidate = addLocalDays(candidate, 1);
    guard += 1;
  }

  return candidate;
}

export function computeMinDeliveryDate(
  rulesInput: ScheduledDeliveryRulesInput,
  now: Date = new Date()
): string {
  const rules = normalizeScheduledDeliveryRules(rulesInput);
  const leadTimeMs = rules.scheduled_min_lead_time_hours * 60 * 60 * 1000;
  let candidate = startOfLocalDay(new Date(now.getTime() + leadTimeMs));

  if (isPastCutoff(now, rules.scheduled_cutoff_time)) {
    const tomorrow = addLocalDays(now, 1);

    if (candidate.getTime() <= tomorrow.getTime()) {
      candidate = addLocalDays(tomorrow, 1);
    }
  }

  candidate = advancePastInactiveDays(candidate, rules.inactive_working_days);

  return formatIsoDate(candidate);
}

export function computeMaxDeliveryDate(
  rulesInput: ScheduledDeliveryRulesInput,
  now: Date = new Date()
): string {
  const rules = normalizeScheduledDeliveryRules(rulesInput);
  return formatIsoDate(addLocalDays(now, rules.scheduled_max_days_in_advance));
}

export function isDeliveryDateSelectable(
  deliveryDate: string,
  rulesInput: ScheduledDeliveryRulesInput,
  now: Date = new Date()
): boolean {
  const rules = normalizeScheduledDeliveryRules(rulesInput);
  const parsedDate = parseIsoDate(deliveryDate);

  if (!parsedDate) {
    return false;
  }

  const minDate = parseIsoDate(computeMinDeliveryDate(rules, now));
  const maxDate = parseIsoDate(computeMaxDeliveryDate(rules, now));

  if (!minDate || !maxDate) {
    return false;
  }

  if (parsedDate.getTime() < minDate.getTime() || parsedDate.getTime() > maxDate.getTime()) {
    return false;
  }

  return !isInactiveDay(parsedDate, rules.inactive_working_days);
}

export function getScheduledDeliveryDateError(
  deliveryDate: string,
  rulesInput: ScheduledDeliveryRulesInput,
  now: Date = new Date()
): string | null {
  if (isDeliveryDateSelectable(deliveryDate, rulesInput, now)) {
    return null;
  }

  const rules = normalizeScheduledDeliveryRules(rulesInput);
  const parsedDate = parseIsoDate(deliveryDate);

  if (!parsedDate) {
    return "Seleccioná una fecha de entrega válida.";
  }

  if (isInactiveDay(parsedDate, rules.inactive_working_days)) {
    return "Ese día el negocio no opera. Elegí otra fecha.";
  }

  const minDate = computeMinDeliveryDate(rules, now);
  const maxDate = computeMaxDeliveryDate(rules, now);

  if (deliveryDate < minDate) {
    return "La fecha elegida no cumple el tiempo mínimo de anticipación o ya pasó la hora de corte.";
  }

  if (deliveryDate > maxDate) {
    return `Solo podés programar pedidos hasta ${maxDate}.`;
  }

  return "La fecha de entrega no está disponible.";
}

export type FounderPeriodDecision =
  | { ok: true; periodKey: string }
  | { ok: false; code: "included_period" | "validation" };

function utcDate(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day));
}

function formatUtc(value: Date): string {
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${value.getUTCFullYear()}-${month}-${day}`;
}

function readDate(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = utcDate(year, month - 1, day);
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

export function founderPeriodOn(serviceStartedOn: string, offset: number): string | null {
  const started = readDate(serviceStartedOn);
  if (!started || !Number.isInteger(offset) || offset < 0) {
    return null;
  }
  const monthCursor = utcDate(started.year, started.month - 1 + offset, 1);
  const year = monthCursor.getUTCFullYear();
  const monthIndex = monthCursor.getUTCMonth();
  const daysInMonth = utcDate(year, monthIndex + 1, 0).getUTCDate();
  return formatUtc(utcDate(year, monthIndex, Math.min(started.day, daysInMonth)));
}

export function founderMonthlyDueDates(serviceStartedOn: string, count: number): string[] {
  const dates: string[] = [];
  for (let offset = 1; offset <= count; offset += 1) {
    const due = founderPeriodOn(serviceStartedOn, offset);
    if (!due) {
      break;
    }
    dates.push(due);
  }
  return dates;
}

export function decideFounderSubscriptionPeriod(
  serviceStartedOn: string,
  periodKey: string
): FounderPeriodDecision {
  const started = readDate(serviceStartedOn);
  const period = readDate(periodKey.trim());
  if (!started || !period) {
    return { ok: false, code: "validation" };
  }
  if (periodKey.trim() === serviceStartedOn) {
    return { ok: false, code: "included_period" };
  }
  const months = (period.year - started.year) * 12 + (period.month - started.month);
  if (months < 1 || founderPeriodOn(serviceStartedOn, months) !== periodKey.trim()) {
    return { ok: false, code: "validation" };
  }
  return { ok: true, periodKey: periodKey.trim() };
}

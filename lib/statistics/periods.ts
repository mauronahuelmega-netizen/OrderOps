import type { PeriodInput, ResolvedPeriod, DateRange } from './contracts';
const DAY = 86400000; // calendar arithmetic in UTC representation, NOT local-day duration
export function parseDate(date: string): string {
  if (!/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) throw new Error('Invalid commercial date');
  return date;
}
export function instant(value: string): number {
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) throw new Error('Timestamp requires an explicit offset');
  return Date.parse(value);
}
export function addDays(date: string, days: number): string {
  if (!Number.isSafeInteger(days)) throw new Error('Invalid calendar displacement');
  return parseDate(new Date(Date.parse(`${parseDate(date)}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10));
}
export function dayDistance(start: string, end: string): number { return (Date.parse(`${parseDate(end)}T00:00:00Z`) - Date.parse(`${parseDate(start)}T00:00:00Z`)) / DAY; }
function formatter(timezone: string) {
  if (!timezone) throw new Error('missing_timezone');
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
}
function fields(epoch: number, timezone: string): Record<string, string> {
  return Object.fromEntries(formatter(timezone).formatToParts(new Date(epoch)).filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
}
export function localDate(asOf: string, timezone: string): string {
  const p = fields(instant(asOf), timezone);
  return parseDate(`${p.year.padStart(4, '0')}-${p.month}-${p.day}`);
}
/** Reject DST gaps/ambiguity rather than silently choosing an offset. */
export function localInstant(date: string, time: string, timezone: string): string {
  parseDate(date);
  if (!/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(time)) throw new Error('Invalid local time');
  const wanted = `${date}T${time}`, base = Date.parse(`${wanted}Z`), offsets = new Set<number>();
  for (let hour = -36; hour <= 36; hour += 6) {
    const sample = base + hour * 3600000, p = fields(sample, timezone);
    offsets.add(Date.parse(`${p.year.padStart(4, '0')}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`) - sample);
  }
  const candidates = [...offsets].map(offset => base - offset).filter(epoch => {
    const p = fields(epoch, timezone);
    return `${p.year.padStart(4, '0')}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}` === wanted;
  });
  if (candidates.length !== 1) throw new Error(candidates.length ? 'Ambiguous local time' : 'Nonexistent local time');
  return new Date(candidates[0]).toISOString();
}
function monthStart(date: string) { return `${date.slice(0, 7)}-01`; }
export function resolvePeriod(input: PeriodInput, context: { asOf: string; timezone: string; activeCommercialDate?: string }): ResolvedPeriod {
  const civil = localDate(context.asOf, context.timezone);
  const reference = context.activeCommercialDate ? parseDate(context.activeCommercialDate) : civil;
  let start = reference, end = reference;
  const month = monthStart(reference), previousMonth = monthStart(addDays(month, -1));
  switch (input.preset) {
    case 'today': break;
    case 'yesterday': start = end = addDays(reference, -1); break;
    case 'this_week': start = addDays(reference, -((new Date(`${reference}T00:00:00Z`).getUTCDay() + 6) % 7)); break;
    case 'this_month': start = month; break;
    case 'previous_month': start = previousMonth; end = addDays(month, -1); break;
    case 'last_7_days': start = addDays(reference, -6); break;
    case 'last_30_days': start = addDays(reference, -29); break;
    case 'custom':
      if (!input.startDate || !input.endDate) throw new Error('Both custom dates are required');
      start = parseDate(input.startDate); end = parseDate(input.endDate);
      if (end > (civil > reference ? civil : reference)) throw new Error('Future period');
      break;
    default: throw new Error('Unknown period preset');
  }
  if (end < start) throw new Error('Inverted period');
  const days = dayDistance(start, end) + 1;
  const partial = end >= reference;
  let comparable: DateRange | null = null;
  let comparableReason: string | null = null;
  try { comparable = { startDate: addDays(start, -days), endDate: addDays(end, -days) }; }
  catch { comparableReason = 'previous_interval_out_of_range'; }
  if (input.preset === 'this_week') comparable = { startDate: addDays(start, -7), endDate: addDays(end, -7) };
  if (input.preset === 'this_month') {
    const target = addDays(previousMonth, dayDistance(month, end));
    if (target.slice(0, 7) !== previousMonth.slice(0, 7)) { comparable = null; comparableReason = 'previous_month_too_short'; }
    else comparable = { startDate: previousMonth, endDate: target };
  }
  if (input.preset === 'last_7_days' || input.preset === 'last_30_days') {
    const shift = input.preset === 'last_7_days' ? 7 : 30;
    comparable = { startDate: addDays(start, -shift), endDate: addDays(end, -shift) };
  }
  return { preset: input.preset, startDate: start, endDate: end, referenceDate: reference, asOf: new Date(instant(context.asOf)).toISOString(), timezone: context.timezone, partial, granularity: days === 1 ? 'hour' : days <= 31 ? 'day' : days <= 180 ? 'week' : 'month', comparable, comparableReason };
}

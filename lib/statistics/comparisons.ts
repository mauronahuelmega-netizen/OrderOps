import type { ComparablePlan, DateRange, Delta, Metric, ResolvedPeriod, SessionEvidence } from './contracts';
import { roundedDivide, signedCents, decimal } from './money';
import { trustworthy } from './quality';
import { addDays, dayDistance, instant } from './periods';
export function delta(current: Metric, previous: Metric): Delta {
  if (!trustworthy(current) || !trustworthy(previous)) return { absolute: null, percentage: null, reason: 'unavailable' };
  const now = signedCents(current.value!), before = signedCents(previous.value!);
  if (before < BigInt(0)) throw new Error('Negative comparison base');
  const absolute = decimal(now - before);
  return before === BigInt(0) ? { absolute, percentage: null, reason: 'no_base' } : { absolute, percentage: decimal(roundedDivide((now - before) * BigInt(10000), before)), reason: null };
}
const inside = (date: string, range: DateRange) => date >= range.startDate && date <= range.endDate;
/** Closed intervals need complete business dates. Open intervals pair session ordinals. */
export function comparableSessions(period: ResolvedPeriod, sessions: SessionEvidence[]): ComparablePlan {
  if (!period.comparable) return { available: false, reason: period.comparableReason, segments: [] };
  if (new Set(sessions.map(s => s.id)).size !== sessions.length) throw new Error('Duplicate session');
  const current = sessions.filter(s => inside(s.commercialDate, period));
  const previous = sessions.filter(s => inside(s.commercialDate, period.comparable!));
  if ([...current, ...previous].some(s => !s.verified)) return { available: false, reason: 'unverified_session', segments: [] };
  if (!period.partial) return { available: ![...current, ...previous].some(s => s.closedAt === null), reason: [...current, ...previous].some(s => s.closedAt === null) ? 'open_historical_session' : null, segments: [] };
  const result: ComparablePlan = { available: true, reason: null, segments: [] };
  const shift = dayDistance(period.startDate, period.comparable.startDate);
  const order = (a: SessionEvidence, b: SessionEvidence) => instant(a.openedAt) - instant(b.openedAt) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  for (let date = period.startDate; date <= period.endDate; date = addDays(date, 1)) {
    const a = current.filter(s => s.commercialDate === date).sort(order);
    const b = previous.filter(s => s.commercialDate === addDays(date, shift)).sort(order);
    if (a.length !== b.length) return { available: false, reason: 'unmatched_sessions', segments: [] };
    for (let i = 0; i < a.length; i++) {
      const until = a[i].closedAt ?? period.asOf;
      const elapsed = instant(until) - instant(a[i].openedAt);
      if (elapsed < 0) throw new Error('Session closes before opening');
      if (b[i].closedAt === null) return { available: false, reason: 'open_previous_session', segments: [] };
      const previousUntil = a[i].closedAt ? b[i].closedAt! : new Date(instant(b[i].openedAt) + elapsed).toISOString();
      if (instant(previousUntil) > instant(b[i].closedAt!) || instant(previousUntil) > instant(period.asOf)) return { available: false, reason: 'previous_session_too_short', segments: [] };
      result.segments.push({ currentSessionId: a[i].id, previousSessionId: b[i].id, currentUntil: new Date(instant(until)).toISOString(), previousUntil: new Date(instant(previousUntil)).toISOString() });
    }
  }
  return result;
}

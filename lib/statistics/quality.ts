import type { Indicators, Metric, QualityReason } from './contracts';
import { cents, decimal, roundedDivide } from './money';
export interface KnownCompletion { sales: string | null; mainUnits: number | null; reasons: QualityReason[] }
export function metric(value: string | null, knownCount: number, unknownCount: number, reasons: QualityReason[]): Metric {
  const quality = unknownCount > 0 ? knownCount > 0 ? 'partial' : 'unavailable' : knownCount === 0 ? 'empty' : 'exact';
  return { value, knownCount, unknownCount, quality, reasons: [...new Set(reasons)] };
}
export function indicators(rows: KnownCompletion[], historicalWithoutDate = 0): Indicators {
  if (!Number.isSafeInteger(historicalWithoutDate) || historicalWithoutDate < 0) throw new Error('Invalid coverage');
  const count = rows.length;
  const dateReasons: QualityReason[] = historicalWithoutDate ? ['missing_completion'] : [];
  let sales = BigInt(0), units = 0, knownSales = 0, knownUnits = 0;
  for (const row of rows) {
    if (row.sales !== null) { sales += cents(row.sales); knownSales++; }
    if (row.mainUnits !== null) {
      if (!Number.isSafeInteger(row.mainUnits) || row.mainUnits < 0) throw new Error('Invalid main units');
      units += row.mainUnits;
      if (!Number.isSafeInteger(units)) throw new Error('Unit overflow');
      knownUnits++;
    }
  }
  const salesUnknown = count - knownSales + historicalWithoutDate;
  const unitsUnknown = count - knownUnits + historicalWithoutDate;
  const empty = count === 0 && historicalWithoutDate === 0;
  const countMetric = metric(count > 0 || empty ? String(count) : null, count, historicalWithoutDate, dateReasons);
  const saleMetric = metric(knownSales > 0 || empty ? decimal(sales) : null, knownSales, salesUnknown, [...dateReasons, ...rows.flatMap(r => r.sales === null ? r.reasons : [])]);
  const unitMetric = metric(knownUnits > 0 || empty ? String(units) : null, knownUnits, unitsUnknown, [...dateReasons, ...rows.flatMap(r => r.mainUnits === null ? r.reasons : [])]);
  const ticket = count > 0 && salesUnknown === 0 ? decimal(roundedDivide(sales, BigInt(count))) : null;
  return { completedOrders: countMetric, sales: saleMetric, mainUnits: unitMetric, averageTicket: { ...saleMetric, value: ticket, quality: empty ? 'empty' : ticket === null ? 'unavailable' : 'exact' } };
}
export function trustworthy(value: Metric): boolean { return (value.quality === 'exact' || value.quality === 'empty') && value.value !== null; }

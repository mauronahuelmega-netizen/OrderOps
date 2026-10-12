import type { Decimal } from './contracts';
const ZERO = BigInt(0), HUNDRED = BigInt(100);
/** Exact, non-negative currency input. No exponent, rounding, null coercion or floats. */
export function cents(value: Decimal): bigint {
  if (!/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(value)) throw new Error('Invalid commercial amount');
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole) * HUNDRED + BigInt(fraction.padEnd(2, '0'));
}
export function decimal(value: bigint): Decimal {
  const sign = value < ZERO ? '-' : '';
  const abs = value < ZERO ? -value : value;
  return `${sign}${abs / HUNDRED}.${(abs % HUNDRED).toString().padStart(2, '0')}`;
}
export function signedCents(value: Decimal): bigint { return value.startsWith('-') ? -cents(value.slice(1)) : cents(value); }
export function roundedDivide(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= ZERO) throw new Error('Invalid denominator');
  const abs = numerator < ZERO ? -numerator : numerator;
  const result = (abs + denominator / BigInt(2)) / denominator;
  return numerator < ZERO ? -result : result;
}
export interface AllocationLine { id: string; gross: Decimal }
/** Caller must supply identified products-net, not an unexplained agreed-total difference. */
export function allocateIdentifiedProductsNet(net: Decimal, lines: AllocationLine[]): Array<{ id: string; net: Decimal }> {
  if (new Set(lines.map(l => l.id)).size !== lines.length) throw new Error('Duplicate allocation identity');
  const amount = cents(net), weights = lines.map(l => cents(l.gross));
  const total = weights.reduce((a, b) => a + b, ZERO);
  if (total === ZERO) {
    if (amount !== ZERO) throw new Error('Positive amount without distribution base');
    return lines.map(l => ({ id: l.id, net: '0.00' }));
  }
  const rows = lines.map((l, index) => ({ id: l.id, value: amount * weights[index] / total, remainder: amount * weights[index] % total }));
  let residue = amount - rows.reduce((a, b) => a + b.value, ZERO);
  const ranked = [...rows].sort((a, b) => a.remainder === b.remainder ? (a.id < b.id ? -1 : a.id > b.id ? 1 : 0) : a.remainder > b.remainder ? -1 : 1);
  for (const row of ranked) { if (residue === ZERO) break; row.value += BigInt(1); residue -= BigInt(1); }
  return rows.map(row => ({ id: row.id, net: decimal(row.value) }));
}

import { signedCents, decimal } from './money';
import { formatSummaryDecimal, type presentStatisticsSummary } from './summary-presenter';

export type SummaryView = ReturnType<typeof presentStatisticsSummary>;
/** Display geometry only. Exact amounts remain strings; only bounded pixel ratios become Number. */
export function summaryChartGeometry(rows: SummaryView['series'], money: boolean, availableWidth = 640) {
  const width = Math.max(280, availableWidth), height = 280, left = 72, right = 20, top = 24, bottom = 42;
  const values = rows.flatMap(p => [p.current?.metric.exactValue, p.previous?.metric.exactValue]).filter((v): v is string => v !== null && v !== undefined).map(signedCents);
  const peak = values.reduce((a, b) => b > a ? b : a, BigInt(0));
  const maximum = peak === BigInt(0) ? BigInt(100) : peak;
  const y = (value: string) => height - bottom - Number(signedCents(value) * BigInt(100000) / maximum) / 100000 * (height - bottom - top);
  const points = rows.map((row, ordinal) => ({ key: row.key, x: left + (rows.length <= 1 ? .5 : ordinal / (rows.length - 1)) * (width - left - right),
    currentY: row.current?.metric.exactValue == null ? null : y(row.current.metric.exactValue),
    previousY: row.previous?.metric.exactValue == null ? null : y(row.previous.metric.exactValue) }));
  const path = (side: 'currentY' | 'previousY') => {
    let connected = false;
    return points.map(p => { if (p[side] === null) { connected = false; return ''; } const prefix = connected ? 'L' : 'M'; connected = true; return `${prefix}${p.x.toFixed(3)},${p[side]!.toFixed(3)}`; }).join(' ');
  };
  const ticks = [0, 1, 2, 3].map(n => ({ y: height - bottom - n / 3 * (height - bottom - top), label: formatSummaryDecimal(decimal(maximum * BigInt(n) / BigInt(3)), money) }));
  return { width, height, left, right, top, bottom, points, ticks, maximumLabel:formatSummaryDecimal(decimal(maximum),money), currentPath: path('currentY'), previousPath: path('previousY') };
}

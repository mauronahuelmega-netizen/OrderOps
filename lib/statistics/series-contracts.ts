/** Statistics-owned additive series contract; Phase 02 fields remain unchanged. */
import type { Indicators, StatisticsReadyResponse } from './contracts';
export const STATISTICS_SERIES_CONTRACT_VERSION = 'statistics.series.v1' as const;
export type MetricKey = keyof Indicators;
export type AlignmentReason = 'root_comparison_unavailable' | 'missing_counterpart' |
  'duration_mismatch' | 'ambiguous_wall_time' | 'nonexistent_wall_time' |
  'interval_out_of_range' | 'timezone_changed' | 'unverified_session' | 'metric_quality' | 'empty_average';
export interface InstantSlice {
  sessionId: string | null;
  /** Frozen snapshot timezone; outside-session uses its recorded timezone. */
  timezone: string;
  commercialDate: string;
  /** Inclusive end date for a grouped outside-session observation slice. */
  endCommercialDate?: string;
  start: string;
  end: string;
  endInclusive: boolean;
}
export interface SeriesInterval {
  key: string;
  startDate: string;
  endDate: string;
  /** Logical date membership; slices qualify observation time, not attribution. */
  slices: InstantSlice[];
  observation: 'closed' | 'partial';
}
export interface PointComparison {
  available: boolean;
  reason: AlignmentReason | null;
  absolute: string | null;
  percentage: string | null;
  percentageReason: 'no_base' | null;
}
export interface SeriesPoint {
  key: string;
  label: string;
  basis: 'commercial_date' | 'session_elapsed' | 'outside_session_wall';
  mapping:
    | { kind: 'date_offset'; days: number; sessions?: Array<{ currentSessionId: string; previousSessionId: string; ordinal: number }> }
    | { kind: 'session_elapsed'; ordinal: number; startSeconds: string; endSeconds: string }
    | { kind: 'wall_clock'; wallStart: string; wallEnd: string; timezone: string };
  current: { interval: SeriesInterval; metrics: Indicators } | null;
  previous: { interval: SeriesInterval; metrics: Indicators } | null;
  /** True only for verified equal observation windows, independent of monetary quality. */
  alignment: { available: boolean; reason: AlignmentReason | null };
  comparisons: Record<MetricKey, PointComparison>;
}
export interface ComparativeSeries {
  version: typeof STATISTICS_SERIES_CONTRACT_VERSION;
  snapshot: { revision: string; asOf: string };
  resolution: 'hour' | 'day' | 'week' | 'month';
  resolutionReason: 'point_limit' | 'unverifiable_hour_exposure' | null;
  /** Null when previous cohort not admitted by the unchanged root gate. */
  previousRange: { startDate: string; endDate: string } | null;
  coverage: { historicalWithoutDate: number; scope: 'global_unassigned' };
  /** Additional strict total exposure gate; legacy comparison is left unchanged. */
  totalAlignment: { available: boolean; reason: AlignmentReason | null };
  totalComparisons: Record<MetricKey, PointComparison>;
  points: SeriesPoint[];
}
export type StatisticsSeriesReadyResponse = StatisticsReadyResponse & { series: ComparativeSeries };

export type StatisticsSeriesResponse = StatisticsSeriesReadyResponse | Extract<import('./contracts').StatisticsResponse, { status: 'configuration_required' }>;

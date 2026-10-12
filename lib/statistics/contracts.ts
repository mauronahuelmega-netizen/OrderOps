/** Statistics-owned contract. No extension of the shared generated Database type. */
export const STATISTICS_CONTRACT_VERSION = 'statistics.v1' as const;
export type Decimal = string;
export type CommercialDate = string;
export type Quality = 'exact' | 'partial' | 'unavailable' | 'empty';
export type QualityReason = 'missing_completion' | 'missing_timezone' | 'unverified_session' | 'missing_agreement' | 'unresolved_breakdown' | 'agreement_changed_after_completion' | 'missing_composition' | 'missing_identity' | 'missing_category' | 'incomplete_comparable' | 'source_conflict';
export type PeriodPreset = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'previous_month' | 'last_7_days' | 'last_30_days' | 'custom';
export interface PeriodInput { preset: PeriodPreset; startDate?: CommercialDate; endDate?: CommercialDate }
export interface DateRange { startDate: CommercialDate; endDate: CommercialDate }
export interface ResolvedPeriod extends DateRange { preset: PeriodPreset; referenceDate: CommercialDate; asOf: string; timezone: string; partial: boolean; granularity: 'hour' | 'day' | 'week' | 'month'; comparable: DateRange | null; comparableReason: string | null }
export interface Metric { value: Decimal | null; quality: Quality; reasons: QualityReason[]; knownCount: number; unknownCount: number }
export interface Indicators { sales: Metric; completedOrders: Metric; averageTicket: Metric; mainUnits: Metric }
export interface Delta { absolute: Decimal | null; percentage: Decimal | null; reason: 'no_base' | 'unavailable' | null }
export interface SessionEvidence { id: string; commercialDate: CommercialDate; openedAt: string; closedAt: string | null; verified: boolean }
export interface ComparableSegment { currentSessionId: string; previousSessionId: string; currentUntil: string; previousUntil: string }
export interface ComparablePlan { available: boolean; reason: string | null; segments: ComparableSegment[] }
export interface ProductAggregate { identity: string | null; label: string; mainUnits: number | null; netAmount: Decimal | null; quality: Quality }
export interface CategoryAggregate { identity: string | null; label: string; amount: Decimal; percentage: Decimal | null }
export interface ProductCursor { offset: number; revision: string; requestKey: string; asOf: string }
export interface StatisticsReadyResponse {
  contractVersion: typeof STATISTICS_CONTRACT_VERSION; status: 'ready'; businessId: string;
  currency: 'ARS'; timezone: string; period: ResolvedPeriod; revision: string;
  coverage: { historicalWithoutDate: number; outsideSession: number; instrumentedAt: string | null };
  metrics: Indicators; previousMetrics: Indicators | null;
  comparison: ComparablePlan; buckets: Array<{ label: string; metrics: Indicators }>;
  products: { items: ProductAggregate[]; nextCursor: ProductCursor | null };
  categories: CategoryAggregate[];
  unattributed: { pendingAgreedTotal: Decimal | null; unresolvedOrders: number };
  ruleEvidence: { products: Array<{ identity: string; currentMainUnits: number | null; previousMainUnits: number | null }> };
}
export type StatisticsResponse = StatisticsReadyResponse | { contractVersion: typeof STATISTICS_CONTRACT_VERSION; status: 'configuration_required'; businessId: string; reason: 'missing_timezone' };
export interface StatisticsRpcArgs { p_period: PeriodPreset; p_start_date?: CommercialDate; p_end_date?: CommercialDate; p_product_sort?: 'units' | 'amount'; p_limit?: number; p_cursor?: ProductCursor }
export interface StatisticsReadClient { rpc(name: 'statistics_v1_summary', args: StatisticsRpcArgs): PromiseLike<{ data: unknown; error: { message: string; code?: string } | null }> }

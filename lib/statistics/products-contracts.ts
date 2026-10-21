import type { PeriodPreset, ProductCursor, Quality } from './contracts';
export interface ProductsRpcArgs { p_period:PeriodPreset; p_start_date?:string; p_end_date?:string; p_product_sort?:'units'|'amount'; p_limit?:number; p_cursor?:ProductCursor }
export interface ProductsReadClient { rpc(name:'statistics_v1_products',args:ProductsRpcArgs):PromiseLike<{data:unknown;error:{message:string;code?:string}|null}> }
export const PRODUCTS_MAX_PAGE_SIZE=20;
export interface ProductMetric { value: string | null; quality: Quality; knownCount: number; unknownCount: number; missingCapturedOrders: number; reasons: Array<'unverified_lines'|'historical_without_date'|'uncaptured_orders'> }
export type HistoricalCategoryKind = 'verified'|'uncategorized_verified'|'attribution_unknown';
export interface ProductCategoryRef { kind: HistoricalCategoryKind; identity: string | null }
export interface ProductRow { key: string; identity: string; label: string; position: number; catalogStatus: 'historical'; units: ProductMetric; revenue: ProductMetric; unitShare: string|null; revenueShare: string|null; categories: ProductCategoryRef[] }
export interface ProductCategoryRow extends ProductCategoryRef { key: string; label: string; units: ProductMetric; revenue: ProductMetric; unitShare: string|null; revenueShare: string|null }
export interface ProductsReadyResponse {
 version:'statistics.products.v1';status:'ready';businessId:string;currency:'ARS';revision:string;
 period:{preset:PeriodPreset;startDate:string;endDate:string;referenceDate:string;timezone:string;asOf:string;partial:boolean};
 totals:{units:ProductMetric;revenue:ProductMetric};
 denominators:{scope:'verified_lines_in_period';units:string|null;revenue:string|null;unitComplete:boolean;revenueComplete:boolean};
 coverage:{eligibleOrders:number;capturedLines:number;ordersWithoutCapturedLines:number;historicalWithoutDate:number;historicalScope:'global_unassigned';outsideSession:number;unknownProductLines:number;unknownCategoryLines:number;unresolvedOrders:number;pendingAgreedTotal:string|null};
 unidentified:{units:ProductMetric;revenue:ProductMetric};
 ranking:{sort:'units'|'amount';totalProducts:number;items:ProductRow[];nextCursor:ProductCursor|null};
 categories:ProductCategoryRow[];
}
export type ProductsResponse=ProductsReadyResponse|{version:'statistics.products.v1';status:'configuration_required';businessId:string;reason:'missing_timezone'};

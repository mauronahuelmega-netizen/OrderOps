import type { StatisticsReadClient } from './contracts';
import type { StatisticsSeriesResponse } from './series-contracts';
import { StatisticsReadError } from './read';
import { verifyStatisticsPrincipal } from './summary-principal';
import { StatisticsSeriesReadError, readStatisticsSeries } from './series-read';
import { SummaryPeriodError,parseSummaryPeriod,summaryPeriodKey,summaryRpcArgs } from './summary-period';
export type SummaryErrorCode='unauthenticated'|'forbidden'|'not_published'|'invalid_period'|'timeout'|'query_failed'|'invalid_response'|'series_unavailable';
export const SUMMARY_ERRORS: Record<SummaryErrorCode,string>={
  unauthenticated:'Iniciá sesión para consultar Estadísticas.',forbidden:'No tenés permisos para consultar Estadísticas.',
  not_published:'Estadísticas todavía no está disponible.',
  invalid_period:'Revisá el período y las fechas seleccionadas.',timeout:'La consulta tardó demasiado. Podés volver a intentar.',
  query_failed:'No pudimos consultar las estadísticas. Podés volver a intentar.',invalid_response:'No pudimos validar los datos recibidos.',
  series_unavailable:'La serie comparativa no está disponible.',
};
export interface SummaryScope { userId:string;businessId:string }
export type SummaryResult = {ok:true;scope:SummaryScope;periodKey:string;data:StatisticsSeriesResponse}|
  {ok:false;code:SummaryErrorCode;message:string;retryable:boolean};
/** Narrow owned adapter. No extension of shared Database/generated types. */
export interface SummaryAuthenticatedClient extends StatisticsReadClient {
  auth:{getUser():PromiseLike<{data:{user:{id:string}|null};error:unknown}>};
  from(name:'profiles'):{select(columns:'business_id,role'):{eq(column:'id',id:string):{maybeSingle():PromiseLike<{data:unknown;error:unknown}>}}};
}
export function summaryFailure(code:SummaryErrorCode):Extract<SummaryResult,{ok:false}>{
  return {ok:false,code,message:SUMMARY_ERRORS[code],retryable:['timeout','query_failed','invalid_response','series_unavailable'].includes(code)};
}
class QueryTimeout extends Error {}
class InvalidRange extends Error {}
/** One authenticated RPC; no legacy query, per-bucket queries, retries, polling or cache. */
export async function readAuthenticatedSummary(client:SummaryAuthenticatedClient,search:string,publication:(scope:SummaryScope)=>boolean=()=>false):Promise<SummaryResult>{
  try{
    const period=parseSummaryPeriod(search);
    const access=await verifyStatisticsPrincipal(client);
    if(access.status!=='allowed')return summaryFailure(access.status==='error'?'query_failed':access.status);
    if(!publication(access.scope))return summaryFailure('not_published');
    const principal={businessId:access.scope.businessId,role:access.role};
    const rpc:StatisticsReadClient={rpc:async(name,args)=>{
      const result=await client.rpc(name,args);
      if(result.error&&['57014','ETIMEDOUT'].includes(result.error.code??''))throw new QueryTimeout();
      if(result.error?.code==='22023'&&result.error.message.includes('STATISTICS_INVALID_RANGE'))throw new InvalidRange();
      return result;
    }};
    const data=await readStatisticsSeries(rpc,summaryRpcArgs(period),principal);
    // Both period dates and tenant must belong to the authenticated request.
    if(data.status==='ready'&&(data.period.preset!==period.preset||period.preset==='custom'&&(data.period.startDate!==period.startDate||data.period.endDate!==period.endDate)))return summaryFailure('invalid_response');
    return {ok:true,scope:access.scope,periodKey:summaryPeriodKey(period),data};
  }catch(error){
    if(error instanceof SummaryPeriodError)return summaryFailure('invalid_period');
    if(error instanceof InvalidRange)return summaryFailure('invalid_period');
    if(error instanceof QueryTimeout || error instanceof Error&&error.name==='TimeoutError')return summaryFailure('timeout');
    if(error instanceof StatisticsSeriesReadError)return summaryFailure(error.code);
    if(error instanceof StatisticsReadError)return summaryFailure(error.code==='forbidden'?'forbidden':error.code==='invalid_response'?'invalid_response':'query_failed');
    return summaryFailure('query_failed');
  }
}

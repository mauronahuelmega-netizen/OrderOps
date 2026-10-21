import type { PeriodInput } from './contracts';
import type { MetricKey,StatisticsSeriesResponse } from './series-contracts';
import { parseSummaryPeriod,serializeSummaryPeriod,summaryPeriodKey } from './summary-period';
import { SUMMARY_METRICS,presentStatisticsSummary } from './summary-presenter';
import { summaryFailure,type SummaryResult,type SummaryScope } from './summary-transport';
import { decodeStatisticsSeriesResponse } from './series-read';
type Failure=Extract<SummaryResult,{ok:false}>;
export type SummaryQueryState={status:'idle'}|{status:'loading';period:PeriodInput;periodKey:string}|
  {status:'error';search:string;error:Failure}|{status:'ready';periodKey:string;data:StatisticsSeriesResponse};
/** One controller per authenticated screen. Pending-only dedupe, no shared/resolved cache or polling. */
export class SummaryQueryController {
  private state:SummaryQueryState={status:'idle'};
  private sequence=0;private generation=0;
  private pending=new Map<string,Promise<SummaryQueryState>>();
  private listeners=new Set<()=>void>();
  private metric:MetricKey='sales';private point:string|null=null;
  private snapshot={...this.state,selectedMetric:this.metric,selectedPointKey:this.point} as SummaryQueryState & {selectedMetric:MetricKey;selectedPointKey:string|null};
  constructor(private scope:SummaryScope,private load:(search:string)=>Promise<SummaryResult>){this.scope={...scope};}
  getSnapshot=()=>this.snapshot;
  subscribe=(listener:()=>void)=>{this.listeners.add(listener);return ()=>{this.listeners.delete(listener);};};
  private emit(){this.snapshot={...this.state,selectedMetric:this.metric,selectedPointKey:this.point};for(const listener of this.listeners)listener();}
  private set(state:SummaryQueryState){this.state=state;this.emit();}
  /** Auth context changes drop data and invalidate every old request, including same-period replies. */
  setScope(scope:SummaryScope){
    if(this.scope.userId===scope.userId&&this.scope.businessId===scope.businessId)return;
    this.scope={...scope};this.generation++;this.sequence++;this.pending.clear();this.point=null;this.set({status:'idle'});
  }
  selectMetric(key:MetricKey){if(!SUMMARY_METRICS.includes(key))throw new Error('Unknown metric');this.metric=key;this.emit();}
  selectPoint(key:string|null){
    if(key!==null&&(this.state.status!=='ready'||this.state.data.status!=='ready'||!this.state.data.series.points.some(p=>p.key===key)))throw new Error('Unknown point');
    this.point=key;this.emit();
  }
  present(){
    if(this.state.status!=='ready')return {status:this.state.status,...(this.state.status==='error'?{error:this.state.error}:{})};
    if(this.state.data.status==='configuration_required')return {status:'configuration_required',message:'Configurá la zona horaria del negocio para consultar Estadísticas.'};
    return {status:'ready',...presentStatisticsSummary(this.state.data,this.metric,this.point)};
  }
  query(search:string,refresh=false):Promise<SummaryQueryState>{
    let period:PeriodInput,key:string;
    try{period=parseSummaryPeriod(search);key=summaryPeriodKey(period);}catch{
      this.sequence++;this.point=null;this.set({status:'error',search,error:summaryFailure('invalid_period')});return Promise.resolve(this.state);
    }
    if(!refresh&&this.state.status==='ready'&&this.state.periodKey===key)return Promise.resolve(this.state);
    const sequence=++this.sequence,generation=this.generation;this.point=null;
    this.set({status:'loading',period,periodKey:key});
    let task=this.pending.get(key);
    if(!task){
      // Defer loader until pending registration: synchronous failures also become explicit errors.
      task=Promise.resolve().then(()=>this.load(serializeSummaryPeriod(period))).then(result=>{
        if(!result.ok)return {status:'error',search,error:result} as SummaryQueryState;
        if(result.periodKey!==key||result.scope.userId!==this.scope.userId||result.scope.businessId!==this.scope.businessId)return {status:'error',search,error:summaryFailure('invalid_response')} as SummaryQueryState;
        try{
          const data=decodeStatisticsSeriesResponse(result.data,this.scope.businessId);
          if(data.status==='ready'&&(data.period.preset!==period.preset||period.preset==='custom'&&(data.period.startDate!==period.startDate||data.period.endDate!==period.endDate)))throw new Error('Period mismatch');
          return {status:'ready',periodKey:key,data} as SummaryQueryState;
        }
        catch{return {status:'error',search,error:summaryFailure('invalid_response')} as SummaryQueryState;}
      }).catch(()=>({status:'error',search,error:summaryFailure('query_failed')} as SummaryQueryState));
      this.pending.set(key,task);
      const registered=task;
      void task.finally(()=>{if(this.pending.get(key)===registered)this.pending.delete(key);});
    }
    return task.then(state=>{if(sequence===this.sequence&&generation===this.generation)this.set(state);return this.state;});
  }
  dispose(){this.generation++;this.sequence++;this.pending.clear();this.listeners.clear();this.point=null;this.metric='sales';this.set({status:'idle'});}
}

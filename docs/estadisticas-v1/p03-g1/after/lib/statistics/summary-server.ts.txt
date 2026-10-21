import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { readAuthenticatedSummary,summaryFailure,type SummaryAuthenticatedClient,type SummaryResult } from './summary-transport';
import { statisticsPublicationAllowed } from './statistics-publication-server';
/** Server entry for later integration. Not a route/action/UI and never uses service-role credentials. */
export async function getStatisticsSummary(search:string):Promise<SummaryResult>{
  try{
    const client=await createSupabaseServerClient();
    return readAuthenticatedSummary(client as unknown as SummaryAuthenticatedClient,search,scope=>statisticsPublicationAllowed(client,scope));
  }catch{return summaryFailure('query_failed');}
}

import 'server-only';
import { requireAdminContext } from '@/lib/admin/context';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { StatisticsReadClient, StatisticsResponse, StatisticsRpcArgs } from './contracts';
import { canReadStatistics, readStatistics, StatisticsReadError } from './read';

/** No route/nav/UI is introduced in Phase 02. New RPC stays unapplied until review. */
export async function getStatistics(args: StatisticsRpcArgs): Promise<StatisticsResponse> {
  const context = await requireAdminContext();
  if (!canReadStatistics(context.profile.role)) throw new StatisticsReadError('forbidden');
  const client = await createSupabaseServerClient();
  // Narrow, owned transport adapter: the shared generated Database is intentionally unchanged.
  const rpc = client as unknown as StatisticsReadClient;
  return readStatistics(rpc, args, { businessId: context.businessId, role: context.profile.role });
}

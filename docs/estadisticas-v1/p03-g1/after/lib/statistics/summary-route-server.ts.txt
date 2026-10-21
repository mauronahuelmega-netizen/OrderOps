import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { verifyStatisticsPrincipal, type StatisticsPrincipalClient } from './summary-principal';
import type { SummaryScope } from './summary-transport';
import { statisticsPublicationAllowed } from './statistics-publication-server';

/** Route gate only; no RPC and no role normalization/fallback. Every query authenticates again. */
export async function statisticsRouteScope(): Promise<
  { status: 'allowed'; scope: SummaryScope } | { status: 'unauthenticated' | 'forbidden' | 'error' | 'not_published' }
> {
  try {
    const client = await createSupabaseServerClient();
    const access = await verifyStatisticsPrincipal(client as unknown as StatisticsPrincipalClient);
    if (access.status !== 'allowed') return access;
    return statisticsPublicationAllowed(client, access.scope) ? access : { status: 'not_published' };
  } catch { return { status: 'error' }; }
}

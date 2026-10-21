import 'server-only';
import { statisticsPublishedForQa, type PublicationScope } from './statistics-publication-policy';
/** Publication is independent from authorization. No production-publication mode exists. */
export function statisticsPublicationAllowed(client: unknown, verifiedScope: PublicationScope): boolean {
  const actualTarget = (client as { supabaseUrl?: unknown } | null)?.supabaseUrl;
  return statisticsPublishedForQa(process.env.ORDEROPS_STATISTICS_QA_PUBLICATION, actualTarget, verifiedScope);
}

import { NextRequest, NextResponse } from 'next/server';
import { getStatisticsSummary } from '@/lib/statistics/summary-server';
export const dynamic = 'force-dynamic';
/** Same-origin read endpoint; original role/tenant reverified by the P03-C server transport. */
export async function GET(request: NextRequest) {
  const result = await getStatisticsSummary(request.nextUrl.search);
  const status = result.ok ? 200 : result.code === 'unauthenticated' ? 401 : result.code === 'forbidden' ? 403 : result.code === 'not_published' ? 404 : result.code === 'invalid_period' ? 400 : result.code === 'timeout' ? 504 : 502;
  return NextResponse.json(result, { status, headers: { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Cookie' } });
}

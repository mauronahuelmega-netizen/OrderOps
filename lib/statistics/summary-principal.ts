import { canReadStatistics } from './read';

/** Request-local verified principal; no normalized role, fallback, client tenant or cache. */
export interface StatisticsPrincipalClient {
  auth: { getUser(): PromiseLike<{ data: { user: { id: string } | null }; error: unknown }> };
  from(name: 'profiles'): { select(columns: 'business_id,role'): { eq(column: 'id', id: string): {
    maybeSingle(): PromiseLike<{ data: unknown; error: unknown }>;
  } } };
}
export type StatisticsPrincipalResult =
  | { status: 'allowed'; scope: { userId: string; businessId: string }; role: string }
  | { status: 'unauthenticated' | 'forbidden' | 'error' };

export async function verifyStatisticsPrincipal(client: StatisticsPrincipalClient): Promise<StatisticsPrincipalResult> {
  try {
    const auth = await client.auth.getUser();
    if (auth.error) {
      const error = auth.error as { status?: number; name?: string; code?: string; message?: string };
      const absent = error.status === 401 || error.status === 403 || error.name === 'AuthSessionMissingError'
        || ['refresh_token_not_found', 'refresh_token_already_used', 'session_not_found', 'user_not_found', 'bad_jwt', 'jwt_expired'].includes(error.code ?? '')
        || error.code === 'validation_failed' && error.message === 'Refresh token is not valid';
      return { status: absent ? 'unauthenticated' : 'error' };
    }
    if (!auth.data.user?.id) return { status: 'unauthenticated' };
    const profile = await client.from('profiles').select('business_id,role').eq('id', auth.data.user.id).maybeSingle();
    if (profile.error) return { status: 'error' };
    const p = profile.data as { business_id?: unknown; role?: unknown } | null;
    if (!p || typeof p.business_id !== 'string' || !p.business_id.trim() || typeof p.role !== 'string' || !canReadStatistics(p.role)) return { status: 'forbidden' };
    return { status: 'allowed', scope: { userId: auth.data.user.id, businessId: p.business_id }, role: p.role };
  } catch { return { status: 'error' }; }
}

/** Pure policy. Only the server supplies configuration/actual client target/verified principal. */
export interface PublicationScope { userId: string; businessId: string }
export function statisticsPublishedForQa(raw: string | undefined, actualTarget: unknown, scope: PublicationScope): boolean {
  try {
    if (!raw || raw.length > 12000 || typeof actualTarget !== 'string') return false;
    const target = new URL(actualTarget);
    if (target.origin !== 'http://127.0.0.1:56321' || target.pathname !== '/' || target.search || target.hash || target.username || target.password) return false;
    const config: unknown = JSON.parse(raw);
    if (!config || typeof config !== 'object' || Array.isArray(config)) return false;
    const c = config as Record<string, unknown>;
    if (Object.keys(c).sort().join(',') !== 'api,db,principals,projectId,version') return false;
    if (c.version !== 'statistics.qa-publication.v1' || c.projectId !== 'orderops-statistics-v1-test-74718de66a41'
      || c.api !== 'http://127.0.0.1:56321' || c.db !== '127.0.0.1:56322' || !Array.isArray(c.principals) || !c.principals.length || c.principals.length > 12) return false;
    const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    if (!uuid.test(scope.userId) || !uuid.test(scope.businessId)) return false;
    return c.principals.every(p => p && typeof p === 'object' && !Array.isArray(p)
      && Object.keys(p).sort().join(',') === 'businessId,userId' && typeof p.userId === 'string' && typeof p.businessId === 'string'
      && uuid.test(p.userId) && uuid.test(p.businessId))
      && c.principals.some(p => p.userId === scope.userId && p.businessId === scope.businessId);
  } catch { return false; }
}

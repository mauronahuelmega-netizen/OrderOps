# PUBLIC-CATALOG-HERO-RAIL-ALIGNMENT-FIX-1
## Align Hero Width With Product Grid Content Rail

## Estado

PARTIAL — HERO RAIL ALIGNMENT QA INCOMPLETE

## Causa encontrada

- Source audit: Hero, category navigation and catalog content use the same `width: min(100%, 1080px)` rail and centered margins.
- The current flat-shell override removes Hero padding, border and outer surface. The media is therefore `width: 100%` of that shared rail.
- Search owns the same `width: min(100%, 1080px)` rail. No duplicated padding, independent max-width, negative margin or mobile-only width reduction was found.
- Earlier stable local measurement at `390x844` recorded `heroLeft=14`, `heroRight=376`, `gridLeft=14`, `gridRight=376`.

## Resultado

- No runtime or CSS change was applied: changing the rail without a reproducible mismatch would be a fragile visual workaround.
- The existing Hero hierarchy, compact media, ProductCard `1 / 1`, categories, search, cart and dark-mode styling remain untouched.

## QA

- Browser automation was attempted against the existing Dev server. The MCP browser kernel expired while Dev compilation was still active; local Node cannot resolve a Playwright package. The required new viewport matrix could not be recorded in this run.
- TypeScript: PASS.
- Build: PASS (`npm.cmd run build`, 256.1s).

## Deuda y gate

- Re-run the exact bounding-box matrix in a stable browser at `412x914`, `390x844`, `430x932`, `768px` and `1440x900` before asserting a new visual defect or changing the shared rail.

```text
QUEUE_GATE: PUBLIC-CATALOG-BURGER-MENU-FLAT-A11Y-POLISH-1 = BLOCKED
```

## Seguridad

```text
Runtime contract changes: 0
DB changes: 0
RPC/action changes: 0
Package changes: 0
Real orders: 0
Commit: no
Push: no
Deploy: no
```

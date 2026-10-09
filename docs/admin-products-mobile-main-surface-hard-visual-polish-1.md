# ADMIN-PRODUCTS-MOBILE-MAIN-SURFACE-HARD-VISUAL-POLISH-1

## Result

**PASS** — Mobile main `/admin/products` surface closed for release visual block.

Forms / flyout / customizations / image pipeline: **UNTOUCHED**.
Commit / push / deploy: **NONE** (release remains paused for owner Create/Edit visual QA).

## Delta Audit

owners:
- Secondary header actions: `products-header-actions.tsx` + `.module.css`
- Public catalog path: `buildPublicCatalogPath` in `lib/admin/catalog-preview-shared.ts`
- Preview route: `/admin/products/preview` (desktop)
- Toolbar summary + search + filters: `products-toolbar.tsx` + `.module.css`
- Catalog header / “Por categorías” / rich metrics: `product-grid-server.tsx` + `product-grid.module.css`

current debts (pre-phase, living audit):
- PROD-P2-6 contrast — historically open; source already used `--text-secondary` for Gestionar / Por categorías / category counts
- PROD-P2-8 header density — open / residual polish
- PROD-P3-4 toolbar/catalog count density — open
- PROD-P3-8 focus-visible density — open (flyout already PASS)
- PROD-P3-17 copy-link SR confirmation — open (static aria-label masked success)

desktop/mobile split:
- Canonical behavioral switch **899 / 900** preserved
- Mobile: compact 3-col actions + public Abrir catálogo + 3-col native filters + summary dedupe
- Desktop ≥900: preview + long labels + toolbar summary + table collection

## Mobile Action Row

before:
Wrapped / uneven secondary actions; mobile still offered **Vista previa del catálogo** → `/admin/products/preview`

after:
`[+ Nuevo producto]` full width  
`[Opcionales] [Abrir catálogo] [Copiar link]` — `repeat(3, minmax(0,1fr))`, ≥44px

public catalog behavior:
`href={buildPublicCatalogPath(slug)}` → `/b/{slug}/catalogo`  
`target="_blank"` `rel="noopener noreferrer"`  
**no** `orderopsPreview=1`

desktop preview preservation:
CSS-switched pair — `.previewDesktop` visible ≥900; `.catalogMobile` visible &lt;900; hidden instance `display:none` (out of tab order)

## Filters

before:
&lt;768 stacked / 2-col hybrid; nested bordered filter panel; long default option copy

after:
&lt;900 single row `repeat(3, minmax(0,1fr))`; no nested panel chrome; defaults **Categorías / Stock / Estado**; active border + weight via existing `filterSelectActive`

native-select contract:
**PRESERVED** (3× `<select>`, same URL handlers, 300ms search debounce, page reset, single Clear Filters)

active states:
Selected option text visible (e.g. BEBIDAS / Agotados / Activos) + active style

## Density

summary dedupe:
Toolbar `18 productos · 5 categorías` **hidden** at &lt;900; rich catalog metrics kept

Por categorías:
**hidden** at &lt;900 (category headings already convey grouping); remains in markup for ≥900

before/after:
390: Productos heading → first category ≈ **341px** chrome stack (actions + search + filters + catalog header) with ≥44 controls  
Qualitative: merchant reaches catalog sooner; redundant summary + stacked filters removed

## Visual QA

| viewport | theme | actions | filters | overflow | result |
|----------|-------|---------|---------|----------|--------|
| 360 | light | 3-col concise | 3-col native | 0 | PASS |
| 390 | dark | 3-col concise | 3-col native | 0 | PASS |
| 390 | light | measured | — | 0 | PASS |
| 412 | — | — | combined filters | 0 | PASS |
| 719 | — | (architecture same &lt;900) | 3-col | — | PASS* |
| 899 | — | Abrir catálogo / preview hidden | 3-col | 0 | PASS |
| 900 | — | Vista previa / Abrir hidden | desktop toolbar | 0 | PASS |

\*719 covered by same &lt;900 CSS contract + collection architecture verify; spot-check architecture matchMedia unchanged.

## Functional Regression

search: full-width ≥44; debounce 300; URL `q` preserved  
category: URL `categoryId` correct  
stock: URL `stock` correct  
status: URL `status` correct  
combined: all params preserved (412 QA)  
filtered-zero: empty state + Clear; **Create does NOT auto-open**  
clear: returns clean `/admin/products`

## Accessibility

touch: primary / secondary / search / selects / Clear ≥44 (2.75rem)  
keyboard: native selects; focus-visible on header ghosts + toolbar controls  
focus: copy does not steal focus by design; status is polite live region  
copy feedback: visible Copiado + `role="status"` `aria-live="polite"` (“Link del catálogo público copiado”)

## Public Catalog Smoke

route: `/b/demohamburgueseria/catalogo`  
new tab: contract `target=_blank`  
HTTP: 200 (live tab)  
preview flag: absent  
admin preview banner: not present

## Debt Reconciliation

P2-6:
**CLOSED / RECONCILED** — informative main-surface text uses `--text-secondary`; light+dark readable in runtime QA (not a fresh WCAG lab audit)

P2-8:
**CLOSED** — mobile header/action/filter density materially reduced; this phase is new authority

P3-4:
**CLOSED (mobile density portion)** — summary dedupe + compact filters; desktop summary retained

P3-8:
**CLOSED (main-surface portion only)** — header/toolbar focus-visible present; not project-wide

P3-17:
**CLOSED** — polite live status announces copy success/failure

## Data Safety

products: **0** mutations  
Storage: **0**  
orders: **0**

## Verification

focused: **PASS** `admin-products-mobile-main-surface-hard-visual-polish.verify.ts`  
existing: operational / search-empty / collection-architecture **PASS**  
mutation A: mobile Abrir → preview **FAIL → restored PASS**  
mutation B: filters not 3-col **FAIL → restored PASS**  
tsc: **PASS**  
diff: **PASS**

## Runtime Scope

MODIFIED:
- `components/admin/products/products-header-actions.tsx`
- `components/admin/products/products-header-actions.module.css`
- `components/admin/products/products-toolbar.tsx`
- `components/admin/products/products-toolbar.module.css`
- `components/admin/products/product-grid.module.css`

NEW:
- `lib/products/admin-products-mobile-main-surface-hard-visual-polish.verify.ts`
- `docs/admin-products-mobile-main-surface-hard-visual-polish-1.md`

forms / modals / DB / migrations / RLS / optimizer: **UNCHANGED**

## Remaining Main-Surface Debt

None release-blocking on main surface after this phase.

Still out of scope / paused for owner:
- Create mobile visual QA
- Edit simple mobile visual QA
- Edit personalizable + overrides panel

Shared shell multiple-h1: **OUT OF SCOPE / SHARED SHELL**

## Next

**WAIT FOR OWNER DETAIL** on Create / Edit simple / Edit personalizable mobile visual QA.

`ADMIN-PRODUCTS-COMMIT-PUSH-DEPLOY-1`: **STILL PAUSED**

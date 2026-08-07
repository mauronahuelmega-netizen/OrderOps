# PUBLIC-CATALOG-UX-UI-REDESIGN-FORENSIC-AUDIT-1
## Routes, Components, Styling Ownership, Interaction Contracts and Redesign Blast Radius

## 1. Estado

AUDIT COMPLETE - PUBLIC CATALOG UI REDESIGN SURFACES MAPPED

Esta fase es exclusivamente documental. El mapa se construyo desde source y Git. No se ejecuto browser, servidor local, TypeScript ni build: `RUNTIME VISUAL = UNVERIFIED IN THIS ENVIRONMENT`.

## 2. Resumen ejecutivo

El catalogo publico tiene una composicion estable: layout con header compartido, server loader de datos publicos, y un unico `CatalogClient` que concentra busqueda, categorias, carrito local y overlays. Checkout y success son arboles independientes, pero comparten el header del layout y los tokens globales.

El rediseño puede dividirse por superficies, pero debe proteger contratos de carrito, personalizacion, post-add, telefono, direccion y preview. El principal acoplamiento visual es `app/globals.css`: contiene shell, header, hero, navegacion, modal de detalle y success; los CSS Modules contienen la mayor parte de las superficies transaccionales recientes.

## 3. Baseline Git y produccion

| Campo | Evidencia |
| --- | --- |
| Branch | `main` |
| HEAD auditado | `3b6160df0cce010a66db6b90cf008fb0fc546529` |
| origin/main | `3b6160df0cce010a66db6b90cf008fb0fc546529` |
| Ahead/behind | `0/0` |
| Functional release | `3bd26ff feat(public-catalog): complete residual catalog roadmap` |
| Documentacion release | `3b6160d docs(public-catalog): record residual roadmap deployment` |
| Produccion historica | `https://orderops.vercel.app` |

El working tree principal ya estaba dirty antes de esta auditoria. Cambios preexistentes, incluyendo `components/admin/orders/admin-dashboard-orders.tsx`, `docs/CURRENT_PHASE.md`, `ORDEROPS_LIVING_MEMORY.md`, `next-env.d.ts`/`tsconfig.tsbuildinfo`, documentos y `tmp/`, son `PREEXISTING - DO NOT TOUCH`.

## 4. Rutas publicas

| Ruta | Page / layout | Root y datos | Side effects relevantes |
| --- | --- | --- | --- |
| `/b/[slug]` | `app/b/[slug]/page.tsx` + `app/b/[slug]/layout.tsx` | Server `BusinessLandingPage`; `getRequestPublicBusiness` | Solo links externos e internos. |
| `/b/[slug]/catalogo` | `app/b/[slug]/catalogo/page.tsx` + layout | Server `PublicCatalogPageContent`, client `CatalogClient`; `getPublicCatalogPageData` | Carrito en localStorage publico; metricas privacy-safe; config de personalizacion on-demand. |
| `/b/[slug]/catalogo?orderopsPreview=1` | Misma page | Mismo arbol con `isCatalogPreview` | Scope de carrito aislado y listener de limpieza preview. |
| `/b/[slug]/checkout` | `app/b/[slug]/checkout/page.tsx` + layout | Server business loader, client `CheckoutClient` | Hidrata carrito local; submit usa action solo fuera de preview. |
| `/b/[slug]/checkout?orderopsPreview=1` | Misma page | Checkout preview | Confirmacion bloqueada; mantiene path preview. |
| `/b/[slug]/success?order_id=` | `app/b/[slug]/success/page.tsx` + layout | Server business loader, `buildPublicOrderWhatsappUrl` | CTA a WhatsApp y retorno al catalogo; no muta pedido. |

`PublicCatalogPageContent` hace `notFound()` cuando no hay datos. El catalogo usa datos estables cacheados mas estado fresco de apertura; checkout carga negocio publico directamente. No se detecto metadata local especifica ni CSP por ruta en este alcance.

## 5. Arbol de render

```text
app/b/[slug]/layout.tsx
|- PublicBusinessHeader (client)
|  |- brand / logo
|  |- burger dialog, overlay, navigation and ThemeToggle
`- page content
   |- catalogo/page.tsx
   |  `- PublicCatalogPageContent (server)
   |     |- PublicCatalogObservability (client)
   |     `- CatalogClient (client)
   |        |- hero inline
   |        |- CategoryNav
   |        |- CatalogDiscoveryControls
   |        |- category sections -> ProductCard
   |        |- CartBar
   |        |- CartSheet
   |        |- ProductDetailModal
   |        |- CustomizationModal (dynamic)
   |        `- PostAddUpsellSheet (dynamic)
   |- checkout/page.tsx
   |  `- CheckoutClient (client)
   |     |- delivery/pickup segmented fieldset
   |     |- AddressAutocomplete (delivery only)
   |     |- customer and notes fields
   |     |- mobile/desktop OrderSummary
   |     `- sticky submit footer
   `- success/page.tsx
      `- Card / Button primitives
```

Admin preview is not a duplicated catalog implementation. `app/admin/(protected)/products/preview/page.tsx` renders an iframe with the public catalog URL plus `orderopsPreview=1`; public catalog and checkout branches consume that flag.

## 6. Inventario de archivos

| Archivo | Tipo | Responsabilidad | Estado / dependencias | Estilos | Riesgo |
| --- | --- | --- | --- | --- | --- |
| `app/b/[slug]/layout.tsx` | Server Component | Header compartido de rutas publicas | Request-cached business | globals + header module | HIGH: cambia catalogo, checkout y success. |
| `components/public/business/public-business-header.tsx` | Client Component | Brand, menu, tema, hide-on-scroll | pathname, localStorage theme, body lock | globals + module | HIGH: navegacion, preview y stacking. |
| `components/public/catalog/public-catalog-page.tsx` | Server Component | Loader y limite server/client | cached page data, observability | none | MEDIUM. |
| `components/public/catalog/catalog-client.tsx` | Client Component | Shell, hero, discovery, cart and overlays | router, local cart, config cache | globals + shell module | HIGH: concentra contratos de conversion. |
| `components/public/catalog/product-card.tsx` | Client Component | Card, detalle y quick add | product, quantity, callbacks | `product-card.module.css` | HIGH: superficie clickeable y add paths. |
| `components/public/catalog/product-detail-modal.tsx` | Client Component | Detalle y cantidad legacy | overflow body, callbacks | globals | MEDIUM. |
| `components/public/catalog/customization-modal.tsx` | Client Component | Seleccion, validacion y precio | shared option components, cart builders | CSS Module | HIGH: configuracion y edit mode. |
| `components/public/catalog/post-add-upsell-sheet.tsx` | Client Component | Plus posterior al alta | attach local parent/child | CSS Module | HIGH: contrato created-only. |
| `components/public/catalog/cart-sheet.tsx` | Client Component | Carrito jerarquico y checkout | cart callbacks | CSS Module | HIGH: parent/child, total y quantity. |
| `components/public/checkout/checkout-client.tsx` | Client Component | Form, resumen y submit | local cart, action, phone helper | CSS Module | HIGH: envio de pedidos. |
| `components/public/checkout/address-autocomplete.tsx` | Client Component | Combobox opcional | lazy Maps loader | CSS Module | HIGH: fallback manual y teclado. |
| `app/b/[slug]/checkout/actions.ts` | Server action | Crear pedido | payload, validacion server | none | CRITICAL: fuera de alcance visual. |
| `lib/catalog/public-*.ts` | loaders/helpers | Catalogo publico, cache y estado fresco | Supabase/cache tags | none | HIGH: no alterar payload/caching. |
| `lib/cart/local.ts`, `lib/cart/post-add-upsell.ts` | helpers puros | Persistencia, firma, merge y attach | localStorage, V2 lines | none | CRITICAL. |
| `app/globals.css` | estilos globales | tokens y shell historico | selectors compartidos | global | HIGH: alto blast radius. |

## 7. Ownership CSS

| Superficie | Archivo CSS | Selectores / ownership | Sombras, bordes y fondos | Breakpoints / z-index |
| --- | --- | --- | --- | --- |
| Tokens, landing, catalog shell, header, detail, success | `app/globals.css` | `.catalog-*`, `.public-business-header*`, `.success-*`, `.business-landing-*`, `.ui-*` | Mezcla de reglas globales, cards, gradients y shadows | 359, 640, 720, 768, 1024; header/menu global. |
| Hero | `catalog-shell.module.css` + globals | modulo para aspect ratio/overlay; globals para media/copy | gradient oscuro y fallback | `768px`; no z-index de overlay fuera del media. |
| Search | `catalog-discovery-controls.module.css` | `.surface`, `.field`, `.clear` | surface heredada del fondo, bordes 14px | `z-index: 7`; sin responsive propio. |
| ProductCard | `product-card.module.css` | card, hit area, media, quick action | border 1px, radius 18/22px, shadow | `768px`; action `z-index: 2`. |
| Cart FAB | `cart-bar.module.css` | fixed FAB | shadow floating, safe area | `z-index: 9`. |
| CartSheet | `cart-sheet.module.css` | backdrop/sheet/child hierarchy | border, radius, shadow | `z-index: 70`, desktop `640px`. |
| Post-add | `post-add-upsell-sheet.module.css` | backdrop/sheet/candidates | border, radius, shadow | `z-index: 75`, desktop `48rem`. |
| Customization | `customization-modal.module.css` | backdrop/modal/footer | border, radius, shadow | `z-index: 80`, desktop `640px`. |
| Checkout | `checkout-client.module.css` | form, summary, segmented, sticky footer | cards/borders; no principal shadow nesting | desktop `900px`, sticky footer `z-index: 5`. |
| Address suggestions | `address-autocomplete.module.css` | combobox listbox | surface/border/shadow | `z-index: 10` inside form. |

CSS ownership is intentionally mixed: global classes serve older shell/detail/header/success markup, while release-era isolated modules protect cart, customization, post-add, search and checkout. A redesign must not delete global selectors by name alone because the header is present above checkout and success.

## 8. Header y hero

### Header

- Owner: `components/public/business/public-business-header.tsx`; globals at `.public-business-header*`, exception module `public-business-header.module.css`.
- The header is sticky by global styling; `useHideOnScroll` applies transform except in checkout, where `headerCheckout` explicitly makes it static to avoid covering the form.
- It renders logo/placeholder, `Pedido online`, business name, hamburger dialog, duplicated brand within the drawer, navigation, Instagram, preferences and ThemeToggle.
- The menu has backdrop click, Escape and body scroll lock. Source does not show an explicit focus trap or opener-focus restoration; this is an accessibility decision for the closure spec, not a safe incidental visual change.
- The Product Owner direction maps to markup and globals: remove secondary copy, flatten logo framing, soften separator, add a state indicator next to the name, and flatten drawer rows. Preserve route links, theme persistence/event, hide-on-scroll dispatch and checkout static override.

### Hero

- Owner: inline markup in `CatalogClient` with globals plus `catalog-shell.module.css`.
- It uses `PublicStorageImage`, loaded/error/fallback states, an image gradient overlay, eyebrow, headline, order-status pill, trust chip and WhatsApp microcopy.
- Hero is not a `Card` component, but global width/surface rules plus media/notes can visually create layered-card perception. The hero image must retain priority loading, fallback and dark-mode states.
- Future shell phase may remove presentation wrappers and consolidate copy, but cannot alter `on_demand_mode_active`, `coverState`, image fallback, or category positioning without QA.

### Category navigation

- Owner: `CategoryNav` + globals `.catalog-category-nav*`; the nav is semantic `nav` with buttons and horizontal chips.
- Empty query: chips smooth-scroll to category sections and `IntersectionObserver` maintains active category. Active query: chips become a category filter with `aria-pressed`, including `Todos`.
- Search disables scroll-spy; categories are derived from visible entries. The sticky offset and global selector order need a single owner before visual adjustments.

## 9. Search, categorias y grid

- `lib/catalog/catalog-search.ts` provides local normalized token matching. `CatalogClient` computes size, index, query results and category filtering in memory. Search activation is threshold driven; SMALL does not render search DOM.
- MEDIUM initially presents a `Buscar productos` trigger; other non-SMALL catalogs show the input. The current search has a visible label, text clear control, helper/status and Escape clear behavior.
- Search request contract: `SEARCH REQUEST COUNT = 0`; category filtering, query changes and clear must remain client-only. Do not put search in server state, URL state or localStorage in the visual roadmap.
- Empty states already distinguish no categories, no available products and no search results. Keep these state distinctions when flattening surfaces.
- Product sections preserve source category ordering and name-sorted public products. Global heading treatment may force uppercase-like presentation; Product Owner wants sentence case and muted counts, a CSS-only target after confirming actual typography rules.
- `.catalog-product-list` is the grid owner in globals. `ProductCard` uses `min-width: 0`, image square media, clamped copy and bottom absolute quick action. The existing card has no full-width singleton special case in the component; the grid owns singleton behavior and must preserve a two-column mobile layout.

## 10. ProductCard

`ProductCard` is a memoized client component. Its `.hit` is keyboard-operable (`Enter`/space) and opens detail; the quick action stops propagation. Simple products quick-add or expose quantity controls; configurable products route to the customization flow and intentionally do not become legacy steppers.

Safe visual candidates: remove card shadow, tune border/radius/padding, switch `.body` to flexible column, anchor price/action visually and adjust line-height. High-risk changes: replacing the `div[role=button]`, moving quick action inside the hit area, changing action propagation, deleting the image placeholder, or changing `requiresCustomization` behavior.

## 11. Burger menu

The menu is mounted locally after the header, not through a React portal. Global `.public-business-header__portal`, overlay and sheet govern positioning and transition; it contains duplicated branding by design. Menu close is text/line CSS rather than an icon component.

It can be flattened in one visual phase only if the structural dialog, `aria-modal`, Escape, overlay close, body lock, navigation links and ThemeToggle event contract are preserved. Focus containment/restoration needs explicit QA and possibly a dedicated accessibility treatment rather than a style-only assumption.

## 12. Product detail

`ProductDetailModal` is globally styled and owns simple-product quantity draft state. It locks body scrolling, renders a dialog, image/fallback, description, price and sticky footer. Configurable product CTA delegates to `onCustomize`; it must not be converted into a direct add.

Visual work can make media immersive and simplify the footer, but must retain `currentQuantity`, zero-removal messaging, callback order and scroll lock. Keyboard Escape/focus management is not fully established from source as a reusable contract; validate it during integrated QA before presenting a redesign as accessibility-complete.

## 13. Customization y post-add

### Customization

- Owner: `customization-modal.tsx` and CSS Module; option rendering is shared through `components/product-customization/shared/*`.
- It loads configuration through the catalog cache: cache key by slug/product, in-flight Promise dedupe, loading/error/ready states, stale option warning, client validation and computed total.
- On confirm it intentionally creates a parent without Plus children. In edit mode it carries initial selection and eligible attached upsell IDs.
- A flat option-row redesign belongs around shared presentational option/price components, not around selection, validation, cache or cart-building helpers.

### Post-add upsell

- Owner: dynamic `PostAddUpsellSheet`, CSS Module and `lib/cart/post-add-upsell.ts`.
- Exact trigger is `mergeResult.outcome === "created"`, then only if candidates from the single `config.upsellGroup` are eligible. Merged/replaced configurations open CartSheet, never post-add.
- Attach is local parent-child cart mutation; it cannot add fetches, duplicate root count or reintroduce Plus inside customization.
- The current release includes a production-verified focus trap fix historically. Do not regress dialog interaction while flattening candidate rows, borders or footer.

## 14. Cart FAB y CartSheet

- `CartBar` is conditionally visible only for positive root-only count and is fixed with safe-area offsets at `z-index: 9`; it must remain below overlays.
- `CartSheet` at `z-index: 70` renders V2 parents and children distinctly, supports edit/remove/parent quantity, total and checkout. Children have a visual accent left border that the Product Owner wants removed.
- Safe visual changes: replace accent line with neutral indentation, flatten row backgrounds, reduce control weight, simplify separators and shadows.
- Non-negotiable semantics: child association, parent quantity scaling, child price lines, parent edit, remove/signature rebuild, root-only count, totals and cart persistence.

## 15. Checkout

`CheckoutClient` hydrates the same scoped local cart, derives a hierarchical summary, validates fields before `createPublicCheckoutOrderAction`, clears cart only after success and routes to `/success?order_id=`. Preview uses a distinct cart scope and disables confirmation.

The delivery/pickup selector is a semantic `fieldset` with radio inputs and selected styling; it can be visually consolidated only if `delivery`/`pickup`, checked state, keyboard behavior and `AddressAutocomplete` delivery-only mount stay unchanged. Phone parsing occurs client-side and server-side, with accepted storage normalized to `+549...`. Address autocomplete lazy-loads Google only on focus/query when a public key exists; it remains a string input and manual entry must always work.

The current visual hierarchy is cards per section, summary card and sticky mobile footer. A flat checkout can reduce wrappers, borders and shadows without touching action payload, order summary derivation, field names, preview guard, error states or submit state.

## 16. Success

`app/b/[slug]/success/page.tsx` is a server page styled globally through `.success-*` and shared `Card`/`Button` primitives. It receives optional `order_id`, looks up public business and builds a WhatsApp URL. It always preserves a return-to-catalog link.

The CTA appearance is controlled by the shared `accent` Button variant, not by a local hardcoded WhatsApp color in this page. A success polish must inspect `Button` token ownership before changing CTA palette, and retain direct-access behavior when no order ID is present.

## 17. Data flow

```text
cached public business/categories/products + fresh order status
-> PublicCatalogPageContent
-> CatalogClient
-> local public or preview cart storage
-> configuration action/cache -> merge/signature helpers
-> post-add local child attach -> CartSheet
-> CheckoutClient hydration and validation
-> createPublicCheckoutOrderAction -> create_order
-> /success?order_id -> WhatsApp confirmation URL
```

Public catalog observability is client-side and privacy-sanitized. It reports web vitals, hydration timing and optional debug image summaries without being allowed to fail catalog render.

## 18. Invariantes

- Local search and category filtering make zero requests; SMALL renders no search DOM.
- Public catalog source order, availability filtering, cache tags, fresh order status and image fallback remain intact.
- Customization cache and in-flight dedupe remain intact.
- A single upsell group owns post-add candidates; Plus stays outside customization.
- Post-add runs only for `created`; merged/replaced never reopen it.
- Root-only cart count, V2 parent-child hierarchy, signatures, quantities, totals, edit and remove behavior remain intact.
- Preview cart is isolated; preview checkout submit remains blocked.
- Checkout action/payload/RPC boundary, `+549` normalization, delivery-only lazy autocomplete and manual address fallback remain intact.
- No database, migration, RLS/RPC, package, secret or real-order work belongs in redesign phases.

## 19. Auditoria runtime

`RUNTIME VISUAL = UNVERIFIED IN THIS ENVIRONMENT`.

No interactive browser, real device, screen reader, local `npm run dev`, checkout submit, cart mutation or production smoke was run in this audit. Source mapping is complete enough to freeze implementation boundaries, but visual claims at `390x844`, `430x932` and `1440x900` must be revalidated during integrated QA.

## 20. Blast radius

| Bloque | Directos | Indirectos | Riesgo funcional | Riesgo visual | Preview / dark | QA necesaria |
| --- | --- | --- | --- | --- | --- | --- |
| Header | header TSX, globals, header module | layout, theme toggle, visibility hook | HIGH | HIGH | HIGH / HIGH | routes, menu keyboard, checkout static header. |
| Hero | CatalogClient, globals, shell module | image loader, category position | MEDIUM | HIGH | MEDIUM / HIGH | image states, opening state, mobile. |
| Search | discovery TSX/module, CatalogClient | search helper, CategoryNav | HIGH | MEDIUM | MEDIUM / HIGH | SMALL/MEDIUM/LARGE, Escape, zero requests. |
| Categories | CategoryNav, globals, CatalogClient | observer and search filter | HIGH | MEDIUM | MEDIUM / HIGH | scroll-spy and active-query semantics. |
| Grid/cards | ProductCard/module, globals | cart callbacks, detail | HIGH | HIGH | MEDIUM / HIGH | touch/keyboard, singleton and configurable card. |
| Burger menu | header TSX, globals | body lock/theme/navigation | HIGH | HIGH | HIGH / HIGH | focus, Escape, close, route change. |
| Detail | detail TSX, globals | customization opening, legacy cart | HIGH | MEDIUM | MEDIUM / HIGH | quantity and overlay transitions. |
| Customization | modal module, shared option UI | selection/cache/cart builder | HIGH | HIGH | MEDIUM / HIGH | required groups, error, edit, focus. |
| Post-add | sheet module | attach helper, CartSheet | HIGH | MEDIUM | MEDIUM / HIGH | created/merged/replaced and child attach. |
| Cart | cart module/bar module | local cart, checkout | HIGH | HIGH | MEDIUM / HIGH | hierarchy, quantity, remove, totals. |
| Checkout | checkout modules | action, phone, maps, storage | HIGH | HIGH | HIGH / HIGH | delivery/pickup, fallback, preview, submit boundary. |
| Success | success globals/page | shared Button, WhatsApp helper | MEDIUM | MEDIUM | LOW / HIGH | direct access, no-order-ID, responsive. |

HIGH functional risk denotes a surface connected to cart state, order creation, routing, accessibility dialog behavior, or preview isolation. It is not permission to change behavior in a polish phase.

## 21. Decisiones para spec

| Decision | Recomendacion tecnica | Alternativa valida |
| --- | --- | --- |
| Header | Keep hide-on-scroll for catalog, static checkout; add minimal open state near name. | Make catalog header static only if mobile scroll QA shows a real usability gain. |
| Hero | Keep image/fallback and use one clean operational message. | Edge-to-edge media within current max-width shell. |
| Search | One input with search icon and accessible visible/hidden label; retain text clear action. | Visible label if hierarchy testing favors it. |
| Cards | Flexible column, bottom-aligned price/action, two mobile columns and neutral border. | Fixed card height only after long-name/content QA. |
| Singleton | Preserve grid column width; do not stretch one item full-width. | Intentional horizontal card variant requires a separate decision. |
| Drawer | Flat list rows with theme on one row; preserve dialog behaviors. | Keep duplicate branding only if ownership/context testing justifies it. |
| Modals | Flat rows/dividers and clean sticky footer while retaining their separate contracts. | Detail-only immersive media; do not conflate with customization. |
| Cart | Neutral indentation rather than accent left border for children. | Lightweight child label if hierarchy needs stronger scanning aid. |
| Checkout | Unified surface with typographic/divider sections; preserve real radio fieldset. | Retain section cards but remove nested summary treatment. |
| Success CTA | Choose a business-token-compatible confirmation CTA after Button audit. | Keep accent variant if it is the approved shared semantic token. |
| Dark mode | Every changed surface must have an explicit dark treatment. | Do not defer dark mode for shared public shell. |

## 22. Roadmap recomendado

1. `PUBLIC-CATALOG-UX-UI-REDESIGN-SPEC-CLOSURE-1`: freeze the above decisions, visual tokens and exact accessibility acceptance criteria.
2. `PUBLIC-CATALOG-SHELL-HEADER-HERO-SEARCH-POLISH-1`: shell globals, header, hero and discovery controls; preserve header and search contracts.
3. `PUBLIC-CATALOG-CATEGORIES-GRID-CARDS-POLISH-1`: chips, section headers, grid and ProductCard presentation; QA SMALL/MEDIUM/LARGE.
4. `PUBLIC-CATALOG-BURGER-MENU-FLAT-POLISH-1`: dialog layout only with explicit keyboard/focus QA.
5. `PUBLIC-CATALOG-PRODUCT-DETAIL-MODAL-POLISH-1`: detail presentation, close control and footer without changing add/customize paths.
6. `PUBLIC-CATALOG-CUSTOMIZATION-OPTIONS-FLAT-POLISH-1`: shared option presentation and customization modal surfaces, protecting validation/cache/edit.
7. `PUBLIC-CATALOG-CART-SHEET-FLAT-POLISH-1`: Cart FAB/CartSheet flattening, protecting hierarchy and quantity math.
8. `PUBLIC-CATALOG-CHECKOUT-FLAT-POLISH-1`: checkout hierarchy and segmented presentation, protecting phone/maps/action/preview.
9. `PUBLIC-CATALOG-SUCCESS-PAGE-POLISH-1`: success composition and CTA token decision.
10. `PUBLIC-CATALOG-UX-UI-REDESIGN-INTEGRATED-QA-1`: browser mobile/desktop, dark mode, keyboard/focus, preview and cart-to-checkout contracts.
11. `PUBLIC-CATALOG-UX-UI-REDESIGN-DEPLOY-1`: commit, push, deploy and production smoke.
12. `PUBLIC-CATALOG-UX-UI-REDESIGN-FINAL-HANDOFF-1`: only after deploy evidence is reconciled.

## 23. Riesgos

- `app/globals.css` is a shared legacy surface; broad selector cleanup can unintentionally alter landing, catalog, header, checkout header and success.
- Overlay appearance is independent of overlay behavior. Flattening a dialog without focused keyboard QA can regress the already-sensitive focus/scroll contract.
- Search and category chips change semantics when a query is active; visual consolidation must not hide the active category filter behavior.
- Cart and checkout visual rows expose pricing and parent-child semantics. DOM reshaping requires hierarchy and total regression coverage, not only screenshots.
- Browser and real-device evidence remains outstanding for this audit.

## 24. Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-UX-UI-REDESIGN-SPEC-CLOSURE-1 = ALLOWED
QUEUE_GATE: PUBLIC-CATALOG-UX-UI-REDESIGN-DEPLOY-1 = BLOCKED
```

## 25. Proximo paso

`PUBLIC-CATALOG-UX-UI-REDESIGN-SPEC-CLOSURE-1` must freeze the visual decisions and QA acceptance criteria before any runtime or CSS implementation begins.

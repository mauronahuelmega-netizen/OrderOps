# PUBLIC-CATALOG-LARGE-CATALOG-NAV-SPEC-1
## Large Catalog Search, Category Navigation, Result States & Client-Side Performance Contract

**Status:** **SPEC COMPLETE - LARGE CATALOG NAVIGATION CONTRACT FROZEN**
**Baseline:** `origin/main` `598a86d0c7fa3ec78f590ebd3a143b58f48762d9`

## 1. Current implementation audit

| Area | Current source | Current behavior |
| --- | --- | --- |
| Page data | `lib/catalog/public.ts`, `lib/catalog/public-page-data.ts` | Available products and ordered categories are loaded server-side. |
| Client catalog | `components/public/catalog/catalog-client.tsx` | All visible products are held client-side and grouped with `useMemo`. |
| Categories | `components/public/catalog/category-nav.tsx` | Sticky buttons scroll to sections; no network request. |
| Active category | `catalog-client.tsx` | One `IntersectionObserver` observes rendered category sections. |
| Cards / quick add | `product-card.tsx` | Memoized cards; simple products update local cart, configurable products open the existing modal. |
| Modal / cart | `catalog-client.tsx` | Overlay state is local; customization config is cached by product. |

`PublicProduct` already exposes exactly the V1 search corpus: `name`, nullable `description`, `category_id`, price, image, and public customization summary. Category names are available separately. Unavailable products are excluded before this payload is built. No customization options, upsell candidates, admin data, raw IDs, or stock data enter the index.

## 2. Size taxonomy and activation

Count public visible products and categories after the current availability filter.

| Size | Rule | V1 behavior |
| --- | --- | --- |
| SMALL | <= 24 products and <= 4 categories | Preserve current catalog; no search surface. |
| MEDIUM | 25-59 products or 5-7 categories | Compact progressive search trigger. |
| LARGE | >= 60 products or >= 8 categories, or any category has >= 24 products | Expanded search field by default. |
| VERY_LARGE | >= 160 products or >= 16 categories | Same V1 local contract; virtualization/server search is deferred. |

`SEARCH_SURFACE_VISIBLE_WHEN = productCount >= 25 OR categoryCount >= 5`. This is deterministic, payload-only, reversible, and requires no setting, migration, admin control, flag, or DB query.

## 3. Search contract

V1 uses local normalized token-AND matching. For a non-empty query, every normalized query token must be present in the product corpus; token order is irrelevant. There is no fuzzy library, relevance ranking, server search, request, Next Action, or DB query.

`normalizeCatalogSearchText(value)` must: return `""` for nullish values; apply Unicode `NFD`; remove combining diacritics; lowercase using the runtime locale; trim; and collapse all whitespace to one space. It never changes displayed copy.

The corpus is the normalized concatenation of product name, product description, and category name. Examples: `clasica` finds `Clásica`; `doble smash` finds `Doble Smash`; `coca 500` finds `Coca Cola 500ml`; duplicate spaces and casing do not change results. `hamburguesa cheddar` only matches when both tokens are present. Option names, upsell names, hidden/unavailable products, IDs, and admin metadata are excluded.

## 4. Category and results contract

`CATEGORY_CONTROL_SEMANTICS_EMPTY_QUERY = scroll navigation`: preserve current sticky chips and scroll-spy.

`CATEGORY_CONTROL_SEMANTICS_ACTIVE_QUERY = category filter`: chips do not scroll while a query exists. Add a leading `Todos` chip only in search mode; one category or `Todos` is active. This explicit mode change is announced in the search result region and avoids scrolling to hidden sections.

Results remain **grouped by category**, preserving current category and product order. Query and category filtering remove empty groups. No ranking or flat grid is added. Show a polite result count only when search is active: `1 producto` / `N productos`; it reflects the final visible result set and is not the cart count.

`SEARCH_NO_RESULTS`: title `No encontramos productos`; copy `Probá con otro nombre o limpiá los filtros.`; button `Limpiar búsqueda`. If a category filter is active, add `Ver todas las categorías`. Keep header, shell, navigation, and Cart FAB. This is distinct from existing catalog-empty, unavailable-catalog, and closed-store states.

The clear control is a visible button with accessible name `Limpiar búsqueda`; it clears query and selected search category, focuses the search input, and scrolls to the search surface without smooth animation. It must not clear cart or storage.

## 5. State, overlays, scroll, and sticky stack

Source of truth is local React state in `CatalogClient`: `searchQuery` and `searchCategoryId`. `URL_PERSISTENCE = NO`; reload/back-navigation persistence = no; local/session storage = no. Opening or closing product detail, customization modal, post-add sheet, or CartSheet must preserve both values and the current scroll position. Modal close returns to the existing product trigger; search state is not reset.

Quick add, customization, signatures, post-add eligibility, root count, prices, CartSheet, and checkout contracts remain unchanged. Filtering changes only what is rendered.

Mobile sticky stack:

```text
header hide-on-scroll
  -> category navigation (existing sticky band)
    -> search surface (sticky only while expanded and query-focused)
      -> results / groups
Cart FAB remains fixed above safe-area and above keyboard inset.
```

Search is directly below categories, uses the existing catalog max width, has a solid background/divider, and must not create a second permanent large sticky band. When the keyboard opens, the search surface stays visible and the FAB remains tappable or moves above the visual viewport. Existing category `z-index: 8`, Cart FAB `9`, and overlays remain above this new surface; implementation must add a named token rather than magic values.

With an empty query, existing IntersectionObserver behavior is retained. With a query, disconnect or ignore scroll-spy updates and derive active category from the explicit filter (`Todos` or selected category). Clearing the query reinstalls the observer and scrolls to the search surface; it does not restore a stale category selection.

## 6. Responsive and accessibility

Mobile targets: `320x568`, `390x844`, `430x932`; desktop: `1024`, `1280`, `1440`, `1600`. No horizontal overflow; controls are >= 44px; chips horizontally scroll without trapping focus; clear and category controls remain keyboard accessible. Desktop field max width aligns with catalog content and does not exceed the group width.

Use a native labeled search input (`type=search`), visible label or programmatic name `Buscar productos`, `aria-describedby` for result count, and polite live status for result changes. Escape clears only a non-empty query while focus stays in input; otherwise it retains current overlay behavior. Do not claim screen-reader or real-device PASS until QA.

## 7. Performance and observability

Create a memoized derived result model from the existing `products` and `categories`: normalized corpus is computed once per product-list/category-list change; filtering is computed from query/category state. Preserve `ProductCard` memoization and stable product IDs. Do not fetch configuration while filtering; configuration fetch remains only on opening a configurable product and cache behavior is unchanged.

```text
SEARCH REQUEST COUNT = 0
CATEGORY FILTER REQUEST COUNT = 0
SEARCH NEXT-ACTION COUNT = 0
SEARCH DB QUERY COUNT = 0
```

Add privacy-safe client observability only if the established catalog observability surface supports it: counts/timing buckets and query length, never raw query text, product names, cart contents, cookies, or PII. Virtualization, server search, fuzzy matching, analytics-driven thresholds, and tenant overrides are deferred for VERY_LARGE follow-up evidence.

## 8. Implementation scope and QA matrix

Expected implementation files are limited to the catalog client, category nav, new search/result UI, and scoped catalog CSS. No DB, migration, package, checkout, cart-domain, product customization, or server-action change is authorized.

| QA case | Expected |
| --- | --- |
| Small catalog | Existing category navigation unchanged; no search surface. |
| Medium / large threshold | Correct compact/default-expanded surface. |
| Accent/case/whitespace | Normalized token-AND results. |
| Active query + category | Grouped filtered results; chips are filters, not scroll links. |
| Clear | Resets query/category, focuses input, predictable scroll. |
| Modal/cart/post-add | Query/category persist; no contract regression. |
| Network | Zero search/filter requests and actions. |
| Keyboard | Input, clear, chips, cards, overlays, Escape, focus order. |
| Mobile / desktop | No overlap, clipping, or horizontal overflow. |

## 9. Frozen decisions and gates

```text
SPEC_COMPLETE = YES
SEARCH_DATA = ALREADY_AVAILABLE_CLIENT_SIDE
SEARCH_STRATEGY = LOCAL_NORMALIZED_TOKEN_AND
RESULT_PRESENTATION = GROUPED_BY_CATEGORY
STATE = LOCAL_REACT_ONLY
URL_PERSISTENCE = NO
QUEUE_GATE: PUBLIC-CATALOG-LARGE-CATALOG-NAV-IMPL-1 = ALLOWED
QUEUE_GATE: PUBLIC-CATALOG-RESIDUAL-ROADMAP-DEPLOY-1 = BLOCKED
```

Deferred debt: actual large-tenant performance evidence, virtualization threshold, real-device and screen-reader QA, and the prior post-add monitor automation coverage. None is a blocker for the implementation phase.

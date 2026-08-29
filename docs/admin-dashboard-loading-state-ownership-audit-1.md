# Admin Dashboard Loading State Ownership Audit

## 1. Objective

Forensically audit the sequential double-loading flash observed on `/admin/dashboard`:
1. First, an early small/fallback loading: small 28px spinner + `Cargando panel…` on canvas.
2. Second, a brief flash of the route-level loading: large mask spinner + `Cargando panel` + `Un momento…`.

The objective of this audit is to identify the authoritative owners of each loading screen, dissect the Next.js App Router render timeline, evaluate the root causes, and recommend a clean, single-surface unification plan.

---

## 2. Observed Double Loading Behavior

When navigating to or reloading `/admin/dashboard`:
- **Stage 1 (Initial SSR / Client Hydration)**: The user sees a full-screen loading state with a small (28px) border spinner and single-line text `Cargando panel…`.
- **Stage 2 (Segment Transition / Resolving)**: For a split second, the screen switches to a different visual presentation with a larger conic-gradient mask spinner (44–56px) and two lines of copy (`Cargando panel` in bold + `Un momento…` in muted text).
- **Stage 3 (Final Mount)**: The complete admin dashboard orders interface mounts.
- **Problem**: Sequential loading handoff creates perceptible UI jitter, layout flicker, and inconsistent visual scale.

---

## 3. Source Ownership Map

| Loading owner | File | Trigger | Copy | Spinner style | Scope | Seen before dashboard? | Can be unified? | Risk |
|---|---|---|---|---|---|---:|---:|---|
| **Protected Admin Shell Loading** | `components/admin/admin-shell.tsx` & `admin-shell.css` | `useBusinessSettings` client hook (`loading === true` during Supabase fetch) | `Cargando panel…` | 28px standard border spinner (`.admin-shell__loading-spinner`) | Shared across all protected admin routes (`/admin/*`) | **YES (T0–T1)** | **YES** | Low |
| **Dashboard Route Segment Loading** | `app/admin/(protected)/dashboard/loading.tsx` & `dashboard-loading.module.css` | Next.js App Router Suspense boundary during server component data loading (`Promise.all` in `dashboard/page.tsx`) | `Cargando panel`<br/>`Un momento…` | Large conic-gradient mask spinner (`clamp(44px, 11vw, 56px)`) | Scoped only to `/admin/dashboard` | **YES (T2, brief flash)** | **YES** | Low |
| **Client / Dashboard Orders Loading** | `components/admin/orders/admin-dashboard-orders.tsx` | N/A (receives pre-fetched server orders) | None | None | N/A | No | N/A | None |
| **Suspense Fallbacks** | None inside `dashboard/page.tsx` | Page is monolithic async server component | None | None | N/A | No | N/A | None |

---

## 4. Render Order Timeline

```text
Request: /admin/dashboard
  │
  ├─ T0 (Initial HTML & Client Mount):
  │    ProtectedAdminLayout renders <AdminShell businessId="...">
  │    AdminShell runs `useBusinessSettings` which initializes with `loading: true`
  │    AdminShell early-returns:
  │      <div className="admin-shell admin-shell--loading">
  │        <span className="admin-shell__loading-spinner" />
  │        <span className="admin-shell__loading-text">Cargando panel…</span>
  │      </div>
  │    => User sees: Small 28px spinner + "Cargando panel…" (no sidebar, no topbar)
  │
  ├─ T1 (Settings Resolved):
  │    `useBusinessSettings` finishes fetch -> `loading = false`
  │    AdminShell renders full shell (Sidebar + Topbar + <main>{children}</main>)
  │
  ├─ T2 (Route Segment Suspense Resolution):
  │    Next.js route suspense mounts `dashboard/loading.tsx` inside <main> while
  │    `AdminDashboardPage` server component finishes hydrating/rendering:
  │      <section className={styles.dashboardLoading}>
  │        <div className={styles.dashboardLoadingSpinner} />
  │        <p>Cargando panel</p>
  │        <p>Un momento…</p>
  │      </section>
  │    => User sees: Large mask spinner + "Cargando panel" + "Un momento…"
  │
  └─ T3 (Dashboard Ready):
       `AdminDashboardOrders` mounts inside `AdminPageLayout` -> Dashboard operational.
```

### Detailed Timeline Table

| Time | Visual | Owner Candidate | Evidence |
|---|---|---|---|
| **T0** | Full-screen canvas, 28px spinner, `Cargando panel…` | `components/admin/admin-shell.tsx` | Early return at lines 58–72 when `useBusinessSettings.loading === true`. |
| **T1** | Admin chrome mounts (sidebar/topbar) or seamless transition | `components/admin/admin-shell.tsx` | `loading === false` triggers main tree render at lines 74–101. |
| **T2** | Content area renders large mask spinner, `Cargando panel` + `Un momento…` | `app/admin/(protected)/dashboard/loading.tsx` | Next.js App Router automatic Suspense fallback for segment `/dashboard`. |
| **T3** | Dashboard Kanban, search, and metrics appear | `app/admin/(protected)/dashboard/page.tsx` | Async server component completes data promises. |

---

## 5. Root Cause Analysis

### Hypotheses Evaluation

- **Hypothesis A (VALIDATED)**:
  - The first loader is rendered by `AdminShell` while `useBusinessSettings` performs client-side feature flag and business settings resolution.
  - The second loader is rendered by Next.js App Router via `app/admin/(protected)/dashboard/loading.tsx` while the route segment resolves.
  - Because `AdminShell` wraps all protected children (including route segment loading boundaries), `AdminShell`'s internal loading always preempts and renders before `dashboard/loading.tsx` can ever be displayed.
- **Hypothesis B (REJECTED)**: There is no `app/admin/(protected)/loading.tsx` file.
- **Hypothesis C (REJECTED)**: `AdminDashboardOrders` does not render a client-side loading fallback.
- **Hypothesis D (VALIDATED)**: `app/admin/(protected)/dashboard/loading.tsx` is mounted too late (only after `AdminShell` finishes), creating a redundant second loading flash.
- **Hypothesis E (VALIDATED)**: If two loading boundaries exist in the architecture, they must share the identical visual presentation and scale to prevent any perceptible handoff.

---

## 6. Product Intent

The target user experience:
1. **Single Perceived Loading Surface**: The user must never see two different spinners, varying sizes, or text shifts during page load.
2. **Prominent, Designed Composition**:
   - Prominent spinner with intentional scale (44–56px).
   - Clear two-tier copy: Title `Cargando panel` (bold) + Subtitle `Un momento…` (muted).
   - Centered vertically and horizontally in the available viewport.
3. **Copy Decision**:
   - **Main Title**: `Cargando panel` (no trailing ellipsis).
   - **Subtitle**: `Un momento…` (with trailing ellipsis).

---

## 7. Solution Options

### Option A — Upgrade Shared `AdminShell` Loading & Remove `dashboard/loading.tsx` (RECOMMENDED)
- **Mechanism**:
  1. Upgrade the styles and markup in `components/admin/admin-shell.tsx` and `components/admin/admin-shell.css` to adopt the prominent spinner (44–56px) and two-tier copy (`Cargando panel` / `Un momento…`).
  2. Remove `app/admin/(protected)/dashboard/loading.tsx` and `dashboard-loading.module.css`.
- **Pros**:
  - Eliminates the double loader completely at the root.
  - Guarantees instant, single-surface presentation on initial load and page reloads.
  - Consistent across all admin protected routes (`/admin/dashboard`, `/admin/orders/[id]`, `/admin/products`, `/admin/settings`).
- **Cons / Risks**: Touches shared `AdminShell` loading; requires smoke testing `/admin/products`, `/admin/settings`, `/admin/orders/[id]`.

### Option B — Bypass `AdminShell` Loading on Dashboard
- **Mechanism**: Pass SSR settings or bypass client hook in `AdminShell`.
- **Cons / Risks**: High blast radius to auth/tenant contexts; breaks client-side feature flags.

### Option C — Extract Shared `AdminLoadingState` Visual Component
- **Mechanism**: Create `AdminLoadingState` and render it in both `AdminShell` and `dashboard/loading.tsx`.
- **Cons / Risks**: Keeps the redundant second Suspense mount in the DOM tree.

### Option D — Retain Small Spinner in Both Places
- **Cons / Risks**: Fails the product goal of achieving a prominent, catalog-aligned loading experience.

---

## 8. Recommended Implementation Option

**Recommendation: Option A (Upgrade Shared `AdminShell` Loading & Delete Redundant Route Loader)**

### Why:
1. `AdminShell` is the true, unavoidable first-paint loading boundary during client hydration.
2. Having a second route-specific `dashboard/loading.tsx` serves no purpose when `AdminShell` already handles the full-viewport loading state.
3. Upgrading `AdminShell` with the scaled spinner and clean copy gives the entire admin panel a premium, unified SaaS look without any flash.

---

## 9. Future Implementation Scope

- **Proposed Phase Name**: `ADMIN-DASHBOARD-LOADING-STATE-OWNERSHIP-UNIFICATION-1`
- **Files to Modify**:
  - `components/admin/admin-shell.tsx` (adopt `Cargando panel` + `Un momento…` hierarchy)
  - `components/admin/admin-shell.css` (adopt 44–56px conic-gradient mask spinner + typography classes)
  - `lib/orders/dashboard-loading-state.verify.ts` (update verify assertions)
- **Files to Delete**:
  - `app/admin/(protected)/dashboard/loading.tsx`
  - `app/admin/(protected)/dashboard/dashboard-loading.module.css`
- **Files to Keep Untouched**:
  - `app/admin/(protected)/dashboard/page.tsx`
  - `components/admin/admin-page-layout.tsx`
  - `app/globals.css`
  - `app/theme-tokens.css`
  - All DB/RPC/realtime files
- **Routes Requiring QA**:
  - `/admin/dashboard`
  - `/admin/products`
  - `/admin/settings`
  - `/admin/orders/[id]`

---

## 10. QA Required for Implementation

- **Desktop (1440px / 1024px)**: Single centered loader; 56px mask spinner; title `Cargando panel` + subtitle `Un momento…`; no second flash before dashboard renders.
- **Mobile (390px / 412px / 430px)**: 44px fluid spinner; centered; zero layout shift.
- **Theme**: Verified in Light and Dark mode.

---

## 11. P0–P3 Findings

- **P0**: None.
- **P1**: Sequential double-loading flash identified and mapped.
- **P2**: None.
- **P3**: `AdminShell` shared loading update will uniformly benefit other protected admin pages.

---

## 12. Gate

**ADMIN-DASHBOARD-LOADING-STATE-OWNERSHIP-AUDIT-1: AUDIT COMPLETE — READY FOR LOADING UNIFICATION**

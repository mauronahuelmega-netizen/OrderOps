# Universal `/login` — QA report (2026-10-21)

Branch: `commercial` · Worktree: `OrderOps-talo-first` · Local server: `http://localhost:3105`

Credentials: only in `ORDEROPS_DEMO_ACCESS.private.md` (not reproduced here).

## Functional summary

Single entry at `/login` authenticates once, resolves authorized areas on the server (`profiles` + `commercial_session` + `promoter_session`), then redirects, shows a chooser, or rejects with a controlled message. Legacy `/admin/login` and `/promoter/login` redirect to `/login`. Logout returns to `/login`.

## Automated checks

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS |
| `lib/commercial/auth/universal-login.verify.ts` | PASS |
| `lib/commercial/auth/commercial-access.verify.ts` | PASS |
| `lib/commercial/promoters/promoter-access.verify.ts` | PASS |
| `scripts/auth/qa-login-matrix.mjs` (8 demo accounts → areas) | PASS |
| `node scripts/commercial-core/verify-all.mjs` (full) | FAIL — pre-existing `schema-names.verify` missing `promoter_portal_preferences` in DATA_MODEL.md (unrelated to login) |

## Role matrix

| Role | Account (email only) | Expected | Auth resolution | Browser |
|------|----------------------|----------|-----------------|---------|
| Owner | `demo.valentina@local.test` | `/admin/dashboard` | PASS | PASS |
| Manager | `demo.sofia@local.test` | `/admin/dashboard` | PASS | NOT_VERIFIED (same area as owner) |
| Operator | `demo.diego@local.test` | `/admin/dashboard` | PASS | NOT_VERIFIED |
| Owner suspended | `demo.camila@local.test` | `/admin/dashboard`; billing via `next` | PASS | PASS → `/admin/billing` with suspended notice |
| Commercial | `demo.lucia@local.test` | `/commercial/opportunities` | PASS | NOT_VERIFIED (HTTP area redirect covered) |
| Finance | `demo.nicolas@local.test` | `/commercial/settlements` (not superadmin) | PASS | PASS; `/super-admin` → Acceso denegado (no loop) |
| Promoter | `demo.tomas@local.test` | `/promoter` | PASS | NOT_VERIFIED |
| Superadmin | `demo.martin@local.test` | multi-area chooser | PASS | PASS chooser → `/super-admin` |

## Scenario matrix

| Scenario | Result | Evidence |
|----------|--------|----------|
| Render `/login` | PASS | Screenshot `qa-universal-login-render.png` |
| Single area auto-redirect | PASS | Owner → dashboard; Finance → settlements |
| Multi-area selector | PASS | Martin → chooser (Comercial + Administración general); screenshot `qa-universal-login-chooser.png` |
| No authorized area | PASS (unit) | `resolveLoginDestination` → `none` + sign-out in action |
| Valid `next` | PASS | Camila `?next=/admin/billing` → billing |
| External/malicious `next` | PASS | Unit + unauthenticated `/login?next=https://evil.test` still 200 form (ignored) |
| Internal `next` without permission | PASS | Finance cannot authorize `/super-admin` |
| Session already started | PASS | Authenticated visit to `/login` resolves destination/chooser |
| Session expired message | PASS (code) | `buildLoginRedirect` sets `error=session` when auth cookie present without user |
| Legacy `/admin/login` | PASS | `307` → `/login` |
| Legacy `/promoter/login` | PASS | `307` → `/login` |
| Logout → `/login` | PASS | Browser |
| Access denied without loops | PASS | Finance on `/super-admin` → forbidden page with logout |
| Suspended owner billing | PASS | Distrito suspended notice on `/admin/billing` |
| Preserve path when unauthenticated | PASS | `curl -I /admin/dashboard` → `/login?next=%2Fadmin%2Fdashboard` (also promoter/commercial/super-admin) |
| Finance ≠ Superadmin | PASS | Area ids `["finance"]` only; forbidden on `/super-admin` |

## Regressions noted

1. **Hydration warning (pre-existing / ambient):** Dev overlay cites `app/layout.tsx` theme bootstrap script and occasionally `app/login/page.tsx`. Does not block login. Not fixed in this change (out of login scope / root layout).
2. **`schema-names.verify`:** Pre-existing gap for `promoter_portal_preferences` vs `DATA_MODEL.md`. Unrelated; not modified.
3. **Finance default path:** Old `resolvePostLoginPath` sent finance-only to `/commercial/billing`; universal login aligns with commercial index → `/commercial/settlements`. Billing remains reachable and authorized for finance.

## Limits / NOT_VERIFIED

- Full browser login click-path for manager, operator, commercial, promoter (covered by Auth API + area resolution matrix).
- Production deploy / push — not authorized.
- SQL/RLS disposable reset — not required for this change (no schema changes).

## Publish recommendation

Push branch `commercial` to `origin/commercial` after human review. Do **not** merge to `main` in this step.

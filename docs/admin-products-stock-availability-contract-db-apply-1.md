# ADMIN-PRODUCTS-STOCK-AVAILABILITY-CONTRACT-DB-APPLY-1

# Result

**PASS.** `PROD-P1-4` CLOSED remotely. DB half of `PROD-P2-10` CLOSED.

# Target

- project ref: `pkrsedmwxekbhlohhqds` (OrderOps)
- `.env.local` URL = `https://pkrsedmwxekbhlohhqds.supabase.co` = `get_project_url`
- migration: `supabase/migrations/20260909154400_products_stock_availability_contract.sql`
- hash (pre=post): `73536671431FC45EF4F35A2DE85D5934560174CE53A341C0CD62A101DB890A29`

# Apply

- status: APPLIED once via single-migration API (`apply_migration`)
- remote history: `20260909190021_products_stock_availability_contract` (exactly once)
- collateral migrations: none
- `supabase db push`: not used

# Contract

| case | result |
|---|---|
| untracked stock0 stays available | PASS |
| tracked stock0 forced unavailable | PASS |
| untracked 5→0 stays available | PASS |
| tracked 5→0 becomes unavailable | PASS |
| tracked stock0 + is_available-only enable | forced false |
| untracked stock0 + is_available-only enable | true |
| restock tracked 0→10 | stays false |
| manual unavailable + stock change | stays false |
| enable track_stock at zero | forced false |

# Trigger introspection

**Pre-apply:** `BEFORE INSERT OR UPDATE OF stock`; body `IF NEW.stock <= 0 THEN is_available=false` (ignored `track_stock`).

**Post-apply:** `BEFORE INSERT OR UPDATE OF stock, track_stock, is_available`; body `IF NEW.track_stock = true AND NEW.stock <= 0 THEN NEW.is_available := false`. No auto-enable branch.

# DB matrix

**9/9 PASS** inside `BEGIN … ROLLBACK`. Probe rows before rollback: 9. After rollback: **0**.

# Data safety

- persistent product mutations: **0**
- historical backfill: **NONE**
- counts identical pre/post apply:
  - untracked zero available: 1
  - untracked zero unavailable: 16
  - tracked zero available: 0
  - tracked zero unavailable: 0
  - public available total: **4 UNCHANGED**
  - products total: 20

# Production distinction

- **DB invariant:** LIVE on remote OrderOps after this apply.
- **App source** (create/edit helper, inline domain error, copy P3-13): LOCAL / UNDEPLOYED until package release.
- **App deploy:** not done in this phase.

# Remaining Products P1

**NONE.**

# Gate

Target proven · single migration applied · history recorded · remote definition matches · 9/9 matrix · zero persistent product mutations · no backfill · public available unchanged · hash immutable · verify PASS · diff PASS.

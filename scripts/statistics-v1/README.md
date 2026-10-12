# Statistics V1 — Phase 01 isolated environment

Run from OrderOps-Estadisticas on codex/estadisticas-v1. These tools are independent of Commercial Core's shared-target gate.

```text
node scripts/statistics-v1/isolation-policy.verify.mjs
node scripts/statistics-v1/isolated-environment.mjs prepare
node scripts/statistics-v1/isolated-environment.mjs start
node scripts/statistics-v1/assert-isolated-target.mjs
node scripts/statistics-v1/isolated-environment.mjs baseline
node scripts/statistics-v1/isolated-environment.mjs seed
node scripts/statistics-v1/isolated-environment.mjs smoke
```

prepare is one-shot, creates a random identity and exclusive ES256 signing key in the ignored `.runtime`. start rejects existing project resources/occupied ports and starts with application migrations and seeds disabled. Storage is enabled because historical migration7 requires storage.buckets. baseline temporarily enables only the exact, complete, hash-verified migration set from commit 0e430b08342b638b02392927ed560ea5e0950403. No Statistics migration can enter this manifest. Interrupted historical rebuilds can resume; files are never rewritten to repair failures.

seed creates synthetic Auth users with random passwords and business profiles (six roles in each of two businesses), with zero orders. smoke checks Auth, exclusive ES256 JWT signer, own profiles, foreign-owner profile rejection,119 baseline versions and absence of five new Statistics tables. It does NOT validate the future Statistics RPC or its role guard.

verify checks project/config/key/migration hashes, resource IDs/labels/networks/volumes, API/DB endpoints and private DB marker. Foreign containers may not attach to this network or share its volumes. No linked/remote target, reset, cleanup or Statistics-migration operation exists.

`enable-storage` is a narrowly scoped repair for an older Phase01 stack prepared without Storage: it verifies identity/marker, stops ONLY that project retaining its volume, enables Storage, restarts without automatic application migrations and confirms the same private marker. It does not operate on a shared stack. Current template already enables Storage.

Secrets, generated keys, raw CLI logs, caches, runtime migration copies and credentials remain in `supabase/statistics-v1-test/.runtime/`, ignored by its parent `.gitignore`. Never print/commit raw `supabase status -o json`, CLI start output or credential files. Public proof lives in docs/estadisticas-v1/fase-01-evidencia.json.

Owned scripts have independent lint:

```text
npx --no-install eslint --config scripts/statistics-v1/eslint.config.mjs scripts/statistics-v1/*.mjs
```

This does not repair or replace the existing repository ESLint configuration. New Statistics tables/triggers/RPC are design documents only until Phase02 authorization and migration review.

# M3 local historical migration rehearsal

This is migration tooling, not an application compatibility backend. No runtime
RPC or application module imports it. Real source export requires the separate
human authorization gate. `export` accepts only legacy local port 54332;
`export-real` is pinned to the explicitly authorized project/workspace/reader.
Never use legacy migrations on OrderOps.

## Requirements and commands

Run from OrderOps with Node.js, existing Majo `pg` dev dependency, Docker and the
OrderOps local Supabase stack. No package/lockfile changes are required. Tests:

```powershell
node --test scripts/migration-m3/core.test.mjs
node scripts/migration-m3/cli.mjs synthetic --artifact-set rehearsal-a
node scripts/migration-m3/cli.mjs profile --artifact-set rehearsal-a
node scripts/migration-m3/cli.mjs transform --artifact-set rehearsal-a
node scripts/migration-m3/cli.mjs rehearse synthetic/source.json synthetic/config.json --confirm-local-reset --artifact-set rehearsal-a
```

`rehearse` verifies local status before EACH pinned
`npx --yes supabase@2.119.0 db reset --local --no-seed`. It does not run M2 bootstrap.
Run 1 injects an interruption to prove rollback, imports, verifies, retries and
verifies unchanged results. Run 2 destroys/reset local target, imports identical
inputs and compares canonical reports exactly. An error exits nonzero.

All outputs are in ignored `.migration-m3-private/<artifact-set>/` and are
write-once. Choose a new artifact set for a revised ruleset; never overwrite a
snapshot or a previous report to hide failure. Code hashes must match config.
Only synthetic fixture definitions and sanitized aggregate evidence can be
committed. Private artifacts can contain PII and source actor IDs.

Individual `import` and `verify` commands use the same immutable inputs, safety
guards and verifier. Never print credentials. `export <workspace-id> <source-id>`
requires `M3_SOURCE_DATABASE_URL` pointing to legacy LOCAL :54332 and uses one
REPEATABLE READ READ ONLY transaction. No export is currently authorized against
real source without its explicit human authorization. Do not invoke existing
operational-reset/backup tooling for M3.

## Authorized real-source rehearsal

`export-real` verifies strict TLS with `M3_SOURCE_CA_CERT_PATH`, exact pooler
identity, PostgreSQL reader identity, read-only privileges, the 28 SELECT RLS
policies and the exact workspace. It exports the 14 authorized tables in one
REPEATABLE READ READ ONLY transaction. Effective TEMP is explicitly allowed but
unused: no source temporary objects or source writes are created.

After `profile-real`, `apply-real-decisions` binds the approved financial rules
to the immutable snapshot hash/schema fingerprint. Voided entries remain voided;
legacy void operations are provenance only, not new runtime voids. Financial
settlement requires effective release evidence, never operational delivery alone.

`configure-real-target` reads `M3_TARGET_WHATSAPP_NUMBER` only from the local
environment or ignored `.env.local`. It rejects an absent/empty value and the M2
placeholder. The contact is HUMAN_APPROVED_TARGET_CONFIGURATION, not source data.
Its value remains in private config/target only; public output uses fingerprints.

```powershell
node scripts/migration-m3/cli.mjs configure-real-target --artifact-set real-source-20261004-a
node scripts/migration-m3/cli.mjs transform source/snapshot.json decisions/target-config.json --artifact-set real-source-20261004-a
node scripts/migration-m3/cli.mjs rehearse source/snapshot.json decisions/target-config.json --confirm-local-reset --artifact-set real-source-20261004-a
```

The immutable config includes the approved contact, decision rules and code hash.
Reuse those exact private inputs for both runs; never overwrite previous reports.

## Historical semantics

Source rows are retained as private immutable-input evidence. Actor IDs remain
source provenance, never attributed to a current owner/importer. Target native
rows still require ordinary fields/actors; historical NULLs require matching
private evidence. Runtime cannot assign or change imported identity.

Unknown composition has no items and no technical total. Contractual quoted_total
can become agreed_total. Order operational and financial statuses require explicit
decision rules in config; no silent inference. A legacy reconciliation with no
provable statement cutoff is preserved in private evidence, not fabricated as a
Phase 3B closed period. Its exclusion from canonical runtime needs explicit reason.

`LEGACY_DIRECT_AVAILABLE_ORDER_PAYMENT` blocks transformation/import. No fake
committed, release, retention or transfer is generated. Openings remain opening
operations. Existing edited entries are imported as final source evidence with
their available source audit; lost entries are not reconstructed.

## Completion boundary

Synthetic PASS is NOT `MIGRATION_REHEARSAL_GREEN: YES`. Stop at the human gate.
Only an authorized immutable real snapshot, resolved anomalies and two identical
clean real rehearsals can satisfy the complete M3 objective. No source mutations,
hosted target, production Auth changes or production cutover belong here.

## Completed local evidence (2026-10-04)

Final synthetic canonical comparison:
`a7dbb45567c3be5b73cd28d1590284ef1a963fb6387aa721f1ab4217d4a606a1`.
Final authorized real-source canonical comparison:
`682698109eedbe60a5b19e9aa5f057e94f9313c841099b790a021e14fd5870c1`.
Both pairs used clean local resets, interruption rollback and identical retry
verification. Real snapshot:
`4aeec18c7ba0e171ad225c02e2b2aadf36f2c291d19c29d404168df58e4c9d90`.

The real input contains 207 classified source rows and 14 orders. Every imported
financial order has zero protection variance; unexplained monetary delta is 0.00.
Voided evidence contributes no effective money. The contact configuration is
human-approved target infrastructure, absent from the source snapshot.

Private final evidence is under `.migration-m3-private/real-final-20261004-b/`;
synthetic evidence is under `.migration-m3-private/synthetic-final-20261004-d/`.
Keep these ignored artifacts available for M4; the repository contains code and
sanitized hashes only, not historical rows, contact values or credentials.
This proves rehearsal, not production cutover. Production Auth, fresh-source
authorization, backups, recovery and GO/NO-GO remain M4 responsibilities.

# Concurrency harness

Isolated runner for three commercial races. Nothing in this directory is applied by the OrderOps or Majo stacks. Creating the container, installing SQL, and running the scenarios require a separate human authorization.

## Architecture

One disposable PostgreSQL 17 container, image `postgres:17`, name `orderops_concurrency_discard_` plus 8 lowercase hex characters. The database name is `orderops_concurrency`. No host port is published. The image may declare `EXPOSE 5432`; that is not a published port. `HostConfig.PortBindings` must be empty, and every entry in `NetworkSettings.Ports` must be null or empty. Data lives on a tmpfs at `/var/lib/postgresql/data`; there is no named volume and the script does not pull the image.

The container joins a private network named `orderops_concurrency_discard_net_` plus 8 hex characters, created with `--internal`. It does not join the default bridge and does not use host networking. `docker exec` and `dblink` use the container's Unix socket.

The container carries the label `orderops.concurrency.disposable=true`. The same label is required before a failed `docker run` may remove that container or its network. If the label cannot be verified, the script stops and leaves the resource for human review. Local state, including the marker token and the random database password, is stored outside Git at `%LOCALAPPDATA%\OrderOps\concurrency-harness\state.json`. `ORDEROPS_CONCURRENCY_STATE_DIR` can move that directory. The token is inserted into `concurrency_harness.identity` only after migrations and `dblink` succeed.

Two sessions are real `dblink` connections over the container's local socket:

`dbname=orderops_concurrency user=postgres`

There is no `host=` parameter. Both statements are sent with `dblink_send_query` before either transaction commits. The coordinator commits the first session that finishes, then collects the waiter. That waiter is expected to hit the production unique index and return the production conflict payload.

## Authentication and network

`POSTGRES_HOST_AUTH_METHOD=trust` is not set. A random password is stored only in the container environment and in the out-of-git state file. After initialization, `pg_hba.conf` is replaced with:

- `local all postgres trust` for the Unix socket
- `host all all all scram-sha-256` for every TCP connection

The socket exception is required. `docker exec` and `dblink` use that socket, and the connection literal has no password. Any TCP connection PostgreSQL might accept inside the container still requires the random password. No host port is published, so that TCP path is not reachable from Windows or from other Docker networks. No project credential is copied into the container.

## Dependencies

`supabase/concurrency-harness/prelude.sql` creates, without replacing commercial functions:

- roles `anon`, `authenticated`, and `service_role`, all `NOLOGIN`
- `auth.uid()`, reading `request.jwt.claim.sub`
- `auth.users` with the columns used by `register_promoter`
- `public.profiles(id, business_id)`
- `public.businesses(id)`
- `storage.buckets(id, name, public)`
- `concurrency_harness.applied_files`

`dblink` is installed only by `enable-dblink.sql`, and only after `current_database()` is `orderops_concurrency`.

Commercial migrations, in order, are listed in `scripts/commercial-core/concurrency/migrations.json`. The installer applies those files with `--single-transaction` and records them in `concurrency_harness.applied_files`. It does not write `supabase_migrations.schema_migrations`. A partial install stays at status `installing` and must be destroyed, not resumed.

## Commands

Run these later, in order, from the repository root. Do not run them as part of the static implementation.

```text
node scripts/commercial-core/concurrency/create-environment.mjs
node scripts/commercial-core/concurrency/verify-identity.mjs --phase=container
node scripts/commercial-core/concurrency/install.mjs
node scripts/commercial-core/concurrency/verify-identity.mjs --phase=database
node scripts/commercial-core/concurrency/run-scenarios.mjs
node scripts/commercial-core/concurrency/verify-cleanup.mjs
node scripts/commercial-core/concurrency/destroy-environment.mjs --confirm-name=<exact container name>
```

Allowed now:

```text
node --check scripts/commercial-core/concurrency/lib.mjs
node scripts/commercial-core/concurrency/static-check.mjs
```

## Time limits

| Boundary | Limit |
| --- | --- |
| Remote `lock_timeout` | 3s |
| Remote `statement_timeout` | 15s |
| Coordinator `statement_timeout` | 45s |
| First-finisher poll | 200 iterations of 50ms (10s) |
| Scenario process | 60s |
| Install file | 120s |
| Readiness after `docker run` | 30s |

A timeout is a failure. The harness does not turn a timeout into a passing conflict code.

## Guards

Execution stops when any of these is true:

- the container name does not match `orderops_concurrency_discard_` plus 8 lowercase alphanumeric characters
- the name matches OrderOps or Majo (`majo`, `supabase_db_orderops`, `orderops_db`)
- the database is not `orderops_concurrency`
- the disposable label or `concurrency_harness.identity` row is missing
- the marker token does not match the local state
- any host port is published, including loopback, wildcard, or an extra protocol
- the image reference or the local image id is not `postgres:17`
- the container is not on its recorded internal network
- TCP authentication is trust, or a host authentication override is present
- a connection string points at a remote host, or sets `host=` to anything except loopback
- the second session's `assert_session()` sees another database or another token
- container status is not the status required by that script
- `destroy` is missing `--confirm-name` equal to the recorded name and label

`assert_session()` also rejects a non-null server address outside loopback. A local socket reports a null address and is accepted.

## Scenarios

Fixtures use fixed `cc…` ids, commit before the race, and are removed on success and on failure, except the audit residue described below.

- `AUD-P03-01`: two `create_claim` calls, same promoter and business. One `"duplicate": false`. The other `"duplicate": true`. One provisional claim remains before cleanup.
- `AUD-P03-02`: two `confirm_attribution` calls, same opportunity, two superadmins. One success with `attribution_id`. The other `attribution_exists`. One confirmed attribution remains before cleanup.
- `BLK-CRM-02`: two `open_dispute` calls, same opportunity. One success with `dispute_id`. The other `dispute_open_exists` and no `dispute_id`. One open dispute remains before cleanup.

Results are appended outside Git to `results.jsonl` in the state directory. Each line has the scenario, PASS or FAIL, both exit codes, duration, the two session payloads when the scenario printed `HARNESS_RESULTS`, the assertion error, and the cleanup error. Tokens, the database password, and connection strings are redacted. Output stored there is capped.

## Pass and fail

PASS for a scenario: the scenario exit code is 0, both result classes are present exactly once, the final constrained row count is 1, and the Node cleanup also exits 0. Cleanup sets `concurrency.token` with `select set_config(..., :'harness_token', false) is not null` before calling `cleanup_*()`. psql substitutes that variable only outside dollar-quoted blocks, and the result column is the boolean `token_initialized`.

FAIL: any other result, a timeout, a guard rejection, a failed cleanup, or an operational fixture left behind. The runner prints the scenario error and the cleanup error, then stops. A failed cleanup does not hide the original error and cannot turn the scenario into PASS. A correct cleanup cannot turn a failed commercial assertion into PASS.

Global concurrency PASS is all three scenario PASS results plus `verify-cleanup.mjs` exit 0. That check prints `retained_audit_events=<count>`. This document does not record that runtime result.

## Audit retention

`commercial.audit_events` is append-only in production. The trigger `audit_events_append_only` rejects `UPDATE` and `DELETE` with `audit_append_only`. This harness does not disable that trigger, drop the foreign key, or delete those rows. The exception applies only to the disposable database. Production functions and migrations stay unchanged.

`confirm_attribution` inserts one `attribution.confirmed` event for the session that commits. Its `actor_account_id` is whichever internal fixture account won. It is not assumed to be session A. `actor_account_id` references `commercial.platform_accounts(id)` with the default restrict action, so that account and its `auth.users` row stay while the event exists. They are expected audit residue, not removable operational fixtures. The other internal account, the promoter account, both role assignments, the attribution, the interaction, the opportunity, the business, and the promoter are deleted.

Rows that must be gone after cleanup:

- claims, attributions, disputes, dispute parties, dispute events, and interactions of the three scenarios
- businesses, opportunities, promoters, and role assignments with the fixture ids
- fixture accounts and users that no retained `attribution.confirmed` event references

Rows that may remain until the container is destroyed:

- `attribution.confirmed` events whose `after.opportunity_id` is `cc222222-2222-4222-8222-222222222241`, whose promoter is `cc222222-2222-4222-8222-222222222221`, whose reason is `harness overlap`, and whose actor is `cc222222-2222-4222-8222-222222222211` or `cc222222-2222-4222-8222-222222222212`
- that actor account, with `kind = internal`, and its mapped user (`…222201` or `…222202`)

`verify-cleanup.sql` counts those events and rejects every other audit row. A `cc…` prefix alone does not authorize a leftover account, user, or operational row. An unreferenced fixture account or user fails the check. An audit event for another action or another opportunity fails it too. Referential integrity must still hold: every retained event has its account and user.

Logical cleanup removes operational fixtures inside the database. Physical destruction is `destroy-environment.mjs --confirm-name=<exact container name>`, which removes the tmpfs and therefore the retained audit rows with the container. A second `AUD-P03-02` in the same database cannot insert the preserved user again. Recovery after a failed race is to destroy this container and create a new one, not to rerun the scenario in place.

`create_claim` and `open_dispute` do not insert `audit_events`. Their cleanups still remove every fixture they create. Any other foreign key that blocks a delete stops the cleanup and fails the scenario. No cleanup function catches that error.

## Errors and recovery

| Condition | Action |
| --- | --- |
| `docker run` or network creation fails | Remove the generated container and network only when the disposable label matches. Otherwise stop for human review and keep state. |
| Container never becomes ready | State remains `creating`. Destroy with the recorded name. |
| Install fails or stops midway | State remains `installing`. Do not rerun install. Destroy the container. |
| Scenario times out or leaves operational rows | Run that scenario's cleanup only if identity still matches. Preserved audit rows and their actor account stay. Otherwise destroy. |
| Cleanup reports an unexpected audit dependency | Stop. Do not delete `audit_events` or the referenced account. Destroy the container and create a new one before another race. |
| State file is corrupt | `destroy-environment.mjs` still accepts the recorded name without requiring a valid token. |
| Wrong confirm name | Destroy exits without calling `docker rm`. |

Destroy uses `docker rm -f` on the confirmed name only. It does not prune volumes or stop other containers.

## Minimal PostgreSQL versus Supabase

This database is not a Supabase project. There is no GoTrue, no Storage API, and no `storage.objects` policy engine. `dblink` connects as `postgres`, so these races do not prove RLS for `authenticated`. The production functions under test are `SECURITY DEFINER` and enforce their own checks; the unique indexes are the concurrency controls.

`auth.uid()` is the request setting used by the commercial functions, not a Supabase JWT hook. Roles exist so migration grants parse. They cannot log in.

The original 19 SQL tests are unchanged. Their skipped `dblink` blocks are not this harness and are not a PASS.

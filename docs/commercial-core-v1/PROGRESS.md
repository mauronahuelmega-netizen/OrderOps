# Progress — Commercial Core V1

```yaml
updated_at: 2026-10-09
implementation_authorized: yes
current_phase: PHASE-03
current_task: none
next_task: P04-T01
product_code: in_progress
phase_01: closed
phase_02: closed
phase_03: closed
phase_03_post_audit: pending_runtime_validation
```

El paquete documental de `docs/commercial-core-v1/` se escribió en esta fecha. PHASE-01, PHASE-02 y PHASE-03 están cerradas históricamente. Hay una corrección post-auditoría PHASE-03 (AUD-P03-01..07) pendiente de validación SQL en runtime. P04-T01 no se inició.

## Tareas

| ID | Fase | Estado | Evidencia |
| --- | --- | --- | --- |
| P01-T01 | 01 | done | 2026-10-08. `node scripts/commercial-core/assert-local-supabase.mjs --fixture remote` exit 1. `node scripts/commercial-core/assert-local-supabase.mjs --fixture local` exit 0. `node scripts/commercial-core/assert-local-supabase.mjs` exit 0. Evidencia en vivo: `api_host=127.0.0.1`, `api_port=54321`, `db_host=127.0.0.1`, `db_port=54322`, `env_file=present`, `gate=pass`. Sin migraciones. |
| P01-T02 | 01 | done | 2026-10-08. Gate previo `node scripts/commercial-core/assert-local-supabase.mjs` exit 0 (`127.0.0.1:54321` / `127.0.0.1:54322`). `supabase migration up --local` exit 0; versión `20261008215314` en `supabase_db_OrderOps`. Semilla founder 29000000 / 5500000 / 12000000 / 4000 / 12. Test `supabase/tests/commercial/phase01_rls.sql` vía `psql` local exit 0 (ROLLBACK). Rollback `supabase/rollbacks/commercial_phase01_down.sql` no ejecutado. |
| P01-T03 | 01 | done | 2026-10-08. Dependencia: `phase01_rls.sql` reejecutado, exit 0. `npx tsx lib/commercial/auth/authorization.verify.ts` exit 0. `node scripts/commercial-core/verify-all.mjs` exit 0. Sin cambios de SQL ni de `lib/admin/permissions.ts`. |
| P01-T04 | 01 | done | 2026-10-08. Gate `node scripts/commercial-core/assert-local-supabase.mjs` exit 0. `npx tsx lib/commercial/auth/authorization.verify.ts` exit 0. `supabase migration up --local` aplicó `20261008233833` en `supabase_db_OrderOps`. `phase01_outbox.sql` exit 0: falla revierte la fila, rollback deja 0, commit deja 2 filas `pending` y el test las borra, `authenticated` recibe privilegio insuficiente. `node scripts/commercial-core/verify-all.mjs` exit 0 (2 archivos). Rollback no ejecutado. |
| P02-T01 | 02 | done | 2026-10-08. Gate `node scripts/commercial-core/assert-local-supabase.mjs` exit 0 (`127.0.0.1:54321` / `127.0.0.1:54322`). `supabase migration up --local` aplicó `20261009003119` en `supabase_db_OrderOps`. `phase02_crm.sql` exit 0 (ROLLBACK): `lost` sin motivo y `won` sin conversión rechazados, segunda abierta rechazada, nueva después de `lost` aceptada, soporte ve 0 oportunidades, `authenticated` no inserta, `anon` no lee. `phase01_rls.sql` exit 0. `phase01_outbox.sql` exit 0. `node scripts/commercial-core/verify-all.mjs` exit 0. Rollback de fase 02 no ejecutado. |
| P02-T02 | 02 | done | 2026-10-08. Gate exit 0 (`127.0.0.1:54321` / `127.0.0.1:54322`). `supabase migration up --local` aplicó `20261009004940`. `phase02_dedup.sql` exit 0 (ROLLBACK): mismo nombre y teléfono colapsa en un comercio, un solo campo queda `probable` y crea otro comercio, fiscal contradictorio no es `high`, `anon` no ejecuta la RPC. `npx tsx lib/commercial/crm/dedup.verify.ts` exit 0. Concurrencia real de dos sesiones no se pudo intercalar en este harness de un solo `psql`; el cuerpo toma `pg_advisory_xact_lock` y dos llamadas secuenciales dejan un lead. |
| P02-T03 | 02 | done | 2026-10-08. Gate exit 0. `supabase migration up --local` aplicó `20261009005251`. `phase02_pipeline.sql` exit 0 (ROLLBACK): `new` → `demo_done` escribe evento y auditoría, `lost` sin motivo devuelve `lost_reason_required`, tarea `open` devuelve `open_tasks_remaining`, `won` devuelve `won_requires_business`, `anon` no ejecuta. `npx tsx lib/commercial/crm/stages.verify.ts` exit 0. La RPC no menciona `attribution_claims`. |
| P02-T04 | 02 | done | 2026-10-08. Gate exit 0. `supabase migration up --local` aplicó `20261009005428`. `e2e_01.sql` exit 0 (ROLLBACK): un lead orgánico, una interacción `organic`, una oportunidad `new`, un outbox `demo.submitted`, la misma idempotency key no duplica, falta de rubro es `validation`, la sexta solicitud es `rate_limited`, `promoter_ref` queda como origen y no hay tablas de atribución ni comisión. `npx tsx lib/commercial/crm/demo-request.verify.ts` exit 0. `COMMERCIAL_RATE_LIMIT_SALT` no está en el repo: si falta, el servidor no hashea la IP y el tope por teléfono igual corre. Smoke visual del formulario pendiente de comprobar en localhost. |
| P02-T05 | 02 | done | 2026-10-08. Gate exit 0. `supabase migration up --local` aplicó `20261009005634`. `phase02_board.sql` exit 0 (ROLLBACK): soporte recibe 0 oportunidades, commercial recibe 1 y `contacting` deja evento. `npx tsx lib/commercial/auth/commercial-access.verify.ts` exit 0. El matcher incluye `/commercial/:path*` y conserva `/admin` y `/b`. No hay botón de ganar ni de confirmar atribución. |
| P02-T06 | 02 | done | 2026-10-08. Gate exit 0. `supabase migration up --local` aplicó `20261009005806`. `phase02_merge.sql` exit 0 (ROLLBACK): mismo nombre o mismo teléfono no fusiona solo, la fusión manual conserva los dos orígenes, marca `merged_into_id`, escribe auditoría y no borra la interacción. El cuerpo de la RPC no contiene `opportunity_attributions`. E2E-09 entre promotores queda para PHASE-03. |
| P03-T01 | 03 | done | 2026-10-08. Gate exit 0 (`127.0.0.1:54321` / `127.0.0.1:54322`). `supabase migration up --local` aplicó `20261009015312` en `supabase_db_OrderOps`. `phase03_promoters.sql` exit 0 (ROLLBACK): alta `registered`, `public_code` único, `registered` no opera, `pending_verification` → `active` devuelve `verification_incomplete`, un perfil con `business_id` no inserta cuenta promotor. `npx tsx lib/commercial/promoters/status.verify.ts` exit 0. El trigger ENG-11 de PHASE-01 se reutiliza. Rollback de fase 03 no ejecutado. |
| P03-T02 | 03 | done | 2026-10-08. Gate exit 0. `supabase migration up --local` aplicó `20261009015652` y `20261009015854` en `supabase_db_OrderOps`. `phase03_verification.sql` exit 0 (ROLLBACK): activar sin monotributo es `verification_incomplete`; con identity, cuit, monotributo verificados y contrato aceptado pasa a `active`; el reemplazo deja el CBU anterior `disabled`; el promotor lee dos cuentas propias y no el CBU ajeno. Bucket `commercial-documents` queda `public = false`. No se consultó AFIP. Rollback no ejecutado. |
| P03-T03 | 03 | done | 2026-10-08. Gate exit 0. `supabase migration up --local` aplicó `20261009020007`. `phase03_claims.sql` exit 0 (ROLLBACK): `registered` devuelve `promoter_not_active`; el reintento no duplica; una tarea no extiende; una interacción `meeting` sí; el vencimiento pasa el claim a `expired` y no existe `opportunity_attributions`. La extensión usa otra vez 30 días, el plazo ya escrito, no un número nuevo. Rollback no ejecutado. |
| P03-T04 | 03 | done | 2026-10-08. Gate exit 0. `supabase migration up --local` aplicó `20261009020204`. `e2e_02.sql` exit 0 (ROLLBACK): demo con `public_code` activo crea atribución `automatic_referral`; el promotor recibe `cannot_self_confirm`; commercial recibe `forbidden`; el claim orgánico sin actividad sustantiva no atribuye; la segunda confirmación es `attribution_exists`. No hay `promoter_commissions`. `e2e_01.sql` exit 0: el orgánico no crea claim ni atribución. |
| P03-T05 | 03 | done | 2026-10-08. Gate exit 0. `supabase migration up --local` aplicó `20261009020422`. `phase03_disputes.sql` exit 0 (ROLLBACK): el promotor no decide; la parte lee el expediente sin listar comisiones; el otro promotor recibe `forbidden`; la decisión `none` no borra la atribución. |
| P03-T06 | 03 | done | 2026-10-08. Gate exit 0. `supabase migration up --local` registró el archivo vacío `20261009020527` y aplicó el cuerpo en `20261009020618`. `e2e_06.sql` exit 0 (ROLLBACK): status `separated`, oportunidad reasignada, protección de 90 días solo con atribución confirmada e interacción previa, el claim provisional no protege, el contrato sigue, un claim nuevo es `promoter_not_active`. No hay comisiones. `20261009021459` impide que `transition_promoter_status` marque `separated`; ese estado solo sale de `separate_promoter`. `phase03_promoters.sql` reejecutado, exit 0. |
| P03-T07 | 03 | done | 2026-10-08. Gate exit 0. `supabase migration up --local` aplicó `20261009020811`. `phase03_panel.sql` exit 0 (ROLLBACK): B no ve el claim ni el nombre de A; `registered` no registra comercio; `won` es `forbidden`. `phase03_merge_attribution.sql` exit 0: la fusión no cambia `promoter_id`. `npx tsx` vía `verify-all` incluye `promoter-panel.verify` y `promoter-status.verify`. El panel usa el cliente de sesión, no service role. |
| P04-T01 | 04 | pending | — |
| P04-T02 | 04 | pending | — |
| P04-T03 | 04 | pending | — |
| P04-T04 | 04 | pending | — |
| P05-T01 | 05 | pending | — |
| P05-T02 | 05 | pending | — |
| P05-T03 | 05 | pending | — |
| P05-T04 | 05 | pending | — |
| P05-T05 | 05 | pending | — |
| P05-T06 | 05 | pending | — |
| P05-T07 | 05 | pending | — |
| P05-T08 | 05 | pending | — |
| P06-T01 | 06 | pending | — |
| P06-T02 | 06 | pending | — |
| P06-T03 | 06 | pending | — |
| P06-T04 | 06 | pending | — |
| P06-T05 | 06 | pending | — |
| P06-T06 | 06 | pending | — |

## Errores abiertos

Ninguno en PHASE-01.

## Bloqueos vigentes

Siguen abiertos en [DECISIONS_AND_BLOCKERS.md](DECISIONS_AND_BLOCKERS.md): `BLK-ECO-01`, `BLK-ECO-02`, `BLK-ECO-03`, `BLK-CRM-01`, `BLK-SEC-01`, `BLK-SEC-02`, `BLK-PRIV-01`, `BLK-LEG-01`.

`BLK-CRM-02`: resuelto por decisión humana el 2026-10-09 (máximo una disputa `open` por oportunidad). Implementación escrita en `20261009140600`; aplicación local y PASS SQL pendientes.

`BLK-ENV-01`: en esta sesión Cloud Agent el gate `node scripts/commercial-core/assert-local-supabase.mjs` falló (`supabase status failed`; sin API/DB local). No se ejecutó `supabase migration up --local`, ni `db push`, ni `db reset`, ni conexión remota. Las migraciones correctivas `20261009120000` y `20261009140600` quedan creadas y no aplicadas. Cada migración futura vuelve a ejecutar el gate.

`BLK-DOC-01`: resuelto el 2026-10-08. `product_code` es el código funcional de Commercial Core V1 y queda `in_progress`. El historial está en la sección 2 y la decisión en la sección 4 de [DECISIONS_AND_BLOCKERS.md](DECISIONS_AND_BLOCKERS.md).

## Decisiones de esta sesión

Se persistió el plan. No se eligió base comisionable, ni pago parcial, ni plazos de privacidad.

2026-10-08: se agregó [EXECUTION_RULES.md](EXECUTION_RULES.md).

2026-10-08: el usuario autorizó el inicio de la implementación. Se ejecutó solo P01-T01. `implementation_authorized` pasó a `yes` después de la corrida, con la evidencia de arriba.

2026-10-08: P01-T02 aplicada solo en local. No se inventaron reglas de los `BLK-*` abiertos. P01-T03 no se inició.

2026-10-08: P01-T03 agregó la autorización pura en `lib/commercial/auth`. P01-T04 no se inició.

2026-10-08: P01-T04 cerró el outbox transaccional. PHASE-01 queda cerrada. PHASE-02 no se inició.

2026-10-08: corrección documental posterior a la auditoría. PHASE-01 sigue cerrada. P02-T01 sigue `pending` y esta sesión no lo inicia. Se actualizó el texto vigente de `BLK-ENV-01` sin borrar la evidencia histórica. Se registró `BLK-DOC-01` porque `product_code` no está definido. PHASE-02 documenta el alcance de `crm.read` para soporte, sin implementarlo.

2026-10-08: decisión humana. `BLK-DOC-01` queda resuelto. `product_code` pasa a `in_progress`. PHASE-01 sigue cerrada. P02-T01 sigue `pending`.

2026-10-08: P02-T01 aplicó las tablas CRM en local. Soporte no lee filas CRM. P02-T02 no se inició.

2026-10-08: P02-T02 a P02-T06 quedaron `done`. PHASE-02 se cierra. `npx tsc --noEmit --pretty false --incremental false` exit 0. Regresiones SQL de PHASE-01 y PHASE-02 exit 0. `verify-all` exit 0 (6 archivos). No se abrió el formulario en el navegador. P03-T01 no se inició.

2026-10-08: PHASE-03 quedó cerrada. P03-T01 a P03-T07 están `done`. Regresiones SQL de PHASE-01, PHASE-02 y PHASE-03 exit 0. `verify-all` exit 0 (9 archivos). `npx tsc --noEmit --pretty false --incremental false` exit 0. `/promoter` sin sesión redirige a `/admin/login`. No se abrió el panel con una cuenta de promotor. P04-T01 no se inició.

2026-10-08: corrección posterior a la auditoría de PHASE-02. No reabre P02-T01..T06 ni inicia P03-T01. Gate `node scripts/commercial-core/assert-local-supabase.mjs` exit 0 (`127.0.0.1:54321` / `127.0.0.1:54322`). `supabase migration up --local` aplicó `20261009013318` en `supabase_db_OrderOps`. `phase02_audit_fix.sql` exit 0 (ROLLBACK): sin hash responde `unavailable`; cinco teléfonos distintos con el mismo hash pasan y el sexto es `rate_limited`; cinco hashes distintos con el mismo teléfono pasan y el sexto es `rate_limited`; la repetición pública no crea otro comercio y no devuelve ids. `anon` no ejecuta los siete wrappers. `authenticated` ejecuta el listado y la transición y recibe `unauthenticated` sin sesión. `service_role` ejecuta el alta y no la fusión. `phase01_rls.sql`, `phase01_outbox.sql`, `phase02_crm.sql`, `phase02_dedup.sql`, `phase02_pipeline.sql`, `e2e_01.sql`, `phase02_board.sql` y `phase02_merge.sql` exit 0. `node scripts/commercial-core/verify-all.mjs` exit 0 (7 archivos). `npx tsc --noEmit --pretty false --incremental false` exit 0. `/commercial` y `/commercial/opportunities` sin sesión redirigen a `/admin/login`. `/admin/login` respondió 200. El envío completo del formulario en el navegador local no llegó al servidor: faltaba runtime `VERCEL=1` y el llenado de todos los campos quedó incompleto. El rechazo sin IP confiable está cubierto por `demo-ip.verify.ts`.

2026-10-09: corrección post-auditoría PHASE-03 (AUD-P03-01..07). No reabre P03-T01..T07 ni inicia P04-T01. Base `3893010e1dc8339e0b0ccd174d604678ba42a89f` en `cursor/commercial-core-v1-integration`. Gate local falló; `SQL_RUNTIME_VALIDATION: NOT_EXECUTED`. Migración aditiva `20261009120000_commercial_phase03_audit_hardening.sql` creada y no aplicada (revoke helper; race handlers de claim/atribución por constraint name; `open_dispute` con partes vinculadas y oportunidad no archivada; validación de `evidence_path`; sin policies Storage); test `phase03_audit_hardening.sql`; paths de `phase03_verification.sql` alineados a DATA_MODEL; docs (SECURITY_MATRIX, DATA_MODEL, DECISIONS/`BLK-CRM-02`, PHASE-03 T01, PROGRESS, LIVING_MEMORY). AUD-P03-05 unicidad de disputas abiertas → `BLK-CRM-02`. AUD-P03-06: formulario demo sin fiscal → `fiscal=null` conservado; sin CUIT nuevo. AUD-P03-07: documentación de separación solo vía `separate_promoter`; guardia `20261009021459` intacta. Publicar el código no declara PASS SQL ni cierra hallazgos en runtime.

2026-10-09: implementación quirúrgica de `BLK-CRM-02` tras decisión humana. Política: máximo una disputa `open` por `opportunity_id`; `retained` no cuenta como abierta; históricas no abiertas permitidas. Migración aditiva `20261009140600_commercial_blk_crm_02_one_open_dispute.sql` (índice `attribution_disputes_one_open_per_opportunity_idx`; `open_dispute` → `dispute_open_exists` sin filtrar id). Test `phase03_blk_crm_02.sql` (casos A–G). Ajuste de expectativa en `phase03_audit_hardening.sql`. Gate local falló; `SQL_RUNTIME_VALIDATION: NOT_EXECUTED`; `CONCURRENCY_RUNTIME_VALIDATION: NOT_EXECUTED`. Publicar el código no declara PASS SQL. PHASE-04 no se inicia.

## Próxima tarea segura

Validar en runtime local las migraciones `20261009120000` y `20261009140600` con `phase03_audit_hardening.sql` y `phase03_blk_crm_02.sql` cuando el gate pase. Luego P04-T01 en una sesión posterior. Esta sesión no empieza PHASE-04.

## Recuperación

Si esta tabla y el git discrepan, gana el git más la lectura de archivos, y esta tabla se corrige antes de codificar.

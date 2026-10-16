# Seguimiento postintegración — Cloud OrderOps — 2026-10-16

Continuación de solo lectura de `docs/audits/cloud-post-integration-audit-2026-10-16.md`. No se modificó Cloud, Auth, Storage, `.env.local` ni el árbol existente. No hubo commit, push ni deploy. PHASE-06 sigue abierto. Esta pasada no declara la V1 lista para lanzamiento.

Veredicto: `PASS_WITH_LIMITATIONS`

## 1. Git

| Dato | Resultado |
|---|---|
| Rama | `cursor/commercial-core-v1-integration` |
| HEAD | `d13f7b32331e66feff4d4de0116e3e9e44faad52` |
| Modificado | `ORDEROPS_LIVING_MEMORY.md` (`12` inserciones) |
| Sin seguimiento | `.codex-remote-attachments/`, `docs/audits/`, `docs/landing-recovery-validation-2026-10-11.md`, `tmp/landing-recovery-2026-10-11/`, `supabase/migrations/20260917210151_cloud_rls_search_path_alignment.sql` |

Después de TypeScript, `verify-all` y el chequeo estático, `git status --short` mostró el mismo conjunto. No se agregó ni se descartó nada.

## 2. Pruebas ejecutadas

| Comprobación | Por qué es segura | Resultado |
|---|---|---|
| `npx tsc --noEmit --pretty false --incremental false` | `tsconfig.json` ya tiene `noEmit`. El flag anula `incremental: true`, así que no escribe `.tsbuildinfo`. | Exit 0. Sin diagnósticos. |
| `node scripts/commercial-core/verify-all.mjs` | Inspeccionado antes de correrlo. Recorre `lib/commercial/**/*.verify.ts` con `tsx`. Esos archivos leen código y SQL del disco y usan `node:assert`. No abren cliente Supabase ni Postgres. | Exit 0. `verify-all: 18 file(s) passed`. `schema-names.verify` nombró 43 tablas. |
| `node scripts/commercial-core/concurrency/static-check.mjs` | El encabezado declara que no llama a Docker ni a PostgreSQL. Lee el harness y `migrations.json`. | Exit 1. Único fallo impreso: `migrations.json does not match the commercial migration files`. |

El inventario del harness tiene 21 archivos comerciales. En disco hay 47 cuyo nombre contiene `commercial`. Los 26 que faltan en la lista empiezan en `20261011020000_commercial_phase04_conversion.sql` y llegan hasta `20261016182000_commercial_phase06_privacy_open_unique.sql`. No hay entradas de la lista ausentes en disco. La adaptación `20260917210151` no entra en ese filtro: su nombre no contiene `commercial`.

`npx eslint . --max-warnings 0` se ejecutó y no llegó a revisar archivos. ESLint 9.39.4 falló al cargar `eslint.config.mjs` con `TypeError: Converting circular structure to JSON` dentro de `@eslint/eslintrc`. No se usó `lint:fix`. No se cambió la configuración.

## 3. Scripts inspeccionados y no ejecutados

| Script | Motivo |
|---|---|
| `scripts/validate-order-assignment-flag.mjs` | Lee `.env.local` y crea un cliente con `SUPABASE_SERVICE_ROLE_KEY`. |
| `scripts/validate-order-assignment-qa-matrix.mjs` | Mismo cliente. Además llama `.update({ order_assignment_enabled })` sobre `business_settings`. |
| `scripts/commercial-core/e2e09-race.mjs` | Ejecuta SQL con `docker exec` y `psql` contra el contenedor QA. |
| `dispatch-outbox.mjs`, `seed-local-users.mjs`, `apply-commercial-fixture.mjs` | Operaciones de correo, usuarios o fixtures. |
| `concurrency/install.mjs`, `create-environment.mjs`, `run-scenarios.mjs`, `destroy-environment.mjs` | Crean o usan una base desechable. |
| `next build`, `lint:fix`, `generate-admin-pwa-icons.mjs` | Escriben artefactos. |
| Suites SQL de `supabase/concurrency-harness` | No se lanzaron. El chequeo estático solo leyó esos archivos. |

Los `*.verify.ts` de pedidos y marketing que están fuera de `lib/commercial` no se ejecutaron. El runner seguro y acotado es `verify-all.mjs`.

## 4. PostgreSQL frente a la configuración administrada

| Capa | Qué se sabe | Qué no |
|---|---|---|
| PostgreSQL | Ledger 137, última versión `20261016182000`, adaptación presente. 43 tablas `commercial` con RLS forzado. `anon` sin `USAGE`. `authenticated` con `USAGE` y `SELECT` en 38 tablas. `authenticator.rolconfig` no contiene `pgrst.db_schemas`. | El catálogo de Postgres no guarda la lista de esquemas que publica el servicio PostgREST. |
| `supabase/config.toml` | Local. `schemas = ["public", "graphql_public"]`. `commercial` no aparece. `commercial-access.verify` vuelve a afirmarlo. | No es el panel del proyecto `pkrsedmwxekbhlohhqds`. |
| Panel Data API | No leído en esta pasada. | La exposición de `commercial` sigue `NOT_VERIFIED`. Un `401` sin credenciales no la demuestra. |
| Auth administrado | Advisor previo: protección de contraseñas filtradas desactivada. | Site URL y redirects de Cloud siguen `NOT_VERIFIED`. |
| App local | `.env.local` apunta al Supabase local. No se releyó ni se modificó. | Variables del hosting de Next.js no inspeccionadas. |
| Edge Functions | Lista vacía en la auditoría anterior. | No se redesplegó ni se volvió a listar. |
| Storage | Buckets leídos en la auditoría anterior: `commercial-documents` privado y vacío; `product-images` y `business-assets` públicos. | Sigue sin una petición autenticada de objeto. |

## 5. Matriz de lectura autenticada

No hay una sesión de prueba que se pueda usar sin crear usuarios, sin leer secretos y sin apuntar la app local a Cloud. Todas las filas quedan `NOT_VERIFIED` en ejecución. La columna de expectativa sale del código.

| Caso | Expectativa en código | Ejecución |
|---|---|---|
| Comercial o superadmin interno | `requireCommercialPrincipal` exige usuario, `commercial_session.ok`, `kind = internal` y rol `commercial` o `superadmin`. Si no, `forbidden()`. | `NOT_VERIFIED` |
| Finanzas dentro del área comercial | `requireCommercialArea` también admite `finance`. El índice redirige a `/commercial/settlements` si el rol es solo Finanzas. Preparar liquidación, aprobar y registrar pago están en `lib/commercial/auth/permissions.ts`, con `sod_violation` si el mismo actor prepara y aprueba, o aprueba y paga. | `NOT_VERIFIED` |
| Owner o manager de tienda sin rol comercial | El dashboard de tienda usa `requireAdminContext` y permisos de `lib/admin/permissions.ts`. Esas rutas no conceden rol `commercial`. Un owner que llame al área comercial cae en `forbidden()` si `commercial_session` no lo autoriza. | `NOT_VERIFIED` |
| Promotor | Sin usuario, `decidePromoterAccess` devuelve `login` y `requirePromoterPrincipal` va a `/promoter/login`. Con usuario y `promoter_session.ok` distinto de true, `forbidden()`. La sesión devuelve un `promoter_id`. | `NOT_VERIFIED` |
| Sin sesión | Comercial y promotor redirigen a su login antes de la RPC de sesión. El middleware solo refresca cookies; no redirige. | `NOT_VERIFIED` |
| Documentos privados | `commercial-documents` no tiene políticas en `storage.objects`. La migración `20261009120000` lo deja así a propósito. La app no llama `storage.from("commercial-documents")`. | `NOT_VERIFIED` |

## 6. Cómo preservar la integración en Git

No se ejecutó `git add` ni `git commit`.

Cuando se autorice un commit, el conjunto mínimo es:

1. `supabase/migrations/20260917210151_cloud_rls_search_path_alignment.sql`
2. `ORDEROPS_LIVING_MEMORY.md`, después de releer las 12 líneas para confirmar que solo describen la integración.
3. Los informes de esta cadena en `docs/audits/`: catálogo, matriz, plan, validación, ejecución, auditoría postintegración y este seguimiento.

Quedan fuera de ese commit: `.codex-remote-attachments/`, `tmp/landing-recovery-2026-10-11/`, `docs/landing-recovery-validation-2026-10-11.md`, `.env.local` y `supabase/.temp/`. No usar `git add -A`.

Hasta ese commit, un clon de `d13f7b3` no contiene la adaptación que Cloud ya aplicó.

## 7. Hallazgos de esta pasada

| ID | Clase | Hallazgo |
|---|---|---|
| G1 | HIGH | Sigue sin commit la migración de adaptación y la documentación. El estado de Git no cambió. |
| G2 | MEDIUM | `migrations.json` del harness de concurrencia está congelado en 21 archivos. Faltan 26 migraciones de PHASE-04, PHASE-05 y PHASE-06. El chequeo estático falla por eso. No se editó el JSON. |
| G3 | MEDIUM | ESLint no arranca por un error circular al validar la config compartida de Next. No se revisó el código con el linter. |
| G4 | NOT_VERIFIED | Esquemas expuestos por el servicio PostgREST. Postgres no los declara. |
| G5 | NOT_VERIFIED | Las seis filas de la matriz autenticada, Auth del panel y el hosting de Next.js. |

No apareció un bloqueo nuevo de Cloud. TypeScript y las 18 verificaciones comerciales de archivo pasan. El fallo del harness es un inventario local desactualizado, no una diferencia del ledger.

## 8. Plan mínimo para cerrar la auditoría

1. En el panel del proyecto, leer Data API → Exposed schemas. Confirmar `public` y `graphql_public`, sin `commercial`. No cambiar el valor en la misma visita si el objetivo sigue siendo solo auditar.
2. Con autorización explícita, hacer el commit mínimo de la sección 6. No incluir adjuntos ni temporales.
3. Preparar sesiones ya existentes, sin crear usuarios, para las seis lecturas de la matriz. No escribir pedidos, finanzas ni objetos.
4. En un cambio de código aparte, actualizar `scripts/commercial-core/concurrency/migrations.json` para que el chequeo estático cubra PHASE-04 en adelante. No forma parte de esta auditoría.
5. No cerrar PHASE-06 y no tratar el resultado como aptitud de lanzamiento.

## 9. Veredicto

`PASS_WITH_LIMITATIONS`

La compilación y las verificaciones comerciales de archivo pasan. Cloud no se volvió a escribir. Siguen abiertos la reproducibilidad desde Git, la lista administrada de esquemas y cualquier prueba que necesite una sesión.

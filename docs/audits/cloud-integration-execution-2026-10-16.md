# Integración gradual en Cloud OrderOps — 2026-10-16

La integración autorizada quedó aplicada en el proyecto canónico. PHASE-06 sigue abierto.

## Git

- HEAD inicial y final: `d13f7b32331e66feff4d4de0116e3e9e44faad52`
- Rama: `cursor/commercial-core-v1-integration`
- No hubo commit, push ni deploy.
- Cambios sin seguimiento conservados: `.codex-remote-attachments/`, `docs/audits/`, `docs/landing-recovery-validation-2026-10-11.md`, `tmp/landing-recovery-2026-10-11/` y `supabase/migrations/20260917210151_cloud_rls_search_path_alignment.sql`.
- `ORDEROPS_LIVING_MEMORY.md` sigue modificado y sin commit.

## Proyecto

- Nombre: OrderOps
- Ref: `pkrsedmwxekbhlohhqds`
- Organización: MauroDev (`ttgsigcooaqhbsykphqj`)
- Región: `us-east-1`
- Estado en el preflight: `ACTIVE_HEALTHY`
- PostgreSQL: 17.6.1.111
- CLI: `supabase@2.120.0`
- Sesiones DDL activas en el preflight: 0

## Respaldo verificado antes de escribir

Directorio: `C:\Users\Oasis Desktop\Desktop\Full Stack Developer\legacy-backups\OrderOps`

| Archivo | Bytes | SHA-256 |
|---|---:|---|
| `OrderOps-cloud-pkrsedmwxekbhlohhqds-20261016T192500Z-schema.sql` | 125380 | `89BD9B449A8988DA6F7183736A1FFB4C559E533AE9C5CFCEA7F09529915FF546` |
| `OrderOps-cloud-pkrsedmwxekbhlohhqds-20261016T192500Z-data.sql` | 338416 | `C2CB9C13ADFFB7708BA2CDEB16EF2120C95623E18BBD6BF23F5BB7841A70D787` |
| `OrderOps-cloud-pkrsedmwxekbhlohhqds-20261016T192500Z-managed-schema.sql` | 245397 | `2D7FA28AE11D63161A4DEE349D707D6E976FA9F8FB32B1B9382E9DA28FD1A598` |
| `OrderOps-cloud-pkrsedmwxekbhlohhqds-20261016T192500Z-managed-data.sql` | 129150 | `8B2B8DAC12C4115D4D5EEB01734859D0AF69FBD1E1F25EE64CE46229027155F8` |
| `OrderOps-cloud-pkrsedmwxekbhlohhqds-20261016T192500Z-roles.sql` | 358 | `4350A72B5EC109888E740C17F3EB4DA2FCD95AB73AF26499538ED0BF615DB543` |

Los cinco coincidieron con el manifiesto. No se generó otro respaldo. Los logs de la ejecución están en `legacy-backups\OrderOps\cloud-integration-2026-10-16`.

Adaptación: `supabase/migrations/20260917210151_cloud_rls_search_path_alignment.sql`, 2261 bytes, SHA-256 `28EBF22F6017099527A953BB8108CB4893B0E6A60FAF55DC2ABB25BEDC9117F2`.

## Historial

Preflight: 14 filas remotas, iguales a la auditoría.

`migration repair --status applied` registró estas 52 versiones, tomadas una por una de los grupos A, B y C de la matriz, sin ejecutar su SQL:

`20260426214500`, `20260426215500`, `20260426221000`, `20260426222500`, `20260426224000`, `20260426230000`, `20260426231500`, `20260426234000`, `20260427012000`, `20260427021000`, `20260427030000`, `20260427103000`, `20260505233000`, `20260506001500`, `20260506013000`, `20260512090000`, `20260515173000`, `20260516183000`, `20260516201000`, `20260516213000`, `20260516233000`, `20260518093000`, `20260518113000`, `20260604143000`, `20260604162000`, `20260607210325`, `20260608143000`, `20260608144500`, `20260608150000`, `20260608153000`, `20260608160000`, `20260608170000`, `20260610103000`, `20260610110000`, `20260712090000`, `20260713030000`, `20260716224005`, `20260717010500`, `20260717120000`, `20260717130000`, `20260717140000`, `20260717170000`, `20260813010000`, `20260817043000`, `20260827234500`, `20260909040000`, `20260909154400`, `20260910010123`, `20260910022504`, `20260915180000`, `20260916180000`, `20260917210150`.

Después del alta el ledger tenía 66 filas y los conteos seguían en 4 negocios y 78 pedidos.

`migration repair --status reverted` retiró solo estas 14 filas:

`20260713125751`, `20260716224206`, `20260717010503`, `20260717020549`, `20260717034117`, `20260717043403`, `20260717162941`, `20260909070121`, `20260909190021`, `20260910014445`, `20260910040100`, `20260915215741`, `20260916195024`, `20260917212712`.

El ledger quedó en esas 52 versiones, sin extras ni faltantes. Conteos de negocios, pedidos, productos, perfiles, Auth, objetos y buckets sin cambio.

## Tandas

Ningún `db push` salió del directorio raíz del repositorio. Todos usaron `--skip-vault`, `--linked` y `--project-ref pkrsedmwxekbhlohhqds`.

| Tanda | Dry-run | Aplicación | Ledger después |
|---|---|---|---:|
| Adaptación `20260917210151` | solo ese archivo | aplicada | 53 |
| 1. Finanzas, 33 archivos `20260926010000`–`20261002103000` | solo esos 33 | aplicada | 86 |
| 2. M2/M3, cuatro archivos | solo esos cuatro | aplicada | 90 |
| 3. Commercial Core, 45 archivos `20261008215314`–`20261016120000` | solo esos 45 | aplicada | 135 |
| 4. PHASE-06, dos archivos | solo esos dos | aplicada | 137 |

Después de finanzas: 4 negocios, 78 pedidos, 78 `itemized`, `order_financials` 0, `finance_accounts` 0, esquema `commercial` ausente.

Antes de Commercial Core el esquema seguía ausente. Después hay 42 tablas `commercial`, todas con RLS, y 0 filas en comisiones, liquidaciones, pagos, facturas, contactos y outbox.

## Conteos

| Medida | Antes | Después |
|---|---:|---:|
| Negocios | 4 | 4 |
| Pedidos | 78 | 78 |
| Pedidos itemizados | — | 78 |
| Productos | 9 | 9 |
| Perfiles | 5 | 5 |
| Usuarios de Auth | 5 | 5 |
| Objetos de Storage | 51 | 51 |
| Buckets | 2 | 3 |
| Ledger | 14 | 137 |

El bucket nuevo es `commercial-documents`, privado y con 0 objetos. Lo inserta `20261009015652_commercial_phase03_verification.sql`. `product-images` sigue con 38 objetos y `business-assets` con 13. `order_financials` y `finance_accounts` siguen en 0.

## Smoke test

- El ledger tiene 137 versiones, empieza en `20260426214500` y termina en `20261016182000`.
- Coincide exactamente con los 137 archivos locales. Las 14 versiones antiguas no están.
- `privacy_requests_one_open_idx` existe.
- `commercial.notification_preferences` tiene `FORCE RLS` y 0 políticas.
- Existen `commercial.claim_outbox_batch`, `record_email_result` y `release_outbox`.
- `anon` no puede ejecutar `public.list_settlement_workspace`, los cuatro wrappers públicos de archivo y privacidad, ni `commercial.archive_opportunity`, `commercial.open_privacy_request` y `commercial.claim_outbox_batch`.
- `authenticated` puede ejecutar `public.list_settlement_workspace` y los wrappers públicos. No puede ejecutar las funciones `commercial` comprobadas.
- `GET https://pkrsedmwxekbhlohhqds.supabase.co/rest/v1/` sin credencial responde 401.
- No se ejecutó el dispatcher, ni correos, ni pagos, ni anonimización, ni solicitudes de privacidad.

## Límites que quedan

- PHASE-06 permanece `IN_PROGRESS`. Esta integración no cierra la fase ni la V1.
- El rol `authenticator` no tiene `pgrst.db_schemas` en `rolconfig`. La exposición de PostgREST no se cambió con estas migraciones; la confirmación de que `commercial` no está publicado queda en la configuración administrada, que esta operación no tocó.
- El respaldo no incluye binarios de Storage, Vault ni la configuración del dashboard.
- La migración de adaptación y este informe siguen sin commit.
- Los pedidos históricos no recibieron filas financieras ni económicas.

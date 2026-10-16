# Corrida local — Commercial Core V1

Fecha de verificación: 2026-10-16. Los comandos de esta página se ejecutaron en esa sesión, salvo los marcados como pendientes.

## Requisitos

- Docker Desktop ya en marcha. No reiniciarlo desde esta corrida.
- Node y `npx supabase@2.120.0`.
- La base principal `supabase_db_OrderOps` permanece en `127.0.0.1:54322`. No recibe la migración de PHASE-06 ni la semilla.

## Entorno usado

QA aislado `orderops-phase06-qa`.

- API `http://127.0.0.1:56721`
- Base `127.0.0.1:56722`
- Mailpit propio del QA `http://127.0.0.1:56724`
- Contenedor `supabase_db_orderops-phase06-qa`
- Directorio fuera del repo: `legacy-backups\OrderOps\phase06-qa-stack`

El gate histórico `node scripts/commercial-core/assert-local-supabase.mjs` sigue apuntando a `127.0.0.1:54321` y `127.0.0.1:54322`. En esta sesión no se usó para escribir. Identidad comprobada: la principal tiene 134 migraciones y termina en `20261016120000`. El QA tiene 136 y termina en `20261016182000`.

## Arranque del QA

El `config.toml` copiado cambió `project_id` y los puertos 54321–54329 por 56721–56729. El comando que levantó el stack fue:

```text
npx --yes supabase@2.120.0 start --workdir <phase06-qa-stack>
```

Aplicó las 135 migraciones desde cero, incluida `20261016165136_commercial_phase06_dispatch_privacy.sql`.

Pendiente de validar en otra máquina: repetir el arranque si ese directorio ya no existe. No usar `db reset` sobre `OrderOps`, Estadísticas, Ledger ni Majo.

## Inbucket

`127.0.0.1:54324` es `supabase_inbucket_OrderOps`, el Mailpit de la base principal. `127.0.0.1:56724` es `supabase_inbucket_orderops-phase06-qa`. El dispatcher corre en el host: `127.0.0.1` es el host, no la red de otro contenedor.

El sink solo acepta `COMMERCIAL_INBUCKET_HOST=127.0.0.1` y `COMMERCIAL_INBUCKET_PORT` igual a `COMMERCIAL_QA_INBUCKET_PORT`. Rechaza `54324`, `56324` y `56424` antes de conectar. También exige que `docker port` del inbucket hermano publique ese puerto. Un destinatario que no termina en `@127.0.0.1` sale con `external_recipient`.

La corrida de auditoría entregó un aviso sintético solo en `http://127.0.0.1:56724`. El total de `54324` no cambió.

`smtp.gmail.com` hace salir a `dispatch-outbox.mjs` con `non_loopback_sink` antes de abrir una conexión.

## Dispatcher

Variables usadas:

```text
COMMERCIAL_EMAIL_SINK=inbucket
COMMERCIAL_INBUCKET_HOST=127.0.0.1
COMMERCIAL_INBUCKET_PORT=56724
COMMERCIAL_QA_INBUCKET_PORT=56724
COMMERCIAL_DISPATCH_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:56722/postgres
COMMERCIAL_QA_DB_CONTAINER=supabase_db_orderops-phase06-qa
node scripts/commercial-core/dispatch-outbox.mjs
```

La URL con puerto 54322 es rechazada. El contenedor tiene que llamarse `supabase_db_orderops-phase06-...`.

## Semilla

```text
node scripts/commercial-core/apply-commercial-fixture.mjs supabase_db_orderops-phase06-qa orderops-phase06-qa
```

Se corrió dos veces. Las dos dejaron 3 comercios con `fixture_tag = commercial-core-v1-fixture`. No hace truncate global.

```text
COMMERCIAL_QA_URL=http://127.0.0.1:56721 COMMERCIAL_QA_PROJECT_ID=orderops-phase06-qa node scripts/commercial-core/seed-local-users.mjs
```

Ese script no crea usuarios por la Admin API. Las filas `auth.users` las inserta `supabase/seed/commercial_core_fixture.sql`. Un URL que no sea loopback sale con `fixture_refuses_target`.

## Pruebas

En el contenedor QA, con `psql -v ON_ERROR_STOP=1`, salieron 0 los archivos de `supabase/tests/commercial/`. `e2e_08.sql` falló una vez porque la lectura corría como superusuario y se corrigió para usar `authenticated`. La repetición salió 0.

```text
npx tsx lib/commercial/notifications/email-sink.verify.ts
npx tsx lib/commercial/schema-names.verify.ts
npx tsc --noEmit --pretty false --incremental false
```

Los tres salieron 0. `schema-names.verify.ts` nombró 43 tablas.

## Aislamiento

- No se aplicó `20261016165136` en `supabase_db_OrderOps`.
- La semilla rechaza ese contenedor y el puerto publicado 54322.
- El dispatcher rechaza un sink que no sea el Mailpit del QA en `127.0.0.1:56724`.

## Errores

- `fixture_project_mismatch`: falta el marcador `orderops-phase06-qa` en la misma sesión SQL.
- `non_loopback_sink` o `unsupported_sink`: el correo no se abre.
- `qa_container_required`: el contenedor no es el QA de PHASE-06.
- `dispatch_refuses_main_database`: la URL apunta al puerto 54322.

## Contención

Si el dispatcher falla a mitad de un evento, el outbox vuelve a `pending` con backoff o queda `dead` al octavo intento. No reenviar a mano. La semilla solo borra filas con su tag y los ids fijos `96969696-...`. No hay rollback de producción porque esta corrida no despliega.

## Pendiente

- Integrar `20261016165136` y `20261016182000` en la base principal. No está autorizado.
- `PHASE_06_STATUS` sigue `IN_PROGRESS`. No es `CLOSED_LOCAL`.
- `BLK-ECO-01`, `BLK-ECO-02`, `BLK-ECO-03` y `BLK-PRIV-01` siguen abiertos.

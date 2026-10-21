# Fase B0 — Preparación de Docker

Fecha: 17 de octubre de 2026. Docker no se inició. El script no se ejecutó. No hay cambios de contenedores, volúmenes, `config.toml`, SQL ni Git.

## Identidad del QA

| Campo | Valor comprobado |
| --- | --- |
| `project_id` | `orderops-phase06-qa` |
| Directorio | `C:\Users\Oasis Desktop\Desktop\Full Stack Developer\legacy-backups\OrderOps\phase06-qa-stack` |
| Config | `supabase\config.toml` de ese directorio |
| API | `56721` |
| PostgreSQL | `56722` |
| Studio / Mailpit | `56723` / `56724` |
| Contenedor de base | `supabase_db_orderops-phase06-qa` |
| Mailpit documentado | `supabase_inbucket_orderops-phase06-qa` |

Ese directorio tiene 135 migraciones y termina en `20261016165136`. No contiene `20261017220000`. Por eso el arranque del script usa `docker start` sobre contenedores ya existentes y rechaza `supabase start`: ese comando leería el directorio viejo y podría intentar cambiar el esquema.

## Contenedores por proyecto

Los nombres completos de hoy no están verificados: el motor está apagado. La clasificación en vivo la hace el script por la etiqueta `com.supabase.cli.project` y, si no hay etiqueta, por el sufijo exacto del nombre. `project_id = "OrderOps"` en Estadísticas y en las copias cloud-integration no crea otra base: es el mismo proyecto principal.

Nombres confirmados en archivos:

| Proyecto | Acción prevista | Nombres confirmados |
| --- | --- | --- |
| `orderops-phase06-qa` | Conservar y, en una etapa aparte, iniciar | `supabase_db_orderops-phase06-qa`, `supabase_inbucket_orderops-phase06-qa` |
| `OrderOps` | Pausar | `supabase_db_OrderOps`, `supabase_inbucket_OrderOps` |
| `orderops-statistics-v1-test-74718de66a41` | Pausar, sin borrar volúmenes | `supabase_db_`, `supabase_kong_`, `supabase_auth_`, `supabase_rest_` y `supabase_storage_` con ese sufijo |
| `orderops-ledger-rebuild` | Pausar si existe | El patrón es `supabase_<servicio>_orderops-ledger-rebuild`. Ningún nombre concreto está en un inventario vigente |
| `majo-pasteleria-caja` | Pausar si existe | El patrón es `supabase_<servicio>_majo-pasteleria-caja` |
| `orderops-phase05-accept` | Pausar si existe | Puertos de config `56621`–`56629`. Sin inventario vivo |
| `orderops-phase05-audit` | Pausar si existe | Puertos de config `56521`–`56529`. Sin inventario vivo |

Servicios que el script sabe separar del `project_id`: `db`, `kong`, `auth`, `rest`, `realtime`, `storage`, `imgproxy`, `pg_meta`, `studio`, `edge_runtime`, `analytics`, `vector`, `inbucket`, `pooler`.

## Ambigüedades

- Un contenedor `supabase_` con otro servicio, o sin etiqueta reconocible, queda `unknown`. Si está en marcha, si su política no es `no`, o si publica un puerto de estos stacks, `Pause` y `StartQa` se detienen sin cambiar nada.
- `orderops-cloud-restore-disposable` y los contenedores `orderops_concurrency_discard_*` no pertenecen al QA ni a la lista de pausa. Si aparecen, el script pide revisión.
- La foto del 16 de octubre muestra `unless-stopped` solo para cinco contenedores de Estadísticas. La política del resto se registra en el inventario; no se supone.
- El `config.toml` actual de `OrderOps-Estadisticas` sigue diciendo `project_id = "OrderOps"`. No se modificó.

## Script

`scripts/commercial-core/docker-b-qa-only.ps1`

Abrir Docker Desktop a mano. El script espera hasta tres minutos y no lo inicia. Cada etapa escribe `tmp/docker-b/inventory-<fecha>.json` con nombre, id corto, estado, política, proyecto, puertos publicados y nombres de volumen. No escribe variables de entorno.

```text
powershell -NoProfile -File scripts/commercial-core/docker-b-qa-only.ps1 -Stage Inventory
powershell -NoProfile -File scripts/commercial-core/docker-b-qa-only.ps1 -Stage Pause -Confirm Pause
powershell -NoProfile -File scripts/commercial-core/docker-b-qa-only.ps1 -Stage StartQa -Confirm StartQa
```

`Inventory` sale con código 10 si hay algo para revisar y no modifica el motor. `Pause` solo cambia a `restart=no` y detiene contenedores clasificados `pause`. No borra. `StartQa` falla si alguno de esos sigue en marcha, si falta `supabase_db_orderops-phase06-qa`, o si `56721` o `56722` no pertenecen solo al QA.

## Reversión

Usar el JSON creado antes de `Pause`, no uno posterior.

```text
powershell -NoProfile -File scripts/commercial-core/docker-b-qa-only.ps1 -Stage Restore -Confirm Restore -InventoryPath tmp\docker-b\inventory-<fecha>.json
```

`Restore` devuelve a cada contenedor `pause` la política guardada (`no`, `always`, `on-failure` o `unless-stopped`) y lo inicia si estaba detenido. No toca volúmenes ni contenedores desconocidos.

## T08-A, después de StartQa

El script no ejecuta SQL. La comprobación, aparte y de solo lectura, es:

```text
docker exec supabase_db_orderops-phase06-qa psql -U postgres -d postgres -c "select version, name from supabase_migrations.schema_migrations where version = '20261017220000';"
```

El resultado esperado es una fila `20261017220000`. Si no está, no hay que aplicar la migración desde el directorio canónico: ese directorio no la contiene.

Fase B queda sin ejecutar.

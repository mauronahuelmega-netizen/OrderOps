# Auditoría Docker local — 17 de octubre de 2026

Fase A, solo lectura. No se inició Docker. No se detuvo, borró ni modificó contenedor, volumen, imagen, configuración ni base.

El motor no está en marcha: no hay proceso de Docker Desktop y el pipe del engine no existe. El estado vivo de contenedores, volúmenes, puertos publicados, políticas de reinicio y consumo queda `NOT_VERIFIED` hasta una fase posterior. Lo que sigue sale de `config.toml`, worktrees y una foto del 16 de octubre.

## 1. Proyectos y correspondencia

Supabase nombra contenedores y volúmenes con el `project_id`. Dos directorios con el mismo `project_id` no son dos bases: apuntan al mismo stack.

| Proyecto | Directorio | `project_id` | API | DB | Studio | Mailpit | Pooler | Analytics | Sombra |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| OrderOps principal | `Projects/OrderOps` | `OrderOps` | 54321 | 54322 | 54323 | 54324 | 54329 | 54327 | 54320 |
| Estadísticas, config actual | `Projects/OrderOps-Estadisticas` | `OrderOps` | 54321 | 54322 | 54323 | 54324 | 54329 | 54327 | 54320 |
| Estadísticas, datos vivos documentados | worktree `codex/estadisticas-v1` | `orderops-statistics-v1-test-74718de66a41` | 56321 | 56322 | no recontado | no recontado | no recontado | no recontado | no recontado |
| Commercial Core QA | `legacy-backups/OrderOps/phase06-qa-stack` | `orderops-phase06-qa` | 56721 | 56722 | 56723 | 56724 | 56729 | 56727 | 56720 |
| Ledger rebuild | `%LOCALAPPDATA%/OrderOps/ledger-rebuild-20261012` | `orderops-ledger-rebuild` | 56421 | 56422 | 56423 | 56424 | 56429 | 56427 | no recontado |
| Majo | `Projects/majo-pasteleria-caja` | `majo-pasteleria-caja` | 54331 | 54332 | 54333 | 54334 | 54339 | 54337 | 54330 |
| PHASE-05 accept | `legacy-backups/OrderOps/phase05-accept-stack` | `orderops-phase05-accept` | 56621 | 56622 | 56623 | 56624 | 56629 | 56627 | 56620 |
| PHASE-05 audit | `legacy-backups/OrderOps/phase05-audit-stack` | `orderops-phase05-audit` | 56521 | 56522 | 56523 | 56524 | 56529 | 56527 | 56520 |
| Copias cloud-integration | `legacy-backups/OrderOps/cloud-integration-2026-10-16/{adapt,tanda1,tanda2,tanda3,tanda4}` | `OrderOps` | 54321 | 54322 | 54323 | 54324 | 54329 | 54327 | 54320 |

Contenedor de base esperado: `supabase_db_<project_id>`. Volúmenes de datos esperados: `supabase_db_<project_id>` y, donde el CLI los creó, `supabase_storage_<project_id>`.

La foto `binding-origin.json` del 16 de octubre, 13:02 UTC, confirma para Estadísticas los volúmenes `supabase_db_orderops-statistics-v1-test-74718de66a41` y `supabase_storage_orderops-statistics-v1-test-74718de66a41`, la red `supabase_network_orderops-statistics-v1-test-74718de66a41`, y contenedores de storage, rest, auth, kong y db. Esa foto no es el estado de hoy.

`orderops-cloud-restore-disposable` (`127.0.0.1:56932`) figura como retirado en `docs/audits/cloud-migration-reconciliation-plan-2026-10-16.md`. No se comprobó si quedó algún volumen.

## 2. Estado de los stacks

| Stack | Estado en esta auditoría |
| --- | --- |
| Todos | `UNKNOWN`. El engine está detenido. No se consultó `docker ps`. |
| Estadísticas, 16 de octubre | En esa foto los cinco contenedores listados estaban `running` y `unless-stopped`. |

## 3. Volúmenes a preservar

No borrar ninguno. Preservar en especial:

- `supabase_db_orderops-phase06-qa`: QA canónico. La migración T08-A `20261017220000_commercial_provider_receipts.sql` se aplicó ahí en el lote anterior. El ledger no se releyó hoy.
- `supabase_db_OrderOps` y `supabase_storage_OrderOps`: base principal local. No es el QA comercial.
- `supabase_db_orderops-statistics-v1-test-74718de66a41` y `supabase_storage_orderops-statistics-v1-test-74718de66a41`: datos de Estadísticas. El `config.toml` actual de ese worktree ya no usa este `project_id`.
- `supabase_db_orderops-ledger-rebuild` y su storage, si existen.
- `supabase_db_majo-pasteleria-caja` y su storage, si existen.
- Volúmenes `orderops-phase05-accept` y `orderops-phase05-audit`, si el CLI llegó a crearlos.

La existencia de cada volumen queda `NOT_VERIFIED` mientras el engine esté apagado.

## 4. Arranque automático

- `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` lanza `Docker Desktop.exe` al iniciar sesión.
- `settings-store.json` tiene `AutoStart` en `false`. La clave Run igual abre el programa.
- La carpeta Inicio del usuario no tiene un acceso de Docker.
- No hay `tasks.json` ni script de `package.json` que ejecute `supabase start`. `npm run dev` es `next dev`.
- La foto de Estadísticas marca `unless-stopped`. Con esa política, abrir Docker Desktop vuelve a levantar esos contenedores sin un `supabase start` nuevo. La política actual del resto de stacks queda `NOT_VERIFIED`.
- Un `supabase start` desde `OrderOps`, `OrderOps-Estadisticas` o cualquiera de las cinco copias cloud-integration usa `project_id = "OrderOps"` y los puertos 54321–54329. No crea un stack aparte.

## 5. Referencia de Commercial Core

El stack canónico es `orderops-phase06-qa`.

- Workdir: `legacy-backups/OrderOps/phase06-qa-stack`.
- Contenedor: `supabase_db_orderops-phase06-qa`.
- DB documentada: `127.0.0.1:56722`.
- Archivo de la migración T08-A: `supabase/migrations/20261017220000_commercial_provider_receipts.sql`, en el worktree `cursor/commercial-core-v1-integration`, HEAD `b94e5b5ba402d08728e6acfcef25e5692ed26fb0`.
- El repo principal `Projects/OrderOps` es ese worktree. `OrderOps-Estadisticas` es otro worktree, rama `codex/estadisticas-v1`, HEAD `923300265323d411c5c91b7935472d5423d228d2`.
- El worktree `orderops-public-catalog-residual-roadmap` está marcado `prunable` y el directorio ya no está.

No hay bases compartidas entre QA 56722, principal 54322, Estadísticas 56322, ledger 56422 y Majo 54332. El conflicto real es de identidad: varios directorios declaran el proyecto `OrderOps`.

## 6. Acciones mínimas, todavía no ejecutadas

1. Dejar Docker apagado hasta autorizar la fase B.
2. En la fase B, iniciar Docker una sola vez y limitarse a `docker ps -a`, `docker volume ls` e inspección de política de reinicio. Sin prune, sin `down -v`, sin migraciones.
3. Confirmar que los volúmenes de la sección 3 existen y que ningún volumen de datos está montado por dos proyectos.
4. Para los proyectos que no sean `orderops-phase06-qa`, cambiar la política a `no` y después `docker stop`. No borrar contenedores. Así el próximo arranque de Docker no los revive.
5. Arrancar solo el QA con `supabase start --workdir` del directorio `phase06-qa-stack`, si esa inspección lo muestra detenido.
6. Leer, sin escribir, `supabase_migrations.schema_migrations` del QA y comprobar `20261017220000`.
7. No ejecutar `supabase start` dentro de `OrderOps-Estadisticas` con el `config.toml` actual: se engancharía al proyecto `OrderOps`.

Reversa: `docker update --restart=unless-stopped` y `docker start` sobre los contenedores detenidos. Los volúmenes no se tocan en ningún sentido.

Cloud y producción quedan fuera. No se modificó código, calendario Founder, obligaciones ni cobranzas.

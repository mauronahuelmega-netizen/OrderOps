# Auditoría de integración Cloud — OrderOps

Fecha: 2026-10-16. Solo lectura. No se aplicaron migraciones, no se cambió Auth, Storage ni facturación, y el repositorio quedó sin vínculo.

Veredicto: `BLOCKED`

## 1. Identidad

| Campo | Valor |
|---|---|
| Nombre | OrderOps |
| Ref | `pkrsedmwxekbhlohhqds` |
| Organización | MauroDev (`ttgsigcooaqhbsykphqj`) |
| Región | `us-east-1` |
| Estado | `ACTIVE_HEALTHY` |
| Postgres | 17.6.1.111 |
| Creado | 2026-04-26 |
| Vinculado a este repo | No |

La cuenta también muestra `Majo Pastelería` (`kvqhlnzoprwwhidfkrfi`, `us-west-2`, `INACTIVE`). No es el destino. No se consultaron sus datos.

## 2. Plan, cuota y coste

`NOT_VERIFIED`. `orgs list` y `projects list` no informan plan, límite de proyectos ni precio. No se cambió la facturación. PITR está desactivado (`pitr_enabled: false`). `walg_enabled: true`, pero `backups list` devolvió `backups: null` y ningún respaldo físico descargable.

## 3. Migraciones

Git, en `cursor/commercial-core-v1-integration` (`d13f7b32331e66feff4d4de0116e3e9e44faad52`, 41 commits por delante de `origin`): 136 archivos.

| Entorno | Cantidad | Última | Cómo se leyó |
|---|---|---|---|
| Git | 136 | `20261016182000` | Archivos |
| Principal local `54322` | 134 | `20261016120000` | `SELECT` de `schema_migrations` |
| QA `56722` | 136 | `20261016182000` | `SELECT` de `schema_migrations` |
| Cloud `pkrsedmwxekbhlohhqds` | 14 versiones, ninguna igual a Git | `20260917212712` | `migration list --project-ref`, sin `link` |

La intersección entre las 136 versiones de Git y las 14 de Cloud es vacía. `db push` no puede tratar las de Cloud como ya aplicadas.

Versiones solo en Cloud, ausentes en Git y en el historial de ramas consultado:

- `20260713125751`
- `20260716224206`
- `20260717010503`
- `20260717020549`
- `20260717034117`
- `20260717043403`
- `20260717162941`
- `20260909070121`
- `20260909190021`
- `20260910014445`
- `20260910040100`
- `20260915215741`
- `20260916195024`
- `20260917212712`

Las 136 de Git figuran como no aplicadas en ese historial, incluidas las de abril de 2026 que dieron origen al proyecto. Eso no demuestra que falten las tablas: el esquema puede haberse creado con otro registro. Tampoco demuestra que se puedan reaplicar.

Orden previsto si algún día el historial coincidiera: la secuencia de archivos de `supabase/migrations/`, terminando en `20261016165136` y `20261016182000`. Hoy esa secuencia no es aplicable encima del historial remoto.

## 4. Esquema

`NOT_VERIFIED` en Cloud. La consulta de catálogo exigía `db query --linked`. No se ejecutó y no se dejó el repositorio vinculado. `migration list` escribió `supabase/.temp/linked-project.json` como efecto de la CLI. Ese archivo no tenía secretos y fue eliminado. No quedó `project-ref`.

Riesgo: reaplicar las 136 migraciones puede chocar con tablas, buckets o funciones que ya existan bajo otro número de versión. Commercial Core y PHASE-06 no pueden declararse ausentes ni presentes.

Estadísticas no aparece como proyecto Cloud. Su stack local sigue en `56321`/`56322`. No se comprobó si alguna tabla de ese trabajo vive dentro de la base Cloud de OrderOps.

Majo Pastelería en Cloud es otro proyecto. En el código local, el comercio usa `public.businesses`, `profiles`, `orders` y `products`. No se leyeron filas ni nombres.

## 5. Auth, Storage y funciones

| Pieza | Cloud | Local |
|---|---|---|
| Edge Functions | Lista vacía | No hay funciones en `supabase/functions` |
| Auth, redirects y proveedores | `NOT_VERIFIED` | Email y signup activos. Confirmación desactivada. Sitio `http://127.0.0.1:3000`. Sin OAuth externo en `config.toml` |
| Buckets | `NOT_VERIFIED` | Las migraciones crean `product-images`, `business-assets` y `commercial-documents` |
| Correo comercial | No hay Mailpit | El dispatcher solo acepta `127.0.0.1` y el puerto del QA |
| Variables requeridas, sin valores | No se copiaron al entorno | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y las tres de Web Push |

PostgREST local publica solo `public` y `graphql_public`. El esquema `commercial` no debe publicarse para “arreglar” el acceso.

## 6. Datos canónicos

No se contaron filas en Cloud: esa lectura pedía el modo vinculado. No hay base para una limpieza. El riesgo de una migración a ciegas es alterar el proyecto activo, no un proyecto vacío.

## 7. Respaldo

- PITR: desactivado.
- Respaldos físicos de la API: ninguno listado.
- Los dumps citados en `PROGRESS.md` son de la base local de octubre de 2026, con SHA-256 documentado allí. No están en el árbol de Git y no respaldan Cloud.
- Antes de cualquier cambio hace falta un dump completo del proyecto `pkrsedmwxekbhlohhqds`, guardado fuera del repo, con tamaño y SHA-256, y una prueba de `pg_restore -l` en una instancia desechable. No se generó ese dump.

## 8. Migraciones que no se proponen

Ninguna. Ni las dos de PHASE-06 ni el resto de las 136. El historial remoto no es un prefijo del repositorio. Proponer una lista de aplicación ahora sería asumir que los objetos no existen.

## 9. Lecturas hechas

- `projects list`: identidad y Postgres 17 confirmados.
- `orgs list`: una organización, sin plan.
- `backups list --project-ref pkrsedmwxekbhlohhqds`: sin PITR y sin backup listado.
- `functions list --project-ref pkrsedmwxekbhlohhqds`: vacío.
- `migration list --project-ref pkrsedmwxekbhlohhqds`: historial divergente.
- Ledgers locales: principal 134, QA 136.
- No se ejecutaron suites SQL ni `verify-all` contra Cloud.

## 10. Autorización humana pendiente

1. Confirmar el plan y si se acepta seguir en el plan actual.
2. Generar y custodiar un respaldo de Cloud antes de tocar el esquema.
3. Autorizar una lectura de catálogo, sin datos personales, para saber qué objetos de las 136 migraciones ya existen.
4. Decidir cómo reconciliar las 14 versiones remotas que no están en Git. `migration repair` no está autorizado por esta auditoría.
5. Solo después, elegir si Commercial Core entra en este proyecto o si la integración queda bloqueada hasta tener un proyecto aparte.

No se inició ninguna de esas acciones.

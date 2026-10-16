# Reconciliación de catálogo Cloud — OrderOps

Fecha: 2026-10-16. Solo lectura. No se aplicaron migraciones ni se modificó el esquema.

Veredicto: `READY_WITH_LIMITATIONS`

## Identidad

Proyecto `OrderOps`, ref `pkrsedmwxekbhlohhqds`, Postgres 17.6.1.111, `us-east-1`, `ACTIVE_HEALTHY`. Las consultas usaron `db query --linked --project-ref pkrsedmwxekbhlohhqds` contra la Management API. No se imprimió ninguna cadena de conexión.

Efecto colateral: la CLI volvió a crear `supabase/.temp/linked-project.json` con el ref, el nombre y la organización. No contiene contraseña. No se borró en esta pasada. No hay `project-ref` aparte. `.env.local` no se tocó.

## Consultas

Todas `SELECT`:

- `supabase_migrations.schema_migrations`: `version`, `name`.
- Esquemas, extensiones, relaciones de `public`, `auth` y `storage`, con RLS y FORCE RLS.
- Presencia de `commercial` y de funciones cuyos nombres mencionan demo, privacidad, liquidación, comisión, promotor u outbox.
- Tablas `public` cuyo nombre menciona finance, settlement, commission, ledger u obligation.
- Índice `products_business_sku_uidx`.
- Columnas de agosto de 2026 y `generate_order_code`.
- Conteos de `businesses`, `orders`, `products`, `profiles`, `auth.users` y `store_sessions`.
- Buckets, cantidad de objetos por bucket, proveedores de `auth.identities` y cantidad de políticas en cinco tablas.

No se leyeron nombres, correos ni filas de negocio. No se consultó Estadísticas ni Majo Pastelería.

## Por qué hay 14 versiones y 136 archivos

Los números no están en Git, tags, reflog ni worktrees. El `name` de cada fila remota sí coincide con un archivo local. Cloud guardó la hora de aplicación, no el timestamp del archivo.

| Versión Cloud | Nombre registrado | Archivo local |
|---|---|---|
| `20260713125751` | `product_customization_order_1_create_order_snapshot` | `20260713030000` |
| `20260716224206` | `product_stock_tracking_schema_1` | `20260716224005` |
| `20260717010503` | `product_stock_decrement_order_1` | `20260717010500` |
| `20260717020549` | `product_stock_movements_schema_1` | `20260717120000` |
| `20260717034117` | `product_stock_decrement_ledger_1` | `20260717130000` |
| `20260717043403` | `product_stock_restock_cancel_1` | `20260717140000` |
| `20260717162941` | `product_customization_public_rls_hardening_1` | `20260717170000` |
| `20260909070121` | `products_manage_role_rls` | `20260909040000` |
| `20260909190021` | `products_stock_availability_contract` | `20260909154400` |
| `20260910014445` | `products_sku_unique_integrity` | `20260910010123` |
| `20260910040100` | `product_images_delete_lifecycle` | `20260910022504` |
| `20260915215741` | `products_edit_unified_draft_save_rpc` | `20260915180000` |
| `20260916195024` | `products_removal_lifecycle` | `20260916180000` |
| `20260917212712` | `categories_public_catalog_order` | `20260917210150` |

El contenido SQL de esas 14 filas no está en `schema_migrations` como texto recuperable desde Git: el historial remoto no guarda el archivo con su versión original. La equivalencia es por nombre y por objetos comprobados, no por un diff byte a byte.

## Qué hay en el esquema

Esquemas: `auth`, `extensions`, `graphql`, `graphql_public`, `public`, `realtime`, `storage`, `supabase_migrations`, `vault`. No existe `commercial`.

Extensiones: `pgcrypto`, `uuid-ossp`, `moddatetime`, `pg_stat_statements`, `plpgsql`, `supabase_vault`.

`public` tiene, con RLS activo y sin FORCE RLS: `businesses`, `profiles`, `categories`, `products`, `orders`, `order_items`, `order_events`, `store_sessions`, `business_settings`, `push_subscriptions`, `customization_groups`, `customization_options`, `customization_group_assignments`, `product_customization_overrides`, `upsell_groups`, `upsell_group_items`, `stock_movements`.

También están `orders.order_code`, `generate_order_code()`, `business_settings.order_assignment_enabled`, las columnas de cantidad de personalización y el índice `products_business_sku_uidx`.

Buckets: `product-images` y `business-assets`, ambos públicos. Objetos: 38 y 13. No está `commercial-documents`.

Auth, solo a nivel de esquema: tablas estándar de GoTrue, incluida `auth.sessions`. RLS activo en `users` e `identities`. Proveedor observado: email, 5 identidades. Usuarios: 5. No hay Edge Functions.

Conteos, sin identidades: 4 negocios, 78 pedidos, 9 productos, 5 perfiles, 6 `store_sessions`. Políticas contadas: businesses 4, categories 5, orders 2, products 4, profiles 1.

No hay tablas de finanzas, liquidaciones, comisiones ni ledger. No hay funciones de demo, privacidad, outbox ni promotores.

## Matriz

| Grupo | Estado | Evidencia |
|---|---|---|
| Tienda base: negocios, pedidos, productos, perfiles, sesiones, buckets | Existente y compatible en lo comprobado | Tablas, RLS y conteos. El registro de versión de esos archivos iniciales no está en Cloud |
| Personalización, stock, SKU, baja de productos, orden de categorías | Existente y compatible por nombre | Las 14 filas remotas y los objetos asociados |
| Agosto 2026: cantidad de extras, asignación de pedidos, `order_code` | Existente, versión ausente | Columnas y función presentes. No están entre las 14 |
| Finanzas, desde `20260926010000` | Ausente | No hay tablas con esos nombres |
| Commercial Core y Promotores, desde `20261008215314` hasta `20261016182000` | Ausente | No existe el esquema `commercial` ni el bucket privado |
| Equivalencia columna por columna del resto de archivos anteriores a finanzas | No verificada | No se hizo un diff completo de columnas, grants ni `search_path` |

## Dependencias y colisiones

No aplicar las 136 como un bloque. `db push` las vería todas pendientes porque ninguna versión de Git está en Cloud. Volvería a crear `businesses`, pedidos, personalización y stock encima de 78 pedidos y 4 negocios.

Las 84 migraciones posteriores a `20260917210150` son el tramo que el catálogo muestra como no aplicado. Empiezan en `shared_core_expand` y siguen por finanzas, lecturas M2/M3 y todo Commercial Core, incluidas `20261016165136` y `20261016182000`. Dependen de `public.businesses`, `profiles` y `orders`, que ya existen. No dependen de objetos `commercial` previos. Chocarían solo si una de esas 84 repite un objeto que esta lectura no enumeró.

Las 14 ya aplicadas bajo otro número, los 3 archivos de agosto y los archivos anteriores a `20260713030000` no deben ejecutarse de nuevo. Hace falta alinear el historial, no repetir el SQL.

## Propuesta de reconciliación

1. No correr `db push` ni `migration repair` todavía.
2. Respaldar Cloud antes de tocar `schema_migrations`. Sigue sin PITR y sin backup físico listado.
3. Con autorización aparte, registrar como ya aplicadas las versiones locales cuyo objeto ya se comprobó, sin ejecutarlas. El mapa de las 14 es la tabla de arriba. Los tres de agosto también. El tramo anterior a `20260713030000` solo después de un diff de columnas.
4. Recién entonces aplicar el sufijo de 84 archivos, en orden, sobre este proyecto. Ese paso crea finanzas y `commercial`. No publica el esquema `commercial`.
5. Dejar Mailpit y el dispatcher fuera de Cloud: siguen atados a `127.0.0.1`.

## Limitaciones

No hay diff completo de columnas, índices, triggers ni grants. FORCE RLS está apagado en las tablas vistas. No se comprobó si el SQL remoto de las 14 es idéntico al archivo, porque Cloud no guarda ese texto bajo la versión de Git. El archivo de vínculo quedó recreado por la CLI.

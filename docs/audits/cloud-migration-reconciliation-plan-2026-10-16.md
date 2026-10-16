# Plan de reconciliacion Cloud OrderOps — 2026-10-16

Proyecto Cloud: OrderOps, ref `pkrsedmwxekbhlohhqds`, region `us-east-1`, PostgreSQL 17.6.1.111.

Veredicto: `READY_WITH_LIMITATIONS`.

El respaldo logico se restauro en una instancia PostgreSQL 17 desechable y los conteos relevantes coinciden con Cloud. El plan de abajo no se ejecuto. Cloud no recibio DDL, DML ni cambios en `supabase_migrations.schema_migrations`.

Matriz de las 136 migraciones: `docs/audits/cloud-migration-matrix-2026-10-16.md`.

Manifiesto fuera de Git: `C:\Users\Oasis Desktop\Desktop\Full Stack Developer\legacy-backups\OrderOps\OrderOps-cloud-pkrsedmwxekbhlohhqds-20261016T192500Z-manifest.md`.

## 1. Respaldo

Metodo elegido segun `supabase db dump --help` de la CLI 2.120.0: `db dump --linked --project-ref pkrsedmwxekbhlohhqds`, con `--schema` para los esquemas administrados, `--data-only --use-copy` para los datos y `--role-only` para los timeouts de rol. El formato por defecto es SQL plano.

`pg_restore -l` no aplica. La imagen `postgres:17` respondio `input file does not appear to be a valid archive`.

El dump incluye DDL y filas de `public`, `auth`, `storage` y `supabase_migrations`, mas el DDL de `extensions`, `graphql`, `graphql_public` y `realtime`. No incluye los binarios de Storage, la configuracion del dashboard, `vault` ni `CREATE ROLE` completo. `roles.sql` solo fija `statement_timeout`.

La restauracion se hizo en `orderops-cloud-restore-disposable` (`postgres:17`, `127.0.0.1:56932`) y ese contenedor se retira al cerrar esta tarea. No se restauro sobre `supabase_db_OrderOps` ni sobre `supabase_db_orderops-phase06-qa`.

Conteos iguales en Cloud y en la copia restaurada: businesses 4, orders 78, products 9, profiles 5, categories 8, order_items 162, order_events 260, stock_movements 62, store_sessions 6, auth.users 5, storage.buckets 2, storage.objects 51, schema_migrations 14, politicas `public` 60.

El CLI dejo `supabase/.temp/linked-project.json` como efecto de `--linked`. `.env.local` no se modifico. No hay un proyecto nuevo.

## 2. Grupos de migraciones

| Grupo | Archivos | Lectura |
|---|---:|---|
| A. Mismo `name` remoto, otra `version` | 14 | Objetos presentes. Registrar la version local sin reejecutar el SQL. |
| B. Agosto, objetos presentes, fuera del ledger | 3 | Igual que A para `20260813010000`, `20260817043000` y `20260827234500`. |
| C. Anteriores a `20260713030000` | 35 | Tablas e indices compartidos presentes. Tres archivos tienen drift de RLS o `search_path` y quedan `no_verificada`. |
| D. Posteriores a `20260917210150` | 84 | Ausentes en Cloud. Pendientes de aplicacion, en orden de nombre. |

`20261009020527_commercial_phase03_separation.sql` tiene 0 bytes. El cuerpo esta en `20261009020618_commercial_phase03_separation_body.sql`.

Correspondencia del grupo A:

| Version local | Version remota | Name |
|---|---|---|
| 20260713030000 | 20260713125751 | product_customization_order_1_create_order_snapshot |
| 20260716224005 | 20260716224206 | product_stock_tracking_schema_1 |
| 20260717010500 | 20260717010503 | product_stock_decrement_order_1 |
| 20260717120000 | 20260717020549 | product_stock_movements_schema_1 |
| 20260717130000 | 20260717034117 | product_stock_decrement_ledger_1 |
| 20260717140000 | 20260717043403 | product_stock_restock_cancel_1 |
| 20260717170000 | 20260717162941 | product_customization_public_rls_hardening_1 |
| 20260909040000 | 20260909070121 | products_manage_role_rls |
| 20260909154400 | 20260909190021 | products_stock_availability_contract |
| 20260910010123 | 20260910014445 | products_sku_unique_integrity |
| 20260910022504 | 20260910040100 | product_images_delete_lifecycle |
| 20260915180000 | 20260915215741 | products_edit_unified_draft_save_rpc |
| 20260916180000 | 20260916195024 | products_removal_lifecycle |
| 20260917210150 | 20260917212712 | categories_public_catalog_order |

## 3. Comparacion de esquema

La referencia local es la QA `orderops-phase06-qa`, que tiene las 136 migraciones. Se comparo estructura, no filas de negocio.

### Compatible

- Las 174 columnas `public` de Cloud existen en QA con el mismo tipo y el mismo default.
- Cuatro diferencias de nulabilidad en `orders` (`delivery_date`, `delivery_method`, `phone`, `total_price`) las introducen migraciones posteriores: `20260926017000` y `20261004010000`. En Cloud siguen `NOT NULL`, que es el estado anterior a esas migraciones.
- Indices `public` compartidos: 80 en Cloud, 0 exclusivos de Cloud. Los 59 que solo estan en QA son de finanzas, `orders_id_business_id_key` y `profiles_id_business_id_key`.
- Restricciones compartidas: una sola definicion distinta, `orders_total_price_non_negative`, recreada por `20260926017000` para aceptar null. El check de `order_events` tiene el mismo predicado y otro nombre (`order_events_event_type_check` en Cloud, `order_events_event_type_valid` en el archivo). Ninguna migracion posterior borra ese nombre.
- Funciones cuyo cuerpo, sin espacios ni mayusculas, coincide con QA: `create_order`, `generate_order_code`, `delete_product_permanently`, `save_product_edit_draft`, `save_category_display_order`, `create_default_business_settings`, `auto_suspend_out_of_stock_product`, `is_public_product_customization_enabled`, `set_business_on_demand_status`, `transition_order_status`.
- `categories_assign_append_position` en Cloud coincide con `20260917210150`. QA tiene el reemplazo de `20261011022100`, que depende de `commercial`.
- Triggers: 10 en Cloud, todos presentes en QA. Los 29 restantes de QA son finanzas, M3 o `commercial`.
- Vistas en `public`, `commercial` y `graphql_public`: ninguna.
- Buckets: `product-images` y `business-assets`, ambos publicos, sin `file_size_limit` ni mime types. Politicas de `storage`: las ocho de lectura publica y escritura del negocio. No existe `commercial-documents`.
- RLS habilitado y `FORCE RLS` desactivado en las 17 tablas `public`.

### Divergente

- `public.create_default_business_settings`: el archivo pide `search_path=public`. En Cloud `proconfig` esta vacio. El cuerpo califica `public.business_settings`.
- Politicas solo en Cloud, ausentes en Git: `Permitir lectura a miembros del negocio` y `Permitir actualización a owners y managers` sobre `business_settings`.
- Politicas del archivo ausentes en Cloud: `business_settings_select_own_business` (`20260607210325`) y `business_settings_select_active_business_public` (`20260608143000`).
- `order_events_select_own_business` y `order_events_insert_own_business`: Cloud usa `EXISTS (SELECT 1 FROM profiles ...)`. El archivo y la QA usan `business_id = (SELECT p.business_id FROM profiles p ...)`.

### Ausente

- Esquema `commercial` completo, incluidas sus funciones, triggers, RLS y el indice `privacy_requests_one_open_idx`.
- Tablas y columnas de finanzas, `order_financials`, `orders.composition_status`, `orders.migration_evidence_id`, `business_settings.timezone`, `business_settings.finance_enabled`.
- Esquema `private` y `migration_private`.
- Las 84 migraciones del grupo D.

### No verificada

- Cuerpos de triggers mas alla del nombre.
- Grants finos de cada tabla frente a cada rol.
- Predicado completo de las 58 politicas cuyo nombre coincide. El hash de `qual`/`with_check` coincidio en todas las politicas compartidas salvo las dos de `order_events`.
- Equivalencia historica de las 35 migraciones del grupo C. La presencia de la tabla no alcanza.
- Restauracion de `supabase_vault` en PostgreSQL generico.

## 4. Plan para una etapa posterior

No ejecutar estos comandos en esta etapa. No usar `db push` con las 136 migraciones: la CLI las ve pendientes porque la `version` no coincide y volveria a crear `businesses`, pedidos y personalizacion encima de 4 negocios y 78 pedidos.

### 4.1 Registrar sin reejecutar

Pueden registrarse como aplicadas, sin correr su SQL, las 14 del grupo A y las 3 del grupo B. Evidencia: `schema_migrations.name` en el grupo A, columnas de agosto, y cuerpos de `create_order`, `generate_order_code`, `save_product_edit_draft`, `delete_product_permanently` y `save_category_display_order` equivalentes a QA.

Las 35 del grupo C tambien deben registrarse sin reejecucion, porque reejecutarlas choca con tablas vivas. Su equivalencia queda abierta en los tres archivos citados. El registro solo es aceptable si la migracion de adaptacion del apartado 4.3 corre en la misma etapa y antes que el grupo D.

Conservar las 14 filas remotas hasta comprobar si la CLI exige un archivo local por cada version remota. Si `migration list` las muestra como versiones remotas sin archivo, marcarlas `reverted` en el ledger. Esa marca no ejecuta un down ni borra objetos. No borrar filas a mano.

### 4.2 Adaptacion

Hace falta una migracion nueva, posterior a `20260917210150` y anterior a `20260926010000`, todavia no escrita. Su unico trabajo:

1. Eliminar las dos politicas en espanol de `business_settings`.
2. Crear `business_settings_select_own_business` y `business_settings_select_active_business_public` con el SQL de `20260607210325` y `20260608143000`.
3. Reemplazar las dos politicas de `order_events` con el SQL de `20260516233000`.
4. `alter function public.create_default_business_settings() set search_path = public`.

No renombrar `order_events_event_type_check`: el predicado ya coincide y ninguna migracion posterior lo referencia.

### 4.3 Orden seguro, despues de autorizacion explicita

Trabajar solo con `--project-ref pkrsedmwxekbhlohhqds`. Confirmar antes el hash del manifiesto.

```text
npx --yes supabase@2.120.0 migration list --linked --project-ref pkrsedmwxekbhlohhqds
```

Reparar como aplicadas las 52 versiones locales de los grupos A, B y C, una por una, sin correr el SQL. Ejemplo de la primera y de la ultima:

```text
npx --yes supabase@2.120.0 migration repair --status applied --linked --project-ref pkrsedmwxekbhlohhqds 20260426214500
npx --yes supabase@2.120.0 migration repair --status applied --linked --project-ref pkrsedmwxekbhlohhqds 20260917210150
```

La lista completa es el prefijo de `supabase/migrations` hasta `20260917210150_categories_public_catalog_order.sql`, incluidos los tres archivos de agosto.

Si `migration list` sigue bloqueando el push por las 14 versiones remotas, marcarlas revertidas:

```text
npx --yes supabase@2.120.0 migration repair --status reverted --linked --project-ref pkrsedmwxekbhlohhqds 20260713125751
npx --yes supabase@2.120.0 migration repair --status reverted --linked --project-ref pkrsedmwxekbhlohhqds 20260716224206
npx --yes supabase@2.120.0 migration repair --status reverted --linked --project-ref pkrsedmwxekbhlohhqds 20260717010503
npx --yes supabase@2.120.0 migration repair --status reverted --linked --project-ref pkrsedmwxekbhlohhqds 20260717020549
npx --yes supabase@2.120.0 migration repair --status reverted --linked --project-ref pkrsedmwxekbhlohhqds 20260717034117
npx --yes supabase@2.120.0 migration repair --status reverted --linked --project-ref pkrsedmwxekbhlohhqds 20260717043403
npx --yes supabase@2.120.0 migration repair --status reverted --linked --project-ref pkrsedmwxekbhlohhqds 20260717162941
npx --yes supabase@2.120.0 migration repair --status reverted --linked --project-ref pkrsedmwxekbhlohhqds 20260909070121
npx --yes supabase@2.120.0 migration repair --status reverted --linked --project-ref pkrsedmwxekbhlohhqds 20260909190021
npx --yes supabase@2.120.0 migration repair --status reverted --linked --project-ref pkrsedmwxekbhlohhqds 20260910014445
npx --yes supabase@2.120.0 migration repair --status reverted --linked --project-ref pkrsedmwxekbhlohhqds 20260910040100
npx --yes supabase@2.120.0 migration repair --status reverted --linked --project-ref pkrsedmwxekbhlohhqds 20260915215741
npx --yes supabase@2.120.0 migration repair --status reverted --linked --project-ref pkrsedmwxekbhlohhqds 20260916195024
npx --yes supabase@2.120.0 migration repair --status reverted --linked --project-ref pkrsedmwxekbhlohhqds 20260917212712
```

Despues, con la migracion de adaptacion ya commiteada en el orden indicado, aplicar solo lo pendiente. El dry-run tiene que listar la adaptacion y el grupo D, y tiene que omitir todo archivo de version `<= 20260917210150`:

```text
npx --yes supabase@2.120.0 db push --dry-run --linked --project-ref pkrsedmwxekbhlohhqds
npx --yes supabase@2.120.0 db push --linked --project-ref pkrsedmwxekbhlohhqds
```

Ese `db push` queda fuera de esta preparacion. Aun despues de alinear el ledger, conviene partir el grupo D en cuatro tandas y parar entre ellas: nucleo compartido y finanzas hasta `20261004010000`, lecturas M2/M3, Commercial Core hasta `20261016120000`, y PHASE-06 `20261016165136` mas `20261016182000`.

### 4.4 Pruebas despues de cada grupo

- Despues del repair: `businesses` sigue en 4 y `orders` en 78. `migration list` muestra aplicadas las 52 versiones locales. No aparece DDL en el log.
- Despues de la adaptacion: existen las politicas en ingles de `business_settings` y `order_events`; no quedan las dos politicas en espanol; `create_default_business_settings` tiene `search_path=public`; los conteos no cambian.
- Despues de finanzas: existen `order_financials` y `finance_accounts`; `commercial` sigue ausente; `orders` sigue en 78.
- Despues de Commercial Core y PHASE-06: existe el esquema `commercial` y el indice `privacy_requests_one_open_idx`. No hay envio de correo. El bucket `commercial-documents` solo debe aparecer si una migracion de ese grupo lo crea.

### 4.5 Parar la secuencia si ocurre cualquiera de estas condiciones

- El ref destino no es `pkrsedmwxekbhlohhqds`, o el host apunta a Majo, a la base principal local o a la QA.
- El SHA-256 del manifiesto no coincide.
- `businesses` distinto de 4 u `orders` distinto de 78 antes de aplicar el grupo D.
- El dry-run incluye cualquier version `<= 20260917210150`.
- Una sentencia intenta `create table` de `businesses`, `orders`, `products` o `profiles`.
- La adaptacion no deja las politicas de `order_events` iguales al archivo `20260516233000`.
- Falla `20260926010000` o `20260926017000` por pedidos sin total o con `composition_status` distinto de `itemized`.
- El respaldo de este manifiesto no esta en disco.

## 5. Lo que esta etapa no hizo

No hubo `db push`, `db reset`, `migration repair`, `migration up`, commit, push, merge ni deploy. No se modificaron tablas, datos, RLS, Auth, Storage ni funciones remotas. No se detuvieron los contenedores de la base principal, la QA, Estadisticas, Ledger ni Majo.

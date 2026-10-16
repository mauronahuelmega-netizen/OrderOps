# Auditoría postintegración — Cloud OrderOps — 2026-10-16

Auditoría de solo lectura. No se aplicaron migraciones, no hubo DDL ni DML, no se tocaron usuarios, Storage, Auth ni variables, y no hubo commit, push ni deploy. PHASE-06 sigue abierto. Esta pasada no declara la V1 lista para lanzamiento.

Veredicto: `PASS_WITH_LIMITATIONS`

## 1. Identidad y checkpoint

| Dato | Verificado |
|---|---|
| Repositorio | `C:\Users\Oasis Desktop\Desktop\Full Stack Developer\Projects\OrderOps` |
| Rama | `cursor/commercial-core-v1-integration` |
| HEAD | `d13f7b32331e66feff4d4de0116e3e9e44faad52` |
| Proyecto | OrderOps |
| Project ref | `pkrsedmwxekbhlohhqds` |
| Organización | MauroDev (`ttgsigcooaqhbsykphqj`) |
| Región | `us-east-1` |
| Estado | `ACTIVE_HEALTHY` |
| PostgreSQL | 17.6.1.111 |
| CLI usada | `supabase@2.120.0` (el CLI avisa 2.121.0; no se actualizó) |
| Ledger | 137 filas en `supabase_migrations.schema_migrations` |
| Última versión | `20261016182000` |
| Adaptación en el ledger | `20260917210151` presente (1 fila) |

La identidad coincide con el checkpoint pedido. El informe de ejecución previo no se modificó.

## 2. Estado Git y archivos pendientes

Índice y working tree, leídos al cierre de esta auditoría:

- Modificado y sin commit: `ORDEROPS_LIVING_MEMORY.md` (`12` inserciones).
- Sin seguimiento, conservados: `.codex-remote-attachments/`, `docs/audits/`, `docs/landing-recovery-validation-2026-10-11.md`, `tmp/landing-recovery-2026-10-11/`, `supabase/migrations/20260917210151_cloud_rls_search_path_alignment.sql`.

No se descartó ni se normalizó nada.

La integración **no se puede reproducir solo con el commit `d13f7b3`**. Las 136 migraciones anteriores están en ese HEAD. La adaptación `20260917210151` está aplicada en Cloud y existe en el disco, pero sigue sin seguimiento. Los informes de `docs/audits/` y la entrada de memoria viva tampoco están en el commit. Un clon limpio de HEAD no contiene el SQL que alinea las políticas en español ni el `search_path` de `public.create_default_business_settings()`.

## 3. Configuración efectiva de PostgREST

Lo que sí está en Postgres:

- `pg_roles.rolconfig` de `authenticator` no contiene `pgrst.db_schemas` ni otra clave `pgrst.*`. El rol tiene `session_preload_libraries`, `statement_timeout=8s` y `lock_timeout=8s`.
- Ninguna migración revisada hace `ALTER ROLE authenticator SET pgrst.db_schemas`.
- `supabase/config.toml` es configuración **local**. Declara `schemas = ["public", "graphql_public"]` y `extra_search_path = ["public", "extensions"]`. No prueba el panel de Cloud.

`GET` sin credenciales a la raíz REST del proyecto respondió `401`. Eso solo demuestra que la API exige una clave. No demuestra qué esquemas están publicados.

El panel de Data API (lista de esquemas expuestos) queda `NOT_VERIFIED`.

Contrato efectivo en la base, independiente del panel:

| Camino | Resultado leído |
|---|---|
| Acceso directo de `anon` al esquema `commercial` | `has_schema_privilege('anon','commercial','usage')` = false. Sin `USAGE`, PostgREST no puede resolver objetos de ese esquema para `anon`. |
| Acceso directo de `authenticated` | `USAGE` = true. `SELECT` en 38 tablas. 5 tablas sin `SELECT`. |
| RPC pública | Los wrappers de PHASE-06 viven en `public` y están concedidos a `authenticated`. `anon` no ejecuta los wrappers comerciales. |
| Llamada interna | Las funciones `security definer` del esquema `commercial` corren con el dueño. No se invocaron. |

`authenticated` tiene `SELECT` porque las migraciones lo conceden a propósito (`20261008215314` y las de PHASE-05). No hay políticas comerciales con `qual` o `with_check` igual a `true`. Todas las tablas `commercial` tienen RLS y FORCE RLS. Si el panel llegara a publicar `commercial`, la barrera sería RLS, no la ausencia de grants.

## 4. Matriz de permisos, RLS y RPC

Lecturas de esta pasada:

- Tablas `commercial`: 43. RLS apagado: 0. RLS encendido con FORCE apagado: 0.
- Tablas `public` sin RLS: 0.
- `storage.objects`: RLS encendido, FORCE apagado.
- Políticas `USING (true)` / `WITH CHECK (true)` en `commercial`: 0.
- Grants de tabla para `anon` y `public` sobre `commercial`: ninguno en el agregado.
- `authenticated`: 38 grants `SELECT`. Ningún `INSERT`, `UPDATE` ni `DELETE` apareció en ese agregado.
- Funciones `commercial` ejecutables por `anon`: 5. Por `authenticated`: 19.
- Funciones `public` `security definer` ejecutables por `anon`: exactamente `create_default_business_settings`, `create_order`, `is_public_product_customization_enabled`, `set_business_on_demand_status`, `transition_order_status`.

Las cinco funciones `commercial` que `anon` puede ejecutar son helpers de trigger o de rechazo: `business_catalog_approver`, `enforce_founder_recurring_cap`, `prevent_voided_commission_reactivation`, `reject_conversion_terms_mutation`, `reject_onboarding_grant_extension`. Sin `USAGE` del esquema, `anon` no puede nombrarlas por la API.

Advisors de seguridad leídos el 2026-10-16T21:04:18Z, sin aplicar cambios:

| Lint | Nivel | Conteo | Lectura |
|---|---|---:|---|
| `rls_enabled_no_policy` | INFO | 5 | `conversion_terms`, `demo_rate_buckets`, `notification_preferences`, `onboarding_grant_events`, `onboarding_grants`. Con FORCE RLS y sin política, el acceso directo queda denegado. Esas cinco coinciden con las tablas sin `SELECT` para `authenticated`. |
| `function_search_path_mutable` | WARN | 6 | `commercial.reject_conversion_terms_mutation`, `commercial.reject_onboarding_grant_extension`, `commercial.outbox_requires_delivery`, `commercial.outbox_ignores_opt_out`, `public.auto_suspend_out_of_stock_product`, `public.generate_order_code`. |
| `anon_security_definer_function_executable` | WARN | 5 | Las cinco RPC de tienda listadas arriba. No son wrappers comerciales. |
| `authenticated_security_definer_function_executable` | WARN | 110 | RPC de `public`, incluidas las comerciales concedidas a `authenticated`. Coincide con el diseño de wrappers. No se probó una sesión. |
| `auth_leaked_password_protection` | WARN | 1 | Ajuste del panel de Auth. No se cambió. |

`public.list_settlement_workspace`, `public.open_privacy_request`, `public.resolve_privacy_request` y `public.list_privacy_requests` siguen concedidas a `authenticated` y no a `anon`, como se registró en la ejecución. No se volvieron a invocar.

## 5. Auth y roles

Inspección de código. No se crearon usuarios, no se envió correo y no se inició sesión contra Cloud.

- Login: `loginAction` usa `signInWithPassword` y, si falla, vuelve a `/admin/login`.
- El middleware de `/admin`, `/b`, `/commercial` y `/promoter` solo refresca la sesión. No redirige por sí mismo.
- `requireAdminContext()` manda a `/admin/login` si no hay usuario o si el perfil no tiene `business_id`. Un `super_admin` con `business_id` nulo no entra al dashboard de negocio por este camino.
- `requireAdminPermission()` redirige al dashboard si el rol de tienda no tiene el permiso.
- `getSuperAdminContext()` exige `profiles.role = 'super_admin'`.
- Roles de tienda en `lib/admin/permissions.ts`: owner, manager, operator, viewer. Finanzas, promotor y superadmin comercial viven en el esquema `commercial` y en `lib/commercial/auth/permissions.ts`.
- SoD de código: el mismo actor no puede preparar y aprobar, ni aprobar y registrar el pago. La autoaprobación de Finanzas sigue en `sod_violation` en `authorization.verify.ts`. Es una aserción de unidad, no una sesión en Cloud.
- Aislamiento entre negocios y promotores: las políticas usan el account id comercial y el `business_id` del perfil. No se ejecutó un intento cruzado.

URLs de sitio y de recuperación del proyecto Cloud: `NOT_VERIFIED`. `config.toml` local tiene `site_url = http://127.0.0.1:3000` y un redirect a `https://127.0.0.1:3000`. Eso no es el panel de Cloud.

La protección de contraseñas filtradas está apagada según el advisor. No se activó.

## 6. Storage

Lectura de `storage.buckets` y `storage.objects` en esta pasada:

| Bucket | Público | Objetos |
|---|---|---:|
| `product-images` | sí | 38 |
| `business-assets` | sí | 13 |
| `commercial-documents` | no | 0 |

Políticas sobre `storage.objects`:

- `product_images_public_read` y `business_assets_public_read`: `SELECT` para `public`.
- Insert, update y delete de ambos buckets de tienda: `authenticated`, con el nombre `*_own_business`.
- Ninguna política nombra `commercial-documents`.

`20261009120000` documenta que ese bucket queda sin políticas a propósito. El cliente de la app usa `product-images` y `business-assets`. No hay `storage.from("commercial-documents")` en el código de carga.

La autorización efectiva de subir, leer, reemplazar o borrar un objeto de `commercial-documents` queda `NOT_VERIFIED`: no se intentó la operación. La ausencia de políticas, con RLS activo en `storage.objects`, es el patrón de denegación por defecto. No se mostraron URLs firmadas ni contenido de archivos.

## 7. Funciones y configuración de la aplicación

- Edge Functions desplegadas en el proyecto: lista vacía. El repositorio no tiene `supabase/functions` en el alcance revisado.
- `.env.example` separa claves públicas (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`) de secretos de servidor (`SUPABASE_SERVICE_ROLE_KEY`, `WEB_PUSH_VAPID_PRIVATE_KEY`, `WEB_PUSH_CONTACT`, `COMMERCIAL_RATE_LIMIT_SALT`).
- `.env.local` existe. Las claves presentes, sin valores: URL, anon key, service role, VAPID pública, VAPID privada y contacto Web Push. La URL apunta al stack **local**, no al proyecto Cloud. Anon key y service role están definidas. No se imprimieron.
- `createSupabaseServiceClient` está marcado `server-only` y usa `SUPABASE_SERVICE_ROLE_KEY` contra el esquema `public`.
- El dispatcher (`resolveEmailSink`) solo acepta `127.0.0.1` y el puerto QA, y rechaza 54324, 56324 y 56424. No hay camino de correo Cloud. No se ejecutó.
- El despliegue de Next.js (variables del hosting) no se inspeccionó. Queda separado de la configuración local y del panel de Supabase.
- Las rutas comerciales llaman RPC de `public` (`list_settlement_workspace`, `open_privacy_request`) que están instaladas en Cloud. No se llamaron desde la app contra Cloud.

## 8. Pruebas realmente ejecutadas

| Comprobación | Resultado |
|---|---|
| `git rev-parse` y `git status --short` | HEAD y pendientes de la sección 2 |
| `db query` de ledger, buckets, RLS, grants, políticas abiertas y funciones `anon` | Resultados de las secciones 3, 4 y 6 |
| Advisors de seguridad | Sección 4 |
| Lista de Edge Functions | Vacía |
| `GET` REST sin credenciales | `401` |
| Clasificación de `.env.local` por nombre de clave y destino de la URL | Local, sin imprimir secretos |
| Lectura de login, middleware, permisos, SoD, storage y dispatcher | Secciones 5 a 7 |

No se ejecutaron: TypeScript, lint, `next build`, suites SQL, fixtures, sesiones autenticadas, correos, pagos, dispatcher ni operaciones de privacidad. No se afirma que un recorrido con usuario haya pasado.

## 9. Hallazgos

| ID | Clase | Hallazgo |
|---|---|---|
| F1 | HIGH | La adaptación `20260917210151` y los informes no están en Git. Cloud ya la aplicó. Un clon de HEAD no reproduce el ledger. |
| F2 | NOT_VERIFIED | La lista de esquemas expuestos por PostgREST en el panel no se pudo leer. El rol `authenticator` no fija `pgrst.db_schemas`. |
| F3 | MEDIUM | `authenticated` tiene `USAGE` y `SELECT` sobre 38 tablas `commercial`. Es el contrato de las migraciones y está cubierto por FORCE RLS, pero quedaría accesible por REST si el panel publica el esquema. |
| F4 | MEDIUM | Seis funciones siguen con `search_path` mutable. |
| F5 | MEDIUM | La protección de contraseñas filtradas de Auth está desactivada. |
| F6 | LOW | `anon` conserva `EXECUTE` sobre cinco helpers `commercial`. No tiene `USAGE` del esquema, así que no puede resolverlos por la API. |
| F7 | NOT_VERIFIED | URLs de Auth y redirects del proyecto Cloud. |
| F8 | NOT_VERIFIED | Login, logout, gates de rol, cruce de negocio o promotor, y SoD con una sesión real. |
| F9 | NOT_VERIFIED | Autorización efectiva de lectura o escritura en `commercial-documents`. |
| F10 | NOT_VERIFIED | Variables del despliegue de Next.js. La app local apunta al Supabase local. |
| F11 | LOW | `anon` puede ejecutar cinco RPC `security definer` de tienda ya existentes. No se reejecutaron. No son wrappers de PHASE-06. |

No hay un `BLOCKER` demostrado: no se encontró un grant de `anon` sobre tablas comerciales, ni una política `true`, ni RLS apagado en `commercial` o `public`.

## 10. Evidencia reproducible

Comandos de lectura, sin secretos:

```text
git rev-parse --abbrev-ref HEAD
git rev-parse HEAD
git status --short
npx supabase@2.120.0 db query --linked --project-ref pkrsedmwxekbhlohhqds -f <select.sql> -o json
```

Consultas usadas: conteo y máximo de `supabase_migrations.schema_migrations`; presencia de `20260917210151`; `storage.buckets` con bandera `public` y conteo de objetos; `has_schema_privilege` de `anon` y `authenticated` sobre `commercial`; agregados de `information_schema.role_table_grants`; `has_function_privilege` sobre `pg_proc`; `pg_policies` con `qual` o `with_check` igual a `true`; conteo de tablas sin `SELECT` para `authenticated`.

Hashes ya registrados y no recalculados aquí: adaptación SHA-256 `28EBF22F6017099527A953BB8108CB4893B0E6A60FAF55DC2ABB25BEDC9117F2`. El respaldo lógico sigue fuera del repositorio y no se reescribió.

## 11. Acciones recomendadas

Ninguna de estas acciones se ejecutó.

1. Cuando se autorice un commit, incluir `20260917210151_cloud_rls_search_path_alignment.sql` y la memoria viva. Hasta entonces el ledger de Cloud y Git no coinciden como fuente reproducible.
2. En el panel, leer Data API → Exposed schemas y confirmar que la lista es `public` y `graphql_public`. No agregar `commercial`.
3. Dejar la protección de contraseñas filtradas como decisión de Auth, fuera de esta auditoría.
4. Una migración futura puede fijar `search_path` en las seis funciones del advisor. No se alteró ninguna función aquí.
5. Una sesión de prueba, con usuario ya existente y sin escribir pedidos ni finanzas, es el único modo de cerrar F7 y F8.
6. No cerrar PHASE-06 y no tratar esta auditoría como aptitud de lanzamiento.

## 12. Veredicto

`PASS_WITH_LIMITATIONS`

El ledger Cloud tiene 137 versiones, termina en `20261016182000` e incluye la adaptación. El esquema comercial tiene RLS forzado, `anon` no tiene `USAGE`, y `commercial-documents` sigue privado y vacío. Los límites son la reproducibilidad desde Git, la lista de esquemas del panel, Auth del panel y la ausencia de una sesión real.

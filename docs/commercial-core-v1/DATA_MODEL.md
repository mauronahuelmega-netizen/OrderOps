# Modelo de datos — Commercial Core V1

Esquema `commercial`. Importes: `bigint` centavos ARS. Tiempos: `timestamptz`. Períodos de liquidación calculados en `America/Argentina/Buenos_Aires`.

Este documento es el contrato. Los nombres pueden ajustarse solo si una tarea deja el mapa viejo→nuevo en `PROGRESS.md` y actualiza este archivo en el mismo cambio.

No se duplica `public.businesses`. No se agregan columnas comerciales a `order_financials`.

## 1. Extensiones de tablas existentes

| Tabla | Cambio | Fase |
| --- | --- | --- |
| `public.businesses` | Ninguna columna obligatoria en V1. El vínculo es `commercial_opportunities.won_business_id` | 04 |
| `public.profiles` | Sin cambio de enum | — |
| Productos, categorías, pedidos, finance | Sin cambio de columnas. Cambia la autorización de escritura de catálogo en aplicación y, si hace falta, una política RLS adicional que no amplíe al promotor el rol `owner` | 04 |

`public.businesses.id` es la organización cliente (CC-10).

## 2. Plataforma y seguridad

### `platform_accounts`

- `id uuid pk`
- `user_id uuid not null unique` → `auth.users`
- `kind text not null check (kind in ('internal','promoter'))`
- `disabled_at timestamptz`
- `created_at timestamptz not null`

Check diferible o trigger: si existe `public.profiles` con `business_id is not null` para ese `user_id`, rechazar `kind = promoter`.

### `internal_role_assignments`

- `account_id` → `platform_accounts`
- `role text check (role in ('superadmin','commercial','finance','support'))`
- `granted_by uuid`
- `revoked_at timestamptz`
- unique `(account_id, role)` donde `revoked_at is null`

Solo cuentas `kind = internal`.

### `audit_events`

Append-only. Sin políticas de UPDATE/DELETE para `authenticated`.

- `id uuid pk`
- `actor_account_id uuid` nulo solo si el actor es el sistema (`actor_kind = system`)
- `actor_kind text check (actor_kind in ('internal','promoter','business_member','system'))`
- `action text not null`
- `entity_schema text not null`
- `entity_table text not null`
- `entity_id uuid not null`
- `reason text`
- `before jsonb`
- `after jsonb`
- `correlation_id uuid not null`
- `created_at timestamptz not null default now()`

Índice `(entity_table, entity_id, created_at)`.

### `outbox_events`

- `id uuid pk`
- `event_name text not null`
- `payload jsonb not null`
- `occurred_at timestamptz not null`
- `status text check (status in ('pending','processing','delivered','dead'))`
- `attempts int not null default 0`
- `available_at timestamptz not null`
- `locked_at timestamptz`
- `correlation_id uuid not null` (argumento de `commercial.enqueue`; no deduplica el evento)
- unique no aplica al evento de negocio; la idempotencia de entrega está en `notification_deliveries`.

### `notifications`

- `id uuid pk`
- `recipient_account_id` → `platform_accounts`
- `event_name text not null`
- `outbox_event_id uuid not null`
- `title text not null`
- `body text not null`
- `read_at timestamptz`
- `created_at timestamptz`
- unique `(outbox_event_id, recipient_account_id)`

### `notification_deliveries`

- `id uuid pk`
- `outbox_event_id uuid not null`
- `channel text check (channel in ('inbox','email'))`
- `destination text not null` (email o id de cuenta; no loguear secretos)
- `status text check (status in ('pending','sent','failed','dead'))`
- `attempt_count int not null default 0`
- `last_error text`
- unique `(outbox_event_id, channel, destination)`

### `privacy_requests`

- `id uuid pk`
- `subject_kind text`
- `subject_ref text`
- `request_kind text check (request_kind in ('access','rectification','deletion'))`
- `status text check (status in ('open','fulfilled','rejected'))`
- `opened_by`
- `resolved_by`
- `resolution_notes text`

### `commercial_programs`

- `id uuid pk`
- `code text not null` (`founder`)
- `version int not null`
- `setup_price_cents bigint not null`
- `monthly_price_cents bigint not null`
- `setup_commission_cents bigint not null`
- `recurring_bps int not null`
- `max_recurring_slots int not null`
- `effective_from date not null`
- `retired_at timestamptz`
- unique `(code, version)`

Semilla V1, una fila: `founder` versión 1, 29000000, 5500000, 12000000, 4000, 12. Inmutable después de insertada (trigger de rechazo a UPDATE de esas columnas). Un programa nuevo es una versión nueva.

## 3. CRM

### `commercial_businesses`

Lead = este registro (CC-01). No es un formulario.

- `id uuid pk`
- `display_name text not null`
- `normalized_name text not null`
- `trade_category text`
- `normalized_phone text` (E.164 o null)
- `email text`
- `fiscal_id text` (CUIT si existe y es lícito guardarlo). El formulario público `/demo` no captura fiscal en V1; `submit_demo_request` llama `find_or_prepare_business` con fiscal `null`, así que el alta web deja `fiscal_id` null. ENG-07 sigue impidiendo match `high` ante fiscal contradictorio cuando ambos valores existen.
- `brand_name text`
- `branch_label text`
- `initial_channel text not null check (initial_channel in ('organic','promoter','campaign','internal'))`
- `initial_promoter_id uuid` null, solo informativo del primer origen; no es atribución
- `linked_business_id uuid` null → `public.businesses` cuando ya se convirtió
- `merged_into_id uuid` null → self
- `archived_at timestamptz`
- `created_at timestamptz not null`

Índice `(normalized_phone)` donde el teléfono no es null y `merged_into_id` es null. No es unique: dos sucursales pueden compartir teléfono de marca y deben ir a revisión, no fundirse solas.

Índice de apoyo a dedup: `(normalized_name, normalized_phone)`.

### `commercial_contacts`

- `id`, `commercial_business_id`, `full_name text not null`, `role_label`, `normalized_phone`, `email`, `created_at`
- Varios contactos por comercio.

### `commercial_interactions`

- `id`
- `commercial_business_id not null`
- `opportunity_id uuid` null
- `kind text not null check (kind in ('demo_request','call','whatsapp','email','meeting','demo_completed','note','promoter_registration','follow_up','document','other'))`
- `channel text not null`
- `origin text not null` (se conserva; una atribución posterior no lo reescribe)
- `actor_account_id uuid`
- `body text`
- `occurred_at timestamptz not null`
- `created_at timestamptz not null`

### `demo_submissions`

- `id`
- `idempotency_key text not null unique`
- `contact_name text not null`
- `trade_name text not null`
- `whatsapp text not null`
- `trade_category text not null`
- `email text`
- `needs text`
- `source_channel text not null`
- `promoter_ref text` (código público, no id interno si el código no resuelve)
- `campaign_ref text`
- `resolved_business_id uuid`
- `resolved_opportunity_id uuid`
- `created_at`

El formulario no crea atribución.

### `commercial_opportunities`

- `id uuid pk`
- `commercial_business_id not null`
- `stage text not null check (stage in ('new','contacting','qualified','demo_scheduled','demo_done','follow_up','won','lost'))`
- `owner_account_id uuid` (responsable operativo; puede no ser el promotor atribuido)
- `lost_reason text`
- `won_business_id uuid` → `public.businesses`
- `won_by_account_id uuid`
- `won_at timestamptz`
- `lost_at timestamptz`
- `archived_at timestamptz`
- `created_at timestamptz not null`

Checks:

- `stage = 'won'` implica `won_business_id` y `won_at` no nulos (INV-02).
- `stage = 'lost'` implica `lost_reason` no vacío.
- `stage <> 'won'` implica `won_at` nulo.

No hay unique de «una sola oportunidad abierta» forzado en V1: la spec pide evitar paralelas innecesarias, no prohibir una segunda después de una perdida. Regla de aplicación: rechazar una oportunidad abierta nueva si ya existe otra abierta del mismo comercio (`stage` no terminal). Unique parcial equivalente:

```text
unique (commercial_business_id) where stage not in ('won','lost') and archived_at is null
```

Eso sí es imponible y coincide con «evitar paralelas del mismo proceso». Una oportunidad sucesiva queda permitida cuando la anterior está `won` o `lost`.

### `opportunity_stage_events`

- `opportunity_id`, `from_stage`, `to_stage`, `actor_account_id`, `reason`, `created_at`
- Toda transición inserta una fila. Transiciones flexibles (CC-09).

### `commercial_tasks`

- `id`, `opportunity_id not null`, `kind text`, `title text not null`, `description text`
- `assignee_account_id`, `due_at`, `priority text check (priority in ('low','normal','high'))`
- `status text not null check (status in ('open','done','cancelled'))`
- `cancel_reason text`
- `completed_at`, `created_by`, `created_at`
- `status = cancelled` implica `cancel_reason`.
- Cerrar oportunidad con tareas `open` se rechaza en la RPC hasta done o cancelled.

Una tarea no es actividad calificada (CC-06). No existe columna que marque la tarea como extensión de reclamación.

### `commercial_merges`

- `id`, `survivor_id`, `absorbed_id`, `actor_account_id`, `reason not null`, `created_at`
- `survivor_id <> absorbed_id`
- P02-T06 reasigna contactos, interacciones, oportunidades y submissions dentro de `merge_commercial_businesses`, conserva `origin` y no nombra tablas de atribución ni comisiones (INV-15). No hay un trigger aparte.

## 4. Promotores y atribución

### `promoters`

- `id uuid pk`
- `account_id uuid not null unique` → `platform_accounts` `kind=promoter`
- `public_code text not null unique` (enlace referido)
- `legal_name text not null`
- `cuit text`
- `status text not null check (status in ('registered','pending_verification','active','suspended','separated'))`
- `activated_at`, `separated_at`
- `created_at`

Operar y crear reclamaciones exige `status = active`.

### `promoter_contracts`

- `id`, `promoter_id`, `version_label text not null`, `accepted_at timestamptz`, `document_path text`, `created_at`
- Activación exige al menos un contrato con `accepted_at` no nulo.

### `promoter_verifications`

- `id`, `promoter_id`, `kind text check (kind in ('identity','cuit','monotributo'))`
- `status text check (status in ('pending','verified','rejected'))`
- `evidence_path text`, `reviewed_by`, `reviewed_at`, `notes`
- Activación exige las tres en `verified`. Es evidencia cargada por un interno, no AFIP (`BLK-LEG-01`).

### `promoter_bank_accounts`

- `id`, `promoter_id`
- `cbu_or_cvu text not null` (acceso restringido; ver seguridad)
- `holder_name text not null`
- `verification_note text`
- `is_current boolean not null default false`
- `created_by`, `created_at`, `disabled_at`
- unique parcial: un solo `is_current` por promotor.
- Cambio = fila nueva + audit. No UPDATE silencioso del CBU.

### `attribution_claims`

- `id uuid pk`
- `promoter_id not null`
- `commercial_business_id not null`
- `opportunity_id uuid` null hasta que exista oportunidad; la confirmación exige oportunidad (CC-07)
- `status text check (status in ('provisional','expired','rejected','confirmed','superseded'))`
- `provisional_until timestamptz not null` (alta + 30 días)
- `created_at`
- Index de vigentes: `(commercial_business_id)` donde `status = provisional`.

No unique de una sola provisional: varios promotores pueden reclamar. Ninguna provisional bloquea otra oportunidad por sí sola.

### `claim_extensions`

- `claim_id`, `extended_until`, `interaction_id not null`, `actor_account_id`, `reason not null`, `created_at`
- `interaction.kind` no puede ser el sustituto de una tarea. La RPC rechaza si la interacción no es `call`, `whatsapp`, `email`, `meeting`, `demo_completed` o `follow_up`.
- Solo cuenta `internal` con permiso. Nunca automática.

### `opportunity_attributions`

- `id`
- `opportunity_id not null`
- `promoter_id not null`
- `claim_id uuid`
- `status text check (status in ('confirmed','voided'))`
- `method text check (method in ('automatic_referral','manual'))`
- `reason text not null`
- `confirmed_by`
- `confirmed_at`
- `voided_at`
- unique parcial: una fila `confirmed` por `opportunity_id`.

Confirmación automática V1, única: `demo_submissions` con `promoter_ref` que resuelve a un promotor `active`, el comercio resuelto no tiene otra atribución `confirmed` en una oportunidad abierta, y no hay CUIT contradictorio. Cualquier otra confirmación es `manual`.

### `attribution_disputes`

- `id`, `opportunity_id not null`, `status text check (status in ('open','retained','decided','closed'))`
- `opened_by`, `assigned_to`, `decision text`, `decision_reason text`, `economic_effect text`, `decided_at`
- Participantes en `dispute_events` o tabla `dispute_parties (dispute_id, promoter_id, role)`.

Retención: las comisiones impagas de esa oportunidad pueden pasar a `held`. No se retienen las demás comisiones del promotor.

### `dispute_events`

- `dispute_id`, `kind`, `actor_account_id`, `body`, `evidence_path`, `created_at`

### `promoter_separations`

- `promoter_id unique` (una desvinculación efectiva V1)
- `effective_at timestamptz not null`
- `reason text not null`
- `actor_account_id`
- Al insertar: `promoters.status = separated`, se revocan grants vigentes, se reasignan oportunidades abiertas a un interno (`owner_account_id`), no se borran comisiones ni contratos.

### `opportunity_protections`

- `opportunity_id`
- `promoter_id`
- `separation_id`
- `starts_at`, `ends_at` (`effective_at` + 90 días)
- `basis text check (basis in ('confirmed_with_activity','exception'))`
- Se crea solo si hay atribución `confirmed` y al menos una interacción sustantiva del promotor en esa oportunidad anterior a `effective_at`.
- Una reclamación solo `provisional` no inserta esta fila.
- Si `won_at` cae dentro de `[starts_at, ends_at]`, la conversión puede usar esa atribución. Fuera del intervalo, no se restaura sola.

## 5. Conversión y onboarding

### `conversion_terms`

Una fila por oportunidad ganada. Inmutable.

- `id uuid pk`
- `opportunity_id uuid not null unique`
- `program_id` → `commercial_programs`
- `program_code text not null`
- `program_version int not null`
- `setup_price_cents bigint not null`
- `monthly_price_cents bigint not null`
- `setup_commission_cents bigint not null`
- `recurring_bps int not null`
- `max_recurring_slots int not null`
- `attribution_id uuid not null`
- `won_business_id uuid not null`
- `frozen_at timestamptz not null`

Trigger: rechazar UPDATE y DELETE.

Cambiar `commercial_programs` no toca esta fila (INV-07).

### `service_subscriptions`

Estado del servicio del cliente para cancelación y reactivación (CC-31). No es la suscripción de Web Push.

- `id`
- `won_business_id uuid not null`
- `conversion_terms_id uuid not null`
- `status text check (status in ('active','cancel_requested','ended','reactivated'))`
- `cancel_requested_at`
- `ended_at` (baja efectiva)
- `reactivated_at`

Reactivación con `reactivated_at <= ended_at + 180 días` conserva `conversion_terms` y el contador. Después, no se reabre el contador; hace falta una oportunidad nueva. La RPC no copia términos viejos pasado ese plazo.

### `onboarding_grants`

- `id`
- `promoter_id not null`
- `business_id uuid not null` → `public.businesses`
- `opportunity_id uuid`
- `status text check (status in ('pending_client','active','expired','revoked','completed'))`
- `requested_by`
- `approved_by_profile_id uuid` → `public.profiles` (owner o manager de ese `business_id`)
- `exception_by_account_id uuid` (solo superadmin, con `exception_reason`)
- `starts_at`, `ends_at` (`ends_at <= starts_at + 30 días`)
- `revoked_at`, `completed_at`

Check: o hay `approved_by_profile_id` del comercio, o hay excepción de superadmin con motivo. No basta la atribución.

Alcance fijo en código, no en columnas editables por el promotor: `product.name`, `product.description`, categorías (nombre y orden), imágenes de producto, texto descriptivo de variante. Fuera: `price`, stock operativo si implica disponibilidad de venta sensible según la action existente, pedidos, `business_settings`, team, finanzas.

Si la action actual mezcla precio y nombre en un solo POST, el guard rechaza el POST entero cuando el actor es promotor y el payload incluye precio. No se ignora el campo en silencio.

## 6. Economía

### `platform_obligations`

Lo que el cliente debe. Distinto del cobro.

- `id`
- `conversion_terms_id not null`
- `won_business_id not null`
- `kind text check (kind in ('setup','subscription'))`
- `period_key text` null para setup; para mensualidad, clave de obligación (no de calendario Founder). Puede ser `sub:<uuid de intento de período>` generado al emitir la obligación, estable entre reintentos.
- `list_price_cents bigint not null` copiado del snapshot al crear
- `status text check (status in ('open','satisfied','failed','void'))`
- unique `(conversion_terms_id, kind)` donde `kind = setup`
- unique `(conversion_terms_id, period_key)` donde `period_key` no es null

Un reintento no crea otra obligación.

### `platform_collections`

- `id uuid pk`
- `obligation_id not null`
- `idempotency_key text not null unique`
- `status text check (status in ('posted','failed','reversed'))`
- `gross_cents bigint not null check (gross_cents >= 0)`
- `eligible_base_cents bigint` null mientras falte política
- `policy_status text not null check (policy_status in ('nominal','blocked_pending_policy'))`
- `posted_at timestamptz`
- `failed_at timestamptz`
- `reversed_at timestamptz`
- `reversal_of_id uuid` self, para la cobranza original que se revierte; la reversa es otra fila o un estado sobre la misma. V1: la fila original pasa a `reversed` y no se borra; el detalle del movimiento correctivo está en `commission_adjustments` y en `audit_events`.
- `recorded_by` cuenta finance
- `external_ref text`

Regla de aplicación del caso nominal, también en SQL al insertar:

- `posted` y `gross_cents = obligation.list_price_cents` y no hay marcas de descuento → `policy_status = nominal` y `eligible_base_cents = gross_cents`.
- Cualquier otro `posted` con bruto distinto → `policy_status = blocked_pending_policy` y `eligible_base_cents` null.
- `failed` → `eligible_base_cents` null, no comisión, no slot.

Esa regla no decide IVA ni parciales. Los deja bloqueados (`BLK-ECO-01`, `BLK-ECO-02`).

### `founder_slots`

- `conversion_terms_id not null`
- `slot int not null check (slot between 1 and 12)`
- `collection_id uuid not null unique`
- `obligation_id uuid not null unique`
- primary key `(conversion_terms_id, slot)`

Solo se inserta si la collection está `posted`, `policy_status = nominal`, `kind = subscription`, y la obligación no es setup. Un fallo no inserta fila (INV-05, INV-06). Máximo 12 por el check y la pk.

### `promoter_commissions`

- `id`
- `collection_id not null`
- `right_kind text check (right_kind in ('setup','recurring'))`
- `conversion_terms_id not null`
- `promoter_id not null`
- `slot int` null para setup; 1..12 para recurring
- `amount_cents bigint not null check (amount_cents >= 0)`
- `status text check (status in ('pending','available','in_settlement','paid','held','voided'))`
- `available_at timestamptz` (posted_at + 15 días; setup además exige onboarding `completed` o `release_exception`)
- `release_exception_reason text`
- `release_exception_by uuid`
- `settlement_id uuid` null hasta incluirla
- unique `(collection_id, right_kind)` (INV-04)

Cálculo nominal:

- setup: `amount_cents = conversion_terms.setup_commission_cents` (12_000_000), no un porcentaje del setup.
- recurring: `amount_cents = eligible_base_cents * recurring_bps / 10000`. Con 5_500_000 y 4000 bps = 2_200_000.

Si `policy_status <> nominal`, no hay insert de comisión.

`pending` no entra en liquidación (INV-08). `in_settlement` no es `paid` (sección 22 de la spec).

Setup: sigue `pending` hasta `available_at` y onboarding `completed`, salvo `release_exception_*` auditado. Recurring: solo `available_at`. Onboarding incompleto no retiene la recurrente (CC-24).

### `commission_adjustments`

- `id`
- `commission_id not null`
- `amount_cents bigint not null` (signado: negativo revierte)
- `reason text not null`
- `source text check (source in ('refund','chargeback','void','duplicate','correction','dispute'))`
- `status text check (status in ('pending','available','in_settlement','applied'))`
- `created_by`, `created_at`
- No modifica `promoter_commissions.amount_cents` histórico.
- Si la comisión ya está `paid`, el ajuste queda `available` para una liquidación posterior. No se netea solo (`BLK-ECO-03` limita el significado contractual; el registro sí es obligatorio).

### `promoter_settlements`

- `id`
- `promoter_id not null`
- `period_key text not null` (`YYYY-MM` del mes cerrado en Argentina)
- `timezone text not null default 'America/Argentina/Buenos_Aires'`
- `status text check (status in ('draft','approved','invoiced','payable','partially_paid','paid','void'))`
- `prepared_by not null`
- `approved_by`
- `approved_at`
- `total_cents bigint not null`
- unique `(promoter_id, period_key)`
- check: `approved_by is null or approved_by <> prepared_by` (SoD, `BLK-SEC-02` default)
- Una comisión entra si `status = available` y `available_at` es anterior al fin del período. Si la ventana cae después del cierre, queda para el mes siguiente.

`invoiced` no es pagable hasta factura `accepted`. `payable` es el estado que habilita transferencia.

### `settlement_items`

- `settlement_id`, `source_kind check (source_kind in ('commission','adjustment'))`, `source_id`, `amount_cents`, `label`
- unique `(source_kind, source_id)` para no incluir dos veces el mismo derecho.

### `promoter_invoices`

- `id`, `settlement_id not null`, `promoter_id not null`
- `amount_cents bigint not null`
- `status text check (status in ('submitted','accepted','rejected'))`
- `document_path text not null`
- `reviewed_by`, `reviewed_at`, `rejection_reason`
- Check de aplicación: `accepted` solo si `amount_cents = settlement.total_cents`. Si no, `rejected` y el pago no se habilita.
- V1 no valida CAE ni tipo de comprobante AFIP (`BLK-LEG-01`).

### `settlement_payments`

- `id`
- `settlement_id not null`
- `idempotency_key text not null unique`
- `amount_cents bigint not null check (amount_cents > 0)`
- `status text check (status in ('recorded','failed'))`
- `bank_account_id` → cuenta vigente al momento, copiada en `destination_snapshot jsonb` (titular y CBU) para que un cambio posterior no reescriba el pago
- `bank_reference text`
- `receipt_path text`
- `recorded_by not null`
- `paid_at`
- check de aplicación: `recorded_by <> settlement.approved_by` salvo excepción superadmin auditada en `audit_events` con `action = payment.sod_exception`
- Suma de `recorded.amount_cents` no puede superar `settlement.total_cents` (constraint diferible o RPC).
- Estado del settlement: `partially_paid` si suma menor; `paid` si suma igual. Un `failed` no suma.
- Reintento = nueva fila con otra `idempotency_key`, no un segundo efecto de la misma clave (INV-10).

No hay pasarela. `recorded` significa «un humano cargó que la transferencia se hizo».

## 7. Documentos

Bucket privado `commercial-documents`. Paths:

```text
contracts/{promoter_id}/{file}
verifications/{promoter_id}/{file}
invoices/{settlement_id}/{file}
receipts/{payment_id}/{file}
disputes/{dispute_id}/{file}
```

Sin política pública de lectura. En V1 el bucket existe con `public = false` y sin policies de objeto: deny-by-default. `submit_promoter_evidence` acepta `evidence_path` solo si coincide con `contracts/{promoter_id}/{file}` o `verifications/{promoter_id}/{file}` (un segmento de archivo, sin `..`, sin `//`, sin path absoluto). Upload/download directo desde cliente y URLs firmadas quedan pendientes de una fase que autorice el flujo de archivos.

## 8. RLS (resumen)

Detalle de actores en [SECURITY_MATRIX.md](SECURITY_MATRIX.md).

- `anon` no tiene grants de tabla ni de los wrappers internos. El formulario público entra por el server action, que llama `public.submit_demo_request` con `service_role`. Esa función es `security definer`, delega en `commercial.submit_demo_request` y no devuelve ids internos. `search_path` fijo.
- Desde P01-T02, `authenticated` tiene `SELECT` y no tiene `INSERT`/`UPDATE`/`DELETE`. Las políticas devuelven cero filas si no hay cuenta. Las escrituras de rol pasan por RPC. `anon` sigue sin acceso.
- Desde P02-T01, las tablas CRM repiten ese patrón. El `SELECT` lo reciben `superadmin` y `commercial`. `crm.read` no abre filas por sí solo. Soporte no lee CRM en esta tarea: todavía no existen grant ni onboarding para acotar su alcance, y no se inventan esas relaciones.
- Promotor: políticas SELECT/UPDATE acotadas a `promoter_id = current_promoter()`. Sin SELECT de otros promotores, ni de CBU ajenos, ni de comisiones ajenas.
- Internos: policies por función `commercial.has_role('finance')` etc. Escrituras sensibles solo vía RPC que también audita, para no depender de un UPDATE ancho.
- Miembros de comercio: sin policies en `commercial`, salvo una RPC para aprobar o revocar el grant de su `business_id` si el perfil es owner o manager.
- `audit_events`: insert vía RPC definer; select para `superadmin` y para `finance` sobre eventos económicos. Sin update/delete.

## 9. Migraciones

Una migración adelante por fase, timestamp + prefijo `commercial_phaseN_`. Aditiva.

Rollback local documentado en `supabase/rollbacks/commercial_phaseN_down.sql`: `drop schema` solo si ninguna fase posterior está aplicada, o drops de objetos de esa fase en orden inverso. No se ejecuta solo. No es un down automático de Supabase.

Antes de `supabase db push` o `migration up` contra cualquier URL, P01-T01 tiene que haber pasado. Destino permitido: API `127.0.0.1:54321` / DB `127.0.0.1:54322`.

Regenerar `types/database.ts` desde la instancia local después de cada migración de fase. No editar a mano el tipo generado salvo el flujo que el repo ya use; si hoy el archivo se versiona, el diff entra en la misma tarea.

## 10. Invariantes que la base debe impedir

| ID | Garantía |
| --- | --- |
| INV-01 | `attribution_claims.status = provisional` no inserta `opportunity_attributions` |
| INV-02 | check `won` ⇒ `won_business_id` |
| INV-03 | no hay FK de comisión hacia oportunidad sin `collection_id` |
| INV-04 | unique `(collection_id, right_kind)` |
| INV-05 | `founder_slots.slot <= 12` y pk |
| INV-06 | collections `failed` no tienen slot (FK solo desde collection `posted`) |
| INV-07 | trigger inmutable en `conversion_terms` y en columnas económicas del programa ya insertado |
| INV-08 | RPC de liquidación filtra `status = available` y `available_at <= period_end` |
| INV-09 | RPC de pago rechaza si no hay invoice `accepted` por el total |
| INV-10 | unique `idempotency_key` de pagos |
| INV-11 | disputas escriben `commission_adjustments` o `held`; no UPDATE de montos históricos |
| INV-12 | ninguna policy da al promotor rol de `profiles` del comercio |
| INV-13 | grant `active` y `now() < ends_at` dentro de la RPC de catálogo del promotor |
| INV-14 | separación no tiene `ON DELETE CASCADE` hacia comisiones |
| INV-15 | trigger de fusión no toca atribuciones |
| INV-16 | policies por titular; tests de id ajeno |
| INV-17 | dispatcher no está en la transacción de negocio |
| INV-18 | RPC sensibles insertan `audit_events` o fallan |

INV-12 e INV-17 se prueban con tests de autorización y de outbox. El resto debe fallar en SQL aunque la aplicación esté mal.

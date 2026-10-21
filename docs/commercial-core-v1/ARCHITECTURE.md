# Arquitectura objetivo — Commercial Core V1

Fecha: 2026-10-08. Compatible con el repositorio auditado en [REPOSITORY_AUDIT.md](REPOSITORY_AUDIT.md).

## 1. Decisión de encaje

OrderOps hoy es un SaaS multi-tenant de operación del comercio: pedidos, catálogo, caja del local. El Commercial Core es el sistema interno con el que OrderOps adquiere esos comercios y paga a promotores.

Por eso el núcleo vive en el esquema `commercial`, con actores de plataforma, y solo toca `public.businesses`, productos y categorías en los puntos que la spec exige: conversión y onboarding.

```text
auth.users
  ├─ public.profiles (comercio o super_admin)     DO_NOT_TOUCH en su enum
  └─ commercial.platform_accounts (interno | promotor)
        ├─ CRM, atribuciones, onboarding
        └─ cobranzas SaaS, comisiones, liquidaciones, pagos
public.businesses  ←── conversión (business_id) y grant de catálogo
public.order_financials / finance_*   sin dependencia
```

## 2. Límites de dominio

Dependencia permitida = el origen puede llamar al destino. Dependencia prohibida = no puede importar ni escribir sus tablas.

### Captación

- Responsabilidad: formulario público, normalización, antispam, idempotencia, origen (orgánico, promotor, campaña, interno).
- Entidades: `demo_submissions`, y la interacción que nace de ellas.
- Operación pública: `submitDemoRequest`.
- Emite: `demo.submitted`.
- Consume: nada de dinero.
- Permitido: CRM.
- Prohibido: confirmar atribución, crear comisión, leer CBU, leer otros promotores.

### CRM comercial

- Responsabilidad: comercio potencial, contactos, interacciones, oportunidades, etapas, tareas, demos, fusión, archivo.
- Entidades: `commercial_businesses`, `commercial_contacts`, `commercial_interactions`, `commercial_opportunities`, `opportunity_stage_events`, `commercial_tasks`, `commercial_merges`.
- Operaciones: alta interna, transición de etapa, fusión autorizada, archivo.
- Emite: `opportunity.stage_changed`, `opportunity.won`, `opportunity.lost`, `business.merged`.
- Consume: `demo.submitted`.
- Permitido: leer promotor solo por id ya vinculado a la interacción.
- Prohibido: escribir comisiones, cambiar `profiles.role`, fusionar atribuciones confirmadas.

### Promotores

- Responsabilidad: registro, verificación fiscal manual, contrato versionado, activación, suspensión, desvinculación, datos bancarios, panel.
- Entidades: `promoters`, `promoter_contracts`, `promoter_verifications`, `promoter_bank_accounts`, `promoter_separations`.
- Emite: `promoter.activated`, `promoter.suspended`, `promoter.separated`.
- Consume: nada económico para autorizar operación. La desvinculación no borra comisiones.
- Prohibido: operar si el estado no es `active`. Prohibido acceder a `public.businesses` por ser el promotor atribuido.

### Atribuciones

- Responsabilidad: reclamación provisional, vencimiento a 30 días, extensión manual, confirmación híbrida, disputa, protección de 90 días.
- Entidades: `attribution_claims`, `claim_extensions`, `opportunity_attributions`, `attribution_disputes`, `dispute_events`, `opportunity_protections`.
- Emite: `claim.confirmed`, `claim.rejected`, `claim.expired`, `dispute.opened`, `dispute.decided`.
- Consume: oportunidades y estado del promotor.
- Prohibido: reescribir cobranzas o comisiones históricas. Un cambio de titular genera ajuste, no UPDATE del importe viejo.

### Conversión

- Responsabilidad: separar aceptación, vínculo con `businesses`, cobranza y comisión. Congelar `conversion_terms`.
- Entidades: campos de cierre en `commercial_opportunities`, fila `conversion_terms`.
- Emite: `conversion.terms_frozen`.
- Consume: oportunidad en etapa que un interno autoriza a `won`.
- Prohibido: insertar comisión. Ganada no cobra.

### Onboarding

- Responsabilidad: grant temporal, alcance de catálogo, revocación, expiración a 30 días.
- Entidades: `onboarding_grants`, `onboarding_grant_events`.
- Emite: `onboarding.granted`, `onboarding.revoked`, `onboarding.expired`.
- Consume: promotor activo o desvinculado con canal que la spec permita solo si el grant sigue vigente; en V1 el grant exige promotor que aún puede asistir según estado del grant, no según atribución.
- Permitido: llamar al guard de catálogo.
- Prohibido: leer pedidos, finanzas del local, equipo, settings de seguridad, precios.

### Cobranzas

- Responsabilidad: obligaciones de setup y mensualidad, cobros manuales de dev, fallos, reintentos, reversas. Fuente de verdad V1 porque no hay billing SaaS.
- Entidades: `platform_obligations`, `platform_collections`.
- Emite: `collection.posted`, `collection.failed`, `collection.reversed`.
- Consume: `conversion_terms` solo para saber el precio de referencia. No confirma atribución.
- Prohibido: leer `order_financials`. Prohibido marcar elegible un cobro fallido.

### Comisiones

- Responsabilidad: nacer de una cobranza elegible, ventana de 15 días, setup sujeto a onboarding salvo excepción auditada, recurrente sin esa condición, tope de 12, ajustes.
- Entidades: `promoter_commissions`, `founder_slots`, `commission_adjustments`.
- Emite: `commission.accrued`, `commission.available`, `commission.adjusted`.
- Consume: collections, terms, grants (solo para liberar setup), disputas (retener impagas afectadas).
- Prohibido: crear una segunda comisión para el mismo derecho. Prohibido pagar.

### Liquidaciones

- Responsabilidad: cierre mensual Argentina, una liquidación por promotor y período, preparación y aprobación separadas.
- Entidades: `promoter_settlements`, `settlement_items`.
- Emite: `settlement.prepared`, `settlement.approved`.
- Consume: comisiones `available` y ajustes no incluidos.
- Prohibido: adelantar una comisión dentro de la ventana. Prohibido equivaler liquidación a pago.

### Facturación del promotor

- Responsabilidad: comprobante cargado por el promotor, revisión de Finanzas, bloqueo del pago hasta verificación.
- Entidades: `promoter_invoices`.
- Emite: `invoice.submitted`, `invoice.accepted`, `invoice.rejected`.
- Prohibido: integración ARCA en V1.

### Pagos

- Responsabilidad: transferencia manual, parcial, fallida, reintento, comprobante, referencia.
- Entidades: `settlement_payments`.
- Emite: `payment.recorded`, `payment.failed`.
- Consume: liquidación aprobada con factura aceptada.
- Prohibido: ejecutar una transferencia bancaria real. El registro es contable local.

### Notificaciones

- Responsabilidad: bandeja interna y correo. Reintento de entrega. No de la operación de negocio.
- Entidades: `notifications`, `notification_deliveries`, `outbox_events`.
- Consume: eventos de los demás dominios vía outbox.
- Prohibido: hacer rollback del estado comercial si el correo falla (INV-17).

### Auditoría

- Responsabilidad: append-only de operaciones sensibles.
- Entidad: `audit_events`.
- La escribe la misma transacción que el cambio. No depende de una nota libre del usuario.

### Administración

- Responsabilidad: roles internos múltiples, revocación, programas versionados, privacidad.
- Entidades: `platform_accounts`, `internal_role_assignments`, `commercial_programs`, `privacy_requests`.
- Prohibido: editor visual de roles y de programas en V1. El programa nuevo se inserta por migración o acción de superadmin con snapshot.

## 3. Capas de aplicación

```text
app/commercial/          backoffice interno (server components + actions)
app/promoter/            panel del promotor
app/(marketing)/         formulario público, sin sesión de promotor obligatoria
lib/commercial/          reglas puras y acceso a datos
  auth/                  principal, permisos, SoD
  crm/
  promoters/
  attributions/
  conversion/
  onboarding/
  collections/
  commissions/           funciones puras, sin I/O
  settlements/
  notifications/
  audit/
supabase/migrations/     esquema commercial
supabase/tests/commercial/
supabase/rollbacks/      SQL de reversa local, no aplicado en automático
```

Server Actions resuelven el principal en servidor. El cliente no envía `role` ni `business_id` de confianza.

Reglas de dinero y de transición viven en funciones puras testeadas y se vuelven a imponer en SQL (constraints, unique, checks, RPC `security definer` con `search_path` fijo). La UI no es la barrera.

## 4. Integración con lo existente

| Punto | Mecanismo |
| --- | --- |
| Identidad | `auth.users.id` compartido. Alta de interno y promotor crea usuario con el flujo admin ya usado para team, o invitación Supabase local. No se inventa un segundo login |
| Organización | `commercial_opportunities.won_business_id` → `public.businesses.id` |
| Catálogo | `assertCatalogWrite(principal, businessId, fields)` al inicio de las actions de productos y categorías. Si el principal es admin del comercio, el camino actual sigue. Si es promotor, solo pasa con grant vigente y campos permitidos |
| Middleware | Ampliar el matcher a `/commercial/:path*` y `/promoter/:path*` cuando existan esas rutas, reutilizando `updateSession` |
| Cobranzas | Libro propio. Una fase futura podrá mapear un proveedor externo con `external_ref` único. V1 no lo necesita |
| Pedidos y realtime | Sin imports desde `lib/commercial` |

Crear el `businesses` al ganar reutiliza la validación de slug ya presente en super-admin. La tarea P04-T01 debe citar el action existente y extraer la creación solo si hoy está embebida en un form; si extraerla mueve comportamiento de super-admin, se deja un wrapper y se cubre con el verify de regresión.

## 5. Eventos

Patrón V1: transactional outbox. No se agrega Redis, Inngest ni colas de Supabase.

1. La RPC de negocio inserta el cambio y la fila `outbox_events` en la misma transacción.
2. `scripts/commercial-core/dispatch-outbox.mjs` (fase 06) toma filas `pending` con `FOR UPDATE SKIP LOCKED`, escribe notificación y entrega, reintenta con backoff, y marca `dead` después de 8 intentos.
3. El handler de notificación es idempotente por `outbox_events.id`.
4. Un fallo de entrega no actualiza oportunidad, comisión ni pago.

Eventos mínimos de CC-34: `demo.submitted`, `opportunity.assigned`, `task.due`, `claim.confirmed`, `claim.rejected`, `dispute.opened`, `onboarding.granted`, `onboarding.revoked`, `settlement.approved`, `invoice.rejected`, `payment.recorded`.

## 6. Idempotencia

| Operación | Clave |
| --- | --- |
| Formulario demo | `demo_submissions.idempotency_key` único |
| Cobranza | `platform_collections.idempotency_key` único |
| Comisión de un derecho | único `(collection_id, right_kind)` |
| Posición Founder | único `(conversion_terms_id, slot)` |
| Liquidación | único `(promoter_id, period_key)` |
| Pago | único `idempotency_key` |
| Entrega de notificación | único `(outbox_event_id, channel)` |

Reintento de la misma obligación mensual usa la misma `platform_obligations.id`. Un cobro fallido no inserta otra obligación.

## 7. Carreras

- Dos demos simultáneas: transacción con advisory lock por teléfono normalizado antes de buscar duplicados.
- Dos confirmaciones de atribución: unique parcial de una atribución `confirmed` por oportunidad.
- Dos ganancias: la transición a `won` es un `UPDATE ... WHERE stage <> 'won'` que exige `won_business_id`.
- Fusión: las FK de contactos, interacciones y oportunidades se reasignan al sobreviviente. `opportunity_attributions` no se recalcula. La fusión queda en `commercial_merges` con los ids absorbidos.
- Dos cierres del mismo mes: el unique de liquidación. El segundo intento devuelve la fila existente.

## 8. Archivado

`archived_at` en leads y oportunidades inactivas. Las filas económicas no tienen DELETE otorgado a roles de aplicación. Privacidad anonimiza columnas personales marcadas y conserva ids económicos. Plazos legales: `BLK-PRIV-01`.

## 9. Observabilidad local

Cada RPC devuelve un código estable (`commercial_error_code`) además del mensaje. El outbox muerto se lista en el backoffice de superadmin. No se exige APM externo en V1.

## 10. Qué queda fuera a propósito

WhatsApp automático, push comercial, transferencia bancaria automática, ARCA, editor de roles, constructor de programas, IA, CRM externo. Las columnas `external_ref` y `program_id` versionado dejan el lugar sin implementar esos productos.

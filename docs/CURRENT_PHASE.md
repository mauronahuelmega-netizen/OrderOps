# OrderOps: Estado de Desarrollo y Fase Actual (6 de Junio)

## Registro — PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-COMPACT-1 (2026-07-18)

**Fase:** PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-COMPACT-1 — Compact Plus Suggestions UI  
**Estado:** PASS  
**Resultado:** La pestaña Plus sugeridos fue compactada: las ventas sugeridas ahora se muestran como cards resumidas, la edición ocurre en modales y los productos sugeridos se gestionan en un modal dedicado sin tocar la lógica operativa.

- Components: `plus-suggestions/*` · wired en `owner-customization-builder`
- Actions reutilizadas (create/update/toggle group + add/update/toggle item; ↑↓ vía update item)
- Doc: `docs/product-customization-plus-suggestions-compact-1-compact-plus-suggestions-ui.md`
- **Próxima:** cleanup legacy `upsell-groups-section` · monitor piloto

---

## Registro — PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-UX-SPEC-1 (2026-07-18)

**Fase:** PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-UX-SPEC-1 — Plus Suggestions Compact UX Specification  
**Estado:** PASS  
**Resultado:** Se definió la UX compacta para Plus sugeridos, reemplazando formularios inline extensos por cards resumidas, menús de acciones y modales de edición para ventas sugeridas y productos sugeridos, sin cambiar lógica operativa.

- Doc: `docs/product-customization-plus-suggestions-ux-spec-1-compact-plus-suggestions.md`
- Principio: lista = lectura; modal = edición / gestionar productos
- Actions existentes reutilizables; sin delete/remove; sin reorder RPC (↑↓ vía update item)
- Patrón alineado a Secciones reutilizables compact
- **Próxima:** PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-COMPACT-1

---

## Registro — PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-CLEANUP-1 (2026-07-18)

**Fase:** PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-CLEANUP-1 — Reusable Sections Legacy Cleanup  
**Estado:** PASS  
**Resultado:** Se eliminaron componentes legacy e imports/CSS obsoletos del flujo inline anterior de Secciones reutilizables. La UI compacta sigue funcionando y no se modificó lógica operativa.

- Eliminados: `create-group-form.tsx`, `customization-group-card.tsx`, `sortable-groups-list.tsx`
- CSS huérfano sections-only removido del module admin (compartido Plus/assignments conservado)
- Doc: `docs/product-customization-reusable-sections-cleanup-1-legacy-cleanup.md`
- Deploy: commit `5819460` → `origin/main` → https://orderops.vercel.app
- **Próxima:** PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-COMPACT-1 (tras UX-SPEC)

---

## Registro — PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-COMPACT-1 (2026-07-18)

**Fase:** PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-COMPACT-1 — Compact Reusable Sections UI  
**Estado:** PASS  
**Resultado:** La pestaña Secciones reutilizables fue compactada: las secciones ahora se muestran como cards resumidas, la edición ocurre en modales, las opciones se gestionan en un modal dedicado y se eliminaron los formularios inline extensos sin tocar la lógica operativa.

- Components: `reusable-sections/*` · wired en `owner-customization-builder`
- Actions reutilizadas (create/update/toggle/reorder)
- Doc: `docs/product-customization-reusable-sections-compact-1-compact-reusable-sections-ui.md`
- Deploy: commit `a124459` → `origin/main` → https://orderops.vercel.app
- **Próxima:** cleanup legacy forms · opcional compact Plus tab

---

## Registro — PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-UX-SPEC-1 (2026-07-18)

**Fase:** PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-UX-SPEC-1 — Reusable Sections Compact UX Specification  
**Estado:** PASS  
**Resultado:** Se definió la UX compacta para Secciones reutilizables, reemplazando formularios inline extensos por cards resumidas, menús de acciones y modales de edición para secciones y opciones, sin cambiar lógica operativa.

- Doc: `docs/product-customization-reusable-sections-ux-spec-1-compact-reusable-sections.md`
- Principio: lista = lectura/orden; modal = edición
- Actions existentes reutilizables; sin delete/duplicate en V1
- **Próxima:** PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-COMPACT-1

---

## Registro — PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-OVERRIDES-1 (2026-07-18)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-OVERRIDES-1 — Admin Preview Product Overrides Fidelity  
**Estado:** PASS WITH DATA QA DEBT  
**Resultado:** La preview sandbox de `/admin/products/customizations` ahora refleja overrides/excepciones del producto seleccionado. Los grupos u opciones ocultos por override no aparecen en la vista previa, los grupos propios se mantienen y la selección local se limpia cuando cambian las opciones efectivas.

- Loader: `getCustomizationOverridesForAdmin` en corpus admin
- Mapper: `resolveAdminEffectivePreviewConfig` / overrides filter alineado a público
- Sandbox: prune de selection ids invisibles
- Piloto sin overrides `is_enabled=false` → browser hide N/A (in-memory rules OK)
- Doc: `docs/product-customization-admin-preview-overrides-1-preview-overrides-fidelity.md`
- Deploy: commit `dee486a` → `origin/main` → https://orderops.vercel.app
- **Próxima:** QA opcional con override disable real autorizado · monitor piloto

---

## Registro — PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-CLEANUP-1 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-CLEANUP-1 — Admin Preview Dead Code & Wiring Cleanup  
**Estado:** PASS  
**Resultado:** Se eliminó la preview placeholder anterior y se limpió wiring/imports/CSS obsoleto relacionado. La preview sandbox interactiva sigue funcionando y el modal público conserva su comportamiento.

- Eliminado: `customer-preview-panel.tsx` (0 imports)
- CSS huérfano del placeholder removido del module admin
- Sandbox `AdminCustomizationLivePreview` + modal público smoke OK
- Doc: `docs/product-customization-admin-preview-cleanup-1-dead-code-wiring-cleanup.md`
- Deploy: commit `34b0b55` → `origin/main` → https://orderops.vercel.app
- **Próxima:** opcional overrides en mapper admin · monitor piloto

---

## Registro — PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-POLISH-1 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-POLISH-1 — Interactive Admin Preview Sandbox  
**Estado:** PASS  
**Resultado:** La preview admin de Product Customization ahora es interactiva y sandbox. Permite probar selección single/multi, plus/adicionales y total estimado reutilizando componentes presentacionales del modal público, sin agregar al carrito, sin localStorage, sin checkout y sin writes.

- Shared: option-group/row · upsell · price-summary · \`preview-selection.ts\`
- Admin: \`admin-customization-live-preview.tsx\` + \`admin-preview-mapper.ts\`
- Público: modal refactorizado sin cambio de comportamiento (smoke Papas/Salsas/Plus OK)
- Doc: \`docs/product-customization-admin-preview-polish-1-interactive-preview-sandbox.md\`
- **Próxima:** opcional overrides en mapper · cleanup CustomerPreviewPanel

---

## Registro — PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-SPEC-1 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-SPEC-1 — Interactive Admin Preview Architecture Spec  
**Estado:** PASS  
**Resultado:** Se auditó el modal público y la preview admin actual. Se definió una arquitectura segura para una preview interactiva en modo sandbox, reutilizando componentes presentacionales sin arrastrar carrito, checkout, localStorage ni side effects.

- Veredicto: **no** importar `CustomizationModal` completo
- Recomendación: extraer presentacionales shared + estado local sandbox + mapper admin→`PublicProductCustomizationConfig`
- Reutilizar: `validateCustomizationSelection`, `computeVisualCustomizationTotal`, `upsell-copy`
- Doc: `docs/product-customization-admin-preview-spec-1-interactive-admin-preview-architecture.md`
- **Próxima:** PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-POLISH-1 (implementación)

---

## Registro — PRODUCT-CUSTOMIZATION-ADMIN-BUTTON-THEME-POLISH-1 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-BUTTON-THEME-POLISH-1 — Admin Customizations Button Theme Polish  
**Estado:** PASS  
**Resultado:** Los botones y controles interactivos de `/admin/products/customizations` quedaron alineados con los tokens de theme del admin. Dark/light se ven consistentes, los disabled states son claros y la pantalla conserva la lógica operativa intacta.

- Primary: accent (`--accent-primary`) en lugar de ink `text-primary` (evita blanco crudo en dark)
- Secondary / DnD tokenizados · overrides scoped bajo `.builderShell` para `admin-primary-button`
- Sin layout/DB/RLS/actions · tsc/build PASS
- Doc: `docs/product-customization-admin-button-theme-polish-1-button-theme-polish.md`
- **Próxima:** opcional primary global admin-wide · monitor piloto

---

## Registro — PRODUCT-CUSTOMIZATION-ADMIN-VISUAL-POLISH-1 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-VISUAL-POLISH-1 — Admin Customizations Layout & Theme Polish  
**Estado:** PASS  
**Resultado:** La pantalla `/admin/products/customizations` quedó alineada visualmente con el resto del admin. Usa mejor el ancho disponible, elimina estilos legacy/hardcoded relevantes y mantiene compatibilidad dark/light sin tocar lógica operativa.

- Shell: `AdminPageLayout size="operational"` + header operational (mismo ancho efectivo que Products / 1600px)
- CSS module: grid 3-col ≥1200px · tabs strip · surfaces tokenizadas · selected con accent
- Sin DB/RLS/actions/checkout/stock · tsc/build PASS
- Doc: `docs/product-customization-admin-visual-polish-1-layout-theme-polish.md`
- **Próxima:** monitor piloto · opcional preview más fiel al modal público

---

## Registro — PRODUCT-CUSTOMIZATION-FLAG-OFF-RLS-FIXTURE-QA-1 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-FLAG-OFF-RLS-FIXTURE-QA-1 — Flag OFF Corpus Fixture Negative QA  
**Estado:** PASS  
**Resultado:** Se creó un fixture no piloto con Product Customization flag OFF y corpus real. La lectura privilegiada confirma que existen filas, pero anon no puede leerlas por RLS. El piloto flag ON sigue funcionando y business_settings permanece cerrado para anon.

- Fixture: `qa-rls-flag-off-customization` / `59db34de-…` · flag OFF · corpus 1/1/1/1/1 + override
- Anon fixture corpus **0** · piloto groups=3 options=11 upsell=1 · Plus UI OK · KEEP fixture
- Doc: `docs/product-customization-flag-off-rls-fixture-qa-1-flag-off-corpus-fixture-negative-qa.md`
- **Próxima:** reusar fixture en regresiones · monitor piloto

---

## Registro — PRODUCT-CUSTOMIZATION-FLAG-OFF-RLS-QA-1 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-FLAG-OFF-RLS-QA-1 — Flag OFF Public RLS Negative QA  
**Estado:** PASS WITH FIXTURE DEBT  
**Resultado:** El helper y business_settings cerrado fueron validados, y el control positivo del piloto ON pasó. No se encontró tenant flag OFF con corpus real para probar negación completa; queda deuda de fixture.

- Helper false: `roticeriajuan` / `majopasteleria` (sin settings) · piloto helper true · anon settings=0
- Piloto Plus UI OK · browser flag-OFF N/A (404) · sin writes
- Doc: `docs/product-customization-flag-off-rls-qa-1-flag-off-public-rls-negative-qa.md`
- **Próxima:** fixture flag-OFF con corpus (auth) · o monitor piloto

---

## Registro — PRODUCT-CUSTOMIZATION-PILOT-MONITOR-2 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-PILOT-MONITOR-2 — Plus UI + Stock + Public RLS Live Monitoring  
**Estado:** PASS  
**Resultado:** El piloto live se mantiene estable luego de Plus UI, copy polish, inventario tracked y public RLS hardening. Catálogo, modal, carrito, checkout, dashboard, stock Coca, ledger y corpus anon fueron validados sin writes.

- Flags ON · sesión abierta · Coca stock **4** · anon corpus OK · `business_settings` count=0
- Modal “Sumá una bebida” + Coca · carrito/checkout “Adicional” · Pendientes QA=0
- Doc: `docs/product-customization-pilot-monitor-2-plus-ui-stock-public-rls-live-monitoring.md`
- **Próxima:** monitor operación real · opcional reconciliación `#9632` (auth) · opcional flag-OFF test

---

## Registro — PRODUCT-CUSTOMIZATION-PUBLIC-RLS-HARDENING-1 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-PUBLIC-RLS-HARDENING-1 — Public Customization Corpus RLS Hardening  
**Estado:** PASS  
**Resultado:** El corpus público de Product Customization / Plus UI dejó de depender del service role directo. RLS pública ahora usa un helper SECURITY DEFINER que expone solo el booleano del flag y permite leer customizations/upsells disponibles cuando Product Customization está activo.

- Helper: `public.is_public_product_customization_enabled(uuid)` · policies public SELECT actualizadas
- Código: `loadPublicCustomizationCorpus` → `createSupabaseServerClient()` (sin service role en corpus)
- Apply prod OK · anon REST: groups=3 options=11 upsell Bebidas/Coca · `business_settings` count=0
- Doc: `docs/product-customization-public-rls-hardening-1-public-corpus-rls-hardening.md`
- **Próxima:** monitor piloto · opcional test flag-OFF · opcional flag gate vía RPC

---

## Registro — PRODUCT-CUSTOMIZATION-PLUS-COPY-POLISH-1 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-PLUS-COPY-POLISH-1 — Customer-facing Plus Copy Alignment  
**Estado:** PASS  
**Resultado:** El copy público de Plus Bebidas quedó alineado para clientes. La sección del modal comunica la venta sugerida como una bebida adicional al pedido, manteniendo intacta la lógica de parent+upsell, checkout, stock y restock.

- Helper: `lib/product-customization/upsell-copy.ts` · modal “Sumá una bebida” · carrito/checkout “Adicional”
- Sin pedido QA · sin DB/RPC/stock
- Doc: `docs/product-customization-plus-copy-polish-1-customer-facing-plus-copy-alignment.md`
- **Próxima:** opcional RLS public hardening · monitor piloto

---

## Registro — PRODUCT-CUSTOMIZATION-PLUS-UI-DEPLOY-1 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-PLUS-UI-DEPLOY-1 — Deploy Plus Suggestions UI  
**Estado:** PASS  
**Resultado:** Plus Bebidas quedó desplegado y validado en la UI pública productiva. El cliente puede agregar Coca Cola 500ml como plus dentro del modal de Doble Smash; checkout, dashboard, decremento de stock, ledger y restock al cancelar funcionan end-to-end.

- Deploy: `a284a23` Plus UI + `d1b8e7f` service-role public corpus (fix RLS/anon gap) → `https://orderops.vercel.app`
- Smoke: Doble Smash modal · Papas/Salsas/Agregados · plus Coca · carrito parent+plus
- QA: `#76D4` `8508feb5-…` Coca **4→3** `order_decrement` upsell · cancel UI **3→4** `order_restock` · idempotencia OK
- Doc: `docs/product-customization-plus-ui-deploy-1-deploy-plus-suggestions-ui.md`
- **Próxima:** opcional hardening RLS public/`business_settings` · copy Plus · monitor piloto

---

## Registro — PRODUCT-STOCK-QA-ORDER-CLEANUP-1 (2026-07-17)

**PRODUCT-STOCK-QA-ORDER-CLEANUP-1 — Controlled QA Orders Cleanup** → **PASS WITH DEBT**.

- Cancel UI: `#9632` + `#9B25` pending→cancelled · 0 deletes · Coca stock **4**
- `#9632` sin `order_restock` (pre-ledger, correcto) · deuda histórica 1 Coca documentada
- Dashboard: Pendientes vacíos · QA en Cancelados
- Doc: `docs/product-stock-qa-order-cleanup-1-controlled-qa-orders-cleanup.md`
- **Próxima:** opcional reconciliación manual pre-ledger (auth) · deploy WIP customization

---

## Registro — PRODUCT-STOCK-RESTOCK-ACTION-DEPLOY-SMOKE-1 (2026-07-17)

**PRODUCT-STOCK-RESTOCK-ACTION-DEPLOY-SMOKE-1 — Deploy Status Action Wiring & UI Cancel Smoke** → **PASS**.

- Deploy: commit `b0bfddb` → `origin/main` → Vercel `https://orderops.vercel.app`
- UI create: `#754A` `21064f2b-…` Coca tracked · stock **4→3** + `order_decrement`
- UI cancel admin: pending→cancelled · Coca **3→4** + `order_restock` (`source=transition_order_status`)
- Idempotencia UI: “No hubo cambios” · restock count=1 · timeline `status_changed` OK
- Doc: `docs/product-stock-restock-action-deploy-smoke-1-deploy-status-action-wiring-ui-cancel-smoke.md`
- **Próxima:** deploy WIP customization (Plus UI) · cleanup QA `#9632` opcional

---

## Registro — PRODUCT-STOCK-RESTOCK-CANCEL-1 (2026-07-17)

**PRODUCT-STOCK-RESTOCK-CANCEL-1 — Idempotent Cancel Restock via stock_movements** → **PASS WITH DEBT**.

- RPC `transition_order_status` restockea solo con `order_decrement` previo (TX + idempotente)
- `updateOrderStatusAction` llama al RPC (código local); **deploy Vercel pendiente** (deuda)
- QA: `#8B9A` `4ef1169a-…` pending→cancelled · Coca **3→4** · `order_restock` +1
- Idempotencia: re-cancel no-op · legacy `#503E` cancel sin movements · `#9632`/`#8C2F` sin restock
- Migration: `20260717140000_product_stock_restock_cancel_1.sql` · apply prod OK
- Doc: `docs/product-stock-restock-cancel-1-idempotent-cancel-restock-stock-movements.md`
- **Próxima:** deploy action wiring → smoke UI cancel · opcional cleanup `#9632`

---

## Registro — PRODUCT-STOCK-DECREMENT-LEDGER-1 (2026-07-17)

**PRODUCT-STOCK-DECREMENT-LEDGER-1 — Record Order Decrement Movements in create_order** → **PASS**.

- `create_order` inserta `stock_movements.order_decrement` por order_item tracked (misma TX)
- QA: `4ef1169a-…` Doble Smash + Coca · Coca **4→3** · movement before=4 after=3 delta=-1
- Legacy `c9721e63-…` Clásica · 0 movements · #9632 sin backfill
- Migration: `20260717130000_product_stock_decrement_ledger_1.sql`
- Doc: `docs/product-stock-decrement-ledger-1-record-order-decrement-movements-create-order.md`
- **Próxima:** PRODUCT-STOCK-RESTOCK-CANCEL-1

---

## Registro — PRODUCT-STOCK-MOVEMENTS-SCHEMA-1 (2026-07-16)

**PRODUCT-STOCK-MOVEMENTS-SCHEMA-1 — Stock Movements Ledger & Idempotency Schema** → **PASS**.

- Tabla `public.stock_movements` + constraints (tipo, signo, math, nonneg, order context)
- Unique parciales: un `order_decrement` / un `order_restock` por `order_item_id`
- RLS SELECT tenant + super_admin; sin writes client
- Apply prod vía `apply_migration` · tabla vacía · Coca stock=4 intacto
- Types: `types/database.ts`
- Doc: `docs/product-stock-movements-schema-1-stock-movements-ledger-idempotency-schema.md`
- **Próxima:** PRODUCT-STOCK-DECREMENT-LEDGER-1

---

## Registro — PRODUCT-STOCK-RESTOCK-DESIGN-1 (2026-07-16)

**PRODUCT-STOCK-RESTOCK-DESIGN-1 — Cancel Restock Contract & Idempotency** → **PASS**.

- Cancel debe restockear solo stock previamente descontado (`track_stock` + evidencia ledger)
- Transiciones V1: pending/preparing/ready → cancelled; **no** completed→cancelled automático
- Recomendación: `stock_movements` con unique `(order_item_id, movement_type)` antes de tocar cancel
- Históricos (#8C2F) y QA pending (#9632 / legacy) sin restock retroactivo en esta fase
- `updateOrderStatusAction` auditado: solo status + event; sin stock hoy
- Doc: `docs/product-stock-restock-design-1-cancel-restock-contract-idempotency.md`
- **Próxima:** PRODUCT-STOCK-MOVEMENTS-SCHEMA-1 → DECREMENT-LEDGER-1 → RESTOCK-CANCEL-1

---

## Registro — PRODUCT-STOCK-DECREMENT-ORDER-1 (2026-07-16)

**PRODUCT-STOCK-DECREMENT-ORDER-1 — Transactional Stock Consumption in create_order** → **PASS**.

- `create_order` valida/descuenta stock solo si `track_stock=true` (FOR UPDATE + demanda agregada product/upsell)
- Legacy `track_stock=false` intacto (Clásica stock=0 vendible, sin descuento)
- QA tracked: order `f34118c6-…` Doble Smash + Coca upsell · Coca **5→4** · total 15500
- QA insufficient: qty 99 → `INSUFFICIENT_STOCK`, sin order, Coca sigue 4
- Migration: `20260717010500_product_stock_decrement_order_1.sql` · error map checkout/admin
- Restock cancel **fuera de scope**
- Doc: `docs/product-stock-decrement-order-1-transactional-stock-consumption-create-order.md`
- **Próxima:** PRODUCT-STOCK-RESTOCK-CANCEL-1 / STOCK-MOVEMENTS

---

## Registro — PRODUCT-STOCK-ADMIN-UX-1 (2026-07-16)

**PRODUCT-STOCK-ADMIN-UX-1 — Stock Tracking Controls in Product Admin** → **PASS**.

- Create/edit product: switch **Controlar stock automáticamente** → `products.track_stock`
- Actions create/update persisten boolean; default false; Disponible/stock intactos
- QA: Coca Cola 500ml → `track_stock=true` (stock 5 / available / price 3000 sin cambio)
- Legacy intacto: `create_order` sin tocar; sin decremento runtime
- Doc: `docs/product-stock-admin-ux-1-stock-tracking-controls-product-admin.md`
- **Próxima:** PRODUCT-STOCK-DECREMENT-ORDER-1

---

## Registro — PRODUCT-STOCK-TRACKING-SCHEMA-1 (2026-07-16)

**PRODUCT-STOCK-TRACKING-SCHEMA-1 — Add Product Stock Tracking Flag** → **PASS**.

- Columna `products.track_stock boolean NOT NULL DEFAULT false`
- Migration: `20260716224005_product_stock_tracking_schema_1.sql` · aplicada en prod
- 17 productos existentes con `track_stock=false` · legacy intacto
- Tipos: `types/database.ts` actualizado · create_order/UI sin cambios
- Doc: `docs/product-stock-tracking-schema-1-add-product-track-stock-flag.md`
- **Próxima:** PRODUCT-STOCK-ADMIN-UX-1

---

## Registro — PRODUCT-STOCK-DECREMENT-DESIGN-1 (2026-07-16)

**PRODUCT-STOCK-DECREMENT-DESIGN-1 — Inventory Consumption Contract** → **PASS**.

- Contrato híbrido: `track_stock` default **false**
- Tracking ON → validar + descontar en `create_order` (product + upsell), FOR UPDATE
- Restock en cancel → fase posterior (ledger/idempotencia)
- Legacy `stock=0`+available intacto; opciones/customizations no inventarian en V1
- Doc: `docs/product-stock-decrement-design-1-inventory-consumption-contract.md`
- **Próxima:** PRODUCT-STOCK-TRACKING-SCHEMA-1

---

## Registro — PRODUCT-STOCK-DECREMENT-AUDIT-1 (2026-07-16)

**PRODUCT-STOCK-DECREMENT-AUDIT-1 — Order Stock Consumption For Product/Upsell Items** → **PASS WITH DEBT**.

- Read-only: `create_order` **no** toca `products.stock` (ni parent ni upsell); solo valida `is_available`
- Trigger `tr_auto_suspend_out_of_stock` solo en INSERT/UPDATE OF stock → availability
- Cancelación (`updateOrderStatusAction`) no restaura stock
- Evidencia `#8C2F` / Coca Cola: stock 5→5; catálogo vive con stock=0 + available=true
- Hipótesis: **H1** (stock = control manual de disponibilidad)
- Doc: `docs/product-stock-decrement-audit-1-order-stock-consumption-product-upsell-items.md`
- **Próxima:** PRODUCT-STOCK-DECREMENT-DESIGN-1 (política + create_order)

---

## Registro — Product Customization QA-ORDER-CLEANUP-1 (2026-07-16)

**PRODUCT-CUSTOMIZATION-QA-ORDER-CLEANUP-1 — Cancel QA Orders Safely** → **PASS WITH DEBT**.

- Pedido `#8C2F` (`30c1b498-…`) cancelado vía UI admin (`updateOrderStatusAction` → `cancelled`)
- Items/snapshot/upsell intactos · total `$15750` · Pendientes limpio · lane Cancelados
- Flags/sesión intactos · stock Coca Cola sin cambio (sigue 5)
- Doc: `docs/product-customization-qa-order-cleanup-1-cancel-qa-orders-safely.md`

---

## Registro — Product Customization PLUS-BEBIDAS-QA-1 Retry (2026-07-16)

**PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-QA-1 — Retry / Real Order Snapshot & Dashboard Validation** → **PASS WITH DEBT**.

- Pedido UI: `#8C2F` (`30c1b498-…`) QA Plus Bebidas Retry · `$15750` · pending · pickup
- Parent Doble Smash `item_kind=product` + snapshot v1 (Papas chicas + Salsa Big Mac)
- Child Coca Cola `item_kind=upsell` + `parent_order_item_id` correcto · `$3000`
- Total SQL coincide · dashboard detalle sin JSON raw
- Deuda: stock Coca Cola no decrementa (sigue 5) · pedido QA queda pending
- Doc: `docs/product-customization-plus-bebidas-qa-1-retry-real-order-snapshot-dashboard-validation.md`

---

## Registro — Product Customization PLUS-BEBIDAS-AVAILABILITY-1 (2026-07-16)

**PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-AVAILABILITY-1 — Reactivate Beverage Product for Upsell QA** → **PASS WITH DEBT**.

- Audit: `products.stock` + trigger `tr_auto_suspend_out_of_stock` (`stock<=0` → `is_available=false`)
- Al auditar, Coca Cola ya estaba `is_available=true` / `stock=5` (reactivada entre QA-1 y esta fase) → **sin write SQL**
- Browser: Plus “También podés sumar” + Coca Cola · cart V2 padre+bebida · checkout pre-submit PASS
- Pedido QA **no creado**
- Doc: `docs/product-customization-plus-bebidas-availability-1-reactivate-beverage-product-for-upsell-qa.md`
- **Próxima:** PLUS-BEBIDAS-QA-1 Retry (pedido real)

---

## Registro — Product Customization PLUS-BEBIDAS-QA-1 (2026-07-16)

**PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-QA-1 — Real Order Snapshot & Dashboard Validation** → **BLOCKED**.

- Auth de crear pedido presente, pero **Coca Cola 500ml** está `is_available=false`
- Public Plus filtra productos disponibles → modal sin “También podés sumar”
- **No se creó pedido** (no se reactivó producto: fuera de scope)
- Live: customization/on_demand/session intactos
- Doc: `docs/product-customization-plus-bebidas-qa-1-real-order-snapshot-dashboard-validation.md`
- **Próxima:** reactivar Coca Cola (auth) + retry QA order

---

## Registro — PRODUCT-IMAGE-RANDOMUUID-HOTFIX-1 (2026-07-16)

**PRODUCT-IMAGE-RANDOMUUID-HOTFIX-1 — Client-Safe Image Upload ID Fallback** → **PASS WITH DEBT**.

- Crash `crypto.randomUUID is not a function` en crop/upload (LAN/HTTP) corregido
- Helper: `lib/client/safe-random-id.ts` → usado en create/edit product + public assets
- CLI: `tsc`/`build` PASS · smoke helper fallback PASS · QA LAN física pendiente
- Doc: `docs/product-image-randomuuid-hotfix-1-client-safe-image-upload-id-fallback.md`

---

## Registro — Product Customization PLUS-BEBIDAS-2 (2026-07-16)

**PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-2 — Create Beverage Products & Enable Upsell** → **PASS WITH DEBT**.

- Tenant: `demohamburgueseria` — customization **sigue live**
- Writes: categoría **Bebidas** · producto **Coca Cola 500ml** `$3000` · upsell item en grupo Bebidas (target Doble Smash)
- Browser: modal Plus · cart V2 padre+bebida · checkout pre-submit PASS
- Deuda: más bebidas · upsell solo Doble Smash · sin pedido QA
- Doc: `docs/product-customization-plus-bebidas-2-create-beverage-products-enable-upsell.md`
- **Próxima:** QA order plus / ampliar targets / assignments / ADMIN-UX-2

---

## Registro — Product Customization PLUS-BEBIDAS-1 (2026-07-16)

**PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-1 — Real Beverage Upsell Setup** → **BLOCKED**.

- Tenant: `demohamburgueseria` — customization **sigue live**
- Hallazgo: upsell group **Bebidas** existe (`3ef90826-…`, target Doble Smash) pero `upsell_group_items` vacío
- Bloqueo: **0 productos bebida** en `products` (Coca Cola histórica eliminada; order_items con `product_id=null`)
- Sin `AUTORIZO_CREATE_BEVERAGE_PRODUCTS` → no writes
- Browser: modal OK sin sección Plus; dashboard históricos OK
- Doc: `docs/product-customization-plus-bebidas-1-real-beverage-upsell-setup.md`
- **Próxima:** crear productos bebida + poblar items (retry/PLUS-BEBIDAS-2)

---

## Registro — Product Customization GROUP-DESCRIPTIONS-1 (2026-07-16)

**PRODUCT-CUSTOMIZATION-GROUP-DESCRIPTIONS-1 — Customer-Facing Group Description Polish** → **PASS WITH DEBT**.

- Tenant: `demohamburgueseria` — customization **sigue live**
- Writes: descriptions Papas / Salsas / Agregados extra alineadas al copy comercial
- Browser: modal muestra descriptions nuevas; cart/checkout usan nombres de grupo; históricos (`#7D0A`) intactos
- Deuda: Plus Bebidas vacío · assignments limitados · sin pedido QA nuevo
- Doc: `docs/product-customization-group-descriptions-1-customer-facing-descriptions.md`
- **Próxima:** poblar Plus / expandir assignments / ADMIN-UX-2 / OPTION-IMAGES-1

---

## Registro — Product Customization GROUP-NAMING-1 (2026-07-16)

**PRODUCT-CUSTOMIZATION-GROUP-NAMING-1 — Customer-Facing Group Naming Polish** → **PASS WITH DEBT**.

- Tenant: `demohamburgueseria` — customization **sigue live**
- Writes: `Aderezos`→**Salsas** · `Extras`→**Agregados extra** · Papas sin cambios
- Browser: modal/cart/checkout muestran nombres nuevos; históricos (`#7D0A`) conservan snapshot viejo
- Deuda: descriptions de grupo aún “aderezos/extras” · Plus Bebidas vacío · assignments limitados
- Doc: `docs/product-customization-group-naming-1-customer-facing-group-names.md`
- **Próxima:** descriptions polish / poblar Plus / expandir assignments / ADMIN-UX-2

---

## Registro — Product Customization REAL-CONFIG-POLISH-1 (2026-07-16)

**PRODUCT-CUSTOMIZATION-REAL-CONFIG-POLISH-1 — Owner Config Copy & Commercial Cleanup** → **PASS WITH DEBT**.

- Tenant: `demohamburgueseria` — customization **sigue live**
- Writes: `Chedar`→**Cheddar** · `Big Mac`→**Salsa Big Mac** · hero/public copy sin “QA”
- No renombres de grupos / precios / upsell / pedido nuevo
- Browser: catálogo/modal/cart/checkout pre-submit PASS con nombres nuevos
- Dashboard: históricos (`#7D0A`) conservan snapshot viejo (esperado)
- Deuda: Plus Bebidas sin items · Aderezos/Extras naming opcional · assignments limitados · imágenes
- Doc: `docs/product-customization-real-config-polish-1-owner-config-copy-commercial-cleanup.md`
- **Próxima:** poblar Plus / decidir group naming / expandir assignments / ADMIN-UX-2

---

## Registro — Product Customization PILOT-MONITOR-1 (2026-07-15)

**PRODUCT-CUSTOMIZATION-PILOT-MONITOR-1 — Live Pilot Monitoring & Real Config Readiness** → **PASS WITH DEBT**.

- Tenant: `demohamburgueseria`
- Estado live: `product_customization_enabled=true` · store session **open** · `on_demand_mode_active=true`
- Config activa: **Papas / Aderezos / Extras** (demo/comercial inicial; stamp QA ADMIN-2 ausente)
- Pedidos: `#213F` SQL PASS · `#7D0A` real Doble Smash snapshot v1 PASS · sin inconsistencias 48h
- Browser: catálogo/modal/cart V2/checkout pre-submit/dashboard PASS
- Deuda: copy (`Chedar`, `Big Mac`), hero público “QA”, sin upsell Plus, assignments solo 2 productos
- Sin writes / sin rollback / sin código
- Doc: `docs/product-customization-pilot-monitor-1-live-pilot-monitoring-real-config-readiness.md`
- **Próxima:** owner polish copy/config → opcional ADMIN-UX-2 / OPTION-IMAGES-1

---

## Registro — Product Customization ROLLOUT-PILOT-1 Modo C Retry 2 (2026-07-14 / 2026-07-15 UTC)

**PRODUCT-CUSTOMIZATION-ROLLOUT-PILOT-1 — Modo C Live Activation Retry 2** → **PASS WITH DEBT — PILOT LIVE**.

- Tenant: `demohamburgueseria`
- Flag final: `product_customization_enabled=true` (activación `2026-07-14 23:00:16 UTC`)
- Gate operativo: store session **open** + `on_demand_mode_active=true`
- Config final: QA customization **active** (autorización leave-on)
- Pedido QA live retry 2: `#213F` / `d5573074-8c14-4fa1-af5f-6e3a2209213f` — BBQ+Plus+Coca `$16.750`
- SQL parent snapshot v1 + upsell child `parent_order_item_id`: **PASS**
- Dashboard summary + badge Plus: **PASS**
- Rollback SQL: documentado, **no ejecutado**
- Deuda menor: sticky cart CTA en automation (navegación directa a `/checkout`); dedup cart no smokeado
- Doc: `docs/product-customization-rollout-pilot-1-controlled-tenant-rollout.md`
- **Próxima:** monitoreo piloto / config real owner / ADMIN-UX-2 polish

---

## Registro — LIVE-OPS-GATE-1 (2026-07-14)

**LIVE-OPS-GATE-1 — Store Session / On-Demand Acceptance Reconciliation** → **PASS**.

- Reconciliación: open/close admin deja `store_sessions` y `on_demand_mode_active` alineados (SQL smoke PASS).
- Gate público + `create_order`: pedido legacy UI `1ef8a30a-…` (QA Live Ops Gate) **PASS** — sin rechazo por negocio cerrado.
- Product Customization **no** modificado; flag off.
- Estado recomendado para Modo C Retry 2:
  - session **open** (`a01252b0-…`)
  - `on_demand_mode_active=true`
  - `product_customization_enabled=false`
  - QA customization soft-disabled
- Doc: `docs/live-ops-gate-1-store-session-on-demand-reconciliation.md`
- **Cerrado por:** Modo C Live Activation Retry 2 → **PASS WITH DEBT — PILOT LIVE**

---

## Registro — Product Customization ROLLOUT-PILOT-1 (2026-07-14)

**PRODUCT-CUSTOMIZATION-ROLLOUT-PILOT-1 — Modo C Live Activation Retry** → **ROLLBACK EXECUTED**.

- Tenant: `demohamburgueseria`
- Flag final: **false** (rollback `16:08:29 UTC`; activación previa `15:21:41 UTC`)
- Config final: QA soft-disabled
- Causa: checkout submit rechazado — UI/sesión `open` pero RPC `create_order` exige `on_demand_mode_active=true` (columna seguía **false**; desync ops)
- Catálogo/modal/cart V2 flag-on: PASS ($16.750 BBQ+Plus+Coca); pedido live retry: **no creado**
- Modo A: PASS READINESS · Modo B: PASS WITH FLAG OFF (`#8C9E`) · Modo C #1: ROLLBACK EXECUTED
- Doc: `docs/product-customization-rollout-pilot-1-controlled-tenant-rollout.md`
- **Próxima:** abrir sesión vía admin (sync on-demand) → verificar **ambos** gates → re-intentar Modo C leave-ON

---

## Registro — Product Customization CHECKOUT-UI-SMOKE-1 (2026-07-14)

**PRODUCT-CUSTOMIZATION-CHECKOUT-UI-SMOKE-1** → **PASS WITH DEBT**.

- Primer pedido V2 desde **checkout UI real** (no RPC): `#5C7C` / `3b9f87a2-…`
- Flujo validado: catálogo → modal → cart V2 → checkout → server action → `create_order` → SQL snapshot/upsell child → dashboard
- SQL: parent snapshot v1 `unit_price=13750` + upsell Coca Cola `parent_order_item_id` OK
- Cleanup: flag **false**; datos QA soft-disabled
- Deuda menor: dedup cart / config distinta no probados; automatización browser frágil
- Doc: `docs/product-customization-checkout-ui-smoke-1-browser-checkout-validation.md`
- **Deudas P1 D1/D2 cerradas.** V1 listo para rollout pilot controlado.
- **Próxima recomendada:** rollout pilot por tenant **o** ADMIN-UX-2 (polish)

---

## Registro — Product Customization ADMIN-UX-1 (2026-07-14)

**PRODUCT-CUSTOMIZATION-ADMIN-UX-1** → **PASS WITH DEBT**.

- Shell owner-friendly en `/admin/products/customizations`: tabs Por producto (default) / Por categoría / Secciones reutilizables / Plus sugeridos
- Layout product-first 3 zonas + preview placeholder; copy de negocio; actions/DnD intactos
- Sin DB/RPC/cart/checkout/catálogo/dashboard; flag no activado
- Doc: `docs/product-customization-admin-ux-1-owner-friendly-builder-shell.md`
- Deuda: preview orientativo (sin overrides), formularios internos densos, mobile polish
- **Próxima recomendada:** `PRODUCT-CUSTOMIZATION-ADMIN-UX-2` (polish forms/preview) o rollout pilot V1

---

## Registro — Product Customization ADMIN-UX-SPEC-1 (2026-07-14)

**PRODUCT-CUSTOMIZATION-ADMIN-UX-SPEC-1** → **PASS**.

- Spec owner-friendly para `/admin/products/customizations` (product-first, lenguaje de negocio, preview, venta sugerida)
- Sin implementación UI/código/DB; capa UX sobre modelo V1 existente
- Doc: `docs/product-customization-admin-ux-spec-1-owner-friendly-builder.md`
- **Implementada parcialmente por:** `PRODUCT-CUSTOMIZATION-ADMIN-UX-1`
- V1 funcional PASS WITH DEBT (flag off; CHECKOUT-UI-SMOKE-1 cerró D1/D2)

---

## Módulo — Product Customization V1 (2026-07-14)

**PRODUCT-CUSTOMIZATION-V1-HANDOFF-1** → **PASS WITH DEBT** (V1 cerrado).

- Handoff: `docs/product-customization-v1-final-handoff.md`
- Flag `demohamburgueseria`: **off** (default fail-closed)
- Evidencia runtime: pedido V2 `#8E6F` / `d3e5c903-…` (SQL + dashboard)
- Deudas P1 D1/D2: **cerradas** por CHECKOUT-UI-SMOKE-1 (pedido `#5C7C` desde UI)
- Deuda menor: dedup cart / browser automation polish
- **No hay fase funcional activa** hasta rollout pilot o roadmap V1.1
- Próxima recomendada: **rollout pilot controlado** por tenant

---

## Registro — Product Customization E2E-QA-1 (2026-07-14)

**PRODUCT-CUSTOMIZATION-E2E-QA-1** → **PASS WITH DEBT**.

- Flag-on temporal + datos QA reactivados; pedido V2 real `d3e5c903-…` (#8E6F)
- SQL: parent snapshot v1 `unit_price=13750` + upsell child Coca Cola con `parent_order_item_id`
- Dashboard: summary + Plus indentado; legacy `#2C00` intacto
- Cleanup: flag **false**; QA data soft-disabled
- Deuda: browser catálogo→checkout UI no cerrado (pedido vía RPC autorizado)
- Doc: `docs/product-customization-e2e-qa-1-flag-on-full-runtime-smoke.md`
- Próxima: opcional UI checkout smoke, o handoff V1 / roadmap V1.1

---

## Registro — Product Customization DASHBOARD-1 (2026-07-13)

**PRODUCT-CUSTOMIZATION-DASHBOARD-1** → **PASS WITH DEBT**.

- Parser/normalizer client-safe `order-dashboard.ts` (snapshot v1 + árbol parent/upsell)
- Panel Productos: summary debajo del parent; upsell indentado + badge Plus; orphan seguro
- Selects read-only incluyen `item_kind` / `parent_order_item_id` / `customization_snapshot`
- Legacy smoke: dashboard + workspace QA Legacy ORDER-1 se ven normales; sin JSON raw
- Flag sigue **off**; sin checkout/RPC/DB; `tsc` + `build` PASS
- Deuda: QA V2 real en dashboard pendiente (no hay pedido V2 persistido)
- Doc: `docs/product-customization-dashboard-1-render-snapshot-upsell-children.md`
- Próxima: cerrar ORDER-1 V2 assert **o** QA dashboard V2 cuando exista dato

---

## Registro — Product Customization ORDER-1-DB-APPLY-QA (2026-07-13)

**PRODUCT-CUSTOMIZATION-ORDER-1-DB-APPLY-QA** → **PASS WITH DEBT** (cleanup cerrado).

- RPC `create_order` ORDER-1 aplicada en `pkrsedmwxekbhlohhqds` (MCP directed; no mass `db push`)
- Markers post-apply OK; legacy order QA PASS
- Flag-on temporal + catálogo “Desde” + modal + cart V2 jerárquico PASS
- Cleanup `AUTORIZO_FLAG_OFF_CLEANUP=yes`: flag demo **false**; grupo/options/assignments/upsell QA soft-disabled
- Deuda restante: QA 4–5 pedido V2 persistido + SQL assert
- Doc: `docs/product-customization-order-1-db-apply-qa-runtime-smoke.md`
- Próxima: **DASHBOARD-1**

---

## Registro — Product Customization ORDER-1 (2026-07-13)

**PRODUCT-CUSTOMIZATION-ORDER-1** → **PASS WITH DEBT**.

- Validación server-side + snapshot v1; checkout V2 desbloqueado
- Migración `create_order` con parents/upsell/`customization_snapshot` (backward-compatible)
- Flag sigue **off**; sin `db push` remoto; sin dashboard UI
- `tsc` + `build` PASS
- Deuda: migración no aplicada en remoto; flag-on/SQL QA pendientes
- Doc: `docs/product-customization-order-1-rpc-server-validation-snapshot.md`
- Próxima: apply autorizado + **DASHBOARD-1**

---

## Registro — Product Customization CART-1 (2026-07-13)

**PRODUCT-CUSTOMIZATION-CART-1** → **PASS WITH DEBT**.

- `LocalCartItemV2` + signature dedup; storage dual legacy/v2
- Modal confirma → carrito; cart sheet jerárquico; edit/remove parent/upsell
- Checkout guard client-side (no `create_order`/RPC/actions server)
- Flag sigue **off**; `tsc` + `build` PASS
- Doc: `docs/product-customization-cart-1-cart-signature-pricing-display.md`
- Deuda: browser QA flag-on pendiente de autorización
- Próxima: **PRODUCT-CUSTOMIZATION-ORDER-1**

---

## Registro — Product Customization CATALOG-1 (2026-07-13)

**PRODUCT-CUSTOMIZATION-CATALOG-1** → **PASS WITH DEBT**.

- Read model público (`lib/product-customization/public.ts` + `public-shared.ts`)
- Summaries / “Desde $X”, intercept add-to-cart, modal lazy + total visual + upsell
- CTA “Continuar” = seam CART-1 (no escribe carrito legacy ni checkout)
- Flag sigue **off**; sin migraciones/dashboard/`create_order`/cart schema
- Doc: `docs/product-customization-catalog-1-public-customization-modal.md`
- Deuda: browser QA con flag on pendiente de autorización
- Próxima: **PRODUCT-CUSTOMIZATION-CART-1**

---

## Registro — Product Customization ADMIN-DND-1 (2026-07-12)

**PRODUCT-CUSTOMIZATION-ADMIN-DND-1** → **PASS WITH DEBT**.

- DnD nativo + ↑/↓ para grupos, opciones (intra-grupo) y assignments (intra-target)
- Actions: `reorderCustomizationGroups/Options/AssignmentsAction`; `sort_order` 10/20/30…
- Sin dependencia DnD nueva; flag off; sin público/DB/deploy
- `tsc` + `build` PASS
- Deuda: touch HTML5 DnD; keyboard ARIA avanzado; upsell items fuera de scope; atomicidad sin RPC
- Doc: `docs/product-customization-admin-dnd-1-sortable-groups-options.md`
- Próxima: **PUBLIC-1** (detrás del flag) o DND-2 upsell items

---

## Registro — Product Customization ADMIN-2-QA (2026-07-12)

**PRODUCT-CUSTOMIZATION-ADMIN-2-QA** → **PASS WITH DEBT**.

- Smoke browser autenticado en `localhost:3000` (owner La Burguesía)
- Assignments categoría/producto, overrides restore, upsell + regla 1/target: PASS
- Flag sigue **off**; catálogo/dashboard sin UI customization
- Datos QA `20260712-1726` soft-desactivados; overrides restaurados
- Doc: `docs/product-customization-admin-2-qa-authenticated-browser-smoke.md`
- Próxima: **PRODUCT-CUSTOMIZATION-PUBLIC-1** (detrás del flag; sin activar aún)

---

## Registro — Product Customization ADMIN-2 (2026-07-12)

**PRODUCT-CUSTOMIZATION-ADMIN-2** → **PASS WITH DEBT**.

- Extiende `/admin/products/customizations`: assignments, upsell, herencia
- Panel overrides en edit product (disable/restore grupo y opción)
- Flag sigue **off**; sin catálogo/carrito/checkout/dashboard/`create_order`
- `tsc` PASS; build verificado en fase; sin deploy
- Deuda: unique upsell = 1 fila/target (no solo 1 activo); smoke autenticado → ver ADMIN-2-QA
- Doc: `docs/product-customization-admin-2-assignments-overrides-upsell.md`
- Próxima: conectar público detrás del flag (**PUBLIC-1**) cuando se autorice

---

## Registro — Product Customization ADMIN-1 (2026-07-12)

**PRODUCT-CUSTOMIZATION-ADMIN-1** → **PASS WITH DEBT**.

- Ruta: `/admin/products/customizations` (CRUD grupos + opciones)
- Flag sigue **off**; aviso preparatorio visible
- Link desde header Productos: “Opcionales y extras”
- `tsc` + `build` PASS; sin deploy
- Deuda: smoke CRUD autenticado pendiente (redirect login verificado)
- Doc: `docs/product-customization-admin-1-groups-options-admin.md`
- Próxima: **PRODUCT-CUSTOMIZATION-ADMIN-2** (assignments / overrides / upsell)

---

## Registro — Product Customization DB-APPLY-1 (2026-07-12)

**PRODUCT-CUSTOMIZATION-DB-APPLY-1** → **PASS WITH DEBT** (producción autorizada; sin staging).

- Project ref: `pkrsedmwxekbhlohhqds` (OrderOps) — autorizado por usuario
- Schema customization **ya presente** en remoto; smoke PASS; `enabled_count = 0`
- `db push` **no** re-ejecutado (falta `supabase_migrations.schema_migrations` — riesgo de reaplicar historial)
- App smoke flag off PASS (`orderops.vercel.app`)
- Doc: `docs/product-customization-db-apply-1-staging-migration-schema-smoke.md`
- Próxima: **PRODUCT-CUSTOMIZATION-ADMIN-1**

---

## Registro — Product Customization FLAG-1 (2026-07-12)

**PRODUCT-CUSTOMIZATION-FLAG-1** completada (helper server-only; sin UI ni activación).

- Helper: `lib/product-customization/flags.ts` → `isProductCustomizationEnabled(businessId)`
- Fail-closed; service client; flag sigue default **off**
- Doc: `docs/product-customization-flag-1-tenant-rollout-guard.md`
- Próxima: **PRODUCT-CUSTOMIZATION-ADMIN-1** (tras aplicar DB-1 en staging)

---

## Registro — Product Customization DB-1 (2026-07-12)

**PRODUCT-CUSTOMIZATION-DB-1** completada (schema/RLS/types; sin UI ni RPC).

- Migración: `supabase/migrations/20260712090000_product_customization_v1_schema.sql`
- Flag: `business_settings.product_customization_enabled` default **false**
- Doc: `docs/product-customization-db-1-schema-rls-types.md`
- Próxima: **PRODUCT-CUSTOMIZATION-ADMIN-1** (o aplicar migración en staging)

---

## Registro QA Producción — Orders Flow (2026-07-09)

**ORDERS-FLOW-QA-1** ejecutado en `https://orderops.vercel.app`. Resultado: **PASS WITH DEBT**.

- Dashboard operativo, pedido manual #A323, tomar pedido y transiciones hasta Completado: **PASS**
- Realtime single-tab (aparición + cambio de lane): **PASS**
- Checkout público E2E y multi-tab realtime: **NOT TESTED**
- Doc: `docs/orders-flow-qa-1-production-smoke.md`

---

## 1. Módulo en Desarrollo Activo

### Pantalla / Componente Principal

**Dashboard Principal Operacional (Orders Dashboard / Workflow Lanes Engine)**

Este módulo representa el centro operacional del sistema y concentra:

* gestión de pedidos en tiempo real;
* lanes dinámicas por workflow;
* ownership colaborativo;
* snapshots operacionales;
* métricas compactas;
* sesiones vivas;
* scanning operacional;
* insights automáticos;
* actividad reciente.

### Funcionalidad Actualmente Bajo Iteración

La fase actual está enfocada en estabilizar la ejecución operacional multioperador sobre estados vivos.

Flujo operativo principal:

```text
Pending
   ↓
Preparing
   ↓
Ready
   ↓
Completed

Cualquier estado:
→ Cancelled
```

Objetivos funcionales activos:

* sincronización visual consistente entre operadores simultáneos;
* evitar desincronización entre pestañas;
* convergencia rápida entre estado optimista y estado persistido;
* preservar ownership y contexto operacional;
* reducir fricción visual durante cambios de estado.

### Tecnologías Involucradas

Frontend:

* Next.js App Router
* React
* TypeScript
* Component Architecture
* Client Components + Hooks

Backend:

* Supabase Postgres
* Supabase Realtime Channels
* Supabase Presence
* Supabase Auth
* Supabase RLS

Estado / Render:

* useMemo
* useEffect
* optimistic state updates
* defensive hydration
* realtime reconciliation

Estilos:

* CSS componentizado
* Mobile-first
* Dashboard styles altamente especializados

Archivos de alta criticidad:

```text
components/admin/orders/admin-dashboard-orders.tsx
components/admin/orders-admin.css
components/admin/admin-shell.css
app/admin/(protected)/dashboard/page.tsx
```

---

## 2. Lógica Visual e Iteraciones en Curso

### Objetivo Visual Actual

Prioridad absoluta:

```text
Estabilidad operacional > fidelidad visual
```

El dashboard debe permanecer estable bajo:

* scroll continuo;
* actualizaciones realtime;
* sesiones largas;
* múltiples operadores;
* dispositivos Android modestos.

### Trabajo Visual Activo

### Dashboard Mobile-First

Se está iterando sobre:

* cards operacionales;
* overview superior;
* snapshots KPI;
* compactación visual;
* spacing adaptativo;
* densidad informativa.

### Empty States Operacionales

Estados vacíos actualmente optimizados para:

* jornada sin pedidos;
* sesión cerrada;
* panel en escucha;
* ausencia de actividad;
* filtros sin resultados.

### Renderer Mobile Alternativo

Actualmente existe una bifurcación controlada:

```text
Desktop Overview
↓
Renderer histórico intacto

Mobile Overview
↓
Renderer simplificado y separado
```

Motivación:

* reducir complejidad de render;
* desacoplar mobile del overview histórico;
* aislar bugs específicos de Chrome Android.

### Preparación Future-Proof

El sistema visual sigue preparándose para:

* Dark Theme
* Kitchen Mode
* Delivery Mode
* Role-specific layouts
* visual tokens reutilizables

### Hallazgo Crítico Visual Actual

Existe un bug de render altamente específico:

```text
Chrome Android
✓ reproduce bug

Opera Mini
✗ NO reproduce bug

Desktop
✗ NO reproduce bug
```

Esto indica:

```text
problema probablemente asociado a:
GPU compositor
rasterization path
viewport rendering
Chrome Android rendering pipeline
```

No existe evidencia fuerte de:

* problema de lógica;
* problema de datos;
* problema de realtime;
* problema de CSS chunking actual.

---

## 3. Estado de la Sincronización y Realtime (Bloqueo Actual)

### Estado Actual del Realtime

El realtime ya opera sobre:

* channels de Supabase;
* hydration defensiva;
* presencia;
* reconciliación;
* optimistic updates.

### Problema Histórico Detectado

Hubo evidencia previa de:

* pestañas que perdían convergencia;
* operadores viendo sesiones desactualizadas;
* dashboards sin refresco automático;
* dependencia excesiva del refresh manual.

### Estrategia Actual de Reconciliación

Patrón implementado:

```text
Realtime Event
      ↓
Patch optimista
      ↓
Hydration defensiva
      ↓
Re-fetch / reconcile
      ↓
Estado convergente
```

### Riesgos Actuales

Problemas que todavía deben vigilarse:

* duplicated optimistic patches;
* stale closures en hooks;
* race conditions entre realtime y hydration;
* order snapshots incompletos;
* payloads parciales.

### Optimistic UX

Objetivo:

```text
feedback inmediato
+
consistencia eventual
```

Reglas:

* la UI responde instantáneamente;
* el backend sigue siendo la fuente de verdad;
* los fallos deben reconciliarse automáticamente.

### Cadena de Derivación Esperada

```text
orders
↓
hydratedOrders
↓
optimisticOrders
↓
windowScopedOrders
↓
filteredOrders
↓
lanes
metrics
insights
activity
```

Toda derivación debe depender de la misma fuente.

---

## 4. Bloqueo Activo Actual (Highest Priority)

### Problema Principal

Bug visual severo en:

```text
Chrome Android
Moto G13
```

Síntomas:

* bandas horizontales;
* ghost rendering;
* cards duplicadas visualmente;
* corrupción parcial del viewport;
* repaint inconsistente;
* artefactos durante scroll.

### Hipótesis Ya Descartadas

Descartado o debilitado:

* CSS chunk corruption;
* HMR parcial;
* translateZ hacks;
* forced layer promotion;
* nested grid overview;
* overview histórico;
* rgba/shadows;
* 100dvh;
* layout mobile previo;
* GPU promotion manual;
* overview renderer antiguo.

### Hipótesis Más Fuertes Ahora

```text
1. Chrome Android raster pipeline
2. compositor GPU específico
3. assets / imágenes / SVG
4. primitives visuales globales
5. bug específico del device GPU path
```

### Regla Importante

NO seguir haciendo microfixes aislados.

Usar:

```text
aislamiento binario
```

---

## 5. Tareas Pendientes Inmediatas (Next Steps para Cursor)

### Paso 1 — Resolver Desincronización / Convergencia

Auditar:

* hooks realtime;
* subscriptions duplicadas;
* stale references;
* hydration ordering.

Validar:

```text
multi-tab
multi-operator
network fluctuation
```

---

### Paso 2 — Estabilizar Hidratación Inicial

Objetivos:

* eliminar CLS;
* reducir saltos visuales;
* evitar flashes de métricas.

Revisar:

* loading boundaries;
* skeleton strategy;
* hydration sequence.

---

### Paso 3 — Fortalecer Tenant Isolation

Verificar:

```text
tenant_id
↓
query
↓
mutation
↓
optimistic update
↓
RLS
```

Ninguna mutación local debe ejecutarse sin contexto tenant.

---

### Paso 4 — Continuar Investigación Chrome Android

NO hacer más tuning fino.

Hacer pruebas binarias:

```text
RF14A
quitar logos / imágenes

RF14B
quitar SVGs

RF14C
header mínimo

RF14D
render-test page incremental
```

Objetivo:

```text
aislar trigger exacto
```

---

## 6. Restricciones Actuales de Desarrollo

NO tocar sin necesidad:

* métricas;
* lógica de pedidos;
* ownership;
* Supabase schema;
* workflow machine;
* RLS;
* realtime base.

Priorizar:

```text
estabilidad
consistencia
convergencia
```

por encima de:

```text
micro mejoras visuales
```

---

## 7. Definición de Done para Esta Fase

La fase se considera cerrada cuando:

* realtime converge entre tabs;
* realtime converge entre operadores;
* hydration deja de producir estados inconsistentes;
* mobile Android Chrome deja de corromper render;
* dashboard mantiene estabilidad en sesiones largas;
* renderer mobile queda desacoplado y robusto;
* tenant isolation queda validado extremo a extremo.

# PRODUCT-CUSTOMIZATION-PILOT-MONITOR-1 — Live Pilot Monitoring & Real Config Readiness

## Objetivo

Monitorear el piloto live de Product Customization V1 en `demohamburgueseria` tras **ROLLOUT Modo C Retry 2 (PASS WITH DEBT — PILOT LIVE)**, confirmar salud operativa, y clasificar la configuración activa como **demo/comercial inicial** (no solo QA stamp) con recomendaciones de polish.

## Contexto

| Item | Estado heredado |
|------|-----------------|
| Modo C Retry 2 | PASS WITH DEBT — PILOT LIVE |
| Pedido QA live | `#213F` / `d5573074-…` |
| Flag | `product_customization_enabled=true` |
| Gate | session open + `on_demand_mode_active=true` |
| LIVE-OPS-GATE-1 | PASS |

Desde el rollout, el negocio **reemplazó** el stamp QA ADMIN-2 por grupos comerciales **Papas / Aderezos / Extras** asignados a BBQ Bacon y Doble Smash. Existe además un pedido real comercial `#7D0A` (Doble Smash personalizado).

## Alcance

- Auditoría read-only SQL + browser
- Validación flags / store session / acceptance
- Auditoría config grupos/opciones/assignments/upsell
- Pedidos recientes + assert `#213F` + `#7D0A`
- Catálogo, modal, cart V2, checkout **pre-submit**
- Dashboard render summary
- Real Config Readiness + recomendaciones (sin aplicar)
- Docs: este archivo, `CURRENT_PHASE.md`, `ORDEROPS_LIVING_MEMORY.md`

## Fuera de scope

Código funcional, schema/migraciones, RLS, RPC, writes de business_settings, cierre de sesión, borrado de pedidos/productos, cambios de precios/nombres, activar/desactivar grupos, crear pedidos nuevos, deploy/Vercel, rollback sin autorización.

## Estado live inicial

Esperado (docs):

```txt
product_customization_enabled=true
on_demand_mode_active=true
store session open
```

Observado: **coincide** (ver secciones siguientes).

## Precheck local

| Check | Resultado |
|-------|-----------|
| `git status --short` | WIP local amplio (customization feature + docs); no bloquea auditoría read-only |
| `npx tsc --noEmit` | PASS (`TSC_EXIT=0`, `tmp/pilot-monitor-1-tsc-pre.txt`) |
| `npm run build` | PASS (`BUILD_EXIT=0`, `tmp/pilot-monitor-1-build-pre.txt`) |
| lint | no ejecutado (opcional) |

## Precheck remoto SQL

Tenant / flags / coherencia / sesiones consultados en producción `pkrsedmwxekbhlohhqds`.

## Estado de flags

| Campo | Valor |
|-------|--------|
| business_id | `e21b8fc2-3016-4dec-92ef-ebb04e58ecdf` |
| slug / name | `demohamburgueseria` / La Burguesía |
| `product_customization_enabled` | **true** |
| `on_demand_mode_active` | **true** |
| `business_settings.updated_at` | `2026-07-14 23:00:16.468795+00` (activación Modo C Retry 2) |

## Store session / on-demand gate

| Check | Resultado |
|-------|-----------|
| `has_open_session` | **true** (`closed_at is null`) |
| Sesión abierta | `a01252b0-323c-4afd-95c2-4d56aaa854b8` · `status=open` · opened `2026-07-14 19:04:58+00` |
| Coherencia | open session + on_demand true + customization true → **PASS** |

## Configuración activa

Grupos disponibles (solo comerciales; **sin** grupos QA ADMIN-2 residuales):

| Grupo | Required | Type | max | Opciones activas |
|-------|----------|------|-----|------------------|
| Papas | sí | single | 1 | 3 |
| Aderezos | no | multiple | 5 | 5 |
| Extras | no | multiple | 5 | 3 |

Assignments habilitados (producto):

| Producto | Grupos |
|----------|--------|
| BBQ Bacon (`1b2421f8-…`) | Papas, Aderezos, Extras |
| Doble Smash (`e0de9b79-…`) | Papas, Aderezos, Extras |

Upsell groups: **ninguno** en el tenant (tabla vacía). Plus sugeridos / Coca del stamp QA ya no están configurados.

## Auditoría de grupos y opciones

| Opción | Grupo | price_delta | Nota copy |
|--------|-------|-------------|-----------|
| Papas chicas / medianas / grandes | Papas | 0 / 950 / 1500 | Claro |
| Mayonesa / Ketchup / Mostaza | Aderezos | 0 | Claro |
| BBQ | Aderezos | 250 | OK; podría ser “Salsa BBQ” |
| Big Mac | Aderezos | 250 | Preferible **Salsa Big Mac** |
| Bacon | Extras | 1000 | OK |
| Chedar | Extras | 500 | Typo → **Cheddar** |
| Huevo | Extras | 750 | OK (`sort_order=12` raro, no bloqueante) |

Clasificación por sección:

- **Papas** — demo/comercial ✅ (requerido, precios coherentes)
- **Aderezos** — demo/comercial con polish de naming ⚠️
- **Extras** — demo/comercial con typo Chedar ⚠️
- **Plus sugeridos** — no configurados actualmente ℹ️

## Auditoría de plus sugeridos

No hay `upsell_groups` activos. El flujo Plus+Coca del pedido `#213F` fue con config QA histórica; la config **actual** no ofrece upsell en modal (confirmado en modal Doble Smash).

Recomendación: reintroducir Plus (bebida / papas extras) cuando el owner lo defina, o documentar intencionalidad “sin plus en V1 piloto comercial”.

## Pedidos recientes

Últimos relevantes:

| Ref | Cliente | Total | Status | Notas |
|-----|---------|-------|--------|-------|
| `#7D0A` | Mauro Nahuel… | 16200 | pending→completado en UI | **Pedido real** customized |
| `#213F` | QA Rollout Pilot Live Retry 2 | 16750 | completed | Live Modo C Retry 2 |
| `#6B7C` | QA Live Ops Gate | 8500 | completed | Legacy, sin snapshot |
| `#8C9E` | QA Rollout Pilot | 16750 | completed | Modo B |

Sin pedidos parciales raros posteriores al live. Totales no null/0 inesperados en la muestra.

## Pedido live #213F

| Campo | Valor |
|-------|--------|
| id | `d5573074-8c14-4fa1-af5f-6e3a2209213f` |
| customer | QA Rollout Pilot Live Retry 2 |
| total | 16750.00 |
| status | completed |

## SQL assert order_items

### `#213F`

- Parent BBQ: `item_kind=product`, snapshot **v1**, pricing + summary, `unit_price=13750`
- Child Coca: `item_kind=upsell`, `parent_order_item_id` → parent, snapshot null, `unit_price=3000`
- **PASS** (snapshot refleja config QA histórica inmutable)

### `#7D0A` (comercial)

- Parent Doble Smash: `unit_price=16200` = 12500 + 950 + 250 + 250 + 1000 + 750 + 500
- Snapshot v1 con Papas/Aderezos/Extras + summary legible
- Sin child upsell (coherente: upsell vacío)
- **PASS**

### Scan 48h inconsistencias

Query upsell sin parent / product customized con version ≠ 1 → **0 filas**.

## Browser QA catálogo

URL: `http://localhost:3000/b/demohamburgueseria/catalogo`

| Check | Resultado |
|-------|-----------|
| Carga sin 500 | PASS |
| Negocio acepta pedidos | PASS (checkout/checkout gate OK) |
| “Desde $X” en configurables | PASS (`Desde $ 13.500`, `Desde $ 12.500`) |
| No configurables normales | PASS (Clásica `$8.500`, etc.) |
| Cards/imágenes | PASS visual a11y |
| Copy landing | Debt: “QA PUBLIC-3 QA” / “Hacé tu pedido QA” en hero público |

## Browser QA modal customization

Producto: **Doble Smash** (vía Ver → Personalizar)

| Check | Resultado |
|-------|-----------|
| Modal abre | PASS |
| Papas / Aderezos / Extras | PASS |
| Requerido claro | PASS (“Requerido” + alert “Elegí una opción en Papas”) |
| CTA disabled sin Papas | PASS |
| CTA enabled tras Papas chicas | PASS |
| Copy QA ADMIN-2 | **Ausente** (PASS) |
| Typo Chedar / Big Mac | Visible (debt copy) |
| Plus/Coca | No presente (config actual) |

## Browser QA cart V2

Agregado monitor (local only): Doble Smash + Papas chicas → cart sheet:

```txt
Doble Smash $12.500 + summary “Papas: Papas chicas”
CTA Continuar al checkout
```

**PASS**. Cart limpiado de `localStorage` al cerrar la auditoría (sin pedido nuevo).

## Browser QA checkout pre-submit

`/b/demohamburgueseria/checkout`:

| Check | Resultado |
|-------|-----------|
| Abre con items V2 | PASS |
| Mensaje personalizados | PASS |
| “no está aceptando pedidos” | **No aparece** |
| Enviar pedido visible | PASS (no se envió) |
| Total | `$12.500` alineado |

## Dashboard QA

| Check | Resultado |
|-------|-----------|
| Carga sin 500 | PASS |
| `#7D0A` + detalle | PASS — resumen Papas/Aderezos/Extras operativo |
| `#213F` visible | PASS — BBQ + Coca |
| Legacy `#6B7C` | PASS |
| JSON raw | **No** |
| Workflow | Ver pedido / historial de estados visibles |

## Monitoreo de errores

| Señal | Resultado |
|-------|-----------|
| Pedidos parciales 48h | No detectados |
| Upsell huérfano | No |
| Snapshot v≠1 en customized | No |
| Dashboard 500 | No |
| Acceptance desync | No |

## Real Config Readiness

**¿Sirve como demo comercial inicial?**  
**Sí.** Papas / Aderezos / Extras con precios creíbles, requerido claro, assignments en 2 héroes del menú, y evidencia de pedido real `#7D0A` con snapshot v1 correcto.

**Ya no es solo QA stamp:** los grupos `QA ADMIN-2…` no aparecen en catálogo/modal actuales.

Limitaciones antes de “comercial listo para muchos tenants”:

1. Copy polish (Chedar, Big Mac)
2. Cobertura: solo 2 productos assigned; resto del menú sin personalización
3. Sin Plus sugeridos
4. Hero público aún con tags QA
5. Papas requerido en hamburguesa suelta puede ser discutible (negocio lo eligió)

## Recomendaciones de copy/configuración

| Prioridad | Cambio sugerido | Acción |
|-----------|-----------------|--------|
| P1 | `Chedar` → `Cheddar` | Owner / ADMIN-UX |
| P1 | `Big Mac` → `Salsa Big Mac` | Owner |
| P2 | Evaluar `Aderezos` vs `Salsas` / `Salsas y aderezos` | Owner |
| P2 | Evaluar Papas requerido solo en combos vs hamburguesas | Owner |
| P2 | Revisar `sort_order` Huevo (=12) | Admin polish |
| P3 | Reintroducir Plus (bebida) si el negocio lo quiere | Config |
| P3 | OPTION-IMAGES-1 fotos de opciones | Roadmap |
| P3 | Limpiar copy público “QA PUBLIC-3” | Settings público |
| P3 | Assign más productos / categorías cuando estabilice | Config |

**No aplicados en esta fase** (read-only).

## Deudas no bloqueantes

| ID | Deuda |
|----|--------|
| M1 | Copy Chedar / Big Mac |
| M2 | Hero / microcopy público con “QA” |
| M3 | Sin upsell Plus activo |
| M4 | Assignments limitados a 2 productos |
| D1 | Dedup cart no smokeado en monitor |
| D2 | Sticky cart / overlays frágiles en automation |

## Estado final live

```txt
store session: open (a01252b0-…)
on_demand_mode_active: true
product_customization_enabled: true
config: Papas + Aderezos + Extras (demo/comercial inicial)
upsell: none
pedidos V2 recientes: #7D0A (real) + #213F (QA live) sanos
```

## Qué NO se tocó

Código, schema, migraciones, RLS, RPC, flags, on_demand, store session, pedidos, order_items, precios, nombres, assignments, deploy. Solo lectura + docs + cleanup localStorage de cart monitor.

## Validaciones CLI

| Check | Resultado |
|-------|-----------|
| pre `tsc` / `build` | PASS |
| post `tsc` / `build` | PASS (mismo entorno; sin cambios de código) |

## Resultado final

**PASS WITH DEBT**

Piloto live sano. Configuración activa clasificada como **demo/comercial inicial** con polish de copy/cobertura pendiente antes de rollout comercial multi-tenant.

## Próxima fase recomendada

1. **Owner polish config** (Chedar/Cheddar, Salsa Big Mac, decide Papas requerido + Plus).  
2. Limpiar copy público QA en landing.  
3. Opcional: `PRODUCT-CUSTOMIZATION-ADMIN-UX-2` / OPTION-IMAGES-1.  
4. Expandir assignments solo después del polish de naming.

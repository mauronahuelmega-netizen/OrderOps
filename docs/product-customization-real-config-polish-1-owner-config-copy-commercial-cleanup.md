# PRODUCT-CUSTOMIZATION-REAL-CONFIG-POLISH-1 — Owner Config Copy & Commercial Cleanup

## Objetivo

Pulir la configuración comercial activa de Product Customization V1 en `demohamburgueseria`: corregir nombres visibles, quitar restos QA del copy público y dejar el piloto más presentable para demo/comercial, sin cambiar el modelo funcional.

## Contexto

| Item | Estado heredado (PILOT-MONITOR-1) |
|------|-----------------------------------|
| Flag | `product_customization_enabled=true` |
| Gate | session open + `on_demand_mode_active=true` |
| Config | Papas / Aderezos / Extras (demo/comercial inicial) |
| Pedidos | `#213F` QA live · `#7D0A` real |
| Deuda prior | `Chedar`, `Big Mac`, hero público con “QA” |

## Alcance

- Snapshot + auditoría comercial
- Writes autorizados de nombres de opciones y copy público QA
- Browser QA catálogo / modal / cart V2 / checkout pre-submit / dashboard
- Docs + `CURRENT_PHASE.md` + `ORDEROPS_LIVING_MEMORY.md`

## Fuera de scope

Código funcional, schema/migraciones, RLS, RPC, flag customization, on_demand, store session, borrado de pedidos/productos/grupos, precios, assignments, crear upsell, crear pedido, deploy/Vercel, renombre de grupos sin auth adicional.

## Autorización

Read-only:

```txt
PRODUCTION_PROJECT_REF=pkrsedmwxekbhlohhqds
CONFIRM_IS_PRODUCTION=yes
PILOT_BUSINESS_SLUG=demohamburgueseria
AUTORIZO_REAL_CONFIG_POLISH_READ_ONLY=yes
```

Writes aplicados:

```txt
AUTORIZO_REAL_CONFIG_POLISH_CONTENT_WRITES=yes
AUTORIZO_UPDATE_CUSTOMIZATION_OPTION_NAMES=yes
AUTORIZO_UPDATE_PUBLIC_COPY_IF_QA_VISIBLE=yes
```

No autorizados (no aplicados): group names, descriptions, assignments scope, upsell create/enable, prices, polish QA order.

## Estado live inicial

| Campo | Valor |
|-------|--------|
| business_id | `e21b8fc2-3016-4dec-92ef-ebb04e58ecdf` |
| `product_customization_enabled` | true |
| `on_demand_mode_active` | true |
| store session | open `a01252b0-…` |

## Precheck local

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS (`TSC_EXIT=0`) |
| `npm run build` | PASS (`BUILD_EXIT=0`) |
| migrations / db push | no ejecutados |

## Precheck remoto SQL

Flags + sesión abierta: **PASS**. Coherencia live intacta.

## Snapshot previo

### Grupos

| id | name | required | type | max | description |
|----|------|----------|------|-----|-------------|
| `8c567d13-…` | Papas | yes | single | 1 | Elegí el tamaño de las papas |
| `a65af6ca-…` | Aderezos | no | multiple | 5 | Elegí tus aderezos |
| `aa992971-…` | Extras | no | multiple | 5 | Elegí entre nuestros extras para sumar |

### Opciones (relevantes)

| id | group | name (antes) | price_delta |
|----|-------|--------------|-------------|
| `dc8737ca-…` | Aderezos | Big Mac | 250 |
| `77bc4278-…` | Extras | Chedar | 500 |

### Assignments

BBQ Bacon + Doble Smash → Papas / Aderezos / Extras (enabled).

### Upsell

Grupo `Bebidas` (`3ef90826-…`) disponible sobre Doble Smash, **0 items activos**.

### Copy público (antes)

| Campo | Valor |
|-------|--------|
| description | … entrega rápida **- QA test** |
| catalog_hero_badge | Te confirmamos por WhatsApp **QA** |
| catalog_hero_headline | Listo para pedir online **- QA PUBLIC-3 QA** |
| catalog_hero_microcopy | Hacé tu pedido **QA** |

## Auditoría comercial

Config Papas/Aderezos/Extras es entendible como menú real. Obligatorio Papas + deltas coherentes. Kitchen dashboard ya mostraba summaries legibles (con typos). Plus “Bebidas” existe pero vacío → deuda no bloqueante.

## Grupos auditados

| Grupo | Veredicto | Acción |
|-------|-----------|--------|
| Papas | Claro / requerido OK | Mantener |
| Aderezos | OK; opcional “Salsas” | No renombrar (sin auth group names) |
| Extras | OK; opcional “Agregados extra” | No renombrar (sin auth) |

## Opciones auditadas

| Antes | Después | Acción |
|-------|---------|--------|
| Chedar | Cheddar | **Aplicado** |
| Big Mac | Salsa Big Mac | **Aplicado** |
| BBQ | — | Deuda menor: podría ser “Salsa BBQ” |
| Huevo sort_order=12 | — | Deuda polish admin |

## Plus sugeridos

Grupo Bebidas activo sin items. Recomendación futura: Coca / Sprite / Agua (requiere `AUTORIZO_CREATE_OR_ENABLE_REAL_UPSELL`).

## Copy público / restos QA

QA visible en `businesses.description` + `catalog_hero_*`. **Limpiado** con autorización pública.

## Cambios aplicados

### Opciones (`2026-07-16 03:07:15 UTC`)

```sql
-- Chedar → Cheddar
update customization_options
set name = 'Cheddar', updated_at = now()
where id = '77bc4278-ab1c-4930-8737-d22e76184551'
  and business_id = 'e21b8fc2-3016-4dec-92ef-ebb04e58ecdf';

-- Big Mac → Salsa Big Mac
update customization_options
set name = 'Salsa Big Mac', updated_at = now()
where id = 'dc8737ca-6c4c-41a4-add1-29a994a085a2'
  and business_id = 'e21b8fc2-3016-4dec-92ef-ebb04e58ecdf';
```

Precios conservados: Cheddar `$500` · Salsa Big Mac `$250`.

### Copy público

| Campo | Nuevo valor |
|-------|-------------|
| description | Smash burgers caseras con ingredientes frescos y entrega rápida |
| catalog_hero_badge | Te confirmamos por WhatsApp |
| catalog_hero_headline | Hamburguesas smash, papas y extras a tu gusto. |
| catalog_hero_microcopy | Personalizá tu pedido y sumá tus favoritos antes de confirmar. |

## Cambios no aplicados

- Aderezos → Salsas / Extras → Agregados extra
- Precios / required / min / max
- Assignments adicionales
- Items en Plus Bebidas
- Pedido QA polish
- Imágenes de opciones

## Browser QA catálogo

PASS: sin 500; hero comercial sin “QA”; BBQ/Doble Smash “Desde $X”; negocio acepta pedidos.

## Browser QA modal

PASS (Doble Smash): Papas / Aderezos / Extras; **Cheddar**; **Salsa Big Mac**; precios intactos; CTA disabled hasta Papas.

## Browser QA cart V2

PASS (local): Doble Smash + Papas chicas + Cheddar → `$13.000`; summary `Extras: Cheddar (+$500)`; sin JSON raw. Cart limpiado al final.

## Browser QA checkout pre-submit

PASS: resumen V2 con Cheddar; sin “no está aceptando pedidos”; Enviar visible; **no se envió pedido**.

## Dashboard QA

PASS: `#7D0A` / `#213F` cargan. Snapshot histórico de `#7D0A` conserva `Chedar` / `Big Mac` (correcto e inmutable). Sin JSON raw.

## Estado final live

```txt
product_customization_enabled=true
on_demand_mode_active=true
store session open
options: Cheddar + Salsa Big Mac
public hero: sin QA
upsell Bebidas: sin items
```

## Rollback / reversión disponible

```sql
update customization_options
set name = 'Chedar', updated_at = now()
where id = '77bc4278-ab1c-4930-8737-d22e76184551'
  and business_id = 'e21b8fc2-3016-4dec-92ef-ebb04e58ecdf';

update customization_options
set name = 'Big Mac', updated_at = now()
where id = 'dc8737ca-6c4c-41a4-add1-29a994a085a2'
  and business_id = 'e21b8fc2-3016-4dec-92ef-ebb04e58ecdf';

update businesses set
  description = 'Smash burgers caseras con ingredientes frescos y entrega rápida - QA test',
  catalog_hero_badge = 'Te confirmamos por WhatsApp QA',
  catalog_hero_headline = 'Listo para pedir online - QA PUBLIC-3 QA',
  catalog_hero_microcopy = 'Hacé tu pedido QA'
where id = 'e21b8fc2-3016-4dec-92ef-ebb04e58ecdf';
```

No ejecutado.

## Qué NO se tocó

Código, schema, migraciones, RLS, RPC, flag customization, on_demand, store session, pedidos, precios, grupos, assignments, deploy.

## Validaciones CLI

| Check | Resultado |
|-------|-----------|
| tsc | PASS |
| build | PASS |

## Riesgos / deuda

| ID | Deuda |
|----|--------|
| P1 | Evaluar Aderezos→Salsas / Extras→Agregados extra |
| P2 | Plus Bebidas sin items |
| P3 | Assignments solo 2 productos |
| P4 | OPTION-IMAGES-1 |
| P5 | Huevo sort_order=12 |
| P6 | Snapshots históricos con nombres viejos (esperado) |

## Resultado final

**PASS WITH DEBT**

Config demo/comercial pulida (nombres + copy público). Product Customization sigue live. Deuda: plus vacío, renombres de grupo opcionales, imágenes, cobertura de assignments.

## Próxima fase recomendada

1. Owner: decidir Aderezos/Extras naming + poblar Plus Bebidas.  
2. Expandir assignments a más hamburguesas/combos.  
3. Opcional: ADMIN-UX-2 / OPTION-IMAGES-1.

# PRODUCT-CUSTOMIZATION-GROUP-DESCRIPTIONS-1 — Customer-Facing Group Description Polish

## Objetivo

Alinear descriptions visibles de grupos de Product Customization en `demohamburgueseria` con los nombres actuales (`Papas` / `Salsas` / `Agregados extra`).

## Contexto

Tras GROUP-NAMING-1:

- Product Customization live
- Nombres: Papas / Salsas / Agregados extra
- Opciones: Cheddar / Salsa Big Mac
- Deuda: descriptions aún con “aderezos” / “extras”

## Alcance

- Snapshot + update de `customization_groups.description` autorizados
- Browser QA catálogo / modal / cart / checkout pre-submit / dashboard
- Docs + `CURRENT_PHASE.md` + `ORDEROPS_LIVING_MEMORY.md`

## Fuera de scope

Código, schema, migraciones, RLS, RPC, nombres de grupos/opciones, precios, min/max/required, assignments, plus, pedidos, flag, on_demand, store session, deploy.

## Autorización

```txt
PRODUCTION_PROJECT_REF=pkrsedmwxekbhlohhqds
CONFIRM_IS_PRODUCTION=yes
PILOT_BUSINESS_SLUG=demohamburgueseria
AUTORIZO_GROUP_DESCRIPTIONS_READ_ONLY=yes
AUTORIZO_UPDATE_CUSTOMIZATION_GROUP_DESCRIPTIONS=yes
```

Sin `AUTORIZO_CREATE_GROUP_DESCRIPTIONS_QA_ORDER` → QA pre-submit solamente.

## Estado live inicial

| Campo | Valor |
|-------|--------|
| business_id | `e21b8fc2-3016-4dec-92ef-ebb04e58ecdf` |
| `product_customization_enabled` | true |
| `on_demand_mode_active` | true |
| store session | open (`a01252b0-323c-4afd-95c2-4d56aaa854b8`) |

## Precheck local

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS (`TSC_EXIT=0`) |
| `npm run build` | PASS (`BUILD_EXIT=0`) |

## Precheck remoto SQL

Flags + sesión open: **PASS**.

## Snapshot previo

| id | name | description (prev) |
|----|------|--------------------|
| `8c567d13-e666-4d34-9f4b-e76bdd73fbd2` | Papas | Elegí el tamaño de las papas |
| `a65af6ca-763b-42b3-8417-d4c88f51a2c7` | Salsas | Elegí tus aderezos |
| `aa992971-1411-42a6-a015-2edafdf1a170` | Agregados extra | Elegí entre nuestros extras para sumar |

Opciones (contexto, sin cambios): Cheddar `$500`, Salsa Big Mac `$250`, BBQ `$250`, etc.

## Criterio de descriptions

| Grupo | Decisión | Motivo |
|-------|----------|--------|
| Papas | Elegí el tamaño de papas para acompañar tu pedido. | Aclara elección de tamaño |
| Salsas | Sumá tus salsas favoritas. | Sin “aderezos”; comercial y corto |
| Agregados extra | Agregá ingredientes extra a tu hamburguesa. | Alinea con nombre y precio delta |

## Cambios aplicados

`2026-07-16 14:43:17 UTC`:

```sql
update customization_groups
set description = 'Elegí el tamaño de papas para acompañar tu pedido.',
    updated_at = now()
where id = '8c567d13-e666-4d34-9f4b-e76bdd73fbd2'
  and business_id = 'e21b8fc2-3016-4dec-92ef-ebb04e58ecdf';

update customization_groups
set description = 'Sumá tus salsas favoritas.',
    updated_at = now()
where id = 'a65af6ca-763b-42b3-8417-d4c88f51a2c7'
  and business_id = 'e21b8fc2-3016-4dec-92ef-ebb04e58ecdf';

update customization_groups
set description = 'Agregá ingredientes extra a tu hamburguesa.',
    updated_at = now()
where id = 'aa992971-1411-42a6-a015-2edafdf1a170'
  and business_id = 'e21b8fc2-3016-4dec-92ef-ebb04e58ecdf';
```

Estado post-write:

| name | description |
|------|-------------|
| Papas | Elegí el tamaño de papas para acompañar tu pedido. |
| Salsas | Sumá tus salsas favoritas. |
| Agregados extra | Agregá ingredientes extra a tu hamburguesa. |

Nombres, precios, required/min/max, sort_order, assignments e options intactos.

## Cambios no aplicados

- Pedido QA nuevo
- Plus Bebidas / assignments / imágenes
- Nombres / precios / flags / sesión

## Browser QA catálogo

PASS: HTTP 200; hero comercial sin copy QA; BBQ Bacon / Doble Smash con “Desde $…”.

## Browser QA modal

PASS (Doble Smash): headings Papas / Salsas / Agregados extra; descriptions nuevas visibles bajo cada heading; Cheddar + Salsa Big Mac; CTA funciona tras elegir Papas.

## Browser QA cart V2

PASS:

```txt
Papas: Papas chicas
Salsas: Salsa Big Mac (+$250)
Agregados extra: Cheddar (+$500)
total $13.250
```

Sin JSON raw. Cart localStorage limpiado al final.

## Browser QA checkout pre-submit

PASS: checkout abre; acepta pedidos; submit “Enviar pedido” habilitado; summary con nombres de grupo actuales; total `$13.250`; **no** se envió pedido.

## Dashboard QA

PASS: dashboard carga; `#7D0A` visible con snapshot histórico (`Aderezos` / `Extras` / `Chedar` / `Big Mac`) — esperado e inmutable; workflow disponible.

## Estado final live

```txt
product_customization_enabled = true
on_demand_mode_active = true
store session = open
Papas / Salsas / Agregados extra activos
descriptions alineadas
opciones / precios / assignments intactos
```

## Reversión disponible

No ejecutada.

```sql
update customization_groups
set description = 'Elegí el tamaño de las papas',
    updated_at = now()
where id = '8c567d13-e666-4d34-9f4b-e76bdd73fbd2'
  and business_id = 'e21b8fc2-3016-4dec-92ef-ebb04e58ecdf';

update customization_groups
set description = 'Elegí tus aderezos',
    updated_at = now()
where id = 'a65af6ca-763b-42b3-8417-d4c88f51a2c7'
  and business_id = 'e21b8fc2-3016-4dec-92ef-ebb04e58ecdf';

update customization_groups
set description = 'Elegí entre nuestros extras para sumar',
    updated_at = now()
where id = 'aa992971-1411-42a6-a015-2edafdf1a170'
  and business_id = 'e21b8fc2-3016-4dec-92ef-ebb04e58ecdf';
```

## Qué NO se tocó

Código funcional · schema/migraciones · RLS/RPC · nombres · precios · options · assignments · plus · flags · store session · pedidos · deploy/Vercel.

## Validaciones CLI

| Check | Resultado |
|-------|-----------|
| Pre `tsc` / `build` | PASS (`TSC_EXIT=0`, `BUILD_EXIT=0`) |
| Post `tsc` / `build` | PASS (`TSC_EXIT=0`, `BUILD_EXIT=0`) |

## Riesgos / deuda

- Plus Bebidas vacío
- Assignments limitados (BBQ Bacon + Doble Smash)
- Imágenes de opciones futuras
- ADMIN-UX-2 pendiente
- Hydration warning Next.js en catálogo (preexistente / no bloqueante para esta fase)
- Sin pedido QA con snapshot nuevo (sin auth)

## Resultado final

**PASS WITH DEBT**

## Próxima fase recomendada

1. Poblar Plus **Bebidas**
2. Expandir assignments a más productos
3. ADMIN-UX-2 / OPTION-IMAGES-1

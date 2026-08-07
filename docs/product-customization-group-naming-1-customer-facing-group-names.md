# PRODUCT-CUSTOMIZATION-GROUP-NAMING-1 — Customer-Facing Group Naming Polish

## Objetivo

Pulir nombres visibles de grupos/secciones de Product Customization en `demohamburgueseria` para que el modal público sea más claro para clientes finales.

## Contexto

Tras REAL-CONFIG-POLISH-1:

- Product Customization live
- Opciones: Cheddar, Salsa Big Mac
- Deuda: naming de grupos Aderezos / Extras

## Alcance

- Snapshot + renombre de grupos autorizados
- Browser QA catálogo / modal / cart / checkout pre-submit / dashboard
- Docs + `CURRENT_PHASE.md` + `ORDEROPS_LIVING_MEMORY.md`

## Fuera de scope

Código, schema, migraciones, RLS, RPC, precios, opciones, assignments, plus, pedidos, flag, on_demand, store session, deploy.

## Autorización

```txt
PRODUCTION_PROJECT_REF=pkrsedmwxekbhlohhqds
CONFIRM_IS_PRODUCTION=yes
PILOT_BUSINESS_SLUG=demohamburgueseria
AUTORIZO_GROUP_NAMING_READ_ONLY=yes
AUTORIZO_UPDATE_CUSTOMIZATION_GROUP_NAMES=yes
```

Sin `AUTORIZO_CREATE_GROUP_NAMING_QA_ORDER` → no se creó pedido.

## Estado live inicial

| Campo | Valor |
|-------|--------|
| business_id | `e21b8fc2-3016-4dec-92ef-ebb04e58ecdf` |
| `product_customization_enabled` | true |
| `on_demand_mode_active` | true |
| `has_open_session` | true |

## Precheck local

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS (`BUILD_EXIT=0`) |

## Precheck remoto SQL

Flags + sesión open: **PASS**.

## Snapshot previo

| id | name | required | type | max | description |
|----|------|----------|------|-----|-------------|
| `8c567d13-e666-4d34-9f4b-e76bdd73fbd2` | Papas | yes | single | 1 | Elegí el tamaño de las papas |
| `a65af6ca-763b-42b3-8417-d4c88f51a2c7` | Aderezos | no | multiple | 5 | Elegí tus aderezos |
| `aa992971-1411-42a6-a015-2edafdf1a170` | Extras | no | multiple | 5 | Elegí entre nuestros extras para sumar |

## Criterio de naming

| Grupo | Decisión | Motivo |
|-------|----------|--------|
| Papas | Mantener | Simple y directo |
| Aderezos → **Salsas** | Aplicar | Opciones BBQ / Salsa Big Mac; más comercial |
| Extras → **Agregados extra** | Aplicar | Comunica ingredientes que suman precio |

## Cambios aplicados

`2026-07-16 11:26:43 UTC`:

```sql
update customization_groups
set name = 'Salsas', updated_at = now()
where id = 'a65af6ca-763b-42b3-8417-d4c88f51a2c7'
  and business_id = 'e21b8fc2-3016-4dec-92ef-ebb04e58ecdf';

update customization_groups
set name = 'Agregados extra', updated_at = now()
where id = 'aa992971-1411-42a6-a015-2edafdf1a170'
  and business_id = 'e21b8fc2-3016-4dec-92ef-ebb04e58ecdf';
```

Estado post-write:

| name | notes |
|------|-------|
| Papas | unchanged |
| Salsas | was Aderezos |
| Agregados extra | was Extras |

Opciones/precios/assignments intactos. Descriptions de grupo **no** actualizadas (sin auth de descriptions) — siguen “Elegí tus aderezos” / “Elegí entre nuestros extras…”.

## Cambios no aplicados

- Descriptions de grupo
- Precios / required / min / max / sort
- Assignments / plus / pedido QA
- Renombre Papas

## Browser QA catálogo

PASS: sin 500; hero comercial sin QA; Doble Smash “Desde $…”.

## Browser QA modal

PASS: headings **Papas / Salsas / Agregados extra**; Cheddar + Salsa Big Mac; precios OK.

## Browser QA cart V2

PASS (local):

```txt
Papas: Papas chicas
Salsas: Salsa Big Mac (+$250)
Agregados extra: Cheddar (+$500)
Total $13.250
```

Cart limpiado al final.

## Browser QA checkout pre-submit

PASS: resumen con Salsas / Agregados extra; sin “no está aceptando pedidos”; no se envió pedido.

## Dashboard QA

PASS: `#7D0A` / `#213F` visibles. Snapshots históricos conservan nombres viejos (esperado). Sin JSON raw.

## Estado final live

```txt
product_customization_enabled=true
on_demand_mode_active=true
store session open
Papas / Salsas / Agregados extra
opciones y precios intactos
```

## Reversión disponible

```sql
update customization_groups
set name = 'Aderezos', updated_at = now()
where id = 'a65af6ca-763b-42b3-8417-d4c88f51a2c7'
  and business_id = 'e21b8fc2-3016-4dec-92ef-ebb04e58ecdf';

update customization_groups
set name = 'Extras', updated_at = now()
where id = 'aa992971-1411-42a6-a015-2edafdf1a170'
  and business_id = 'e21b8fc2-3016-4dec-92ef-ebb04e58ecdf';
```

No ejecutada.

## Qué NO se tocó

Código, schema, migraciones, RLS, RPC, precios, opciones, assignments, plus, pedidos, flags, sesión, deploy.

## Validaciones CLI

| Check | Resultado |
|-------|-----------|
| tsc pre/post | PASS |
| build pre/post | PASS |

## Riesgos / deuda

| ID | Deuda |
|----|--------|
| G1 | Descriptions aún dicen “aderezos” / “extras” |
| G2 | Plus Bebidas vacío |
| G3 | Assignments solo 2 productos |
| G4 | OPTION-IMAGES-1 |
| G5 | Pedido QA con snapshot nuevo no creado |

## Resultado final

**PASS WITH DEBT**

Nombres de grupos pulidos. Product Customization sigue live. Deuda: descriptions, plus, assignments, imágenes.

## Próxima fase recomendada

1. Actualizar descriptions de Salsas / Agregados extra (auth descriptions).  
2. Poblar Plus Bebidas.  
3. Expandir assignments.  
4. Opcional ADMIN-UX-2 / OPTION-IMAGES-1.

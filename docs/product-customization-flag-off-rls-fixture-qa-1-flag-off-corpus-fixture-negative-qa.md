# PRODUCT-CUSTOMIZATION-FLAG-OFF-RLS-FIXTURE-QA-1 — Flag OFF Corpus Fixture Negative QA

## Objetivo

Cerrar la deuda de fixture creando un tenant QA no piloto con `product_customization_enabled=false` y corpus real, y demostrar que anon no puede leer esas filas mientras el piloto ON sigue funcionando.

## Contexto

- Deuda previa: `PRODUCT-CUSTOMIZATION-FLAG-OFF-RLS-QA-1 — PASS WITH FIXTURE DEBT`
- Public RLS hardening ya aplicado
- Piloto `demohamburgueseria` no tocado

## Alcance

Crear fixture QA + privileged/anon validation + browser smoke + docs. Sin migrations/código/deploy.

## Fuera de scope

Piloto flags/stock/pedidos · RLS/helper/código · migrations · deploy · delete fixture (no auth delete)

## Autorización

```txt
PRODUCTION_PROJECT_REF=pkrsedmwxekbhlohhqds
CONFIRM_IS_PRODUCTION=yes
AUTORIZO_PRODUCT_CUSTOMIZATION_FLAG_OFF_RLS_FIXTURE_QA_READ_ONLY=yes
AUTORIZO_CREATE_FLAG_OFF_RLS_QA_FIXTURE=yes
AUTORIZO_KEEP_FLAG_OFF_RLS_QA_FIXTURE=yes
AUTORIZO_PRODUCT_CUSTOMIZATION_FLAG_OFF_RLS_FIXTURE_QA_BROWSER_SMOKE=yes
```

Sin `AUTORIZO_DELETE_FLAG_OFF_RLS_QA_FIXTURE_AFTER_TEST`.

## Precheck local

```txt
tsc — PASS
build — PASS
```

## Auditoría schema

Columnas/constraints auditados vía `information_schema` / `pg_constraint`.

Notas:
- Trigger `create_default_business_settings()` inserta settings al crear business → no insertar settings manual; **UPDATE** después.
- `product_customization_enabled` default `false`
- `selection_type` ∈ {single, multiple}; assignment/upsell `target_type` ∈ {category, product}
- Override shape: `group` ⇒ group_id set, option_id null
- Products: `track_stock` default false; stock ≥ 0

## Diseño del fixture

Preferencia A: business dedicado `qa-rls-flag-off-customization`.

- `is_active=true` + corpus `is_available=true` para que el **único** gate negativo sea el flag
- `product_customization_enabled=false`
- `on_demand_mode_active=false`
- `track_stock=false` en productos fixture

## Fixture creado

| Campo | Valor |
|-------|-------|
| fixture_business_id | `59db34de-a48f-4fa8-b7fd-7ed5cc48d6c4` |
| fixture_slug | `qa-rls-flag-off-customization` |
| name | QA RLS Flag OFF Customization Fixture |
| product_customization_enabled | **false** |
| on_demand_mode_active | **false** |
| fixture_category_id | `ebb67cfb-eaf0-475d-bd8c-607d8748b837` |
| fixture_product_id | `cf6db112-cb10-467a-9947-60480eaf260f` (QA RLS OFF Burger) |
| fixture_upsell_product_id | `24cd1449-3514-430b-a62b-90714c40d0eb` (QA RLS OFF Drink) |
| fixture_group_id | `1e6cd71b-58fa-436e-aeaf-a856de3bbba8` |
| fixture_option_id | `4f2ce494-c1ba-4c4e-8449-2e8e69df2497` |
| fixture_assignment_id | `9d68f30f-81b8-4495-98d9-024a1044d950` |
| fixture_override_id | `d08a0a85-4013-4e70-ba5c-c1d90fcac059` |
| fixture_upsell_group_id | `921cca38-8eba-465d-b92a-4bb3aa209e7e` |
| fixture_upsell_item_id | `6457581d-5be1-4c23-bf31-c981cfb8b082` |

## Verificación privileged read

Counts (SQL): categories=1 · products=2 · groups=1 · options=1 · assignments=1 · overrides=1 · upsell_groups=1 · upsell_items=1.

## Validación helper

```txt
fixture → false
piloto → true
UUID random → false
```

## Validación anon business_settings

Fixture y piloto: **0** rows.

## Validación anon corpus fixture flag OFF

| Query | Count |
|-------|------:|
| customization_groups by business_id | **0** |
| upsell_groups by business_id | **0** |
| customization_options by option id | **0** |
| assignments by assignment id | **0** |
| upsell_group_items by item id | **0** |
| overrides by override id | **0** |
| helper RPC | false |

Privileged confirma filas; anon no las ve → **negación RLS real**.

## Validación anon control positivo piloto ON

| Recurso | Count |
|---------|------:|
| customization_groups | 3 |
| customization_options | 11 |
| upsell_groups | 1 |
| upsell_group_items | 1 |
| business_settings | 0 |
| helper | true |

## Browser smoke fixture OFF

`/b/qa-rls-flag-off-customization/catalogo` → **Página no encontrada** (aceptable; negocio sin landing/catálogo público activo).

## Browser smoke piloto ON

Catálogo OK · modal Doble Smash · Papas/Salsas/Agregados · **Sumá una bebida** · Coca +$3000 · sin pedido.

## Verificación de no impacto en piloto

Coca: price 3000 · stock **4** · available · track_stock true.  
Pending QA: **0**.

## Limpieza / persistencia del fixture

**KEEP** autorizado. Fixture permanece para regresiones futuras. No delete.

## Hallazgos

1. Fixture no piloto con corpus real + flag OFF creado.
2. Anon no lee ninguna fila del corpus fixture pese a `is_available=true` / `is_active=true`.
3. Piloto ON intacto (anon corpus + Plus UI).
4. Trigger de settings default documentado (insert business → update settings).

## Riesgos / deuda

- Fixture catálogo 404 (sin on_demand/landing) — esperado.
- Fixture persistente en prod: identificar por slug `qa-rls-flag-off-customization`; no mezclar con operación real.

## Qué NO se tocó

Código · schema/RLS/helper · migrations · deploy · piloto flags/stock/pedidos · delete fixture.

## Validaciones CLI

```txt
npx tsc --noEmit — PASS
npm run build — PASS
```

## Resultado final

```txt
PASS
```

Se creó un fixture no piloto con Product Customization flag OFF y corpus real. La lectura privilegiada confirma que existen filas, pero anon no puede leerlas por RLS. El piloto flag ON sigue funcionando y business_settings permanece cerrado para anon.

## Próxima fase recomendada

- Reusar este fixture en futuras regresiones RLS.
- Monitor operación real del piloto.
- Opcional: cleanup fixture solo con auth delete explícita.

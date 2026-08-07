# PRODUCT-CUSTOMIZATION-FLAG-OFF-RLS-QA-1 — Flag OFF Public RLS Negative QA

## Objetivo

Validar el caso negativo del hardening RLS público: con `product_customization_enabled` no true, anon no debe leer corpus customization/upsell; `business_settings` sigue cerrado; el piloto ON sigue funcionando.

## Contexto

- Últimas fases: PUBLIC-RLS-HARDENING-1 PASS · PILOT-MONITOR-2 PASS
- Piloto `demohamburgueseria` flag ON — no tocado
- Sin auth de fixture write / toggle flag

## Alcance

Read-only SQL, anon REST, browser smoke (flag OFF si aplica + piloto ON), docs.

## Fuera de scope

Writes, fixture creation, toggle flags, migrations, deploy, pedidos, stock.

## Autorización

```txt
PRODUCTION_PROJECT_REF=pkrsedmwxekbhlohhqds
CONFIRM_IS_PRODUCTION=yes
AUTORIZO_PRODUCT_CUSTOMIZATION_FLAG_OFF_RLS_QA_READ_ONLY=yes
AUTORIZO_PRODUCT_CUSTOMIZATION_FLAG_OFF_RLS_QA_BROWSER_SMOKE=yes
```

Sin `AUTORIZO_CREATE_FLAG_OFF_RLS_QA_FIXTURE` · sin toggle flag.

## Precheck local

```txt
tsc — PASS
build — PASS
```

## Auditoría RLS actual

- Helper `is_public_product_customization_enabled(uuid)` — SECURITY DEFINER, returns boolean
- Public SELECT customization/upsell: `uses_helper=true`
- `business_settings` SELECT: solo “miembros del negocio” — sin SELECT público anon

## Tenant flag OFF seleccionado

Inventario de businesses:

| slug | flag / settings | groups | upsell | helper |
|------|-----------------|-------:|-------:|--------|
| demohamburgueseria | true | 3 | 1 | true |
| roticeriajuan | **sin business_settings** | 0 | 0 | **false** |
| majopasteleria | **sin business_settings** | 0 | 0 | **false** |

**No existe** tenant con `product_customization_enabled=false` **y** corpus customization/upsell real.

Fixtures usados para negación parcial: `roticeriajuan` / `majopasteleria` (helper false, sin settings, sin corpus).

## Validación helper

```txt
piloto e21b8fc2-… → true
roticeriajuan 9be9757f-… → false
majopasteleria a9b41e85-… → false
UUID inexistente → false
```

## Validación anon business_settings

Anon REST: count=0 para piloto, off1 y off2.

## Validación anon corpus flag OFF

Para `roticeriajuan` y `majopasteleria`:

| Tabla | Count |
|-------|------:|
| customization_groups | 0 |
| customization_options | 0 |
| upsell_groups | 0 |
| upsell_group_items | 0 |

**Limitación:** esos tenants no tienen filas de corpus; no se pudo probar que RLS oculte filas existentes con flag OFF.

## Validación anon control positivo piloto ON

| Recurso | Count |
|---------|------:|
| business_settings | 0 |
| customization_groups | 3 |
| customization_options | 11 |
| upsell_groups | 1 |
| upsell_group_items | 1 |
| helper | true |

## Browser smoke flag OFF

`/b/roticeriajuan/catalogo` → Página no encontrada  
`/b/majopasteleria/catalogo` → Página no encontrada  

**No aplicable** (sin catálogo público activo). No se cambiaron flags/sesión.

## Browser smoke piloto ON

Catálogo OK · modal Doble Smash · Papas/Salsas/Agregados · **Sumá una bebida** · Coca +$3000 · sin pedido.

## Verificación de no writes

- Sin migrations nuevas de esta fase
- Sin deploy
- Sin pedidos/stock/flags/settings tocados
- Solo docs locales

## Hallazgos

1. Helper fail-closed para tenants sin settings / flag no true.
2. `business_settings` cerrado a anon.
3. Piloto ON sigue exponiendo corpus y Plus UI.
4. **Deuda de fixture:** no hay tenant flag OFF con corpus real para negación completa de rows existentes.

## Riesgos / deuda

- Para cerrar PASS pleno: fixture no productivo con customizations/upsells + flag false (requiere auth write explícita), o toggle temporal de un tenant no piloto no productivo.
- Browser smoke flag OFF no ejecutable (404).

## Qué NO se tocó

Código, schema, RLS, flags (piloto y demás), stock, pedidos, deploy, fixture writes.

## Validaciones CLI

```txt
npx tsc --noEmit — PASS
npm run build — PASS
```

## Resultado final

```txt
PASS WITH FIXTURE DEBT
```

El helper y `business_settings` cerrado fueron validados; el control positivo del piloto ON pasó. No se encontró tenant flag OFF con corpus real para probar negación completa de filas existentes.

## Próxima fase recomendada

- Con auth explícita: crear fixture flag-OFF mínimo (no piloto) con 1 group/option/upsell y re-correr negación anon + UI.
- Alternativa: monitor operación real del piloto.

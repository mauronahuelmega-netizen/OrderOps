# PRODUCT-CUSTOMIZATION-PLUS-COPY-POLISH-1 — Customer-facing Plus Copy Alignment

## Objetivo

Alinear el copy público de la sección Plus / venta sugerida para que el cliente entienda que está sumando una bebida adicional al personalizar su producto — sin tocar lógica de checkout, stock ni DB.

## Contexto

- Fase previa: `PRODUCT-CUSTOMIZATION-PLUS-UI-DEPLOY-1` → **PASS**
- Plus Bebidas live en Doble Smash; Coca Cola 500ml upsell OK; stock/restock ya validados
- Copy inconsistente: título hardcodeado “También podés sumar”, descripción DB “Sumá una bebida a tu burguer”, fallback al nombre DB `Bebidas`, carrito/checkout con prefijo `+`

## Alcance

- Helper de copy público
- Modal personalización (sección upsell)
- Cart sheet + checkout summary (label “Adicional”)
- Docs / CURRENT_PHASE / living memory
- Deploy + smoke visual (sin pedido QA)

## Fuera de scope

- Schema / migrations / RLS / service-role corpus
- `create_order` / `transition_order_status` / stock
- Cambios a `upsell_groups` / productos en DB
- Pedidos QA obligatorios
- Dashboard admin badge “Plus” (queda)

## Autorización

```txt
AUTORIZO_PRODUCT_CUSTOMIZATION_PLUS_COPY_POLISH_LOCAL=yes
PRODUCTION_PROJECT_REF=pkrsedmwxekbhlohhqds
CONFIRM_IS_PRODUCTION=yes
PILOT_BUSINESS_SLUG=demohamburgueseria
AUTORIZO_PRODUCT_CUSTOMIZATION_PLUS_COPY_POLISH_READ_ONLY=yes
AUTORIZO_DEPLOY_PRODUCT_CUSTOMIZATION_PLUS_COPY_POLISH_TO_VERCEL=yes
```

Sin auth de pedido QA → no se crea pedido.

## Precheck local

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |

## Auditoría de copy actual

| Superficie | Archivo | Antes | Origen |
|------------|---------|-------|--------|
| Modal título | `customization-modal.tsx` | “También podés sumar” | Frontend hardcode |
| Modal descripción | idem | DB `description` o fallback `name` (`Bebidas`) | DB + frontend |
| Opción precio | idem | `$ 3.000,00` | Frontend |
| Carrito child | `cart-sheet.tsx` | `+ Coca Cola 500ml $…` | Frontend |
| Checkout child | `checkout-client.tsx` | `+ Coca Cola 500ml $…` | Frontend |
| Dashboard | `order-products-list.tsx` | badge `Plus` | Admin only — sin cambio |

DB intacta: grupo `Bebidas`, description `Sumá una bebida a tu burguer`.

## Copy objetivo

| Contexto | Copy |
|----------|------|
| Modal (bebidas) | Título **Sumá una bebida** · Helper **Agregá una bebida a tu pedido.** |
| Modal fallback | **También podés sumar** · **Agregá un adicional a tu pedido.** |
| Opción | `Coca Cola 500ml` · `+$3.000` (formato moneda) |
| Carrito / checkout | Label **Adicional** · línea `Coca Cola 500ml +$…` |

## Implementación

- Nuevo: `lib/product-customization/upsell-copy.ts`
  - `getUpsellGroupCopy(name)` (detecta “bebida”)
  - `UPSELL_ASSOCIATED_LABEL = "Adicional"`
  - `formatUpsellOptionPrice` / `formatUpsellAssociatedLine`
- Wiring: modal, cart-sheet (+ `.module.css` label), checkout-client
- Dashboard admin sin cambios

## Validación local

- `tsc` / `build` PASS tras cambios
- Smoke browser en prod post-deploy (equivale a validación del bundle desplegado)

## Auditoría producción previa

| Check | Resultado |
|-------|-----------|
| Coca Cola 500ml | stock=4, available, track_stock, price=3000 |
| Upsell group | `Bebidas` → Doble Smash, available |
| Datos modificados | No |

## Deploy

Documentado tras push (commit hash / URL / status).

## Smoke producción

Validar `/b/demohamburgueseria/catalogo` → Doble Smash modal → carrito → checkout visual.

## Pedido QA opcional

No ejecutado (sin auth / no necesario).

## Browser sanity final

Dashboard / products / catálogo / modal — post-deploy.

## Compatibilidad legacy

- Productos sin upsell sin cambio
- Admin “Plus” badge intacto
- Lógica cart parent+child intacta

## Qué NO se tocó

Schema, RPC, RLS, service corpus, stock, flags, sesión, pedidos, `upsell_groups` DB

## Validaciones CLI

`tsc` PASS · `build` PASS

## Riesgos / deuda

- Copy de bebidas se deriva del nombre del grupo (`includes("bebida")`); grupos mal nombrados caen al fallback genérico
- Checkout summary sigue con algunos estilos inline previos (no refactor de layout)

## Rollback plan

- Revertir commit de copy polish
- No tocar DB/RPC/stock
- Verificar modal/catálogo

## Resultado final

Pendiente de deploy/smoke — se completa en cierre de fase.

## Próxima fase recomendada

- Opcional: hardening RLS public/`business_settings`
- Opcional: monitor piloto customization + stock

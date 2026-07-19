# PRODUCT-CUSTOMIZATION-ADMIN-COPY-POLISH-1 — Owner-Friendly Premium Copy Polish

## Objetivo

Pulir el copy owner-facing de `/admin/products/customizations` para que suene claro, confiable y premium — sin cambiar layout ni lógica operativa.

## Contexto

Nace de **PRODUCT-CUSTOMIZATION-ADMIN-V1-POLISH-MONITOR-1** (`NEEDS POLISH`, score 3.1/5). P1 de copy: “Desactivar”. Deuda adicional: Preview, Herencia, Origen, Min/Max. Esta fase **no** resuelve hierarchy/responsive/exceptions/assignments compact.

## Alcance

- Copy visible, labels, helpers, chips, botones, aria-labels, títulos/subtítulos en admin Product Customization.
- Rutas: `/admin/products/customizations` (+ `?product=`).
- Smoke público de no regresión (sin confirmar pedido).

## Fuera de scope

Layout, compactación, actions/DB/RLS, cart/checkout/stock, flags, semántica visible/oculto/min/max/overrides, query param de excepciones.

## Autorización

```txt
AUTORIZO_PRODUCT_CUSTOMIZATION_ADMIN_COPY_POLISH_LOCAL=yes
AUTORIZO_PRODUCT_CUSTOMIZATION_ADMIN_COPY_POLISH_BROWSER_QA=yes
AUTORIZO_DEPLOY_PRODUCT_CUSTOMIZATION_ADMIN_COPY_POLISH_TO_VERCEL=yes
```

## Precheck local

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS (pre y post) |

## Auditoría de copy

Archivos tocados (solo strings UI):

| Archivo | Foco |
|---------|------|
| `page.tsx` | Descripción del módulo |
| `owner-customization-builder.tsx` | Tabs, producto/categoría, excepciones, aria |
| `admin-customization-live-preview.tsx` | Vista previa (sin “Preview”) |
| `product-customization-overrides-panel.tsx` | Desactivar → Ocultar; Herencia/Origen |
| `customization-assignments-section.tsx` | Empty category + helpers |
| `reusable-sections/*` | Chips Mín., menús, modal selección |
| `plus-suggestions/*` | Menús Mostrar/Ocultar para clientes |
| `sortable-reorder-list.tsx` | Aria mover arriba/abajo |

## Reemplazos aplicados

| Actual | Nuevo | Razón UX |
|--------|-------|----------|
| Desactivar / Desactivar para este producto | Ocultar / Ocultar para este producto | Evita miedo destructivo |
| Desactivado aquí / Activo | Oculta aquí / Visible | Consistencia Visible/Oculta |
| Restaurar grupo | Mostrar para este producto | Simétrico con ocultar |
| Herencia por categoría… | Ajustes propios… / Excepciones del producto | Owner-friendly |
| Origen: Categoría/Producto | Aplicado desde: la categoría / este producto | Claridad |
| Preview interactiva… | Vista previa del cliente… | Sin mezcla EN/ES |
| Así lo verá el cliente | Vista previa del cliente | Vocabulario unificado |
| Min N | Mín. N | Menos críptico |
| Ocultar sección/plus/opción | Ocultar para clientes | Vocabulario único |
| Gestionar excepciones | Excepciones del producto | Menos técnico |
| Acciones de X | Abrir menú de sección/opción/plus… | A11y copy |
| Subir/Bajar X | Mover X hacia arriba/abajo | A11y copy |
| Tipo de selección Única/Múltiple | Cómo elige el cliente · Una/Varias opciones | Claridad |
| heredadas de su categoría | aplicadas desde su categoría | Evita “herencia” |
| Configurá qué puede elegir… | Configurá las opciones, extras y productos sugeridos… | Objetivo de producto |

### Ocurrencias intencionales / deuda

- Nombres internos de código (`upsellGroups`, `override_type`, form `name=`): no visibles.
- Mensajes de success en **server actions** (`Herencia del grupo restaurada.`, etc.): **no tocados** (prohibido cambiar actions) → COPY DEBT menor si el toast/mensaje aparece.
- Assignment row sigue usando “Ocultar/Mostrar” compacto (aceptable).
- Chips Única/Múltiple en cards (permitidos por guía).

## Por producto

- Subtítulo sin “heredadas”.
- CTA “Excepciones del producto”.
- Meta “plus sugerido: …”.
- Preview renombrada a “Vista previa del cliente”.

## Por categoría

- Helper de impacto automático.
- Empty: aclara que no incluye opciones solo por producto.
- Copy vacío assignments alineado.

## Secciones reutilizables

- Menú: Ocultar/Mostrar para clientes.
- Chip `Mín.`.
- Modal: Cómo elige el cliente; Mínimo/Máximo de opciones + helpers.

## Plus sugeridos

- Menú: Ocultar/Mostrar para clientes.
- Empty: “Sin productos sugeridos todavía”.
- Helper destino read-only ya era correcto; afinado “plus sugerido”.

## Vista previa admin

- Sin “Preview” en UI.
- Helpers: no agrega productos reales al carrito.
- incompleteHint: “vista previa”.

## Estados / empty / error copy

- Empty plus/categoría mejorados.
- Loading excepciones: “Cargando excepciones…”.
- Sin nuevo sistema de toasts.

## Accesibilidad copy

- Aria menús y reorder actualizados.
- Tablist: “Navegación de personalización”.

## Consistencia terminológica

Vocabulario unificado: Visible / Oculta · Mostrar/Ocultar para clientes · Vista previa · Secciones · Opciones · Plus sugeridos · Orden de aparición · Excepciones del producto · Precio adicional / Incluido.

## Validación local admin

- Página y tabs cargan.
- Sin “Desactivar” / “Preview” / “upsell” owner-facing.
- Menús muestran “Ocultar para clientes”.
- Vista previa del cliente OK (Doble Smash + Coca en preview).
- Dark theme verificado en sesión.

## Validación pública

- `/b/demohamburgueseria/catalogo` carga.
- Doble Smash presente; detalle/personalizar accesible.
- Sin cambios en código público → no regresión esperada.
- No se confirmó pedido.

## No side effects

Confirmado: sin migrations, schema, RLS, actions, cart/checkout, stock, flags, delete, cambios de semántica, cambios de `?product=`.

## Deploy

Autorizado. Commit + push a `main` (ver sección Deploy en respuesta / CURRENT_PHASE).

## Browser QA

Admin copy verificado en Por producto, Secciones (menús), Vista previa. Público: catálogo OK.

## Compatibilidad

Multi-tenant sin cambios. Flag customization intacto.

## Qué NO se tocó

DB, RLS, actions, public catalog components, cart/checkout, stock, layout/CSS estructural, hierarchy/responsive/exceptions UX (fases siguientes).

## Validaciones CLI

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |

## Riesgos / deuda

1. Mensajes action “Herencia…” si se muestran tras restore (fase actions copy o COPY DEBT).
2. P1 hierarchy/responsive/exceptions/assignments compact siguen abiertos del monitor.
3. Chips Min/Máx aún densos (hierarchy polish).

## Rollback plan

Revertir commit de copy; sin migraciones ni datos.

## Resultado final

**PASS** (con COPY DEBT menor documentado en messages de actions no tocados).

## Próxima fase recomendada

**PRODUCT-CUSTOMIZATION-ADMIN-HIERARCHY-POLISH-1** (hints categoría↔producto, chips) o **PRODUCT-CUSTOMIZATION-ADMIN-EXCEPTIONS-UX-1**.

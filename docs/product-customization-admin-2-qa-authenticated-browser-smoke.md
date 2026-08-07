# PRODUCT-CUSTOMIZATION-ADMIN-2-QA — Authenticated Browser Smoke

## Objetivo

Validar en navegador, con sesión admin/owner, que ADMIN-2 (assignments, overrides, upsell) funciona sin activar el feature flag ni alterar catálogo/carrito/checkout/dashboard.

**Fecha:** 2026-07-12  
**Resultado final:** **PASS WITH DEBT**

---

## Contexto

| Fase | Resultado |
|------|-----------|
| ADMIN-2 implementación | PASS WITH DEBT |
| Esta fase (browser smoke) | PASS WITH DEBT |

Flag `product_customization_enabled` permanece **off**. Sin cambios de código, migraciones, deploy ni activación de flag.

Fuentes leídas: `docs/product-customization-admin-2-assignments-overrides-upsell.md`, ADMIN-1, SPEC-1, FLAG-1, `docs/CURRENT_PHASE.md`.

---

## Entorno

| Item | Valor |
|------|--------|
| Base URL | `http://localhost:3000` |
| Dev server | Ya corriendo (no se levantó otro; no se usó 3010) |
| Browser | Cursor IDE browser MCP |
| Negocio | La Burguesía (`demohamburgueseria`) |
| Stamp QA | `20260712-1726` |

---

## Usuario / rol usado

- Sesión autenticada **admin/owner** (demo La Burguesía)
- Acceso a `/admin/dashboard` sin auth loop ni 500
- Contraseña **no** documentada

---

## Precheck

| Check | Resultado |
|-------|-----------|
| `localhost:3000` responde (browser) | PASS |
| Sesión admin | PASS |
| `npm run dev` | No ejecutado (servidor ya up) |
| `tsc` / `build` | No re-ejecutados (baseline ADMIN-2) |

---

## Ruta principal

`http://localhost:3000/admin/products/customizations`

| Check | Resultado |
|-------|-----------|
| Carga sin 500 | PASS |
| Header “Opcionales y extras” | PASS |
| Aviso feature flag apagado | PASS |
| Sección Grupos y opciones | PASS |
| Sección Assignments | PASS |
| Sección Plus/Upsell | PASS |
| Sin UI pública | PASS |
| Sin toggle para activar flag | PASS |

---

## Grupos y opciones

Creados:

- Grupo: `QA ADMIN-2 Grupo 20260712-1726` (multiple, min 0, max 3, requerido no)
- Opción 0: `QA ADMIN-2 Opción 0 20260712-1726` — price_delta `0`
- Opción Plus: `QA ADMIN-2 Opción Plus 20260712-1726` — price_delta `250`

Persistencia tras refresh: PASS. ADMIN-1 dentro de la misma pantalla: PASS.

---

## Assignments categoría

| Paso | Resultado |
|------|-----------|
| Crear assignment → categoría **HAMBURGUESAS** | PASS |
| Listado bajo categoría | PASS |
| Persistencia refresh | PASS |
| Desactivar / reactivar | PASS |
| Duplicado | PASS — error: *Este grupo ya está asignado a ese destino.* (sin filas duplicadas) |

IDs: categoría `3ffbf1a8-e474-4143-a131-339b34535e06`, grupo `effed818-1b65-408a-9792-87d3987f61c8`.

---

## Assignments producto

| Paso | Resultado |
|------|-----------|
| Crear assignment → producto **BBQ Bacon** | PASS |
| Listado bajo producto | PASS |
| Persistencia | PASS |
| Toggle desactivar/reactivar | PASS |
| Sin duplicados visibles | PASS |

Producto id: `1b2421f8-a125-4d3d-ac0f-d1c910e14710`.

---

## Herencia en edit product

Desde `/admin/products` → edit **BBQ Bacon**:

| Check | Resultado |
|-------|-----------|
| Sección “Opcionales y extras” | PASS |
| Grupo + opciones visibles | PASS |
| Distinción herencia | PASS WITH DEBT — mismo grupo vía categoría + producto → Origen **Producto** (preferencia producto; no se muestra “Origen: Categoría” aparte para ese grupo) |
| Estado activo/desactivado | PASS |

---

## Override grupo

| Paso | Resultado |
|------|-----------|
| Desactivar grupo para este producto | PASS |
| Persistencia | PASS |
| Restaurar | PASS |
| Vuelve a herencia activa | PASS |

---

## Override opción

| Paso | Resultado |
|------|-----------|
| Desactivar opción para este producto | PASS |
| Persistencia | PASS |
| Restaurar | PASS |

---

## Upsell categoría

| Paso | Resultado |
|------|-----------|
| Crear `QA ADMIN-2 Upsell Categoría 20260712-1726` → HAMBURGUESAS | PASS |
| Agregar item **Coca Cola 500ml** (`2e6b2b3b-…`) | PASS |
| Persistencia | PASS |
| Toggle item / grupo | PASS |

---

## Upsell producto

| Paso | Resultado |
|------|-----------|
| Crear `QA ADMIN-2 Upsell Producto 20260712-1726` → BBQ Bacon | PASS |
| Agregar sugerido Coca Cola 500ml | PASS |
| Self-upsell (BBQ → BBQ) | PASS — BBQ Bacon **excluido** del select de sugeridos del upsell de producto |
| Persistencia | PASS |

---

## Regla 1 upsell activo por target

Segundo upsell activo misma categoría HAMBURGUESAS:

- Error claro: *ya tiene un grupo de plus… (máximo 1 por destino)*
- No aparece segundo heading activo
- UI no se rompe

**PASS** (enforcement vía unique DB: 1 fila/target, más estricto que “1 activo”).

---

## Feature flag

| Check | Resultado |
|-------|-----------|
| Banner “Product Customization está apagado…” | PASS |
| Badge “apagado” | PASS |
| Sin toggle de activación | PASS |
| No se activó el flag | PASS |

---

## Rutas fuera de scope

| Ruta | Resultado |
|------|-----------|
| `/admin/dashboard` | PASS — carga; lanes/pedidos normales; sin UI customization |
| `/b/demohamburgueseria/catalogo` | PASS — catálogo carga; cards Agregar/Ver detalle; sin modal customization; sin pricing “Desde” nuevo por esta fase |

`create_order` no se tocó (sin cambios de código en esta fase).

---

## Responsive QA

| Viewport | Overflow horizontal | Usabilidad |
|----------|---------------------|------------|
| 1440px | 0px | PASS |
| 390px | 0px | PASS — formularios/cards legibles; botones accesibles |

---

## Datos QA creados/desactivados/restaurados

### Creados (stamp `20260712-1726`)

| Tipo | Nombre |
|------|--------|
| Grupo | QA ADMIN-2 Grupo 20260712-1726 |
| Opciones | Opción 0 / Opción Plus |
| Assignment categoría | → HAMBURGUESAS |
| Assignment producto | → BBQ Bacon |
| Upsell categoría | QA ADMIN-2 Upsell Categoría 20260712-1726 + item Coca Cola 500ml |
| Upsell producto | QA ADMIN-2 Upsell Producto 20260712-1726 + item Coca Cola 500ml |

### Desactivados al cierre

- Grupo QA + ambas opciones
- Assignments categoría y producto
- Upsell categoría + item
- Upsell producto (+ item desactivado vía flujo de limpieza)

### Overrides

- Overrides de grupo y opción en BBQ Bacon: **restaurados** durante QA 6/7
- No quedó override activo accidental documentado

### Residual

Datos QA quedan en DB en estado **desactivado** (soft), sin hard delete (comportamiento esperado V1).

---

## Bugs encontrados

Ningún bug funcional **FAIL**.

Notas no bloqueantes:

1. Con el mismo grupo asignado a categoría y producto, el panel de herencia muestra Origen **Producto** (diseño: product gana). No se valida visualmente “solo categoría” en ese escenario.
2. Regla upsell = 1 fila/target (unique), no solo “1 activo” — alineado a ADMIN-2 debt.

---

## Validaciones ejecutadas

1. Ruta principal + banner flag  
2. CRUD grupo/opciones QA  
3. Assignment categoría + toggle + duplicado  
4. Assignment producto + toggle  
5. Herencia en edit product  
6. Override grupo disable/restore  
7. Override opción disable/restore  
8. Upsell categoría + item  
9. Máx. 1 upsell por target  
10. Upsell producto + self-block UI  
11. Flag off  
12. Catálogo + dashboard sin cambios públicos  
13. Responsive 1440 / 390  
14. Limpieza soft-deactivate  

---

## Resultado final

**PASS WITH DEBT**

Core funcional PASS. Deuda: datos QA soft-desactivados residuales; herencia “solo categoría” no aislada cuando hay assignment dual; unique upsell 1 fila/target (conocido); usuario sin permiso no probado.

---

## Deuda restante

- Soft-delete residual de filas QA (`20260712-1726`)
- Smoke de rol sin permiso (viewer/operator) no ejecutado
- Unique upsell más estricto que “1 activo” (deuda ADMIN-2)
- Conectar público detrás del flag (**PUBLIC-1**) — fuera de esta fase

---

## Próxima fase recomendada

**PRODUCT-CUSTOMIZATION-PUBLIC-1** — conectar catálogo/modal público **detrás** de `product_customization_enabled`, sin activar el flag en tenants demo hasta rollout autorizado.

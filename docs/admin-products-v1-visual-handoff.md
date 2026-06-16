# Admin Products V1 — Visual Alignment Handoff

## Resumen ejecutivo

**Admin Products V1 Visual Alignment = Ready for staging QA**

El epic alinea `/admin/products` al lenguaje visual enterprise del dashboard V1.0 mediante polish presentacional acotado (P1 → P2A → P2B → P2C → **P2D**), **sin cambiar** lógica de productos, server actions, DB, filtros URL, forms ni flyout behavior.

**Validaciones automáticas:** build, typecheck, lint pasan (P2F, 2026-06-06).  
**QA manual staging:** **pendiente** — P2F intentó browser local; redirect a login sin credenciales. No se inventan resultados visuales.

**Estado P2D:** ✅ **ejecutada** (responsive/mobile polish). Código cerrado; validación visual en dispositivo pendiente.

---

## Estado actual

| Área | Estado |
|------|--------|
| Page shell / ancho | ✅ P2A — `operational` 1600px |
| Header | ✅ P2A — compacto + acciones |
| Toolbar | ✅ P2B — enterprise filter console |
| Data surface (desktop table) | ✅ P2C — `.dataSurface` integrada |
| Mobile cards / responsive | ✅ **P2D código** / ⚠️ **QA manual staging pending** |
| Forms / flyout visual | ⚠️ Sin polish (DEFER) |
| Functional / DB | ✅ Sin cambios intencionales |

---

## Arquitectura visual final

```txt
AdminShell
└─ admin-shell__page-container (max-width 1600px cuando operational)
   └─ AdminPageLayout --operational
      ├─ AdminPageHeader --operational
      │    eyebrow: Catálogo
      │    title: Productos (1.5rem desktop)
      │    description: Gestioná el catálogo público...
      │    actions: ProductsHeaderActions
      │         [+ Nuevo producto] [Ver catálogo]
      └─ DashboardShell (products)
           ├─ ProductsToolbar
           │    summary: N productos · M categorías
           │    search + filtersCluster (categoría/stock/estado/limpiar)
           └─ ProductCatalogSection
                ├─ ≥900px: ProductTableView
                │    .dataSurface → table + paginationEmbedded
                └─ <900px: ProductGridServer + ProductCard (P2D compact admin)
      └─ AdminFooter compact (global, AdminShell)
```

---

## Componentes principales

| Componente | Rol visual | Fase |
|------------|------------|------|
| `AdminPageLayout` | Ritmo + operational width | P2A |
| `AdminPageHeader` | Header compact opt-in `variant="operational"` | P2A |
| `ProductsHeaderActions` | CTAs primarios en header | P2A |
| `ProductsToolbar` | Consola filtros | P2B |
| `ProductsToolbarSkeleton` | Loading toolbar | P2B |
| `ProductTableView` | Data surface desktop | P2C |
| `ProductPagination` | Paginación integrada shell | P2C |
| `ProductCatalogEmptyState` | Empty filtros en data shell | P2C |
| `ProductCatalogSkeleton` | Skeleton table + mobile catalog | P2C/P2D |
| `ProductGridServer` | Grid mobile/tablet por categorías | P2D |
| `ProductCard` | Card admin compacta &lt;900px | P2D |
| `DashboardShell` | Columna toolbar + content | P2A/P2B |

---

## Contratos preservados

### URL query params (no cambiar nombres)

```txt
q            — búsqueda (debounce 300ms)
categoryId   — filtro categoría
stock        — out | low | in
status       — active | inactive
page         — paginación
```

### Comportamiento funcional

- `+ Nuevo producto` → `openCreateProduct()` / flyout create
- Kebab / `MoreHorizontal` → `openEditProduct(id, name)`
- `Ver catálogo` → `/b/{businessSlug}/catalogo`
- Toggle estado → `setProductAvailabilityAction` + optimistic UI
- Limpiar filtros → navegar a pathname sin query

---

## Archivos clave

```txt
app/admin/(protected)/products/page.tsx          — composición
app/admin/(protected)/products/loading.tsx       — loading state

components/admin/admin-page-header.tsx           — variant operational
components/admin/admin-page-header.css           — responsive ≤899px (P2D)
components/admin/admin-page-layout.css

components/admin/products/products-header-actions.tsx
components/admin/products/products-header-actions.module.css  — P2D responsive
components/admin/products/products-toolbar.tsx
components/admin/products/products-toolbar.module.css         — P2D responsive
components/admin/products/dashboard-shell.module.css
components/admin/products/product-table-view.tsx
components/admin/products/product-table-view.module.css
components/admin/products/product-pagination.tsx
components/admin/products/product-pagination.module.css       — P2D responsive
components/admin/products/product-grid-server.tsx             — P2D compact header
components/admin/products/product-grid.module.css
components/admin/products/product-card.tsx
components/admin/products/product-card.module.css
components/admin/products/product-catalog-views.tsx
components/admin/products/product-catalog-empty-state.tsx
components/admin/products/product-catalog-skeleton.tsx
```

**Fuera de scope V1 visual (sin polish forms/flyout):**

```txt
components/admin/products/create-product-form.tsx
components/admin/products/edit-product-form.tsx
components/admin/products/flyout-panel.tsx
components/admin/products/product-availability-toggle.tsx
lib/products/*
app/admin/(protected)/products/actions.ts
```

---

## Qué se logró

| Entrega | Detalle |
|---------|---------|
| P1 | Audit, gaps vs dashboard, maqueta, contrato admin page |
| P2A | Operational width, header compacto, acciones en header, copy actualizado |
| P2B | Toolbar canvas, search icon, filters cluster, emoji tooltip removido |
| P2C | Data surface, row polish, MoreHorizontal kebab, pagination embedded |
| P2D | Responsive/mobile: header, acciones, toolbar, catalog shell, cards, paginación, skeleton |
| P2F | QA doc-only, validaciones automáticas, handoff actualizado, clasificación deuda |

Documentación por fase en `docs/admin-products-*.md`. **Cierre QA:** `docs/admin-products-phase-p2f-final-cross-device-qa-handoff.md`.

---

## Qué NO se tocó

- Database / schema / Supabase migrations
- `app/admin/(protected)/products/actions.ts`
- Product queries en `lib/products/*`
- Create/edit forms y flyout logic
- Dashboard, kanban, sidebar, AdminFooter
- Theme tokens / `globals.css`
- Checkout público
- Realtime / hydration

---

## Deuda pendiente

### Staging QA (prioridad inmediata)

- QA manual desktop vs dashboard (checklist P2F §7)
- QA mobile ~390px / ~375px (checklist P2F §8)
- QA tablet 768–899 / 900–1199 (checklist P2F §9)
- QA functional 14 flujos (checklist P2F §10)
- Validar mobile &lt;360px en dispositivo real

### Prioridad media (P3)

- Toggle estado → pill/badge enterprise
- Stock badges en fila
- SKU show-on-hover
- Loading skeleton acciones header

### DEFER

- Shared `AdminToolbarSurface` / `AdminDataSurface`
- Forms/flyout visual pass
- `no-img-element` en dropzone forms (2 warnings products; 16 total repo)
- Extender `AdminPageHeader operational` a categories/team/kitchen

---

## Riesgos conocidos

1. **Aceptación V1 condicionada** a staging QA pass — P2F no ejecutó QA manual autenticada.
2. **Acoplamiento CSS** — `ProductCatalogEmptyState` importa styles de `product-table-view.module.css`.
3. **Breakpoint 900px** — tablet 768–899px ve grid cards; dashboard usa otros breakpoints.
4. **Métricas duplicadas** — toolbar summary + bloque Catálogo mobile (compactado, no eliminado).

---

## Próximas fases sugeridas

```txt
1. Staging QA manual — checklist P2F (promover a ACCEPTED si pass)
2. P3 — Status pills, stock badges, SKU polish
3. DEFER — Shared admin surfaces extraction
4. Roadmap — Cash Closing / Session Reports
```

---

## Checklist para futuros agentes

Antes de modificar `/admin/products`:

- [ ] Leer este handoff + `docs/admin-products-phase-p2f-final-cross-device-qa-handoff.md`
- [ ] Confirmar si el cambio es visual-only o toca lógica (si lógica → fuera de scope polish)
- [ ] No mover `ProductsHeaderActions` de vuelta al toolbar
- [ ] No cambiar query param names
- [ ] No tocar `actions.ts` / `lib/products` en fases visuales
- [ ] Mantener `AdminPageLayout size="operational"` salvo decisión explícita cross-page
- [ ] Preservar breakpoint table/cards **900px** salvo spec explícita
- [ ] Limitar cambios responsive a media queries ≤899px para no romper desktop P2C
- [ ] Ejecutar `npm run build`, `npx tsc --noEmit`, `npm run lint` al cerrar fase
- [ ] Documentar deuda nueva en docs phase file

**Do NOT:**

- Revertir a `size="wide"` en products
- Restaurar tooltip emoji en toolbar
- Cambiar kebab a dropdown sin spec
- Declarar **ACCEPTED** / cross-device cerrado sin QA manual staging
- Decir que P2D está pendiente (ya ejecutada)

---

**Handoff date:** 2026-06-06 (P2F)  
**Related:** Board V1.0 `docs/board-orders-execution-area-v1-final-handoff.md`, Sidebar S1.1 `docs/admin-sidebar-enterprise-polish-s1-1.md`, P2F `docs/admin-products-phase-p2f-final-cross-device-qa-handoff.md`

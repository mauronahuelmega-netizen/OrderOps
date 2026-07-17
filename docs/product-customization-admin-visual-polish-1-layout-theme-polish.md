# PRODUCT-CUSTOMIZATION-ADMIN-VISUAL-POLISH-1 — Admin Customizations Layout & Theme Polish

## Objetivo

Cerrar visualmente `/admin/products/customizations` para alinearla con el shell admin actual (`/admin/products`, `/admin/dashboard`, `/admin/settings`): ancho disponible, tokens de theme, tabs, cards y preview — sin tocar lógica operativa.

## Contexto

Product Customization V1, Plus UI, copy polish, public RLS hardening y flag-OFF fixture QA están en PASS. El foco pasó de operativo a visual: la pantalla de customizations se veía más angosta/centrada que Products, con cards y tabs de estilo legacy y menor madurez visual.

## Alcance

- Layout / max-width del shell (`AdminPageLayout size="operational"`).
- Grid desktop/tablet/mobile del builder.
- Tokens de superficie/borde/texto en el CSS module del módulo.
- Header, tabs, cards, lista de productos, empty states y preview.
- Docs + `CURRENT_PHASE.md` + `ORDEROPS_LIVING_MEMORY.md`.

## Fuera de scope

- Schema / migrations / RLS / DB
- Server actions / Product Customization logic
- Catálogo público / cart / checkout / create_order
- Stock / restock / flags
- Pedidos QA / datos productivos

## Autorización

```txt
AUTORIZO_PRODUCT_CUSTOMIZATION_ADMIN_VISUAL_POLISH_LOCAL=yes
AUTORIZO_PRODUCT_CUSTOMIZATION_ADMIN_VISUAL_POLISH_BROWSER_QA=yes
AUTORIZO_DEPLOY_PRODUCT_CUSTOMIZATION_ADMIN_VISUAL_POLISH_TO_VERCEL=yes
```

## Precheck local

```txt
npx tsc --noEmit → PASS (exit 0)
npm run build → PASS (Next.js 16.2.9 / Turbopack)
```

Baseline: cambios previos de docs no relacionados no se corrigieron fuera de scope.

## Auditoría visual / CSS

### Qué limitaba el ancho

| Capa | Antes | Efecto |
|------|-------|--------|
| `AdminPageLayout size="wide"` | shell `max-width: 1280px` | más angosto que Products |
| `.layout` / `.builderShell` | `max-width: 1100–1280px` + `margin: 0 auto` | centrado angosto adicional |
| Products referencia | `size="operational"` → shell `1600px` vía `:has(.admin-page-layout--operational)` | ancho operativo correcto |

### Estilos legacy detectados

- Max-widths locales en el módulo del builder.
- Cards/tabs con `border`/`background` solo vía tokens base, sin superficies elevadas/soft del design system.
- Active tab poco diferenciado (mismo hover que inactive).
- Selected product sin accent.

### Tokens a reutilizar (existentes)

- `--surface-base-*`, `--surface-soft-*`, `--surface-elevated-*`, `--surface-muted-*`, `--surface-interactive-hover-bg`
- `--accent-primary`, `--accent-soft`
- `--text-primary|secondary|tertiary`, `--border-subtle`, `--radius-lg`, `--surface-card-padding`

### Componentes pulidos

- Page shell + header operational
- Builder tabs strip
- Panes: Productos / Qué puede elegir / Así lo verá
- Lista de productos (hover/selected)
- Notice “Personalización activa”, group/option cards, empty states, preview cards

### Qué NO se tocó

- `owner-customization-builder.tsx` lógica
- Server actions / lib product-customization
- Global `admin-shell.css` / `admin-surfaces.css` / `globals.css` (solo consumo de tokens)
- Public catalog / checkout / stock

## Cambios de layout

1. `app/admin/(protected)/products/customizations/page.tsx`
   - `AdminPageLayout size="operational"`
   - `AdminPageHeader variant="operational"`
2. `product-customization-admin.module.css`
   - Removidos `max-width` + centrado en `.layout` / `.builderShell`
   - Desktop ≥1200px: `minmax(280px, 360px) minmax(420px, 1fr) minmax(300px, 380px)`
   - 900–1199px: 2 columnas; preview debajo
   - &lt;900px: 1 columna

## Cambios de theme tokens

- Panes/cards → `--surface-base-*` / elevated / soft
- Tabs → strip soft + active elevated
- Product selected → `color-mix` con `--accent-primary` / `--accent-soft`
- Chips / option cards / inline options / empty → muted/soft surfaces
- Sin hex/rgb hardcoded nuevos en el módulo

## Header / tabs / cards

- Header alineado a Products (eyebrow Catálogo, variant operational).
- Tabs en contenedor pill/strip con active claro.
- Cards con radius-lg, padding de superficie, sombra base/elevated.
- Preview mantiene aviso “no agrega al carrito”; jerarquía tipográfica/spacing mejorada.

## Responsive

| Breakpoint | Comportamiento |
|------------|----------------|
| ≥1200px | 3 columnas (lista / config / preview sticky) |
| 900–1199px | 2 columnas; preview móvil debajo |
| &lt;900px | 1 columna; preview debajo |
| Tabs | scroll horizontal si no caben |

## Validación local

- `tsc` PASS
- `build` PASS
- Browser QA local (dark/light, ancho vs Products) — ver sección Browser QA

## Validación funcional mínima

Sin cambios de lógica; confirmar:

- Selección de producto
- Cambio de tabs
- Secciones reutilizables / Plus sugeridos cargan
- `/admin/products` sin regresión

## Deploy

Autorizado y ejecutado.

```txt
Commit: 40366d6 Polish Product Customization admin layout
Push: origin main
```

Archivos desplegados:

- `app/admin/(protected)/products/customizations/page.tsx`
- `components/admin/product-customization/product-customization-admin.module.css`
- `docs/product-customization-admin-visual-polish-1-layout-theme-polish.md`
- `docs/CURRENT_PHASE.md`
- `ORDEROPS_LIVING_MEMORY.md`

Sin migrations · sin server actions · sin DB/RLS.

## Browser QA

Local `http://localhost:3000` (sesión admin piloto La Burguesía):

| Check | Resultado |
|-------|-----------|
| Shell max-width | `1600px` vía `admin-page-layout--operational` (CDP) |
| Container width @1496 viewport | ~1409px (mismo shell que Products) |
| Selección Doble Smash | OK — config + preview Papas/Salsas/Agregados/Plus |
| Tab Plus sugeridos | OK — Bebidas / Coca Cola |
| Dark theme | OK — surfaces/tabs/selected con accent |
| Light theme | OK |
| Overflow horizontal | No observado |

Checklist cerrado: ancho alineado a Products · header Catálogo · tabs strip · cards tokenizadas · dark/light OK.

## Compatibilidad

- Dark / light vía tokens existentes
- Shell operational compartido con Products
- Sin cambios de API ni datos

## Qué NO se tocó

- DB, RLS, migrations
- Server actions / create_order
- Stock / restock / flags
- Catálogo público / cart / checkout
- Lógica del builder

## Validaciones CLI

```txt
npx tsc --noEmit → PASS
npm run build → PASS
```

Lint: opcional; si falla por ESLint 9 circular JSON conocido → documentar, no corregir.

## Riesgos / deuda

- Preview sigue siendo orientativa (no mock completo del modal público).
- Algunos controles legacy del editor avanzado (drag handle / move buttons) usan tokens base sin strip elevated — aceptable; no bloquean layout.
- Diff de docs previos no relacionados puede coexistir en working tree; este deploy solo debe incluir archivos auditados de la fase.

## Rollback plan

1. Revertir commit de polish (page + CSS module + docs de fase).
2. Redeploy.
3. Sin migraciones → no hace falta rollback de DB.

## Resultado final

PASS (o PASS WITH DEPLOY DEBT si no se desplegó).

## Próxima fase recomendada

- Monitor piloto live post-deploy visual
- Opcional: unificar controles DnD del builder con patrones interactive del admin
- Opcional: preview más fiel al modal público (fase separada)

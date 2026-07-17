# PRODUCT-CUSTOMIZATION-ADMIN-BUTTON-THEME-POLISH-1 — Admin Customizations Button Theme Polish

## Objetivo

Cerrar la deuda visual de botones/controles interactivos en `/admin/products/customizations` tras PRODUCT-CUSTOMIZATION-ADMIN-VISUAL-POLISH-1: primary/secondary/disabled/hover/focus tokenizados en dark y light, sin tocar layout ni lógica.

## Contexto

La fase de layout/theme polish dejó el ancho, grid y superficies alineados. Quedaba deuda: `admin-primary-button` usa `background: var(--text-primary)` (blanco crudo en dark), y secondary/DnD se sentían legacy.

## Alcance

- CSS module del builder (`product-customization-admin.module.css`)
- Clases locales `primaryCta` / `secondaryCta` / `ghostCta`
- Overrides scoped `:global(.admin-primary-button)` / `:global(.admin-secondary-link)` bajo `.builderShell`
- Controles DnD (`dragHandle`, `moveButton`)
- Switch de CTAs del panel “Por producto” a `primaryCta` (solo className)
- Docs + `CURRENT_PHASE.md` + `ORDEROPS_LIVING_MEMORY.md`

## Fuera de scope

- Layout / grid / shell width
- `admin-surfaces.css` global (prohibido por .cursorrules)
- Server actions / Product Customization logic
- DB / migrations / RLS
- Checkout / cart / stock / flags

## Autorización

```txt
AUTORIZO_PRODUCT_CUSTOMIZATION_ADMIN_BUTTON_THEME_POLISH_LOCAL=yes
AUTORIZO_PRODUCT_CUSTOMIZATION_ADMIN_BUTTON_THEME_POLISH_BROWSER_QA=yes
AUTORIZO_DEPLOY_PRODUCT_CUSTOMIZATION_ADMIN_BUTTON_THEME_POLISH_TO_VERCEL=yes
```

## Precheck local

```txt
npx tsc --noEmit → PASS
npm run build → PASS
```

## Auditoría de botones / controles

| Botón / control | Antes | Causa |
|-----------------|-------|-------|
| Agregar sección de opciones | Blanco duro en dark | `.admin-primary-button` → `background: var(--text-primary)` |
| Gestionar excepciones / Configurar plus | Secondary poco integrado | `.secondaryCta` parcial |
| Crear sección / Guardar (tabs) | Mismo primary ink | clase global dentro del builder |
| DnD / move ↑↓ | Surfaces base | borders/bg sin interactive tokens |
| Disabled move | Opacity baja | sin muted surface |

### Archivos tocados

- `components/admin/product-customization/product-customization-admin.module.css`
- `components/admin/product-customization/owner-customization-builder.tsx` (className only)
- docs de fase + CURRENT_PHASE + LIVING_MEMORY

### Tokens elegidos

- Primary: `--accent-primary` / `--accent-primary-strong` + `--focus-ring`
- Secondary: `--surface-soft-bg`, `--surface-interactive-*`
- Disabled: `--surface-muted-*`, `--text-tertiary`
- Focus: `--focus-ring` / `--focus-ring-soft`

### Fuera de scope (controles)

- Botones globales fuera del builder (Products “+ Nuevo producto” sigue con ink `text-primary`)
- No se modificó `admin-surfaces.css`

## Cambios de tokens

Primary del builder deja de heredar ink (`text-primary`) y usa accent. Secondary/DnD usan surfaces soft/interactive/muted. Disabled deja de ser blanco apagado.

## Variants actualizadas

| Variant | Clase / scope |
|---------|----------------|
| Primary | `.primaryCta` + `.builderShell :global(.admin-primary-button)` |
| Secondary | `.secondaryCta` + `.builderShell :global(.admin-secondary-link)` |
| Ghost | `.ghostCta` (disponible) |
| Icon / DnD | `.dragHandle`, `.moveButton` |

## Dark theme

- Primary medido: `rgb(37, 99, 235)` (accent), no blanco
- Secondary: surface soft `rgb(32, 33, 38)` + texto muted
- “Crear sección” (admin-primary-button anidado): mismo accent vía override

## Light theme

- Primary accent legible
- Secondary soft surfaces
- Disabled move: muted bg + text tertiary

## Responsive

Sin cambios de layout; `actionsRow` ya wrappea. Sin overflow observado.

## Validación funcional mínima

- Selección Doble Smash OK
- Tabs Por producto / Secciones OK
- CTAs solo cambian className; handlers intactos
- Disabled move permanece disabled

## Deploy

Autorizado. Commit + push `main` tras CLI PASS.

## Browser QA

Local `http://localhost:3000/admin/products/customizations`:

| Check | Resultado |
|-------|-----------|
| Primary dark no blanco | PASS (`#2563eb`) |
| Secondary integrado | PASS |
| Nested admin-primary (Crear sección) | PASS accent |
| Light theme | PASS |
| Tabs / selección producto | PASS |

## Compatibilidad

Scope limitado a `.builderShell`. No impacta Products/Dashboard/Settings globales.

## Qué NO se tocó

DB · RLS · actions · checkout · stock · layout grid · `admin-surfaces.css`

## Validaciones CLI

```txt
tsc PASS · build PASS
```

## Riesgos / deuda

- Texto on-accent sigue `#fff` (mismo patrón que admin-surfaces; no hay token `--text-on-accent`)
- Primary ink global fuera del builder permanece (deuda admin-wide opcional)
- Compact secondary links (`--compact`) heredan min-height 40px dentro del builder — aceptable

## Rollback plan

Revertir commit de esta fase y redeploy. Sin migraciones.

## Resultado final

PASS

## Próxima fase recomendada

- Opcional: tokenizar `admin-primary-button` global (admin-wide) con audit Products/Dashboard/Settings
- Monitor piloto visual post-deploy

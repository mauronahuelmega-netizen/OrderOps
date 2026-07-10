# Admin Settings Public Landing — SETTINGS-PAGE-1B Preview & Form Hierarchy Polish

## Objetivo

Mejorar jerarquía visual y protagonismo de la preview en `/admin/settings/public/landing`, atacando **L-03** (layout monolítico / preview enterrada) y **L-04** (preview aproximada), sin tocar server actions, uploads ni landing pública real.

## Contexto

- Post **SETTINGS-PAGE-1A**: overflow corregido, file inputs sr-only, color compacto.
- Estado inicial verificado: sin overflow, preview al final del form monolítico.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/settings/public-settings-form.tsx` | Layout editor + preview; secciones en cards; preview hero enriquecida; props `businessName`, `publicLandingHref` |
| `components/admin/settings/public-settings.css` | Estilos landing editor (scoped `.admin-settings-landing-editor`) |
| `app/admin/(protected)/settings/public/landing/page.tsx` | Pasa `businessName` y `publicLandingHref` al form |
| `docs/admin-settings-public-landing-forensic-audit-page-1a.md` | Follow-up 1B |
| `docs/admin-settings-v1-final-handoff.md` | Nota follow-up |

## Archivos creados

- `docs/admin-settings-public-landing-page-1b-preview-form-hierarchy-polish.md` (este documento)

## Cambio principal aplicado

El formulario pasó de una columna monolítica a un **editor con secciones en surfaces independientes** y una **columna de preview lateral en desktop ≥1100px**.

## Layout editor / preview

- **Desktop ≥1100px:** grid `1.15fr / 0.85fr` (min 360px preview).
- Preview column `position: sticky; top: var(--space-lg)`.
- **Tablet/mobile <1100px:** una columna; preview debajo del editor (orden DOM: form → preview).
- `min-width: 0` en columnas; sin `100vw`.

## Form hierarchy

- Secciones **Identidad**, **Imagen de portada**, **Presentación** en `.admin-settings-landing-section` (border, padding, surface soft).
- Se eliminaron bordes superiores acumulados entre secciones dentro del editor.
- Área **Guardar cambios** en `.admin-settings-landing-editor__actions` con surface propia y borde superior implícito vía card.

## Preview polish

- Preview movida a `<aside>` con panel dedicado.
- Hero aproximado: logo + copy + pseudo-CTAs (no clickeables) + Instagram si hay URL.
- Showcase: portada 16:9 + summary cards (texto estático, `aria-hidden`).
- Nota: "Vista aproximada del hero público…"
- Link secundario **Ver landing pública** en bloque preview (mismo href que header del panel).
- `businessName` por prop (eliminado DOM scrape).

## Save action polish

- Card de acciones con padding/border/surface.
- Submit y feedback preservados; sin sticky bar.

## Desktop QA

**Viewport 1440×900**

| Check | Resultado |
|-------|-----------|
| `scrollWidth` vs `clientWidth` | 1440 = 1440 |
| Layout 2-col | `698px + 516px` |
| Preview visible arriba | `top ≈ 268px` |
| File inputs | 1×1px |
| Color input | 46px |
| Horizontal scrollbar | No |

## Tablet QA

**Viewport 820×1024** (`clientWidth` ≈ 805)

| Check | Resultado |
|-------|-----------|
| Layout | 1 columna |
| Overflow | No |
| Color input | 46px |

## Mobile QA

**Viewport 390×844**

| Check | Resultado |
|-------|-----------|
| Page overflow | No (`scrollW 390`) |
| Layout | 1 columna vertical |
| Preview | Debajo del formulario |

## No regression checks

- `/admin/settings/public/catalogo` — carga OK; form catálogo sin clases landing editor.
- CSS landing scoped bajo `.admin-settings-landing-editor`; catálogo no afectado.

## Qué se preservó

- `updatePublicBusinessSettingsAction`
- upload logic
- bucket `business-assets`
- DB/RLS
- permissions
- route structure
- field names
- validation
- public landing route
- catalog route
- `SettingsShell`
- `SettingsNavigation`

## Qué NO se cambió

- no server action changes
- no DB changes
- no RLS changes
- no storage changes
- no upload behavior changes
- no public landing real redesign
- no checkout changes
- no products changes

## Riesgos

- Bajo: estilos scoped; catálogo no usa `admin-settings-landing-editor`.
- Sticky preview puede interactuar con header admin en viewports muy bajos de desktop; monitorear en 1C.

## Deuda restante

- **L-05** — tabs mobile affordance (SETTINGS-PAGE-1C)
- **L-06** — sticky save bar (futuro)
- **L-10** — validación origen URL assets (seguridad follow-up)
- Preview sigue siendo aproximación; WhatsApp real no disponible en datos del form

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | **PASS** |
| `npm run build` | **PASS** |
| `npm run lint` | **FAIL** — flake ESLint 9 circular config |

## Próxima fase recomendada

**SETTINGS-PAGE-1C — Landing Mobile/Tablet Responsive Polish**

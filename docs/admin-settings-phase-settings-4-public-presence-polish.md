# Admin Settings — SETTINGS-4 Public Presence Polish

## Objetivo

Pulir visualmente las páginas de **presencia pública** (resumen, landing, catálogo): tokenizar CSS legacy, surfaces premium, forms baseline y copy ES-AR — sin cambiar lógica de guardado.

## Contexto

SETTINGS-3 aplicó `SettingsShell` operational. SETTINGS-4 enfoca módulos internos de `/admin/settings/public/*` identificados en SETTINGS-1 con `public-settings.css` hardcoded.

## Archivos modificados

- `components/admin/settings/public-settings.css` (reescritura tokenizada)
- `components/admin/settings/public-settings-form.tsx`
- `components/admin/settings/public-catalog-settings-form.tsx`
- `app/admin/(protected)/settings/public/page.tsx`
- `app/admin/(protected)/settings/public/landing/page.tsx`
- `app/admin/(protected)/settings/public/catalogo/page.tsx`
- `docs/board-orders-execution-area-v1-final-handoff.md`

## Archivos creados

- `components/admin/settings/public-presence-panel.tsx`
- `components/admin/settings/public-presence-panel.module.css`
- `components/admin/settings/public-presence-summary.module.css`
- `docs/admin-settings-phase-settings-4-public-presence-polish.md`

## Cambio principal aplicado

CSS legacy beige/marrón reemplazado por tokens admin. Landing y catálogo usan **`PublicPresencePanel`** premium. Resumen `/admin/settings/public` reorganizado en secciones **Canales públicos** + **Avisos operativos**.

## Public settings CSS tokenization

- Eliminadas reglas legacy de nav/overview (ya cubiertas por SETTINGS-3).
- Forms, previews, uploads usan `--bg-surface`, `--border-subtle`, `--text-*`, `--shadow-sm`, `--focus-ring`, `--radius-*`, `--space-*`.
- Sin `#1f1a14`, `#dfd4c8`, `#fffdf9` en archivo principal.
- **Deuda justificada:** placeholder input color `#2563EB` (ejemplo hex = valor `--accent-primary`); preview fallback JS usa `var(--accent-primary)`.

## Landing pública polish

- `PublicPresencePanel` con link **Ver landing pública** (slug existente, sin nueva lógica).
- Secciones form: Identidad, Portada, Presentación, Vista previa.
- Copy corregido (tildes, voseo consistente).
- Upload controls tokenizados + focus-visible.

## Catálogo público polish

- Panel premium + link **Ver catálogo público**.
- Secciones: Textos del hero + Vista previa.
- Preview copy tokenizado con `.catalog-eyebrow` scoped.

## Resumen de presencia pública

- Título shell: **Presencia pública**.
- Grid `SettingsCard` para landing/catálogo + cards vista pública (links `/b/[slug]`).
- `NotificationSettingsCard` en sección Avisos operativos (sin mover lógica; nota copy SETTINGS-5).

## Forms baseline

- Secciones con `admin-settings-section__*` tokenizadas.
- `admin-settings-form-actions` para submit.
- Labels/helpers en español claro.
- Textareas/inputs reutilizan `ui-input` / `ui-field` existentes.

## Surfaces/cards

- `PublicPresencePanel`: border sutil, `--bg-surface`, `--shadow-sm`, padding responsive.
- Preview blocks: `--bg-surface-soft` sin gradientes beige hardcoded.

## Copy/mojibake

- Corregido: Configuración, Landing pública, Catálogo, Presentación, Descripción, todavía, Probá, Podés, etc.
- Sin mojibake UTF-8 detectado.

## Responsive notes

- Grid forms 2-col desktop, 1-col mobile.
- Preview images max-width contained.
- Panel header stack → row en tablet+.

## Qué se preservó

- server actions
- DB/schema
- RLS/policies
- permissions
- business settings logic
- landing save behavior
- catalog save behavior
- products/admin
- checkout público
- dashboard/orders
- team route

## Qué NO se cambió

- no server action changes
- no DB changes
- no RLS changes
- no route migration
- no notifications tab implementation
- no operations logic changes
- no product logic changes
- no checkout behavior changes

## Deuda restante

| ID | Deuda | Fase |
|----|-------|------|
| D-1 | Mover NotificationSettingsCard a tab dedicada | SETTINGS-5 |
| D-2 | Notification card visual full polish | SETTINGS-5 |
| D-3 | Operations copy EN | SETTINGS-5 |
| D-4 | Team migration | SETTINGS-6 |

## Validaciones ejecutadas

```txt
npm run build: pass
npx tsc --noEmit: pass
npm run lint: fail — ESLint circular config (flake conocido)
```

## QA manual recomendado

Desktop/tablet/mobile: `/admin/settings/public`, landing, catalogo — guardar sin cambios lógicos; ver links públicos; regression dashboard/products/checkout.

## Próxima fase recomendada

**SETTINGS-5 — Operations & Notifications Settings Polish**

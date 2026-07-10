# PUBLIC-CLEANUP-1 — Public Presence Legacy Cleanup

## Objetivo

Eliminar deuda técnica legacy generada durante PUBLIC-1 → PUBLIC-6 en Presencia pública, sin alterar comportamiento, rutas, server actions, DB ni UX visible.

## Alcance

**Dentro de scope:**

- Eliminar componentes/CSS sin consumidores activos
- Migrar estilos `externalLink` del panel eliminado al editor shell
- Actualizar imports en páginas Landing/Catálogo
- Limpiar CSS huérfano en `public-settings.css`
- Documentar deuda conservada

**Fuera de scope (no tocado):**

- `components/public/**`
- `public-asset-upload.tsx`, Brand Palette
- Server actions, DB, RLS, Storage
- Nuevas features, rutas, formularios unificados

## Auditoría de referencias

Comandos ejecutados (`rg` en `components` + `app`):

| Patrón | Resultado |
|--------|-----------|
| `PublicLandingReadiness` | Solo en docs históricos; **0 imports TS/TSX activos** |
| `public-landing-readiness` | Solo en docs; archivos eliminados |
| `PublicPresenceIndex` | Solo en docs; componente eliminado con el panel |
| `PublicPresencePanel` | Solo en docs; **0 imports activos** tras PUBLIC-6 |
| `admin-settings-public-preview-copy` | Solo en CSS (eliminado); **0 refs TSX** |
| `admin-settings-public-preview` (upload preview) | Solo en CSS (eliminado); no usado por `public-asset-upload` |
| `resourceLinks` | **0 matches** en `components` / `app` |
| `publicPresenceIndex` | **0 matches** en `components` / `app` |

**Consumidores activos confirmados (conservados):**

- `.admin-settings-preview--landing` → `public-presence-preview.tsx`
- `.admin-settings-landing-preview-panel` + `__pending*` → `public-settings-form.tsx`
- `.admin-settings-preview__logo`, `__cover`, `__cta`, etc. → preview dual y formulario Landing

## Código eliminado

| Archivo | Motivo |
|---------|--------|
| `components/admin/settings/public-landing-readiness.tsx` | Shim deprecado desde PUBLIC-4; reemplazado por `PublicPresenceReadiness` |
| `components/admin/settings/public-landing-readiness.module.css` | Estilos migrados a `public-presence-readiness.module.css` en PUBLIC-4 |
| `components/admin/settings/public-presence-panel.tsx` | `PublicPresencePanel` + `PublicPresenceIndex` sin consumidores tras PUBLIC-6 |
| `components/admin/settings/public-presence-panel.module.css` | Estilos del panel; `externalLink` migrado al shell |

## CSS eliminado

De `components/admin/settings/public-settings.css`:

| Selector / bloque | Motivo |
|-------------------|--------|
| `.admin-settings-preview__header` | Sin referencias TSX |
| `.admin-settings-preview__pill` | Sin referencias TSX |
| `.admin-settings-public-preview-copy` (+ hijos) | Preview inline de catálogo reemplazada por PUBLIC-5 |
| `.admin-settings-public-preview` (+ `--logo`, `--cover`) | Preview de upload legacy; `public-asset-upload` usa módulo propio |
| `.admin-settings-public-empty` | Sin consumidor |
| `.admin-settings-landing-preview-panel__header` | Sin referencias TSX |
| `.admin-settings-landing-preview-panel__scope` | Sin referencias TSX |
| `.admin-settings-landing-preview-panel__cta` (+ `__cta-helper`, `__link`) | CTA movido a `PublicPresencePreview` en PUBLIC-5 |
| Media query: `__link` min-height 44px | Huérfana tras eliminar `__link` |
| Media query: `.admin-settings-public-preview--cover img` height 140px | Huérfana tras eliminar bloque preview upload |

**CSS añadido (migración, no feature):**

- `.externalLink` (+ `:hover`, `:focus-visible`) en `public-presence-editor-shell.module.css` — antes en el panel eliminado; usado por Landing/Catálogo para “Ver landing/catálogo pública”.

## Imports/exports limpiados

| Archivo | Cambio |
|---------|--------|
| `app/admin/(protected)/settings/public/landing/page.tsx` | `panelStyles` → `shellStyles` (`public-presence-editor-shell.module.css`) |
| `app/admin/(protected)/settings/public/catalogo/page.tsx` | Idem |
| `public-landing-readiness.tsx` | Eliminado (export shim) |
| `public-presence-panel.tsx` | Eliminado (`PublicPresencePanel`, `PublicPresenceIndex`, `resourceLinks`) |

No se detectaron imports muertos adicionales en formularios tras eliminación; TypeScript pasó sin errores.

## Deuda conservada intencionalmente

| Item | Razón |
|------|-------|
| `.admin-settings-preview--landing` y variantes responsive | En uso activo por `PublicPresencePreview` (preview dual PUBLIC-5) |
| `.admin-settings-landing-preview-panel` + `__pending*` | En uso por `public-settings-form.tsx` (banner cambios pendientes de assets) |
| `.admin-settings-preview__logo`, `__cover`, `__identity`, `__cta`, etc. | En uso por preview dual y estructura Landing |
| `public-settings.css` compartido entre Landing y Catálogo | Convención histórica; separar a módulos sería refactor fuera de scope |
| Docs históricos PUBLIC-1…6 | Mencionan componentes eliminados como registro de evolución; no se editaron en esta fase |
| `npm run lint` — ESLint 9 circular config | Flake preexistente (`Converting circular structure to JSON`); no corregido por política de fase |

## Archivos modificados

- `components/admin/settings/public-settings.css` — eliminación CSS legacy
- `components/admin/settings/public-presence-editor-shell.module.css` — `.externalLink` migrado
- `app/admin/(protected)/settings/public/landing/page.tsx` — import shell styles
- `app/admin/(protected)/settings/public/catalogo/page.tsx` — import shell styles

## Archivos eliminados

- `components/admin/settings/public-landing-readiness.tsx`
- `components/admin/settings/public-landing-readiness.module.css`
- `components/admin/settings/public-presence-panel.tsx`
- `components/admin/settings/public-presence-panel.module.css`

## Archivos creados

- `docs/admin-settings-public-cleanup-1-legacy-cleanup.md` (este documento)

## Qué se preservó

- `PublicPresenceReadiness` + `public-presence-readiness-model.ts` (PUBLIC-4)
- `PublicPresencePreview` + módulo CSS (PUBLIC-5)
- `PublicPresenceSummary` en índice (PUBLIC-6)
- `PublicPresenceEditorShell` (PUBLIC-2)
- Formularios separados Landing / Catálogo y sus flujos de guardado
- Preview dual con tabs Landing / Catálogo
- Checklist único por editor (sin doble readiness en Landing/Catálogo)
- Rutas: `/admin/settings`, `/admin/settings/public`, `/landing`, `/catalogo`

## Qué NO se tocó

- Server actions (`updatePublicBusinessSettingsAction`, `updateCatalogHeroSettingsAction`)
- DB, RLS, Storage, uploads (`public-asset-upload`)
- Brand Palette (`brand-palette*`)
- `components/public/**`
- Productos, categorías
- Lógica de readiness, preview o dirty state

## QA

### Rutas validadas (browser smoke)

| Ruta | Resultado |
|------|-----------|
| `/admin/settings` | Card “Presencia pública” visible en hub |
| `/admin/settings/public` | Overview PUBLIC-6: estado general, section cards, readiness compacto, accesos rápidos |
| `/admin/settings/public/landing` | Shell, formulario, readiness único, preview dual (tab Landing), botón guardar, link externo |
| `/admin/settings/public/catalogo` | Shell, formulario hero, readiness único, preview dual (tab Catálogo), botón guardar, link externo |

### Checks

- Navegación intacta
- Sin doble checklist en editores
- Sin doble preview
- Save buttons visibles (“Sin cambios” cuando no hay dirty state)
- Sin warnings `useActionState` observados en sesión
- Sin overflow global aparente en viewport móvil (~390px) y desktop

### Responsive

Validado visualmente en sesión activa en ancho móvil (snapshot ~390px) y desktop en rutas públicas.

## Validaciones

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | **PASS** (exit 0) |
| `npm run build` | **PASS** — Next.js 16.2.9, rutas admin públicas generadas |
| `npm run lint` | **FAIL** — flake ESLint 9: `TypeError: Converting circular structure to JSON` (preexistente, no corregido) |

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| CSS eliminado aún referenciado dinámicamente | Auditoría `rg` en TSX/CSS antes de borrar; build PASS |
| `externalLink` visual distinto tras migración | Estilos copiados del panel; smoke en Landing/Catálogo OK |
| Docs históricos mencionan componentes muertos | Documentado como deuda de documentación, no funcional |

## Próxima fase

Candidatos fuera de PUBLIC-CLEANUP-1 (requieren fase propia):

1. **PUBLIC-7 o SETTINGS-8** — Dirty state global / save bar sticky / `beforeunload` (explícitamente fuera de scope)
2. **CSS modularización** — Migrar selectores globales restantes de `public-settings.css` a módulos por componente
3. **Docs sweep** — Actualizar referencias históricas a `PublicPresencePanel` / `PublicLandingReadiness` en docs PUBLIC-1…6 si se desea consistencia documental
4. **ESLint 9 config** — Resolver circular JSON en configuración flat (infra, no Presencia pública)

# PUBLIC-1 — Unified Public Presence IA

## Objetivo

Unificar la arquitectura de navegación de presencia pública: pasar de dos entradas separadas (Landing pública + Catálogo público) a un único módulo **Presencia pública**, sin fusionar formularios ni cambiar lógica interna.

## Arquitectura anterior

```
Settings nav:
  Resumen | Landing pública | Catálogo público | Operación | ...

Hub /admin/settings:
  Presencia pública (sección)
    ├── Landing pública → /landing
    └── Catálogo público → /catalogo

/admin/settings/public:
  Grid de cards (hub duplicado) + notificaciones
```

## Arquitectura nueva

```
Settings nav:
  Resumen | Presencia pública | Operación | ...

Hub /admin/settings:
  Presencia pública (1 card) → /admin/settings/public

/admin/settings/public:
  Índice de editores
    ├── Landing → /landing
    └── Catálogo → /catalogo

/admin/settings/public/landing  (sin cambios funcionales)
/admin/settings/public/catalogo (sin cambios funcionales)
```

Nav activo `presencia-publica` para cualquier ruta bajo `/admin/settings/public/**`.

## Cambios principales

1. **SettingsNavigation** — un ítem "Presencia pública" → `/admin/settings/public`.
2. **Hub** — una sola card en lugar de Landing + Catálogo.
3. **Overview** `/admin/settings/public` — índice compacto (`PublicPresenceIndex`) en lugar de cards gigantes.
4. **PublicPresencePanel** — API genérica: `resourceLinks` + export `PublicPresenceIndex` para fase 2.
5. Títulos internos de editores (**Landing pública**, **Catálogo público**) sin cambios.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/settings/settings-navigation.tsx` | Un ítem Presencia pública; `getActiveKey` unificado |
| `components/admin/settings/public-presence-panel.tsx` | `PublicPresenceIndex`, `resourceLinks` |
| `components/admin/settings/public-presence-panel.module.css` | Estilos índice y resource links |
| `app/admin/(protected)/settings/page.tsx` | Una card Presencia pública |
| `app/admin/(protected)/settings/public/page.tsx` | Índice Landing + Catálogo |

## Archivos creados

| Archivo | Rol |
|---------|-----|
| `docs/admin-settings-public-phase-public-1-unified-ia.md` | Este documento |

## Qué se preservó

- Rutas `/admin/settings/public/landing` y `/catalogo`
- `PublicSettingsForm`, `PublicCatalogSettingsForm` sin cambios
- Server actions, uploads, dirty state, preview, brand palette
- Títulos de página de cada editor
- Permisos `managePublicSettings`

## Qué NO se tocó

- `public-settings-form.tsx`
- `public-catalog-settings-form.tsx`
- `public-asset-upload.tsx`
- `public-landing-readiness.tsx`
- `brand-palette*`
- Server actions, DB, RLS, storage
- `components/public/**`
- Landing/catalogo `page.tsx` (editores)

## Próxima fase

**PUBLIC-2 — Public Presence Editor Shell**

- Pasar `resourceLinks` en editores (Landing / Catálogo) vía `PublicPresencePanel`.
- Unificar shell visual del editor bajo módulo Presencia pública.
- Mantener forms separados; preparar secciones internas sin anchors/tabs aún.

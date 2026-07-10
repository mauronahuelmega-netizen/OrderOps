# PUBLIC-2 — Public Presence Editor Shell

## Objetivo

Unificar el shell visual y la navegación interna del módulo **Presencia pública** para que Landing y Catálogo se sientan como secciones del mismo editor, sin fusionar formularios ni cambiar lógica de negocio.

## Arquitectura anterior

```
SettingsShell (título: Landing pública | Catálogo público)
└── PublicPresencePanel (business.name)
    └── PublicSettingsForm | PublicCatalogSettingsForm
```

- Sin navegación interna entre secciones.
- Copy cruzado en catálogo: "configurá en Landing pública".
- Editores percibidos como páginas independientes.

## Arquitectura nueva

```
SettingsShell (título: Presencia pública)
└── PublicPresenceEditorShell
    ├── Módulo: Presencia pública + resource links
    ├── Sección: Landing pública | Catálogo público
    └── PublicSettingsForm | PublicCatalogSettingsForm (intactos)

/admin/settings/public
└── PublicPresencePanel + PublicPresenceIndex (índice)
```

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `app/admin/(protected)/settings/public/landing/page.tsx` | `PublicPresenceEditorShell` + SettingsShell unificado |
| `app/admin/(protected)/settings/public/catalogo/page.tsx` | Idem; copy cruzado eliminado |
| `app/admin/(protected)/settings/public/page.tsx` | Índice envuelto en `PublicPresencePanel` con resource links |

## Archivos creados

| Archivo | Rol |
|---------|-----|
| `components/admin/settings/public-presence-editor-shell.tsx` | Shell común de editor |
| `components/admin/settings/public-presence-editor-shell.module.css` | Estilos módulo, nav, responsive |
| `docs/admin-settings-public-phase-public-2-editor-shell.md` | Este documento |

## Cambios principales

1. **`PublicPresenceEditorShell`** — encabezado de módulo, links internos, título de sección, `children`.
2. **Resource links** — Landing pública / Catálogo público con `aria-current`, barra activa, hover/focus.
3. **SettingsShell** en editores — título "Presencia pública" (no duplica sección en header global).
4. **Copy** — `helperText`: "Estos ajustes forman parte de tu Presencia pública."
5. **Slots PUBLIC-3** — `.publicPresenceResourceBadge`, `.publicPresenceResourceMeta`, `.publicPresenceResourceStatus` (vacíos).

## Resource links

| Ruta | Activo |
|------|--------|
| `/admin/settings/public/landing` | Landing pública |
| `/admin/settings/public/catalogo` | Catálogo público |

Implementados en `PublicPresenceEditorShell` vía prop `activeSection: "landing" | "catalog"`.

## Responsive

| Viewport | Comportamiento |
|----------|----------------|
| Desktop | Links en fila; section header 2 columnas con actions |
| Tablet | Links wrap; sin overflow |
| Mobile | Rail horizontal scroll-snap; touch targets 44px |

## Qué se preservó

- `PublicSettingsForm` y `PublicCatalogSettingsForm` sin cambios
- Server actions, uploads, dirty state, preview, brand palette
- Rutas `/landing` y `/catalogo`
- Índice en `/admin/settings/public`

## Qué NO se tocó

- Formularios, asset upload, readiness, palette
- Server actions, DB, RLS, storage
- `components/public/**`

## QA

Ver ejecución en entrega (browser + validaciones).

## Validaciones

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | Ver entrega |
| `npm run build` | Ver entrega |
| `npm run lint` | Ver entrega (flake ESLint 9) |

## Deuda restante

- Dirty state / paridad 1G en catálogo (PUBLIC-3)
- Active state en resource links del índice `/public` (sin sección activa en hub)
- Preview unificada dual-surface

## Próxima fase

**PUBLIC-3 — Catalog dirty state parity:** aplicar `hasPendingChanges`, botón Guardado y checklist extendido al formulario de catálogo usando slots preparados.

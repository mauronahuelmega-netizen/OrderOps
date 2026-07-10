# SETTINGS-ROOT-1A — Sticky Settings Navigation Shell

## Objetivo

Transformar `/admin/settings` en un módulo tipo SaaS Enterprise donde la navegación entre secciones vive en un panel lateral secundario (sticky) y deja de depender del hub como único punto de entrada.

**Antes:** Sidebar principal → Hub → Tabs (solo en subpáginas)  
**Después:** Sidebar principal → Sticky Settings Navigation → Contenido

El hub continúa existiendo como resumen; la navegación es persistente en todas las rutas de settings.

## Arquitectura

```
┌────────────┬──────────────────────┬────────────────────────────┐
│ Sidebar    │ Settings Navigation  │ Contenido                  │
│ principal  │ (sticky, desktop)    │ (hub o subpágina)          │
│            │                      │                            │
└────────────┴──────────────────────┴────────────────────────────┘
```

**Flujo de componentes:**

```
AdminPageLayout (operational)
  AdminPageHeader
  SettingsShell.frame
    SettingsShell.nav (sticky wrapper)
      SettingsNavigation (panel / rail)
    SettingsShell.content
      Hub: SettingsHubIndex + hint
      Subpáginas: formularios / cards existentes
```

**Detección de sección activa:** `usePathname()` en `SettingsNavigation` con `getActiveKey()` — sin cambios de lógica de permisos (`canManagePublicSettings`, `canManageTeam`).

**Slots futuros (vacíos):** `.settingsNavBadge`, `.settingsNavMeta`, `.settingsNavStatus` — preparados para badge, dirty state, pending, draft y warning en fases posteriores.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/settings/settings-shell.module.css` | Grid 2 columnas desktop; sticky nav; hint hub; responsive tablet/mobile |
| `components/admin/settings/settings-navigation.tsx` | Tabs horizontales → panel con icono, título y descripción por ítem |
| `components/admin/settings/settings-navigation.module.css` | Panel vertical, estados active/hover/focus/pressed, rail horizontal mobile |
| `app/admin/(protected)/settings/page.tsx` | Título hub → "Resumen de configuración"; nav siempre visible; hint lateral |

`components/admin/settings/settings-shell.tsx` — sin cambios de lógica; el layout lo resuelve CSS.

## Archivos creados

| Archivo | Rol |
|---------|-----|
| `docs/admin-settings-root-1a-sticky-navigation-shell.md` | Este documento |

## Cambios principales

1. **Panel de navegación persistente** — visible en hub y en todas las subpáginas de settings (se eliminó `showNavigation={false}` del hub).
2. **Ítems enriquecidos** — Resumen, Landing pública, Catálogo público, Operación, Notificaciones, Equipo; cada uno con icono Lucide, título y descripción breve.
3. **Estado activo** — barra lateral izquierda (`::before`), background con tinte de acento, peso tipográfico 600 en título, icono destacado.
4. **Hub redefinido** — "Resumen de configuración" + texto: *"También podés navegar usando el panel lateral."* Las cards del índice se mantienen.
5. **Tokens CSS** — sin hardcodes de color; uso de `--accent-primary`, `--bg-surface`, `--border-subtle`, `--focus-ring`, etc.

## Responsive

| Breakpoint | Layout |
|------------|--------|
| **Desktop ≥1100px** | 3 columnas efectivas: sidebar principal + nav (220–260px) + contenido. Nav `position: sticky; top: var(--admin-page-top-offset)`. |
| **Tablet 768–1099px** | 2 columnas: sidebar + contenido. Nav encima del contenido (`position: static`), panel en card. |
| **Mobile ≤767px** | Rail horizontal compacto, scroll-snap, descripciones ocultas, panel title oculto. Nav sticky con backdrop blur. Drawer principal intacto (`Abrir menú de administración`). |

## Qué se preservó

- Hub `SettingsHubIndex` y todas sus cards
- `anchorViewport` y footer anclado en hub (`data-settings-hub-root`)
- Filtrado de ítems por permisos
- Formularios, server actions, DB, RLS, upload, brand palette, preview
- Sidebar principal del dashboard
- Rutas existentes sin cambios

## Qué NO se tocó

- Landing form (`public-settings-form.tsx`)
- Catálogo form
- Operations / Notifications / Team logic
- Preview y asset upload
- Brand palette
- `components/public/**`
- Layout global del dashboard (`AdminShell`)
- Server actions, DB, RLS

## QA

### Desktop (1280px) — PASS

- Panel lateral visible con grid `260px + contenido`
- Nav `position: sticky` confirmado
- Hub: título "Resumen de configuración", hint presente, cards visibles
- Active state "Resumen" en hub; "Operación" en `/admin/settings/operations`
- Sin overflow horizontal

### Tablet (900px) — PASS

- Una columna de contenido; nav encima (`navAboveContent: true`)
- Nav `position: static`
- Panel en card con título "Configuración"
- Sin overflow horizontal

### Mobile (375px, CDP emulation) — PASS parcial

- Rail horizontal (`flex-direction: row`)
- Nav sticky
- Botón drawer presente
- Sin overflow horizontal
- **Nota:** `matchMedia` en CDP no siempre refleja el viewport emulado; validar descripciones ocultas en dispositivo real o DevTools responsive.

### Navegación entre secciones — PASS

- Links Resumen, Landing, Catálogo, Operación, Notificaciones, Equipo accesibles
- `aria-current="page"` en ítem activo

## Validaciones

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `npm run lint` | FAIL — ESLint 9 circular config (`TypeError: Converting circular structure to JSON` en `@eslint/eslintrc`). Deuda de tooling preexistente; no corregido en esta fase. |

## Deuda restante

1. **ESLint 9** — fallo de configuración circular (no introducido por ROOT-1A).
2. **Slots de estado** — `.settingsNavBadge`, `.settingsNavMeta`, `.settingsNavStatus` definidos pero vacíos; pendiente dirty/pending/draft en fase posterior.
3. **Mobile QA físico** — confirmar rail y sticky en dispositivo real; CDP emulation limitada para media queries.
4. **Margin negativo mobile** — `.nav { margin-inline: calc(var(--space-lg) * -1) }` para full-bleed del rail; monitorear en páginas con contenido ancho.

## Próxima fase

**SETTINGS-ROOT-1B (recomendada):** Dirty state y badges en navegación — mostrar indicadores por sección (p. ej. cambios pendientes en Landing) usando los slots CSS ya preparados, integrado con el `hasPendingChanges` de PAGE-1G sin bloquear navegación.

Alternativas según roadmap:
- SETTINGS-PAGE-2A — Catálogo público polish (paridad con landing 1A–1G)
- SETTINGS-ROOT-1C — Breadcrumbs / context header en subpáginas

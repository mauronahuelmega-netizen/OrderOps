# Admin Loading + Operational Alerts Modal Audit

## 1. Executive Summary

Phase A0 audita dos problemas UX en `/admin/dashboard` sin modificar código:

1. **Loading blanco en reload** — El texto `Cargando configuración…` proviene de `AdminShell` mientras `useBusinessSettings` resuelve feature flags. El CSS del loading **usa tokens** (`var(--surface-canvas-bg)`), pero en ese momento `<html>` aún no tiene `data-dashboard-theme="dark"`. El theme solo se aplica cuando monta `AdminThemeToggle` dentro del sidebar, que **no se renderiza durante el loading**. Resultado: fondo canvas claro (`#F8FAFC`) perceptible como blanco en usuarios con dark theme guardado.

2. **Modal “Activar avisos operativos” desactualizado** — Vive en `audio-unlock-modal.tsx` + `audio-unlock-modal.module.css`, montado por `AudioUnlockGate` en `dashboard/page.tsx`. El panel del modal tiene **superficie warm hardcodeada** (`#fffdf9`, `#ded4c9`, `#6b6258`) extraída de legacy `orders-admin.css`. No tiene overrides dark. Contraste pobre en dark. Sin acción secundaria, sin dismiss, sin focus trap. Microcopy funcional pero mejorable.

**Conclusión operativa:** Loading → causa mixta (theme bootstrap delay + default light tokens). Modal → `THEME_UNSAFE` + `HARDCODED_LIGHT_SURFACE` + gaps de accesibilidad.

**Plan recomendado:** A1 (theme-safe loading bootstrap), A2 (tokenización + microcopy modal), A3 (QA no-flicker).

---

## 2. Reported Issues

### Problema 1 — Loading blanco en dark reload

Al recargar `/admin/dashboard` aparece pantalla full-viewport con spinner y texto `Cargando configuración…` sobre fondo claro/blanco, aunque el usuario tenga dark theme persistido en `localStorage`.

### Problema 2 — Modal avisos operativos desactualizado

Modal con título `Activar avisos operativos`, copy sobre sonido de nuevos pedidos, CTA `Activar avisos`. Problemas observados:

- Superficie clara hardcodeada en dark theme
- Overlay/backdrop no integrado al sistema visual actual
- Microcopy mejorable
- Sin acción secundaria / dismiss
- Accesibilidad parcial

---

## 3. Scope Audited

**Incluido:**

- Loading inicial de `/admin/dashboard` vía `AdminShell`
- Layout admin protegido y cadena de imports CSS
- Aplicación de theme dark/light en admin
- Modal de avisos operativos (`AudioUnlockGate` + `AudioUnlockModal`)
- Estilos overlay/panel del modal
- Lógica de permisos/audio (solo lectura)
- Hardcodes visuales relacionados

**Excluido:**

- Top section dashboard (D0–D10.1)
- Toolbar / search / filtros
- Lanes / order cards / order modal
- Realtime orders pipeline
- Supabase schema / server actions
- Public catalog / product settings generales

---

## 4. Files Audited

| Archivo | Rol en auditoría |
|---------|------------------|
| `components/admin/admin-shell.tsx` | Renderiza loading `Cargando configuración…` |
| `components/admin/admin-shell.css` | Estilos loading (tokens) |
| `app/admin/(protected)/layout.tsx` | Layout protegido; monta `AdminShell` |
| `app/admin/layout.tsx` | Passthrough sin theme |
| `app/layout.tsx` | Root layout; `<html>` sin theme attribute SSR |
| `app/globals.css` | Import `theme-tokens.css`; `body { background: var(--bg-canvas) }` |
| `app/theme-tokens.css` | Tokens light/dark vía `html[data-dashboard-theme]` |
| `components/admin/layout/admin-theme-toggle.tsx` | Único punto que aplica theme desde `localStorage` |
| `components/admin/layout/admin-sidebar.tsx` | Host de `AdminThemeToggle` (no monta durante loading) |
| `lib/business/use-business-settings.ts` | Hook que mantiene `loading: true` durante fetch |
| `app/admin/(protected)/dashboard/page.tsx` | Monta `AudioUnlockGate` |
| `components/admin/notifications/audio-unlock-gate.tsx` | Lógica show/trigger/unlock |
| `components/admin/notifications/audio-unlock-modal.tsx` | UI del modal |
| `components/admin/notifications/audio-unlock-modal.module.css` | Estilos hardcoded del modal |
| `components/admin/admin-surfaces.css` | `admin-form-header`, `admin-primary-button` |
| `lib/notifications/audio.ts` | Session unlock, localStorage, `HTMLAudioElement.play()` |
| `lib/admin/permissions.ts` | `canManageNotifications` |
| `docs/U2_2_AUDIO_UNLOCK_MODAL_REPORT.md` | Comportamiento documentado U.2.2 |
| `docs/visual-z-index-scale.md` | Escala z-index referencia |

**No existe:** `app/admin/(protected)/dashboard/loading.tsx` ni `app/admin/loading.tsx`. El loading de dashboard **no** es un Next.js route `loading.tsx`; es estado interno de `AdminShell`.

---

## 5. Admin Loading Flow

```
/admin/dashboard (SSR page)
  └─ app/admin/(protected)/layout.tsx
       └─ AdminToastProvider
            └─ AdminShell (client)
                 └─ useBusinessSettings({ businessId })
                      ├─ loading === true
                      │    └─ <div class="admin-shell admin-shell--loading">
                      │         spinner + "Cargando configuración…"
                      └─ loading === false
                           └─ sidebar + topbar + main + children
                                └─ AdminThemeToggle useEffect → data-dashboard-theme
```

**Detalle:**

| Paso | Qué ocurre |
|------|------------|
| 1 | `ProtectedAdminLayout` (server) resuelve auth + business brand |
| 2 | `AdminShell` hidrata client-side; `useBusinessSettings` inicia con `loading: true` |
| 3 | Early return renderiza solo `.admin-shell--loading` (sin sidebar/topbar) |
| 4 | Fetch Supabase `business_settings` (`select("*")`) |
| 5 | `loading: false` → shell completo + `children` (dashboard page) |
| 6 | `AdminThemeToggle` monta en sidebar → lee `localStorage("orderops-theme")` → setea `document.documentElement.setAttribute("data-dashboard-theme", "dark"|"light")` |

**Componente del texto:** `components/admin/admin-shell.tsx` líneas 57–70.

**Spinner:** `.admin-shell__loading-spinner` — border animado CSS `@keyframes admin-shell-loading-spin`.

**Duración:** Depende de latencia Supabase + hidratación. No hay skeleton progresivo ni route-level fallback.

---

## 6. Loading Screen Theme Audit

### Estilos actuales (`admin-shell.css`)

```css
.admin-shell {
  background: var(--surface-canvas-bg);
  color: var(--surface-canvas-text);
}
.admin-shell--loading { height: 100vh; place-items: center; }
.admin-shell__loading-text {
  color: color-mix(in srgb, var(--surface-canvas-text) 72%, transparent);
}
```

**No hay hardcodes `#fff` / `white` en el loading.** Usa tokens semánticos.

### Por qué se ve blanco en dark

| Pregunta | Respuesta |
|----------|-----------|
| ¿Fondo blanco viene del loading component? | **Indirectamente** — usa tokens, pero tokens resuelven a **paleta light** sin `data-dashboard-theme="dark"` |
| ¿Viene de body/html antes de hidratar? | **Sí, contribuye** — `body { background-color: var(--bg-canvas) }` → `#F8FAFC` en `:root` |
| ¿Viene de wrapper admin? | **Sí** — `.admin-shell` ocupa `100vh` con mismo token canvas |
| ¿Clase light default? | **Sí** — `:root` y `html[data-dashboard-theme="light"]` comparten valores light |
| ¿Inline style? | **No** |
| ¿Token mal resuelto? | **No roto** — resuelve correctamente al valor light por ausencia de selector dark |

### Clasificación de causa (loading)

| Tag | Aplica |
|-----|--------|
| `CSS_HARDCODE` | ❌ No en loading CSS |
| `THEME_BOOTSTRAP_DELAY` | ✅ Theme se aplica post-mount en sidebar |
| `LOADING_OUTSIDE_THEME_PROVIDER` | ✅ No hay provider; toggle no monta durante loading |
| `ADMIN_SHELL_DEFAULT_LIGHT` | ✅ Shell loading hereda `:root` light |
| `GLOBAL_BODY_BACKGROUND` | ✅ Body canvas light hasta bootstrap |
| `UNKNOWN_NEEDS_RUNTIME_QA` | ⚠️ Medir ms exactos de flash en browser |

---

## 7. Theme Application / Hydration Audit

### Storage y aplicación

| Aspecto | Implementación actual |
|---------|----------------------|
| Storage key | `localStorage` → `"orderops-theme"` (`"dark"` \| `"light"`) |
| DOM marker | `document.documentElement.setAttribute("data-dashboard-theme", theme)` |
| Quién aplica | Solo `AdminThemeToggle` en `useEffect([])` |
| SSR | `<html>` en `app/layout.tsx` **sin** `data-dashboard-theme` |
| Blocking script | **No existe** script inline pre-React para leer theme |
| Cookie / DB | **No** — solo localStorage client-side |
| `prefers-color-scheme` | **No usado** en admin (solo en catálogo público) |
| Clase `.dark` | Definida en `theme-tokens.css` junto a `[data-dashboard-theme="dark"]` pero admin usa solo data-attribute |

### Tokens relevantes

| Token | Light (`:root`) | Dark (`html[data-dashboard-theme="dark"]`) |
|-------|-----------------|---------------------------------------------|
| `--bg-canvas` | `#F8FAFC` | `#090A0D` |
| `--surface-canvas-bg` | `var(--bg-canvas)` | `var(--bg-canvas)` |
| `--text-primary` | `#09090B` | `#F8FAFC` |
| `color-scheme` | `light` | `dark` |

### Timeline en reload (usuario dark)

1. HTML SSR → sin attribute → tokens light
2. CSS paint → canvas claro + texto oscuro
3. React hydrate → AdminShell loading → sigue light
4. Settings load complete → sidebar mounts
5. `AdminThemeToggle` useEffect → `data-dashboard-theme="dark"` → repintado dark

**Flash:** Entre pasos 2–5. Severity **P0** para UX premium.

### SSR mismatch

No hay mismatch React text/content; hay **visual flash** por theme client-only tardío.

---

## 8. Operational Alerts Modal Flow

### Mapa de componentes

```
app/admin/(protected)/dashboard/page.tsx
  └─ AudioUnlockGate (client)
       └─ AudioUnlockModal
```

### Trigger exacto (`audio-unlock-gate.tsx`)

Modal `isOpen = true` cuando **todas** las condiciones:

| Condición | Fuente |
|-----------|--------|
| `hasMounted === true` | `useEffect` client mount |
| `canManageNotifications(role)` | owner / manager / operator (not viewer) |
| `soundEnabled === true` | `adminContext.profile.newOrderSoundEnabled` |
| `sessionAudioUnlocked === false` | Runtime module state `lib/notifications/audio.ts` |
| Delay 450ms | `AUDIO_UNLOCK_MODAL_DELAY_MS` |

**No depende de:** session store activa, pedidos en curso, realtime events.

**Sí reaparece en cada reload** si `sessionAudioUnlocked` resetea a `false` (by design U.2.2) aunque `orderops:audio-unlocked:v1` esté en localStorage.

### Permisos y audio

| Función | Archivo | Comportamiento |
|---------|---------|----------------|
| `canManageNotifications` | `lib/admin/permissions.ts` | owner, manager, operator |
| `unlockOperationalAudio` | `lib/notifications/audio.ts` | `audio.muted=true`, `play()`, `pause()` para desbloquear gesto |
| `markOperationalAudioSessionUnlocked` | mismo | Flag runtime in-memory |
| `persistOperationalAudioUnlocked` | mismo | `localStorage` key `orderops:audio-unlocked:v1` |
| Sound file | gate | `/sounds/new-order-sound.mp3`, volume 0.55 |

### UX controls actuales

| Control | Estado |
|---------|--------|
| Primary CTA | `Activar avisos` → `handleActivate` |
| Secondary / dismiss | **No existe** (removido en U.2.2 por diseño) |
| Close button | **No** |
| Escape | **No handler** |
| Overlay click | **No handler** — overlay es `<div>` decorativo |
| Portal | **No** — render inline en page tree |
| Scroll lock | **No explícito** |
| `dismissOperationalAudioPrompt` | Existe en `audio.ts` pero **no se llama** desde gate |

---

## 9. Operational Alerts Modal Visual Audit

### Estilos (`audio-unlock-modal.module.css`)

| Elemento | Valor actual | Tokenizado |
|----------|--------------|------------|
| Container | `position: fixed; inset: 0; z-index: 55` | z-index off-scale (doc says 60 modals) |
| Overlay | `rgba(31, 26, 20, 0.34)` + `backdrop-filter: blur(2px)` | Hardcoded warm brown |
| Panel bg | `#fffdf9` | ❌ `HARDCODED_LIGHT_SURFACE` |
| Panel border | `#ded4c9` | ❌ |
| Panel shadow | `0 22px 48px rgba(31, 26, 20, 0.16)` | ❌ |
| Hint text | `#6b6258` | ❌ (ignora `--text-secondary` en dark) |
| Mobile overlay | `rgba(24, 18, 14, 0.72)`, blur disabled | Hardcoded |

### Header / CTA (shared globals)

- `.admin-form-header h2/p` → **tokens** (`--text-primary`, `--text-secondary`) ✅
- `.admin-primary-button` → `background: var(--text-primary); color: #fff` — en dark invierte (botón claro sobre panel claro warm = contraste confuso)

### Clasificación de problemas visuales

| Tag | Evidencia |
|-----|-----------|
| `THEME_UNSAFE` | Panel/hint/overlay sin variant dark |
| `LOW_CONTRAST_DARK` | Warm white panel sobre dark dashboard |
| `HARDCODED_LIGHT_SURFACE` | `#fffdf9`, `#ded4c9`, `#6b6258` |
| `OUTDATED_COPY` | “avisos operativos” vs lenguaje actual dashboard |
| `OUTDATED_CTA` | Solo primary; sin secondary alineada a design system |
| `MISSING_SECONDARY_ACTION` | Sin “Ahora no” (decisión producto U.2.2) |
| `ACCESSIBILITY_GAP` | Ver sección 11 |
| `PERFORMANCE_RISK` | Blur leve (2px) — bajo riesgo |

---

## 10. Operational Alerts Modal Microcopy Audit

### Copy actual exacto

**Title (h2):**
```txt
Activar avisos operativos
```

**Body (p):**
```txt
OrderOps puede reproducir un sonido cuando entren nuevos pedidos. Esto ayuda a
responder mas rapido aunque estes usando otra pestana.
```

**Hint (p.admin-audio-unlock-modal__hint):**
```txt
Esta confirmacion prepara el sonido para la sesion actual.
```

**Primary CTA:**
```txt
Activar avisos
```

**Error states:**
```txt
No pudimos preparar el sonido en este navegador.
No pudimos activar el sonido. Proba nuevamente.
```

### Evaluación

| Criterio | Notas |
|----------|-------|
| Claridad | Aceptable; explica sonido + otra pestaña |
| Tono | Operativo; “avisos operativos” es genérico |
| Longitud | 3 párrafos + CTA — OK |
| Promesa funcional | Correcta (sonido en nuevo pedido) |
| Interacción requerida | Hint lo menciona (“confirmación”) |
| Alcance sesión | Hint lo dice; body no enfatiza “esta sesión” |
| Técnico / intimidante | Bajo |
| Naming | “avisos operativos” menos específico que “avisos de nuevos pedidos” |
| CTA | “Activar avisos” coherente pero vago |

### Copy propuesto para A2 (NO implementado)

**Title:**
```txt
Activar avisos de nuevos pedidos
```

**Body:**
```txt
OrderOps puede reproducir un sonido cuando entra un nuevo pedido, incluso si estás usando otra pestaña.
```

**Detail:**
```txt
Sólo se activa para esta sesión y podés cambiarlo más adelante.
```

**Primary CTA:**
```txt
Activar avisos
```

**Secondary (recomendado evaluar en A2):**
```txt
Ahora no
```

**Nota producto:** U.2.2 eliminó dismiss intencionalmente. A2 debe decidir si reintroducir secondary con `dismissOperationalAudioPrompt` (ya existe en `audio.ts`, 24h TTL) sin romper requisito de unlock por gesto del browser.

Referencia alineada: `notification-settings-card.tsx` ya usa *“Recibiras avisos de nuevos pedidos aunque estes usando otra pestana.”*

---

## 11. Accessibility Audit

| Criterio | Estado | Notas |
|----------|--------|-------|
| `role="dialog"` | ✅ | En panel |
| `aria-modal="true"` | ✅ | |
| `aria-labelledby` | ✅ | `#admin-audio-unlock-modal-title` |
| `aria-describedby` | ❌ | Body/hint no vinculados |
| Focus initial | ❌ | No autofocus en CTA |
| Focus trap | ❌ | Tab puede escapar al dashboard detrás |
| Escape | ❌ | No listener |
| Close button | ❌ | |
| Overlay click | ❌ | No dismiss |
| Keyboard nav | ⚠️ | Solo botón primary focusable |
| Button labels | ✅ | Texto claro |
| Reduced motion | ⚠️ | Spinner loading respeta? Modal sin animación; overlay blur estático |
| Loading `role="status"` | ✅ | AdminShell loading |

**Clasificación:** `ACCESSIBILITY_PARTIAL`

---

## 12. Performance Audit

### Admin loading

| Pattern | Riesgo |
|---------|--------|
| Spinner CSS rotate | ✅ Bajo — transform only |
| Full viewport block | ⚠️ Medio — UX, no GPU |
| Supabase fetch | ⚠️ Latencia red — no CSS |

### Audio modal

| Pattern | Riesgo |
|---------|--------|
| `backdrop-filter: blur(2px)` desktop | P2 — blur leve |
| Blur disabled mobile | ✅ |
| `box-shadow` grande panel | P3 |
| `transition: all` | ❌ No usado en modal CSS |
| Portal absence | ⚠️ Stacking context con dashboard content |
| z-index 55 | ⚠️ Entre overlay (50) y modal estándar (60) per `visual-z-index-scale.md` |

---

## 13. Hardcodes Audit

| File | Hardcode / pattern | Impact | Recommended phase |
|------|--------------------|--------|-------------------|
| `audio-unlock-modal.module.css` | `background: #fffdf9` | Panel siempre claro | **A2** |
| `audio-unlock-modal.module.css` | `border: 1px solid #ded4c9` | Borde warm legacy | **A2** |
| `audio-unlock-modal.module.css` | `color: #6b6258` hint | Texto illegible en dark panel context | **A2** |
| `audio-unlock-modal.module.css` | `rgba(31, 26, 20, 0.34)` overlay | No usa token overlay | **A2** |
| `audio-unlock-modal.module.css` | `box-shadow: 0 22px 48px rgba(...)` | Sombra legacy | **A2** |
| `admin-surfaces.css` | `.admin-primary-button { color: #fff }` | CTA modal | **A2** (shared — cautela) |
| `admin-shell.css` | *(none on loading)* | N/A | — |
| `admin-theme-toggle.tsx` | Theme only in useEffect | Flash loading | **A1** |
| `app/layout.tsx` | No theme on `<html>` SSR | Default light paint | **A1** |

---

## 14. Root Cause Hypothesis

### Loading blanco

**Conclusión: 5 — Causa mixta**

1. **`THEME_BOOTSTRAP_DELAY`** — `data-dashboard-theme` se setea solo cuando monta `AdminThemeToggle` (`useEffect`), después de que `AdminShell` termina de cargar settings y renderiza sidebar.

2. **`LOADING_OUTSIDE_THEME_TOGGLE`** — Durante `admin-shell--loading`, sidebar (y por tanto theme toggle) **no existe en el DOM**.

3. **`GLOBAL_BODY_BACKGROUND` / default light tokens** — `:root` define `--bg-canvas: #F8FAFC`. Body y `.admin-shell` pintan canvas claro antes del attribute dark.

**No es primarily `CSS_HARDCODE`** en el loading: el componente usa tokens correctamente; el problema es **timing + default palette**.

### Modal desactualizado

**Conclusión:** Superficie y overlay **hardcodeados** en módulo CSS legacy (`#fffdf9` warm palette) sin soporte `html[data-dashboard-theme="dark"]`. Header usa tokens pero queda sobre panel claro fijo → **`HARDCODED_LIGHT_SURFACE` + `THEME_UNSAFE`**.

---

## 15. Risk Classification

| Riesgo | Prioridad | Evidencia |
|--------|-----------|-----------|
| Dark reload white flash | **P0** | Theme bootstrap post-loading |
| Modal contrast in dark | **P0** | `#fffdf9` panel on dark dashboard |
| Modal hardcoded surface | **P1** | No tokens in module CSS |
| Theme bootstrap delay | **P0** | No inline bootstrap script |
| No secondary close action | **P2** | Product decision; UX friction |
| Insufficient accessibility | **P1** | No trap/Escape/describedby |
| Overlay z-index off-scale | **P2** | 55 vs doc 60 |
| Audio permission flow breakage | **P0** if broken in fix | Must preserve `play()` on user gesture |
| Overlay blur cost | **P3** | 2px blur |

---

## 16. Recommended Fix Plan

### A1 — Theme-Safe Admin Loading Screen

**Objetivo:** Eliminar flash blanco en reload para usuarios con dark theme guardado.

**Archivos probables:**

- `app/layout.tsx` o `app/admin/(protected)/layout.tsx` — inline blocking script que lee `localStorage('orderops-theme')` y setea `data-dashboard-theme` antes de paint
- `components/admin/layout/admin-theme-toggle.tsx` — deduplicar/sync con bootstrap
- Opcional: extraer helper `lib/admin/theme.ts` (solo si reduce duplicación)

**Enfoque recomendado:**

```html
<script dangerouslySetInnerHTML={{ __html: `
  try {
    var t = localStorage.getItem('orderops-theme');
    if (t === 'dark') document.documentElement.setAttribute('data-dashboard-theme','dark');
  } catch(e) {}
`}} />
```

En `<head>` del root layout (o admin subtree).

**Alternativa complementaria:** Mover theme bootstrap a componente que monte en layout **antes** del loading gate (no depender del sidebar).

**Riesgo:** Medio — script debe ser mínimo y consistente con toggle.

**NO tocar:** KPIs, dashboard content, business settings fetch logic, Supabase.

---

### A2 — Operational Alerts Modal Tokenization + Microcopy

**Objetivo:** Panel/overlay alineados a surface system + copy mejorado.

**Archivos probables:**

- `components/admin/notifications/audio-unlock-modal.module.css` — reemplazar hardcodes por `var(--surface-elevated-bg)`, `var(--border-subtle)`, `var(--text-secondary)`, overlay tokenizado
- `components/admin/notifications/audio-unlock-modal.tsx` — microcopy A2; opcional secondary; `aria-describedby`
- Referencia visual: `admin-surfaces.css` / order modal patterns

**Microcopy:** Aplicar propuesta sección 10.

**Secondary “Ahora no”:** Evaluar con producto — wire a `dismissOperationalAudioPrompt` si se aprueba.

**Riesgo:** Medio en shared `admin-primary-button` — cambios globales evitar; scope al modal.

**NO tocar:** `unlockOperationalAudio` play/pause flow, `canManageNotifications`, realtime sound pipeline, gate delay lógica (salvo dismiss).

---

### A3 — QA + No-Flicker Pass

**Objetivo:** Validar reload dark/light, modal en 320/390/desktop, accesibilidad básica, sin regresiones audio.

**Checklist:**

- Hard reload `/admin/dashboard` dark → sin flash blanco perceptible
- Light theme reload → sin regresión
- Modal dark/light contraste WCAG-ish manual
- Activar avisos → sonido unlock OK
- Reload → modal reaparece si session unlocked false
- viewer role → no modal
- sound disabled profile → no modal
- z-index vs order modal / drawer

**NO tocar:** Top section, lanes, order modal behavior.

---

## 17. What Not To Touch

Durante A1/A2/A3 **no modificar**:

- Dashboard top section presenter/view model
- Toolbar / search / filtros / tabs
- Lanes / order cards
- Order detail modal
- Realtime subscriptions
- Server actions / Supabase migrations
- Session store logic
- KPI calculations / thresholds
- `AudioUnlockGate` unlock sequence (`play()` gesture) — solo UX alrededor

---

## 18. Validation Plan For A1/A2

| Fase | Validación automática | Validación manual |
|------|----------------------|-------------------|
| A1 | `npx tsc --noEmit`, `npm run build` | Reload dark/light; DevTools disable cache |
| A2 | idem + visual | Modal dark/light; CTA; optional dismiss |
| A3 | Full build | Cross-browser; mobile 320px; audio unlock |

**A0:** No se modificó código funcional. No se requiere tsc/build para A0.

---

## 19. Open Questions

1. **¿Reintroducir “Ahora no”?** U.2.2 lo eliminó por diseño operativo. A2 debe confirmar producto antes de usar `dismissOperationalAudioPrompt`.

2. **¿Bootstrap theme en root vs admin-only layout?** Root script afecta todas las rutas; admin-only limita scope pero dashboard loading pasa por protected layout.

3. **¿Unificar z-index modal a 60?** Alineación con `visual-z-index-scale.md` — verificar stacking vs topbar (40) y toasts (100).

4. **¿Loading de settings es evitable?** Cache settings SSR o pasar flags desde server layout reduciría tiempo en estado loading (fuera de scope A1 mínimo).

5. **¿`rememberedAudioSetup` debería suprimir modal visual?** Hoy no afecta show; solo debug/eligibility type. Confirmar intent.

---

## Appendix — File Map

| Concern | File | Component/class | Current behavior | Notes |
|---------|------|-----------------|------------------|-------|
| Admin loading | `components/admin/admin-shell.tsx` | `AdminShell` | Early return if `useBusinessSettings.loading` | Text: `Cargando configuración…` |
| Admin loading CSS | `components/admin/admin-shell.css` | `.admin-shell--loading` | Tokenized full viewport center | No dark until theme bootstrap |
| Settings fetch | `lib/business/use-business-settings.ts` | `useBusinessSettings` | Supabase client fetch | Drives loading duration |
| Protected layout | `app/admin/(protected)/layout.tsx` | `ProtectedAdminLayout` | Wraps all admin pages in AdminShell | Imports legacy CSS side effects |
| Theme storage | `components/admin/layout/admin-theme-toggle.tsx` | `AdminThemeToggle` | localStorage + data-attribute | Runs after sidebar mount |
| Theme tokens | `app/theme-tokens.css` | `:root` / `[data-dashboard-theme="dark"]` | Semantic palette | Complete dark block exists |
| Global body | `app/globals.css` | `html, body` | `background: var(--bg-canvas)` | Light until attribute |
| Modal trigger | `components/admin/notifications/audio-unlock-gate.tsx` | `AudioUnlockGate` | Delay 450ms; role + sound + session | Dashboard only |
| Modal component | `components/admin/notifications/audio-unlock-modal.tsx` | `AudioUnlockModal` | Fixed overlay + panel | No portal |
| Modal CSS | `components/admin/notifications/audio-unlock-modal.module.css` | panel/overlay | Warm hardcodes | Extracted from legacy |
| Audio permission | `lib/notifications/audio.ts` | `unlockOperationalAudio` | muted play unlock | HTMLAudioElement |
| Overlay | `audio-unlock-modal.module.css` | `__overlay` | rgba + blur(2px) | Mobile darker, no blur |
| CTA | `admin-surfaces.css` | `.admin-primary-button` | Inverted text-primary bg | Shared admin wide |
| Dashboard mount | `app/admin/(protected)/dashboard/page.tsx` | page | `<AudioUnlockGate />` | Server fetches orders |

---

## Appendix — Search Results Summary

Búsquedas ejecutadas en repo:

| Pattern | Primary hit |
|---------|-------------|
| `Cargando configuración` | `admin-shell.tsx:67` |
| `Activar avisos operativos` | `audio-unlock-modal.tsx:32` |
| `Activar avisos` | `audio-unlock-modal.tsx:51` |
| `reproducir un sonido` | `audio-unlock-modal.tsx:34` |
| `AudioContext` | No usado — `HTMLAudioElement` only |
| `loading.tsx` (admin dashboard) | **Not found** — only `products/loading.tsx` |
| `theme-provider` | **Not found** — custom toggle only |
| `data-dashboard-theme` | `admin-theme-toggle.tsx`, `theme-tokens.css` |

---

**Phase A0 — Audit complete.**

No se modificó código funcional.  
No se modificó CSS.  
No se modificaron tokens.  
No se requiere tsc/build para esta fase.

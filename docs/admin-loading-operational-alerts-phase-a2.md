# Admin Loading + Operational Alerts Phase A2 — Operational Alerts Modal Tokenization + Microcopy

## Objetivo

Actualizar el modal de avisos operativos para que responda a dark/light, elimine hardcodes legacy warm, mejore microcopy y accesibilidad básica, preservando el flujo de audio unlock.

## Contexto

- A0 auditó hardcodes y gaps de accesibilidad.
- A1 resolvió theme bootstrap del loading (no tocado en A2).
- A2 tokeniza overlay/panel, actualiza copy y reintroduce dismiss seguro vía helper existente.

## Archivos modificados

- `components/admin/notifications/audio-unlock-modal.tsx`
- `components/admin/notifications/audio-unlock-modal.module.css`
- `components/admin/notifications/audio-unlock-gate.tsx`

## Archivos creados

- `docs/admin-loading-operational-alerts-phase-a2.md`

## Cambio principal

Reemplazo de superficie warm hardcodeada por tokens semánticos (`--surface-elevated-*`, `--text-*`, `--shadow-card`) y microcopy alineado al dashboard actual. Integración mínima de `dismissOperationalAudioPrompt` para “Ahora no” + Escape.

## Modal tokenization

| Elemento | Antes | Después |
|----------|-------|---------|
| Panel bg | `#fffdf9` | `var(--surface-elevated-bg)` |
| Border | `#ded4c9` | `var(--surface-elevated-border)` |
| Hint | `#6b6258` | `var(--text-secondary)` |
| Overlay | rgba warm + blur | `color-mix(in srgb, var(--text-primary) 28%, transparent)` |
| Shadow | rgba warm | `var(--shadow-card)` |
| z-index | 55 | 60 (escala modal documentada) |
| backdrop-filter | blur(2px) | Eliminado |

Mobile: overlay más opaco (`40%`) sin blur.

## Microcopy aplicado

| Campo | Copy |
|-------|------|
| Título | Activar avisos de nuevos pedidos |
| Body | OrderOps puede reproducir un sonido cuando entra un nuevo pedido, incluso si estás usando otra pestaña. |
| Detail | Sólo se activa para esta sesión y podés cambiarlo más adelante. |
| Primary CTA | Activar avisos |
| Secondary | Ahora no |
| Error (acento) | Probá nuevamente |

## Accessibility improvements

- `aria-describedby` vincula description + detail
- Focus inicial en CTA primary al abrir
- Escape ejecuta dismiss (mismo handler que “Ahora no”)
- Sin overlay click dismiss (evita cierre accidental)
- Focus trap: **pendiente** (A3 o fase dedicada)

## Secondary action decision

**Se agregó “Ahora no” usando `dismissOperationalAudioPrompt`.**

- Gate llama helper existente (TTL 24h en `orderops:audio-unlock-dismissed:v1`)
- Cierra modal sin `play()` ni `markOperationalAudioSessionUnlocked(true)`
- Eligibility en gate ahora respeta `dismissedRecently` antes del delay y al expirar el timer

## Audio unlock flow preservation

Sin cambios en:

- `unlockOperationalAudio` / `HTMLAudioElement.play()` muted unlock
- `markOperationalAudioSessionUnlocked` / `persistOperationalAudioUnlocked`
- Sound file `/sounds/new-order-sound.mp3`, volume 0.55
- Delay 450ms, role checks, `soundEnabled` gating
- Storage key `orderops:audio-unlocked:v1`

## Dark / light readiness

Panel, overlay, hint y header usan tokens que cambian con `html[data-dashboard-theme]`. CTA usa clases globales `admin-primary-button` / `admin-secondary-link` ya tokenizadas.

## Qué se preservó

- Unlock audio flow
- Role/soundEnabled gating
- Delay 450ms
- localStorage audio keys
- Session unlock behavior
- Theme bootstrap A1

## Qué NO se tocó

- Theme bootstrap A1 (`app/layout.tsx`, `AdminThemeToggle`)
- AdminShell loading
- Top section
- Toolbar/search/filtros
- Lanes/cards/modal de pedido
- Realtime
- Server actions
- DB/Supabase
- Tokens globales (`theme-tokens.css`, `globals.css`)
- `lib/notifications/audio.ts` (solo reutilizado helper existente)

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | ✅ Exit 0 |
| `npm run lint` | ⚠️ No configurado — `next lint` abre setup interactivo de ESLint |
| `npm run build` | ✅ Exit 0 |

## QA manual recomendado

1. Dark/light modal legible y sin panel warm
2. Activar avisos → unlock OK, modal cierra
3. Ahora no → cierra, no unlock, no reaparece 24h
4. Escape → mismo que Ahora no
5. Focus inicial en CTA
6. Loading A1, top section, toolbar, lanes intactos

**Estado:** Pendiente de verificación en browser.

## Riesgos restantes

- Focus trap no implementado
- Overlay click dismiss ausente (intencional)
- `admin-primary-button` global en dark invierte colores — validar contraste en panel tokenizado

## Próxima fase recomendada

**A3 — QA + No-Flicker Pass** (focus trap opcional, cross-browser, regresión loading + modal)

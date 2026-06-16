# Admin Loading + Operational Alerts Phase A2.1 — Audio Unlock Interaction Gate Refinement

## Objetivo

Refinar el modal de audio como **interaction gate** del navegador: obtener una interacción del usuario para preparar el sonido, no ofrecer aceptar/cancelar.

## Contexto

A2 tokenizó el modal y agregó “Ahora no” con dismiss 24h. QA detectó que el objetivo real es desbloquear audio por política del navegador, no pedir permiso opcional. A2.1 corrige comportamiento, overlay, CTA y microcopy.

## Archivos modificados

- `components/admin/notifications/audio-unlock-modal.tsx`
- `components/admin/notifications/audio-unlock-modal.module.css`
- `components/admin/notifications/audio-unlock-gate.tsx`

## Archivos creados

- `docs/admin-loading-operational-alerts-phase-a2-1.md`

## Problema detectado en QA

- Overlay demasiado grisáceo en dark (mezcla con `text-primary` claro)
- CTA con contraste incorrecto al usar `admin-primary-button` global en dark
- “Ahora no” no corresponde al objetivo de interacción obligatoria del browser
- Microcopy no explicaba que hace falta tocar la pantalla una vez

## Cambio principal

Modal reformulado como puerta de interacción: una sola acción (preparar sonido), overlay clickable, sin dismiss secundario.

## Microcopy aplicado

| Campo | Copy |
|-------|------|
| Título | Preparar sonido de nuevos pedidos |
| Body | Tocá una vez la pantalla para que OrderOps pueda reproducir el aviso sonoro. |
| Detail | Así vas a escuchar cuando entre un pedido nuevo, incluso si estás usando otra pestaña. |
| CTA | Preparar sonido |
| Error unlock | No pudimos preparar el sonido. Probá nuevamente. |

## Secondary action decision

Se removió “Ahora no” porque el objetivo del modal no es cancelar, sino obtener una interacción para preparar el sonido del navegador.

Revertido en gate:

- `dismissOperationalAudioPrompt` (sin llamadas desde UI)
- `dismissedRecently` gating
- Escape como dismiss

Helper en `lib/notifications/audio.ts` permanece intacto sin uso desde esta UI.

## Overlay interaction behavior

Click en overlay/lateral ejecuta el mismo intento de unlock que el CTA principal (`onActivate` → `handleActivate`).

Overlay implementado como `<button>` unstyled con `aria-label="Preparar sonido de nuevos pedidos"`. Panel elevado (`z-index: 1`) evita activación accidental al interactuar con el diálogo.

Guard `activateInFlightRef` evita doble ejecución concurrente.

## Overlay visual adjustment

| Modo | Scrim |
|------|-------|
| Light | `color-mix(in srgb, var(--text-primary) 16%, transparent)` |
| Dark | `color-mix(in srgb, var(--bg-canvas) 58%, transparent)` |
| Dark mobile | 64% canvas mix |

Sin `backdrop-filter` ni blur. Dark oscurece canvas, no aclara/grisa.

## CTA contrast adjustment

Clase local `.primaryAction` scoped al modal:

```css
background: var(--text-primary);
color: var(--bg-canvas);
```

Light: fondo oscuro, texto canvas claro. Dark: fondo claro, texto canvas oscuro. Sin modificar `.admin-primary-button` global.

## Accessibility notes

- `role="dialog"`, `aria-modal`, `aria-labelledby`, `aria-describedby` preservados
- Focus inicial en CTA primary
- Overlay button con `aria-label`
- Escape: inactivo (no dismiss)
- Focus trap: pendiente (A3)

## Audio unlock flow preservation

Sin cambios en:

- `unlockOperationalAudio` / muted `play()` unlock
- `markOperationalAudioSessionUnlocked` / `persistOperationalAudioUnlocked`
- Sound `/sounds/new-order-sound.mp3`, volume 0.55
- Delay 450ms, role/soundEnabled gating
- `orderops:audio-unlocked:v1` storage key

## Qué se preservó

- Unlock audio flow core
- Role/soundEnabled gating
- Delay 450ms
- Session unlock behavior
- Tokenización panel A2 (surface-elevated, shadow-card)
- Theme bootstrap A1

## Qué NO se tocó

- Theme bootstrap A1
- AdminShell loading
- `lib/notifications/audio.ts`
- Top section
- Toolbar/search/filtros
- Lanes/cards/modal de pedido
- Realtime
- Server actions
- DB/Supabase
- Tokens globales

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | ✅ Exit 0 (tras `npm run build`) |
| `npm run lint` | ⚠️ No configurado — `next lint` abre setup interactivo de ESLint |
| `npm run build` | ✅ Exit 0 |

## QA manual recomendado

1. Light/dark: sin “Ahora no”, copy nuevo, overlay no lavado
2. CTA y overlay click preparan sonido y cierran modal
3. Escape no cierra como cancelación
4. No dismiss 24h desde UI
5. Loading A1, dashboard content intactos

**Estado:** Pendiente de verificación en browser.

## Riesgos restantes

- Focus trap no implementado
- Usuario debe interactuar para cerrar modal (intencional)
- Overlay full-screen button puede capturar focus tab order antes del panel (validar en QA)

## Próxima fase recomendada

**A3 — QA + No-Flicker Pass**

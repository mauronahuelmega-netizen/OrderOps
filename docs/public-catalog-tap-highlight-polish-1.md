# PUBLIC-CATALOG-TAP-HIGHLIGHT-POLISH-1

## Estado

```text
PASS — ANDROID REAL-DEVICE QA COMPLETE
```

**Fecha:** 2026-08-15
**Commit / push / deploy:** pending this closeout

---

## Objetivo

Eliminar el highlight celeste nativo de Android/Chrome (`-webkit-tap-highlight-color`) al tocar controles del catálogo público, preservando feedback propio y `:focus-visible`.

---

## Preflight

| Item | Resultado |
|------|-----------|
| Tap-highlight previo en repo | **NO** |
| Owner CSS | `app/globals.css` (chrome público ya vive aquí: `.catalog-page`, `.public-business-header`) |
| Root público | `.public-business-layout` (`app/b/[slug]/layout.tsx`) |
| Focus-visible existente | Sí — chips, modal close/submit, header links/buttons, theme switch |

---

## Implementation

**Selector final:**

```css
.public-business-layout :is(a, button, [role="button"], label, input, select, textarea, summary) {
  -webkit-tap-highlight-color: transparent;
}
```

**Por qué este scope:**
- Cubre header + catálogo + modales/cart (hijos de `.catalog-page`) + checkout/success bajo `/b/[slug]`.
- No usa `*` global de OrderOps.
- Incluye `label` para Papas/Salsas (radio/checkbox rows).

**Propiedad:** `-webkit-tap-highlight-color: transparent` únicamente.

---

## Accessibility

| Gate | Status |
|------|--------|
| focus-visible preserved | **YES** — no se tocó outline / `:focus` / `:focus-visible` |
| outline removed | **NO** |
| ARIA / tabIndex | unchanged |

---

## Blast radius

| Gate | Status |
|------|--------|
| global app (admin) affected | **NO** |
| public `/b/[slug]` only | **YES** |

---

## Coverage intended

- Product card `+`
- Category nav chips
- Product detail close / CTA
- Customization: close, Papas, Salsas, Agregar, +/−, CTA
- Cart bar / cart sheet controls
- Public header menu / links

No redesign · no motion · no touch-target · no `touch-action` / `user-select` changes.

---

## QA

### Android Chrome real device

**PASS** — product owner, Android Chrome real device (2026-08-15).

Confirmado:
- tap highlight celeste eliminado;
- feedback propio de botones preservado;
- controles siguen funcionando normalmente.

### Desktop keyboard

Local expectation: Tab focus rings unchanged (existing `:focus-visible` rules intact).

### Light / dark

Property is theme-agnostic; no new visual tokens.

---

## Checks

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | **PASS** |
| `git diff --check` | **PASS** |
| `npm run build` | **PASS** |
| `npm run lint` | **KNOWN DEBT** — ESLint 9 circular JSON (`plugins.react`) |

---

## Gate

| Criterion | Status |
|-----------|--------|
| Tap highlight removed (CSS) | ✓ |
| Public interaction feedback preserved | ✓ (CSS-only; no motion/control edits) |
| Focus-visible preserved | ✓ |
| Android real-device QA | ✓ |
| No control redesign | ✓ |
| No motion change | ✓ |
| No global `outline: none` | ✓ |
| No unjustified global `*` | ✓ |
| Dedicated doc | ✓ |

# PUBLIC-4-QA — Unified Readiness Browser Smoke

## Objetivo

Validar en navegador que `PublicPresenceReadiness` funciona correctamente en Landing y Catálogo, que no rompe responsive, que refleja dirty state local y que no introduce warnings ni doble checklist.

## Alcance

- QA browser smoke sobre rutas de Presencia pública post PUBLIC-4.
- Microfixes visuales solo si QA detecta regresiones (ninguno requerido).
- Sin cambios de features, server actions, DB ni formularios.

## Rutas auditadas

| Ruta | Viewports probados |
|------|-------------------|
| `/admin/settings/public` | 536px (default), 390px (mobile) |
| `/admin/settings/public/landing` | 1440px, 820px, 390px |
| `/admin/settings/public/catalogo` | 1440px, 820px, 390px |

Entorno: `http://localhost:3000` (dev server activo). Negocio de prueba: La Burguesía.

## QA Landing

### Estado inicial

| Check | Resultado |
|-------|-----------|
| Título "Estado de presencia pública" | ✅ |
| Secciones Identidad / Landing / Catálogo / Publicación | ✅ |
| No aparece "Estado de landing" | ✅ |
| Un solo checklist (`readinessPanelCount: 1`) | ✅ |
| Sin overflow horizontal | ✅ (`scrollWidth === clientWidth`) |

### Dirty state local

| Acción | Resultado esperado | Resultado |
|--------|-------------------|-----------|
| Editar descripción | Descripción → Pendiente de guardar; botón Guardar cambios; aviso pendiente | ✅ |
| Cambiar color (palette Bordó) | Color de marca → Pendiente de guardar; preview reacciona | ✅ |
| Seleccionar logo (file input) | Logo → Pendiente de guardar; botón Guardar cambios | ✅ (no guardado — archivo fake) |

### Save

| Check | Resultado |
|-------|-----------|
| Flujo Guardando... → Guardado | ✅ |
| Feedback "Cambios publicados correctamente." | ✅ |
| Pendiente de guardar desaparece post-save | ✅ |
| Sin warning `useActionState` | ✅ |
| Upload flow no probado con guardado real (archivo fake no persistido) | N/A |

## QA Catálogo

### Estado inicial

| Check | Resultado |
|-------|-----------|
| Título "Estado de presencia pública" | ✅ |
| Variante compact (`panelCompact`) | ✅ |
| Un solo checklist | ✅ |
| Shell PUBLIC-2 intacto (links Landing/Catálogo, Ver catálogo público) | ✅ |
| Sin overflow horizontal | ✅ |

### Dirty state local

| Acción | Resultado esperado | Resultado |
|--------|-------------------|-----------|
| Editar headline | Título del catálogo → Pendiente de guardar; aviso lista solo ese item | ✅ |
| Editar badge | Badge → Pendiente de guardar | ✅ |
| Editar microcopy | Microcopy → Pendiente de guardar | ✅ |

### Save

| Check | Resultado |
|-------|-----------|
| Flujo Guardando... → Guardado | ✅ |
| Feedback "Cambios publicados correctamente." | ✅ |
| Pendiente de guardar desaparece post-save | ✅ |
| `<form action={formAction}>` intacto | ✅ |
| Sin warning `useActionState` | ✅ |

## QA Índice

| Check | Resultado |
|-------|-----------|
| Índice compacto (cards Landing / Catálogo) | ✅ |
| Links a `/landing` y `/catalogo` funcionan | ✅ |
| No renderiza editor completo | ✅ |
| Sin readiness en índice (esperado — PUBLIC-4 no lo implementó) | ✅ OK |
| Sin overflow | ✅ |

## Responsive QA

Medición: `document.documentElement.scrollWidth === document.documentElement.clientWidth`

| Viewport | Landing overflow | Catálogo overflow | Readiness legible |
|----------|-----------------|-------------------|-------------------|
| 1440px desktop | false | false | ✅ |
| 820px tablet | false | false | ✅ |
| 390px mobile | false | false | ✅ |

Notas mobile:

- Catálogo compact oculta subtítulo (`display: none`) — comportamiento diseñado en CSS.
- Botones y navegación mobile usables.
- Sin overflow global en ningún viewport.

## Console QA

Hook de consola instalado en sesión (`log` / `warn` / `error`).

| Ruta | Warnings nuevos |
|------|----------------|
| `/admin/settings/public` | Ninguno |
| `/admin/settings/public/landing` | Ninguno |
| `/admin/settings/public/catalogo` | Ninguno |

Específicamente ausente:

- `An async function with useActionState was called outside of a transition.`
- Warnings de hydration, controlled/uncontrolled, duplicate keys, invalid aria.

## Microfixes aplicados

Ninguno.

QA pasó sin regresiones visuales, de estado ni de consola que requieran cambios de código.

## Archivos modificados

Ninguno (solo documentación).

## Archivos creados

- `docs/admin-settings-public-phase-public-4-qa-unified-readiness-browser-smoke.md`

## Validaciones

```bash
npx tsc --noEmit   # ✅ exit 0
npm run build      # ✅ exit 0
npm run lint       # ❌ flake conocido ESLint 9 — Converting circular structure to JSON
```

## Resultado

**PASS** — PUBLIC-4 readiness unificado validado en browser. Criterios de aceptación cumplidos.

### Efectos colaterales de QA (datos de prueba)

Los tests de save persistieron sufijos `QA` en:

- Descripción de landing (`… - QA test`)
- Headline, badge y microcopy del catálogo (`… QA`)

Revertir manualmente si se desea limpiar el entorno de demo.

## Deuda restante

- Readiness compacto en índice `/admin/settings/public` (opcional, PUBLIC-4).
- Eliminar shim/CSS deprecado `public-landing-readiness*`.
- QA save con upload real de logo/portada (no ejecutado — solo pending state con archivo fake).
- Flake ESLint 9 (preexistente).

## Próxima fase

**PUBLIC-5** — Preview dual o experiencia de preview compartida entre Landing y Catálogo.

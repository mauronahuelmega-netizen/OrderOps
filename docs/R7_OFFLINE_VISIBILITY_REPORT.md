# R.7 Offline / Visibility Report

## 1. Que problema resuelve R.7

R.7 endurece la capa de recuperacion del dashboard cuando el navegador:

- pasa a `hidden` / `visible`
- queda `offline` / `online`
- o cuando Supabase Realtime vuelve a `SUBSCRIBED`

El objetivo no es offline-first. El objetivo es evitar:

- side effects falsos
- refreshes redundantes
- estado engañoso del indicador realtime
- ruido historico al recuperar sincronizacion

## 2. Archivos tocados

- `components/admin/orders/use-admin-orders-realtime.ts`
- `components/admin/orders/admin-dashboard-orders.tsx`
- `docs/CURRENT_PHASE.md`
- `docs/HANDOFF.md`
- `docs/ROADMAP.md`
- `docs/QA_CHECKLIST.md`

## 3. Que comportamiento existia antes

Antes de R.7:

- el refresh silencioso ya estaba separado de toast / sonido / highlight
- existian triggers por:
  - reconnect realtime
  - `visibilitychange`
  - `online`
- habia cooldown basico
- el health indicator dependia solo del status del canal realtime

Riesgos detectados:

- el navegador podia quedar offline sin que el indicador dejara de verse `En vivo`
- `online` podia disparar refresh aun con la pestana `hidden`
- `visibility` y `online` podian encadenarse de forma mas ruidosa de lo necesario

## 4. Que comportamiento quedo ahora

Quedo asi:

- el hook realtime escucha `online` / `offline`
- si el navegador queda offline, el estado expuesto al dashboard pasa a `disconnected`
- el refresh silencioso:
  - no corre por `visibility` si la pestana sigue hidden
  - no corre por `visibility` / `online` / `reconnect` si el navegador sigue offline
  - no corre por `online` si la pestana sigue hidden
- el cooldown existente sigue evitando cascadas de recovery
- durante recovery por `visibility`, `online` o `reconnect` se abre una ventana corta de supresion de side effects
- si llega un `INSERT` realtime dentro de esa ventana, el pedido entra al state de forma silenciosa

## 5. Como se evitaron side effects falsos

No se toco el pipeline de side effects.

Se mantuvo la separacion:

- `INSERT` realtime genuino:
  - puede insertar
  - puede toastear
  - puede sonar
  - puede marcar highlight

- refresh silencioso:
  - solo reconcilia state
  - no toca side effects
  - no toca dedupe de side effects

Hotfix posterior:

- **R.7 / S.2 visibility recovery**
  - los inserts recibidos mientras la pestana estaba oculta o durante la ventana corta de recovery visible se tratan como recuperacion silenciosa
  - no disparan toast, sonido ni highlight historicos

## 6. Que casos quedan pendientes de QA real

Pendiente de confirmar en browser real:

- hidden -> visible con pedidos creados mientras la pestana estaba en background
- hidden -> visible sin replay de sonido / toast / highlight historicos
- offline -> online con el dashboard abierto
- reconnect realtime mientras el navegador alterna entre online/offline
- confirmacion visual del health indicator en todas esas transiciones
- presence re-trackeando bien despues de volver visible

## 7. Resultado de validaciones

- `npx tsc --noEmit`: OK
- `npm run lint`: sigue abriendo el setup interactivo de `next lint`; no hay resultado no interactivo confiable todavia

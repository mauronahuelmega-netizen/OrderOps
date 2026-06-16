# U.2.2 Audio Unlock Modal Report

## 1. Por que se cambio card por modal

La card de U.2.1 era correcta tecnicamente, pero demasiado facil de ignorar.

Para OrderOps este paso no es promocional: es preparacion de estacion operativa.

Por eso U.2.2 cambia la UX a un modal breve, centrado y con overlay suave.

## 2. Comportamiento exacto del modal

El modal aparece cuando:

- el usuario esta en `/admin/dashboard`
- el rol es operativo (`owner`, `admin`, `manager`, `operator`)
- el audio no esta desbloqueado en la sesion actual
- el componente ya monto client-side

Se muestra con un delay corto de 450 ms.

## 3. Persistencia localStorage y sesion

U.2.2.2 separa dos conceptos:

- remembered audio setup:
  - `localStorage`
  - indica que el usuario ya preparo avisos alguna vez
- session audio unlocked:
  - estado runtime del documento actual
  - solo vale despues de un `play()` exitoso en esta carga

Claves usadas:

- `orderops:audio-unlocked:v1`

Si el unlock se activa:

- se guarda `audio-unlocked`
- se marca `sessionAudioUnlocked = true`
- el modal se cierra para esta carga

Si la pagina se recarga despues:

- `rememberedAudioSetup` sigue siendo `true`
- `sessionAudioUnlocked` vuelve a `false`
- el modal puede aparecer otra vez hasta que haya un gesto real exitoso en esa carga

El modal ya no ofrece dismiss operacional:

- no existe `Ahora no`
- la unica salida es un unlock exitoso
- el sonido operativo se trata como preparacion de estacion, no como preferencia descartable

## 4. Roles que lo ven

Lo ven:

- owner
- admin legacy
- manager
- operator

No lo ve:

- viewer

Desde U.3 tampoco aparece si el usuario apaga `Sonido` en sus preferencias de nuevos pedidos.

## 5. Como se evita hydration mismatch

- no se toca `window` ni `localStorage` durante SSR
- la decision se toma despues del mount
- el modal no renderiza hasta que `hasMounted` es verdadero
- el estado de sesion se resuelve solo client-side
- el estado recordado y el estado de sesion se evaluan por separado

## 6. Confirmacion de que no se toco realtime ni notification pipeline

U.2.2.3 no cambia:

- pipeline realtime base
- browser notification gating
- toast / highlight / sound behavior de pedidos
- modelo `visible / hidden / recovery`

Solo ajusta la UX del modal y su gating de audio por sesion.

## 7. QA pendiente / completado

Completado tecnicamente:

- `npx tsc --noEmit`: OK
- dev server responde dashboard autenticado con redirect de auth

Pendiente QA real:

- aparicion visual del modal
- mobile 320px / 390px
- localStorage real tras activar
- invalidacion de sesion cuando Chrome bloquea `play()`
- reaparicion del modal en una carga nueva aunque `audio-unlocked` siga recordado
- validacion humana del delay y del tono UX

# S.3 Assignment Report

## 1. Que problema resuelve S.3

S.3 agrega ownership operacional liviano para reducir duplicaciones humanas en la operacion diaria.

Busca responder:

- quien esta trabajando un pedido
- quien lo tomo primero
- si hace falta tomarlo o liberarlo

No intenta convertir OrderOps en un sistema de locks o workflow enterprise.

## 2. Que campos DB se agregaron

En `public.orders`:

- `assigned_to uuid references public.profiles(id)`
- `assigned_at timestamptz`

Ambos son:

- nullable
- sin backfill
- sin triggers
- sin auditoria

## 3. Como funciona assignment

- `Tomar pedido`
  - `assigned_to = currentUserId`
  - `assigned_at = now()`

- `Liberar`
  - `assigned_to = null`
  - `assigned_at = null`

Roles:

- `owner`, `manager`, `operator`: pueden tomar y liberar
- `viewer`: solo lectura

La logica es last-write-wins.

## 4. Que UX se agrego

- dashboard:
  - label discreta por card:
    - `Tu pedido`
    - `Tomado por Ana`
    - fallback `Tomado por Operador`

- modal / workspace:
  - bloque de responsable dentro de `Acciones`
  - boton `Tomar pedido` o `Liberar`

- vista profunda:
  - assignment visible en overview y acciones

## 5. Como interactua con Presence

Presence y Assignment siguen separados:

- Presence:
  - quien esta online
  - quien esta viendo un pedido

- Assignment:
  - quien figura como responsable operativo

Puede pasar validamente:

- Ana assigned
- Lucas viendo

El nombre humano del assignment se resuelve mejor cuando el operador esta online y Presence lo conoce.

## 6. Por que NO es locking

S.3 no bloquea la operacion:

- otro operador puede abrir el pedido
- otro operador puede cambiar estado
- otro operador puede tomar el pedido tambien

Si dos operadores lo toman casi a la vez:

- gana el ultimo write
- realtime sincroniza

La filosofia sigue siendo:

**awareness > enforcement**

## 7. Que riesgos quedan pendientes

- QA real multiusuario pendiente
- no hay nombre persistente de perfil; offline o fuera de Presence puede caer en fallback `Operador`
- no existe historial de assignment
- no existe `updated_at` en `orders`, asi que sigue sin haber resolucion fuerte de frescura general

## 7.1 Hotfix S.3.1 - release assignment realtime null patch

Se corrigio un bug de sincronizacion entre sesiones:

- al liberar un pedido, el `UPDATE` realtime podia llegar con:
  - `assigned_to = null`
  - `assigned_at = null`
- pero el patch incremental estaba usando `??` contra el valor previo
- eso hacia que `null` no limpiara el assignment en la otra sesion

La correccion ahora aplica assignment por **presencia de key**:

- si `assigned_to` viene en el payload, se aplica aunque sea `null`
- si `assigned_at` viene en el payload, se aplica aunque sea `null`

Esto mantiene el release sincronizado en:

- dashboard
- modal
- vista profunda

## 8. Que NO se implemento todavia

No se implemento:

- locks
- takeover confirmation
- historial humano persistente
- timeline de assignment
- auditoria
- metricas por operador
- auto-assignment
- reglas de prioridad

## 9. QA esperado

- operador A toma pedido y lo ve en dashboard / modal / detalle
- operador B sigue pudiendo abrirlo
- operador B puede tomarlo y el ownership cambia
- liberar limpia assignment correctamente
- liberar desde A limpia assignment en B sin refresh manual
- liberar desde B limpia assignment en A sin refresh manual
- viewer ve assignment pero no puede operar
- Presence + Assignment conviven sin mezclarse
- realtime de pedidos sigue sano

## 10. Resultado validaciones

- `npx tsc --noEmit`: pendiente de confirmar al cierre de la fase
- `npm run lint`: pendiente no interactivo; el repo sigue usando setup interactivo de `next lint`
- QA manual real: pendiente desde este entorno

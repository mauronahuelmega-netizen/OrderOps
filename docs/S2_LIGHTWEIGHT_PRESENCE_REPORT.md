# S.2 Lightweight Presence Report

## 1. Que problema resuelve S.2

S.2 agrega awareness operacional efimero para que el admin del negocio no se sienta como una consola aislada.

El objetivo es responder de forma discreta:

- quien esta online
- si el operador esta solo o acompanado
- quien esta viendo un pedido puntual

No intenta resolver colaboracion pesada.

## 2. Que presencia se implemento

Se implemento una capa de Presence paralela al realtime de `orders`:

- canal por negocio: `business-presence:{businessId}`
- awareness global en dashboard
- awareness contextual en modal de pedido
- awareness contextual en vista profunda `/admin/orders/[id]`

La presencia cuenta usuarios conectados del mismo negocio y permite derivar quienes estan viendo un pedido especifico.

## 3. Que payload se usa

```ts
type AdminPresencePayload = {
  userId: string
  name: string
  role: "owner" | "manager" | "operator" | "viewer" | "admin" | "super_admin"
  businessId: string
  currentSurface: "dashboard" | "order_modal" | "order_detail"
  currentOrderId: string | null
  lastActiveAt: string
}
```

Notas:

- `name` hoy se deriva de `user.email` en cliente
- no se exponen datos sensibles
- no se persiste nada en DB

## 4. Que archivos fueron modificados

- `app/admin/(protected)/dashboard/page.tsx`
- `app/admin/(protected)/orders/[id]/page.tsx`
- `components/admin/orders/admin-dashboard-orders.tsx`
- `components/admin/orders/admin-order-workspace-modal.tsx`
- `components/admin/orders/order-detail-page-client.tsx`
- `components/admin/orders/operator-presence-pill.tsx`
- `components/admin/orders/use-admin-presence.ts`
- `components/admin/orders-admin.css`
- `docs/CURRENT_PHASE.md`
- `docs/HANDOFF.md`
- `docs/ROADMAP.md`
- `docs/QA_CHECKLIST.md`

## 5. Como se mantiene separada de realtime orders

La presence vive en un canal separado del pipeline de pedidos:

- no toca `use-admin-orders-realtime.ts`
- no toca `lib/orders/realtime.ts`
- no toca inserts/updates de pedidos
- no participa en refreshes silenciosos de recovery
- no dispara audio, toast ni highlight

La UI de presence se deriva del snapshot actual de `presenceState()` tras `sync`.

## 6. Como degrada si presence falla

Si Presence falla:

- el dashboard sigue funcionando
- los pedidos siguen funcionando
- el pill de presence puede ocultarse o quedar sin datos utiles
- no se bloquean acciones de negocio

La presencia es awareness, no autorizacion ni dependencia critica.

## 7. Que NO se implemento todavia

No se implemento:

- assignment / claim
- locks de pedido
- chat
- comentarios
- timeline
- auditoria persistente
- estado ocupado/libre
- pagina de equipo
- permisos nuevos

## 8. Riesgos pendientes

- QA real multiusuario pendiente
- el nombre visible sigue usando fallback derivado de email
- si un mismo usuario abre varias pestañas, la UI se deduplica por `userId` y toma la presencia mas fresca
- no se debe reinterpretar `join` / `leave` como eventos humanos persistentes

### Hotfix R.7 / S.2 visibility recovery

- al volver visible u online, Presence ahora intenta re-trackear el payload actual
- si el channel quedo stale o sin `SUBSCRIBED`, se resuscribe limpiamente
- esto evita que el count online quede colgado despues de volver de background

## 9. QA manual esperado

- abrir dashboard con una sola sesion y ver `Solo vos`
- abrir dos sesiones del mismo negocio y ver count online correcto
- abrir modal de un pedido en una sesion y awareness contextual en la otra
- cambiar de pedido y confirmar que el awareness se mueve
- abrir `/admin/orders/[id]` y ver awareness contextual
- cerrar una pestana y confirmar que desaparece sin romper dashboard
- confirmar que INSERT / UPDATE realtime de pedidos sigue intacto

## 10. Resultado de validaciones

- `npx tsc --noEmit`: pendiente de confirmar en este reporte hasta correrlo al final de la fase
- `npm run lint`: pendiente no interactivo; el repo sigue usando setup interactivo de `next lint`
- QA manual real: pendiente desde este entorno

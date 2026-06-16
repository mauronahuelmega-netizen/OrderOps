# OrderOps Docs

## Que es OrderOps

OrderOps es una aplicacion Next.js multi-tenant para negocios pequenos que hoy venden por WhatsApp y necesitan ordenar:

- catalogo publico
- carrito y checkout
- ingreso de pedidos
- operacion diaria desde un dashboard admin

La propuesta del producto es: WhatsApp sigue siendo el canal humano, pero OrderOps ordena el flujo y reduce caos operativo.

## Que problema resuelve

Problemas atacados por el repo actual:

- pedidos que llegan por mensajes largos y ambiguos
- poca trazabilidad del estado del pedido
- demasiada friccion para cambiar estado, contactar al cliente y seguir la cola
- dashboards que se desactualizan o requieren refresh manual

## Estado actual del producto

Estado general:

- catalogo publico funcional por negocio
- checkout publico funcional usando RPC `create_order`
- dashboard admin operativo y orientado a pedidos
- modal de workspace instantaneo desacoplado del router
- vista profunda `/admin/orders/[id]`
- optimistic updates de estado
- realtime INSERT y UPDATE sobre `orders`
- resiliencia basica ante reconnect / visibility / online
- helpers de analytics diarios y queue pressure
- shortcuts operativos a WhatsApp / copiar / maps / tel / share

Estado a vigilar:

- hay deuda de encoding/mojibake en varios textos legacy del repo
- `npm run lint` aun no esta configurado de forma no interactiva
- la fase R.6 / R.6.1 esta enfocada en estabilizar el pipeline de nuevos pedidos realtime y el endpoint `summary`

## Como usar esta documentacion

Orden recomendado:

1. `ARCHITECTURE.md`
2. `DECISIONS.md`
3. `CURRENT_PHASE.md`
4. `CRITICAL_FILES.md`
5. `HANDOFF.md`

Consultar segun necesidad:

- producto y roadmap: `ROADMAP.md`
- criterios UX: `UX_PRINCIPLES.md`
- base de datos: `DB_SCHEMA_NOTES.md`
- QA: `QA_CHECKLIST.md`

Si algun punto no esta 100% confirmado por codigo o QA real, se marca como `pendiente de confirmar`.

# Decisiones Arquitectonicas

## 1. El admin de pedidos es local-first

Decision:

- el dashboard usa state local (`optimisticOrders`) como fuente primaria de la experiencia

Motivo:

- sentir instantaneidad
- evitar dependencia de `router.refresh()`
- permitir optimistic UI y reorder inmediato

Tradeoff:

- aumenta complejidad de reconciliacion
- requiere mas cuidado con realtime, reconnect y conflictos

No revertir sin motivo:

- volver a un dashboard completamente router-driven empeoraria mucho la UX operativa

## 2. El modal de pedido abre por estado local, no por navegacion Next

Decision:

- el modal se abre/cierra por estado local
- la URL `?order=` se sincroniza con History API

Motivo:

- evitar flicker y GET perceptible en `/admin/dashboard?order=...`

Tradeoff:

- mas logica de sincronizacion `popstate`

No revertir sin motivo:

- volver a `router.push/replace` para abrir/cerrar el modal fue causa real de mala UX

## 3. Realtime y refresh silencioso conviven

Decision:

- realtime sincroniza incrementalmente
- refresh silencioso existe como red de seguridad en reconnect / visibility / online / conflicto

Motivo:

- realtime por si solo puede perder eventos
- refresh global seria demasiado agresivo

Tradeoff:

- hay que blindar side effects para que refresh no simule inserts nuevos

## 4. INSERT realtime usa fetch puntual de summary

Decision:

- al llegar un `INSERT`, el dashboard fetchea `/admin/orders/[id]/summary`

Motivo:

- el payload realtime no trae el shape completo que la card necesita

Tradeoff:

- el pipeline de side effects depende de que esa route sea robusta

No revertir sin motivo:

- el dashboard necesita `item_summary`, `customer_context`, `timeline_steps`, etc.

## 5. Workspace reutilizado entre modal y vista profunda

Decision:

- modal y `/admin/orders/[id]` comparten secciones y helpers

Motivo:

- evitar duplicacion
- mantener consistencia

Tradeoff:

- los boundaries server/client y los tipos parciales requieren mas cuidado

## 6. Analytics del dashboard son operativos, no historicos

Decision:

- analytics strip usa pedidos de hoy

Motivo:

- el dashboard busca conciencia del turno actual, no reporting historico

Tradeoff:

- reportes historicos requieren otra superficie futura

## 7. Queue pressure es una senal derivada, no una subscripcion nueva

Decision:

- queue pressure deriva de `optimisticOrders` + aging helpers + tick local por minuto

Motivo:

- minimal blast radius
- mantener simplicidad

Tradeoff:

- no es una metrica perfecta de forecasting; es heuristica operacional

## 8. No hay state machine formal de pedidos

Decision:

- se usan helpers y reconciliacion pragmatica, no una maquina de estados estricta

Motivo:

- velocidad de iteracion
- alcance MVP/MMP operacional

Tradeoff:

- los conflictos cross-session son manejados con heuristicas y refresh silencioso
- `updated_at` no existe hoy para resolver frescura con precision fuerte

## 9. Deuda visible: mojibake / encoding

Decision actual:

- el repo tolera textos con mojibake en varias superficies legacy

Impacto:

- no rompe arquitectura, pero si calidad percibida y legibilidad

Recomendacion:

- arreglar por fase dedicada, no mezclar con cambios operativos grandes

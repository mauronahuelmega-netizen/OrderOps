# V.5 - Natural language operational search

## Que problema resuelve

V.5 deja encontrar pedidos escribiendo como habla el operador, sin depender solo de filtros rigidos y sin convertir OrderOps en un chat.

## Por que no usa IA externa todavia

La busqueda sigue siendo deterministica y explicable:

- no llama OpenAI
- no usa embeddings
- no usa vector DB
- no crea backend nuevo

Todo ocurre en memoria con datos ya cargados en el dashboard.

## Queries soportadas

- estados: `pendientes`, `preparando`, `listos`, `completados`, `cancelados`
- metodo: `delivery`, `envio`, `retiro`, `pickup`
- riesgo: `con riesgo`, `demorados`, `estancados`, `revisar`
- cliente: `Mauro`, `pedidos de Mauro`, `cliente Mauro`
- assignment: `sin responsable`, `sin asignar`, `mios`, `a mi cargo`
- valor: `caros`, `ticket alto`, `alto valor`
- tiempo: `recientes`, `ultimos`, `hoy`

## Parser implementado

`lib/orders/natural-search.ts`:

- normaliza acentos, mayusculas y espacios
- traduce terminos comunes a criterios operativos
- usa el texto remanente como busqueda de cliente
- genera chips explicativos para la UI
- combina criterios con logica `AND`

## Donde aparece

La busqueda aparece en `/admin/dashboard`, arriba de los filtros existentes y debajo de `ACTIVIDAD RECIENTE`.

## Como convive con filtros existentes

- el input mantiene estado local
- la query se parsea con `useMemo`
- luego se aplica sobre el resultado del filtro actual
- si la query esta vacia, el comportamiento previo queda intacto
- las cards siguen abriendo modal con el flujo local-first existente

## Que NO se implemento

- chatbot
- historial de busqueda
- URL nueva para query
- analytics de consultas
- IA externa
- backend nuevo

## Riesgos pendientes

- el parser V1 cubre lenguaje comun pero puede necesitar mas sinonimos reales
- `recientes` y `hoy` usan una heuristica simple de ventana temporal y mismo dia
- falta QA visual con trafico real para ajustar chips, copy y densidad

## QA realizado

- integracion local con filtros existentes
- `npx tsc --noEmit` OK
- `npm run lint` sigue siendo interactivo en este repo

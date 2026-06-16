# V.6 -- Operational Windows

## Estado actual

La base funcional de `V.6` se mantiene:

- overview superior con business window
- zona operacional con sesion activa o fallback
- realtime e hydration intactos

## V.6.4c.RA / RF1 / RF2 / RA3 / RF4 / RA4 / RF3a / RA5 / RF5 / RF6 / RA8 / RF6a / RA9 / RF9 / RA10 / RF11 / RF13

La secuencia tecnica mobile queda asi:

- `RA` encontro un problema probable de compositing
- `RF1` elimino el portal cerrado del drawer
- `RF2` aplica fallback mobile de blur/translucency/shadow
- `RA3` apunto al sistema de overlays/modals y al modal de avisos operativos
- `RF4` aplica fallback mobile solo al overlay del modal de avisos
- `RA4` apunto al snapshot KPI y a su patron de clamp/snap
- `RF3a` aplica fallback mobile solo a ese patron del snapshot
- `RA5` apunto a los wrappers padre del overview
- `RF5` aplica flattening mobile solo a esos wrappers
- `RF6` deja de perseguir KPI y ataca viewport/scroll/compositor
- `RA8` identifico que Chrome Android podia estar entrando a un path GPU fragil que Opera Mini no usa
- `RF6a` revierte solo los hints de forced GPU promotion introducidos por `RF6`
- `RA9` identifico nested CSS Grid y repeated responsive overrides justo en el overview
- `RF9` aplica fallback mobile-only de strips flex para simplificar ese layout
- `RA10` movio el foco desde layout hacia GPU raster complexity trigger
- `RF11` simplifica solo primitives visuales del overview mobile usando fondos solidos y sin shadow
- `RF13` deja quieto el overview viejo y monta un renderer mobile alternativo y seguro

## V.6.4c.RF13 -- Mobile Safe Overview Renderer

### Rationale

Despues de multiples pasadas sobre el renderer original, la estrategia cambia: desktop conserva el overview actual y mobile recibe un renderer alternativo mucho mas estable.

La hipotesis puntual paso a ser:

- el overview viejo sigue siendo fragil para Chrome Android
- no conviene seguir parchando ese renderer para mobile
- conviene reemplazarlo visualmente solo debajo de `768px`

### Fix aplicado

- renderer nuevo:
  - `.admin-orders-mobile-overview`
  - `.admin-orders-mobile-overview__section`
  - `.admin-orders-mobile-overview__grid`
  - `.admin-orders-mobile-overview__item`
  - `.admin-orders-mobile-overview__insights`
  - `.admin-orders-mobile-overview__insight`
- mobile:
  - overview viejo oculto
  - overview nuevo visible
- desktop:
  - overview viejo intacto
  - overview nuevo oculto
- se reutilizan:
  - barra realtime
  - metricas de jornada existentes
  - metricas operativas existentes
  - insights existentes
- no se toco operacion, realtime, snapshot data, execution ni cards de pedidos

### Restricciones

No se toco:

- operacion
- realtime
- snapshot data
- metricas
- sessions
- modales
- drawer
- execution
- cards de pedidos
- search
- filters
- `components/admin/admin-shell.css`
- DB
- auth
- rutas
- `V.6.4c.2`

### QA pendiente

- confirmar `320 / 390 / 768 / 1024`
- confirmar renderer mobile nuevo visible debajo de `768px`
- confirmar renderer desktop intacto arriba de `768px`
- confirmar execution y cards de pedidos intactas
- confirmar Android Chrome sin bandas, tiles flotantes ni overview incompleto
- modales
- drawer
- cards individuales
- KPI data
- layout/grid
- layout base
- DB
- auth
- rutas
- `V.6.4c.2`

### QA pendiente

- confirmar Android Chrome sin bandas, tiles flotantes ni KPI faltantes
- confirmar Opera Mini sano como control
- si persiste, mover el foco a un `RF11b` acotado a otras primitives visuales del overview sin reabrir otras areas

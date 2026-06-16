# T2.1 - Commercial / Operational Split Report

## Que problema resuelve

T.2 mejoro la lectura operacional del dashboard, pero al hacerlo reemplazo por completo el strip comercial previo. Eso degradaba la jerarquia UX: el tablero pasaba a responder muy bien "como viene la operacion", pero dejaba de responder rapido "como viene el negocio".

T.2.1 corrige ese desbalance sin abrir una seccion nueva ni convertir el dashboard en analytics pesado.

## Como quedo la jerarquia

El dashboard operativo queda organizado asi:

1. estado operacional superior
   - health realtime
   - presence
   - queue pressure
2. strip comercial `HOY`
3. strip operacional `OPERACION EN VIVO`
4. filtros y lista de pedidos

La idea es separar claramente lectura de negocio y lectura de friccion operativa, manteniendo la misma pantalla y el mismo ritmo de escaneo.

## Metricas por strip

### HOY

- Ventas
- Ticket promedio
- Activos
- Completados
- Delivery / Retiro
- Mas vendido

Estas metricas reutilizan la logica comercial previa del dashboard. No se recalculan desde `order_events`.

### OPERACION EN VIVO

- Tiempo promedio
- Preparacion
- Estancados
- Cancelados
- Reasignaciones
- Ult. mov.

Estas metricas conservan la implementacion derivada de T.2.

## Decisiones de densidad y mobile

- no se agrego seccion nueva
- no se agregaron charts
- ambos strips siguen usando chips/cards compactas
- ambos strips mantienen scroll horizontal en mobile
- la separacion visual entre ambos strips es suave y sobria
- se evita empujar demasiado los filtros hacia abajo

## Riesgos evitados

- no se toca realtime pipeline
- no se toca presence
- no se toca assignment
- no se toca timeline
- no se tocan server actions
- no se agregan calculos duplicados de negocio

## Riesgos pendientes

- falta QA visual real en 320px / 390px / tablet / desktop
- falta confirmar con datos reales que la convivencia de ambos strips sigue escaneable en menos de 5 segundos
- el entorno actual sigue limitando QA browser local completo

## Validaciones

- `npx tsc --noEmit`
- `npm run lint` sigue pendiente de configuracion no interactiva

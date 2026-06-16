# T5 - Lightweight History Center Report

## 1. Que problema resuelve T.5

T.5 agrega una memoria reciente transversal del negocio para no depender solo de abrir pedido por pedido. La idea es responder rapido que paso hace unos minutos y que movimientos recientes merecen una mirada.

## 2. Que bloque de actividad se agrego

Se agrego `ACTIVIDAD RECIENTE` en el dashboard:

- debajo de `INSIGHTS`
- antes de filtros
- con hasta 6 items compactos

## 3. Que eventos entran y cuales no

Entran:

- `status_changed`
- completado
- cancelado
- cambio regresivo
- `assignment_taken`
- `assignment_released`
- reasignacion derivada
- `order_created` cuando aporta contexto reciente

No entran:

- presence
- reconnect / refresh silencioso
- side effects UX
- logs tecnicos
- feed infinito

## 4. Como se prioriza la actividad

La actividad se filtra a una ventana reciente y luego se ordena por:

1. recencia
2. friccion / prioridad del evento

Con prioridad mas alta para:

- regresiones
- cancelaciones
- reasignaciones

## 5. Como convive con `HOY`, `OPERACION EN VIVO` e `INSIGHTS`

La jerarquia queda:

1. barra operacional superior
2. `HOY`
3. `OPERACION EN VIVO`
4. `INSIGHTS`
5. `ACTIVIDAD RECIENTE`
6. filtros
7. cards

T.5 no reemplaza metricas ni insights; los complementa.

## 6. Como se comporta en mobile

- scrollea horizontalmente
- no agrega feed infinito
- mantiene items compactos
- intenta no empujar demasiado los filtros hacia abajo

## 7. Confirmacion de que no se retiro nada

T.5 no retira ni reemplaza:

- `HOY`
- `OPERACION EN VIVO`
- `INSIGHTS`
- historial T.3
- timeline T.1
- assignment
- presence
- quick actions
- filtros
- cards

## 8. Que NO se implemento todavia

- notification center
- push notifications
- realtime propio de `order_events`
- feed infinito
- paginacion
- filtros historicos
- busqueda
- analytics globales

## 9. Riesgos pendientes

- falta QA visual real en mobile
- el corte de "actividad reciente" usa una ventana simple y puede necesitar ajuste con datos reales
- el entorno sigue limitando QA browser visual completo

## 10. Resultado de validaciones

- `npx tsc --noEmit`
- `npm run lint` sigue pendiente de configuracion no interactiva

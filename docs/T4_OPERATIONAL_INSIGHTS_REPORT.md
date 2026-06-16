# T4 - Operational Insights Report

## 1. Que problema resuelve T.4

T.2 ya mostraba metricas utiles, pero todavia exigia interpretar numeros para decidir que mirar primero. T.4 agrega una capa compacta de lectura operacional que traduce esas senales a insights suaves y priorizados.

## 2. Que insights se agregaron

- Operacion estable
- Operacion tranquila
- Revisar pedidos demorados
- Cambios regresivos
- Preparacion lenta
- Reasignaciones activas
- Delivery domina hoy
- Retiro domina hoy

## 3. Reglas y thresholds

- estancados:
  - usa el threshold existente de 20 min sin movimiento
- preparacion lenta:
  - promedio mayor a 25 min
- delivery / retiro dominante:
  - 70% o mas del mix del dia
- operacion tranquila:
  - pocos activos y sin demoras

## 4. Como se priorizan

Orden de prioridad:

1. pedidos demorados
2. cambios regresivos
3. preparacion lenta
4. reasignaciones
5. mix delivery / retiro
6. operacion estable / tranquila

Se muestran como maximo 3 insights.

## 5. Como conviven con `HOY` y `OPERACION EN VIVO`

- `HOY` sigue arriba
- `OPERACION EN VIVO` sigue en su propio strip
- los insights viven debajo de `OPERACION EN VIVO`
- funcionan como lectura rapida, no como reemplazo de metricas

## 6. Confirmacion de que no se retiro nada

T.4 no retira ni reemplaza:

- strip comercial `HOY`
- strip operacional `OPERACION EN VIVO`
- metricas T.2
- split T.2.1
- historial T.3
- timeline T.1
- assignment
- presence
- quick actions
- filtros
- cards

## 7. Que NO se implemento todavia

- charts
- analytics globales
- ranking por operador
- notification center
- push notifications
- seccion `/admin/metrics`
- recomendaciones generadas por IA

## 8. Riesgos pendientes

- falta QA visual real en mobile
- los thresholds son intencionalmente simples; pueden necesitar ajuste futuro con datos reales
- el entorno sigue limitando QA browser local completo

## 9. Resultado de validaciones

- `npx tsc --noEmit`
- `npm run lint` sigue pendiente de configuracion no interactiva

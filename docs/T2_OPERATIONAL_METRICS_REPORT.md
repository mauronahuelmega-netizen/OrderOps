# T.2 Operational Metrics Report

## 1. Que problema resuelve T.2

T.2 hace que el dashboard operativo responda mejor, de un vistazo, como viene el dia:

- cuanto tardan los pedidos
- si hay pedidos estancados
- cuantas cancelaciones hubo
- si hubo reasignaciones
- cuanto hace que no se mueve un pedido

## 2. Metricas derivadas implementadas

- `Tiempo promedio`
  - desde `order.created_at` hasta el primer `status_changed -> completed`
- `Preparacion`
  - desde `pending` / `created_at` hasta `ready`
  - fallback desde `preparing` hasta `ready`
- `Estancados`
  - pedidos activos sin movimiento hace mas de 20 min
- `Cancelados`
  - pedidos del dia con estado actual `cancelled`
- `Reasignaciones`
  - `assignment_taken` con `previous_assigned_to`
- `Ult. mov.`
  - mayor tiempo sin actividad entre pedidos activos

## 3. Thresholds

- estancamiento inicial:
  - `20 min`

## 4. Performance considerations

- no hay polling nuevo
- no hay charts
- no hay estado pesado extra
- se reutilizan `order_events` ya disponibles en el payload del dashboard
- calculos en helpers puros con `useMemo` en la superficie del dashboard

## 5. Compatibilidad legacy

- pedidos sin `order_events` siguen funcionando
- si falta `completed`, `ready` o `preparing`, la metrica cae a `Sin datos`
- nunca deberian renderizarse `undefined`, `null`, `NaN` o `Invalid date`

## 6. Riesgos pendientes

- si un negocio acumula demasiados `order_events` por pedido, podria requerirse una estrategia mas fina de payload
- QA visual real sigue limitado por el entorno heredado de T.0.1
- los calculos usan timelines parciales tolerantes, no una auditoria formal

## 7. Resultado de validaciones

- `npx tsc --noEmit`: OK
- `npm run lint`: sigue abriendo el setup interactivo de Next ESLint
- `npm run dev -- --port 3019`: levanta correctamente

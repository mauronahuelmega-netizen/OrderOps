# T.1 Enriched Operational History Report

## 1. Que problema resuelve T.1

T.1 hace que el historial por pedido deje de sentirse como una lista plana de eventos y empiece a dar mas contexto operativo:

- que paso
- en que orden
- cuanto tiempo paso entre un evento y otro
- si hubo reasignacion
- si hubo un cambio regresivo de estado

## 2. Que se enriquecio en el timeline

Se enriquecio la capa shared/presentacional:

- labels mas humanos para eventos de estado
- deteccion derivada de `completed` y `cancelled`
- deteccion derivada de reasignacion desde `assignment_taken`
- detalle de transicion (`Pendiente -> Preparando`, etc.)
- delta temporal entre eventos (`2 min despues`, `1 h 5 min despues`)
- timestamp compacto por evento

## 3. Si hubo o no cambios DB

No hubo cambios de DB.

- sin migracion
- sin constraint nueva
- sin `event_type` nuevo persistido

## 4. Que eventos / presentaciones nuevas existen

Persistencia sigue igual:

- `order_created` derivado
- `status_changed`
- `assignment_taken`
- `assignment_released`

Presentaciones nuevas derivadas:

- `status_reverted`
- `order_completed`
- `order_cancelled`
- `assignment_transferred`

## 5. Como se calculan duraciones

Las duraciones se calculan en capa client-safe/shared:

- se ordenan eventos por `created_at`
- se compara cada evento con el anterior
- se deriva un label compacto:
  - `Seguido`
  - `2 min despues`
  - `1 h 5 min despues`
  - `1 d 2 h despues`

No se guarda nada nuevo en DB.

## 6. Como se detectan status reversions

Se usa un mapa simple de orden operacional:

- `pending`
- `preparing`
- `ready`
- `completed`
- `cancelled`

Si `to_status` queda por detras de `from_status`, el evento se presenta como cambio regresivo.

## 7. Como se manejan eventos legacy

Eventos viejos siguen funcionando:

- si falta payload enriquecido, el render usa fallback seguro
- si no existe `order_created` persistido, se sigue derivando `Pedido recibido`
- si falta actor, cae en `Operador` o `Sistema`

## 8. Que NO se implemento todavia

- nuevos `event_type` persistidos
- feed global
- analytics historicos
- realtime propio para `order_events`
- auditoria enterprise
- event sourcing

## 9. Riesgos pendientes

- QA visual real sigue limitado por el entorno heredado de T.0.1
- las reasignaciones derivadas no muestran el nombre del responsable anterior, solo contexto de que habia otro responsable
- el orden simple de estados no es una state machine formal

## 10. Resultado de validaciones

- `npx tsc --noEmit`: OK
- `npm run lint`: sigue abriendo el setup interactivo de Next ESLint

# Reglas de ejecución — Commercial Core V1

Fecha: 2026-10-08.

Este archivo manda sobre el agente autónomo cuando contradiga [AUTONOMOUS_EXECUTION.md](AUTONOMOUS_EXECUTION.md), una frase de «se puede seguir» en [DECISIONS_AND_BLOCKERS.md](DECISIONS_AND_BLOCKERS.md), o una nota de aislamiento en un `PHASE-0N.md`.

No pone `implementation_authorized` en `yes`. La implementación sigue prohibida hasta un pedido humano explícito.

## 1. No saltar una fase

El orden es PHASE-01, PHASE-02, PHASE-03, PHASE-04, PHASE-05, PHASE-06.

La fase N+1 no se abre hasta que todas las tareas de la fase N estén `done` con evidencia. No se adelanta un archivo, una migración ni una pantalla de una fase posterior porque «no depende» o porque la fase actual está bloqueada.

Dentro de una fase, el orden es el de su `PHASE-0N.md`. La tarea siguiente empieza solo cuando la anterior está `done`.

## 2. No marcar `done` sin evidencia

Una tarea pasa a `done` solo después de ejecutar lo que esa tarea pide y de pegar en [PROGRESS.md](PROGRESS.md) el comando, el código de salida y la fecha.

Una lectura de código, un razonamiento o una promesa de que «pasa» no son evidencia. Si el test no se pudo correr, la tarea queda `blocked` o `in_progress`, no `done`.

## 3. No editar `PROGRESS.md` antes de ejecutar

Antes de correr la tarea, `PROGRESS.md` se lee y no se reescribe para declarar avance.

No poner `in_progress`, `done`, evidencia, `next_task` adelantada ni `implementation_authorized: yes` como preparación.

`PROGRESS.md` se actualiza después del resultado real: evidencia si terminó, o `blocked` con el motivo si se detuvo. El historial de evidencia no se borra.

## 4. Detenerse ante cualquier bloqueo

Si la tarea en curso no puede completarse, la sesión se detiene en esa tarea.

No se abre otra tarea de la misma fase. No se abre la fase siguiente. No se aprovecha el bloqueo para hacer trabajo «independiente».

Eso incluye fallo de test, gate local en rojo, dependencia ausente, contradicción entre documentos, riesgo de datos, duda de permisos y cualquier `BLK-*` que la tarea necesite resolver para seguir.

Los `BLK-*` ya escritos, con un default `ENG-*` citado por la tarea, son una restricción a respetar. No son un motivo para cambiar de tarea ni para dar el bloqueo por cerrado.

## 5. No resolver un `BLK-*` inventando una regla

Un `BLK-*` se cierra solo cuando el usuario escribe la decisión.

Hasta entonces el agente no elige IVA, parciales, compensación automática, plazos de conservación, ni afloja la separación de funciones o la separación de cuentas. No agrega una regla «temporal» en código para poder marcar la tarea `done`.

Si el default `ENG-*` ya está escrito, se aplica tal cual. Si no alcanza para terminar la tarea, se detiene y se anota el `BLK-*`.

## 6. No salir del alcance de la fase

Cada cambio pertenece a la tarea vigente de [phases/](phases/).

No se modifican pedidos, realtime, finance del local, `profiles.role` ni `lib/admin/permissions.ts` salvo que la tarea de esa fase lo nombre. No se crean módulos de una fase posterior. No se reformatea código ajeno a la tarea.

Si completar la tarea exige un archivo fuera de su lista, se detiene y se registra el alcance. No se amplía la lista en silencio.

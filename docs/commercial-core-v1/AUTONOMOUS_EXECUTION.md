# Ejecución autónoma — Commercial Core V1

Protocolo para una sesión nueva de Cursor Agent. No autoriza por sí mismo a implementar. Hace falta un pedido humano explícito de ejecutar una fase o una tarea.

Las reglas de [EXECUTION_RULES.md](EXECUTION_RULES.md) ganan si este archivo las contradice. En particular: no se salta una fase, no se marca `done` sin evidencia, no se reescribe `PROGRESS.md` antes de ejecutar, un bloqueo detiene la sesión, un `BLK-*` no se cierra con una regla inventada, y el diff no sale de la fase en curso.

## 1. Arranque de sesión

En orden:

1. Leer [MASTER_PLAN.md](MASTER_PLAN.md).
2. Leer [EXECUTION_RULES.md](EXECUTION_RULES.md).
3. Leer [PROGRESS.md](PROGRESS.md).
4. Leer el `phases/PHASE-0N.md` de la tarea `next_task`.
5. Leer el bloque de [DECISIONS_AND_BLOCKERS.md](DECISIONS_AND_BLOCKERS.md) citado por esa tarea.
6. `git status` y `git log -8 --oneline`. No commitear si el usuario no lo pidió.
7. Si `PROGRESS.md` marca una tarea `done`, reejecutar el comando de evidencia de esa tarea antes de empezar la siguiente. Si falla, marcarla `blocked` y detener la sesión.
8. Elegir `next_task` solo si la fase anterior está completa, las dependencias de la tarea están `done` y no hay un bloqueo abierto de la tarea en curso.

Si el árbol tiene migraciones `commercial_` que `PROGRESS.md` no conoce, parar. Es una inconsistencia. No «reconciliar» inventando tareas hechas.

## 2. Durante la tarea

- Una tarea por vez, en el orden del `PHASE-0N.md` de la fase en curso.
- Diff mínimo. No refactorizar pedidos, realtime ni finance del local.
- CSS nuevo solo en `*.module.css` con tokens de `app/theme-tokens.css`.
- Tipos explícitos. Sin `any`.
- Montos en centavos. No flotar ARS.
- No leer `.env.local` para copiarlo a docs ni a la respuesta. El gate puede comprobar host y puerto.
- Al terminar: tests de la tarea, actualizar `PROGRESS.md`, y si el SQL difirió del modelo, actualizar `DATA_MODEL.md` en el mismo cambio.

## 3. Registro `PROGRESS.md`

Campos vigentes:

- `updated_at`
- `implementation_authorized` (`no` hasta pedido explícito)
- `current_phase`
- `current_task`
- `next_task`
- `product_code`: estado del código funcional de Commercial Core V1. No describe pedidos, caja ni el resto del producto OrderOps. Valores: `not_started` (no hay código comercial), `in_progress` (hay código comercial y la V1 local no está terminada), `done` (se cumplió la definición de V1 local terminada del plan maestro).
- tabla de tareas `pending | in_progress | done | blocked`
- evidencia por tarea done
- errores abiertos
- bloqueos (id de `DECISIONS_AND_BLOCKERS.md`)
- decisiones tomadas en la sesión
- nota de recuperación

No marcar `done` por adelantado. No reescribir este archivo antes de ejecutar la tarea. No borrar historial de evidencia; agregar una línea nueva después del resultado.

## 4. Reanudación

El estado durable es el repo más `PROGRESS.md`, no el chat.

Sesión interrumpida a mitad de una tarea: dejar `in_progress` y una nota con archivos tocados. La sesión siguiente lee el diff. Si el diff no compila o no pasa el test, no abre la tarea siguiente.

Límite de contexto: no resumir el plan de memoria. Volver a leer los markdown.

Tests largos: correr el archivo concreto de la tarea, no la historia entera de `docs/`.

No asumir un proceso desatendido de horas. Cada sesión termina con `PROGRESS.md` guardado.

## 5. Autonomía cuando la implementación esté autorizada

Puede:

- crear código local, tests, docs de fase
- lint y build si la tarea lo pide
- escribir migraciones
- aplicar migraciones solo después de P01-T01 en verde y solo contra loopback `54321`/`54322`
- seeds ficticios de la tarea en curso

No puede, sin frase explícita del usuario en el chat:

- tocar producción o cualquier host `supabase.co`
- `db push` remoto, `db reset`, `delete`, truncate de datos no fixture
- editar `.env`, `.env.local`, secretos
- cambiar 290000, 55000, 120000, 40 %, 12, 15, 30, 90, 180
- crear cargos reales, mandar mail a un dominio que no sea Inbucket local, disparar una transferencia
- desactivar RLS o tests para que pasen
- fuerza git (`push --force`, reset duro) 
- commitear o desplegar si no lo pidió
- cerrar `BLK-ECO-*`, `BLK-SEC-*`, `BLK-PRIV-*`, `BLK-LEG-*` con una regla inventada

## 6. Bloqueos

| Clase | Conducta |
| --- | --- |
| Técnico resoluble | Investigar, arreglar, dejar el test |
| Dependencia faltante en el repo | Parar esa tarea, anotar el archivo que falta |
| Ambigüedad funcional ya decidida en la spec | Implementar la spec |
| Ambigüedad económica, legal o de seguridad listada como BLK | No inventar la regla. Si el `ENG-*` de la tarea no alcanza, detener la sesión |
| Riesgo de datos | Parar. No migrar |
| Dependencia externa (AFIP, banco, SMTP real) | Usar solo el sustituto local que la tarea ya nombra. Si no está, parar |
| Autorización humana | Parar la sesión |

Un bloqueo no habilita la tarea siguiente ni la fase siguiente. La sesión espera una decisión humana o un arreglo dentro de la misma tarea, sin ampliar el alcance.

## 7. Parada obligatoria

Parar y escribir el motivo en `PROGRESS.md` si:

- el gate local falla
- un unique de dinero no se puede crear
- un test de RLS de la tarea falla
- hay que modificar `lib/admin/permissions.ts` o el enum de `profiles.role`
- hay que leer o escribir `order_financials` para calcular una comisión
- la spec y este paquete se contradicen en un monto o un plazo

## 8. Commits

Solo con pedido del usuario. Mensaje en el estilo del repo (imperativo corto, por qué). No incluir `.env`. Incluir migraciones y docs de la tarea.

## 9. Primera tarea de producto

P01-T01 en [phases/PHASE-01.md](phases/PHASE-01.md). Comprueba el destino. No migra.

# Política obligatoria de worktrees para agentes OrderOps

Vigente desde la consolidación Git del 2026-10-21.

## Ramas permanentes

| Rama | Worktree esperado | Ámbito |
|------|-------------------|--------|
| `main` | `Projects/OrderOps` | Núcleo estable, finanzas de pedidos, catálogo, integraciones admitidas |
| `commercial` | `Projects/OrderOps-talo-first` (**rename pendiente** → `OrderOps-Commercial`) | CRM, promotores, Talo, billing, suscripciones, demo comercial |
| `estadisticas` | `Projects/OrderOps-Estadisticas` | Métricas, series, productos stats, SQL/RPC statistics |

No implementar features de un ámbito en el worktree de otro.

## Checklist de inicio (obligatorio)

Antes de editar código, registrar:

1. Ruta física del worktree (`pwd` / `git rev-parse --show-toplevel`)
2. Rama (`git rev-parse --abbrev-ref HEAD`)
3. HEAD (`git rev-parse HEAD`)
4. Estado (`git status --porcelain=v1 -b`)
5. Área funcional autorizada
6. Restricciones (¿push? ¿prod? ¿migraciones?)
7. Relación con `main` (`git merge-base --is-ancestor main HEAD`; left-right counts)

Si la rama o el worktree no coinciden con el alcance de la tarea: **detenerse** y corregir el entorno.

## Checklist de cierre

1. Commit local en la rama permanente correcta (sin secretos ni `tmp/`)
2. Pruebas ejecutadas con resultado **PASS** / **FAIL** / **NOT_VERIFIED**
3. Trabajo pendiente explícito
4. Destino de integración previsto (`main` / permanece en rama de desarrollo)
5. Working tree limpio de cambios relevantes (los generados pueden quedar fuera)

## Prohibiciones

- Dos agentes editando los mismos contratos compartidos (`types/database.ts`, migraciones, middleware, RLS) sin coordinación.
- Push, force-push, reset --hard, clean destructivo, deploy prod, migraciones prod sin autorización humana.
- Fusionar ramas sin inventario left-right + paths exclusivos.
- Dejar desarrollo relevante solo en archivos sin commit al final del turno.

## Sincronización

1. Mejoras estables → `main` (revisadas).
2. Periódicamente: `merge main` → `commercial` y `estadisticas`.
3. Features de desarrollo regresan a `main` solo tras pruebas y autorización.
4. Sin reescritura de historial compartido.

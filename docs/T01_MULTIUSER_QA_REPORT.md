# T.0.1 Multiuser QA Report

## 1. Objetivo de T.0.1

Validar end-to-end el comportamiento multiusuario real de la familia S:

- roles y permisos
- presence
- assignment
- timeline
- recovery hidden / visible
- team management
- seguridad operacional basica

## 2. Entorno de QA usado

- repo local levantado con `npm run dev -- --port 3018`
- compilacion TypeScript local
- consulta read-only al backend Supabase usando variables de entorno locales
- intento de browser QA en el in-app browser de Codex

## 3. Usuarios / roles probados

Hallazgo real del backend al momento de esta fase:

- `super_admin`: 1
- `admin`: 3
- `operator`: 1

No se detecto un negocio de QA con la matriz completa:

- `owner`
- `manager`
- `operator`
- `viewer`

`businessesWithFullOpsRoles`: `0`

## 4. Browsers / dispositivos usados

- intento de in-app browser de Codex sobre `http://127.0.0.1:3018/admin/dashboard`
- resultado: bloqueado por el propio entorno con `net::ERR_BLOCKED_BY_CLIENT`
- smoke técnico local por arranque de dev server: OK

No fue posible completar QA visual real multi-sesion desde este entorno.

## 5. Casos completados

Completado tecnicamente:

- `npx tsc --noEmit`
- `npm run dev -- --port 3018`
- confirmacion de bloqueo de browser local
- confirmacion de que falta matriz completa de roles para QA real

## 6. Casos fallidos

No ejecutables en este entorno:

- matrix real de `owner / manager / operator / viewer`
- presence multiusuario visual
- assignment cross-session visual
- timeline multiusuario visual
- recovery hidden / visible visual
- mobile responsive real con sesiones autenticadas

## 7. Bugs encontrados

### Blocker

1. **No existe un negocio de QA con matriz completa de roles**
   - impacto:
     - bloquea validar S.1, S.2, S.3, S.3.5, S.4, S.5 y S.6 como familia multiusuario real

2. **El browser in-app de este entorno bloquea localhost**
   - error visto:
     - `net::ERR_BLOCKED_BY_CLIENT`
   - impacto:
     - bloquea QA visual real de dashboard, modal y detalle desde Codex

## 8. Hotfixes aplicados

Ninguno en producto durante T.0.1.

Esta fase dejo documentacion y diagnostico, no cambios funcionales.

## 9. Pendientes

- preparar un negocio de QA con:
  - `owner`
  - `manager`
  - `operator`
  - `viewer`
- ejecutar QA real en browser no bloqueado
- correr el checklist completo de `docs/QA_CHECKLIST.md`

## 10. Riesgos actuales

- abrir T.1 sin T.0.1 real deja sin validar:
  - matrix de permisos
  - presence entre sesiones
  - assignment entre operadores
  - recovery hidden / visible con cuentas reales
  - viewer read-only real

## 11. Recomendacion final

**Bloquear siguiente fase.**

No recomiendo abrir T.1 todavia.

Primero hay que:

1. preparar cuentas reales de QA por negocio
2. usar navegador/dispositivo que no bloquee localhost
3. ejecutar T.0.1 completo con evidencia humana real

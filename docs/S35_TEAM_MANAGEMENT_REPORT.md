# S.3.5 - Team Management Report

## Que problema resuelve S.3.5

S.3.5 agrega una ruta simple de gestion de equipo dentro del admin del negocio para habilitar QA multiusuario real. Sin esta pieza era dificil validar en serio:

- roles `owner`, `manager`, `operator`, `viewer`
- presence con varias sesiones
- assignment entre operadores
- viewer read-only

## Que ruta se agrego

- `/admin/team`

Label de navegacion:

- `Equipo`

## Quien puede acceder

- `owner`
- `admin` legacy

Compatibilidad:

- `super_admin` conserva su flujo global y solo entra aca si ya opera como admin del negocio segun el perfil actual

No acceden:

- `manager`
- `operator`
- `viewer`

## Que acciones permite

Desde `/admin/team` se puede:

1. listar usuarios del mismo negocio
2. crear usuarios internos
3. cambiar rol de usuarios existentes

## Que roles se pueden crear o editar

Se pueden crear:

- `manager`
- `operator`
- `viewer`

Se pueden editar entre:

- `manager`
- `operator`
- `viewer`

No se puede:

- crear `owner`
- editar `owner`
- editar `admin` legacy
- editar `super_admin`
- bajar el propio rol desde esta UI

## Que validaciones de seguridad existen

- guard server-side `manageTeam`
- `business_id` siempre sale del contexto admin, nunca del cliente
- las actions validan rol permitido
- no se permite editar usuarios de otro negocio
- no se permite self-demotion
- no se permite crear `owner`
- no se permite tocar `super_admin`

## Que NO se implemento todavia

- invitaciones por email
- reset password
- forced password change
- eliminar usuarios
- desactivar usuarios
- ownership transfer
- multiples negocios por usuario
- business memberships
- auditoria de usuarios

## Como habilita QA de S.1 / S.2 / S.3

Permite crear usuarios reales para probar:

- `manager`
- `operator`
- `viewer`

Con eso ya se puede validar:

- matrix de permisos
- presence multiusuario
- assignment entre operadores
- viewer solo lectura

## Riesgos pendientes

- contrasena temporal manual: depende de coordinacion humana
- sigue sin existir invitacion o cambio forzado de password
- sin QA real multiusuario todavia no esta confirmado el flujo completo en browser

## QA manual esperado

- owner ve `Equipo`
- manager / operator / viewer no lo ven
- owner crea usuarios `manager`, `operator`, `viewer`
- no puede crear `owner`
- no puede bajarse su propio rol
- operator no puede entrar manualmente a `/admin/team`
- los nuevos usuarios pueden loguear y ejercer sus permisos reales

## Resultado de validaciones

- `npx tsc --noEmit`: pendiente de correr al cierre de la fase
- `npm run lint`: depende de la configuracion actual de Next y puede seguir abriendo setup interactivo

# S.1 Roles + Permissions Report

## 1. Que problema resuelve S.1

S.1 formaliza roles operativos reales dentro del admin del negocio para que no todos los usuarios tengan el mismo alcance.

El foco es:

- ocultar navegacion que no corresponde
- bloquear acciones sensibles desde UI
- agregar guards server-side chicos en productos, settings y actualizacion de pedidos

No es un RBAC enterprise.

## 2. Roles soportados

Roles del negocio:

- `owner`
- `manager`
- `operator`
- `viewer`

Compatibilidad:

- `admin` legacy sigue soportado y se trata como alias de acceso completo
- `super_admin` conserva su flujo global separado

## 3. Matriz simple de permisos

| Rol | Ver pedidos | Cambiar estados | Productos / categorias | Configuracion publica |
| --- | --- | --- | --- | --- |
| owner | si | si | si | si |
| manager | si | si | si | si |
| operator | si | si | no | no |
| viewer | si | no | no | no |
| admin (legacy) | si | si | si | si |

## 4. Archivos modificados

- `lib/admin/permissions.ts`
- `lib/admin/context.ts`
- `types/database.ts`
- `supabase/migrations/20260516201000_s1_business_roles.sql`
- `components/admin/admin-nav-config.ts`
- `components/admin/admin-nav-links.tsx`
- `components/admin/admin-mobile-drawer.tsx`
- `components/admin/admin-header.tsx`
- `components/admin/admin-shell.tsx`
- `app/admin/(protected)/layout.tsx`
- `app/admin/(protected)/dashboard/page.tsx`
- `components/admin/orders/admin-dashboard-orders.tsx`
- `components/admin/orders/order-card-quick-actions.tsx`
- `components/admin/orders/order-actions-section.tsx`
- `components/admin/orders/order-workspace.tsx`
- `components/admin/orders/admin-order-workspace-modal.tsx`
- `components/admin/orders/order-detail-page-client.tsx`
- `app/admin/(protected)/orders/[id]/page.tsx`
- `app/admin/(protected)/orders/[id]/actions.ts`
- `app/admin/(protected)/products/page.tsx`
- `app/admin/(protected)/categories/page.tsx`
- `app/admin/(protected)/settings/public/page.tsx`
- `app/admin/(protected)/settings/public/landing/page.tsx`
- `app/admin/(protected)/settings/public/catalogo/page.tsx`
- `app/admin/(protected)/products/actions.ts`
- `app/admin/(protected)/categories/actions.ts`
- `app/admin/(protected)/settings/public/actions.ts`
- `lib/super-admin/users.ts`
- `app/super-admin/(protected)/users/page.tsx`
- `components/super-admin/create-business-user-form.tsx`
- `components/super-admin/edit-user-form.tsx`
- `components/super-admin/user-management-panel.tsx`
- `app/super-admin/(protected)/actions.ts`

## 5. Que guards UI/server se agregaron

UI:

- nav admin filtrada por permiso
- dashboard oculta acciones de status para `viewer`
- modal y vista profunda muestran el pedido pero no el form de status para `viewer`
- links de productos en empty states se ocultan cuando no corresponde

Server-side:

- products page y actions: `manageProducts`
- categories page y actions: `manageProducts`
- public settings pages y actions: `managePublicSettings`
- update order status action: `updateOrders`

## 6. Que NO se implemento todavia

- RLS fina por rol del negocio
- tabla nueva de memberships
- permisos granulares por accion
- assignment
- presencia realtime
- timeline de actividad
- auditoria formal

## 7. Deudas pendientes para S.2 / S.3 / T

- decidir si `admin` legacy se migra a `owner` en datos reales
- endurecer super-admin para editar roles con mejor copy y sin mojibake legacy
- si el producto escala en multiusuario, evaluar permisos mas fuertes server-side y/o RLS por rol

## 8. Resultado de validaciones

- `npx tsc --noEmit`: OK
- `npm run lint`: pendiente no interactivo; el repo sigue abriendo setup interactivo de `next lint`
- QA real manual: pendiente desde este entorno

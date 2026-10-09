# Matriz de seguridad — Commercial Core V1

Autorización en servidor y en Postgres. Ocultar un botón no cuenta como control.

Actores:

- `anon`: landing.
- `internal`: cuenta `platform_accounts.kind = internal` con uno o más roles vigentes: `superadmin`, `commercial`, `finance`, `support`.
- `promoter`: `kind = promoter`. Estados del promotor restringen operaciones aunque el login siga vivo.
- `business_member`: `public.profiles` con `business_id` del comercio. Roles actuales de [lib/admin/permissions.ts](../../lib/admin/permissions.ts).
- `super_admin` de plataforma ya existente: se mapea a rol interno `superadmin` si tiene `platform_accounts`. No hereda solo por `profiles.role` el acceso a comisiones; la RPC exige el rol interno para no mezclar el bypass histórico de RLS de catálogo con el libro de promotores.

Un usuario con `profiles.business_id` no nulo no puede tener cuenta promotor (`DATA_MODEL.md`).

## 1. Permisos internos

Códigos estables. Varios pueden estar activos en la misma cuenta. La RPC comprueba el código, no el nombre del rol solamente, para poder endurecer sin un editor de roles.

| Código | superadmin | commercial | finance | support |
| --- | --- | --- | --- | --- |
| `crm.read` | sí | sí | no | sí, solo oportunidades con grant o etapa de onboarding |
| `crm.write` | sí | sí | no | no |
| `opportunity.win` | sí | no | no | no |
| `opportunity.lose` | sí | sí | no | no |
| `attribution.confirm` | sí | no, salvo flag explícito de superadmin en la cuenta (`attribution_confirm_delegated`) | no | no |
| `dispute.decide` | sí | no | no | no |
| `promoter.review` | sí | sí | no | no |
| `promoter.activate` | sí | no | no | no |
| `promoter.separate` | sí | no | no | no |
| `onboarding.manage` | sí | sí | no | sí |
| `onboarding.exception` | sí | no | no | no |
| `collection.write` | no por defecto | no | sí | no |
| `commission.release_exception` | sí | no | no | no |
| `settlement.prepare` | no por defecto | no | sí | no |
| `settlement.approve` | sí, si no es el preparador | no | sí, si no es el preparador | no |
| `payment.record` | no por defecto | no | sí, si no es quien aprobó | no |
| `program.write` | sí | no | no | no |
| `role.grant` | sí | no | no | no |
| `audit.read_all` | sí | no | económico sí | no |
| `privacy.resolve` | sí | no | no | no |
| `bank.read_any` | sí | no | sí | no |

`crm.read` de soporte no abre todas las filas. PHASE-02 debe aplicar ese límite en la consulta efectiva y probar que un soporte no lee una oportunidad sin grant ni vínculo de onboarding. El booleano de permiso, solo, no alcanza. La interfaz no reemplaza ese control.

`opportunity.win` queda en superadmin en V1 porque CC-09 exige un usuario autorizado de OrderOps y la matriz marca Comercial como «según autorización» para confirmar atribuciones, no para ganar. Si más adelante Comercial debe ganar, es un cambio de permiso explícito, no un default.

Superadmin no recibe `collection.write`, `settlement.prepare` ni `payment.record` por defecto. Puede otorgarse esos códigos en una asignación extra, y entonces aplican las mismas reglas de SoD. Tener todos los roles no saltea SoD.

## 2. Separación de funciones

Default activo (`BLK-SEC-02`):

- `settlement.prepared_by <> approved_by`
- `payment.recorded_by <> settlement.approved_by`
- Quien registra la cobranza puede ser la misma persona de Finanzas que prepara la liquidación. No es la misma operación sensible de «crear el derecho y pagarlo» en un solo paso: la comisión sigue sujeta a ventana, aprobación y factura.
- Excepción: `superadmin` con `action = payment.sod_exception` o `settlement.sod_exception`, motivo obligatorio, fila de auditoría. No es el camino de los tests felices.

Soporte que intenta aprobar una liquidación recibe denegación aunque manipule el id.

## 3. Matriz por recurso

Condición contextual entre paréntesis.

| Recurso | Operación | anon | promoter | commercial | finance | support | superadmin | business owner/manager |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Demo | crear | sí, RPC acotada | sí, si `active` y el ref es el propio | sí | no | no | sí | no |
| Lead | leer | no | solo los que él creó o tiene claim/oportunidad asignada | sí | no | limitado | sí | no |
| Lead | fusionar | no | no | sí, con motivo | no | no | sí | no |
| Oportunidad | cambiar etapa no terminal | no | solo asignadas, no a `won` | sí | no | no | sí | no |
| Oportunidad | `won` | no | no | no | no | no | sí, con `business_id` | no |
| Oportunidad | `lost` | no | asignadas, con motivo | sí | no | no | sí | no |
| Tarea | CRUD | no | asignadas | sí | no | no | sí | no |
| Reclamación | crear | no | `active`, sobre comercio que registra | sí en nombre de un promotor activo | no | no | sí | no |
| Atribución | confirmar | no | no | no | no | no | sí | no |
| Disputa | decidir | no | no | no | no | no | sí | no |
| Promotor | leer ficha ajena | no | no | sí | datos de pago sí, pipeline no | no | sí | no |
| Promotor | activar | no | no | no | no | no | sí | no |
| Contrato / monotributo | cargar evidencia | no | el propio, estado previo a activo | sí | no | no | sí | no |
| CBU | leer | no | el propio | no | sí | no | sí | no |
| CBU | reemplazar | no | solicita; no queda vigente sin revisión finance o superadmin | no | sí | no | sí | no |
| Grant | pedir | no | el propio | sí | no | sí | sí | no |
| Grant | aprobar | no | no | no | no | no | excepción auditada | sí, solo su `business_id` |
| Catálogo contenido | escribir | no | grant `active` no vencido, campos permitidos | no por esta vía | no | no | sí vía admin si es super_admin de catálogo existente | sí, camino actual |
| Precio | escribir | no | no | no | no | no | camino admin existente | sí, `manageProducts` |
| Pedidos y finance del local | cualquiera | no | no | no | no | no | según permisos ya existentes de super-admin, fuera de este módulo | según permisos actuales |
| Cobranza | registrar | no | no | no | sí | no | no por defecto | no |
| Comisión | leer | no | las propias | no | sí | no | sí | no |
| Comisión | excepción de setup | no | no | no | no | no | sí | no |
| Liquidación | preparar | no | no | no | sí | no | no por defecto | no |
| Liquidación | aprobar | no | no | no | sí, SoD | no | sí, SoD | no |
| Factura | cargar | no | la propia liquidación `approved`, o canal restringido si `separated` y la liquidación es suya | no | no | no | no | no |
| Factura | aceptar | no | no | no | sí | no | sí | no |
| Pago | registrar | no | no | no | sí, SoD, con factura aceptada | no | no por defecto | no |
| Roles internos | otorgar | no | no | no | no | no | sí | no |
| Auditoría | leer | no | no | no | económica | no | sí | no |

Promotor `separated`:

- Niega: nuevas reclamaciones, etapas, tareas, grants nuevos, edición de catálogo.
- Permite: leer sus liquidaciones, cargar factura de las suyas, ver pagos pendientes. Es el canal administrativo de CC-29.
- Los grants activos se revocan en la misma transacción de desvinculación.

Promotor `suspended`: igual que separated para operar, sin interpretar todavía si conserva el canal de factura. Default de ingeniería: suspendido no opera y sí puede ver comisiones ya existentes. Si el contrato real dice otra cosa, es `BLK-LEG-01` y no se amplía el acceso.

Sesión abierta después de revocar: cada RPC vuelve a leer `disabled_at`, `revoked_at` y `promoters.status`. No confía en el JWT más allá de `auth.uid()`.

## 4. RLS

Patrón:

```text
alter table commercial.<t> enable row level security;
revoke all on commercial.<t> from anon, authenticated;
```

Funciones `security definer` estables:

- `commercial.current_account_id()`
- `commercial.current_promoter_id()`
- `commercial.has_internal_role(text)`
- `commercial.has_permission(text)`

Políticas de lectura del promotor, ejemplo de intención (la migración escribe el SQL real):

```text
promoter_id = commercial.current_promoter_id()
```

en reclamaciones, comisiones, liquidaciones, facturas y grants propios.

Búsqueda de duplicados: la RPC de promotor recibe el teléfono y el nombre que él está cargando y responde solo `match | probable | none` más el id si es `match` de un comercio que él ya puede ver. No devuelve la ficha de un comercio de otro promotor. La revisión `probable` la ve el interno.

`submit_demo_request`: `security definer`. El wrapper `public` lo ejecuta solo `service_role`, desde el server action del formulario. `anon` y `authenticated` no lo ejecutan: si pudieran, elegirían `p_ip_hash` y saltearían el tope por IP. Inserta submission, resuelve dedup, crea interacción y como máximo una oportunidad si hay intención de demo. No inserta claims. La respuesta pública omite `submission_id`, `business_id` y `opportunity_id`. Rate limit: tabla `demo_rate_buckets (key, window_start, hits)` con tope de 5 por hora por teléfono normalizado y por hash de IP. Una solicitud nueva sin hash responde `unavailable` y no abre bucket. La IP no se guarda en claro. El hash usa `COMMERCIAL_RATE_LIMIT_SALT` solo en el servidor; el valor no está en el repo. La IP se lee de `x-vercel-forwarded-for` únicamente cuando `VERCEL=1`. No se usa `x-forwarded-for`. Fuera de ese runtime, o sin sal, o si el encabezado no es una sola IP, el formulario rechaza sin registrar la solicitud. El despliegue documentado es Vercel directo (`orderops.vercel.app`), sin proxy inverso delante. Vercel documenta que sobreescribe `X-Forwarded-For` para impedir suplantación y que `x-vercel-forwarded-for` conserva ese valor de plataforma si un proxy posterior pisa el otro encabezado. No hay Trusted Proxy Enterprise en este repositorio.

Los otros seis wrappers públicos (`commercial_session`, `list_open_opportunities`, `opportunity_detail`, `transition_opportunity`, `upsert_task`, `merge_commercial_businesses`) tienen `EXECUTE` solo para `authenticated`. El cuerpo sigue exigiendo `auth.uid()` y el permiso de la función. `service_role` no los ejecuta: el backoffice usa la sesión del usuario.

Miembro del comercio: RPC `respond_onboarding_grant(grant_id, decision)` comprueba `profiles.business_id = grant.business_id` y rol owner/manager vía el mismo criterio que `manageProducts`. No abre el resto del esquema.

Catálogo: no se agrega al promotor una policy `products_insert` genérica. Las escrituras de onboarding pasan por server actions que usan el cliente servidor del usuario y una RPC `commercial.assert_catalog_grant(business_id, field_set)` antes del update. Además, la action rechaza el campo precio para ese principal. Test de regresión: un owner sigue actualizando precio con el camino actual.

Documentos: storage policy del bucket `commercial-documents` sin `public`. `select` solo si una función SQL autoriza el prefijo del path para ese `auth.uid()`.

CBU: columna excluida de los `select` anchos del panel. Lectura por RPC `read_own_bank` o `read_bank_for_payment` que audita el acceso de un interno.

## 5. Escalamiento

- El cliente no puede enviar `role`, `promoter_id` ni `business_id` de plataforma como autoridad. El promotor id sale de `auth.uid()`.
- `service role` solo en el dispatcher local y en scripts de semilla. No en componentes de cliente. No en el formulario público.
- Confirmar atribución, ganar, activar promotor, aprobar liquidación y registrar pago son RPC distintas. No hay un `update row` genérico expuesto a `authenticated`.
- Cambiar `commercial_programs` o `conversion_terms` desde la API de tablas está revocado. Solo migración o RPC de superadmin que inserta una versión nueva.
- Un interno no se autoasigna `superadmin`. `role.grant` exige que el actor ya sea superadmin y no puede quitar el último superadmin (check en RPC).

## 6. Pruebas de seguridad obligatorias

Archivo previsto: `supabase/tests/commercial/rls.sql` y `lib/commercial/auth/authorization.verify.ts`.

Casos mínimos, alineados a E2E-08 y a la sección 36 de la spec:

- Promotor A lee comisión de B → 0 filas.
- Promotor busca duplicado del lead de B → no recibe nombre ni teléfono almacenado de B.
- Soporte aprueba liquidación → error de permiso.
- Promotor separado llama a la action de editar producto → denegado.
- Promotor con grant vencido edita descripción → denegado.
- Promotor con grant activo envía precio → denegado y el precio no cambia.
- Owner del comercio edita precio → sigue funcionando.
- Usuario de comercio lee `commercial.promoter_commissions` → 0 filas.
- Anon llama RPC de pago → denegado.
- Sesión de promotor tras `separated` no crea claim.
- Reintento del mismo `idempotency_key` de pago no suma dos veces.

Cada caso es un criterio de aceptación de la fase que introduce la operación. PHASE-06 los corre juntos otra vez.

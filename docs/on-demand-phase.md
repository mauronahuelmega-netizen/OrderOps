# On-Demand Phase — Blindaje de pedidos públicos

## Resumen

El **Modo On-Demand** garantiza que un negocio solo reciba pedidos vía checkout público cuando `business_settings.on_demand_mode_active = true`. La validación autoritativa ocurre en la RPC `create_order` (PostgreSQL). El checkout público aplica un guardrail de UX (mensaje + botón deshabilitado) usando el flag resuelto server-side por slug.

**Archivos clave**

| Capa | Archivo |
|------|---------|
| DB / RPC | `supabase/migrations/20260608143000_on_demand_order_guardrails.sql` |
| Resolución pública | `lib/business/public.ts` |
| UI checkout | `components/public/checkout/checkout-client.tsx` |

---

## Arquitectura

### Single Source of Truth: RPC `create_order`

La función es `SECURITY DEFINER` con `SET search_path = public`. Tras validar negocio activo, consulta `business_settings` **en base de datos** (no confía en el cliente):

```sql
if not exists (
  select 1
  from public.business_settings bs
  where bs.business_id = p_business_id
    and bs.on_demand_mode_active = true
) then
  raise exception 'on_demand_mode is not active for this business';
end if;
```

**Propiedades de seguridad**

- El cliente puede enviar cualquier `p_business_id`; la RPC valida existencia del negocio, productos y flag en servidor.
- Si no existe fila en `business_settings`, la condición falla → **fail-closed** (no se crea la orden).
- La comprobación ocurre **antes** del `INSERT` en `orders` / `order_items`.
- `GRANT EXECUTE` a `anon, authenticated` (heredado de `t8_create_order_rpc.sql`) sigue siendo válido tras `CREATE OR REPLACE`.

### Lectura pública de settings (RLS)

Migración `20260608143000` añade:

```sql
create policy "business_settings_select_active_business_public"
  on public.business_settings
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_settings.business_id
        and b.is_active = true
    )
  );
```

`lib/business/public.ts` usa el cliente server con **anon key** (respeta RLS):

1. Resuelve negocio por `slug` + `is_active = true`.
2. Consulta `business_settings` filtrando por `business_id` del paso anterior.
3. Expone `on_demand_mode_active`; si no hay fila → `false` (fail-closed en UI).

No hay fuga cross-tenant: el `business_id` proviene del slug validado, no de input del usuario.

---

## Frontend Implementation

### Flujo

1. `app/b/[slug]/checkout/page.tsx` → `requirePublicBusinessBySlug(slug)`.
2. `CheckoutClient` recibe `business.on_demand_mode_active` (SSR, `noStore()`).
3. Si el flag es `false`:
   - Banner: *"El negocio no está aceptando pedidos en este momento."*
   - Botón **Enviar pedido** deshabilitado.
   - Guard en `handleSubmit` antes de llamar a la RPC.
4. Si el flag es `true` pero la RPC rechaza (race / toggle en caliente), el error se muestra en línea.

### Fail gracefully (cliente)

El checkout **no usa toast** (no hay `AdminToastProvider` en rutas públicas). Los errores se muestran con `checkout-message checkout-message--error` vía estado `errorMessage`.

| Escenario | Comportamiento |
|-----------|----------------|
| Flag desactivado (SSR) | Mensaje estático + submit disabled |
| Validación de formulario | Mensaje en español |
| Error RPC (`error` de supabase-js) | `setErrorMessage(error.message \|\| fallback)` — **no lanza excepción** |
| Éxito | Limpia carrito + redirect a success |

**Nota:** `@supabase/supabase-js` devuelve `{ data, error }`; no hay `catch` explícito para la RPC. Errores inesperados (p. ej. `router.push`) caerían en `finally` sin mensaje al usuario.

**Limitación conocida:** el flag se hidrata en SSR. Si un owner desactiva On-Demand mientras el cliente tiene el checkout abierto, la UI puede seguir habilitada hasta refresh; la RPC sigue bloqueando el pedido.

---

## Validación manual

### 1. Bloquear pedidos (DB)

```sql
UPDATE business_settings
SET on_demand_mode_active = false
WHERE business_id = '<uuid-del-negocio>';
```

**Esperado**

- Checkout: mensaje de cierre + botón deshabilitado.
- Llamada directa a `create_order`: excepción `on_demand_mode is not active for this business`.

### 2. Rehabilitar pedidos

```sql
UPDATE business_settings
SET on_demand_mode_active = true
WHERE business_id = '<uuid-del-negocio>';
```

**Esperado:** checkout operativo; RPC crea orden con payload válido.

### 3. Bypass cliente (sanity check)

Intentar `create_order` desde consola del navegador con `on_demand_mode_active = false` en DB → debe fallar en servidor aunque el UI esté manipulado.

---

## Auditoría — hallazgos y mejoras sugeridas

| Área | Estado | Mejora opcional |
|------|--------|-----------------|
| RPC guard | ✅ Robusto, fail-closed | Mapear excepción a código SQLSTATE custom para i18n en cliente |
| RLS pública | ✅ Aislada por `business_id` | La policy expone **toda la fila** de settings a `anon` (no solo `on_demand_mode_active`); considerar vista/RPC de lectura mínima |
| `public.ts` | ✅ Seguro vía RLS | Manejar explícitamente `error` del query a `business_settings` (hoy silencioso → default `false`) |
| Checkout UX | ✅ Doble capa UI + RPC | Traducir mensaje RPC técnico al español amigable |
| Checkout errores | ⚠️ Parcial | No hay toast (inline OK); añadir `catch` para errores no-RPC |
| Catálogo | ⚠️ Gap UX | El carrito/checkout sigue accesible; solo se bloquea en checkout |
| Modo Programado | 📋 Roadmap | Hoy On-Demand bloquea **todos** los pedidos; futuro `scheduled_mode_active` requerirá lógica en RPC |

---

## Referencias

- Migración settings: `supabase/migrations/20260607210325_business_settings.sql`
- Migración guardrails: `supabase/migrations/20260608143000_on_demand_order_guardrails.sql`
- Changelog: `ORDEROPS_LIVING_MEMORY.md` → *2026-06-08 — Blindaje On-Demand en pedidos públicos*

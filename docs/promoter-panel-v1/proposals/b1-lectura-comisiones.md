# B1 — Lectura de comisiones propias

Estado: la lectura aplicada en `orderops-promoter-smoke` es `list_own_commission_groups` (`20261018170400`). No está en remoto. El RPC invocador de esta propuesta no se implementó: no agrupa por comercio ni devuelve slots vacíos. La función aplicada es `SECURITY DEFINER`, sin `GRANT` de tablas, y toma los slots de `conversion_terms.max_recurring_slots`.

No hay un registro titulado «Decisión 26» en el repositorio. El requisito escrito de agrupar por comercio es la especificación UX §8.1. Esta propuesta no lo cumple con el contrato invoker. La limitación está abajo.

## 1. Diseño y SQL

La fila de `commercial.promoter_commissions` no tiene `business_id`. La relación persistida es:

`promoter_commissions.collection_id` → `platform_collections.obligation_id` → `platform_obligations.won_business_id` → `public.businesses.id`.

`platform_obligations.conversion_terms_id` también apunta a `conversion_terms.won_business_id` y a `conversion_terms.opportunity_id`.

Esa cadena no es legible por el promotor:

- `platform_collections` y `platform_obligations` tienen `SELECT` para `authenticated`, pero la policy exige `collection.write`.
- `conversion_terms` no tiene `GRANT SELECT` para `authenticated`.
- `public.businesses` se lee por el `business_id` del perfil. El promotor no tiene perfil.

Un `SECURITY INVOKER` que una esas tablas no obtiene filas. No se propone un definer que las atraviese: eso leería obligaciones y cobranzas fuera del permiso del promotor y reconstruiría el vínculo económico. La lectura mínima no incluye comercio, nombre ni proyección de slots vacíos.

```sql
create or replace function public.list_own_promoter_commissions()
returns jsonb
language plpgsql
stable
security invoker
set search_path = pg_catalog, public, commercial
as $$
declare
  v_promoter uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_promoter := commercial.current_promoter_id();
  if v_promoter is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  return jsonb_build_object(
    'ok', true,
    'commissions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'right_kind', commission.right_kind,
        'slot', commission.slot,
        'amount_cents', commission.amount_cents,
        'status', commission.status,
        'available_at', commission.available_at,
        'created_at', commission.created_at
      ) order by commission.created_at, commission.slot nulls first)
      from commercial.promoter_commissions commission
      where commission.promoter_id = v_promoter
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.list_own_promoter_commissions() from public, anon, authenticated, service_role;
grant execute on function public.list_own_promoter_commissions() to authenticated;
```

La interfaz solo muestra esos campos. No calcula importes, no completa doce filas ausentes y no etiqueta un comercio que la lectura no trae.

### Significado de cada campo

| Campo | Significado persistido |
|---|---|
| `right_kind` | `setup` si la obligación es de activación; `recurring` si es de abono. Check de tabla. El setup no lleva slot. |
| `slot` | Entero 1–12 copiado desde `founder_slots` para una recurrente, o null si todavía no hay slot o si es setup. No es un contador calculado en la lectura. |
| `amount_cents` | Importe ya guardado al devengar. Setup: `setup_commission_cents`. Recurrente: `eligible_base_cents * recurring_bps / 10000`. La lectura no lo vuelve a calcular. |
| `status` | `pending` al insertar y mientras no vence la ventana o el setup no está liberado. `available` cuando la ventana de la recurrente ya corrió, o el setup tiene excepción o onboarding completado. `held` si hay una disputa abierta con efecto `hold_unpaid_commissions`. `in_settlement` al entrar en una liquidación. `paid` cuando el pago registrado cubre el total de esa liquidación. `voided` por reversa o reemplazo. |
| `available_at` | Null al insertar. `refresh_commission_availability` lo fija en el valor ya guardado o en `posted_at + 15 days`. No es una proyección de la interfaz. |
| `created_at` | Alta de la fila, default `now()`. |

## 2. Objetos y permisos

Ya existen y alcanzan para el invoker:

- `USAGE` de `authenticated` sobre el esquema `commercial`.
- `EXECUTE` de `commercial.current_promoter_id()`, que es `SECURITY DEFINER`.
- `GRANT SELECT` sobre `commercial.promoter_commissions`.
- Policy `promoter_commissions_select`: `collection.write` o `promoter_id = current_promoter_id()`, con RLS forzada.

Se agrega solo `EXECUTE` de la función pública. No hay `INSERT` ni `UPDATE` nuevos. El filtro por `current_promoter_id()` evita que quien tenga `collection.write` use este RPC para listar a otro promotor. La policy sigue siendo la segunda barrera.

## 3. Pruebas

Positivas:

- A recibe solo sus filas y los seis campos. Una lista sin filas es `ok: true` y `commissions: []`.
- La pantalla no muestra un séptimo campo ni un total calculado.

Negativas:

- B no recibe filas de A.
- Una cuenta sin promotor recibe `forbidden`.
- Anónimo recibe `unauthenticated`.
- El JSON no trae `business_id`, `display_name` ni slots inventados del 1 al 12.
- Un `INSERT` directo del promotor sigue rechazado.

## 4. Riesgos, alternativas y dependencias

Agrupar por comercio queda bloqueado con este contrato. La alternativa sería un definer que copie `won_business_id` y el nombre del negocio convertido. Eso lee tablas de cobranza y no entra en esta propuesta.

Depende de no cambiar `accrue_commissions_for_collection` ni los estados. La pestaña Comisiones espera este RPC y, por separado, una decisión si el agrupamiento por comercio es obligatorio para mostrarla.

## 5. Cambios de esta revisión

Se verificó la cadena hasta `won_business_id` y se documentó que el invoker no puede usarla. Se definió cada columna con el código que la escribe. Se listaron los privilegios que ya existen. Se separó la lista vacía de un error y se prohibieron proyecciones en la interfaz.

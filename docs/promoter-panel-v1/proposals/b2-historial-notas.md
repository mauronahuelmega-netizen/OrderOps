# B2 — Historial de notas propias

Estado: aplicada en `orderops-promoter-smoke`. No está en remoto. La lectura es `list_own_opportunity_notes` y la policy `commercial_interactions_select_own_notes`. El formulario aparece solo cuando esa lectura responde `ok`.

## 1. Diseño y SQL

`promoter_add_note` inserta `commercial.commercial_interactions` con `kind = 'note'` y no devuelve el cuerpo. La policy `commercial_interactions_select` deja leer la tabla solo a `superadmin` o `commercial`. `commercial_opportunities` tiene la misma restricción. Un invoker que consulte oportunidades no ve filas del promotor, así que la policy nueva no puede subconsultar esa tabla con el rol del promotor.

La comprobación de pertenencia queda en una función definer. Es verdadera solo si la oportunidad tiene `owner_account_id` igual al `account_id` del promotor de `auth.uid()`. Una reclamación sin esa titularidad no alcanza.

```sql
create or replace function commercial.promoter_owns_opportunity(p_opportunity_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, commercial
as $$
  select exists (
    select 1
    from commercial.commercial_opportunities opportunity
    join commercial.promoters promoter
      on promoter.account_id = opportunity.owner_account_id
    where opportunity.id = p_opportunity_id
      and promoter.id = commercial.current_promoter_id()
  );
$$;

revoke all on function commercial.promoter_owns_opportunity(uuid) from public, anon, authenticated, service_role;
grant execute on function commercial.promoter_owns_opportunity(uuid) to authenticated;

create policy commercial_interactions_select_own_notes
  on commercial.commercial_interactions
  for select to authenticated
  using (
    kind = 'note'
    and commercial.promoter_owns_opportunity(opportunity_id)
  );

create or replace function public.list_own_opportunity_notes(p_opportunity_id uuid)
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
  if v_promoter is null or p_opportunity_id is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if not commercial.promoter_owns_opportunity(p_opportunity_id) then
    return jsonb_build_object('ok', true, 'notes', '[]'::jsonb);
  end if;
  return jsonb_build_object(
    'ok', true,
    'notes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', interaction.id,
        'body', interaction.body,
        'occurred_at', interaction.occurred_at
      ) order by interaction.occurred_at desc)
      from commercial.commercial_interactions interaction
      where interaction.kind = 'note'
        and interaction.opportunity_id = p_opportunity_id
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.list_own_opportunity_notes(uuid) from public, anon, authenticated, service_role;
grant execute on function public.list_own_opportunity_notes(uuid) to authenticated;
```

Las policies de `SELECT` del mismo comando se combinan con OR. La policy interna no se reemplaza y no empieza a incluir al promotor. La nueva solo agrega filas `kind = 'note'` de una oportunidad propia. `call`, `whatsapp`, `email`, `meeting` y el resto quedan fuera. Un rol `commercial` sigue viendo todo por la policy que ya tiene; eso no lo introduce esta policy.

El RPC, aunque la policy fallara abierta, vuelve a exigir `kind = 'note'` y la titularidad. Si la oportunidad no es de la cuenta, responde `ok: true` y `notes: []`, sin decir si el id existe.

## 2. Objetos y permisos

Ya concedidos a `authenticated`: `USAGE` del esquema `commercial`; `SELECT` de `commercial_interactions`, `commercial_opportunities` y `commercial.promoters`; `EXECUTE` de `current_promoter_id()`.

Nuevos: `EXECUTE` de `promoter_owns_opportunity` y de `list_own_opportunity_notes`, más la policy de notas. No hay `INSERT` nuevo. El alta sigue solo en `promoter_add_note`.

## 3. Pruebas

Positivas:

- A lee `id`, `body` y `occurred_at` de las notas de una oportunidad cuyo `owner_account_id` es su cuenta.
- Una oportunidad propia sin notas devuelve `notes: []`.

Negativas:

- B, con el id de A, recibe `notes: []`.
- Una interacción `kind = 'call'` de la oportunidad de A no aparece.
- Un id desconocido o una oportunidad solo vinculada por reclamación, sin ser owner, recibe `notes: []`.
- Anónimo recibe `unauthenticated`. Una cuenta sin promotor recibe `forbidden`.
- El portal no muestra «Guardar nota».

## 4. Riesgos, alternativas y dependencias

Si la policy omitiera `kind = 'note'`, el OR abriría el resto de las interacciones. El SQL lo incluye. La función definer debe conservar `search_path` fijo.

Alternativa rechazada: subconsultar `commercial_opportunities` dentro de la policy con el rol del promotor. La RLS actual no le deja ver esas filas y la policy no matchearía ninguna nota.

Depende de mantener oculto el formulario hasta aplicar juntos la función, la policy y el RPC.

## 5. Cambios de esta revisión

Se reemplazó el subconsulta invoker por `promoter_owns_opportunity`. Se escribió el SQL completo de la policy y del RPC. Se documentó el OR con la policy interna y las pruebas de otro tipo, otra cuenta y oportunidad no titular.

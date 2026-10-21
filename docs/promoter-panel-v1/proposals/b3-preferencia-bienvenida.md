# B3 — Persistencia de la bienvenida

Estado: aplicada en `orderops-promoter-smoke`. No está en remoto. No usa `localStorage`. La lectura no entra en `promoter_overview`.

## 1. Diseño y SQL

Contrato:

- Leer devuelve `ok` y `welcome_dismissed_at`.
- Null, incluida la ausencia de fila, significa guía visible.
- Un timestamp significa guía cerrada.
- Escribir `true` guarda `now()`. Escribir `false` guarda null y la vuelve a mostrar.
- El checklist sigue calculándose con código, cartera, oportunidad y tarea abierta. Cerrar no marca esos ítems.

`profiles.notification_preferences` es del perfil de un negocio. El promotor no tiene perfil. `commercial.notification_preferences` es el opt-out de despacho, está revocada a `authenticated` y no representa esta guía.

Una columna en `commercial.promoters` mezclaría la ficha legal con la interfaz. Esa tabla no tiene `GRANT UPDATE` para `authenticated`. Darlo permitiría escribir estado, CUIT o código. La tabla nueva solo tiene la preferencia y su RLS no alcanza a `promoters`.

```sql
create table commercial.promoter_portal_preferences (
  promoter_id uuid primary key references commercial.promoters (id),
  welcome_dismissed_at timestamptz
);

alter table commercial.promoter_portal_preferences enable row level security;
alter table commercial.promoter_portal_preferences force row level security;
revoke all on table commercial.promoter_portal_preferences from public, anon, authenticated;
grant select, insert, update on table commercial.promoter_portal_preferences to authenticated;

create policy promoter_portal_preferences_select
  on commercial.promoter_portal_preferences
  for select to authenticated
  using (promoter_id = commercial.current_promoter_id());

create policy promoter_portal_preferences_insert
  on commercial.promoter_portal_preferences
  for insert to authenticated
  with check (promoter_id = commercial.current_promoter_id());

create policy promoter_portal_preferences_update
  on commercial.promoter_portal_preferences
  for update to authenticated
  using (promoter_id = commercial.current_promoter_id())
  with check (promoter_id = commercial.current_promoter_id());

create or replace function public.read_own_welcome_preference()
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, public, commercial
as $$
  select case
    when auth.uid() is null then jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated')
    when commercial.current_promoter_id() is null then jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden')
    else jsonb_build_object(
      'ok', true,
      'welcome_dismissed_at', (
        select preference.welcome_dismissed_at
        from commercial.promoter_portal_preferences preference
        where preference.promoter_id = commercial.current_promoter_id()
      )
    )
  end;
$$;

create or replace function public.set_own_welcome_dismissed(p_dismissed boolean)
returns jsonb
language plpgsql
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
  if v_promoter is null or p_dismissed is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  insert into commercial.promoter_portal_preferences (promoter_id, welcome_dismissed_at)
  values (v_promoter, case when p_dismissed then pg_catalog.now() else null end)
  on conflict (promoter_id) do update
    set welcome_dismissed_at = excluded.welcome_dismissed_at;
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.read_own_welcome_preference() from public, anon, authenticated, service_role;
revoke all on function public.set_own_welcome_dismissed(boolean) from public, anon, authenticated, service_role;
grant execute on function public.read_own_welcome_preference() to authenticated;
grant execute on function public.set_own_welcome_dismissed(boolean) to authenticated;
```

La clave primaria impide dos filas por promotor. No hay `GRANT DELETE`. El portal llama a la lectura al armar Inicio. Si `welcome_dismissed_at` es null, muestra la guía y el botón de cierre. Si tiene timestamp, oculta la guía y ofrece reabrirla. Cerrar llama `set_own_welcome_dismissed(true)`. Reabrir llama `false`. La preferencia queda en la base y vuelve en otra sesión del mismo usuario.

## 2. Objetos y permisos

Nuevos: la tabla, tres policies y dos funciones. Privilegios mínimos: `SELECT`, `INSERT`, `UPDATE` y `EXECUTE`. `current_promoter_id()` ya es ejecutable por `authenticated`. No se otorga `UPDATE` sobre `promoters`.

## 3. Pruebas

Positivas:

- Sin fila, la lectura de A devuelve `welcome_dismissed_at: null` y la guía se muestra.
- Después de cerrar, un nuevo ingreso de A sigue con timestamp y la guía oculta.
- Reabrir deja null y la guía vuelve.
- El ítem de tarea abierta cambia si la tarea cambia, aunque la guía esté cerrada.

Negativas:

- B no ve ni escribe la fila de A. El `with check` rechaza otro `promoter_id`.
- `DELETE` del rol `authenticated` queda sin grant.
- Anónimo recibe `unauthenticated`. Una cuenta sin promotor recibe `forbidden`.
- No se lee ni se escribe `localStorage` para esta preferencia.

## 4. Riesgos, alternativas y dependencias

Un `FOR ALL` habría cubierto `DELETE` en la policy aunque el grant no lo diera. Quedó separado. La alternativa de columna en `promoters` exige un privilegio de actualización más amplio y se descarta.

Depende de seguir calculando el progreso en el servidor. El botón de cierre no se implementa hasta aplicar tabla y RPC.

## 5. Cambios de esta revisión

Se fijó el contrato null / timestamp, la ausencia de fila y la justificación frente a una columna. Se separaron las policies y se sacó el delete. Se agregaron las pruebas de otra sesión y de otro promotor.

## 6. Lectura recomendada

Se recomienda la lectura independiente `read_own_welcome_preference`. No se agrega la preferencia a `promoter_overview`.

`promoter_overview` ya lo llaman Inicio, Cartera, Oportunidades, la ficha, Reclamaciones y Tareas. Hoy devuelve `ok`, `businesses`, `opportunities`, `claims` y `tasks`. Inicio es el único lugar de la guía. Meter el cierre ahí haría que un fallo de la tabla nueva tumbe también la cartera y la agenda. La lectura aparte falla solo en Inicio.

La escritura sigue en `set_own_welcome_dismissed`. Un segundo RPC solo corre en Inicio.

## 7. Contrato cerrado

- Sin fila, o `welcome_dismissed_at` null: la guía se muestra.
- Con timestamp: se oculta y se ofrece reabrirla.
- Cerrar persiste `now()` solo si el RPC devuelve `ok: true`.
- Reabrir escribe null solo si el RPC devuelve `ok: true`.
- Si la lectura no devuelve `ok: true`, la guía se muestra y un alerta dice que no se pudo confirmar el cierre. No se trata ese fallo como preferencia cerrada.
- Si la escritura falla, la guía queda como estaba y se muestra el error. No hay cierre optimista.
- Dos cierres concurrentes dejan la guía oculta. Cierre y reapertura concurrentes: gana la transacción que commitea última. La clave primaria impide dos filas.
- El progreso no se guarda en esta tabla.
- Suspendido puede cerrar y reabrir: no es una operación comercial y no exige `can_operate`.
- Separado no ve la guía porque el panel no renderiza el contenido. La fila, si existe, no le devuelve la cartera. Al volver a estar activo, el timestamp sigue vigente.
- No se escribe `promoters` ni se usa `localStorage`.

## 8. Matriz de aceptación

| Caso | Precondición | Acción | Resultado | PASS |
|---|---|---|---|---|
| Ausente | A sin fila | Abrir Inicio | Guía visible. Lectura `ok` y `welcome_dismissed_at` null | Captura y JSON de la lectura |
| Cerrada | A activo | Cerrar | Guía oculta. Fila con timestamp. `ok: true` | Captura tras recargar |
| Reapertura | Fila con timestamp | Reabrir | Guía visible. Columna null | JSON y captura |
| Otra sesión | Preferencia cerrada | Salir y entrar | Sigue oculta | Dos ingresos distintos |
| Aislamiento | A cerrada, B sin fila | Entrar como B | B ve su guía. No lee la fila de A | Dos JSON |
| Error de lectura | RPC de preferencia en fallo, cartera en ok | Abrir Inicio | Guía visible y alerta. No dice que fue cerrada | Captura del alerta |
| Error de escritura | RPC de escritura en fallo | Cerrar | La guía no cambia. Alerta | Captura antes y después |
| Sin localStorage | Código de Inicio y acciones | Buscar `localStorage` | Cero usos para esta preferencia | Salida del verificador |
| Progreso real | Guía cerrada y una tarea abierta nueva | Recargar | Al reabrir, el ítem de tarea sale de los datos | Captura del ítem |

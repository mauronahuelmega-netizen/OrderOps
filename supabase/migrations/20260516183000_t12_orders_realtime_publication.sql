-- T12: habilitar realtime operativo para orders
-- Alcance:
-- - publicar public.orders en supabase_realtime
-- - asegurar old/new payload util en updates

do $$
begin
  begin
    alter publication supabase_realtime add table public.orders;
  exception
    when duplicate_object then
      null;
  end;
end
$$;

alter table public.orders replica identity full;

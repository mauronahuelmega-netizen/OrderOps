-- V6.3b.3: habilitar realtime para store_sessions
-- Alcance:
-- - publicar public.store_sessions en supabase_realtime

do $$
begin
  begin
    alter publication supabase_realtime add table public.store_sessions;
  exception
    when duplicate_object then
      null;
  end;
end
$$;

alter table public.store_sessions replica identity full;

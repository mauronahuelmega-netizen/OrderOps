do $$
begin
  if current_database() is distinct from 'orderops_concurrency' then
    raise exception 'refusing dblink outside orderops_concurrency';
  end if;
end;
$$;

create extension if not exists dblink;

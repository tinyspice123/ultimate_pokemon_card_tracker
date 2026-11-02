\set ON_ERROR_STOP on

do $$
begin
  if to_regclass('public.pokemon_card_main') is null
     or to_regclass('public.pokemon_card_quantity_history') is null
     or to_regclass('private.collection_editors') is null then
    raise exception 'production collection tables are incomplete';
  end if;
  if not has_column_privilege('authenticated','public.pokemon_card_main','quantity','update')
     or has_column_privilege('authenticated','public.pokemon_card_main','card_name','update') then
    raise exception 'production quantity column privileges do not match the repository contract';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='pokemon_card_quantity_history'
      and column_name='variant'
  ) then
    raise exception 'production quantity history is missing variant identity';
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.pokemon_card_quantity_history'::regclass
      and contype='f' and confdeltype='n'
  ) then
    raise exception 'production quantity history does not retain deleted-card rows';
  end if;
end $$;

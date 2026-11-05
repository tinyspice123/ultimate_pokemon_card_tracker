\set ON_ERROR_STOP on

-- Catalogue seeds must be present before the application registry is deployed.
do $$
begin
  if (select count(*) from public.pokemon_card_main where set_id='delta-reign') <> 234
    or (select count(distinct collector_number) from public.pokemon_card_main where set_id='delta-reign') <> 141
  then raise exception 'Delta Reign catalogue is incomplete'; end if;
  if exists (select 1 from public.pokemon_card_main where set_id='delta-reign' and group_name is distinct from 'Base Set')
  then raise exception 'Delta Reign must use one Base Set section'; end if;
end $$;

insert into auth.users(id) values
  ('00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002');
insert into private.collection_editors(user_id)
values ('00000000-0000-0000-0000-000000000001');
insert into public.pokemon_card_main
  (id,set_id,sort_order,group_name,card_name,collector_number,variant,quantity)
values ('card-1','test-set',1,'Base','Pikachu','025','Reverse Holo',1);
insert into public.pokemon_card_main
  (id,set_id,sort_order,group_name,card_name,collector_number,variant,quantity)
values ('card-2','test-set',2,'Base','Eevee','133','Regular',0);

set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
update public.pokemon_card_main set quantity=2 where id='card-1';
select * from public.set_collection_quantities(
  '[{"id":"card-1","quantity":4},{"id":"card-2","quantity":2}]'::jsonb
);

do $$
begin
  begin
    update public.pokemon_card_main set card_name='Tampered' where id='card-1';
    raise exception 'editor unexpectedly changed catalogue metadata';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
do $$
begin
  if not exists (
    select 1 from public.pokemon_card_quantity_history
    where card_id='card-1' and card_name='Pikachu' and collector_number='025'
      and variant='Reverse Holo' and previous_quantity=2 and new_quantity=4
      and changed_by='00000000-0000-0000-0000-000000000001'
  ) then raise exception 'quantity audit row is incomplete or missing'; end if;
end $$;

set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
do $$
begin
  begin
    perform public.set_collection_quantities(
      '[{"id":"card-1","quantity":7},{"id":"missing","quantity":1}]'::jsonb);
    raise exception 'invalid batch unexpectedly succeeded';
  exception when invalid_parameter_value then null;
  end;
end $$;
reset role;

do $$
begin
  if (select quantity from public.pokemon_card_main where id='card-1') <> 4 then
    raise exception 'invalid batch was not atomic';
  end if;
end $$;

set role anon;
do $$
begin
  begin
    update public.pokemon_card_main set quantity=9 where id='card-1';
    raise exception 'anonymous user unexpectedly updated quantity';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
update public.pokemon_card_main set quantity=3 where id='card-1';
reset role;

do $$
begin
  if (select quantity from public.pokemon_card_main where id='card-1') <> 4 then
    raise exception 'non-editor changed quantity';
  end if;
end $$;

delete from public.pokemon_card_main where id='card-1';
do $$
begin
  if not exists (
    select 1 from public.pokemon_card_quantity_history
    where card_id is null and card_name='Pikachu' and collector_number='025'
      and variant='Reverse Holo'
  ) then raise exception 'deleting a card erased or damaged its audit history'; end if;
end $$;

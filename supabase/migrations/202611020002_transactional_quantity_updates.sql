-- Apply reviewed quantity imports atomically. The function remains security
-- invoker so column grants, RLS, and the existing history trigger all apply.
create or replace function public.set_collection_quantities(changes jsonb)
returns table (card_id text, quantity integer)
language plpgsql
set search_path = ''
as $$
declare
  change_count integer;
begin
  if not (select public.is_collection_editor()) then
    raise exception 'collection editor access required' using errcode = '42501';
  end if;
  if jsonb_typeof(changes) is distinct from 'array' then
    raise exception 'changes must be a JSON array' using errcode = '22023';
  end if;

  change_count := jsonb_array_length(changes);
  if change_count < 1 or change_count > 500 then
    raise exception 'changes must contain between 1 and 500 cards' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_to_recordset(changes) as item(id text, quantity integer)
    where item.id is null or item.quantity is null or item.quantity < 0
  ) then
    raise exception 'each change requires a card id and non-negative quantity' using errcode = '22023';
  end if;
  if (select count(distinct item.id)
      from jsonb_to_recordset(changes) as item(id text, quantity integer)) <> change_count then
    raise exception 'each card may appear only once' using errcode = '22023';
  end if;
  if (select count(*)
      from public.pokemon_card_main as card
      join jsonb_to_recordset(changes) as item(id text, quantity integer)
        on item.id = card.id) <> change_count then
    raise exception 'one or more cards do not exist' using errcode = '22023';
  end if;

  return query
    update public.pokemon_card_main as card
    set quantity = item.quantity
    from jsonb_to_recordset(changes) as item(id text, quantity integer)
    where card.id = item.id
    returning card.id, card.quantity;
end;
$$;

revoke all on function public.set_collection_quantities(jsonb) from public;
grant execute on function public.set_collection_quantities(jsonb) to authenticated;

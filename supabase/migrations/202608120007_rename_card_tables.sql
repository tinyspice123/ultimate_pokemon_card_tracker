-- Rename the live catalogue and its audit trail without rebuilding data,
-- constraints, RLS policies, or triggers.
do $$
begin
  if to_regclass('public.pokemon_card_main') is null
     and to_regclass('public.pokemon_cards') is not null then
    alter table public.pokemon_cards rename to pokemon_card_main;
  end if;
  if to_regclass('public.pokemon_card_quantity_history') is null
     and to_regclass('public.quantity_history') is not null then
    alter table public.quantity_history rename to pokemon_card_quantity_history;
  end if;
end;
$$;

alter index if exists public.pokemon_cards_set_id_idx
  rename to pokemon_card_main_set_id_idx;
alter index if exists public.quantity_history_set_changed_at_idx
  rename to pokemon_card_quantity_history_set_changed_at_idx;

create or replace function public.record_quantity_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.quantity is distinct from old.quantity then
    insert into public.pokemon_card_quantity_history
      (card_id, set_id, card_name, collector_number, previous_quantity, new_quantity, changed_by)
    values
      (new.id, new.set_id, new.card_name, new.collector_number,
       old.quantity, new.quantity, auth.uid());
  end if;
  return new;
end;
$$;

revoke all on function public.record_quantity_change() from public;

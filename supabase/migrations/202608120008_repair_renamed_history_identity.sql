-- Repair projects where the history table was renamed before migration 006
-- added collector_number. Safe to run after the table rename.
alter table public.pokemon_card_quantity_history
  add column if not exists collector_number text not null default '';

update public.pokemon_card_quantity_history as history
set collector_number = cards.collector_number
from public.pokemon_card_main as cards
where cards.id = history.card_id
  and history.collector_number = '';

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

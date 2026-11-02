-- Editors may change collection quantities, but catalogue identity and metadata
-- remain maintenance-only. Preserve history even when a catalogue row is
-- deliberately removed, and snapshot the complete card identity in each row.
revoke update on public.pokemon_card_main from authenticated;
grant update (quantity) on public.pokemon_card_main to authenticated;

alter table public.pokemon_card_quantity_history
  add column if not exists variant text not null default '';

update public.pokemon_card_quantity_history as history
set variant = cards.variant
from public.pokemon_card_main as cards
where cards.id = history.card_id
  and history.variant = '';

alter table public.pokemon_card_quantity_history
  alter column card_id drop not null;

alter table public.pokemon_card_quantity_history
  drop constraint if exists quantity_history_card_id_fkey;
alter table public.pokemon_card_quantity_history
  drop constraint if exists pokemon_card_quantity_history_card_id_fkey;
alter table public.pokemon_card_quantity_history
  add constraint pokemon_card_quantity_history_card_id_fkey
  foreign key (card_id) references public.pokemon_card_main(id) on delete set null;

create or replace function public.record_quantity_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.quantity is distinct from old.quantity then
    insert into public.pokemon_card_quantity_history
      (card_id, set_id, card_name, collector_number, variant,
       previous_quantity, new_quantity, changed_by)
    values
      (new.id, new.set_id, new.card_name, new.collector_number, new.variant,
       old.quantity, new.quantity, auth.uid());
  end if;
  return new;
end;
$$;

revoke all on function public.record_quantity_change() from public;

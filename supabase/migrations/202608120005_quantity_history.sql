-- Immutable audit trail for editor quantity changes. The browser may read it
-- only when the current user is in the private editor allowlist.
create table if not exists public.quantity_history (
  id bigint generated always as identity primary key,
  card_id uuid not null references public.pokemon_cards(id) on delete cascade,
  set_id text not null,
  card_name text not null,
  previous_quantity integer not null check (previous_quantity >= 0),
  new_quantity integer not null check (new_quantity >= 0),
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);

create index if not exists quantity_history_set_changed_at_idx
  on public.quantity_history (set_id, changed_at desc);

alter table public.quantity_history enable row level security;
revoke all on public.quantity_history from public, anon, authenticated;
grant select on public.quantity_history to authenticated;

create policy "Editors can read quantity history"
  on public.quantity_history for select to authenticated
  using ((select public.is_collection_editor()));

create or replace function public.record_quantity_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.quantity is distinct from old.quantity then
    insert into public.quantity_history
      (card_id, set_id, card_name, previous_quantity, new_quantity, changed_by)
    values
      (new.id, new.set_id, new.card_name, old.quantity, new.quantity, auth.uid());
  end if;
  return new;
end;
$$;

revoke all on function public.record_quantity_change() from public;

drop trigger if exists record_quantity_history on public.pokemon_cards;
create trigger record_quantity_history
  after update of quantity on public.pokemon_cards
  for each row execute function public.record_quantity_change();

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.collection_editors (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
revoke all on private.collection_editors from public, anon, authenticated;

create or replace function public.is_collection_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.collection_editors
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_collection_editor() from public;
grant execute on function public.is_collection_editor() to authenticated;

drop policy if exists "Owner updates quantities" on public.pokemon_cards;
create policy "Owner updates quantities"
  on public.pokemon_cards for update to authenticated
  using ((select public.is_collection_editor()))
  with check ((select public.is_collection_editor()));

grant update on public.pokemon_cards to authenticated;

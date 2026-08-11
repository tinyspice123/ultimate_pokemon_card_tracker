alter table public.pokemon_cards enable row level security;

drop policy if exists "Cards are publicly readable" on public.pokemon_cards;
create policy "Cards are publicly readable"
  on public.pokemon_cards for select to anon, authenticated
  using (true);

drop policy if exists "Owner updates quantities" on public.pokemon_cards;
create policy "Owner updates quantities"
  on public.pokemon_cards for update to authenticated
  using ((select auth.jwt() ->> 'email') = 'collection-owner')
  with check ((select auth.jwt() ->> 'email') = 'collection-owner');

grant usage on schema public to anon, authenticated;
grant select on public.pokemon_cards to anon, authenticated;
grant update on public.pokemon_cards to authenticated;

alter table public.pokemon_cards enable row level security;

drop policy if exists "Cards are publicly readable" on public.pokemon_cards;
create policy "Cards are publicly readable"
  on public.pokemon_cards for select to anon, authenticated
  using (true);

grant usage on schema public to anon, authenticated;
grant select on public.pokemon_cards to anon, authenticated;
grant update on public.pokemon_cards to authenticated;

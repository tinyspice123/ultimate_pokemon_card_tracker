create table if not exists public.cards (
  id text primary key,
  set_id text not null,
  sort_order integer not null,
  group_name text not null default 'Ungrouped',
  card_name text not null,
  collector_number text not null default '',
  variant text not null default '',
  source text not null default '',
  price text not null default '',
  status text not null default '',
  image_url text not null default '',
  quantity integer not null default 0 check (quantity >= 0),
  unique (set_id, sort_order)
);

create index if not exists cards_set_id_idx on public.cards (set_id, sort_order);
alter table public.cards enable row level security;

drop policy if exists "Cards are publicly readable" on public.cards;
create policy "Cards are publicly readable"
  on public.cards for select to anon, authenticated using (true);

revoke all on public.cards from anon, authenticated;
grant select on public.cards to anon, authenticated;

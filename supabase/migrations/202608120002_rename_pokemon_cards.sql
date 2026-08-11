do $$
begin
  if to_regclass('public.pokemon_cards') is null
     and to_regclass('public.cards') is not null then
    alter table public.cards rename to pokemon_cards;
  end if;
end
$$;

alter index if exists public.cards_set_id_idx rename to pokemon_cards_set_id_idx;

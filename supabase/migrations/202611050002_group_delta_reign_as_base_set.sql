-- Present the full Delta Reign checklist as one section without changing
-- card identities, sort order, images, owned quantities, or quantity history.
update public.pokemon_card_main
set group_name = 'Base Set'
where set_id = 'delta-reign' and group_name is distinct from 'Base Set';

"""Keep the new catalogue migration aligned with its recovery snapshot."""
import sqlite3
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts'))
from import_supabase_cards import rows_for_set


class DeltaReignTests(unittest.TestCase):
    def test_seed_matches_snapshot_and_preserves_owned_quantities(self):
        cards = rows_for_set('delta-reign', ROOT / 'backups/delta-reign.csv')
        migration = (ROOT / 'supabase/migrations/202611050001_add_delta_reign.sql').read_text(encoding='utf-8')
        with sqlite3.connect(':memory:') as db:
            db.execute("attach database ':memory:' as public")
            columns = ', '.join(f'{key} ' + ('integer' if key in {'sort_order', 'quantity'} else 'text')
                                + (' primary key' if key == 'id' else '') for key in cards[0])
            db.execute(f'create table public.pokemon_card_main ({columns})')
            db.executescript(migration)
            actual = db.execute('select * from public.pokemon_card_main order by sort_order').fetchall()
            self.assertEqual(actual, [tuple(card.values()) for card in cards])
            self.assertEqual(len(actual), 234)
            self.assertEqual(len({card['collector_number'] for card in cards}), 141)
            db.execute('update public.pokemon_card_main set quantity=3 where sort_order=0')
            db.executescript(migration)
            self.assertEqual(db.execute('select sum(quantity) from public.pokemon_card_main').fetchone()[0], 3)


if __name__ == '__main__':
    unittest.main()

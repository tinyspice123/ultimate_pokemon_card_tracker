"""Keep the new catalogue migration aligned with its recovery snapshot."""
import sqlite3
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts'))
from import_supabase_cards import rows_for_set


class DeltaReignTests(unittest.TestCase):
    def test_every_variant_has_its_numbered_local_scan(self):
        cards = rows_for_set('delta-reign', ROOT / 'backups/delta-reign.csv')
        directory = ROOT / 'public/img/delta-reign'
        entries = [line.split('|') for line in (directory / 'manifest.txt').read_text(encoding='utf-8').splitlines()]
        expected = {(card['card_name'], card['collector_number'], card['variant']) for card in cards}
        self.assertEqual({tuple(entry[:3]) for entry in entries}, expected)
        self.assertEqual(len(entries), 234)
        self.assertEqual(len({entry[3] for entry in entries}), 141)
        for _, number, _, filename in entries:
            self.assertEqual(filename, number.split('/')[0] + '.webp')
            data = (directory / filename).read_bytes()
            self.assertEqual(data[:4], b'RIFF')
            self.assertEqual(data[8:12], b'WEBP')

    def test_seed_matches_snapshot_and_preserves_owned_quantities(self):
        cards = rows_for_set('delta-reign', ROOT / 'backups/delta-reign.csv')
        seed = (ROOT / 'supabase/migrations/202611050001_add_delta_reign.sql').read_text(encoding='utf-8')
        grouping = (ROOT / 'supabase/migrations/202611050002_group_delta_reign_as_base_set.sql').read_text(encoding='utf-8')
        migration = seed + '\n' + grouping
        with sqlite3.connect(':memory:') as db:
            db.execute("attach database ':memory:' as public")
            columns = ', '.join(f'{key} ' + ('integer' if key in {'sort_order', 'quantity'} else 'text')
                                + (' primary key' if key == 'id' else '') for key in cards[0])
            db.execute(f'create table public.pokemon_card_main ({columns})')
            db.executescript(migration)
            actual = db.execute('select * from public.pokemon_card_main order by sort_order').fetchall()
            self.assertEqual(actual, [tuple(card.values()) for card in cards])
            self.assertEqual(len(actual), 234)
            self.assertEqual({card['group_name'] for card in cards}, {'Base Set'})
            self.assertEqual(len({card['collector_number'] for card in cards}), 141)
            db.execute('update public.pokemon_card_main set quantity=3 where sort_order=0')
            db.executescript(migration)
            self.assertEqual(db.execute('select sum(quantity) from public.pokemon_card_main').fetchone()[0], 3)


if __name__ == '__main__':
    unittest.main()

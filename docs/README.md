# Operations guides

Use these guides for routine collection maintenance:

- [Add or edit cards](ADDING_CARDS.md)
- [Add a new set](ADDING_SETS.md)
- [Delete or archive a set](DELETING_SETS.md)
- [Manage editor access](EDITOR_ACCESS.md)
- [Manage card images](IMAGES.md)
- [Backups and restore](BACKUPS.md)
- [Repository recovery](RECOVERY.md)
- [Service consoles and routine checks](SERVICES.md)

Supabase's `pokemon_cards` table is the live source of truth. Files under
`backups/` are generated recovery snapshots and should not normally be edited
by hand after the initial database import.

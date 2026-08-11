# Manage editor access

Editor authorization uses a private Supabase table keyed by Auth user UUID.
No owner email address is stored in the repository or public browser bundle.

## Initial setup

1. Apply `supabase/migrations/202608120004_private_editor_allowlist.sql` in
   Supabase SQL Editor.
2. Open **Authentication → Users**.
3. Select the Google account that should edit the collection.
4. Copy its **User UID**.
5. Insert that UUID in SQL Editor:

```sql
insert into private.collection_editors (user_id)
values ('PASTE-AUTH-USER-UUID-HERE')
on conflict (user_id) do nothing;
```

Sign out of the website and sign in again. The frontend calls
`is_collection_editor()` and displays quantity controls only when it returns
true. The same function is used by the database update policy, so hiding the
buttons is not the security boundary.

## Review editors

The private table is not exposed through the public REST API. Review it from
SQL Editor:

```sql
select user_id, created_at
from private.collection_editors
order by created_at;
```

## Remove editor access

```sql
delete from private.collection_editors
where user_id = 'AUTH-USER-UUID-HERE';
```

Revocation takes effect on the next permission check. The user may remain a
valid Supabase Auth user but will have view-only access.

## Quantity history

Apply `supabase/migrations/202608120005_quantity_history.sql` after the editor
allowlist migration. Supabase then records every quantity change with its
previous value, new value, user ID, and timestamp. The authorized editor sees
the latest 30 days for the open set in the tracker; it is not public.


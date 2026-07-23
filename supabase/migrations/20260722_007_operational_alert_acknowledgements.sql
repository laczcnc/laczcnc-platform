begin;

create extension if not exists pgcrypto;

create table if not exists public.alert_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null
    references auth.users(id)
    on delete cascade,
  alert_key text not null,
  acknowledged_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint alert_acknowledgements_key_length
    check (
      char_length(trim(alert_key))
      between 3 and 300
    ),
  constraint alert_acknowledgements_user_key_unique
    unique (user_id, alert_key)
);

create index if not exists
alert_acknowledgements_user_date_idx
on public.alert_acknowledgements(
  user_id,
  acknowledged_at desc
);

alter table public.alert_acknowledgements
enable row level security;

drop policy if exists
"users can read own alert acknowledgements"
on public.alert_acknowledgements;

create policy
"users can read own alert acknowledgements"
on public.alert_acknowledgements
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists
"users can create own alert acknowledgements"
on public.alert_acknowledgements;

create policy
"users can create own alert acknowledgements"
on public.alert_acknowledgements
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists
"users can delete own alert acknowledgements"
on public.alert_acknowledgements;

create policy
"users can delete own alert acknowledgements"
on public.alert_acknowledgements
for delete
to authenticated
using (user_id = auth.uid());

commit;

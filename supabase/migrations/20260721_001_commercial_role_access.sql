begin;

create or replace function public.has_staff_role(
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
      and role::text = any(allowed_roles)
  );
$$;

revoke all on function public.has_staff_role(text[]) from public;
grant execute on function public.has_staff_role(text[]) to authenticated;

alter table public.quote_requests enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;

drop policy if exists "commercial staff can read quotes" on public.quote_requests;
create policy "commercial staff can read quotes"
on public.quote_requests
for select
to authenticated
using (
  public.has_staff_role(array['admin', 'manager', 'sales'])
);

drop policy if exists "commercial staff can update quotes" on public.quote_requests;
create policy "commercial staff can update quotes"
on public.quote_requests
for update
to authenticated
using (
  public.has_staff_role(array['admin', 'manager', 'sales'])
)
with check (
  public.has_staff_role(array['admin', 'manager', 'sales'])
);

drop policy if exists "commercial managers can delete quotes" on public.quote_requests;
create policy "commercial managers can delete quotes"
on public.quote_requests
for delete
to authenticated
using (
  public.has_staff_role(array['admin', 'manager'])
);

drop policy if exists "commercial staff can read customers" on public.customers;
create policy "commercial staff can read customers"
on public.customers
for select
to authenticated
using (
  public.has_staff_role(array['admin', 'manager', 'sales'])
);

drop policy if exists "commercial staff can create customers" on public.customers;
create policy "commercial staff can create customers"
on public.customers
for insert
to authenticated
with check (
  public.has_staff_role(array['admin', 'manager', 'sales'])
);

drop policy if exists "commercial staff can update customers" on public.customers;
create policy "commercial staff can update customers"
on public.customers
for update
to authenticated
using (
  public.has_staff_role(array['admin', 'manager', 'sales'])
)
with check (
  public.has_staff_role(array['admin', 'manager', 'sales'])
);

drop policy if exists "commercial managers can delete customers" on public.customers;
create policy "commercial managers can delete customers"
on public.customers
for delete
to authenticated
using (
  public.has_staff_role(array['admin', 'manager'])
);

drop policy if exists "commercial staff can read orders" on public.orders;
create policy "commercial staff can read orders"
on public.orders
for select
to authenticated
using (
  public.has_staff_role(array['admin', 'manager', 'sales'])
);

drop policy if exists "commercial staff can create orders" on public.orders;
create policy "commercial staff can create orders"
on public.orders
for insert
to authenticated
with check (
  public.has_staff_role(array['admin', 'manager', 'sales'])
);

drop policy if exists "commercial staff can update orders" on public.orders;
create policy "commercial staff can update orders"
on public.orders
for update
to authenticated
using (
  public.has_staff_role(array['admin', 'manager', 'sales'])
)
with check (
  public.has_staff_role(array['admin', 'manager', 'sales'])
);

commit;

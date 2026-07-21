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

create or replace function public.sync_order_from_delivery(
  target_order_id uuid,
  requested_status text
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_role text;
  current_status text;
  transition_allowed boolean := false;
begin
  select role::text
  into current_role
  from public.profiles
  where id = auth.uid()
    and is_active = true;

  if current_role not in ('admin', 'manager', 'delivery') then
    raise exception 'Tu cuenta no administra entregas.';
  end if;

  if requested_status not in ('ready', 'delivered') then
    raise exception 'Estado de sincronización no permitido.';
  end if;

  select status::text
  into current_status
  from public.orders
  where id = target_order_id
  for update;

  if current_status is null then
    raise exception 'El pedido no existe.';
  end if;

  if current_status = requested_status then
    return;
  end if;

  transition_allowed :=
    (current_status = 'ready' and requested_status = 'delivered')
    or
    (current_status = 'delivered' and requested_status = 'ready');

  if not transition_allowed then
    raise exception 'La transición del pedido no está permitida.';
  end if;

  update public.orders
  set
    status = (
      jsonb_populate_record(
        null::public.orders,
        jsonb_build_object('status', requested_status)
      )
    ).status,
    updated_at = now()
  where id = target_order_id;
end;
$$;

revoke all on function public.sync_order_from_delivery(uuid, text) from public;
grant execute on function public.sync_order_from_delivery(uuid, text) to authenticated;

alter table public.deliveries enable row level security;
alter table public.delivery_events enable row level security;
alter table public.map_locations enable row level security;
alter table public.map_visit_events enable row level security;
alter table public.orders enable row level security;
alter table public.customers enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "delivery roles can read deliveries" on public.deliveries;
create policy "delivery roles can read deliveries"
on public.deliveries
for select
to authenticated
using (
  public.has_staff_role(array['admin', 'manager', 'sales', 'delivery'])
);

drop policy if exists "delivery staff can create deliveries" on public.deliveries;
create policy "delivery staff can create deliveries"
on public.deliveries
for insert
to authenticated
with check (
  public.has_staff_role(array['admin', 'manager', 'delivery'])
);

drop policy if exists "delivery staff can update deliveries" on public.deliveries;
create policy "delivery staff can update deliveries"
on public.deliveries
for update
to authenticated
using (
  public.has_staff_role(array['admin', 'manager', 'delivery'])
)
with check (
  public.has_staff_role(array['admin', 'manager', 'delivery'])
);

drop policy if exists "delivery managers can delete deliveries" on public.deliveries;
create policy "delivery managers can delete deliveries"
on public.deliveries
for delete
to authenticated
using (
  public.has_staff_role(array['admin', 'manager'])
);

drop policy if exists "delivery roles can read events" on public.delivery_events;
create policy "delivery roles can read events"
on public.delivery_events
for select
to authenticated
using (
  public.has_staff_role(array['admin', 'manager', 'sales', 'delivery'])
);

drop policy if exists "delivery staff can create events" on public.delivery_events;
create policy "delivery staff can create events"
on public.delivery_events
for insert
to authenticated
with check (
  public.has_staff_role(array['admin', 'manager', 'delivery'])
);

drop policy if exists "map roles can read locations" on public.map_locations;
create policy "map roles can read locations"
on public.map_locations
for select
to authenticated
using (
  public.has_staff_role(array['admin', 'manager', 'sales', 'delivery'])
);

drop policy if exists "map roles can create locations" on public.map_locations;
create policy "map roles can create locations"
on public.map_locations
for insert
to authenticated
with check (
  public.has_staff_role(array['admin', 'manager', 'sales', 'delivery'])
);

drop policy if exists "map roles can update locations" on public.map_locations;
create policy "map roles can update locations"
on public.map_locations
for update
to authenticated
using (
  public.has_staff_role(array['admin', 'manager', 'sales', 'delivery'])
)
with check (
  public.has_staff_role(array['admin', 'manager', 'sales', 'delivery'])
);

drop policy if exists "map managers can delete locations" on public.map_locations;
create policy "map managers can delete locations"
on public.map_locations
for delete
to authenticated
using (
  public.has_staff_role(array['admin', 'manager'])
);

drop policy if exists "map roles can read visit events" on public.map_visit_events;
create policy "map roles can read visit events"
on public.map_visit_events
for select
to authenticated
using (
  public.has_staff_role(array['admin', 'manager', 'sales', 'delivery'])
);

drop policy if exists "map roles can create visit events" on public.map_visit_events;
create policy "map roles can create visit events"
on public.map_visit_events
for insert
to authenticated
with check (
  public.has_staff_role(array['admin', 'manager', 'sales', 'delivery'])
);

drop policy if exists "delivery roles can read related orders" on public.orders;
create policy "delivery roles can read related orders"
on public.orders
for select
to authenticated
using (
  public.has_staff_role(array['admin', 'manager', 'sales', 'delivery'])
);

drop policy if exists "delivery roles can read related customers" on public.customers;
create policy "delivery roles can read related customers"
on public.customers
for select
to authenticated
using (
  public.has_staff_role(array['admin', 'manager', 'sales', 'delivery'])
);

drop policy if exists "staff can read active team profiles" on public.profiles;
create policy "staff can read active team profiles"
on public.profiles
for select
to authenticated
using (
  is_active = true
  and public.has_staff_role(
    array['admin', 'manager', 'sales', 'production', 'delivery']
  )
);

commit;

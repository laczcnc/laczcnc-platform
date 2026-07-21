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

create or replace function public.sync_order_from_production(
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

  if current_role not in ('admin', 'manager', 'production') then
    raise exception 'Tu cuenta no administra producción.';
  end if;

  if requested_status not in ('production', 'ready', 'cancelled') then
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

  if current_role = 'production' then
    transition_allowed := case current_status
      when 'confirmed' then requested_status = 'production'
      when 'production' then requested_status = 'ready'
      when 'ready' then requested_status = 'production'
      else false
    end;
  else
    transition_allowed := case current_status
      when 'confirmed' then requested_status in ('production', 'cancelled')
      when 'production' then requested_status in ('ready', 'cancelled')
      when 'ready' then requested_status in ('production', 'cancelled')
      else false
    end;
  end if;

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
    cancelled_at = case
      when requested_status = 'cancelled'
        then coalesce(cancelled_at, now())
      else cancelled_at
    end,
    updated_at = now()
  where id = target_order_id;
end;
$$;

revoke all on function public.sync_order_from_production(uuid, text) from public;
grant execute on function public.sync_order_from_production(uuid, text) to authenticated;

alter table public.production_jobs enable row level security;
alter table public.production_stages enable row level security;
alter table public.production_events enable row level security;
alter table public.workshops enable row level security;
alter table public.orders enable row level security;
alter table public.customers enable row level security;

drop policy if exists "production staff can read jobs" on public.production_jobs;
create policy "production staff can read jobs"
on public.production_jobs
for select
to authenticated
using (
  public.has_staff_role(array['admin', 'manager', 'production'])
);

drop policy if exists "production staff can create jobs" on public.production_jobs;
create policy "production staff can create jobs"
on public.production_jobs
for insert
to authenticated
with check (
  public.has_staff_role(array['admin', 'manager', 'production'])
);

drop policy if exists "production staff can update jobs" on public.production_jobs;
create policy "production staff can update jobs"
on public.production_jobs
for update
to authenticated
using (
  public.has_staff_role(array['admin', 'manager', 'production'])
)
with check (
  public.has_staff_role(array['admin', 'manager', 'production'])
);

drop policy if exists "production managers can delete jobs" on public.production_jobs;
create policy "production managers can delete jobs"
on public.production_jobs
for delete
to authenticated
using (
  public.has_staff_role(array['admin', 'manager'])
);

drop policy if exists "production staff can read stages" on public.production_stages;
create policy "production staff can read stages"
on public.production_stages
for select
to authenticated
using (
  public.has_staff_role(array['admin', 'manager', 'production'])
);

drop policy if exists "production staff can create stages" on public.production_stages;
create policy "production staff can create stages"
on public.production_stages
for insert
to authenticated
with check (
  public.has_staff_role(array['admin', 'manager', 'production'])
);

drop policy if exists "production staff can update stages" on public.production_stages;
create policy "production staff can update stages"
on public.production_stages
for update
to authenticated
using (
  public.has_staff_role(array['admin', 'manager', 'production'])
)
with check (
  public.has_staff_role(array['admin', 'manager', 'production'])
);

drop policy if exists "production staff can read events" on public.production_events;
create policy "production staff can read events"
on public.production_events
for select
to authenticated
using (
  public.has_staff_role(array['admin', 'manager', 'production'])
);

drop policy if exists "production staff can create events" on public.production_events;
create policy "production staff can create events"
on public.production_events
for insert
to authenticated
with check (
  public.has_staff_role(array['admin', 'manager', 'production'])
);

drop policy if exists "production staff can read workshops" on public.workshops;
create policy "production staff can read workshops"
on public.workshops
for select
to authenticated
using (
  public.has_staff_role(array['admin', 'manager', 'production'])
);

drop policy if exists "production staff can create workshops" on public.workshops;
create policy "production staff can create workshops"
on public.workshops
for insert
to authenticated
with check (
  public.has_staff_role(array['admin', 'manager', 'production'])
);

drop policy if exists "production staff can update workshops" on public.workshops;
create policy "production staff can update workshops"
on public.workshops
for update
to authenticated
using (
  public.has_staff_role(array['admin', 'manager', 'production'])
)
with check (
  public.has_staff_role(array['admin', 'manager', 'production'])
);

drop policy if exists "production managers can delete workshops" on public.workshops;
create policy "production managers can delete workshops"
on public.workshops
for delete
to authenticated
using (
  public.has_staff_role(array['admin', 'manager'])
);

drop policy if exists "production staff can read related orders" on public.orders;
create policy "production staff can read related orders"
on public.orders
for select
to authenticated
using (
  public.has_staff_role(array['admin', 'manager', 'production'])
);

drop policy if exists "production staff can read related customers" on public.customers;
create policy "production staff can read related customers"
on public.customers
for select
to authenticated
using (
  public.has_staff_role(array['admin', 'manager', 'production'])
);

commit;

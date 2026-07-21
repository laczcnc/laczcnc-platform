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

create or replace function public.change_order_status_staff(
  target_order_id uuid,
  requested_status text
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_order public.orders%rowtype;
  current_role text;
  general_transition_allowed boolean := false;
  role_transition_allowed boolean := false;
begin
  select role::text
  into current_role
  from public.profiles
  where id = auth.uid()
    and is_active = true;

  if current_role is null then
    raise exception 'Cuenta no autorizada.';
  end if;

  select *
  into current_order
  from public.orders
  where id = target_order_id
  for update;

  if not found then
    raise exception 'El pedido no existe.';
  end if;

  general_transition_allowed := case current_order.status::text
    when 'draft' then requested_status in ('confirmed', 'cancelled')
    when 'confirmed' then requested_status in ('draft', 'production', 'cancelled')
    when 'production' then requested_status in ('confirmed', 'ready', 'cancelled')
    when 'ready' then requested_status in ('production', 'delivered', 'cancelled')
    when 'delivered' then requested_status in ('ready', 'completed')
    when 'completed' then requested_status = 'delivered'
    when 'cancelled' then requested_status = 'draft'
    else false
  end;

  if not general_transition_allowed then
    raise exception 'Transición de estado no permitida.';
  end if;

  if current_role in ('admin', 'manager') then
    role_transition_allowed := true;
  elsif current_role = 'sales' then
    role_transition_allowed := case current_order.status::text
      when 'draft' then requested_status in ('confirmed', 'cancelled')
      when 'confirmed' then requested_status in ('draft', 'cancelled')
      when 'delivered' then requested_status = 'completed'
      when 'completed' then requested_status = 'delivered'
      when 'cancelled' then requested_status = 'draft'
      else false
    end;
  elsif current_role = 'production' then
    role_transition_allowed := case current_order.status::text
      when 'confirmed' then requested_status = 'production'
      when 'production' then requested_status in ('confirmed', 'ready')
      when 'ready' then requested_status = 'production'
      else false
    end;
  elsif current_role = 'delivery' then
    role_transition_allowed := case current_order.status::text
      when 'ready' then requested_status = 'delivered'
      when 'delivered' then requested_status = 'ready'
      else false
    end;
  end if;

  if not role_transition_allowed then
    raise exception 'Tu rol no permite realizar este cambio de estado.';
  end if;

  if requested_status = 'confirmed'
     and coalesce(current_order.total_amount, 0) <= 0 then
    raise exception 'Define el total antes de confirmar el pedido.';
  end if;

  if requested_status = 'completed'
     and coalesce(current_order.balance_due, 0) > 0 then
    raise exception 'No se puede completar un pedido con saldo pendiente.';
  end if;

  update public.orders
  set
    status = (
      jsonb_populate_record(
        null::public.orders,
        jsonb_build_object('status', requested_status)
      )
    ).status,
    confirmed_at = case
      when requested_status = 'confirmed'
        then coalesce(confirmed_at, now())
      else confirmed_at
    end,
    completed_at = case
      when requested_status = 'completed'
        then coalesce(completed_at, now())
      else completed_at
    end,
    cancelled_at = case
      when requested_status = 'cancelled'
        then coalesce(cancelled_at, now())
      else cancelled_at
    end,
    updated_at = now()
  where id = target_order_id;
end;
$$;

revoke all on function public.change_order_status_staff(uuid, text) from public;
grant execute on function public.change_order_status_staff(uuid, text) to authenticated;

alter table public.orders enable row level security;
alter table public.order_payments enable row level security;
alter table public.order_status_history enable row level security;
alter table public.customers enable row level security;

drop policy if exists "staff can read orders" on public.orders;
create policy "staff can read orders"
on public.orders
for select
to authenticated
using (
  public.has_staff_role(
    array['admin', 'manager', 'sales', 'production', 'delivery']
  )
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

drop policy if exists "commercial staff can read payments" on public.order_payments;
create policy "commercial staff can read payments"
on public.order_payments
for select
to authenticated
using (
  public.has_staff_role(array['admin', 'manager', 'sales'])
);

drop policy if exists "commercial staff can create payments" on public.order_payments;
create policy "commercial staff can create payments"
on public.order_payments
for insert
to authenticated
with check (
  public.has_staff_role(array['admin', 'manager', 'sales'])
);

drop policy if exists "commercial managers can delete payments" on public.order_payments;
create policy "commercial managers can delete payments"
on public.order_payments
for delete
to authenticated
using (
  public.has_staff_role(array['admin', 'manager'])
);

drop policy if exists "staff can read order history" on public.order_status_history;
create policy "staff can read order history"
on public.order_status_history
for select
to authenticated
using (
  public.has_staff_role(
    array['admin', 'manager', 'sales', 'production', 'delivery']
  )
);

drop policy if exists "operational staff can read customers" on public.customers;
create policy "operational staff can read customers"
on public.customers
for select
to authenticated
using (
  public.has_staff_role(
    array['admin', 'manager', 'sales', 'production', 'delivery']
  )
);

commit;

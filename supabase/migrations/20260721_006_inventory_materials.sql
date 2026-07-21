begin;

create extension if not exists pgcrypto;

create table if not exists public.inventory_materials (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  category text,
  unit text not null default 'unidad',
  current_stock numeric(14, 3) not null default 0,
  minimum_stock numeric(14, 3) not null default 0,
  unit_cost numeric(14, 2),
  supplier_name text,
  supplier_phone text,
  location text,
  notes text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_materials_sku_length
    check (char_length(trim(sku)) between 1 and 60),
  constraint inventory_materials_name_length
    check (char_length(trim(name)) between 2 and 180),
  constraint inventory_materials_stock_nonnegative
    check (current_stock >= 0),
  constraint inventory_materials_minimum_nonnegative
    check (minimum_stock >= 0),
  constraint inventory_materials_cost_nonnegative
    check (unit_cost is null or unit_cost >= 0)
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null
    references public.inventory_materials(id)
    on delete restrict,
  movement_type text not null,
  quantity numeric(14, 3) not null,
  previous_stock numeric(14, 3) not null,
  new_stock numeric(14, 3) not null,
  reason text not null,
  reference text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint inventory_movements_type_valid
    check (movement_type in ('entry', 'exit', 'set')),
  constraint inventory_movements_quantity_positive
    check (quantity > 0),
  constraint inventory_movements_stock_nonnegative
    check (previous_stock >= 0 and new_stock >= 0),
  constraint inventory_movements_reason_length
    check (char_length(trim(reason)) between 2 and 300)
);

create index if not exists inventory_materials_name_idx
  on public.inventory_materials(name);

create index if not exists inventory_materials_category_idx
  on public.inventory_materials(category);

create index if not exists inventory_materials_active_idx
  on public.inventory_materials(is_active);

create index if not exists inventory_movements_material_date_idx
  on public.inventory_movements(material_id, created_at desc);

create or replace function public.set_inventory_material_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists inventory_materials_set_updated_at
on public.inventory_materials;

create trigger inventory_materials_set_updated_at
before update on public.inventory_materials
for each row
execute function public.set_inventory_material_updated_at();

create or replace function public.protect_inventory_stock()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.current_stock is distinct from old.current_stock
    and coalesce(
      current_setting(
        'app.inventory_movement',
        true
      ),
      ''
    ) <> 'allowed'
  then
    raise exception 'inventory_stock_requires_movement';
  end if;

  return new;
end;
$$;

drop trigger if exists inventory_materials_protect_stock
on public.inventory_materials;

create trigger inventory_materials_protect_stock
before update on public.inventory_materials
for each row
execute function public.protect_inventory_stock();

create or replace function public.log_initial_inventory_stock()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new.current_stock > 0 then
    insert into public.inventory_movements (
      material_id,
      movement_type,
      quantity,
      previous_stock,
      new_stock,
      reason,
      reference,
      created_by
    )
    values (
      new.id,
      'entry',
      new.current_stock,
      0,
      new.current_stock,
      'Stock inicial',
      'ALTA-MATERIAL',
      new.created_by
    );
  end if;

  return new;
end;
$$;

drop trigger if exists inventory_materials_log_initial_stock
on public.inventory_materials;

create trigger inventory_materials_log_initial_stock
after insert on public.inventory_materials
for each row
execute function public.log_initial_inventory_stock();

create or replace function public.register_inventory_movement(
  target_material_id uuid,
  requested_type text,
  requested_quantity numeric,
  movement_reason text,
  movement_reference text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_role text;
  current_material public.inventory_materials%rowtype;
  calculated_stock numeric(14, 3);
  movement_quantity numeric(14, 3);
  created_movement_id uuid;
begin
  select role::text
  into current_role
  from public.profiles
  where id = auth.uid()
    and is_active = true;

  if current_role is null
    or current_role not in ('admin', 'manager', 'production')
  then
    raise exception 'inventory_permission_denied';
  end if;

  if requested_type not in ('entry', 'exit', 'set') then
    raise exception 'invalid_movement_type';
  end if;

  if requested_quantity is null or requested_quantity < 0 then
    raise exception 'invalid_movement_quantity';
  end if;

  if requested_type in ('entry', 'exit')
    and requested_quantity <= 0
  then
    raise exception 'invalid_movement_quantity';
  end if;

  if movement_reason is null
    or char_length(trim(movement_reason)) < 2
    or char_length(trim(movement_reason)) > 300
  then
    raise exception 'invalid_movement_reason';
  end if;

  select *
  into current_material
  from public.inventory_materials
  where id = target_material_id
  for update;

  if not found then
    raise exception 'inventory_material_not_found';
  end if;

  if current_material.is_active is not true then
    raise exception 'inventory_material_inactive';
  end if;

  if requested_type = 'entry' then
    calculated_stock =
      current_material.current_stock + requested_quantity;
    movement_quantity = requested_quantity;
  elsif requested_type = 'exit' then
    if requested_quantity > current_material.current_stock then
      raise exception 'insufficient_inventory_stock';
    end if;

    calculated_stock =
      current_material.current_stock - requested_quantity;
    movement_quantity = requested_quantity;
  else
    calculated_stock = requested_quantity;
    movement_quantity = abs(
      requested_quantity - current_material.current_stock
    );

    if movement_quantity = 0 then
      raise exception 'inventory_stock_unchanged';
    end if;
  end if;

  perform set_config(
    'app.inventory_movement',
    'allowed',
    true
  );

  update public.inventory_materials
  set current_stock = calculated_stock
  where id = target_material_id;

  insert into public.inventory_movements (
    material_id,
    movement_type,
    quantity,
    previous_stock,
    new_stock,
    reason,
    reference,
    created_by
  )
  values (
    target_material_id,
    requested_type,
    movement_quantity,
    current_material.current_stock,
    calculated_stock,
    trim(movement_reason),
    nullif(trim(coalesce(movement_reference, '')), ''),
    auth.uid()
  )
  returning id into created_movement_id;

  return created_movement_id;
end;
$$;

revoke all on function public.register_inventory_movement(
  uuid,
  text,
  numeric,
  text,
  text
) from public;

grant execute on function public.register_inventory_movement(
  uuid,
  text,
  numeric,
  text,
  text
) to authenticated;

alter table public.inventory_materials enable row level security;
alter table public.inventory_movements enable row level security;

drop policy if exists "inventory staff can read materials"
on public.inventory_materials;

create policy "inventory staff can read materials"
on public.inventory_materials
for select
to authenticated
using (
  public.has_staff_role(
    array['admin', 'manager', 'production']
  )
);

drop policy if exists "inventory staff can create materials"
on public.inventory_materials;

create policy "inventory staff can create materials"
on public.inventory_materials
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.has_staff_role(
    array['admin', 'manager', 'production']
  )
);

drop policy if exists "inventory staff can update materials"
on public.inventory_materials;

create policy "inventory staff can update materials"
on public.inventory_materials
for update
to authenticated
using (
  public.has_staff_role(
    array['admin', 'manager', 'production']
  )
)
with check (
  public.has_staff_role(
    array['admin', 'manager', 'production']
  )
);

drop policy if exists "inventory staff can read movements"
on public.inventory_movements;

create policy "inventory staff can read movements"
on public.inventory_movements
for select
to authenticated
using (
  public.has_staff_role(
    array['admin', 'manager', 'production']
  )
);

commit;

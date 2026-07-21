-- LaczCnC: diagnóstico de tablas, RLS, funciones, políticas y almacenamiento.
-- Es una consulta de solo lectura. Puede ejecutarse completa en Supabase SQL Editor.

select
  current_database() as database_name,
  current_user as executed_as,
  now() as checked_at;

with expected_tables(table_name) as (
  values
    ('profiles'),
    ('business_settings'),
    ('quote_requests'),
    ('customers'),
    ('orders'),
    ('order_status_history'),
    ('order_payments'),
    ('product_categories'),
    ('products'),
    ('product_images'),
    ('gallery_items'),
    ('workshops'),
    ('production_stages'),
    ('production_jobs'),
    ('production_events'),
    ('inventory_materials'),
    ('inventory_movements'),
    ('deliveries'),
    ('delivery_events'),
    ('map_locations'),
    ('map_visit_events')
)
select
  table_name,
  case
    when to_regclass('public.' || table_name) is not null
      then 'OK'
    else 'FALTA'
  end as status
from expected_tables
order by table_name;

with expected_functions(function_signature) as (
  values
    ('public.has_staff_role(text[])'),
    ('public.change_order_status_staff(uuid,text)'),
    ('public.sync_order_from_production(uuid,text)'),
    ('public.sync_order_from_delivery(uuid,text)'),
    ('public.register_inventory_movement(uuid,text,numeric,text,text)')
)
select
  function_signature,
  case
    when to_regprocedure(function_signature) is not null
      then 'OK'
    else 'FALTA'
  end as status
from expected_functions
order by function_signature;

select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  count(p.policyname) as policy_count
from pg_class c
join pg_namespace n
  on n.oid = c.relnamespace
left join pg_policies p
  on p.schemaname = n.nspname
  and p.tablename = c.relname
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'profiles',
    'business_settings',
    'quote_requests',
    'customers',
    'orders',
    'order_status_history',
    'order_payments',
    'product_categories',
    'products',
    'product_images',
    'gallery_items',
    'workshops',
    'production_stages',
    'production_jobs',
    'production_events',
    'inventory_materials',
    'inventory_movements',
    'deliveries',
    'delivery_events',
    'map_locations',
    'map_visit_events'
  )
group by c.relname, c.relrowsecurity
order by c.relname;

select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
from pg_policies
where schemaname in ('public', 'storage')
  and tablename in (
    'profiles',
    'business_settings',
    'quote_requests',
    'customers',
    'orders',
    'order_status_history',
    'order_payments',
    'product_categories',
    'products',
    'product_images',
    'gallery_items',
    'workshops',
    'production_stages',
    'production_jobs',
    'production_events',
    'inventory_materials',
    'inventory_movements',
    'deliveries',
    'delivery_events',
    'map_locations',
    'map_visit_events',
    'objects'
  )
order by schemaname, tablename, policyname;

select
  role::text as role,
  is_active,
  count(*) as users
from public.profiles
group by role::text, is_active
order by role::text, is_active desc;

select
  id,
  name,
  public
from storage.buckets
where id = 'product-images';

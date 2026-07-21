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

alter table public.products enable row level security;
alter table public.product_categories enable row level security;
alter table public.product_images enable row level security;
alter table public.gallery_items enable row level security;

drop policy if exists "staff can read catalog products" on public.products;
create policy "staff can read catalog products"
on public.products
for select
to authenticated
using (
  public.has_staff_role(
    array['admin', 'manager', 'sales', 'production']
  )
);

drop policy if exists "catalog managers can create products" on public.products;
create policy "catalog managers can create products"
on public.products
for insert
to authenticated
with check (
  public.has_staff_role(array['admin', 'manager'])
);

drop policy if exists "catalog managers can update products" on public.products;
create policy "catalog managers can update products"
on public.products
for update
to authenticated
using (
  public.has_staff_role(array['admin', 'manager'])
)
with check (
  public.has_staff_role(array['admin', 'manager'])
);

drop policy if exists "catalog managers can delete products" on public.products;
create policy "catalog managers can delete products"
on public.products
for delete
to authenticated
using (
  public.has_staff_role(array['admin', 'manager'])
);

drop policy if exists "staff can read product categories" on public.product_categories;
create policy "staff can read product categories"
on public.product_categories
for select
to authenticated
using (
  public.has_staff_role(
    array['admin', 'manager', 'sales', 'production']
  )
);

drop policy if exists "catalog managers can create categories" on public.product_categories;
create policy "catalog managers can create categories"
on public.product_categories
for insert
to authenticated
with check (
  public.has_staff_role(array['admin', 'manager'])
);

drop policy if exists "catalog managers can update categories" on public.product_categories;
create policy "catalog managers can update categories"
on public.product_categories
for update
to authenticated
using (
  public.has_staff_role(array['admin', 'manager'])
)
with check (
  public.has_staff_role(array['admin', 'manager'])
);

drop policy if exists "catalog managers can delete categories" on public.product_categories;
create policy "catalog managers can delete categories"
on public.product_categories
for delete
to authenticated
using (
  public.has_staff_role(array['admin', 'manager'])
);

drop policy if exists "staff can read product images" on public.product_images;
create policy "staff can read product images"
on public.product_images
for select
to authenticated
using (
  public.has_staff_role(
    array['admin', 'manager', 'sales', 'production']
  )
);

drop policy if exists "catalog managers can create product images" on public.product_images;
create policy "catalog managers can create product images"
on public.product_images
for insert
to authenticated
with check (
  public.has_staff_role(array['admin', 'manager'])
);

drop policy if exists "catalog managers can update product images" on public.product_images;
create policy "catalog managers can update product images"
on public.product_images
for update
to authenticated
using (
  public.has_staff_role(array['admin', 'manager'])
)
with check (
  public.has_staff_role(array['admin', 'manager'])
);

drop policy if exists "catalog managers can delete product images" on public.product_images;
create policy "catalog managers can delete product images"
on public.product_images
for delete
to authenticated
using (
  public.has_staff_role(array['admin', 'manager'])
);

drop policy if exists "gallery staff can read gallery items" on public.gallery_items;
create policy "gallery staff can read gallery items"
on public.gallery_items
for select
to authenticated
using (
  public.has_staff_role(array['admin', 'manager', 'sales'])
);

drop policy if exists "gallery staff can create gallery items" on public.gallery_items;
create policy "gallery staff can create gallery items"
on public.gallery_items
for insert
to authenticated
with check (
  public.has_staff_role(array['admin', 'manager', 'sales'])
);

drop policy if exists "gallery staff can update gallery items" on public.gallery_items;
create policy "gallery staff can update gallery items"
on public.gallery_items
for update
to authenticated
using (
  public.has_staff_role(array['admin', 'manager', 'sales'])
)
with check (
  public.has_staff_role(array['admin', 'manager', 'sales'])
);

drop policy if exists "gallery staff can delete gallery items" on public.gallery_items;
create policy "gallery staff can delete gallery items"
on public.gallery_items
for delete
to authenticated
using (
  public.has_staff_role(array['admin', 'manager', 'sales'])
);

drop policy if exists "catalog managers can upload product media" on storage.objects;
create policy "catalog managers can upload product media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and public.has_staff_role(array['admin', 'manager'])
);

drop policy if exists "catalog managers can update product media" on storage.objects;
create policy "catalog managers can update product media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and public.has_staff_role(array['admin', 'manager'])
)
with check (
  bucket_id = 'product-images'
  and public.has_staff_role(array['admin', 'manager'])
);

drop policy if exists "catalog managers can delete product media" on storage.objects;
create policy "catalog managers can delete product media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and public.has_staff_role(array['admin', 'manager'])
);

drop policy if exists "sales can upload gallery media" on storage.objects;
create policy "sales can upload gallery media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[2] = 'gallery'
  and public.has_staff_role(array['sales'])
);

drop policy if exists "sales can update gallery media" on storage.objects;
create policy "sales can update gallery media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[2] = 'gallery'
  and public.has_staff_role(array['sales'])
)
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[2] = 'gallery'
  and public.has_staff_role(array['sales'])
);

drop policy if exists "sales can delete gallery media" on storage.objects;
create policy "sales can delete gallery media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[2] = 'gallery'
  and public.has_staff_role(array['sales'])
);

commit;

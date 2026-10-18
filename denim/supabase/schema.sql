-- Run this once in Supabase: SQL Editor -> New query -> paste -> Run

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric not null,
  mrp numeric,
  category text not null default 'Other',
  description text default '',
  sizes text[] not null default '{}',
  images text[] not null default '{}',
  in_stock boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists visit_requests (
  id uuid primary key,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  size text not null,
  customer_name text not null,
  mobile text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table products enable row level security;
alter table visit_requests enable row level security;

-- customers (anonymous) can read products and send a visit request
create policy "public read products" on products for select using (true);
create policy "public send visit request" on visit_requests for insert to anon, authenticated with check (true);

-- only the logged-in admin can change products and read/manage visit requests
create policy "admin write products" on products for all to authenticated using (true) with check (true);
create policy "admin manage visit requests" on visit_requests for all to authenticated using (true) with check (true);

-- live notifications for the admin
alter publication supabase_realtime add table visit_requests;

-- product photo storage
insert into storage.buckets (id, name, public) values ('products', 'products', true) on conflict do nothing;
create policy "public read product photos" on storage.objects for select using (bucket_id = 'products');
create policy "admin upload product photos" on storage.objects for insert to authenticated with check (bucket_id = 'products');
create policy "admin delete product photos" on storage.objects for delete to authenticated using (bucket_id = 'products');

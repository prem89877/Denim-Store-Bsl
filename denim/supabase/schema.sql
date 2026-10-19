-- Denim: full database setup. Safe to run again (also upgrades the first version).
-- Supabase -> SQL Editor -> New query -> paste all -> Run

-- ============ TABLES ============
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric not null,
  mrp numeric,
  category text not null default 'Other',
  description text default '',
  sizes text[] not null default '{}',
  images text[] not null default '{}',
  in_stock boolean not null default true,          -- old column, no longer used
  created_at timestamptz not null default now()
);
alter table products add column if not exists stock_status text not null default 'in_stock';
alter table products add column if not exists colours jsonb not null default '[]';
alter table products add column if not exists size_prices jsonb not null default '{}';

alter table products drop constraint if exists products_stock_status_chk;
alter table products add constraint products_stock_status_chk
  check (stock_status in ('in_stock', 'low_stock', 'out_of_stock'));
-- every product: minimum 1, maximum 5 photos (old rows are not re-checked)
alter table products drop constraint if exists products_images_1_5;
alter table products add constraint products_images_1_5
  check (cardinality(images) between 1 and 5) not valid;

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
alter table visit_requests add column if not exists colour text not null default '';
alter table visit_requests add column if not exists notified boolean not null default false;

-- admin phones/browsers that receive push notifications
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid(),
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- customer devices that allowed shop notifications (never mixed with admin devices)
create table if not exists customer_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- ============ ADMINS (only created from SQL) ============
create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table admins enable row level security;   -- no policies: nobody can read/write it through the API

create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- Make a NEW admin login (email + password):   select create_admin('owner@example.com', 'StrongPassword123');
create or replace function public.create_admin(p_email text, p_password text) returns uuid
language plpgsql security definer set search_path = public, extensions, auth as $$
declare
  uid uuid;
  mail text := lower(trim(p_email));
begin
  select id into uid from auth.users where email = mail;
  if uid is null then
    uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', mail,
      crypt(p_password, gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
    );
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), uid, uid::text,
      jsonb_build_object('sub', uid::text, 'email', mail, 'email_verified', true),
      'email', now(), now(), now());
  end if;
  insert into public.admins (user_id) values (uid) on conflict do nothing;
  return uid;
end $$;

-- Make an EXISTING Supabase user an admin:     select make_admin('owner@example.com');
create or replace function public.make_admin(p_email text) returns void
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid;
begin
  select id into uid from auth.users where email = lower(trim(p_email));
  if uid is null then raise exception 'No user with email %', p_email; end if;
  insert into public.admins (user_id) values (uid) on conflict do nothing;
end $$;

-- Remove admin rights:                         select remove_admin('owner@example.com');
create or replace function public.remove_admin(p_email text) returns void
language sql security definer set search_path = public, auth as $$
  delete from public.admins where user_id in (select id from auth.users where email = lower(trim(p_email)));
$$;

-- these three can only be run from the SQL Editor, never from the website
revoke all on function public.create_admin(text, text) from public, anon, authenticated;
revoke all on function public.make_admin(text) from public, anon, authenticated;
revoke all on function public.remove_admin(text) from public, anon, authenticated;

-- ============ SECURITY RULES ============
alter table products enable row level security;
alter table visit_requests enable row level security;
alter table push_subscriptions enable row level security;
alter table customer_push_subscriptions enable row level security;

drop policy if exists "public read products" on products;
drop policy if exists "admin write products" on products;
drop policy if exists "public send visit request" on visit_requests;
drop policy if exists "admin manage visit requests" on visit_requests;
drop policy if exists "admin manage push" on push_subscriptions;
drop policy if exists "customer add push" on customer_push_subscriptions;
drop policy if exists "admin read customer push" on customer_push_subscriptions;

create policy "public read products" on products for select using (true);
create policy "admin write products" on products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- customers (not logged in) can only add a new request, nothing else
create policy "public send visit request" on visit_requests for insert to anon, authenticated
  with check (status = 'new' and notified = false);
create policy "admin manage visit requests" on visit_requests for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "admin manage push" on push_subscriptions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "customer add push" on customer_push_subscriptions for insert to anon, authenticated with check (true);
create policy "admin read customer push" on customer_push_subscriptions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ============ TABLE PERMISSIONS (needed on new Supabase projects) ============
grant usage on schema public to anon, authenticated;
grant select on products to anon, authenticated;
grant insert, update, delete on products to authenticated;
grant insert on visit_requests to anon;
grant select, insert, update, delete on visit_requests to authenticated;
grant select, insert, update, delete on push_subscriptions to authenticated;
grant insert on customer_push_subscriptions to anon;
grant select, insert, update, delete on customer_push_subscriptions to authenticated;

-- ============ LIVE ALERTS + PHOTO STORAGE ============
do $$ begin
  alter publication supabase_realtime add table visit_requests;
exception when duplicate_object then null;
end $$;

insert into storage.buckets (id, name, public) values ('products', 'products', true) on conflict do nothing;
drop policy if exists "public read product photos" on storage.objects;
drop policy if exists "admin upload product photos" on storage.objects;
drop policy if exists "admin delete product photos" on storage.objects;
create policy "public read product photos" on storage.objects for select using (bucket_id = 'products');
create policy "admin upload product photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'products' and public.is_admin());
create policy "admin delete product photos" on storage.objects for delete to authenticated
  using (bucket_id = 'products' and public.is_admin());

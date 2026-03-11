-- ============================================================
-- POS App — Supabase Migration
-- Run this in your Supabase project: SQL Editor → New Query
-- ============================================================

-- ─── Categories ─────────────────────────────────────────────
create table if not exists categories (
    id   bigint generated always as identity primary key,
    name text not null unique
);

insert into categories (name) values
    ('Water'),
    ('Container'),
    ('Accessory')
on conflict (name) do nothing;


-- ─── Products ───────────────────────────────────────────────
create table if not exists products (
    id          bigint generated always as identity primary key,
    name        text    not null,
    price       numeric not null default 0,
    stock       integer not null default 0,
    category    text    not null default 'Water',
    type        text    not null default 'refill', -- 'refill' | 'item'
    show_in_pos boolean not null default true,
    created_at  timestamptz default now()
);

insert into products (name, price, stock, category, type, show_in_pos) values
    ('Alkaline Water (Refill)',        35,  1000, 'Water',     'refill', true),
    ('Mineral Water (Refill)',         25,  1000, 'Water',     'refill', true),
    ('Round Slim Container (Empty)',  250,    50, 'Container', 'item',   true),
    ('Dispenser Tap',                 150,    30, 'Accessory', 'item',   true);


-- ─── Customers ──────────────────────────────────────────────
create table if not exists customers (
    id              bigint generated always as identity primary key,
    name            text not null,
    mobile          text,
    address         text,
    registered_at   timestamptz default now()
);


-- ─── Riders ─────────────────────────────────────────────────
create table if not exists riders (
    id         bigint generated always as identity primary key,
    name       text not null,
    contact    text,
    status     text not null default 'Active', -- 'Active' | 'Inactive'
    created_at timestamptz default now()
);


-- ─── Sales ──────────────────────────────────────────────────
create table if not exists sales (
    id             bigint generated always as identity primary key,
    customer_name  text    not null default 'Walk-in',
    total          numeric not null default 0,
    payment_method text    not null default 'Cash',
    jug_status     text    not null default 'none', -- 'none' | 'owned' | 'borrowed'
    is_delivery    boolean not null default false,
    created_at     timestamptz default now(),
    jug_returned   boolean not null default false,
    jug_returned_at timestamptz
);

-- Ensure columns exist even if the table was already created previously
alter table sales add column if not exists jug_returned boolean not null default false;
alter table sales add column if not exists jug_returned_at timestamptz;

-- Customer menu visibility
alter table products add column if not exists show_in_customer boolean not null default true;

-- Online order acknowledgement (admin marks order as done)
alter table sales add column if not exists acknowledged boolean not null default false;

-- GCash number shown on customer ordering page
alter table app_settings add column if not exists gcash_number text not null default '';

-- Admin UI font size preference
alter table app_settings add column if not exists font_size text not null default 'default';

-- Realtime setup for online orders
alter table sales add column if not exists notified boolean not null default false;

-- Order source: 'pos' for staff-placed orders, 'online' for customer-placed orders
alter table sales add column if not exists source text not null default 'pos';

-- Enable Realtime for relevant tables
begin;
  -- Remove existing publication to recreate it properly
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table sales, sale_items, deliveries;
commit;


-- ─── System Settings ────────────────────────────────────────
create table if not exists app_settings (
    id             integer primary key,
    admin_password text not null
);

insert into app_settings (id, admin_password) values
    (1, 'admin123')
on conflict (id) do nothing;


-- ─── Sale Items (line items per sale) ───────────────────────
create table if not exists sale_items (
    id           bigint generated always as identity primary key,
    sale_id      bigint references sales(id) on delete cascade,
    product_id   bigint references products(id) on delete set null,
    product_name text    not null,
    price        numeric not null,
    quantity     integer not null default 1
);


-- ─── Deliveries ─────────────────────────────────────────────
create table if not exists deliveries (
    id            bigint generated always as identity primary key,
    sale_id       bigint references sales(id) on delete set null,
    customer_name text not null default 'Guest',
    address       text not null default 'N/A',
    rider         text not null default 'Unassigned',
    status        text not null default 'Pending', -- 'Pending' | 'Delivered' | 'Canceled'
    created_at    timestamptz default now()
);


-- ─── Row Level Security (RLS) ───────────────────────────────
-- Enable RLS on all tables (required for anon key access with permissive policies)
alter table categories   enable row level security;
alter table products     enable row level security;
alter table customers    enable row level security;
alter table riders       enable row level security;
alter table sales        enable row level security;
alter table sale_items   enable row level security;
alter table deliveries   enable row level security;

-- Permissive policy: allow all operations for now (tighten later with auth)
drop policy if exists "Allow all for anon" on categories;
drop policy if exists "Allow all for anon" on products;
drop policy if exists "Allow all for anon" on customers;
drop policy if exists "Allow all for anon" on riders;
drop policy if exists "Allow all for anon" on sales;
drop policy if exists "Allow all for anon" on sale_items;
drop policy if exists "Allow all for anon" on deliveries;

create policy "Allow all for anon" on categories   for all using (true) with check (true);
create policy "Allow all for anon" on products     for all using (true) with check (true);
create policy "Allow all for anon" on customers    for all using (true) with check (true);
create policy "Allow all for anon" on riders       for all using (true) with check (true);
create policy "Allow all for anon" on sales        for all using (true) with check (true);
create policy "Allow all for anon" on sale_items   for all using (true) with check (true);
create policy "Allow all for anon" on deliveries   for all using (true) with check (true);

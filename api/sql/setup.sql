-- Supabase schema for Farq analytics & caching

create table if not exists compare_requests (
  id bigserial primary key,
  latitude double precision,
  longitude double precision,
  max_chefs int,
  page int,
  position int,
  query text,
  processed_at timestamptz default now(),
  expires_at timestamptz,
  response jsonb
);
create index if not exists compare_requests_processed_idx on compare_requests (processed_at desc);

create table if not exists restaurants_cache (
  id bigserial primary key,
  restaurant_id bigint unique,
  name text,
  data jsonb,
  created_at timestamptz default now(),
  expires_at timestamptz
);
create index if not exists restaurants_cache_expires_idx on restaurants_cache (expires_at);

create table if not exists delivery_options_cache (
  id bigserial primary key,
  restaurant_id bigint unique,
  delivery_options jsonb,
  created_at timestamptz default now(),
  expires_at timestamptz
);
create index if not exists delivery_options_cache_expires_idx on delivery_options_cache (expires_at);

create table if not exists pricing_snapshots (
  id bigserial primary key,
  ts timestamptz default now(),
  restaurant_id bigint,
  restaurant_name text,
  app text,
  price numeric,
  original_price numeric,
  is_free bool,
  has_offer bool,
  has_prime bool,
  delivery_time text,
  city text,
  raw jsonb
);
create index if not exists pricing_snapshots_ts_idx on pricing_snapshots (ts desc);
create index if not exists pricing_snapshots_restaurant_idx on pricing_snapshots (restaurant_id, ts desc);

create table if not exists events (
  id bigserial primary key,
  ts timestamptz default now(),
  event text,
  props jsonb
);
create index if not exists events_ts_idx on events (ts desc);

create materialized view if not exists app_price_wins_daily as
select date_trunc('day', ts) as day, app, count(*) as wins
from (
  select *, row_number() over (partition by restaurant_id, date_trunc('day', ts) order by price) as rn
  from pricing_snapshots
) s
where rn = 1
group by 1,2;

create materialized view if not exists savings_daily as
select date_trunc('day', ts) as day,
  avg(avg_price - price) as avg_savings,
  percentile_cont(0.5) within group (order by avg_price - price) as median_savings
from (
  select ts, restaurant_id, avg(price) over (partition by restaurant_id, date_trunc('day', ts)) as avg_price,
    min(price) over (partition by restaurant_id, date_trunc('day', ts)) as price
  from pricing_snapshots
) s
group by 1;

-- Suggested RLS hints:
-- alter table compare_requests enable row level security;
-- create policy "service role insert" on compare_requests for all using (auth.role() = 'service_role');

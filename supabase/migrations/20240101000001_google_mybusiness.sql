-- Google My Business integration schema

create table if not exists google_connections (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  access_token text not null,
  refresh_token text,
  token_expiry timestamptz,
  gmb_account_id text,
  gmb_location_id text,
  connected_at timestamptz default now()
);

alter table google_connections enable row level security;

create policy "Users manage own connections"
  on google_connections for all
  using (auth.uid() = user_id);

-- Add GMB columns to businesses
alter table businesses add column if not exists gmb_account_id text;
alter table businesses add column if not exists gmb_location_id text;
alter table businesses add column if not exists google_connected boolean default false;

-- Add reply tracking to reviews
alter table reviews add column if not exists gmb_review_id text;
alter table reviews add column if not exists reply_posted_to_google boolean default false;
alter table reviews add column if not exists reply_posted_at timestamptz;

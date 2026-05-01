create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  username text not null unique,
  full_name text,
  phone text unique,
  city text,
  avatar_url text,
  phone_verified boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('contact', 'rating')),
  name_snapshot text,
  email_snapshot text,
  subject text,
  message text not null,
  rating text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  owner_name text not null,
  owner_username text,
  owner_phone text,
  owner_avatar_url text,
  title text not null,
  brand text not null,
  model text not null,
  cc text,
  year text,
  km text,
  price text,
  city text not null,
  plate_masked text,
  description text,
  photos jsonb not null default '[]'::jsonb,
  cover_photo_index integer not null default 0,
  status text not null default 'published' check (status in ('published', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.message_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  sender_name text not null,
  recipient_name text not null,
  listing_title text not null,
  note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint message_requests_listing_id_sender_id_recipient_id_key unique (listing_id, sender_id, recipient_id),
  constraint message_requests_not_self check (sender_id <> recipient_id)
);

alter table public.profiles
  add column if not exists role text not null default 'user' check (role in ('user', 'admin', 'suspended')),
  add column if not exists seller_bio text,
  add column if not exists last_seen_at timestamptz not null default timezone('utc', now()),
  add column if not exists is_verified_seller boolean not null default false,
  add column if not exists seller_verified_at timestamptz,
  add column if not exists seller_verified_by_admin boolean not null default false;

alter table public.listings
  add column if not exists owner_is_verified_seller boolean not null default false;

create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  blocked_name text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  constraint user_blocks_unique_pair unique (blocker_id, blocked_id),
  constraint user_blocks_not_self check (blocker_id <> blocked_id)
);

create table if not exists public.listing_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  listing_owner_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('Sahte ilan', 'Yanlis bilgi', 'Dolandiricilik supesi', 'Uygunsuz icerik', 'Yanlis fiyat', 'Diger')),
  details text,
  status text not null default 'open' check (status in ('open', 'dismissed', 'listing_removed', 'reviewed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint listing_reports_unique_reporter unique (listing_id, reporter_id)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    username,
    full_name,
    phone,
    avatar_url,
    role
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'username', new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'username'),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    nullif(coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'), ''),
    case
      when lower(coalesce(new.email, '')) = 'destekp1yasamoto@gmail.com' then 'admin'
      else 'user'
    end
  )
  on conflict (id) do update
  set
    email = excluded.email,
    username = excluded.username,
    full_name = excluded.full_name,
    phone = coalesce(excluded.phone, public.profiles.phone),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    role = case
      when lower(coalesce(excluded.email, '')) = 'destekp1yasamoto@gmail.com' then 'admin'
      else public.profiles.role
    end,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

update public.profiles
set role = 'admin'
where lower(email) = 'destekp1yasamoto@gmail.com';

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.touch_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.touch_generic_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.resolve_login_email(identifier_input text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_identifier text := lower(trim(identifier_input));
  normalized_phone text := regexp_replace(coalesce(identifier_input, ''), '[^0-9+]', '', 'g');
  resolved_email text;
begin
  if normalized_identifier is null or normalized_identifier = '' then
    return null;
  end if;

  select p.email
  into resolved_email
  from public.profiles p
  where lower(p.username) = normalized_identifier
     or (
       normalized_phone <> ''
       and coalesce(p.phone, '') = normalized_phone
     )
  order by p.updated_at desc nulls last, p.created_at desc
  limit 1;

  return resolved_email;
end;
$$;

grant execute on function public.resolve_login_email(text) to anon, authenticated;

create or replace function public.touch_last_seen(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set last_seen_at = timezone('utc', now())
  where id = target_user_id;
end;
$$;

grant execute on function public.touch_last_seen(uuid) to authenticated;

create or replace function public.refresh_verified_seller(target_user_id uuid)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  email_verified boolean := false;
  has_active_listing boolean := false;
  profile_complete boolean := false;
  refreshed_profile public.profiles;
begin
  select (au.email_confirmed_at is not null)
  into email_verified
  from auth.users au
  where au.id = target_user_id;

  select exists(
    select 1
    from public.listings l
    where l.owner_id = target_user_id
      and l.status = 'published'
  )
  into has_active_listing;

  select
    coalesce(nullif(trim(p.username), ''), null) is not null
    and coalesce(nullif(trim(coalesce(p.city, '')), ''), null) is not null
  into profile_complete
  from public.profiles p
  where p.id = target_user_id;

  update public.profiles p
  set
    is_verified_seller = case
      when p.seller_verified_by_admin then true
      when (coalesce(email_verified, false) or coalesce(p.phone_verified, false))
        and coalesce(profile_complete, false)
        and coalesce(has_active_listing, false)
        then true
      else false
    end,
    seller_verified_at = case
      when p.seller_verified_by_admin
        or ((coalesce(email_verified, false) or coalesce(p.phone_verified, false))
          and coalesce(profile_complete, false)
          and coalesce(has_active_listing, false))
        then coalesce(p.seller_verified_at, timezone('utc', now()))
      else null
    end
  where p.id = target_user_id
  returning * into refreshed_profile;

  update public.listings
  set owner_is_verified_seller = coalesce(refreshed_profile.is_verified_seller, false)
  where owner_id = target_user_id;

  return refreshed_profile;
end;
$$;

grant execute on function public.refresh_verified_seller(uuid) to authenticated;

drop trigger if exists set_profile_updated_at on public.profiles;

create trigger set_profile_updated_at
  before update on public.profiles
  for each row execute procedure public.touch_profile_updated_at();

drop trigger if exists set_listing_updated_at on public.listings;

create trigger set_listing_updated_at
  before update on public.listings
  for each row execute procedure public.touch_generic_updated_at();

drop trigger if exists set_message_request_updated_at on public.message_requests;

create trigger set_message_request_updated_at
  before update on public.message_requests
  for each row execute procedure public.touch_generic_updated_at();

alter table public.profiles enable row level security;
alter table public.support_messages enable row level security;
alter table public.listings enable row level security;
alter table public.message_requests enable row level security;
alter table public.user_blocks enable row level security;
alter table public.listing_reports enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

drop policy if exists "Users can insert own support messages" on public.support_messages;
create policy "Users can insert own support messages"
  on public.support_messages
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own support messages" on public.support_messages;
create policy "Users can read own support messages"
  on public.support_messages
  for select
  using (auth.uid() = user_id);

drop policy if exists "Public can read listings" on public.listings;
create policy "Public can read listings"
  on public.listings
  for select
  using (status = 'published');

drop policy if exists "Users can insert own listings" on public.listings;
create policy "Users can insert own listings"
  on public.listings
  for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Users can update own listings" on public.listings;
create policy "Users can update own listings"
  on public.listings
  for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Users can delete own listings" on public.listings;
create policy "Users can delete own listings"
  on public.listings
  for delete
  using (auth.uid() = owner_id);

drop policy if exists "Users can read related message requests" on public.message_requests;
create policy "Users can read related message requests"
  on public.message_requests
  for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "Users can insert valid message requests" on public.message_requests;
create policy "Users can insert valid message requests"
  on public.message_requests
  for insert
  with check (
    auth.uid() = sender_id
    and sender_id <> recipient_id
    and not exists (
      select 1
      from public.user_blocks ub
      where (ub.blocker_id = sender_id and ub.blocked_id = recipient_id)
         or (ub.blocker_id = recipient_id and ub.blocked_id = sender_id)
    )
    and recipient_id = (
      select l.owner_id
      from public.listings l
      where l.id = listing_id
      limit 1
    )
  );

drop policy if exists "Recipients can update own message requests" on public.message_requests;
create policy "Recipients can update own message requests"
  on public.message_requests
  for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

drop policy if exists "Users can manage own blocks" on public.user_blocks;
create policy "Users can manage own blocks"
  on public.user_blocks
  for all
  using (auth.uid() = blocker_id)
  with check (auth.uid() = blocker_id);

drop policy if exists "Users can read related reports" on public.listing_reports;
create policy "Users can read related reports"
  on public.listing_reports
  for select
  using (
    auth.uid() = reporter_id
    or auth.uid() = listing_owner_id
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

drop policy if exists "Users can insert own listing reports" on public.listing_reports;
create policy "Users can insert own listing reports"
  on public.listing_reports
  for insert
  with check (
    auth.uid() = reporter_id
    and reporter_id <> listing_owner_id
  );

drop policy if exists "Admins can update listing reports" on public.listing_reports;
create policy "Admins can update listing reports"
  on public.listing_reports
  for update
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

drop policy if exists "Avatar images are publicly visible" on storage.objects;
create policy "Avatar images are publicly visible"
  on storage.objects
  for select
  using (bucket_id = 'avatars');

drop policy if exists "Users can upload own avatar" on storage.objects;
create policy "Users can upload own avatar"
  on storage.objects
  for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can update own avatar" on storage.objects;
create policy "Users can update own avatar"
  on storage.objects
  for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete own avatar" on storage.objects;
create policy "Users can delete own avatar"
  on storage.objects
  for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Listing photos are publicly visible" on storage.objects;
create policy "Listing photos are publicly visible"
  on storage.objects
  for select
  using (bucket_id = 'listing-photos');

drop policy if exists "Users can upload own listing photos" on storage.objects;
create policy "Users can upload own listing photos"
  on storage.objects
  for insert
  with check (
    bucket_id = 'listing-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can update own listing photos" on storage.objects;
create policy "Users can update own listing photos"
  on storage.objects
  for update
  using (
    bucket_id = 'listing-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete own listing photos" on storage.objects;
create policy "Users can delete own listing photos"
  on storage.objects
  for delete
  using (
    bucket_id = 'listing-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

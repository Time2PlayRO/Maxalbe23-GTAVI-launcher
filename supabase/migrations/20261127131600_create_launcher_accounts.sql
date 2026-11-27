create table if not exists public.launcher_keys (
  user_id uuid primary key references auth.users (id) on delete cascade,
  license_key_hash text not null unique,
  is_active boolean not null default true,
  device_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.launcher_keys enable row level security;
revoke all on table public.launcher_keys from anon, authenticated;
grant select, insert, update, delete on table public.launcher_keys to service_role;

-- Keep the installer private. Downloads are issued by a JWT-checked Edge Function.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'launcher-downloads',
  'launcher-downloads',
  false,
  52428800,
  array['application/octet-stream', 'application/vnd.microsoft.portable-executable', 'application/x-msdownload']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

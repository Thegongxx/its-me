create table public.devices (
  id uuid primary key default gen_random_uuid(),
  label text not null check (length(label) between 1 and 80),
  token_hash text not null check (token_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '90 days',
  last_seen_at timestamptz,
  last_sequence bigint not null default -1,
  revoked_at timestamptz
);
create table public.sharing_settings (
  id integer primary key check (id=1),
  enabled boolean not null default false,
  active_device_id uuid references public.devices(id)
);
insert into public.sharing_settings(id) values(1);
create table public.public_status (
  id integer primary key check (id=1),
  category text not null default 'none' check (category in ('development','design','reading','writing','other','none')),
  state text not null default 'paused' check (state in ('active','idle','paused','focusing','thinking','available','away')),
  sharing boolean not null default false,
  heartbeat_at timestamptz,
  expires_at timestamptz
);
insert into public.public_status(id) values(1);
alter table public.devices enable row level security;
alter table public.sharing_settings enable row level security;
alter table public.public_status enable row level security;
revoke all on public.devices, public.sharing_settings, public.public_status from anon, authenticated;
grant select(id,label,created_at,expires_at,last_seen_at,revoked_at) on public.devices to authenticated;
grant insert(id,label,token_hash) on public.devices to authenticated;
grant select on public.sharing_settings to authenticated;
grant select on public.public_status to anon, authenticated;
create policy admin_read_devices on public.devices for select to authenticated using ((select public.is_admin()));
create policy admin_create_devices on public.devices for insert to authenticated with check ((select public.is_admin()));
create policy admin_read_settings on public.sharing_settings for select to authenticated using ((select public.is_admin()));
create policy read_sanitized_status on public.public_status for select to anon, authenticated using (true);

-- All presence mutations lock settings FIRST, then the device, avoiding revoke/report races.
create function public.change_sharing(p_enabled boolean, p_device_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare d public.devices%rowtype;
begin
  if not public.is_admin() then raise exception 'Administrator authorization required' using errcode='42501'; end if;
  perform 1 from public.sharing_settings where id=1 for update;
  if p_enabled then
    select * into d from public.devices where id=p_device_id for update;
    if not found or d.revoked_at is not null or d.expires_at <= now() then raise exception 'Choose an active device'; end if;
  end if;
  update public.sharing_settings set enabled=p_enabled, active_device_id=p_device_id where id=1;
  -- Old device/category never survives a pause or device switch.
  update public.public_status set sharing=false, state='paused', category='none', heartbeat_at=null, expires_at=null where id=1;
end $$;
create function public.revoke_device(p_device_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Administrator authorization required' using errcode='42501'; end if;
  perform 1 from public.sharing_settings where id=1 for update;
  update public.devices set revoked_at=now() where id=p_device_id;
  if exists(select 1 from public.sharing_settings where id=1 and active_device_id=p_device_id) then
    update public.sharing_settings set enabled=false, active_device_id=null where id=1;
    update public.public_status set sharing=false, state='paused', category='none', heartbeat_at=null, expires_at=null where id=1;
  end if;
end $$;
revoke all on function public.change_sharing(boolean,uuid), public.revoke_device(uuid) from public, anon;
grant execute on function public.change_sharing(boolean,uuid), public.revoke_device(uuid) to authenticated;

-- Only the server's service-role may invoke ingestion. It accepts no personal text.
create function public.ingest_heartbeat(p_device_id uuid, p_hash text, p_sequence bigint, p_category text, p_state text) returns text
language plpgsql security definer set search_path = '' as $$
declare d public.devices%rowtype; s public.sharing_settings%rowtype; received timestamptz := clock_timestamp();
begin
  if p_category is null or p_state is null or p_category not in ('development','design','reading','writing','other','none')
     or p_state not in ('active','idle','paused','focusing','thinking','available','away')
     or p_sequence is null or p_sequence < 0 or p_sequence > 9007199254740991 then return 'invalid'; end if;
  select * into s from public.sharing_settings where id=1 for update;
  select * into d from public.devices where id=p_device_id for update;
  if not found or p_hash is null or d.token_hash <> p_hash or d.revoked_at is not null or d.expires_at <= received then return 'unauthorized'; end if;
  if p_sequence <= d.last_sequence then return 'replay'; end if;
  if not s.enabled or s.active_device_id is distinct from p_device_id then return 'disabled'; end if;
  if d.last_seen_at is not null and received - d.last_seen_at < interval '3 seconds' then return 'throttled'; end if;
  update public.devices set last_sequence=p_sequence, last_seen_at=received where id=p_device_id;
  update public.public_status set
    category=case when p_state in ('paused','idle','away') then 'none' else p_category end,
    state=p_state, sharing=(p_state <> 'paused'), heartbeat_at=received, expires_at=received+interval '90 seconds'
    where id=1;
  return 'ok';
end $$;
revoke all on function public.ingest_heartbeat(uuid,text,bigint,text,text) from public, anon, authenticated;
grant execute on function public.ingest_heartbeat(uuid,text,bigint,text,text) to service_role;

-- Public Realtime contains only this sanitized singleton, never device identifiers or hashes.
alter publication supabase_realtime add table public.public_status;

-- Application schema. No personal records or administrators are seeded.
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admin_users where user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create table public.profiles (
  id integer primary key default 1 check (id = 1),
  name text not null default '待填写姓名' check (length(name) between 1 and 80),
  headline text not null default '' check (length(headline) <= 160),
  bio text not null default '' check (length(bio) <= 1200),
  location text not null default '' check (length(location) <= 100),
  email text not null default '' check (length(email) <= 254),
  github_url text not null default '' check (github_url = '' or github_url ~ '^https://'),
  introduction text not null default '' check (length(introduction) <= 50000),
  published boolean not null default false
);
insert into public.profiles (id) values (1);

create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('education','work','practice')),
  title text not null check (length(title) between 1 and 150),
  organization text not null default '' check (length(organization) <= 150),
  period text not null default '' check (length(period) <= 100),
  description text not null default '' check (length(description) <= 5000),
  sort_order integer not null default 0,
  published boolean not null default false
);

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('project','learn')),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 100),
  title text not null check (length(title) between 1 and 160),
  summary text not null default '' check (length(summary) <= 1000),
  body text not null default '' check (length(body) <= 100000),
  cover_path text check (cover_path is null or cover_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$'),
  theme text not null default 'sage' check (theme in ('sage','butter','ink')),
  status text not null default 'draft' check (status in ('draft','published')),
  featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  role text not null default '' check (length(role) <= 250),
  year text not null default '' check (length(year) <= 20),
  external_url text not null default '' check (external_url = '' or external_url ~ '^https://'),
  repository_url text not null default '' check (repository_url = '' or repository_url ~ '^https://'),
  unique (kind, slug),
  check (status <> 'published' or published_at is not null),
  check (cover_path is null or split_part(cover_path, '/', 1) = id::text)
);
create index entries_published on public.entries(kind, published_at desc) where status = 'published';
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80),
  description text not null default '' check (length(description) <= 500),
  published boolean not null default false
);
create table public.entry_categories (
  entry_id uuid not null references public.entries(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key(entry_id, category_id)
);
create index entry_categories_category on public.entry_categories(category_id);

do $$ declare tbl text; begin
  foreach tbl in array array['profiles','experiences','entries','categories','entry_categories'] loop
    execute format('alter table public.%I enable row level security', tbl);
    execute format('revoke all on public.%I from anon, authenticated', tbl);
    execute format('grant select on public.%I to anon, authenticated', tbl);
    execute format('grant insert, update, delete on public.%I to authenticated', tbl);
    execute format('create policy admin_manage on public.%I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', tbl);
  end loop;
end $$;
create policy published_profiles on public.profiles for select to anon, authenticated using (published);
create policy published_experiences on public.experiences for select to anon, authenticated using (published);
create policy published_entries on public.entries for select to anon, authenticated using (status = 'published');
create policy published_categories on public.categories for select to anon, authenticated using (published);
create policy published_connections on public.entry_categories for select to anon, authenticated using (
  exists(select 1 from public.entries e where e.id = entry_id and e.status = 'published')
  and exists(select 1 from public.categories c where c.id = category_id and c.published)
);

create function public.touch_entry() returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  if new.status = 'published' and new.published_at is null then new.published_at = now(); end if;
  return new;
end $$;
create trigger entry_timestamp before insert or update on public.entries for each row execute function public.touch_entry();

-- Atomic content + knowledge links; still executes under the authenticated caller's RLS.
create function public.save_entry(p_entry jsonb, p_categories uuid[]) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare entry_uuid uuid := (p_entry->>'id')::uuid;
begin
  if not public.is_admin() then raise exception 'Administrator authorization required' using errcode = '42501'; end if;
  insert into public.entries(id, kind, slug, title, summary, body, cover_path, theme, status, featured, role, year, external_url, repository_url)
  values(entry_uuid, p_entry->>'kind', p_entry->>'slug', p_entry->>'title', p_entry->>'summary', p_entry->>'body', nullif(p_entry->>'cover_path',''), p_entry->>'theme', p_entry->>'status', (p_entry->>'featured')::boolean, p_entry->>'role', p_entry->>'year', p_entry->>'external_url', p_entry->>'repository_url')
  on conflict (id) do update set kind=excluded.kind, slug=excluded.slug, title=excluded.title,
    summary=excluded.summary, body=excluded.body, cover_path=excluded.cover_path, theme=excluded.theme,
    status=excluded.status, featured=excluded.featured, role=excluded.role, year=excluded.year,
    external_url=excluded.external_url, repository_url=excluded.repository_url;
  delete from public.entry_categories where entry_id = entry_uuid;
  insert into public.entry_categories(entry_id, category_id) select entry_uuid, unnest(p_categories) on conflict do nothing;
  return entry_uuid;
end $$;
revoke all on function public.save_entry(jsonb,uuid[]) from public, anon;
grant execute on function public.save_entry(jsonb,uuid[]) to authenticated;

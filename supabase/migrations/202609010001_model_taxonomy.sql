-- Mini Archive model taxonomy foundation
-- Canonical entities stay reusable while still allowing community-created values.
-- Existing miniature.manufacturer text is preserved during migration and backfilled
-- into canonical manufacturer rows so current records continue to work.

create extension if not exists pgcrypto;

create table if not exists public.manufacturers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  source text not null default 'user' check (source in ('seed', 'user', 'admin')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.manufacturer_aliases (
  id uuid primary key default gen_random_uuid(),
  manufacturer_id uuid not null references public.manufacturers(id) on delete cascade,
  alias text not null,
  normalized_alias text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.game_systems (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  source text not null default 'user' check (source in ('seed', 'user', 'admin')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_system_aliases (
  id uuid primary key default gen_random_uuid(),
  game_system_id uuid not null references public.game_systems(id) on delete cascade,
  alias text not null,
  normalized_alias text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.factions (
  id uuid primary key default gen_random_uuid(),
  game_system_id uuid not null references public.game_systems(id) on delete cascade,
  name text not null,
  slug text not null,
  source text not null default 'user' check (source in ('seed', 'user', 'admin')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (game_system_id, slug)
);

create table if not exists public.faction_aliases (
  id uuid primary key default gen_random_uuid(),
  faction_id uuid not null references public.factions(id) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  created_at timestamptz not null default now(),
  unique (faction_id, normalized_alias)
);

-- Normalize only for matching. Display names remain exactly as stored.
create or replace function public.taxonomy_normalize(value text)
returns text
language sql
immutable
strict
as $$
  select trim(regexp_replace(lower(value), '[^a-z0-9]+', ' ', 'g'));
$$;

create or replace function public.taxonomy_slug(value text)
returns text
language sql
immutable
strict
as $$
  select trim(both '-' from regexp_replace(lower(value), '[^a-z0-9]+', '-', 'g'));
$$;

create unique index if not exists manufacturers_normalized_name_uidx
  on public.manufacturers (public.taxonomy_normalize(name));
create unique index if not exists game_systems_normalized_name_uidx
  on public.game_systems (public.taxonomy_normalize(name));
create unique index if not exists factions_game_normalized_name_uidx
  on public.factions (game_system_id, public.taxonomy_normalize(name));

alter table public.miniatures
  add column if not exists manufacturer_id uuid references public.manufacturers(id) on delete set null,
  add column if not exists game_system_id uuid references public.game_systems(id) on delete set null,
  add column if not exists faction_id uuid references public.factions(id) on delete set null;

create index if not exists miniatures_manufacturer_id_idx on public.miniatures(manufacturer_id);
create index if not exists miniatures_game_system_id_idx on public.miniatures(game_system_id);
create index if not exists miniatures_faction_id_idx on public.miniatures(faction_id);
create index if not exists factions_game_system_id_idx on public.factions(game_system_id);

-- Preserve the manufacturers already present on real/dummy records as canonical rows.
insert into public.manufacturers (name, slug, source)
select distinct on (public.taxonomy_normalize(trim(m.manufacturer)))
       trim(m.manufacturer),
       public.taxonomy_slug(trim(m.manufacturer)),
       'seed'
from public.miniatures m
where nullif(trim(m.manufacturer), '') is not null
order by public.taxonomy_normalize(trim(m.manufacturer)), trim(m.manufacturer)
on conflict do nothing;

update public.miniatures m
set manufacturer_id = mf.id
from public.manufacturers mf
where m.manufacturer_id is null
  and nullif(trim(m.manufacturer), '') is not null
  and public.taxonomy_normalize(mf.name) = public.taxonomy_normalize(m.manufacturer);

-- A faction must belong to the same game selected on the miniature.
create or replace function public.enforce_miniature_faction_game()
returns trigger
language plpgsql
as $$
declare
  faction_game uuid;
begin
  if new.faction_id is null then
    return new;
  end if;

  select game_system_id into faction_game
  from public.factions
  where id = new.faction_id;

  if new.game_system_id is null then
    new.game_system_id := faction_game;
  elsif new.game_system_id <> faction_game then
    raise exception 'Selected faction does not belong to the selected game system';
  end if;

  return new;
end;
$$;

drop trigger if exists miniature_faction_game_guard on public.miniatures;
create trigger miniature_faction_game_guard
before insert or update of game_system_id, faction_id on public.miniatures
for each row execute function public.enforce_miniature_faction_game();

alter table public.manufacturers enable row level security;
alter table public.manufacturer_aliases enable row level security;
alter table public.game_systems enable row level security;
alter table public.game_system_aliases enable row level security;
alter table public.factions enable row level security;
alter table public.faction_aliases enable row level security;

-- Everyone may use the canonical catalogue for public forms and records.
create policy "taxonomy manufacturers readable" on public.manufacturers for select using (true);
create policy "taxonomy manufacturer aliases readable" on public.manufacturer_aliases for select using (true);
create policy "taxonomy game systems readable" on public.game_systems for select using (true);
create policy "taxonomy game aliases readable" on public.game_system_aliases for select using (true);
create policy "taxonomy factions readable" on public.factions for select using (true);
create policy "taxonomy faction aliases readable" on public.faction_aliases for select using (true);

-- Authenticated users can extend the catalogue. The application will first resolve
-- normalized names/aliases so ordinary spelling/case variations reuse existing IDs.
create policy "authenticated users add manufacturers" on public.manufacturers
  for insert to authenticated with check (created_by = auth.uid() and source = 'user');
create policy "authenticated users add game systems" on public.game_systems
  for insert to authenticated with check (created_by = auth.uid() and source = 'user');
create policy "authenticated users add factions" on public.factions
  for insert to authenticated with check (created_by = auth.uid() and source = 'user');

-- Alias creation/merging remains admin-managed for now. This prevents users from
-- hijacking common search terms while still allowing them to create legitimate new entities.

grant select on public.manufacturers, public.manufacturer_aliases,
  public.game_systems, public.game_system_aliases, public.factions, public.faction_aliases
  to anon, authenticated;
grant insert on public.manufacturers, public.game_systems, public.factions to authenticated;

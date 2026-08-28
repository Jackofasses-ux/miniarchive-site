begin;

-- NFC tokens are bearer secrets. Never expose nfc_tags to anonymous table reads.
drop policy if exists "Public can look up active tags" on public.nfc_tags;
revoke all on table public.nfc_tags from anon;

-- Exact-token resolver. It returns routing information, never the stored token.
create or replace function public.resolve_nfc_tag(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_result jsonb;
  v_tag_id uuid;
  v_first_scanned_at timestamptz;
  v_is_owner boolean;
begin
  select
    t.id,
    t.first_scanned_at,
    (auth.uid() is not null and m.owner_profile_id = auth.uid()),
    jsonb_build_object(
      'miniature_id', m.id,
      'archive_id', m.archive_id,
      'title', m.title,
      'is_owner', (auth.uid() is not null and m.owner_profile_id = auth.uid()),
      'first_scanned_at', t.first_scanned_at
    )
  into v_tag_id, v_first_scanned_at, v_is_owner, v_result
  from public.nfc_tags t
  join public.miniatures m on m.id = t.miniature_id
  where t.token = p_token
    and t.status = 'active'
    and (
      (m.visibility = 'public' and m.status = 'completed')
      or m.owner_profile_id = auth.uid()
    )
  limit 1;

  if v_result is null then
    return null;
  end if;

  if v_is_owner and v_first_scanned_at is null then
    update public.nfc_tags
    set first_scanned_at = now()
    where id = v_tag_id and first_scanned_at is null;

    v_result := jsonb_set(v_result, '{first_scanned_at}', to_jsonb(now()));
  end if;

  return v_result;
end;
$$;

revoke all on function public.resolve_nfc_tag(text) from public;
grant execute on function public.resolve_nfc_tag(text) to anon, authenticated;

-- Public records may show whether a tag is verified without exposing tag data.
create or replace function public.get_nfc_verification(p_miniature_id uuid)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when count(t.id) = 0 then 'none'
    when bool_or(t.first_scanned_at is not null) then 'verified'
    else 'pending'
  end
  from public.miniatures m
  left join public.nfc_tags t
    on t.miniature_id = m.id
   and t.status = 'active'
  where m.id = p_miniature_id
    and (
      (m.visibility = 'public' and m.status = 'completed')
      or m.owner_profile_id = auth.uid()
    );
$$;

revoke all on function public.get_nfc_verification(uuid) from public;
grant execute on function public.get_nfc_verification(uuid) to anon, authenticated;

-- The base profile row contains private preferences. Public pages use this view.
create or replace view public.public_profiles
with (security_barrier = true)
as
select id, username, display_name, bio, country, avatar_url, created_at
from public.profiles;

grant select on public.public_profiles to anon, authenticated;

drop policy if exists "Public can view profiles" on public.profiles;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

commit;

# Mini Archive v2 Physical Schema — Draft 1

Status: **design draft only — no production SQL applied**

This document begins translating the approved v2 architecture into concrete PostgreSQL/Supabase structures. The first pass intentionally focuses on the authorization/security root, Archive identity, catalogue/source separation, physical relationships, Work History, and legal/privacy foundations. Play, evidence/reporting, NFC, commerce, notifications, disputes, and moderation are sketched as boundaries and will receive dedicated passes before migration SQL is approved.

## Security boundary first

V2 should not treat `public` as the natural home of every table.

Proposed schemas:

- `public`: deliberately API-exposed application data protected by RLS; public Archive/reference reads and owner-authorized writes.
- `private`: sensitive/internal data not directly exposed through the Data API. Evidence internals, sensitive metadata, security state, privileged workflow state, and similar material belong here unless there is a compelling reason otherwise.

Rules:

- RLS and grants ship in the same migration as every exposed table.
- `anon` gets only deliberate public reads.
- `authenticated` does not receive blanket CRUD.
- service-role credentials never enter browser code.
- functions default to security invoker. Any security-definer function must be exceptional, live outside an exposed schema where practical, set an empty/restricted `search_path`, schema-qualify objects, and receive explicit execute grants.
- public views use `security_invoker = true` unless a separately reviewed privileged read boundary is intentionally required.
- authorization columns used by RLS are indexed.
- private evidence/original media is not made public merely because its Archive Record is public.

## 1. Accounts and public profiles

### `public.profiles`

Keep a public-facing profile separate from `auth.users` and private account state.

Proposed columns:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | FK `auth.users(id)`; account identity |
| `username` | text NOT NULL UNIQUE | normalized/validated |
| `display_name` | text NOT NULL | public |
| `bio` | text | public optional |
| `avatar_media_id` | uuid | later FK to publishable media |
| `country_code` | text | optional public/coarse value |
| `language` | text NOT NULL | initial `en`/`fr`; do not over-constrain forever |
| `created_at` | timestamptz NOT NULL | server default |
| `updated_at` | timestamptz NOT NULL | server-maintained |

Social/profile links remain a child table rather than fixed Instagram/YouTube columns.

### `public.profile_links`

`id`, `profile_id`, `platform`, `url`, `sort_order`, `is_public`, timestamps.

### Private account state

Account deletion/deactivation, security state, sensitive contact/disclosure data, and internal flags should not be mixed into the public profile row. Exact private account tables will be specified with privacy/retention design.

## 2. Archive identity root

### `public.archive_records`

This is the permanent physical Archive identity and primary authorization anchor.

Proposed columns:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()`; never public security token |
| `archive_id` | bigint UNIQUE | NULL while draft; allocated atomically only on publication |
| `owner_profile_id` | uuid NOT NULL | current owner/manager pointer; ownership history is separate |
| `record_type` | text NOT NULL | `miniature`, `group`, `diorama`, `other` initially |
| `construction_type` | text | miniature-oriented: `standard`, `mostly_existing`, `multiple_kits`, `original` |
| `title` | text NOT NULL | user-facing |
| `subtitle` | text | optional |
| `description` | text | optional |
| `publication_state` | text NOT NULL | `draft`, `published`; moderation is separate |
| `physical_state` | text | lifecycle vocabulary to finalize; not publication/privacy |
| `published_at` | timestamptz | immutable first-publication time |
| `created_at` | timestamptz NOT NULL | server default |
| `updated_at` | timestamptz NOT NULL | server-maintained |

Constraints/invariants:

- draft => `archive_id IS NULL` and `published_at IS NULL`
- published => `archive_id IS NOT NULL` and `published_at IS NOT NULL`
- `archive_id` is never reused
- publishing is a trusted atomic operation rather than a browser-chosen number
- owner cannot casually delete a published Record
- moderation/suppression does not mutate `publication_state` back into a fake draft
- `owner_profile_id` is indexed for RLS/query performance

### Archive ID allocation

Use a database sequence or equivalent atomic allocator behind a narrowly scoped publication function. The browser never computes the next Archive ID.

Open clarification: whether the human-facing Archive ID should remain a simple numeric sequence (e.g. `12345`) or use a formatted presentation while retaining an internal numeric allocator.

## 3. Physical miniature extension

### `public.miniature_details`

One-to-one extension for fields that make sense for an individual physical miniature rather than every Archive type.

Proposed columns:

- `record_id uuid PK/FK -> archive_records(id)`
- `material text`
- `scale text`
- `base_size_mm numeric`
- `current_game_system_id uuid NULL`
- `current_faction_id uuid NULL`
- `painter_profile_id uuid NULL`
- `painter_name text NULL`
- timestamps where useful

The catalogue/source does not populate these as immutable truth. A Games Workshop Space Marine source can become any appropriate finished faction/game identity.

Question to review later: whether current game/faction affiliation belongs here or in reusable temporal affiliations. Do not overbuild until actual UI/history cases require it.

## 4. Finished Record relationships

### `public.record_relationships`

Historical relationship between finished Archive Records.

Proposed columns:

- `id uuid PK`
- `parent_record_id uuid NOT NULL FK`
- `child_record_id uuid NOT NULL FK`
- `relationship_type text NOT NULL`
- `started_at date NULL`
- `ended_at date NULL`
- `notes text NULL`
- `created_by uuid`
- `created_at timestamptz`

Initial relationship vocabulary can include `member_of` / display membership semantics, but exact values should be reviewed before SQL.

Constraints:
- parent != child
- end >= start when both known
- indexes on both FK directions
- avoid destructive cascades that erase meaningful historical membership

## 5. Catalogue/reference foundation

Catalogue is reference/provenance support, not the Archive root.

Candidate tables:

### `public.manufacturers`
`id uuid`, `name`, `slug`, `website`, `active`, timestamps.

### `public.game_systems`
`id uuid`, `name`, `slug`, `publisher/manufacturer relationship` to be decided, `active`, timestamps.

### `public.factions`
`id uuid`, optional `game_system_id`, `name`, `slug`, optional parent faction, active.

### `public.catalogue_models`
Represents the identifiable model/sculpt/design identity.

Candidate fields:
- `id uuid PK`
- `manufacturer_id uuid NULL`
- `game_system_id uuid NULL`
- `original_faction_id uuid NULL`
- `name text NOT NULL`
- `description text NULL`
- `sculptor/designer` should eventually be normalized rather than frozen as one text field
- timestamps

### `public.catalogue_releases`
Only when a physical release/revision materially helps identify/date/authenticate the miniature.

Candidate fields:
- `id uuid PK`
- `catalogue_model_id uuid NOT NULL`
- `release_name text NULL`
- `release_year smallint NULL`
- `material text NULL`
- `base_size_mm numeric NULL`
- `revision_notes text NULL`
- `source_url text NULL`
- timestamps

### aliases
Rather than stuffing alternate names into text arrays, use alias rows attached to normalized reference entities where needed. Exact generic-vs-specific alias implementation remains open.

Catalogue writes should not automatically be available to every authenticated user merely because catalogue reads are public. Community submission/curation will have a separate authorization workflow.

## 6. Construction/source provenance

### `public.record_sources`

Bridges a finished Archive Record to manufactured or non-catalogue construction sources.

Candidate columns:

- `id uuid PK`
- `record_id uuid NOT NULL`
- `catalogue_model_id uuid NULL`
- `catalogue_release_id uuid NULL`
- `source_type text NOT NULL` — known catalogue, third-party, 3D printed, hand-sculpted, scratch-built, unknown, etc.
- `source_name text NULL`
- `notes text NULL`
- `sort_order integer NOT NULL default 0`
- timestamps

Constraint should prevent contradictory empty rows while allowing unknown/unidentified sources. Multiple-kit Records can have any number of rows; no percentages or mandatory primary source.

## 7. Media foundation

Do not persist arbitrary permanent public URLs as the identity of uploaded media.

### `public.media_assets`

Public/application metadata only:

- `id uuid PK`
- `owner_profile_id uuid NOT NULL`
- `storage_object_key text NOT NULL UNIQUE`
- `media_type text NOT NULL`
- `visibility_class text NOT NULL` — vocabulary to finalize; publication does not imply evidence originals become public
- `mime_type text NOT NULL`
- `byte_size bigint NOT NULL`
- `created_at timestamptz NOT NULL`

### `public.record_media`

- `record_id`
- `media_id`
- `role` (gallery/cover/etc.)
- `caption`
- `sort_order`

Sensitive original-file metadata, evidence observations, hashes, EXIF/GPS, moderation internals, and insurer-specific evidence do **not** belong in the public media row merely for convenience. They will be designed in the private evidence pass.

## 8. Work History

### `public.work_entries`

- `id uuid PK`
- `record_id uuid NOT NULL`
- `entry_date date NOT NULL`
- `category text NOT NULL`
- `description text NULL`
- `hours numeric NULL CHECK hours >= 0`
- `is_milestone boolean NOT NULL default false`
- `created_by uuid NOT NULL`
- `created_at timestamptz NOT NULL`
- `updated_at timestamptz NOT NULL`

`entry_date` is when the work happened; `created_at` is when Mini Archive received the entry.

### `public.work_entry_paints`

- `id uuid PK`
- `work_entry_id uuid NOT NULL`
- `paint_id text NOT NULL FK -> paints(id)`
- `usage_role text NULL`
- `sort_order integer NOT NULL default 0`

No dedicated `primer_paint_id` or `basecoat_paint_id` columns. Primer is a product; Primer usage is a role.

### `public.work_entry_media`

Junction to `media_assets`, avoiding a second image URL storage model.

Existing `paints` and `paint_conversions` are preserved with their current IDs.

## 9. Legal documents, acceptance, and privacy consent

Contract acceptance and optional privacy consent are different things.

### `public.legal_documents`

Public document identity, e.g. Terms of Service, Privacy Policy.

- `id uuid PK`
- `document_type text NOT NULL`
- `name text NOT NULL`
- timestamps

### `public.legal_document_versions`

- `id uuid PK`
- `document_id uuid NOT NULL`
- `version text NOT NULL`
- `effective_at timestamptz NOT NULL`
- `content_hash text NOT NULL`
- immutable location/content reference strategy to finalize
- `requires_acceptance boolean NOT NULL`

### private acceptance/consent records

User acceptance and optional consent records contain account-specific legal/privacy state and should be treated as private data.

Needed concepts:
- user/account
- exact document/version or consent purpose/version
- accepted/granted timestamp
- withdrawn timestamp where withdrawal applies
- source/context/audit information where legally justified
- no overwriting old acceptance history

Feature-specific consent (e.g. preserving selected photo metadata/location for ownership documentation) must not be collapsed into general Terms acceptance.

## 10. Evidence/documentation boundary — next dedicated pass

The schema must later support:

- evidence artifact identity and type
- Record/claim association
- uploader/actor
- `happened_at` vs user-reported date vs system `created_at`
- server-observed upload time
- file hash/integrity information
- metadata observations at ingestion (including EXIF where explicitly permitted)
- explicit purpose/consent basis
- optional location with precision classification
- collection-documentation verification sessions
- NFC physical-presence evidence distinct from ordinary scans
- frozen report snapshots
- insurer disclosure request + granular user authorization
- pre-loss vs post-loss chronology
- preservation separate from disclosure

No sensitive metadata collection should be activated merely because the tables exist. Québec privacy/legal review gates the actual behavior.

## 11. Play boundary — next dedicated pass

Need concrete tables for:

- lightweight games/sessions
- participants
- optional longer-running contexts
- personal/canonical Play Identities
- temporal Record representation
- extensible event definitions
- structured play events and actor/target/values
- attestations
- Stories and Record/Play Identity references
- historical date vs entry timestamp

Career stats remain derived BI/reporting, never authoritative counters.

## 12. NFC boundary — dedicated pass

Need concrete tables for:

- activation credit ledger
- permanent NFC identities with high-entropy public tokens
- optional physical carrier/tag
- assignment/history
- pending two-tap interactions
- missing/stolen cases
- recovery scans/location consent
- explicit documentation verification scans separately from ordinary NFC scans

Normal NFC scans must not silently become a location-history table.

## 13. Security tests that ship with schema

The physical schema work will include adversarial authorization tests, not only policies.

Minimum recurring cases:

1. anon can read only intentionally public published Archive/reference data
2. anon cannot enumerate draft/private/evidence/security data
3. User A cannot read User B private data
4. User A cannot update/delete User B Record-owned data
5. User A cannot forge ownership transfer/attestation/consent/evidence for User B
6. publication cannot use a caller-selected/reused Archive ID
7. public views cannot bypass RLS
8. authenticated users cannot execute privileged functions unless explicitly granted
9. storage access follows the same public/private boundary as database authorization
10. account deletion/transfer cannot accidentally erase permanent historical facts

## 14. Current prototype security issue

Current production/prototype table `public.model_kits` has RLS disabled. Supabase reports this as critical because tables in the exposed `public` schema can be accessed through client API roles according to their grants.

This draft does **not** change production. The old table is scheduled for replacement and should not be used as a v2 foundation. If the prototype remains publicly reachable during development, its actual grants/policies should be reviewed separately rather than blindly enabling RLS and breaking the existing site.

## Questions requiring Benjamin before locking Draft 1

These are real product choices rather than implementation trivia:

1. **Archive ID presentation:** keep the current/simple sequential number concept, or do you want a visible format such as `MA-000123`? Internally either can still use an atomic numeric sequence.
2. **Ownership visibility:** should the current owner's public profile always be shown on a published Record, or can an owner hide their public attribution while the Record itself remains public?
3. **Painter attribution:** can a Record credit multiple painters/artists, or is one current `painter` sufficient for v2? Multiple contributors would push this toward a relationship table instead of fields on `miniature_details`.
4. **Group nesting:** can groups contain other groups (for example Army → Squad → individual miniatures), or should grouping remain one level? The history model can support nesting, but we should explicitly decide whether the product allows it.

Everything else above can continue to be refined without blocking those answers.
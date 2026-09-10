# Mini Archive v2 Physical Schema Proposal

**Status:** design proposal, not a migration. No production database mutation is authorized by this document.

This document translates the locked v2 architecture into concrete PostgreSQL/Supabase table boundaries. It intentionally starts with the foundation and identifies later modules before writing SQL. Exact RLS policies, grants, functions and migrations follow after this table design is reviewed.

## Design rules

- UUIDs are internal identities. Public Archive IDs and NFC tokens are separate.
- `auth.users` is authentication infrastructure, not the public profile model.
- Public Archive data and sensitive/private evidence data are deliberately separated.
- Historical facts are append/correct/audit oriented; destructive cascades are avoided for provenance-bearing history.
- `created_at` is when Mini Archive stored a fact. `happened_at` is when the represented event occurred. They are never treated as interchangeable.
- Flexible JSON is reserved for genuinely system-specific/configurable state, not used to avoid relational design.
- Every table receives PK/FK/constraints/indexes/RLS/grants in the migration that creates it.
- No table is considered production-ready until its anonymous, authenticated-owner, cross-account, service-role and deletion behavior has been explicitly reviewed.

---

# Phase A: identity, Archive Records, physical works and public profiles

These are the first tables worth implementing because nearly every other v2 feature attaches to them.

## `profiles`

Private/account-adjacent user profile root. One row per authenticated account when a Mini Archive profile exists.

| Column | Type | Null | Notes |
|---|---|---:|---|
| `user_id` | `uuid` | no | PK, FK `auth.users(id)`; internal only |
| `handle` | `citext` | no | unique case-insensitive public handle |
| `display_name` | `text` | yes | public-facing name |
| `bio` | `text` | yes | public-facing profile text |
| `avatar_media_id` | `uuid` | yes | FK added after media foundation exists |
| `created_at` | `timestamptz` | no | server default `now()` |
| `updated_at` | `timestamptz` | no | maintained server-side |

Constraints/design:
- normalized handle format/length constraint; exact syntax to finalize with URL routing.
- authentication email, provider identities, billing IDs and other account secrets do **not** belong here.
- public reads should eventually use a restricted public profile view rather than exposing the table wholesale.
- deleting an auth account must not cascade-delete historical Archive provenance. Account-deletion/anonymization workflow must run deliberately.

## `archive_records`

Permanent identity and authorization root for archived physical works and structural Archive objects.

| Column | Type | Null | Notes |
|---|---|---:|---|
| `id` | `uuid` | no | PK, random internal UUID |
| `archive_id` | `bigint` | yes | permanent public Archive number; null while draft; unique when assigned |
| `owner_user_id` | `uuid` | yes | current owner/account FK; nullable for historical/anonymized states |
| `record_type` | enum/text | no | `miniature`, `group`, `diorama`, `other` |
| `title` | `text` | no | user-facing title |
| `subtitle` | `text` | yes | optional |
| `description` | `text` | yes | optional |
| `publication_state` | enum/text | no | initially `draft`, `published` |
| `physical_state` | enum/text | no | candidate: `active`, `lost`, `stolen`, `destroyed`, `historical`; exact vocabulary review before SQL |
| `published_at` | `timestamptz` | yes | immutable first publication timestamp |
| `created_at` | `timestamptz` | no | server default |
| `updated_at` | `timestamptz` | no | server maintained |

Constraints/design:
- `archive_id` is allocated atomically only when publishing; never supplied by client and never recycled.
- published row requires non-null `archive_id` and `published_at`.
- draft requires null `archive_id`; publication is one-way under ordinary user permissions.
- owner is current authorization convenience, **not** the authoritative ownership-history ledger.
- moderation/suppression does not belong in `publication_state`; moderation is a separate concern.
- anonymous reads should be through a deliberate public read model restricted to published/non-suppressed presentation.

Indexes anticipated:
- unique `archive_id` where not null
- `owner_user_id`
- `(publication_state, published_at)`
- public browse/search indexes added based on actual query design

## `miniature_details`

One-to-one extension for physical miniature-specific current state. Groups/dioramas do not get fake miniature columns.

| Column | Type | Null | Notes |
|---|---|---:|---|
| `record_id` | `uuid` | no | PK/FK `archive_records(id)` |
| `construction_type` | enum/text | yes | `standard`, `mostly_existing`, `multiple_kits`, `original` |
| `current_material_id` | `uuid` | yes | reference value; table defined with catalogue/reference module |
| `current_base_size_id` | `uuid` | yes | reference value |
| `current_game_system_id` | `uuid` | yes | optional current presentation/play association |
| `current_faction_id` | `uuid` | yes | finished-work affiliation, not source faction |
| `scale_text` | `text` | yes | initially permissive because scale conventions vary |
| `completed_on` | `date` | yes | convenience/current fact; historical work completion still belongs in Work History |

Constraints/design:
- only valid where parent `archive_records.record_type = miniature`; enforce server-side/trigger or controlled function because a normal CHECK cannot inspect parent table.
- current fields are conveniences for display/filtering. Important historical changes are recorded in history rather than attempting temporal columns here.
- source catalogue faction/material/base remain separate from these finished-work values.

## `record_relationships`

Historical relationships between finished Archive Records, such as miniature membership in a squad/group or placement in a diorama.

| Column | Type | Null | Notes |
|---|---|---:|---|
| `id` | `uuid` | no | PK |
| `parent_record_id` | `uuid` | no | FK Archive Record |
| `child_record_id` | `uuid` | no | FK Archive Record |
| `relationship_type` | enum/text | no | initial vocabulary e.g. `member`, `display_component`; exact set review |
| `started_at` | `timestamptz` | yes | historical date may be retroactively entered |
| `ended_at` | `timestamptz` | yes | null = current/open relationship where temporal semantics apply |
| `notes` | `text` | yes | optional |
| `created_by_user_id` | `uuid` | yes | actor who documented relationship |
| `created_at` | `timestamptz` | no | system timestamp |
| `updated_at` | `timestamptz` | no | system timestamp |

Constraints/design:
- parent cannot equal child.
- prevent duplicate identical open relationships.
- prevent relationship cycles where the chosen relationship semantics require hierarchy; enforcement method deferred until relationship vocabulary is frozen.
- closing a relationship preserves the row.

## `ownership_events`

Authoritative historical ownership/possession transaction history. This is deliberately separate from `archive_records.owner_user_id`.

| Column | Type | Null | Notes |
|---|---|---:|---|
| `id` | `uuid` | no | PK |
| `record_id` | `uuid` | no | FK Archive Record |
| `event_type` | enum/text | no | candidate: `claim`, `transfer`, `correction`, `detachment`; review before SQL |
| `from_user_id` | `uuid` | yes | prior account where applicable |
| `to_user_id` | `uuid` | yes | receiving account where applicable |
| `status` | enum/text | no | candidate: `pending`, `accepted`, `declined`, `cancelled`, `superseded` |
| `happened_at` | `timestamptz` | yes | historical effective date if known |
| `requested_at` | `timestamptz` | no | system timestamp |
| `resolved_at` | `timestamptz` | yes | system timestamp |
| `created_by_user_id` | `uuid` | yes | initiating authenticated actor |
| `notes` | `text` | yes | optional user-facing context |

Rules:
- another user's ownership cannot be completed by merely inserting their UUID/handle.
- transfer acceptance must be a trusted transaction/function that locks the Record, validates current ownership/pending transfer, writes history, and updates `archive_records.owner_user_id` atomically.
- accepted ownership history is not casually deleted when an account is removed.
- historical external/non-account owners need a separate provenance identity/claim design rather than fake `auth.users` rows; this is part of Phase C.

---

# Phase B: media foundation

## `media_assets`

Canonical file/media metadata. Public presentation files and private evidence files share file identity concepts but **not** automatic visibility.

| Column | Type | Null | Notes |
|---|---|---:|---|
| `id` | `uuid` | no | PK |
| `owner_user_id` | `uuid` | yes | uploader/account; nullable only under deliberate retention/anonymization rules |
| `storage_bucket` | `text` | no | controlled server value |
| `storage_path` | `text` | no | unique within bucket |
| `media_kind` | enum/text | no | `image`, `document`, possibly `other` |
| `visibility_class` | enum/text | no | at minimum `public_presentation`, `private`, `sensitive_evidence` |
| `mime_type` | `text` | no | server-validated, not trusted from browser alone |
| `byte_size` | `bigint` | no | validated limit |
| `sha256` | `text` | yes | server-observed integrity hash where available |
| `width_px` | `integer` | yes | images |
| `height_px` | `integer` | yes | images |
| `created_at` | `timestamptz` | no | ingestion timestamp |

Rules:
- no permanent public URL is treated as authorization.
- sensitive originals/evidence live in private storage.
- public derivatives should not retain private EXIF/location metadata.
- storage object creation and DB row creation require a controlled workflow so users cannot claim arbitrary bucket objects.

## `record_media`

Associates presentation media with Archive Records.

| Column | Type | Null | Notes |
|---|---|---:|---|
| `id` | `uuid` | no | PK |
| `record_id` | `uuid` | no | FK Archive Record |
| `media_id` | `uuid` | no | FK media asset |
| `role` | enum/text | no | candidate `primary`, `gallery`; extensible later |
| `sort_order` | `integer` | no | default 0 |
| `caption` | `text` | yes | optional |
| `created_at` | `timestamptz` | no | system timestamp |

A private/sensitive evidence asset cannot become public merely by creating this relationship; publication workflow must validate its visibility class/approved derivative.

---

# Phase C: catalogue/source foundation

Planned tables:
- `manufacturers`
- `manufacturer_aliases`
- `game_systems`
- `game_system_aliases`
- `factions`
- `faction_aliases`
- `product_ranges`
- `catalogue_models`
- `catalogue_releases`
- `catalogue_aliases`
- `catalogue_evidence`
- `materials`
- `base_sizes`
- `record_sources`

Important boundary: catalogue describes the manufactured/reference identity; `miniature_details` describes the finished physical work. Catalogue incompleteness never blocks Record creation.

`record_sources` will support both a known catalogue source and free/non-catalogue source types (`third_party`, `printed`, `hand_sculpted`, `scratch_built`, `unknown`) without requiring fake catalogue rows.

---

# Phase D: Work History

Planned tables:
- `work_entries`
- `work_entry_media`
- `work_entry_paints`

Existing `paints` and `paint_conversions` are retained with stable IDs and backed up before cutover.

`work_entry_paints` records paint usage and `usage_role`; primer is not a special column on a miniature.

---

# Phase E: provenance, evidence and physical history

Planned tables/concepts:
- `record_history_events`
- `provenance_claims`
- `evidence_items`
- `claim_evidence`
- `attestations`
- `evidence_metadata_observations`
- `evidence_verification_sessions`

Evidence design must distinguish:
- user-reported `happened_at` / claimed dates
- system `created_at` / ingestion time
- metadata-observed capture timestamp
- source of each assertion
- evidence captured before vs after a reported loss
- public summary vs sensitive preserved evidence

Exact sensitive metadata/location storage is **not activated merely because tables exist**. Québec/privacy/legal review and purpose-specific consent are required before collection behavior is enabled.

---

# Phase F: Play History

Planned tables/concepts:
- `play_identities`
- temporal `record_representations`
- lightweight `play_sessions` (user-facing Game/Session)
- `play_participants`
- optional longer-running `play_contexts`
- `play_event_definitions`
- `play_events`
- event actor/target/participant relationships as required by final event primitive design
- `play_stories`
- Story-to-Record / Story-to-Play-Identity relationships

Store facts, not career totals. Stats are derived reporting.

The exact generic event primitive and whether longer-running contexts use one generic hierarchy remain open and must be stress-tested against 40K, Blood Bowl and D&D before SQL.

---

# Phase G: NFC, recovery and interaction

Planned tables/concepts:
- `nfc_identities`
- optional `nfc_carriers`
- `nfc_credit_ledger`
- short-lived/purgeable `pending_interactions`
- `recovery_cases`
- `recovery_scans`

Rules:
- public NFC token is high-entropy and unrelated to internal UUID/public Archive ID.
- ordinary NFC resolution does not retain location history.
- recovery-location collection exists only for an active recovery case.
- future collection-documentation physical-presence scans are a separate explicit purpose/workflow, not ordinary NFC analytics.

---

# Phase H: legal/privacy/insurance evidence services

Planned tables/concepts:
- `legal_documents`
- `legal_document_versions`
- `legal_acceptances`
- `consent_purposes`
- `user_consents`
- `evidence_sessions`
- `documentation_reports`
- immutable `documentation_report_snapshots`
- `disclosure_requests`
- `disclosure_authorizations`

Contract acceptance (Terms) and optional privacy consent are separate systems. Consent can be purpose-specific and withdrawn without pretending the historical acceptance never happened.

Evidence preservation and evidence disclosure are separate authorization boundaries.

---

# Phase I: notifications, disputes, moderation and audit

Planned tables/concepts:
- `notifications`
- `notification_deliveries`
- `notification_preferences`
- `disputes`
- `dispute_events`
- `abuse_reports`
- `moderation_cases`
- `moderation_actions`
- `audit_events`

Disputes challenge historical assertions. Abuse reports handle policy/safety issues. They may share admin tooling but not authoritative workflow/state.

---

# Phase J: subscriptions and commerce boundary

Planned tables/concepts:
- `plans`
- `entitlements`
- `account_entitlements`
- `subscriptions`
- `payment_provider_events`
- NFC credits remain a ledger in the NFC module

No raw payment card data. Provider webhooks are server-verified and idempotent.

---

# Security boundaries that affect table design

The schema is intentionally split so a public Archive query never needs access to sensitive evidence/account tables.

Initial security classes:

1. **Public reference**: catalogue/reference data explicitly intended for anonymous reads.
2. **Public Archive presentation**: restricted read models for published, non-suppressed Records and approved public media/profile fields.
3. **Owner-private**: drafts, private working data and user settings.
4. **Sensitive evidence**: receipts, original metadata, location-derived evidence, insurance/disclosure material. Never exposed through generic Record ownership policies.
5. **Security/operations**: NFC secrets, payment events, moderation internals, audit/security events. Server/admin-only except narrowly scoped user views/actions.

A user owning an Archive Record does **not** automatically receive SQL-level access to every sensitive object historically related to that Record. Authorization follows the specific data's purpose and relationship.

The mandatory pre-production adversarial security audit in `V2-ARCHITECTURE.md` is the final launch gate. RLS and cross-account tests should be written alongside each module instead of waiting for that audit.

---

# First implementation slice proposed

After review, the first migration should be intentionally boring:

1. required extensions/types for the foundation;
2. `profiles`;
3. `archive_records`;
4. `miniature_details` only after the small reference values it requires are resolved;
5. `record_relationships`;
6. initial ownership transaction model;
7. deliberate public profile/Archive read views;
8. grants + RLS + authorization regression tests in the same slice.

Media should follow immediately because Add Record requires photographs, but it should not be rushed into the identity migration before its private/public storage rules are explicit.

## Open decisions before first SQL

These are small enough to resolve during physical review rather than reopening the product architecture:

- public Archive ID format: numeric sequence rendered with formatting vs another human-facing scheme;
- exact handle rules;
- whether `physical_state` belongs on every Archive Record or only physical-work types;
- initial relationship vocabulary;
- initial ownership-event vocabulary/statuses and how first ownership is established;
- exact material/base-size reference shape needed by `miniature_details`;
- whether current game/faction belong directly in `miniature_details` or through reusable current affiliations;
- account deletion/anonymization mechanics for `owner_user_id` while preserving history.

Nothing in this document authorizes destructive changes to the current Supabase project.
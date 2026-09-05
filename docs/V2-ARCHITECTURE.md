# Mini Archive v2 Architecture

## Product principle

Mini Archive records individually identifiable physical miniature works and their histories.

- **Catalogue** describes what a product/source was when it entered the world.
- **Archive Record** describes the physical work as it exists.
- **Provenance** connects claims about that work to evidence.
- Source identity never dictates the finished work's game, faction, material, base, or artistic identity.

## Preservation and cutover boundary

The current Archive/NFC/game/timeline/profile content is prototype data and does not require migration compatibility. The existing `paints` and `paint_conversions` datasets are valuable and must be exported/backed up before any destructive cutover. Existing paint IDs remain stable.

The current `model_kits`, `miniatures`, `timeline_events`, and `timeline_subtasks` structures are not v2 foundations.

## 1. Archive Record root

`archive_records` is the ownership, visibility, publication, and authorization root.

Core fields:
- `id uuid` PK
- `archive_id text` unique, nullable until publication
- `owner_profile_id uuid` FK
- `record_type`: `miniature | group | diorama | other`
- `construction_type`: `standard | mostly_existing | multiple_kits | original` where applicable
- `title`, `subtitle`, `description`
- `status`
- `visibility`
- `started_at`, `completed_at`
- timestamps

Public Archive IDs are human-facing identifiers. UUIDs remain internal keys. Archive IDs are allocated atomically by PostgreSQL during publication, never with browser `COUNT + 1` logic.

## 2. Physical miniature details

`miniature_details` is a one-to-one extension of `archive_records` for individual miniature-specific physical/current attributes. `record_id` is both PK and FK.

Examples:
- current material
- current physical base size
- scale
- current game system
- current faction/affiliation
- painter profile or free-text painter attribution

These describe the finished physical work and are independent from its catalogue source.

## 3. Record relationships

`record_relationships` links finished Archive Records to other finished Archive Records.

Fields include parent record, child record, relationship type, `started_at`, `ended_at`, and notes.

Relationships preserve history rather than overwriting membership. A miniature keeps one Archive ID while joining/leaving groups, units, or displays.

Source/component relationships are not stored here; they belong to `record_sources`.

## 4. Catalogue and taxonomy

V2 replaces `model_kits` with a manufacturer-agnostic catalogue hierarchy:

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

A catalogue model represents a model/design identity. Releases/castings represent historically distinguishable production forms such as material, supplied base, SKU, release period, packaging, and other provenance-bearing attributes.

Unknown values remain unknown. Catalogue completeness must never block Archive Record creation.

## 5. Construction sources

`record_sources` bridges a finished Archive Record to what it was made from.

A source can reference a known catalogue model/release or represent a non-catalogue source such as:
- third-party component
- 3D-printed component
- hand-sculpted component
- scratch-built component
- unknown source

Construction modes presented to users are:
1. Existing / Standard model
2. Mostly an existing model
3. Built from multiple kits
4. Original creation

No percentages or mandatory primary source are required for multi-kit work.

## 6. Provenance and ownership

Physical history and documentation claims are modeled separately.

- `provenance_claims`
- `provenance_evidence`
- `ownership_events`

Claims support verification states such as `unverified`, `supported`, `conflicting`, and `verified`, plus optional confidence. Evidence can include photos, receipts, auction listings, certificates, markings, packaging, catalogue references, or prior Mini Archive transfers.

Ownership events represent actual asserted ownership history. Editing an ownership claim is an audit event, not itself an ownership transfer.

## 7. Work Log

- `work_entries`
- `work_entry_paints`
- `work_entry_media`

Work entries retain the useful existing concepts: Assembly, Surface Prep, Paint, Basing, Varnish, Repair, Completed, and Other.

Paint product identity is separate from usage. A coloured primer and an ordinary paint may intentionally share a colour/hex while remaining separate products. Usage roles such as Primer, Basecoat, Layer, Highlight, Shade, etc. belong to `work_entry_paints` rather than dedicated basecoat columns.

The existing `paints` and `paint_conversions` reference data survives v2 intact. `paint_role` is not treated as a canonical v2 taxonomy.

## 8. Physical Record History

`record_events` represents events that happened to the physical work, including exhibitions, competitions, damage, restoration, discoveries, and other notable provenance events.

Games remain specialized structured data rather than generic record-event JSON.

## 9. Game history

Game storage is normalized while preserving the existing fast logging UX:

- `game_sessions`
- `game_rounds`
- `game_participants`
- `game_tallies`

A casual/matched/campaign game is a session with one round. A tournament is one session with tournament metadata and multiple rounds. Participation attaches to Archive Records generally, allowing groups/units or individuals to participate without miniature-specific foreign keys.

## 10. Media and storage

Media is represented centrally rather than scattering permanent URLs through unrelated tables:

- `media`
- `record_media`
- `work_entry_media`
- `evidence_media`
- `event_media`

Storage policy must enforce uploader/record ownership, MIME restrictions, and file-size restrictions. Draft/private media must not become public merely because a bucket URL is known. Published-media delivery and private/in-progress media are deliberately separated by policy or bucket strategy.

## 11. NFC and recovery

NFC tags attach to Archive Records, not miniature-specific rows.

`nfc_tags` includes:
- `id uuid` PK
- `token text` unique
- `record_id uuid` FK, nullable while inventory is unassigned
- tag status such as `inventory | assigned | active | revoked | replaced`
- optional order/order-item provenance for Mini Archive-sold tags
- timestamps including assignment, activation, first scan, and revocation as appropriate

The NFC token is independent from both the internal UUID and public Archive ID. A physical tag can therefore be manufactured and sold before it is assigned to a Record.

Tag activation/claiming must verify that the authenticated purchaser/recipient is entitled to claim the tag. Replacement or revocation must preserve the historical association rather than silently recycling a token.

### Missing/stolen recovery

Location collection is not general NFC analytics. It is activated for an open recovery case.

`record_recovery_cases` includes:
- record
- reporting profile
- case type: `missing | stolen`
- reported/resolved timestamps
- notes/status

`recovery_scan_events` includes:
- recovery case FK
- NFC tag FK
- scan timestamp
- IP-derived approximate city/region/country where available
- location method
- optional precise-location request/grant state
- optional device latitude/longitude/accuracy only when the scanner explicitly grants browser geolocation permission

Normal NFC scans resolve the Archive Record without creating a retained location history. When a Record is actively missing/stolen, the initial request may create a recovery scan using approximate IP-derived location before any optional browser geolocation prompt. Precise device location is never inferred from IP data.

Recovery scans are a specialized event stream and are not duplicated into `record_events`; the UI may present significant recovery events in a unified history view.

## 12. Edit/audit history

`record_audit_log` records changes to documentation:
- record
- actor
- action
- entity type/id
- structured changes
- timestamp

Audit history is distinct from Work Log, physical Record History, games, provenance, and ownership history.

## 13. Privacy and compliance architecture

Privacy requirements are part of v2 schema design rather than post-launch documentation.

Principles:
- privacy-protective defaults
- purpose limitation and data minimization
- public Archive data separated from private account information
- no routine NFC location retention
- recovery location collected only for an active missing/stolen recovery purpose
- precise browser/device geolocation requires explicit permission
- retention/deletion rules defined for personal and recovery data
- account access/export/deletion must be supportable
- optional/non-essential processing is separated from service-essential processing
- aggregated/anonymized hobby statistics may be derived later without making identifiable-user surveillance the product

Consent/versioning support should include a small `legal_documents` / `user_consents` model where explicit acceptance is actually required, recording document/purpose version, user, timestamp, and withdrawal where applicable. Do not use one perpetual consent flag for unrelated future purposes.

Before production cutover, maintain an inventory mapping personal-data fields to purpose, visibility, retention, and deletion behavior. Privacy/Terms copy must describe actual implemented behavior.

## 14. Monetization, subscriptions, and commerce

V2 must support monetization without embedding one payment processor's object model throughout Archive data.

### Plans and subscriptions

Use an internal entitlement model:

- `plans` defines Mini Archive plan identities and display metadata.
- `plan_entitlements` defines capabilities/limits granted by a plan.
- `subscriptions` links an account to a plan and stores provider-neutral billing state plus external provider/customer/subscription identifiers.
- optional `subscription_events` records important billing lifecycle changes/webhook processing for idempotency/audit.

Application features should ask **what the account is entitled to do**, not contain scattered checks such as `if plan = premium`. This allows future paid features, grandfathered users, promotions, lifetime/supporter tiers, or a change of billing provider without redesigning Archive Records.

Potential entitlements can include limits or capabilities such as Record count, storage, private Records, enhanced provenance/recovery features, exports, advanced statistics, or other future features. The architecture does not decide which existing core features will be paywalled.

Billing-provider identifiers and financial state remain private account data. Mini Archive should not store raw payment-card details; payment collection belongs to a compliant external payment provider.

Subscription cancellation, expiration, payment failure, refunds, trials, and grace periods must not destroy user Archive data. Entitlement loss changes access/capabilities according to product policy; it does not cascade-delete Records or media.

### NFC tag commerce

Physical NFC tag purchasing is separate from subscription billing even if the same payment provider is eventually used.

Commerce foundation:
- `products` for sellable Mini Archive products
- `product_variants` for physical variants/SKUs where needed
- `orders`
- `order_items`
- `order_addresses` or equivalent immutable shipping snapshot
- `payments` / provider transaction references as required
- `fulfillments` for shipment state/tracking
- optional `refunds` where provider synchronization requires local representation

An NFC tag sold through an order can be linked from the physical `nfc_tags` inventory row to its order item. This supports inventory -> sold -> shipped -> claimed -> assigned -> active -> replaced/revoked history.

Order records must preserve purchase history even if product names/prices later change. Order items therefore store transactional snapshots such as product description, quantity, unit amount, currency, taxes/discounts where applicable, rather than relying only on the current product catalogue.

Shipping/billing addresses and payment-provider identifiers are private commerce data and are never exposed through public profiles or Archive Records. Retention/deletion behavior must account for legitimate accounting, tax, fraud, refund, and legal obligations rather than treating all commerce data like ordinary profile data.

### Payment-provider boundary

The database remains provider-neutral at the Archive/domain layer. A future Stripe, PayPal, Shopify, or other integration maps provider objects/events into Mini Archive subscription/order/payment state through a small integration boundary. Webhooks must be authenticated, idempotent, and recorded sufficiently to prevent duplicate fulfillment or entitlement changes.

Do not make a successful browser redirect the authoritative proof of payment. Server-verified provider events/state control paid entitlements and order fulfillment.

## 15. Security and database invariants

Every new v2 table is created with its security/integrity model in the same migration:
- PKs
- FKs and deliberate deletion behavior
- unique/check constraints
- indexes for FKs/query paths
- explicit grants
- RLS enabled
- RLS policies using optimized ownership checks

`archive_records` is the authorization root for record-owned child data. Anonymous users receive only deliberate public read access. Authenticated ownership does not imply blanket write access to reference/catalogue tables.

Commerce and subscription writes are especially restricted: clients may read only their own appropriate account/order/subscription state, while authoritative payment, fulfillment, entitlement, and provider-event mutations occur through trusted server-side paths.

Public-facing views must not accidentally bypass underlying RLS. Security-definer functions are used only where required, with tightly scoped execution grants and pinned/qualified object access.

## 16. Public read/SEO model

The application and Cloudflare Worker should eventually consume a deliberate public Archive read model/view rather than independently reconstructing visibility rules from prototype tables. It must expose only fields appropriate for published public Records and support record metadata, archive browsing, profiles, structured data, and sitemap generation.

## 17. Cutover sequence

1. Export and independently back up `paints` and `paint_conversions`.
2. Review/approve physical v2 SQL before applying it.
3. Create v2 foundation tables, constraints, indexes, grants, and RLS in small migrations.
4. Build the new Add/Edit Record workflow against v2.
5. Migrate record/archive/profile views.
6. Migrate media, Work Log, paint usage, physical history, games, audit history, NFC, and recovery.
7. Add monetization foundations before any paid launch: entitlement model, subscription provider boundary, commerce/order model, NFC inventory/claim lifecycle, and secure webhook processing.
8. Update Worker SEO/sitemap reads.
9. Test authorization, privacy behavior, recovery flows, deletion/export, commerce isolation, entitlement changes, webhook idempotency, and public/private media.
10. Cut over.
11. Remove obsolete prototype tables only after successful cutover.

No destructive production mutation should occur merely by documenting this architecture.

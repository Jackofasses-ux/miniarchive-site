# Mini Archive v2 Architecture

## Product principle

Mini Archive records individually identifiable physical miniature works and the stories they accumulate.

**Every miniature has a story** means more than modelling and painting. Mini Archive should be able to preserve what a miniature is, where it came from, who owned and used it, what or whom it represented, when and where it was used, what happened during those moments, and how all of those facts changed over time.

- **Catalogue** describes the identifiable manufactured model/sculpt/release.
- **Archive Record** is the permanent identity of the physical work.
- **Provenance** preserves claims, evidence, attestations, transfers, and uncertainty about that work.
- **Work History** records what was physically/artistically done to it.
- **Play History** records how it was used in games, campaigns, sessions, leagues, role-playing, and other play contexts.
- Source identity never dictates the finished work's game, faction, material, base, artistic identity, or represented identity.

Depth is optional. A user must still be able to photograph a miniature, name it, and create a Record without understanding the catalogue or filling out a database. Catalogue incompleteness and uncertain history must never block Record creation.

## Preservation and cutover boundary

The current Archive/NFC/game/timeline/profile content is prototype data and does not require migration compatibility. The existing `paints` and `paint_conversions` datasets are valuable and must be exported/backed up before any destructive cutover. Existing paint IDs remain stable.

The current `model_kits`, `miniatures`, `timeline_events`, and `timeline_subtasks` structures are not v2 foundations.

## 1. Archive Record root and permanence

`archive_records` is the identity, publication, and authorization root for a physical archived work.

Core concepts include:
- internal UUID primary key
- permanent human-facing `archive_id`, allocated atomically at publication
- current owner/account relationship
- structural record type: `miniature | group | diorama | other`
- construction type where applicable: `standard | mostly_existing | multiple_kits | original`
- title, subtitle, description
- draft/published archival lifecycle
- physical/history state where appropriate
- timestamps

### Public and permanent Archive rule

A draft may remain private because it has not yet entered the Archive. A legitimately published Archive Record is public and is not ordinarily delisted, made private, or deleted by its owner. Selling, transferring, losing, recovering, damaging, destroying, repainting, or retiring the physical miniature changes its history; it does not create a reason to erase its Archive identity.

Account deletion must not cascade-delete published Archive Records or their legitimate historical facts. Ownership/account attribution may need transfer, detachment, or anonymization according to the eventual account-deletion policy.

Permanence does **not** require Mini Archive to continue publicly serving abusive, illegal, malicious, privacy-violating, or incorrectly published content. Moderation may suppress media/text or, exceptionally, suppress public presentation of a Record while preserving its Archive ID and administrative/audit history. Archive IDs are never silently recycled.

Public Archive data is distinct from private account, billing, recovery-location, moderation, evidence, and security data.

## 2. Physical miniature details

A one-to-one physical-details extension may hold individual-miniature attributes such as current material, current physical base size, scale, current game/faction affiliation, and painter attribution.

These describe the physical finished work now and are independent from catalogue source facts. Important changes can become Work/Record History rather than requiring every current-state field to have a bespoke history table.

## 3. Record relationships

Relationships link finished Archive Records to other finished Archive Records and may preserve start/end history where meaningful, for example group/unit/display membership.

A miniature keeps one Archive ID while joining or leaving groups or displays. Source/component relationships are separate from finished-record relationships.

Do not over-generalize representation: a miniature representing Thorin does not separately "represent" Thorin's class, party, faction, or role. Those are properties/relationships of the represented play identity.

## 4. Catalogue and taxonomy

V2 replaces `model_kits` with a manufacturer-agnostic catalogue/reference model. Exact physical tables remain subject to physical-schema review, but the catalogue must be capable of representing:
- manufacturers and aliases
- game systems and aliases
- factions/affiliations and aliases
- product ranges where useful
- catalogue models/sculpts/design identities
- historically distinguishable releases/castings/revisions
- aliases and supporting evidence

### Catalogue scope rule

Mini Archive is not attempting to reconstruct every retailer bundle, battalion box, army box, packaging variation, or individual bit.

A model appearing unchanged in multiple retail boxes does not create multiple model identities. Retail packaging/set information is worth modelling only when it materially helps identify or distinguish the physical miniature, such as an exclusive sculpt or identifiable production difference.

A release/revision is worth distinguishing when the physical model or supplied kit changed in a way that helps identify, date, or authenticate the miniature: sculpt, material, meaningful component/sprue revision, supplied base, or another identifiable production characteristic. A mere cardboard/package change normally is not.

The same sculpt may be used in multiple products without becoming multiple sculpts. Mini Archive does not catalogue individual weapon/claw/bit inventory simply because a kit offered multiple build options.

Unknown values remain unknown. Catalogue completeness must never block Archive Record creation.

## 5. Construction sources

`record_sources` bridges a finished Archive Record to what it was made from.

A source may reference a known catalogue model/release or a non-catalogue source such as third-party, 3D printed, hand-sculpted, scratch-built, or unknown material/component.

Construction modes presented to users are:
1. Existing / Standard model
2. Mostly an existing model
3. Built from multiple kits
4. Original creation

No percentages or mandatory primary source are required for multi-kit work. The catalogue is not polluted with every random conversion bit.

## 6. Provenance, ownership, claims, and trust

Mini Archive preserves provenance; it does not promise omniscient historical authentication.

The architecture must distinguish:
- historical/provenance claims
- evidence supporting or conflicting with claims
- attestations/confirmations by involved users
- ownership/transfer events
- actions Mini Archive itself can prove occurred inside the service

Do not present one mysterious `verified` flag as if Mini Archive independently authenticated every historical fact. Trust should be descriptive. Useful concepts include:
- **self-reported**
- **supported by evidence**
- **corroborated**
- **participant-confirmed**
- **system-recorded** (Mini Archive can prove the platform transaction/action occurred)
- **disputed**

For example, Mini Archive can prove that two authenticated accounts completed an Archive ownership transfer through Mini Archive. That does not prove the complete legal ownership history of the physical object before the transaction.

Evidence may include photos, receipts, auction listings, certificates, competition records, publications, markings, packaging, catalogue references, URLs/documents, prior owner attestations, and prior Mini Archive transactions.

Historical uncertainty is allowed. V2 does not need a complex fuzzy-date system initially; normal partial/approximate user-entered dating is sufficient unless catalogue/provenance use demonstrates a stronger need.

### Ownership transfers

Ownership changes should be explicit transactions rather than arbitrary edits to an owner field. A requested transfer remains pending until the appropriate receiving party accepts it. Completed transfers become durable history and are not casually rewritten or deleted.

Ownership and edit permission are conceptually distinct even if initial V2 ships with a simple owner model. The physical schema should not make future delegated/collaborative management impossible.

## 7. Work Log

Work History preserves Assembly, Surface Prep, Paint, Basing, Varnish, Repair, Completed, and Other entries with optional time, notes, media, milestones, and paint usage.

Paint product identity is separate from usage. A coloured primer and an ordinary paint may intentionally share a colour/hex while remaining separate products. Usage roles such as Primer, Basecoat, Layer, Highlight, Shade, etc. belong to work-entry paint usage rather than dedicated basecoat columns.

The existing `paints` and `paint_conversions` reference data survives v2 intact. Existing IDs remain stable and `paint_role` is not treated as a canonical v2 taxonomy.

## 8. Physical Record History

Physical Record History represents meaningful events that happened to the physical work: ownership changes, exhibitions, competitions, damage, restoration, discovery, recovery, and other provenance-bearing events.

This is distinct from Work History, Play History, and Edit/Audit History even if the UI later assembles all of them into a unified chronological "life of this miniature" presentation.

## 9. Play History: game-agnostic foundation

V2 must not assume every miniature is used in a Warhammer-style match. "Game History" is therefore broadened to **Play History**.

Play History must support, without forcing every feature on every system:
- traditional wargame matches
- tournaments
- Blood Bowl-style leagues/seasons and sport-like events
- narrative campaigns
- role-playing campaigns and sessions
- other tabletop/play contexts

Mini Archive should understand Records, Play Identities, contexts/sessions, structured events, and Stories. Individual game systems can provide vocabulary and suggested event/stat types rather than requiring hard-coded universal concepts such as kills, wounds, victory points, or rounds.

### Play contexts and sessions

The physical schema should support optional longer-running contexts such as Campaign, League, Season, Adventure, Crusade, or Tournament and the sessions/games that occur within them. User-facing vocabulary may be game-system-specific.

Ruleset/edition may be optional context, for example `D&D 5e` or `Warhammer 40,000 3rd Edition`, because it can enrich historical context. Mini Archive does not need to validate, calculate, or convert rules.

### Play Identities / represented characters

A persistent represented identity can be distinct from a physical Archive Record. This is particularly important for role-playing and campaign play.

Example: a user's D&D character Thorin may be represented by Miniature A for two years and Miniature B afterward. Thorin's character/play history follows Thorin, while each physical Archive Record accurately preserves when it represented him.

Personal/play identities are scoped entities identified internally by IDs, never by display name. Two users may both have a character named Thorin without any data collision. Names are labels for people; IDs identify entities to Mini Archive.

Published/canonical characters and personal/homebrew play identities have different authority and should not be conflated merely because both are "characters." Shared canonical reference identity may be useful for published characters; personal identities belong to their user/play context.

Play Identity state may optionally include system-specific current-state data and historical snapshots so a character's progression can be shown. Mini Archive may record entered character-sheet/state information without becoming a rules engine. It does not need to calculate armor class, spell slots, legality, or system mechanics.

### Structured play events

The canonical interaction term is not `kill`. A Warhammer-like system may present **Defeat / Defeated by**, because removal from play does not imply fictional death. Other systems may use different event vocabulary: Blood Bowl may care about touchdowns and casualties, while an RPG may rely far more heavily on narrative Stories.

Structured event definitions must therefore be extensible/game-aware. Some events have an actor and target (defeat/casualty); some have only an actor (touchdown); future event types may involve multiple participants. The physical schema should not require a database migration for every new game's vocabulary.

Verification describes who confirmed an event, not Mini Archive certifying objective truth. An event involving another user's Record may be participant-confirmed. NFC is an optional fast resolver, never the underlying identity or a requirement.

### Stories

"Battle Stories" is broadened to **Stories / Play Stories**. Stories capture why a moment was memorable when structured statistics are inadequate or irrelevant.

Stories may:
- exist with or without a structured event
- exist with or without a formal session/game
- reference multiple Archive Records and/or Play Identities
- optionally belong to a campaign/context/session
- optionally link to Work entries when play inspired a physical modification

Initial design limits remain:
- title: 100 characters
- story: 1,500 characters

The intent is digestible anecdotes, not full battle-report storage.

## 10. Media and evidence storage

Media/attachments should be represented centrally enough to support Record photos, Work History, Stories, provenance evidence, moderation, and future non-image evidence without scattering permanent URLs through unrelated tables.

Storage policy must enforce uploader authorization, MIME restrictions, file-size restrictions, and deliberate public/private delivery. Draft uploads and private evidence/account material must not become public merely because a bucket URL is known.

Published Archive presentation is public, but that does not make every underlying receipt, evidence document, account artifact, or moderation attachment public.

## 11. NFC identity, activation credits, and optional physical carriers

NFC is a doorway into an Archive Record, not a separate archive or a requirement for core functionality.

The architecture distinguishes:
1. **NFC activation credit**: entitlement consumed to provision an NFC identity.
2. **NFC identity/token**: permanent digital identity resolving to an Archive Record.
3. **Physical carrier/tag**: optional hardware containing that identity URL; may be user-supplied or an official Mini Archive product.

A user may purchase/earn activation credits and write Mini Archive-generated URLs to their own compatible NFC tags. Mini Archive does not need to sell physical tags for the activation model to work.

Credits use a traceable ledger rather than a magic integer balance. Sources can include signup grants, recurring subscription grants, purchased packs, promotions/referrals, gifts, or physical-product purchases. One activation consumes one activation credit regardless of the dollar price at which that credit was acquired.

Current product direction favors one permanent free activation on signup and recurring subscription grants that accumulate/roll over, with exact quantities/pricing deferred. Earned credits are not active-tag slots. Subscription lapse does not deactivate already-provisioned NFC identities or dead-link tagged miniatures.

NFC public tokens are independent from internal UUIDs and public Archive IDs and must not expose account/internal Record UUIDs.

### Two-tap/target interactions

On iPhone/Safari, core NFC workflows must not depend on Web NFC. An authenticated user can begin a pending interaction from Record A, then physically tap Record B's normal HTTPS NFC tag. The second navigation resolves Record B server-side and completes/continues the pending interaction. Archive ID/search provides a non-NFC alternative.

### Missing/stolen recovery

Location collection is not general NFC analytics. It activates only for an open missing/stolen recovery case.

Normal NFC scans resolve the Archive Record without creating retained location history. During an active recovery case, the request may create a recovery scan with approximate IP/network-derived city/region/country. The page may separately request precise browser/device geolocation; precise location is stored only if the scanner explicitly grants permission.

Once the recovery case is resolved, ordinary scans return to non-location behavior. Raw IP retention should be minimized/avoided where practical; public language must distinguish approximate network location from GPS.

## 12. Notifications and delivery preferences

V2 needs shared notification infrastructure because ownership transfers, play-event confirmations, Record mentions/references, recovery scans, disputes, campaign/shared-play activity, NFC/account events, and future workflows can require asynchronous user attention.

Notifications are durable in-app objects, surfaced through a navbar notification control with unread state/count and a notification center/dropdown.

Separate concepts:
- **notification**: what happened and which user needs to know
- **delivery**: attempts/results for channels such as email
- **notification preferences**: which optional categories/channels the user wants

A notification references the authoritative object/action that caused it rather than duplicating that object's full state. Opening an old notification therefore resolves to the current transfer/dispute/event/recovery state.

In-app actionable notifications generally should not disappear merely because email is disabled. Exact preference flags and which transactional/security/recovery notifications are mandatory or default-on are implementation decisions to review later.

Notification preferences are not the same thing as privacy/security settings.

## 13. Disputes, reports, and trust correction

Permanent Archive history does not mean every assertion is immutable truth.

The architecture must allow appropriate claims, relationships, play events, provenance assertions, or transactions to be challenged without requiring a bespoke dispute table for every domain. A dispute points to the authoritative object being challenged and may carry evidence, participants, status, and resolution history.

A disputed assertion can be visibly marked as disputed rather than silently erased. Resolution vocabulary and escalation rules are deferred, but may eventually include upheld, corrected, retracted, invalid/malicious, or unable to determine.

Most historical disputes should not require Mini Archive staff to determine objective truth. The system can preserve competing claims/evidence and describe their support/attestation. Human/admin intervention should focus on abuse, fraud attempts, impersonation, account compromise, malicious dispute behavior, or cases where platform action is actually necessary.

**Disputes are distinct from abuse reports.** A provenance disagreement is not the same thing as reporting pornography, harassment, stolen media, illegal content, spam, or other policy violations, even if both eventually surface in one admin interface.

## 14. Moderation and abuse resistance

A permanent public Archive must assume malicious uploads and abuse will eventually occur.

V2 should provide attachment points for moderation without committing to a specific AI/moderation vendor. The preferred model is layered:
- validation and rate limits before expensive moderation
- automated screening at upload/publication/change where appropriate
- allow/block/review outcomes
- community/user reporting after publication
- automated triage and abuse-pattern detection where useful
- limited human/admin escalation for ambiguous or serious cases
- auditability and an eventual appeal/correction path

Moderation state is separate from archival publication/lifecycle state. A published Archive identity may remain permanent while offending media/text is blocked or the public presentation is administratively suppressed.

Potential automated screening can eventually include explicit sexual content, spam, clearly irrelevant/non-miniature uploads, harassment/hateful content requiring contextual review, suspicious provenance spam, repeated stolen media, malicious Stories, and coordinated abuse. AI moderation is a tool/signal, not an infallible historical or policy authority.

Non-AI controls should include appropriate upload type/size validation, verified-account requirements where useful, rate limits, new-account publishing controls, abuse throttling, account suspension, audit logs, and secure API/RLS enforcement.

## 15. Edit/audit history

Audit history records changes to documentation and sensitive workflows with actor, action, target entity, structured changes where appropriate, and timestamp.

Edit/Audit History is distinct from Work History, Physical Record History, Play History, provenance, ownership history, notifications, disputes, and moderation cases.

## 16. Privacy, account, and compliance architecture

Privacy requirements are part of v2 schema design rather than post-launch documentation.

Principles:
- privacy-protective defaults for private/account data
- purpose limitation and data minimization
- published Archive Records are public and permanent by product design
- private account/payment/security/evidence data remains separated from public Archive data
- no routine NFC location retention
- recovery location collected only for active missing/stolen recovery purposes
- precise browser/device geolocation requires explicit permission
- notification/email preferences are separate from Record publication
- personal-data retention/deletion rules are defined without cascading away permanent Archive history
- account access/export/deletion must be supportable
- optional/non-essential processing is separated from service-essential processing
- aggregated/anonymized hobby statistics may be derived later without making identifiable-user surveillance the product

Consent/versioning should use explicit purpose/document version records where acceptance is actually required rather than one perpetual consent flag.

Before production cutover, maintain an inventory mapping personal-data fields to purpose, visibility, retention, and deletion behavior. Privacy/Terms copy must describe actual implemented behavior.

## 17. Monetization, subscriptions, and commerce

V2 supports monetization through provider-neutral plans/subscriptions/entitlements and NFC activation credits without embedding one payment processor throughout Archive data.

Application features ask what an account is entitled to do rather than scattering plan-name checks. Subscription cancellation/payment failure must not destroy Archive data or deactivate permanent NFC identities already earned/activated.

Payment collection belongs to a compliant external provider; Mini Archive does not store raw card details. Server-verified provider events/webhooks are authoritative and idempotent; browser success redirects are not proof of payment.

Optional physical Mini Archive NFC products may later use ordinary product/order/fulfillment concepts, but digital NFC activation does not depend on Mini Archive selling or shipping hardware.

## 18. Security and database invariants

Every new v2 table is created with its security/integrity model in the same migration:
- primary/foreign keys and deliberate deletion behavior
- unique/check constraints
- indexes for foreign keys/query paths
- explicit grants
- Row Level Security (RLS) enabled where exposed
- optimized policies and deliberately restricted trusted functions

`archive_records` remains the authorization anchor for Record-owned content, but ownership must not be confused with every future permission/role. Anonymous users receive deliberate public read access to published Archive data. Authenticated ownership does not imply blanket write access to reference/catalogue data.

Historical data must use deliberate deletion semantics. Do not casually `ON DELETE CASCADE` ownership transfers, attestations, verified interactions, disputes, or other history merely because an account or related object changes state.

Public views must not accidentally bypass underlying RLS. Security-definer functions are used only where required with tightly scoped execution grants and qualified object access.

### Mandatory pre-production security audit and launch gate

A formal security audit is a **hard launch gate** for v2 before meaningful public adoption or storage of sensitive evidence. It is not an optional post-launch cleanup task and must be repeated after material changes to authentication, authorization, evidence/location handling, NFC security, billing, storage, or other sensitive boundaries.

The audit must deliberately attempt to break Mini Archive rather than merely confirm that security features are enabled. At minimum it must cover:
- anonymous access to data, APIs, RPCs, storage, and public read models
- authenticated cross-account access: User A attempting to read, modify, delete, transfer, or enumerate User B's private data
- complete RLS and explicit-grant review for every exposed table/view/function
- `SECURITY DEFINER`, service-role, privileged server function, and privilege-escalation review
- public/private storage bucket policies, signed URL expiry, object enumeration, malicious upload, MIME/type/size validation, and unauthorized original-file/evidence access
- separation of public Archive presentation from private account, receipt, evidence, EXIF/location, moderation, recovery, billing, and security data
- secrets and credential exposure, including ensuring privileged/service credentials never reach browser code or repository history
- authentication/session controls and account-recovery abuse paths
- NFC public-token unpredictability, enumeration, replay/interaction abuse, reassignment, transfer, missing/stolen, and evidence-related attack paths
- IDOR/BOLA-style authorization failures across all object identifiers
- API/RPC abuse, rate limiting, automated enumeration/scraping of non-public resources, and resource-exhaustion paths
- ownership transfer, account deletion/anonymization, Record transfer, moderation, dispute, and entitlement edge cases
- payment/webhook authenticity, replay protection, idempotency, and privilege changes caused by billing events
- audit-log integrity and access controls
- dependency and supply-chain vulnerability review
- database backup, export, log, and operational-data protection so security is not limited to the live application
- privacy/data-minimization review for sensitive evidence and location data
- incident detection, logging, alerting, containment, recovery, and a documented breach-response procedure

Security tests should include automated regression coverage where practical, especially RLS/cross-account authorization tests, so fixed vulnerabilities do not silently return.

No audit can establish that Mini Archive is "unhackable." The launch criterion is that known critical/high-risk findings are remediated, sensitive boundaries have been adversarially tested, and any accepted residual risks are explicitly documented rather than accidentally ignored.

As Mini Archive grows and begins holding meaningful volumes of sensitive user/evidence data, an independent professional penetration test/security review should become an additional release/operational requirement rather than relying solely on internal testing.

## 19. Public read, unified history, and SEO

The application and Cloudflare Worker should eventually consume a deliberate public Archive read model rather than independently reconstructing publication rules from prototype tables.

The Record page may assemble a unified chronological "life of the miniature" from catalogue context, Work History, Physical Record History, Play History, Stories, representation relationships, ownership/provenance, and recovery milestones without forcing all of those facts into one monster timeline table.

Public read models must support Record metadata, Archive browsing, profiles, structured data, and sitemap generation while excluding private account/evidence/recovery/moderation information.

## 20. Physical-schema design rules and open implementation questions

Conceptual entities in this document do not automatically imply one physical PostgreSQL table each. During physical design, consolidate concepts only where they genuinely share lifecycle, security, constraints, and query behavior. Do not consolidate merely to reduce table count.

Before SQL is approved, stress-test the reusable primitives against at least:
- standard miniature with simple catalogue source
- converted/multi-kit miniature
- old miniature with uncertain provenance
- model with a physically meaningful kit/release revision
- group/unit and diorama membership over time
- ownership transfer and account deletion
- Warhammer-style game with a participant-confirmed defeat
- Blood Bowl-style touchdown/casualty vocabulary
- D&D character represented by multiple physical miniatures over time
- long-running campaign with character-state snapshots and Stories
- missing/stolen NFC recovery
- malicious upload/report/moderation suppression
- disputed provenance/transaction

Still-open implementation details should be reviewed rather than silently invented, including exact notification preference flags, dispute-resolution states, moderation thresholds/providers, collaborative permissions, exact Play Identity/state representation, and which game-system configuration belongs in reference data versus application code.

## 21. Cutover sequence

1. Export and independently back up `paints` and `paint_conversions`.
2. Translate this conceptual architecture into a concrete physical-schema proposal: exact tables/columns/types, constraints, indexes, deletion behavior, RLS/grants, trusted functions, storage policy, notification/dispute/moderation boundaries, and public read models.
3. Review the physical schema before applying production mutations.
4. Create v2 foundations in small atomic migrations/commits.
5. Build the new Add/Edit Record workflow against v2 while preserving the low-friction creation experience.
6. Migrate public Record/archive/profile reads and media/Work/paint functionality.
7. Implement Physical History, Play History/Stories/Play Identities, ownership/provenance, notifications, disputes/reporting hooks, audit history, NFC activation/recovery, and account/privacy foundations in staged increments.
8. Add monetization foundations before any paid launch: entitlements/subscriptions, NFC credit ledger, provider boundary, and optional commerce support.
9. Update Worker SEO/sitemap reads.
10. Run the mandatory pre-production security audit in Section 18, including adversarial authorization/privacy/storage/NFC/billing testing and regression coverage. Remediate critical/high-risk findings before launch.
11. Cut over only after the security launch gate passes.
12. Remove obsolete prototype tables only after successful cutover.

No destructive production mutation should occur merely by documenting this architecture.
# Mini Archive V2 Schema Stress Test

**Status:** active design test. This document records scenarios that expose weaknesses in the proposed V2 schema before SQL migrations are written.

## Result vocabulary

- **PASS** — naturally represented by the current architecture.
- **EXTENSION** — a new module/table can be added without restructuring the foundation; this is a successful modularity result.
- **AWKWARD** — representable only by abusing generic notes/JSON, duplicating facts, or using a structure that does not naturally express the history.
- **FAIL** — a fundamental fact has no proper structural home or requires redesign of foundational assumptions.
- **NEEDS DESIGN** — the architecture has an appropriate attachment point, but rules/security/identity semantics are not yet resolved.

Findings are accumulated before schema changes are made so multiple failures can be solved coherently rather than by adding one-off columns.

---

## Scenario 01 — ordinary self-painted miniature

A user buys a boxed miniature, builds it mostly as intended, paints and bases it over several sessions, photographs it, publishes it, and later NFC-tags it.

### Findings

| Fact / requirement | Current home | Result | Notes |
|---|---|---|---|
| Permanent physical/archive identity | `archive_records` | PASS | Stable foundation. |
| Public Archive ID | `archive_records.archive_id` | PASS | Assigned at publication. |
| Current owner | `archive_records.owner_user_id` | PASS | Convenience pointer, not history. |
| Ownership history | `ownership_events` | PASS | Historical ledger. |
| Individual miniature type | `archive_records` + `miniature_details` | PASS | Root + type extension works. |
| Manufactured source | catalogue + `record_sources` | PASS | Source is separate from finished work. |
| Photos | `media_assets` + `record_media` | PASS | Public/private boundary remains applicable. |
| Work sessions | planned `work_entries` | PASS | Creation/process history has a home. |
| Paint usage | planned `work_entry_paints` | PASS | Existing paint reference data can attach. |
| Painter attribution | none | **FAIL** | Ownership does not imply authorship. |
| Assembly attribution | none | **FAIL** | Same missing contributor concept. |
| Basing attribution | none | **FAIL** | Same missing contributor concept. |
| NFC identity | planned NFC module | EXTENSION | Attaches without changing Archive identity. |

### Failure cluster A — contributors / authorship

The schema needs a generic contributor/credit model rather than a hard-coded `painted_by` column. It must support multiple roles, multiple people, external/non-account people, Record-level attribution, and Work-entry attribution.

Do **not** finalize the table shape until later scenarios test collaboration, commissions, restoration, disputed attribution, account deletion, and identity linking.

---

## Scenario 02 — commissioned / multi-contributor miniature

The owner did not create the work. An external painter painted it, another external person converted it, neither initially has a Mini Archive account, and one later creates an account.

| Requirement | Result | Notes |
|---|---|---|
| Owner differs from painter | **FAIL under current draft** | Solved conceptually by contributor module, not by ownership fields. |
| Multiple contributors with different roles | **FAIL under current draft** | Requires generic contributor roles/credits. |
| Credit a person with no account | **FAIL under current draft** | Contributor identity cannot simply be `profiles`. |
| Later associate external contributor with an account | **NEEDS DESIGN** | Must not allow arbitrary identity claiming. |
| Preserve attribution if contributor later deletes account | **NEEDS DESIGN** | Historical contributor identity must survive account unlink/anonymization as appropriate. |
| Dispute a false attribution | EXTENSION | Can integrate with provenance/dispute architecture, exact target model later. |

### Design requirement

A historical contributor/person identity must be separable from an authenticated Mini Archive profile. Linking the two requires controlled identity semantics rather than name matching.

---

## Scenario 03 — old second-hand miniature with incomplete provenance

A user acquires an old miniature. Manufacturer/model are known, but original owner, painter and exact painting date are unknown. Later evidence may identify some of those facts.

| Requirement | Result | Notes |
|---|---|---|
| Known catalogue identity with unknown personal history | PASS | Missing provenance does not block a Record. |
| Unknown painter | PASS conceptually | Absence remains unknown; no fake placeholder identity. |
| Unknown prior owner | PASS | Do not invent ownership rows. |
| Unknown/approximate historical date | PASS for unknown; review approximate-date UX later | No fake precision. |
| Add attribution/evidence later | EXTENSION | Contributor + provenance/evidence modules can enrich existing Record. |

This scenario supports the principle that incomplete catalogue/provenance information must never block Archive creation.

---

## Scenario 04 — stripped, converted and repainted over time

A miniature is painted for one faction, later sold, stripped, converted, repainted for another faction, and continues as the same physical Archive Record.

| Requirement | Result | Notes |
|---|---|---|
| Same physical identity through repaint/conversion | PASS | Archive Record remains stable. |
| Multiple work eras | PASS | Work History can preserve separate entries. |
| Different contributors over time | **FAIL under current draft** | Same contributor cluster as Scenarios 01–02. |
| Current faction | PASS | `miniature_details.current_faction_id` can represent current display state. |
| Historical faction changes | **AWKWARD** | Current pointer loses temporal affiliation history unless generic history is abused. |
| Historical game-system association | **AWKWARD / NEEDS DESIGN** | Same issue if the physical work moves between systems/uses. |

### Failure cluster B — temporal affiliations

Stress testing should determine whether faction/game affiliation deserves a reusable temporal relationship model, with current fields only as derived/convenience pointers, rather than storing only current faction/system on `miniature_details`.

Do not change the schema yet; test this against proxies, homebrew factions, multiple simultaneous affiliations, cross-system use, armies/groups, and represented Play Identities first.

---

---

## Scenario 05 — multi-artist collaboration with overlapping work

A display miniature is assembled by its owner, converted jointly by two artists, painted by one artist with freehand by another, and based by a third person. Some work occurs during the same period and not every exact work date is known.

| Requirement | Result | Notes |
|---|---|---|
| Multiple people credited on one finished Record | **FAIL under current draft** | Confirms contributor cluster A. |
| Same contributor can hold multiple roles | **FAIL under current draft** | Roles must be many-to-many, not one painter field. |
| Multiple contributors share one role | **FAIL under current draft** | Joint conversion/painting must be representable. |
| Credit specific work entries separately from overall Record credit | **FAIL under current draft** | Record-level and work-entry-level credit are both needed. |
| Overlapping/partially known work dates | PASS conceptually | Work entries can overlap; exact date must remain optional. |
| Collaboration without ownership | **FAIL under current draft** | Reinforces that contributor identity is independent from ownership. |

**Signal:** contributor architecture should support contributor identity, extensible role vocabulary, Record-level credits and Work-entry credits. Do not encode one row per role on the Record itself.

---

## Scenario 06 — competition/display piece with award and evidence

A miniature is entered into a painting competition, displayed at a convention, wins an award, and the owner later attaches event photographs and published results as supporting evidence. Another user disputes the claimed award.

| Requirement | Result | Notes |
|---|---|---|
| Record participation in exhibition/competition | EXTENSION | Fits physical/provenance history without changing Archive identity. |
| Named event/venue/organizer reused across Records | **NEEDS DESIGN** | A generic event/context identity may be preferable to repeated free text. |
| Award/result as structured historical fact | **NEEDS DESIGN** | Generic history event alone may be too weak for queryable accomplishments. |
| Attach photos/results as evidence | PASS/EXTENSION | Evidence architecture has the correct attachment boundary. |
| Distinguish user claim from corroborating evidence | PASS conceptually | Provenance claims + evidence support this. |
| Dispute only the award assertion, not the whole Record | **NEEDS DESIGN** | Disputes need a stable targetable assertion/claim. |
| Correct result later without erasing original assertion | **NEEDS DESIGN** | Requires correction/supersession semantics. |

### Failure cluster C — targetable historical assertions

Important historical facts may need stable identities so evidence, attestations, disputes and corrections can point to the specific assertion rather than an entire Record or a blob of narrative text.

---

## Scenario 07 — extreme kitbash with manufactured and handmade sources

A miniature uses a torso from one kit, legs from another, a weapon from a third manufacturer, a commercially printed head, a hand-sculpted cloak and scratch-built base details. No single kit dominates.

| Requirement | Result | Notes |
|---|---|---|
| Multiple manufactured source kits | PASS conceptually | `record_sources` is already intended to be repeatable. |
| Sources from different manufacturers | PASS | Catalogue sources are independent references. |
| Third-party/printed component | PASS conceptually | Planned non-catalogue source types cover this. |
| Hand-sculpted component | PASS conceptually | No fake catalogue row required. |
| Scratch-built component | PASS conceptually | Same. |
| Describe what each source contributed | **NEEDS DESIGN** | `record_sources` needs an optional component/usage description. |
| No mandatory primary source or percentages | PASS | Existing design principle handles this correctly. |
| Source later identified more precisely | EXTENSION | Source/provenance can be enriched without changing Record identity. |

**Signal:** the source model is holding up. Avoid turning this into a bits inventory; an optional human-readable contribution description is probably sufficient.

---

## Scenario 08 — damage and restoration by another person

A painted miniature is damaged in transit. Its sword breaks, paint chips, and the base cracks. A professional restorer repairs the sword, matches the original paint and replaces part of the base while preserving the original artist attribution.

| Requirement | Result | Notes |
|---|---|---|
| Damage event | EXTENSION | Fits physical history. |
| Damage photographs | PASS/EXTENSION | Media/evidence can attach. |
| Restoration work entries | PASS | Work History is appropriate. |
| Restorer differs from owner/original painter | **FAIL under current draft** | Contributor cluster A again. |
| Preserve original painter credit alongside restoration credit | **FAIL under current draft** | Credits need role + temporal/work context. |
| Record replaced/repaired physical components | PASS conceptually | Work entry notes/details can describe repair; source link can be added if a new manufactured part matters. |
| Current physical condition | **NEEDS DESIGN** | Root `physical_state` vocabulary does not express condition and may not belong on all Record types. |

### Failure cluster D — physical status versus condition

`lost`, `stolen`, `destroyed` and `historical` are lifecycle/status concepts, not condition grades. Damage/restoration should not force an ever-growing `physical_state` enum. Stress test later whether physical status belongs on the root at all and whether condition is best represented by history/current assessment rather than a universal field.

---

## Scenario 09 — mixed-granularity diorama

A diorama contains five figures. Two are important characters with their own Archive Records. Three background figures are permanently part of the diorama but the owner does not want individual Records for them. Years later one background figure is removed and archived individually.

| Requirement | Result | Notes |
|---|---|---|
| Diorama exists as its own Archive Record | PASS | Root type supports it. |
| Existing individual Records belong to diorama | PASS | `record_relationships` handles contained Records. |
| Unarchived background figures do not require fake Records | PASS | Optional granularity principle survives. |
| Describe unarchived constituents | **NEEDS DESIGN** | Diorama needs somewhere lightweight to describe non-Record components without forcing identity creation. |
| Later promote a constituent into its own Archive Record | **NEEDS DESIGN** | Need clean transition without pretending the new Record existed historically before creation. |
| Preserve historical period when child belonged to diorama | PASS | Temporal relationship can retain membership after removal. |
| One child can have its own source/work history independently | PASS | Stable Record identity works. |

**Signal:** optional granularity works, but a lightweight non-Record constituent/component representation may be useful for dioramas and possibly groups. It must not become a second competing Archive identity system.

---

## Scenario 10 — group membership changes and nested groups

A character starts in 2nd Squad, later moves to 1st Squad. Both squads belong to the same army. The army is later reorganized and one squad moves to a different named collection. Historical game logs must still show the structure that existed at the time.

| Requirement | Result | Notes |
|---|---|---|
| Miniature changes squads | PASS | Temporal `record_relationships`. |
| Squad belongs to army | PASS conceptually | Group-to-group relationship is supported by generic Record relationships. |
| Nested groups | PASS with constraint work | Need cycle prevention for hierarchical relationship types. |
| Historical membership retained | PASS | Closing relationship preserves row. |
| Same Record in multiple legitimate groups simultaneously | **NEEDS DESIGN** | Must avoid assuming all group relationships are exclusive. |
| Game log resolves membership as-of game date | PASS conceptually | Temporal relationships allow this, but query semantics must be explicit. |
| Group vocabulary varies by game system | PASS | `group_types` reference model works as intended. |

**Signal:** group architecture is holding up. Relationship semantics need metadata/rules for hierarchy, exclusivity and cycle behavior rather than hard-coding one universal membership rule.

---

## Scenario 11 — long ownership chain including non-account historical owners

A miniature was bought in 1996, sold privately in 2004, sold again in 2015, and finally acquired by a Mini Archive user in 2026. Earlier owners never had Mini Archive accounts; one is known by name, one is unknown.

| Requirement | Result | Notes |
|---|---|---|
| Current authenticated owner | PASS | Current owner pointer works. |
| Historical Mini Archive transfers | PASS | `ownership_events` works for platform users. |
| Named historical owner without account | **FAIL under current draft** | Current ownership events only reference `auth.users`. |
| Completely unknown historical owner | PASS | Missing information remains missing. |
| Historical ownership claim with evidence | EXTENSION | Provenance claims/evidence can support it. |
| Later historical owner creates account | **NEEDS DESIGN** | Same external-person linking problem as contributors. |

### Failure cluster E — people/parties beyond accounts

The contributor failure and historical-owner failure are probably the same deeper architectural issue: Mini Archive needs a durable way to refer to a historical person/party without requiring an authenticated account. We should explore one reusable party/person identity layer rather than separate fake-user systems for contributors and provenance.

---

## Scenario 12 — lost → relinquished → claimable → claimed → recovered

An owner loses an NFC-tagged miniature, later intentionally relinquishes the Record, the 60-day cooling period expires, another user physically obtains/scans it and claims it, and later the former owner produces evidence and disputes the claim.

| Requirement | Result | Notes |
|---|---|---|
| Mark lost/stolen state without deleting Record | PASS conceptually | Lifecycle/history can represent this. |
| Relinquishment immediately freezes owner actions | **NEEDS DESIGN** | Current `ownership_events` vocabulary does not model freeze/cooling state. |
| 60-day cooling period | **FAIL under current ownership draft** | Needs explicit relinquishment/claimability state and timestamps. |
| NFC claim becomes available only after cooling period | **NEEDS DESIGN** | Server-side eligibility rule; NFC possession is not proof of title. |
| First valid claim wins atomically | **NEEDS DESIGN** | Requires transactional locking/race handling. |
| Claim marked self-reported | **NEEDS DESIGN** | Trust/attestation state must attach to claim. |
| Activated NFC identity survives ownership change | PASS conceptually | NFC identity belongs to Record, not subscription/owner. |
| Former owner disputes later claim with evidence | EXTENSION/NEEDS DESIGN | Dispute/evidence architecture can attach once ownership assertions are targetable. |
| Recovery-location collection stops after case closes | PASS conceptually | Recovery module already has this privacy boundary. |

### Failure cluster F — ownership state machine

The current ownership table is too simple for the already-agreed relinquish/cooling/claim lifecycle. Ownership needs explicit transactional/state semantics without putting claimability or NFC proof into the permanent Archive identity itself.

---

## Scenario 13 — account deletion/anonymization

A long-time user owns many published Records, painted commissions for other users, participated in games, made attestations and completed transfers. They delete their Mini Archive account.

| Requirement | Result | Notes |
|---|---|---|
| Published Archive Records survive | PASS by principle | No destructive cascade. |
| Historical ownership events survive | PASS by principle | Must not FK-cascade from auth account. |
| Contributions on other people's Records survive | **NEEDS DESIGN** | Requires durable non-auth party/contributor identity. |
| Public personal profile is removed/anonymized appropriately | **NEEDS DESIGN** | Account deletion policy must distinguish public historical attribution from account/profile data. |
| Completed transfers remain auditable | PASS conceptually | Historical ledger survives. |
| Attestations/disputes remain historically intelligible | **NEEDS DESIGN** | Actor identity retention/anonymization policy required. |
| Current owned Records become orphaned/detached/handled deliberately | **NEEDS DESIGN** | Cannot simply null everything without defined ownership semantics. |

**Signal:** direct FKs from permanent history to `auth.users` need careful treatment. A durable party/actor identity boundary may solve several modules at once.

---

## Scenario 14 — incorrect attribution, correction and dispute

A Record publicly credits Alex as painter. Alex disputes the credit and says Jordan painted it. The owner later finds an old commission invoice supporting Jordan, corrects the attribution, and the historical fact that Alex was previously credited should remain auditable without continuing to display Alex as the current attribution.

| Requirement | Result | Notes |
|---|---|---|
| Target a specific attribution for dispute | **NEEDS DESIGN** | Credit/assertion must have stable identity. |
| Attach evidence to correction | EXTENSION | Evidence module can support it. |
| Replace current public attribution without deleting old assertion | **NEEDS DESIGN** | Requires superseded/retracted/corrected semantics. |
| Preserve who made correction and when | PASS conceptually | Audit/history architecture. |
| Distinguish false attribution from malicious abuse | PASS conceptually | Dispute and abuse workflows remain separate. |
| Avoid claiming Mini Archive determined objective truth | PASS by principle | Show status/evidence/attestations rather than certification. |

**Signal:** cluster C is reinforced. Credits, ownership claims and other provenance-bearing facts should likely expose stable assertion/event identities that can be evidenced, attested, disputed and superseded.

---

## Scenario 15 — proxy / rebased miniature used across systems and factions

The same physical miniature begins life as a 40K model, is later rebased for another ruleset, is sometimes used as a proxy for a different faction, and is eventually returned to its original game. Its manufactured identity never changes.

| Requirement | Result | Notes |
|---|---|---|
| Manufactured source remains stable | PASS | Catalogue identity is correctly separate from finished/play identity. |
| Base changes over time | PASS/AWKWARD | Current base pointer works, but history belongs in Work/physical history. |
| Current faction differs from source faction | PASS | Existing source/finished-work separation works. |
| Temporary proxy faction/use | **AWKWARD** | A single `current_faction_id` cannot distinguish physical presentation from temporary represented/play identity. |
| Same physical Record used in multiple systems | **AWKWARD / NEEDS DESIGN** | Reinforces temporal affiliation versus Play Identity separation. |
| Return to original system without losing intervening history | **NEEDS DESIGN** | Temporal affiliations/representations must preserve periods. |

**Signal:** do not overload `miniature_details.current_game_system_id/current_faction_id` with every way a miniature has been used. Physical presentation affiliation and represented Play Identity need distinct concepts.

---

## Scenario 16 — homebrew faction / unknown future taxonomy

A user paints an army for a completely original homebrew faction in an established game. Years later the faction becomes popular and gets richer shared reference data. Another user uses the same faction name for an unrelated homebrew force.

| Requirement | Result | Notes |
|---|---|---|
| Record creation without official faction row | **NEEDS DESIGN** | Reference incompleteness must not block finished-work affiliation. |
| Personal/homebrew affiliation without polluting global reference data | **NEEDS DESIGN** | Need scoped/custom affiliation identity or permissive local value. |
| Two unrelated homebrew factions with same name | **NEEDS DESIGN** | Names cannot be identifiers. |
| Later link personal faction to shared/canonical reference | EXTENSION | Should be possible without rewriting Record history. |
| Official catalogue faction remains distinct from finished affiliation | PASS | Existing boundary holds. |

### Failure cluster I — canonical versus user-defined taxonomy

The catalogue/reference layer cannot be the only source of valid user-facing affiliations. Mini Archive needs a pattern for canonical/shared reference values versus user-defined/scoped identities, similar in spirit to canonical versus personal Play Identities.

---

## Scenario 17 — one physical work splits into two Archive-worthy works

A large model is permanently dismantled. Its rider becomes a standalone miniature and its mount is rebuilt as a separate display piece. Both descendants should have their own permanent Archive identities while preserving provenance back to the original Record.

| Requirement | Result | Notes |
|---|---|---|
| Original Record remains historical | PASS by principle | Published identity is never recycled/deleted. |
| Create two new physical Records | PASS | New physical works receive new identities. |
| Express that both originated from original physical Record | **NEEDS DESIGN** | Generic `record_relationships` may work if lineage semantics are explicitly supported. |
| Original no longer represents one current intact object | **NEEDS DESIGN** | Lifecycle status needs a concept such as transformed/split/superseded without calling it deleted. |
| Provenance follows descendants without duplicating old history | **NEEDS DESIGN** | Lineage should reference prior Record, not copy every event. |
| NFC identity on original object | **NEEDS DESIGN** | Must define whether original token resolves to historical Record and links descendants. |

---

## Scenario 18 — two physical works permanently combined

Two separately archived miniatures are physically combined into one permanent conversion. The original Records have meaningful independent histories and NFC identities before the combination.

| Requirement | Result | Notes |
|---|---|---|
| Preserve both original Records/history | PASS by principle | No destructive merge of physical provenance. |
| New combined work receives new Archive identity | PASS conceptually | Physical identity changed materially. |
| Express derived-from-two lineage | **NEEDS DESIGN** | Same lineage vocabulary as Scenario 17. |
| Original Records become historical/transformed | **NEEDS DESIGN** | Lifecycle model again. |
| Old NFC tags continue to resolve intelligibly | **NEEDS DESIGN** | Should lead to historical source and current descendant rather than silently reassign identity. |

### Failure cluster J — physical lineage / transformation

Archive relationships need to distinguish structural membership from **physical lineage** such as split-from, combined-from, transformed-into or derived-from. These relationships are provenance-bearing and should not be treated like ordinary squad membership.

---

## Scenario 19 — duplicate Archive Records discovered after publication

The same physical miniature is accidentally published twice, possibly by the same owner or by two users after a transfer. Both public Archive IDs may already have links, photos or history.

| Requirement | Result | Notes |
|---|---|---|
| Detect/report possible duplicate | EXTENSION | Matching/moderation tooling can be added later. |
| Never recycle either public Archive ID | PASS by principle | Permanence rule holds. |
| Designate one Record as canonical/current | **NEEDS DESIGN** | Requires explicit duplicate/merged Record resolution. |
| Preserve links to retired duplicate | **NEEDS DESIGN** | Old Archive ID should resolve to an explanatory historical/redirect state. |
| Reconcile conflicting ownership/history safely | **NEEDS DESIGN** | Cannot blindly concatenate or overwrite provenance. |
| Prevent malicious duplicate merge request | **NEEDS DESIGN** | Merge is privileged/verified workflow, not ordinary edit. |

### Failure cluster K — Record supersession / duplicate resolution

Permanent IDs require a non-destructive way to mark a Record as duplicate/superseded/merged while preserving resolution of the old public identity and audit history.

---

## Scenario 20 — malicious NFC / ownership / attribution edits

An attacker scans someone else's public NFC tag, creates an account, attempts to change ownership, replace the painter credit, attach offensive text/media and reassign or disable the NFC identity.

| Requirement | Result | Notes |
|---|---|---|
| Public NFC resolution grants no edit authority | PASS by architecture principle | Possession/scan is not authentication or ownership. |
| Attacker cannot transfer ownership | PASS conceptually | Trusted ownership transaction requires current authority/acceptance. |
| Attacker cannot reassign/disable NFC identity | **NEEDS DESIGN** | NFC mutation permissions/server functions must explicitly enforce this. |
| Attacker cannot edit another owner's Record | PASS only if RLS/API design is correct | Mandatory adversarial test, not merely schema assumption. |
| Attacker cannot alter historical credits | **NEEDS DESIGN** | Contributor assertions need authorization/correction workflow. |
| Offensive public contribution is screened/reported | EXTENSION | Moderation system. |
| Security-sensitive changes are auditable | PASS conceptually | Audit module planned. |

**Signal:** NFC lookup and NFC management must be separate capabilities. Knowledge of a public token must never be sufficient authority for mutation.

---

## Scenario 21 — legitimate bulk collection import

A collector imports 2,000 miniatures, many with similar titles, repeated catalogue models and shared photos/metadata. The activity superficially resembles automated spam.

| Requirement | Result | Notes |
|---|---|---|
| Efficient bulk draft creation | **NEEDS DESIGN** | Product/API workflow, foundation can support it. |
| Reuse catalogue references without duplicate catalogue rows | PASS | Normalized catalogue model helps. |
| Apply shared defaults without destroying individual identity | PASS conceptually | Each physical Record remains separate. |
| Avoid public-index flood before review | **NEEDS DESIGN** | Draft/publish boundary helps; bulk publishing needs velocity policy. |
| Abuse controls do not permanently block legitimate collector | **NEEDS DESIGN** | Risk controls need challenge/review/escalation rather than binary bot verdict. |
| 2,000 signup promotional NFC credits are not created | PASS if entitlement is account-level | Promo is not per Record. |

**Signal:** abuse prevention must distinguish account/content/promotion risk and support legitimate high-volume workflows. Rate limits should throttle or challenge, not corrupt/import partially without recoverability.

---

## Scenario 22 — signup promotional NFC farming and consolidation

An operator creates hundreds of accounts to obtain one free signup NFC activation each, activates Records/tags, then transfers the activated Records to a primary account to consolidate the promotional value.

| Requirement | Result | Notes |
|---|---|---|
| Signup account itself does not mint transferable credit automatically | **NEEDS DESIGN** | Promotional entitlement should be eligibility-based. |
| Promo source remains distinguishable from purchased/subscription credits | PASS conceptually | Credit ledger source/provenance supports this. |
| Detect repeated promo → activation → rapid transfer → same destination | EXTENSION | Abuse/risk analytics can attach without changing Archive identity. |
| Legitimate ownership transfer remains allowed | PASS by principle | Do not cripple transfers to solve promotion abuse. |
| Activated NFC remains active after legitimate transfer | PASS by principle | Activation belongs to Record/NFC identity. |
| Withhold promo from suspicious account without deleting account | **NEEDS DESIGN** | Entitlement state/eligibility required. |
| Avoid treating one shared IP/device signal as proof of fraud | PASS by principle | Signals inform risk, not objective truth. |

### Failure cluster L — promotional entitlement lifecycle

The signup bonus should be a controlled promotional entitlement with issuance/eligibility/redemption state, not an unconditional transferable ledger balance created at registration.

---

## Scenario 23 — garbage/SEO spam public publishing

Bots or low-quality accounts create thousands of Records containing keyword spam, affiliate links, nonsense text and duplicate images in an attempt to exploit public indexing.

| Requirement | Result | Notes |
|---|---|---|
| Bot account creation can be challenged/rate-limited | EXTENSION | Auth/edge abuse control, not Archive schema. |
| Draft creation can remain low-friction | PASS | Draft/publication separation works. |
| Public publication can have stronger controls than signup | **NEEDS DESIGN** | Publication eligibility/risk gate needed outside core Archive identity. |
| Suppress spam without deleting permanent legitimate Archive identity | PASS conceptually | Moderation separate from publication state. |
| Prevent spam pages from remaining indexable | **NEEDS DESIGN** | Public read/SEO layer must respect moderation/indexability state. |
| Preserve moderation/audit history | EXTENSION | Planned moderation/audit modules. |

**Signal:** account creation, Record creation, publication and search-engine indexability are separate trust boundaries. Do not make public/indexable an automatic consequence of having an account.

---

## Scenario 24 — pornography / illegal or abusive public media upload

A malicious account uploads pornography, graphic abuse, stolen images or other prohibited material and tries to attach it to public Archive Records. Some content may pass automated screening and later be reported.

| Requirement | Result | Notes |
|---|---|---|
| Validate file type/size before acceptance | PASS by security design | Server-side ingestion requirement. |
| Screen media at ingestion/change | EXTENSION | Moderation pipeline. |
| Quarantine/block before public presentation where indicated | **NEEDS DESIGN** | Media moderation state must be distinct from Archive publication. |
| User reports content that passed screening | EXTENSION | `abuse_reports`/moderation cases. |
| Remove/suppress offending media without deleting Archive ID | PASS by principle | Permanence does not require hosting abusive content. |
| Prevent public derivative/indexing while under block | **NEEDS DESIGN** | Storage/public read/SEO enforcement must agree. |
| Preserve evidence needed for moderation while respecting legal/privacy retention | **NEEDS DESIGN** | Retention/access policy is operational/legal, not public Archive history. |

### Failure cluster M — publication/media moderation state

Media assets and public Archive presentation need explicit moderation/indexability gates. `publication_state` alone is intentionally insufficient and should remain separate from moderation.

# Open findings register

| ID | Finding | Severity | First exposed | Explore with |
|---|---|---|---|---|
| A1 | No structural painter/creator/contributor attribution | **FAIL** | Scenario 01 | commissions, collaboration, restoration, sculpting |
| A2 | Contributor cannot simply equal authenticated profile | **FAIL** | Scenario 02 | historical/non-user people, account deletion |
| A3 | Safe linking/claiming of an existing contributor identity | **NEEDS DESIGN** | Scenario 02 | impersonation, verification, duplicate people |
| A4 | Contributor attribution disputes/corrections | **NEEDS DESIGN** | Scenario 02 | provenance/dispute semantics |
| B1 | Historical faction affiliation is not naturally represented | **AWKWARD** | Scenario 04 | faction changes, homebrew, simultaneous affiliations |
| B2 | Historical/cross-system game association may have same problem | **AWKWARD / NEEDS DESIGN** | Scenario 04 | proxies, cross-system reuse, groups |
| C1 | Historical assertions need stable target identities for evidence/disputes/corrections | **NEEDS DESIGN** | Scenario 06 | awards, credits, ownership claims |
| C2 | Correction/supersession semantics for provenance-bearing assertions | **NEEDS DESIGN** | Scenario 06 | false attribution, corrected results |
| D1 | Root physical_state conflates lifecycle status with physical condition | **NEEDS DESIGN** | Scenario 08 | damage, restoration, non-physical groups |
| D2 | Current condition representation is unresolved | **NEEDS DESIGN** | Scenario 08 | repaired/damaged/destroyed works |
| E1 | Historical people/parties without accounts lack a durable identity | **FAIL** | Scenario 11 | owners, contributors, attestations |
| E2 | Account deletion vs permanent historical attribution/actor identity | **NEEDS DESIGN** | Scenario 13 | privacy, provenance retention |
| F1 | Current ownership model lacks relinquish/cooling/claim state machine | **FAIL** | Scenario 12 | 60-day cooling, first claim |
| F2 | Atomic first-claim and claim trust semantics | **NEEDS DESIGN** | Scenario 12 | concurrent claims, self-reported status |
| G1 | Mixed-granularity diorama constituents need lightweight representation | **NEEDS DESIGN** | Scenario 09 | later promotion to Archive Record |
| H1 | Relationship types need hierarchy/exclusivity/cycle semantics | **NEEDS DESIGN** | Scenario 10 | nested groups, simultaneous membership |
| I1 | User-defined/homebrew affiliations cannot depend solely on canonical reference tables | **NEEDS DESIGN** | Scenario 16 | homebrew, same-name identities, later canonical linking |
| J1 | Physical split/combine/transformation lineage needs explicit semantics | **NEEDS DESIGN** | Scenario 17 | split, combine, transformed works |
| J2 | NFC behavior across physical transformation is unresolved | **NEEDS DESIGN** | Scenario 17 | historical token resolution, descendants |
| K1 | Duplicate/superseded published Record resolution | **NEEDS DESIGN** | Scenario 19 | permanent IDs, redirects, conflicting history |
| L1 | Signup NFC promotion needs controlled entitlement lifecycle | **NEEDS DESIGN** | Scenario 22 | farming, withholding, redemption |
| M1 | Publication/indexability needs abuse/risk gating separate from draft creation | **NEEDS DESIGN** | Scenario 23 | SEO spam, mass publishing |
| M2 | Media moderation state/quarantine separate from Archive publication | **NEEDS DESIGN** | Scenario 24 | prohibited media, reports, storage |
| M3 | Moderation retention/access policy for abusive evidence | **NEEDS DESIGN** | Scenario 24 | legal/privacy retention |

## Current architectural signal

The failures found so far do **not** require replacing `archive_records`. They point to additional modules/relationships attached to the existing Archive identity. That is a positive result for the modular foundation.

A stronger pattern has emerged: contributors, historical owners and durable historical actors may all require the same reusable **person/party identity boundary** separate from authenticated accounts. Likewise, awards, credits and ownership claims are exposing a need for **targetable provenance-bearing assertions/events** rather than unrelated one-off dispute mechanisms.

The source/catalogue and group/relationship foundations are performing well under the tests so far.

## Physical/provenance pass checkpoint

Twenty-four scenarios have now exercised the physical/provenance foundation, including ordinary use, collaboration, incomplete history, restoration, grouping, ownership, NFC, physical transformation, duplicates and adversarial abuse.

### Foundation pieces that are holding up

- `archive_records` as the permanent identity/header.
- Type-specific extensions rather than one giant miniature table.
- Catalogue identity separated from finished physical identity.
- Repeatable `record_sources` rather than one source/model column.
- Work History separated from current Record state.
- Generic temporal Record relationships for grouping.
- Media asset identity separated from Record/media presentation.
- NFC identity attached to the Record rather than owner/subscription.
- Draft versus published Archive lifecycle.
- Separate provenance/evidence/moderation domains rather than one timeline blob.

### Clusters to resolve before declaring the physical schema frozen

1. **Party/person identity:** contributors, historical owners and durable actors outside authenticated accounts.
2. **Contributor credits:** roles, Record-level versus Work-entry credit, linking, disputes and account deletion.
3. **Targetable assertions:** evidence/attestation/dispute/correction/supersession semantics.
4. **Temporal affiliations:** faction/system/current presentation versus represented Play Identity.
5. **Physical lifecycle:** status versus condition, transformed/split/combined works and lineage.
6. **Record supersession:** duplicate published Records without recycling IDs.
7. **Ownership state machine:** transfers plus relinquish → 60-day cooling → claimability → atomic first claim.
8. **Relationship semantics:** hierarchy, exclusivity, cycles and lightweight non-Record constituents.
9. **Canonical versus user-defined taxonomy:** homebrew/scoped identities without polluting global reference data.
10. **Promotion/abuse controls:** signup NFC entitlement, publication/indexability gates and media moderation/quarantine.

### Next action

Resolve these clusters as a coherent architecture revision, update `V2-PHYSICAL-SCHEMA.md` and the full master ERD, then rerun all 24 scenarios against the revised design. Any remaining FAIL/AWKWARD result blocks the physical-schema freeze. Once that passes, move to the separate multi-system Play History torture test.

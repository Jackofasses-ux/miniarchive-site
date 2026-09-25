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

## Current architectural signal

The failures found so far do **not** require replacing `archive_records`. They point to additional modules/relationships attached to the existing Archive identity. That is a positive result for the modular foundation.

A stronger pattern has emerged: contributors, historical owners and durable historical actors may all require the same reusable **person/party identity boundary** separate from authenticated accounts. Likewise, awards, credits and ownership claims are exposing a need for **targetable provenance-bearing assertions/events** rather than unrelated one-off dispute mechanisms.

The source/catalogue and group/relationship foundations are performing well under the tests so far.

## Next scenarios

Physical/provenance testing should continue with additional edge cases before resolving the clusters:

1. proxy/recast/rebased miniature used across multiple game systems/factions;
2. homebrew faction and affiliation not present in reference catalogue;
3. miniature physically split into two works, or two works permanently combined;
4. duplicate/merged Archive Records discovered after publication;
5. stolen Record/NFC identity with malicious ownership or contributor edits;
6. bulk collection import by a legitimate high-volume collector;
7. promotional NFC activation farming and consolidation;
8. malicious public-content publishing/media upload abuse.

After those scenarios, resolve the physical/provenance failure clusters coherently, update the physical schema and full ERD, rerun all physical tests, then run the separate multi-system Play History stress test.

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

# Open findings register

| ID | Finding | Severity | First exposed | Explore with |
|---|---|---|---|---|
| A1 | No structural painter/creator/contributor attribution | **FAIL** | Scenario 01 | commissions, collaboration, restoration, sculpting |
| A2 | Contributor cannot simply equal authenticated profile | **FAIL** | Scenario 02 | historical/non-user people, account deletion |
| A3 | Safe linking/claiming of an existing contributor identity | **NEEDS DESIGN** | Scenario 02 | impersonation, verification, duplicate people |
| A4 | Contributor attribution disputes/corrections | **NEEDS DESIGN** | Scenario 02 | provenance/dispute semantics |
| B1 | Historical faction affiliation is not naturally represented | **AWKWARD** | Scenario 04 | faction changes, homebrew, simultaneous affiliations |
| B2 | Historical/cross-system game association may have same problem | **AWKWARD / NEEDS DESIGN** | Scenario 04 | proxies, cross-system reuse, groups |

## Current architectural signal

The failures found so far do **not** require replacing `archive_records`. They point to additional modules/relationships attached to the existing Archive identity. That is a positive result for the modular foundation.

## Next scenarios

Continue testing before modifying the physical schema:

1. multi-artist collaboration with overlapping work;
2. competition/display piece with awards and evidence;
3. extreme kitbash with multiple manufactured and handmade sources;
4. damage + restoration by another person;
5. diorama containing individually archived and unarchived components;
6. group membership changes across squad/army/team structures;
7. long ownership chain including non-account historical owners;
8. lost/relinquished/claimed/recovered NFC lifecycle;
9. account deletion/anonymization while Records and provenance survive;
10. deliberately incorrect historical attribution followed by correction/dispute.

After the physical/provenance scenarios are complete, resolve failure clusters coherently, update the physical schema and full ERD, then run the separate multi-system Play History stress test.

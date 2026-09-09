# Mini Archive v2: Play Logging UX and Insurance Report Candidate

This document records product decisions that extend `V2-ARCHITECTURE.md` and must be incorporated into the physical-schema review.

## 1. Play logging UX: locked for v2

### Principle

Mini Archive supports deep, interconnected hobby history without requiring deep data entry.

**Capture as little as necessary, enrich as much as desired, and use existing Archive history to make future logging faster.**

A user may log a minimal game or event and stop. Armies, squads/groups, opponents, campaigns, locations, scores, Stories, and other context are optional enrichment. Structure must create convenience and historical richness, not prerequisites.

### NFC interaction

NFC remains an accelerator to the same functionality available from the Record/site. The physical miniature's NFC identity connects that physical object to its Archive Record and history.

A core fast interaction is:

`tap actor miniature -> choose/log event -> tap target miniature -> select/reuse game -> done`

For a Warhammer-like system this may appear as:

`tap Bob -> Log Defeat -> tap enemy model -> Add to last game -> done`

The same underlying event can be created manually by opening/searching Records when NFC is unavailable or inconvenient. NFC is not required to use Play History.

### Lightweight games

A Game/session is a historical context container, not a heavy game-management workflow. Creating one must not require an army, squad, campaign, roster, location, opponent account, score, or other optional structure.

When an event is logged, Mini Archive should offer the user's most recently logged/relevant game first, for example **Add to last game?** The user can accept it, choose another game, create a new game, or leave the event without that context where allowed.

A new Game can initially contain only the information needed by the user. Additional details can be added or corrected later.

The date/time the game or event happened is distinct from `created_at` and `updated_at`. Users may reconstruct and enrich historical games after the fact.

### History-assisted suggestions

Mini Archive should use existing structured history to reduce repeated entry, while requiring the user to confirm suggestions rather than silently inventing historical facts.

Examples:
- if Bob has repeatedly been logged in 2nd Squad, suggest 2nd Squad first and offer prior/current squads;
- if the current Record has an active/current group relationship, prioritize it;
- if an enemy Record belongs to a known user previously encountered, suggest that opponent;
- use the enemy Record's current faction as a candidate opponent-army/faction suggestion;
- if that opponent has previously used a named army associated with that faction/Records, prioritize that army;
- suggest the user's recently used army, squad, campaign, location, or other relevant context;
- when logging several events, prioritize the last-used game so repeated event entry stays fast.

This does not require machine learning. Deterministic recommendations based on current Record facts, relationships, prior accepted values, and recency are sufficient for v2.

**Previously entered structure should reduce future data entry, not create future requirements.**

### Optional depth

Groups/squads, armies/collections, campaigns and other play structures are valuable because they can create richer long-term history. A Record may eventually show that a character played in a particular squad, as part of a named army, against a particular opponent/army, during a campaign. Users who do not care about that depth must never be forced to create those entities.

### Facts first, statistics derived

Store the underlying games, participants and structured play events. Do not store manually maintained career totals such as `career_kills` or `career_touchdowns` as authoritative facts.

Public stat cards and historical summaries are reporting/BI over the underlying facts and game-system event definitions. This allows totals to change correctly when an event is corrected, reassigned, disputed or invalidated.

## 2. Insurance / collection documentation reports: v2 paid-feature candidate

Miniatures and collections can have meaningful financial and sentimental value. Mini Archive's existing ownership, Record, media, provenance and NFC infrastructure can potentially produce useful documentation for a collector after theft, fire, flood or another loss.

The initial opportunity is **documentation**, not insurance appraisal or guaranteed valuation.

A paid report could potentially export a dated snapshot containing:
- account/collector identification appropriate for the report;
- Archive Records owned by the user at the snapshot date;
- Archive IDs and Record titles;
- photographs;
- catalogue/source information where known;
- ownership/transfer history and provenance support where appropriate;
- creation/acquisition information entered by the user;
- group/army/collection relationships;
- NFC activation/association status;
- system-recorded NFC evidence that is legitimately retained and useful;
- receipts, certificates or other user-provided evidence where permitted;
- optional user-entered declared/replacement/value information if a future valuation model is designed;
- report generation timestamp and integrity/reference information.

### Important evidence boundary

An NFC scan must not be presented as proof of legal ownership or proof of monetary value. At most, Mini Archive can accurately describe what its own records establish, for example that a particular NFC identity was associated with an Archive Record/account at a particular time, or that a system-recorded ownership transfer occurred.

Normal NFC scans are currently designed not to retain location history. Insurance-report functionality must not quietly turn NFC into continuous tracking or retain every ordinary scan merely to strengthen a future report. If stronger possession evidence is desired later, it needs an explicit privacy/product design rather than piggybacking on recovery-location behavior.

### Valuation boundary

V2 does not need Mini Archive to determine a miniature's market value. A useful report can exist before a trustworthy valuation system exists. Future options may include user-declared values, purchase-price evidence, replacement-cost notes, or external/reference valuation sources, but none should be represented as a Mini Archive appraisal without an appropriate methodology and legal/product review.

### Product status

Insurance/collection documentation reports are a **v2 paid-feature candidate**, not yet a locked launch requirement. The v2 physical schema should avoid destroying the evidence and historical relationships needed to support such reports later.
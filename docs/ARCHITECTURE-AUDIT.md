# Mini Archive — Architecture Audit

**Branch:** `audit/architecture-foundation`  
**Date:** 2026-08-20  
**Scope:** Repository structure, frontend architecture, Supabase usage, Archive Record flow, internationalization, and MVP readiness.

## Executive summary

Mini Archive is already beyond a static prototype. The repository contains a working static web application with Supabase authentication/data access, miniature records, record editing, photos, profiles, game logging, NFC pages, bilingual UI, and Cloudflare sitemap infrastructure.

The main technical risk is not the choice of plain HTML/JavaScript. The risk is that application logic has accumulated inside very large page files. `edit-record.html` and `record.html` are each roughly 100 KB+, mixing markup, CSS, data access, rendering, interaction logic, and page-specific state. This will make every additional feature progressively slower and riskier to implement.

**Recommendation:** do not rewrite the frontend into a framework. First establish a small shared application layer and extract common functionality from the existing pages. Preserve the current UI and behaviour while making the code easier to change.

## Current architecture

### Frontend

- Static HTML pages served as assets.
- CSS is largely embedded in individual pages.
- JavaScript is largely embedded in individual pages, with a small shared `js/` layer.
- Supabase JS is loaded from CDN and used directly in browser pages.
- Internationalization is centralized reasonably well in `js/i18n.js` and `js/translations.js`.

### Backend / infrastructure

- Supabase is the application data/auth backend.
- Cloudflare Worker serves `/sitemap.xml` from KV.
- A separate scheduled worker is responsible for rebuilding the sitemap.
- The browser uses the Supabase public/anon key. This is expected architecture; the security boundary must therefore be Supabase RLS, not secrecy of the key.

### Core entity

The repository's database documentation correctly treats the miniature as the primary entity, with identity, manufacture, artist, media, history, and technology surrounding it. Keep this as the canonical product model.

## Findings

### P0 — Security / data-access verification

The repository does not contain the Supabase schema/RLS policies, so the actual database security model cannot be verified from GitHub alone.

Because the browser directly queries tables such as `miniatures`, `photos`, `profiles`, and `account_status`, RLS policies are critical. Before adding sensitive features such as ownership history, verification, NFC identity, or private records, verify that:

- public users can only read records intended to be public;
- owners can only modify their own records;
- private owner/profile fields cannot be selected or inferred through unauthorized queries;
- photo storage policies match miniature visibility;
- account-status changes cannot be performed by another user;
- profile updates cannot modify protected fields such as IDs or ownership relationships.

**Action:** obtain/export the Supabase schema and policies into a local development/migrations directory before making security-sensitive changes.

### P1 — Separate data access from rendering

`record.html` currently contains the real-data query and extensive rendering logic in the same page. It also retains a large dummy `MODEL` object as a fallback/demo source.

Recommendation:

```text
js/
  supabase.js
  auth.js
  records.js
  photos.js
  profiles.js
  timeline.js
  games.js
  i18n.js
```

Pages should orchestrate these modules rather than contain the implementation of every subsystem.

### P1 — Create a canonical record view model

The record page currently transforms database rows into a rendering object in-place. Establish one canonical mapping:

```text
Supabase miniature row
        ↓
ArchiveRecord view model
        ↓
page renderers
```

This prevents each page from inventing its own interpretation of fields such as painter, owner, photos, status, dates, and timeline entries.

### P1 — Reduce duplication

Common header/auth/language/photo/lightbox behaviours are repeated across pages. Extracting them will reduce the chance of fixing a bug on one page while leaving the same bug elsewhere.

The existing i18n helper is already a good example of the shared-module direction and should be preserved.

### P1 — Photo requirements need reconciliation

The edit UI currently states that photos are required to publish and presents four angle slots. The project decision to reduce the required publish photo count to one needs to be reflected consistently in validation, copy, and database assumptions.

Recommended MVP rule:

- Draft: 0 photos allowed.
- Publish: 1 hero photo required.
- Additional identity views: optional.
- Four-view/360-style presentation: enhancement, not a publishing requirement.

### P1 — Remove or isolate demo data

`record.html` still contains a substantial hard-coded Captain Cassian `MODEL` object. This is useful during development but dangerous if it becomes an accidental production fallback.

Move demo data to a dedicated fixture or remove the fallback once the real record flow is reliable.

### P2 — Inline HTML interpolation needs escaping

Several render functions build HTML using template strings populated from database values. This is convenient but creates an XSS risk if user-controlled strings are inserted without escaping.

Create one HTML escaping helper and use it for database/user values before interpolation. Do not rely on Supabase data being trustworthy simply because it comes from the application's own UI.

### P2 — Dates and localization

The record page formats dates with a hard-coded `en-US` locale. Since the application supports English/French, date formatting should use `CURRENT_LANG` or an equivalent locale mapping.

### P2 — Shared CSS

The same design tokens and controls are repeated across pages. Create a shared base stylesheet containing typography, colours, buttons, forms, navigation, cards, and responsive primitives. Keep genuinely page-specific CSS local.

### P2 — SEO infrastructure is a strength

The Cloudflare sitemap worker architecture is sensible: the request path reads cached sitemap XML while a scheduled process rebuilds it. Keep this architecture rather than doing a database query on every sitemap request.

## Recommended development sequence

### Phase A — Foundation refactor

1. Export/version the Supabase schema + RLS policies.
2. Create shared Supabase/auth module.
3. Create canonical `ArchiveRecord` mapping.
4. Extract photo/lightbox utilities.
5. Extract common UI/CSS primitives.
6. Remove production dummy-data fallback.
7. Add HTML escaping utility.
8. Fix photo publishing validation.

### Phase B — MVP hardening

1. Account creation/login/logout.
2. Create draft miniature.
3. Upload one hero photo.
4. Edit draft.
5. Publish record.
6. Public record URL / Archive ID.
7. Owner-only editing.
8. Public/private visibility verification.
9. Mobile QA.
10. Error/loading/empty states.

### Phase C — Product features

After the above is stable:

- paint recipes and paint database integration;
- creation/progress timeline;
- artist profiles;
- collections;
- ownership/history;
- game/campaign records;
- NFC/QR identity;
- verification/certificates;
- discovery/search.

## Architectural principle

The miniature remains the primary entity. Everything else should attach to the miniature rather than becoming a competing top-level product concept.

```text
Miniature
├── Identity
├── Manufacture
├── Artist
├── Media
├── Paint / Recipe
├── Creation Timeline
├── Ownership History
├── Campaign / Game History
├── Awards / Competitions
└── NFC / QR / Verification
```

## Bottom line

The current codebase does not need a rewrite. It needs **controlled extraction and a canonical data layer**.

The highest-value next engineering task is therefore not another UI feature. It is to make the existing Archive Record and edit flow modular enough that new Mini Archive features can be added without continuing to grow 100 KB page files.

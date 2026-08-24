# Mini Archive — Architecture Audit

**Branch:** `audit/architecture-foundation`
**Scope:** Repository structure, frontend architecture, Supabase usage, Archive Record flow, internationalization, and MVP readiness.

## Executive summary

Mini Archive is already beyond a static prototype. The repository contains a working static web application with Supabase authentication/data access, miniature records, record editing, photos, profiles, game logging, NFC pages, bilingual UI, and Cloudflare sitemap infrastructure.

The main technical risk is not the choice of plain HTML/JavaScript. The risk is that application logic has accumulated inside very large page files. `edit-record.html` and `record.html` mix markup, CSS, data access, rendering, interaction logic, and page-specific state. The goal is controlled extraction rather than a framework rewrite.

## Current priorities

1. Keep the existing UI and behaviour stable while reducing duplicated implementation.
2. Establish shared modules for data access and common UI.
3. Create a canonical Archive Record view model.
4. Verify Supabase RLS before adding sensitive ownership/NFC features.
5. Improve public-record SEO without requiring a manually coded page per record.
6. Remove demo fallbacks and add consistent escaping/validation as the record flow stabilizes.

## SEO direction

Public Archive Records should remain dynamically rendered from record data. SEO metadata can be generated from the record at runtime without creating one HTML file per miniature. The existing URL format should remain until a deliberate URL migration is planned.

## Navbar note

The navigation had accumulated table/table-cell alignment rules during troubleshooting. Those are being overridden centrally with flexbox so the visual alignment is controlled by one shared rule instead of page-specific table hacks.

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

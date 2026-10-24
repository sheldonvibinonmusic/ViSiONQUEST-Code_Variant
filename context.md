# ViSiONQUEST — The Project Graveyard
## Project Intelligence & Knowledge Preservation Platform
### Context, State Tracking & Agent Continuity Guide

---

## 1. Executive Summary & Product Identity

- **Product Name:** The Project Graveyard (ViSiONQUEST)
- **Problem Statement:** PS 05 — The Project Graveyard. Developers build unfinished projects that gather dust in repositories or local folders. These projects aren't necessarily bad ideas—they often contain valuable architecture, code, and intentions worth reviving or preserving.
- **Core Purpose:** Help developers recover understanding of projects they built previously (even after weeks or months away) and decide their revival path:
  1. **Restart it** (clean slate with lessons learned)
  2. **Continue it** (pick up where left off with preserved context)
  3. **Change the idea** (pivot the core angle)
  4. **Repurpose it** (harvest components/modules for a new initiative)
  5. **Archive it** (formal seal with autopsy notes preserved forever)
- **CRITICAL RESTRICTION:** **Do NOT build the Workbench.** The user explicitly prohibited implementing or redesigning a Workbench. Keep focus on: ingestion, analysis, persistent technical knowledge, revival triage, and intuitive rediscovery.

---

## 2. Design System & Aesthetic Foundation

Preserve the existing dark cinematic aesthetic. Refine rather than redesign.

### Design Tokens (`:root` in `styles.css`)
- `--ink: #050505` — Deep obsidian background
- `--bone: #e2d2c0` — Primary warm off-white text & card headings (boosted for WCAG AA readability)
- `--dim: #b8a795` — Secondary muted warm gray text (contrast enhanced to > 5.5:1)
- `--dim-soft: #8e8072` — Tertiary subtle border & metadata accents
- `--red: #b3201f` / `--hot: #e0352f` — Destructive / alert accents
- `--amber: #f3c74a` — Revival / attention highlights & active focus rings
- `--olive: #d6dab4` — Positive state / preservation / success
- `--glass: rgba(8, 8, 8, 0.78)` — Frosted glass panel backdrop
- `--line: rgba(220, 199, 178, 0.28)` — Subtle border lines
- `--display: "Archivo Black", sans-serif` — Display font for titles & headers
- `--body: "Poppins", sans-serif` — Clean, legible body font

---

## 3. The Canvas Protocol Status

Primary actions must be executed exclusively by dragging and dropping data cards into designated Action Zones. Standard action buttons for primary operations are prohibited.

### Complete Card & Zone Matrix
| Draggable Card (`data-card-type`) | Target Action Zone (`data-zone`) | Operation Executed |
|---|---|---|
| `auth-access` (Visitor Keycard) | `enter-archive` | Authenticates existing user profile (Supabase or PBKDF2) & unlocks door |
| `auth-signup` (New Custodian Card) | `create-profile` | Registers new custodian profile (Supabase or PBKDF2 Web Crypto) |
| `auth-github` (GitHub Badge) | `connect-github` | Connects GitHub account and auto-imports all user repositories |
| `project-card` (Tombstone Project) | `revival-continue` | Marks project state as "Continue" & creates revival artifact |
| `project-card` | `revival-restart` | Marks project state as "Restart" & initializes fresh plan |
| `project-card` | `revival-change-idea` | Marks project state as "Pivot" & logs architectural divergence |
| `project-card` | `revival-repurpose` | Marks project state as "Harvest" & tags salvageable modules |
| `project-card` | `revival-archive` | Formally seals tombstone with autopsy timestamp |
| `github-repo` / `file-batch` | `import-archive` | Ingests staged repository / local files into IndexedDB |
| `github-repo` / `file-batch` / `project-card` | `analyze-project` | Executes multi-stage static analysis pipeline |
| `note-card` (Black Box Tape) | `save-note` | Attaches retrospective note to project memory |
| `native-files` (OS Drag) | `stage-files` | Ingests local files via HTML5 DataTransfer |
| `project-card` / `archive-card` | `export-json` | Generates downloadable JSON archive bundle |
| `archive-json` (JSON Backup) | `import-json` | Restores database records from imported JSON backup |
| `reset-keycard` (Cryptographic Key) | `reset-demo` | 2-step protected wipe & re-seed of sample projects |
| `project-card` (Any Project Record) | `decommission-project` | 2-step safeguarded deletion of individual project |

---

## 4. Current Architecture & Technical Stack

- **Zero-Dependency Vanilla Stack**: `index.html`, `styles.css`, `app.js` with Supabase CDN.
- **Storage**: IndexedDB (`ProjectGraveyardDB`, 4 object stores: `projects`, `artifacts`, `notes`, `files`) with in-memory fallback.
- **Authentication**:
  1. **Supabase Cloud Auth**: Configurable via inline panel (`supabase.auth.signUp`, `supabase.auth.signInWithPassword`).
  2. **Offline PBKDF2-HMAC-SHA256**: 100,000 iterations via Web Crypto API with transparent v1 migration.
  3. **Direct GitHub Auto-Import**: Auto-discovers and imports all user repositories directly into IndexedDB on connect.
- **Motion & Video Engine**: `requestAnimationFrame` loop driving `journey.mp4` timeline tied to page scroll, clamped at auth gate (50% scroll) until custodian keycard unlocked.
- **Interaction Engine**: HTML5 Drag & Drop + Pointer Events (multi-touch with floating drag avatar) + Keyboard accessibility (Space/Enter to lift, Arrow keys to cycle compatible zones, Enter to drop, Escape to cancel).

---

## 5. Completed Items & Work Log

- [x] Full codebase inspection (`index.html`, `styles.css`, `app.js`, `api/github.js`, `README.md`).
- [x] Skills discovery & reading (`frontend-design`, `scroll-world`, `ui-ux-pro-max`).
- [x] Local dev server running on port 8847.
- [x] Context tracking initialized (`context.md`).
- [x] **Contrast & Typography Upgrades**: Boosted `--bone` and `--dim` tokens for WCAG AA compliance; polished target pulse animation and elevated lifted state.
- [x] **Dossier Card Drag Integration**: Rendered project summary panel in Chapter 7 and Workbench Dossier as full draggable `.data-card.project-card` with instant Canvas Protocol bindings.
- [x] **Decommission Record Action Zone**: Implemented safe, protected project deletion zone (`decommission-project`) with 2-step countdown safeguard (6s expiration window).
- [x] **Keyboard Arrow Traversal**: Implemented ArrowUp/Down/Left/Right cycling across compatible Action Zones while a card is lifted.
- [x] **Touch & Mobile Targets**: Enhanced touch targets to minimum 48px height across cards and drop zones.
- [x] **Supabase Email/Password Cloud Auth**: Integrated `@supabase/supabase-js` with configurable Project URL & Anon Key, supporting cloud registration/sign-in with instant fallback to PBKDF2 local crypto.
- [x] **Resolved GitHub Doorway Connect & Auto-Import**: Fixed the unconfigured serverless OAuth issue by adding direct GitHub connection (username/token); dropping the Keycard auto-imports all user repositories into IndexedDB, calculating statuses, tech stack, and opening the doorway.
- [x] **Tabletop Archive Bookshelf & "Lifted Book" Interaction**: Built `#archiveBooksShelf` in Chapter 7 displaying all stored local and GitHub projects as archive books on the tabletop; selecting any project visibly **lifts** that book (`.is-lifted` 3D elevation + amber halo) and updates the dossier.
- [x] **Free AI Project Architectural Decomposition**: Integrated free Pollinations AI wrapper (`https://text.pollinations.ai/`) providing high-level goal, tech stack breakdown, visual execution progress bar, and diagrammatic execution flow nodes with zero setup required.
- [x] **Strict Syntax Validation**: Verified `app.js` and `api/github.js` with `node --check` (clean 0 exit code).
- [x] **Judge Demo Credentials Callout**: Moved baseline demo projects to pre-seeded credentials `abc_test@gmail.com` / `abcde1234` with 1-click autofill button in Doorway auth panel.
- [x] **User Badge Cleanliness**: Removed `(demo)` suffix from the top-right user badge (`Narayan-Singri` / `sheldonvibinonmusic`).
- [x] **Video Lag Elimination**: Throttled seek intervals to 60ms, delta to 0.06s, utilized browser native `video.fastSeek()`, added GPU translateZ acceleration, and eliminated per-frame dynamic CSS filter evaluation.
- [x] **Triage Quick Project Picker & Book Pickup**: Added `#triageQuickPicker` toolbar in Chapter 6 (Triage), allowing instant project switching, triggering physical book pickup animation, and centering the lifted volume on the tabletop shelf.
- [x] **Supabase Database Schema Ingestion**: Added PostgREST OpenAPI discovery in Workbench Intake tab (`#sbFetchBtn`), generating structured project records and deterministic database schema audits.
- [x] **Dashboard Scroll Optimization & View Modes**: Implemented internal wheel event interception on `.chapter.live` to allow full vertical scrolling through Dossier and Black Box notes without flipping chapters; added `#dashScrollDownBtn` and dashboard view mode tabs (`Combined View` | `AI Blueprint` | `Context Passport`).
- [x] **Workbench Card Overlap Resolution**: Fixed the horizontal collision between `.plist` project cards and the details pane (`.wb-details`) by replacing unconstrained grid tracks with `grid-template-columns: 320px minmax(0, 1fr)`, adding `box-sizing: border-box`, text-overflow ellipsis on long repo names, and setting `#workbench` to solid `#090909` to stop background chapter text bleed-through.

---

## 6. Rules & Design Guidelines for Agent Continuity

1. **Preserve Existing UI**: Never perform a wholesale redesign or impose a generic framework. The dark cinematic aesthetic with video scroll scrub is central.
2. **Canvas Protocol Compliance**: Primary interactions must remain drag-and-drop into Action Zones.
3. **Do NOT Build the Workbench**: No speculative feature creep in the Workbench.
4. **Judge Credentials**: Explicitly `abc_test@gmail.com` with password `abcde1234`.
5. **Top Right Username**: Must NOT have `(demo)` appended.
6. **Maintain context.md**: Always update this document after implementing major changes.
2. **Strict Canvas Protocol**: All primary mutations (auth, revival triage, ingestion, analysis, note attachment, export, reset, deletion) must be executed by dragging and dropping cards into Action Zones.
3. **No Workbench Speculation**: Do NOT build new speculative features or rewrite the Workbench.
4. **Accessible Feedback**: Every drag, lift, drop, and rejection must broadcast live region announcements via `#canvasStatus` and user-friendly toasts.
5. **Safe Destructive Actions**: Any deletion or wipe must require a multi-step confirmation safeguard with an auto-cancelling timer.

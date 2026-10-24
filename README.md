# Project Graveyard (ViSiONQUEST)

> **Remember. Recover. Reuse.**  
> A cinematic archive for unfinished projects—so you can remember what you were building, why you paused, and where to begin again.

---

## What is Project Graveyard?

When software projects go quiet, the code usually survives in a Git repository, but the context fades: why decisions were made, what approach failed, which blocker stopped momentum, and what the immediate next step was. 

**Project Graveyard** transforms project post-mortems into an active decision system. Rather than treating dormant repositories as failures with guilt-inducing badges, it preserves intent, reasoning, and reusable components to help developers either revive their work or salvage valuable pieces for the next idea.

---

## How the UI & Canvas Protocol Work

The interface is built as a zero-dependency, high-performance cinematic web experience using vanilla HTML5, CSS3, and modern Web APIs:

- **Cinematic Video Timeline (`journey.mp4`)**:
  - Full-screen fixed background video (`journey.mp4`) simulating a descent down stairs and through an archival corridor.
  - Pre-authentication scroll scrubbing is locked to the corridor doorway: `0.00s -> 5.00s` (`T_OUT = 5.00s`).
  - Upon authentication, a hardened state machine (`AT_GATE` ➔ `SEEKING_TO_ROOM` ➔ `PLAYING_ROOM_ENTRANCE` ➔ `ROOM_COMPLETE`) executes a direct jump to `16.00s` (`T_IN`), playing naturally through the doorway until resting steadily at `18.74s` (`T_END`) on tabletop dossiers.
  - The editorial cut intentionally omits seconds 5–16. Scroll scrubbing cannot overwrite playback or room resting state.
- **The Canvas Protocol**:
  - All primary actions execute exclusively by dragging `.data-card` elements into designated `.action-zone` drop targets.
  - Clicking action cards or zones provides guidance and accessibility announcements without executing the action.
  - Accessible via mouse Drag & Drop, touch devices (Pointer Events with floating drag avatars), and full keyboard navigation (Space/Enter to lift, Arrow keys to choose zone, Enter to drop, Escape to cancel).
  - ARIA live announcements via `#canvasStatus[role="status"][aria-live="polite"]`.
- **Local Demo Mode & Web Crypto PBKDF2**:
  - Runs 100% in-browser without external auth servers or database dependencies.
  - Passwords hashed using native `crypto.subtle` PBKDF2-HMAC-SHA256 (100,000 iterations) with unique per-profile salts.
  - Transparent automatic migration of legacy Stage 2 SHA-256 profiles to `v2-pbkdf2` upon login.
- **Unified IndexedDB Storage (`ProjectGraveyardDB`)**:
  - Client-side persistence using IndexedDB object stores (`projects`, `artifacts`, `notes`, `files`), with transparent in-memory fallback.
  - Seeds baseline demo projects (*Atlas*, *Lumen*, *Inkwell*) on first run without overwriting user-imported data.
- **Context Passport & Five Revival Workflows**:
  - Active projects dragged into any of the 5 revival action zones generate persistent, editable artifacts:
    1. **Continue** ➔ Warm-Boot Re-entry Checklist (with interactive checkboxes).
    2. **Restart** ➔ V2 Blueprint Card linked to V1.
    3. **Change idea** ➔ Scope Scalpel Board (Keep, Cut, Later columns).
    4. **Repurpose** ➔ Salvage Yard Asset Collection (extracted schemas & modules).
    5. **Archive** ➔ Post-Mortem / Epitaph Card (final state, lessons, wake-up triggers).
- **Public GitHub Import & Local File Intake**:
  - **Public GitHub REST API Import**: Fetch any public repo metadata, README, and tree structure without API keys.
  - **Local File/Folder Intake**: Native file picker and folder directory intake (`webkitdirectory`) with `FileReader` text reading. Excludes `node_modules`, `.git`, and binaries, and uses strict `textContent` rendering for security.
  - **Deterministic Structural Analysis**: Automated audits detecting manifest files (`package.json`, `Cargo.toml`, `requirements.txt`), test suites, and language breakdowns.
- **Black Box Notes & Provenance Tagging**:
  - Record blocker updates, failed tries, and next micro-steps with clear provenance labels (*User note*, *Observed*, *Derived suggestion*).
- **Context Readiness Score**:
  - Deterministic 0–100 score weighted across blocker clarity (30%), next-step specificity (30%), asset tagging (20%), and state freshness (20%).
- **Backup & Safe Reset**:
  - Full archive export to standard JSON file.
  - Validated JSON import and merge into IndexedDB.
  - Two-step confirmation drop to reset demo data.

---

## Current Status (Stage 3 Complete)

- [x] Hardened video state machine (`0s -> 5s` hold, direct jump to `16s`, resting at `18.74s`).
- [x] PBKDF2-HMAC-SHA256 password hashing with transparent migration.
- [x] Full Canvas Protocol across Doorway, Triage, Workbench, Intake, and Backup.
- [x] Touch Pointer Events and keyboard drag accessibility.
- [x] Unified IndexedDB store (`ProjectGraveyardDB`) with in-memory fallback.
- [x] 5 persistent revival artifact generators.
- [x] Public GitHub repository import & structural analysis.
- [x] Local file/folder staging and safe intake.
- [x] Black Box note intake with provenance tagging.
- [x] Deterministic 0–100 Context Readiness Score.
- [x] JSON backup export / import and two-step reset confirmation.
- [x] Serverless GitHub OAuth endpoint `api/github.js`.
- [x] Zero layout overflow across 1440px desktop, 768px tablet, 390px mobile, and 320px narrow mobile.

---

## Project Structure

```text
├── index.html        # Accessible semantic markup with Canvas Protocol & live regions
├── styles.css        # Visual system, cinematic shaders, Canvas Protocol, and responsive styles
├── app.js            # Video state machine, PBKDF2 crypto, IndexedDB store, Canvas controller
├── journey.mp4       # Archival camera footage mapped to scroll & direct transition jump
├── README.md         # Project documentation and status
├── api/
│   └── github.js     # Vercel serverless function for private GitHub OAuth (optional)
└── .gitignore        # Repository exclusions
```

---

## Running Locally

Because the application uses HTML5 Video byte-ranges, Web Crypto, and IndexedDB, serve the project root via any local HTTP server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .
```

Navigate to `http://localhost:8000/` in any modern web browser.

### Optional: Private GitHub OAuth Setup (Vercel Deployment)

Public GitHub imports work 100% out-of-the-box without credentials. To enable authorized private repository access on Vercel:

1. Create a GitHub OAuth App in your GitHub Developer Settings with callback URL:  
   `https://<your-vercel-domain>/api/github?action=callback`
2. Add these environment variables in your Vercel project settings:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `APP_BASE_URL` (e.g. `https://your-domain.vercel.app`)
   - `SESSION_ENCRYPTION_KEY` (optional 32-character string for encrypted session cookies)

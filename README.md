# Project Graveyard (ViSiONQUEST)

> **Remember. Recover. Reuse.**  
> A cinematic archive for unfinished projects—so you can remember what you were building, why you paused, and where to begin again.

---

## What is Project Graveyard?

When software projects go quiet, the code usually survives in a Git repository, but the context fades: why decisions were made, what approach failed, which blocker stopped momentum, and what the immediate next step was. 

**Project Graveyard** transforms project post-mortems into an active decision system. Rather than treating dormant repositories as failures with inactive status badges, it preserves intent, reasoning, and reusable components to help developers either revive their work or salvage valuable pieces for the next idea.

---

## How the UI is Built

The interface is built as a zero-dependency, high-performance cinematic web experience using vanilla HTML5, CSS3, and JavaScript:

- **Cinematic Camera Journey (`journey.mp4`)**:
  - A full-screen background video (`journey.mp4`) serves as the emotional anchor, simulating a walk down stairs and through an archival corridor.
  - Video playback is mapped directly to user scroll position through a custom timeline synchronization function (`vt(p)`).
  - Uses a fixed viewport stage with `object-fit: cover`, hardware-accelerated transforms, and subtle pointer-based parallax depth drift.
- **Atmosphere & Visual System**:
  - Dark ink theme (`--ink: #050505`) paired with bone/cream typography (`--bone: #dcc7b2`) and amber accents (`--amber: #f3c74a`).
  - Layered visual effects: soft-light warm tint, radial scrim gradient, procedural SVG turbulence grain, and frosted-glass panels (`backdrop-filter: blur(16px)`).
  - Typography powered by *Archivo Black* for display headings and *Poppins* for body copy.
- **Scroll Navigation & Responsive Design**:
  - Right-hand dynamic chapter rail indicating current position with smooth-scroll targeting.
  - Staggered entrance animations with reduced-motion fallbacks (`prefers-reduced-motion`).
  - Fully responsive layout engineered for displays ranging from 1440px desktop viewports down to 320px mobile viewports.

---

## Current Status (Phase 1)

The first phase establishes the opening narrative sequence up to the archive doorway:

1. **Hero**: Sets the core philosophy without guilt-heavy labels; provides the initial descent prompt.
2. **The Problem**: *"When context fades, restarting costs more."*—highlights that code survives while intent and next steps vanish.
3. **The Three Losses**: Categorizes what actually goes missing:
   - **Lost intent**: Forgotten original MVP scope and problem promise.
   - **Lost reasoning**: Missing rationale behind failed attempts and active blockers.
   - **Stranded value**: Working components and schemas trapped in dormant repos.
4. **Archive Bridge**: *"The work is not gone. Its story is scattered."*—compact, left-aligned glass panel guiding the eye toward the physical doorway in the corridor.
5. **The Doorway**: *"Step inside. The records are kept here."*—the transition point into the archive.

*Later prototype chapters (Product Model, 5-Path Revival Triage, Dossier Black Box, and the high-density Workbench mode) are conceptually drafted and frozen for subsequent implementation phases.*

---

## Project Structure

```text
├── index.html        # Semantic markup and structure
├── styles.css        # Visual system, cinematic shaders, and responsive rules
├── app.js            # Video engine, scroll sync, chapter rail, and demo state
├── journey.mp4       # Archival camera footage mapped to scroll
└── README.md         # Project documentation and status
```

---

## Running Locally

Because the application uses browser media and module/asset loading, serve the project root via any local HTTP server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .
```

Navigate to `http://localhost:8000/` in any modern web browser.

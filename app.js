(() => {
"use strict";

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const clamp = (v,a=0,b=1) => Math.min(b,Math.max(a,v));
const smooth = t => { t = clamp(t); return t*t*(3-2*t); };
const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;

/* ========================================================
   TIMELINE CONSTANTS & EDITORIAL SPECIFICATION
   CUT = 0.5: Doorway authentication gate scroll threshold.
   T_OUT = 5.0: Pause frame at the gate (5.0s).
   T_IN = 16.0: Room entrance frame jumped to upon auth (16.0s).
   T_END = 18.74: Resting frame showing tabletop dossiers (18.74s).
   Seconds 5–16 are never played or scrubbed through.
   ======================================================== */
const CUT = 0.5, T_OUT = 5.0, T_IN = 16.0, T_END = 18.74;

/* ========================================================
   VIDEO STATE MACHINE
   ======================================================== */
const VIDEO_STATES = {
  AT_GATE: "AT_GATE",
  SEEKING_TO_ROOM: "SEEKING_TO_ROOM",
  PLAYING_ROOM_ENTRANCE: "PLAYING_ROOM_ENTRANCE",
  ROOM_COMPLETE: "ROOM_COMPLETE",
  PLAYBACK_BLOCKED: "PLAYBACK_BLOCKED"
};
let videoState = VIDEO_STATES.AT_GATE;

/* ========================================================
   LIVE CANVAS STATUS & ACCESSIBLE ANNOUNCEMENTS
   ======================================================== */
const canvasStatusEl = $("#canvasStatus");
function announceCanvas(message) {
  if (canvasStatusEl) {
    canvasStatusEl.textContent = message;
  }
}

const toastEl = $("#toast");
let toastTimer;
function toast(m) {
  if (!toastEl) return;
  toastEl.textContent = m;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3200);
  announceCanvas(m);
}

/* ========================================================
   UNIFIED STORAGE: INDEXEDDB (ProjectGraveyardDB)
   ======================================================== */
const DB_NAME = "ProjectGraveyardDB";
const DB_VERSION = 1;
let idbInstance = null;
const memoryStore = { projects: {}, artifacts: {}, notes: {}, files: {} };

function openDatabase() {
  return new Promise((resolve) => {
    if (!window.indexedDB) {
      console.warn("IndexedDB unavailable; operating in in-memory fallback mode.");
      resolve(null);
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("projects")) db.createObjectStore("projects", { keyPath: "id" });
      if (!db.objectStoreNames.contains("artifacts")) db.createObjectStore("artifacts", { keyPath: "id" });
      if (!db.objectStoreNames.contains("notes")) db.createObjectStore("notes", { keyPath: "id" });
      if (!db.objectStoreNames.contains("files")) db.createObjectStore("files", { keyPath: "id" });
    };
    req.onsuccess = (e) => {
      idbInstance = e.target.result;
      resolve(idbInstance);
    };
    req.onerror = (e) => {
      console.warn("IndexedDB open error:", e.target.error, "Using in-memory fallback.");
      resolve(null);
    };
  });
}

async function dbGetAll(storeName) {
  if (idbInstance) {
    return new Promise((resolve) => {
      try {
        const tx = idbInstance.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve(Object.values(memoryStore[storeName] || {}));
      } catch (_) {
        resolve(Object.values(memoryStore[storeName] || {}));
      }
    });
  }
  return Object.values(memoryStore[storeName] || {});
}

async function dbPut(storeName, item) {
  memoryStore[storeName][item.id] = item;
  if (idbInstance) {
    return new Promise((resolve) => {
      try {
        const tx = idbInstance.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const req = store.put(item);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(true);
      } catch (_) {
        resolve(true);
      }
    });
  }
  return true;
}

async function dbDelete(storeName, id) {
  delete memoryStore[storeName][id];
  if (idbInstance) {
    return new Promise((resolve) => {
      try {
        const tx = idbInstance.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const req = store.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(true);
      } catch (_) {
        resolve(true);
      }
    });
  }
  return true;
}

async function dbClear(storeName) {
  memoryStore[storeName] = {};
  if (idbInstance) {
    return new Promise((resolve) => {
      try {
        const tx = idbInstance.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const req = store.clear();
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(true);
      } catch (_) {
        resolve(true);
      }
    });
  }
  return true;
}

/* Baseline Demo Seeds */
const BASELINE_DEMO_PROJECTS = [
  {
    id: "atlas",
    name: "Atlas",
    status: "Paused",
    ready: "Ready",
    tech: "TypeScript",
    hours: 5,
    last: "Schema parser complete",
    vision: "UI done; sync left",
    cause: "Paused during semester exams",
    blocker: "OAuth callback in auth.ts",
    failed: "Custom token refresh loop",
    next: "Test provider redirect URL",
    demoSeed: true,
    createdAt: "2026-03-01T10:00:00.000Z",
    updatedAt: "2026-03-12T14:30:00.000Z"
  },
  {
    id: "lumen",
    name: "Lumen",
    status: "Blocked",
    ready: "Partial",
    tech: "Python",
    hours: 16,
    last: "Data loader works on sample set",
    vision: "Model trained; no front end",
    cause: "Waiting on a dataset licence",
    blocker: "Licence terms unclear",
    failed: "Scraping the public mirror",
    next: "Email the dataset owner",
    demoSeed: true,
    createdAt: "2026-02-15T09:00:00.000Z",
    updatedAt: "2026-03-05T18:00:00.000Z"
  },
  {
    id: "inkwell",
    name: "Inkwell",
    status: "Dormant",
    ready: "Needs notes",
    tech: "React",
    hours: 2,
    last: "Editor toolbar renders",
    vision: "Toolbar done; export left",
    cause: "Priorities changed",
    blocker: "Not recorded yet",
    failed: "Not recorded yet",
    next: "Write down the blocker first",
    demoSeed: true,
    createdAt: "2026-01-20T11:00:00.000Z",
    updatedAt: "2026-01-25T16:00:00.000Z"
  }
];

let activeProjects = [];
let currentProject = BASELINE_DEMO_PROJECTS[0];

async function initializeDatabase() {
  await openDatabase();
  const existing = await dbGetAll("projects");
  if (!existing || existing.length === 0) {
    for (const p of BASELINE_DEMO_PROJECTS) {
      await dbPut("projects", p);
    }
    activeProjects = [...BASELINE_DEMO_PROJECTS];
  } else {
    activeProjects = existing;
  }
  currentProject = activeProjects[0] || BASELINE_DEMO_PROJECTS[0];
  updateProjectViews();
  loadAllArtifacts();
}

/* ========================================================
   CONTEXT READINESS SCORE (0–100 DETERMINISTIC ENGINE)
   30% Blocker clarity · 30% Next-step specificity · 20% Asset tagging · 20% State freshness
   ======================================================== */
function computeReadinessScore(p) {
  if (!p) return 0;
  let blockerScore = 0;
  if (p.blocker && p.blocker !== "Not recorded yet") {
    blockerScore = p.blocker.length > 15 ? 90 : 70;
  }
  let nextScore = 0;
  if (p.next && p.next !== "Write down the blocker first") {
    nextScore = p.next.length > 15 ? 90 : 70;
  }
  let assetScore = p.tech && p.tech !== "Unknown" ? 80 : 30;
  let freshnessScore = 60;
  if (p.last && p.last.length > 10) freshnessScore += 25;

  const total = (blockerScore * 0.3) + (nextScore * 0.3) + (assetScore * 0.2) + (freshnessScore * 0.2);
  return Math.round(total);
}

/* Interactive Sliders in Chapter Trust */
const sl = [1,2,3,4].map(i => $("#s"+i)), W = [.3,.3,.2,.2];
function updateTrustScore() {
  let s = 0;
  sl.forEach((e,i) => {
    if (e && $("#o"+(i+1))) {
      $("#o"+(i+1)).textContent = e.value;
      s += e.value * W[i];
    }
  });
  if ($("#score")) $("#score").textContent = Math.round(s);
}
sl.forEach(e => { if (e) e.addEventListener("input", updateTrustScore); });
updateTrustScore();

/* ========================================================
   REVIVAL PATH DEFINITIONS & ARTIFACT GENERATOR
   ======================================================== */
const PATHS = {
  Continue: {
    when: "Spark: the idea still pulls you.",
    d: "Existing direction is valid and worth resuming.",
    a: "Review recorded context and confirm immediate micro-tasks.",
    o: "Warm-Boot Re-entry Checklist",
    r: "Warm-boot checklist generated: re-open active blocker file, verify last state, then test next micro-step."
  },
  Restart: {
    when: "Build: the approach, not the goal, is the problem.",
    d: "Core goal remains useful, but the current build needs replacement.",
    a: "Carry forward lessons while resetting the technical approach.",
    o: "V2 Blueprint Card (linked to V1)",
    r: "V2 blueprint created and linked to V1. Lessons carried over, technical approach reset."
  },
  "Change idea": {
    when: "Blocker: the scope is the wall.",
    d: "Original scope is too broad, blocked, or misaligned.",
    a: "Sort proposed features to isolate a smaller, achievable build.",
    o: "Scope Scalpel Board",
    r: "Scope Scalpel board opened: sort features into Keep, Cut, or Later."
  },
  Repurpose: {
    when: "Pause: the product ends, the parts do not.",
    d: "Full product idea ends, but specific components hold value.",
    a: "Tag working parts and lessons for cross-project discovery.",
    o: "Salvage Yard Asset Collection",
    r: "Working parts tagged and added to the Salvage Yard with their source project context."
  },
  Archive: {
    when: "Decision: stop, with no guilt.",
    d: "Stop pursuing the project for now or permanently.",
    a: "Document final state, takeaways, and future wake-up conditions.",
    o: "Post-Mortem / Epitaph Card",
    r: "Epitaph card written: final state, takeaways, and wake-up conditions recorded."
  }
};

async function generateRevivalArtifact(pathName, project) {
  const p = project || currentProject;
  const artifactId = `art_${p.id}_${pathName.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`;
  let artifactData = {
    id: artifactId,
    projectId: p.id,
    projectName: p.name,
    pathName,
    createdAt: new Date().toISOString()
  };

  if (pathName === "Continue") {
    artifactData.title = `Warm-Boot Checklist · ${p.name}`;
    artifactData.type = "checklist";
    artifactData.items = [
      { id: "c1", label: `Inspect repository tree and verify environment for ${p.tech}`, done: true },
      { id: "c2", label: `Review last working state: "${p.last}"`, done: true },
      { id: "c3", label: `Re-examine active blocker: "${p.blocker}"`, done: false },
      { id: "c4", label: `Execute smallest next micro-step: "${p.next}"`, done: false },
      { id: "c5", label: `Run automated tests or test build before committing`, done: false }
    ];
  } else if (pathName === "Restart") {
    artifactData.title = `V2 Blueprint Card (linked to ${p.name} V1)`;
    artifactData.type = "blueprint";
    artifactData.v1Ref = p.id;
    artifactData.v1Lessons = p.failed || "Failed approach logged in V1 black box";
    artifactData.v2Scope = `A clean, focused restart addressing "${p.vision}" without the failed legacy architecture.`;
    artifactData.firstMile = `Scaffold minimum viable proof of concept around: ${p.next}`;
  } else if (pathName === "Change idea") {
    artifactData.title = `Scope Scalpel Board · ${p.name}`;
    artifactData.type = "scopescalpel";
    artifactData.keep = [`Core value promise: ${p.vision}`, `Essential mechanism in ${p.tech}`];
    artifactData.cut = [`Failed approach: ${p.failed}`, `Blocked complexity: ${p.blocker}`];
    artifactData.later = [`Secondary bells and whistles`, `Multi-provider integrations`];
  } else if (pathName === "Repurpose") {
    artifactData.title = `Salvage Yard Asset Collection · from ${p.name}`;
    artifactData.type = "salvage";
    artifactData.assets = [
      { name: "Verified Working Module", desc: p.last, tech: p.tech },
      { name: "Documented Anti-Pattern", desc: p.failed, tag: "Lesson" },
      { name: "Target Schema / Concept", desc: p.vision, tag: "Architecture" }
    ];
  } else if (pathName === "Archive") {
    artifactData.title = `Post-Mortem / Epitaph Card · ${p.name}`;
    artifactData.type = "epitaph";
    artifactData.finalState = p.last;
    artifactData.pauseCause = p.cause;
    artifactData.coreTakeaway = `Approach tried: "${p.failed}". Unfinished next step: "${p.next}".`;
    artifactData.wakeCondition = `Revisit only if a library solves "${p.blocker}" or priorities realign.`;
  }

  await dbPut("artifacts", artifactData);
  renderArtifactInContainer($("#triageArtifactOutput"), artifactData);
  $("#triageArtifactOutput").style.display = "block";
  loadAllArtifacts();
  toast(`Generated ${artifactData.title}`);
  return artifactData;
}

function renderArtifactInContainer(container, art) {
  if (!container || !art) return;
  let content = "";
  if (art.type === "checklist") {
    content = `
      <div class="artifact-head">
        <h4 class="artifact-title">${escapeHtml(art.title)}</h4>
        <span class="artifact-tag">CHECKLIST · ${escapeHtml(art.projectName)}</span>
      </div>
      <div class="checklist-list">
        ${art.items.map(item => `
          <label class="checklist-item ${item.done ? 'done' : ''}">
            <input type="checkbox" data-artid="${art.id}" data-itemid="${item.id}" ${item.done ? 'checked' : ''}>
            <span>${escapeHtml(item.label)}</span>
          </label>
        `).join("")}
      </div>`;
  } else if (art.type === "blueprint") {
    content = `
      <div class="artifact-head">
        <h4 class="artifact-title">${escapeHtml(art.title)}</h4>
        <span class="artifact-tag">V2 BLUEPRINT · ${escapeHtml(art.projectName)}</span>
      </div>
      <div style="font-size:13.5px;line-height:1.6">
        <p><b>V1 Anti-Pattern:</b> <span class="muted">${escapeHtml(art.v1Lessons)}</span></p>
        <p style="margin-top:8px"><b>V2 Clean Sheet Scope:</b> ${escapeHtml(art.v2Scope)}</p>
        <p style="margin-top:8px;color:var(--amber)"><b>First-Mile Execution:</b> ${escapeHtml(art.firstMile)}</p>
      </div>`;
  } else if (art.type === "scopescalpel") {
    content = `
      <div class="artifact-head">
        <h4 class="artifact-title">${escapeHtml(art.title)}</h4>
        <span class="artifact-tag">SCOPE SCALPEL · ${escapeHtml(art.projectName)}</span>
      </div>
      <div class="scope-grid">
        <div class="scope-col">
          <h4 style="color:var(--olive)">Keep (Core)</h4>
          <ul>${art.keep.map(k=>`<li>${escapeHtml(k)}</li>`).join("")}</ul>
        </div>
        <div class="scope-col">
          <h4 style="color:var(--hot)">Cut (Wall)</h4>
          <ul>${art.cut.map(c=>`<li>${escapeHtml(c)}</li>`).join("")}</ul>
        </div>
        <div class="scope-col">
          <h4 style="color:var(--dim)">Later (Shelved)</h4>
          <ul>${art.later.map(l=>`<li>${escapeHtml(l)}</li>`).join("")}</ul>
        </div>
      </div>`;
  } else if (art.type === "salvage") {
    content = `
      <div class="artifact-head">
        <h4 class="artifact-title">${escapeHtml(art.title)}</h4>
        <span class="artifact-tag">SALVAGE YARD · ${escapeHtml(art.projectName)}</span>
      </div>
      <div class="salvage-grid">
        ${art.assets.map(a => `
          <div class="salvage-item">
            <b>${escapeHtml(a.name)}</b>
            <span class="muted">${escapeHtml(a.desc)}</span>
            ${a.tag ? `<span class="tag" style="margin-top:6px">${escapeHtml(a.tag)}</span>` : ''}
          </div>
        `).join("")}
      </div>`;
  } else if (art.type === "epitaph") {
    content = `
      <div class="artifact-head">
        <h4 class="artifact-title">${escapeHtml(art.title)}</h4>
        <span class="artifact-tag">POST-MORTEM · ${escapeHtml(art.projectName)}</span>
      </div>
      <div style="font-size:13.5px;line-height:1.6">
        <p><b>Final State:</b> ${escapeHtml(art.finalState)}</p>
        <p style="margin-top:6px"><b>Pause Cause:</b> ${escapeHtml(art.pauseCause)}</p>
        <p style="margin-top:6px"><b>Core Takeaway:</b> <span class="muted">${escapeHtml(art.coreTakeaway)}</span></p>
        <p style="margin-top:8px;color:var(--amber)"><b>Wake-up Condition:</b> ${escapeHtml(art.wakeCondition)}</p>
      </div>`;
  }

  container.innerHTML = content;
  $$("input[type='checkbox']", container).forEach(cb => {
    cb.onchange = async () => {
      const artId = cb.dataset.artid;
      const itemId = cb.dataset.itemid;
      const allArts = await dbGetAll("artifacts");
      const targetArt = allArts.find(a => a.id === artId);
      if (targetArt && targetArt.items) {
        const it = targetArt.items.find(x => x.id === itemId);
        if (it) {
          it.done = cb.checked;
          await dbPut("artifacts", targetArt);
          cb.closest(".checklist-item").classList.toggle("done", cb.checked);
        }
      }
    };
  });
}

async function loadAllArtifacts() {
  const container = $("#wbArtifactList");
  if (!container) return;
  const arts = await dbGetAll("artifacts");
  if (arts.length === 0) {
    container.innerHTML = `<p class="muted">No revival artifacts generated yet. Drag an active project into any Revival Zone to create one.</p>`;
    return;
  }
  container.innerHTML = "";
  arts.slice().reverse().forEach(art => {
    const wrap = document.createElement("div");
    wrap.className = "artifact-card";
    wrap.style.cssText = "margin-bottom:14px;border:1px solid var(--line);border-radius:12px;padding:14px;background:rgba(0,0,0,.45);";
    renderArtifactInContainer(wrap, art);
    container.appendChild(wrap);
  });
}

/* ========================================================
   RENDER DOSSIERS & ACTIVE PROJECT VIEWS
   ======================================================== */
function renderDossier(el, p) {
  if (!el || !p) return;
  const score = computeReadinessScore(p);
  el.innerHTML = `
    <div class="side">
      <h3>▸ ${escapeHtml(p.name)}</h3>
      <span class="tag">${escapeHtml(p.status)}</span>
      <span class="tag">Score: ${score}/100</span>
      <dl>
        <dt>Last state</dt><dd>${escapeHtml(p.last)}</dd>
        <dt>Tech</dt><dd>${escapeHtml(p.tech)}</dd>
      </dl>
    </div>
    <div class="black">
      <h3>Dossier & Black Box</h3>
      <div class="rows">
        <div><b>Vision vs reality</b><span>${escapeHtml(p.vision)}</span></div>
        <div><b>Pause cause</b><span>${escapeHtml(p.cause)}</span></div>
        <div><b>Blocker</b><span>${escapeHtml(p.blocker)}</span></div>
        <div><b>Failed try</b><span>${escapeHtml(p.failed)}</span></div>
        <div class="next"><b>Next step</b><span>${escapeHtml(p.next)}</span></div>
      </div>
      <div class="choose">
        <span>Preview Revival Outputs</span>
        <div>${Object.keys(PATHS).map(k=>`<button data-path="${k}">${k}</button>`).join("")}</div>
      </div>
      <div class="result" aria-live="polite">Drag this project into a Revival Zone to create its artifact.</div>
    </div>`;
  $$("[data-path]", el).forEach(b => {
    b.onclick = () => { $(".result", el).textContent = PATHS[b.dataset.path].r; };
  });
}

function updateProjectViews() {
  const dA = $("#dossierA");
  const dB = $("#dossierB");
  if (dA) renderDossier(dA, currentProject);
  if (dB) renderDossier(dB, currentProject);

  const tTitle = $("#triageCardTitle");
  const tSub = $("#triageCardSub");
  const tCard = $("#triageProjectCard");
  if (tTitle) tTitle.textContent = `▸ ${currentProject.name}`;
  if (tSub) tSub.textContent = `${currentProject.status} · ${currentProject.tech} · ${computeReadinessScore(currentProject)}/100 readiness`;
  if (tCard) {
    tCard.dataset.projectId = currentProject.id;
    tCard.setAttribute("aria-label", `Active Project: ${currentProject.name}. Drag into any Revival Zone below, or press Space to lift.`);
  }

  drawWorkbenchList();
  loadProjectNotes(currentProject.id);
}

/* ========================================================
   REVIVAL TRIAGE TABLIST
   ======================================================== */
const pathsEl = $("#paths"), pathcard = $("#pathcard"), trig = $("#trigger");
function showPath(name) {
  const p = PATHS[name];
  if (!p) return;
  $$("button", pathsEl).forEach(b => b.setAttribute("aria-selected", b.dataset.k === name));
  if (trig) trig.textContent = p.when;
  if (pathcard) {
    pathcard.innerHTML = `
      <div><h3>Decision</h3><p>${escapeHtml(p.d)}</p></div>
      <div><h3>Action</h3><p>${escapeHtml(p.a)}</p></div>
      <div><h3>Output</h3><div class="out">${escapeHtml(p.o)}</div></div>`;
  }
}
if (pathsEl) {
  pathsEl.innerHTML = "";
  Object.keys(PATHS).forEach(k => {
    const b = document.createElement("button");
    b.textContent = k;
    b.dataset.k = k;
    b.setAttribute("role", "tab");
    b.onclick = () => showPath(k);
    pathsEl.appendChild(b);
  });
  showPath("Continue");
}

/* ========================================================
   UPGRADED CRYPTOGRAPHY & DEMO CREDENTIAL DERIVATION
   PBKDF2-HMAC-SHA256 (100,000 iterations) with transparent v1 migration
   ======================================================== */
const STORAGE_KEYS = {
  PROFILES: "pg_demo_profiles_v1",
  SESSION: "pg_demo_session_v1"
};

let inMemoryProfiles = {};
let inMemorySession = null;

function getStoredProfiles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILES);
    return raw ? JSON.parse(raw) : inMemoryProfiles;
  } catch (e) {
    return inMemoryProfiles;
  }
}

function saveStoredProfiles(profiles) {
  inMemoryProfiles = profiles;
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
  } catch (_) {}
}

function getStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    return raw ? JSON.parse(raw) : inMemorySession;
  } catch (_) {
    return inMemorySession;
  }
}

function saveStoredSession(session) {
  inMemorySession = session;
  try {
    if (session) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  } catch (_) {}
}

function clearDemoSession() {
  saveStoredSession(null);
}

function generateDemoSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function deriveDemoKeyPBKDF2(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const saltBytes = enc.encode(salt);
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(derived)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function verifyLegacySHA256(password, salt) {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

/* Optional EmailJS Notification (Owner only, offline defaults) */
const EMAIL_NOTIFICATION_CONFIG = {
  publicKey: "",
  serviceId: "",
  templateId: ""
};

async function sendDemoEmailNotification(eventType, email) {
  const { publicKey, serviceId, templateId } = EMAIL_NOTIFICATION_CONFIG;
  if (!publicKey || !serviceId || !templateId) {
    return { sent: false, reason: "not_configured" };
  }
  try {
    const payload = {
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      template_params: {
        event_type: eventType,
        user_email: email,
        timestamp: new Date().toISOString(),
        mode: "Demo Mode (local)"
      }
    };
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return { sent: res.ok };
  } catch (_) {
    return { sent: false };
  }
}

/* ========================================================
   AUTHENTICATION & DOORWAY CONTROLLER
   ======================================================== */
const authState = {
  user: null,
  authenticated: false,
  mode: "signin",
  inRoom: false
};

const authEmail = $("#authEmail");
const authPassword = $("#authPassword");
const passwordLabel = $("#passwordLabel");
const passwordField = $("#passwordField");
const emailField = $("#emailField");
const authToggleBtn = $("#authToggleBtn");
const authGithubToggleBtn = $("#authGithubToggleBtn");
const authForgotBtn = $("#authForgotBtn");
const authBackBtn = $("#authBackBtn");
const authMsg = $("#authMsg");
const authEyebrow = $("#authEyebrow");
const authHeading = $("#authHeading");
const authSub = $("#authSub");
const userBadge = $("#userBadge");
const signOutBtn = $("#signOutBtn");

const authAccessCard = $("#authAccessCard");
const authSignupCard = $("#authSignupCard");
const authGithubCard = $("#authGithubCard");
const authEnterZone = $("#authEnterZone");
const authCreateZone = $("#authCreateZone");
const authGithubZone = $("#authGithubZone");

function setAuthMessage(text, type = "info") {
  if (!authMsg) return;
  if (!text) {
    authMsg.className = "auth-msg";
    authMsg.textContent = "";
    authMsg.style.display = "none";
    return;
  }
  authMsg.className = `auth-msg ${type}`;
  authMsg.textContent = text;
  authMsg.style.display = "block";
  announceCanvas(text);
}

function setAuthMode(mode) {
  authState.mode = mode;
  setAuthMessage("");

  if (authAccessCard) authAccessCard.style.display = mode === "signin" ? "block" : "none";
  if (authSignupCard) authSignupCard.style.display = mode === "signup" ? "block" : "none";
  if (authGithubCard) authGithubCard.style.display = mode === "github" ? "block" : "none";

  if (authEnterZone) authEnterZone.style.display = mode === "signin" ? "block" : "none";
  if (authCreateZone) authCreateZone.style.display = mode === "signup" ? "block" : "none";
  if (authGithubZone) authGithubZone.style.display = mode === "github" ? "block" : "none";

  if (mode === "signin") {
    authEyebrow.textContent = "YOUR ARCHIVE AWAITS";
    authHeading.textContent = "Your work is waiting.";
    authSub.textContent = "Sign in with a demo profile stored in this browser, or create a new profile.";
    emailField.style.display = "grid";
    passwordField.style.display = "grid";
    passwordLabel.textContent = "Password";
    authPassword.autocomplete = "current-password";
    authToggleBtn.style.display = "inline-block";
    authToggleBtn.textContent = "Create account";
    authGithubToggleBtn.style.display = "inline-block";
    authForgotBtn.style.display = "inline-block";
    authBackBtn.style.display = "none";
  } else if (mode === "signup") {
    authEyebrow.textContent = "YOUR ARCHIVE AWAITS";
    authHeading.textContent = "Start preserving your work.";
    authSub.textContent = "Create a local demo profile to begin recording what you built, why you paused, and what to do next.";
    emailField.style.display = "grid";
    passwordField.style.display = "grid";
    passwordLabel.textContent = "Create password";
    authPassword.autocomplete = "new-password";
    authToggleBtn.style.display = "inline-block";
    authToggleBtn.textContent = "Already have an account? Sign in";
    authGithubToggleBtn.style.display = "inline-block";
    authForgotBtn.style.display = "none";
    authBackBtn.style.display = "none";
  } else if (mode === "github") {
    authEyebrow.textContent = "GITHUB ARCHIVE CONNECT";
    authHeading.textContent = "Connect with GitHub.";
    authSub.textContent = "Sign in through your GitHub account to access both public and authorized private repositories.";
    emailField.style.display = "none";
    passwordField.style.display = "none";
    authToggleBtn.style.display = "none";
    authGithubToggleBtn.style.display = "none";
    authForgotBtn.style.display = "none";
    authBackBtn.style.display = "inline-block";
  } else if (mode === "forgot") {
    authEyebrow.textContent = "DEMO ACCESS RECOVERY";
    authHeading.textContent = "Local demo recovery.";
    authSub.textContent = "Password recovery is unavailable in browser-local Demo Mode. To start fresh, create a new demo profile with another email address.";
    emailField.style.display = "none";
    passwordField.style.display = "none";
    if (authAccessCard) authAccessCard.style.display = "none";
    if (authEnterZone) authEnterZone.style.display = "none";
    authToggleBtn.style.display = "none";
    authGithubToggleBtn.style.display = "none";
    authForgotBtn.style.display = "none";
    authBackBtn.style.display = "inline-block";
  }
}

if (authToggleBtn) authToggleBtn.onclick = () => setAuthMode(authState.mode === "signin" ? "signup" : "signin");
if (authGithubToggleBtn) authGithubToggleBtn.onclick = () => setAuthMode("github");
if (authForgotBtn) authForgotBtn.onclick = () => setAuthMode("forgot");
if (authBackBtn) authBackBtn.onclick = () => setAuthMode("signin");

async function executeAuthAction(actionType) {
  const email = (authEmail?.value || "").trim().toLowerCase();
  const password = authPassword?.value || "";
  setAuthMessage("");

  if (actionType === "connect-github") {
    // Initiate OAuth status check / redirect
    setAuthMessage("Checking GitHub integration status…", "info");
    try {
      const res = await fetch("/api/github?action=status");
      const data = await res.json();
      if (!data.configured) {
        setAuthMessage(data.message, "info");
        return;
      }
      setAuthMessage("Redirecting to GitHub OAuth authorization…", "info");
      window.location.href = "/api/github?action=login";
    } catch (_) {
      setAuthMessage("Private GitHub OAuth endpoint is unconfigured. Public repository import is active in Workbench.", "info");
    }
    return;
  }

  // Validate form inputs
  if (!email || !email.includes("@") || !email.includes(".")) {
    setAuthMessage("Please enter a valid email address.", "error");
    authEmail?.focus();
    return;
  }
  if (!password || password.length < 6) {
    setAuthMessage("Password must be at least 6 characters long.", "error");
    authPassword?.focus();
    return;
  }

  const profiles = getStoredProfiles();

  if (actionType === "create-profile") {
    if (profiles[email]) {
      setAuthMessage("A demo profile with this email already exists on this browser. Drop the Sign In keycard instead.", "error");
      return;
    }
    const salt = generateDemoSalt();
    const hash = await deriveDemoKeyPBKDF2(password, salt);
    profiles[email] = {
      email,
      salt,
      hash,
      algorithm: "v2-pbkdf2",
      createdAt: new Date().toISOString()
    };
    saveStoredProfiles(profiles);

    const session = { email, signedInAt: new Date().toISOString() };
    saveStoredSession(session);
    sendDemoEmailNotification("demo_signup", email);

    setAuthMessage("Demo profile created with PBKDF2 credentials! Stepping inside the archive…", "success");
    setTimeout(() => onAuthSuccess(session, false), 400);

  } else if (actionType === "enter-archive") {
    const profile = profiles[email];
    if (!profile) {
      setAuthMessage("No demo profile found for this email. Switch to 'Create account' to begin.", "error");
      return;
    }

    let isValid = false;
    // Check if migration from v1 is needed
    if (profile.algorithm === "v2-pbkdf2") {
      const hash = await deriveDemoKeyPBKDF2(password, profile.salt);
      isValid = (hash === profile.hash);
    } else {
      // Legacy SHA-256 verification
      const legacyHash = await verifyLegacySHA256(password, profile.salt);
      if (legacyHash === profile.hash) {
        isValid = true;
        // Transparent upgrade to PBKDF2
        profile.salt = generateDemoSalt();
        profile.hash = await deriveDemoKeyPBKDF2(password, profile.salt);
        profile.algorithm = "v2-pbkdf2";
        profile.migratedAt = new Date().toISOString();
        saveStoredProfiles(profiles);
        console.info(`[Demo Mode] Upgraded profile credentials for ${email} to PBKDF2-HMAC-SHA256 (100k iterations).`);
      }
    }

    if (!isValid) {
      setAuthMessage("Incorrect demo password. Please try again.", "error");
      return;
    }

    const session = { email, signedInAt: new Date().toISOString() };
    saveStoredSession(session);
    sendDemoEmailNotification("demo_signin", email);

    setAuthMessage("Demo credentials verified! Stepping inside the archive…", "success");
    setTimeout(() => onAuthSuccess(session, false), 400);
  }
}

function onAuthSuccess(session, isRestored) {
  authState.user = { email: session.email };
  authState.authenticated = true;
  updateAuthHeader();

  if (isRestored) {
    authState.inRoom = true;
    videoState = VIDEO_STATES.ROOM_COMPLETE;
    try { video.currentTime = T_END; } catch(_) {}
    toast(`Welcome back, ${session.email} (Demo Mode)`);
  } else {
    enterArchiveRoom();
  }
}

function updateAuthHeader() {
  if (authState.authenticated && authState.user) {
    if (userBadge) {
      userBadge.textContent = authState.user.email.split("@")[0] + " (demo)";
      userBadge.style.display = "inline-block";
    }
    if (signOutBtn) signOutBtn.style.display = "inline-block";
  } else {
    if (userBadge) userBadge.style.display = "none";
    if (signOutBtn) signOutBtn.style.display = "none";
  }
}

function handleSignOut() {
  clearDemoSession();
  authState.user = null;
  authState.authenticated = false;
  authState.inRoom = false;
  videoState = VIDEO_STATES.AT_GATE;
  updateAuthHeader();
  setAuthMode("signin");
  toast("Signed out of demo archive.");
  goTo("hero");
  try {
    video.pause();
    video.currentTime = 0;
  } catch(_) {}
}
if (signOutBtn) signOutBtn.onclick = handleSignOut;

/* ========================================================
   HARDENED VIDEO TRANSITION ENGINE
   ======================================================== */
function enterArchiveRoom() {
  if (authState.inRoom || videoState === VIDEO_STATES.PLAYING_ROOM_ENTRANCE || videoState === VIDEO_STATES.SEEKING_TO_ROOM) {
    return;
  }

  // Respect reduced motion
  if (reduce) {
    videoState = VIDEO_STATES.ROOM_COMPLETE;
    authState.inRoom = true;
    try { video.pause(); video.currentTime = T_END; } catch(_) {}
    finishRoomEntrance();
    return;
  }

  videoState = VIDEO_STATES.SEEKING_TO_ROOM;

  const startPlaybackAtTin = () => {
    videoState = VIDEO_STATES.PLAYING_ROOM_ENTRANCE;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn("Video autoplay prevented; falling back to completed room frame:", err);
        videoState = VIDEO_STATES.PLAYBACK_BLOCKED;
        finishRoomEntrance();
      });
    }
  };

  if (videoAvailable && dur) {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      // Tolerance verification: ensure we are at or very near T_IN (16.0s)
      if (Math.abs(video.currentTime - T_IN) < 0.35) {
        startPlaybackAtTin();
      } else {
        try {
          video.currentTime = T_IN;
          startPlaybackAtTin();
        } catch (_) {
          startPlaybackAtTin();
        }
      }
    };

    if (Math.abs(video.currentTime - T_IN) < 0.1) {
      startPlaybackAtTin();
    } else {
      video.addEventListener("seeked", onSeeked, { once: true });
      try {
        video.currentTime = T_IN;
      } catch (e) {
        video.removeEventListener("seeked", onSeeked);
        startPlaybackAtTin();
      }
    }
  } else {
    finishRoomEntrance();
  }
}

function finishRoomEntrance() {
  videoState = VIDEO_STATES.ROOM_COMPLETE;
  authState.inRoom = true;
  try {
    video.pause();
    video.currentTime = T_END;
  } catch(_) {}
  onEnteredRoom();
}

function onEnteredRoom() {
  authState.inRoom = true;
  videoState = VIDEO_STATES.ROOM_COMPLETE;
  try { video.currentTime = T_END; } catch(_) {}
  toast("Welcome to your archive (Demo Mode).");
  goTo("model");
}

function checkDemoSession() {
  const session = getStoredSession();
  if (session && session.email) {
    onAuthSuccess(session, true);
  }
}

/* ========================================================
   CANVAS PROTOCOL DRAG & DROP CONTROLLER
   - Strict Action Zone validation
   - Native HTML5 Drag and Drop
   - Pointer Events for Touch devices
   - Keyboard lift / arrow / drop accessibility
   - Explicit prevention of click-to-execute
   ======================================================== */
const VALIDATION_TABLE = {
  "enter-archive": ["auth-access"],
  "create-profile": ["auth-signup"],
  "connect-github": ["auth-github"],
  "revival-continue": ["project-card"],
  "revival-restart": ["project-card"],
  "revival-change-idea": ["project-card"],
  "revival-repurpose": ["project-card"],
  "revival-archive": ["project-card"],
  "import-archive": ["github-repo", "file-batch"],
  "analyze-project": ["github-repo", "file-batch", "project-card"],
  "save-note": ["note-card"],
  "stage-files": ["native-files"],
  "export-json": ["project-card", "archive-card"],
  "import-json": ["archive-json"],
  "reset-demo": ["reset-keycard"]
};

let activeDraggedCard = null; // { element, type, data }
let liftedCardElement = null;
let resetConfirmationTimer = null;

function isDropValid(zoneName, cardType) {
  const allowed = VALIDATION_TABLE[zoneName];
  return Array.isArray(allowed) && allowed.includes(cardType);
}

function highlightCompatibleZones(cardType, isHighlight) {
  $$(".action-zone").forEach(zone => {
    const zName = zone.dataset.actionZone;
    if (isDropValid(zName, cardType)) {
      zone.classList.toggle("is-target", isHighlight);
    } else {
      zone.classList.remove("is-target");
    }
  });
}

async function handleCanvasDrop(zoneElement, cardData) {
  const zoneName = zoneElement.dataset.actionZone;
  const cardType = cardData.type;

  if (!isDropValid(zoneName, cardType)) {
    zoneElement.classList.add("is-rejected");
    setTimeout(() => zoneElement.classList.remove("is-rejected"), 500);
    announceCanvas(`Invalid move: ${cardType} cannot be dropped into ${zoneName}.`);
    toast(`Incompatible card. Check accepted Action Zones.`);
    return;
  }

  zoneElement.classList.add("is-accepted");
  setTimeout(() => zoneElement.classList.remove("is-accepted"), 600);
  announceCanvas(`Action executed: ${zoneName}`);

  // Action Dispatcher
  if (zoneName === "enter-archive") {
    executeAuthAction("enter-archive");
  } else if (zoneName === "create-profile") {
    executeAuthAction("create-profile");
  } else if (zoneName === "connect-github") {
    executeAuthAction("connect-github");
  } else if (zoneName.startsWith("revival-")) {
    const pathKey = {
      "revival-continue": "Continue",
      "revival-restart": "Restart",
      "revival-change-idea": "Change idea",
      "revival-repurpose": "Repurpose",
      "revival-archive": "Archive"
    }[zoneName];
    if (pathKey) {
      await generateRevivalArtifact(pathKey, currentProject);
    }
  } else if (zoneName === "import-archive") {
    if (cardType === "github-repo") {
      await importStagedGitHubRepo(cardData.repo);
    } else if (cardType === "file-batch") {
      await importStagedFileBatch(cardData.batch);
    }
  } else if (zoneName === "analyze-project") {
    if (cardType === "github-repo") {
      analyzeGitHubRepo(cardData.repo);
    } else if (cardType === "file-batch") {
      analyzeFileBatch(cardData.batch);
    } else if (cardType === "project-card") {
      analyzeCurrentProject(currentProject);
    }
  } else if (zoneName === "save-note") {
    await saveStagedNote(cardData.note);
  } else if (zoneName === "export-json") {
    exportArchiveJSON();
  } else if (zoneName === "import-json") {
    $("#jsonFileInput")?.click();
  } else if (zoneName === "reset-demo") {
    await handleResetDemoDrop(zoneElement);
  }
}

/* Two-step Confirmation Reset Demo */
let resetStep = 1;
async function handleResetDemoDrop(zoneElement) {
  if (resetStep === 1) {
    resetStep = 2;
    $("#resetZoneTitle").textContent = "CONFIRM: DROP AGAIN TO ERASE";
    $("#resetZoneDesc").textContent = "Action expires in 8 seconds (Step 2 of 2)";
    zoneElement.style.borderColor = "var(--hot)";
    toast("Drop Reset Keycard again within 8 seconds to confirm reset.");
    clearTimeout(resetConfirmationTimer);
    resetConfirmationTimer = setTimeout(() => {
      resetStep = 1;
      $("#resetZoneTitle").textContent = "RESET DEMO ARCHIVE";
      $("#resetZoneDesc").textContent = "Drop Reset Keycard here (Step 1 of 2)";
      zoneElement.style.borderColor = "";
    }, 8000);
  } else if (resetStep === 2) {
    clearTimeout(resetConfirmationTimer);
    resetStep = 1;
    $("#resetZoneTitle").textContent = "RESET DEMO ARCHIVE";
    $("#resetZoneDesc").textContent = "Drop Reset Keycard here (Step 1 of 2)";
    zoneElement.style.borderColor = "";
    await executeFullReset();
  }
}

async function executeFullReset() {
  await dbClear("projects");
  await dbClear("artifacts");
  await dbClear("notes");
  await dbClear("files");
  for (const p of BASELINE_DEMO_PROJECTS) {
    await dbPut("projects", p);
  }
  activeProjects = [...BASELINE_DEMO_PROJECTS];
  currentProject = activeProjects[0];
  updateProjectViews();
  loadAllArtifacts();
  toast("Archive reset to default demo records.");
}

/* Card Click Prevention Notice */
function bindCardInteractions(card) {
  // Prevent direct click execution
  card.addEventListener("click", (e) => {
    e.preventDefault();
    const title = card.querySelector(".card-title")?.textContent || "Card";
    setAuthMessage(`Canvas Protocol: Drag "${title}" directly into an Action Zone below, or press Space to lift.`, "info");
    toast(`Drag "${title}" to its designated Action Zone.`);
    card.focus();
  });

  // Native HTML5 Drag
  card.addEventListener("dragstart", (e) => {
    const cardType = card.dataset.cardType;
    let payload = { type: cardType };
    if (cardType === "project-card") payload.projectId = card.dataset.projectId || currentProject.id;
    if (cardType === "github-repo") payload.repo = window.__stagedGitHubRepo;
    if (cardType === "file-batch") payload.batch = window.__stagedFileBatch;
    if (cardType === "note-card") payload.note = window.__stagedNote;

    activeDraggedCard = payload;
    card.classList.add("is-dragging");
    e.dataTransfer.setData("text/plain", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "copyMove";
    highlightCompatibleZones(cardType, true);
    announceCanvas(`Lifted ${cardType}. Compatible Action Zones are highlighted.`);
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("is-dragging");
    highlightCompatibleZones(card.dataset.cardType, false);
    activeDraggedCard = null;
  });

  // Keyboard Accessibility: Space/Enter to lift, Arrows to pick zone, Enter to drop, Escape to cancel
  card.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!liftedCardElement) {
        liftCardWithKeyboard(card);
      }
    } else if (e.key === "Escape" && liftedCardElement) {
      e.preventDefault();
      cancelKeyboardLift();
    }
  });

  // Pointer Events for Touch
  bindTouchPointerEvents(card);
}

function liftCardWithKeyboard(card) {
  liftedCardElement = card;
  card.classList.add("is-lifted");
  card.setAttribute("aria-grabbed", "true");
  const cardType = card.dataset.cardType;
  highlightCompatibleZones(cardType, true);

  const compatibleZones = $$(".action-zone").filter(z => isDropValid(z.dataset.actionZone, cardType));
  announceCanvas(`Card lifted. Use Arrow keys to move to a compatible Action Zone, then press Enter to drop. Or press Escape to cancel.`);
  toast(`Card lifted. Arrow keys to choose zone, Enter to drop.`);

  if (compatibleZones.length > 0) {
    compatibleZones[0].focus();
  }
}

function cancelKeyboardLift() {
  if (liftedCardElement) {
    liftedCardElement.classList.remove("is-lifted");
    liftedCardElement.setAttribute("aria-grabbed", "false");
    highlightCompatibleZones(liftedCardElement.dataset.cardType, false);
    liftedCardElement.focus();
    liftedCardElement = null;
    announceCanvas(`Card drop cancelled.`);
    toast(`Lift cancelled.`);
  }
}

/* Touch Pointer Events Engine */
function bindTouchPointerEvents(card) {
  let isPointerDown = false;
  let startX = 0, startY = 0;
  let avatar = null;
  let isDragging = false;

  card.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") return; // Handled by native dragstart
    isPointerDown = true;
    startX = e.clientX;
    startY = e.clientY;
  });

  card.addEventListener("pointermove", (e) => {
    if (!isPointerDown) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!isDragging && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      isDragging = true;
      card.classList.add("is-dragging");
      const cardType = card.dataset.cardType;
      highlightCompatibleZones(cardType, true);

      avatar = document.createElement("div");
      avatar.className = "drag-avatar";
      avatar.textContent = card.querySelector(".card-title")?.textContent || cardType;
      document.body.appendChild(avatar);
    }
    if (isDragging && avatar) {
      avatar.style.left = `${e.clientX}px`;
      avatar.style.top = `${e.clientY}px`;
      const elem = document.elementFromPoint(e.clientX, e.clientY);
      const zone = elem?.closest(".action-zone");
      $$(".action-zone").forEach(z => z.classList.remove("is-over"));
      if (zone) zone.classList.add("is-over");
    }
  });

  const onPointerUp = (e) => {
    if (!isPointerDown) return;
    isPointerDown = false;
    if (isDragging) {
      isDragging = false;
      card.classList.remove("is-dragging");
      highlightCompatibleZones(card.dataset.cardType, false);
      if (avatar) {
        avatar.remove();
        avatar = null;
      }
      const elem = document.elementFromPoint(e.clientX, e.clientY);
      const zone = elem?.closest(".action-zone");
      $$(".action-zone").forEach(z => z.classList.remove("is-over"));
      if (zone) {
        let payload = { type: card.dataset.cardType };
        if (payload.type === "project-card") payload.projectId = card.dataset.projectId || currentProject.id;
        if (payload.type === "github-repo") payload.repo = window.__stagedGitHubRepo;
        if (payload.type === "file-batch") payload.batch = window.__stagedFileBatch;
        if (payload.type === "note-card") payload.note = window.__stagedNote;
        handleCanvasDrop(zone, payload);
      }
    }
  };

  card.addEventListener("pointerup", onPointerUp);
  card.addEventListener("pointercancel", onPointerUp);
}

function bindZoneInteractions(zone) {
  // Prevent direct click execution
  zone.addEventListener("click", () => {
    const title = zone.querySelector(".zone-name")?.textContent || zone.dataset.actionZone;
    const accepted = VALIDATION_TABLE[zone.dataset.actionZone]?.join(", ") || "";
    toast(`Action Zone: "${title}". Accepts cards: [${accepted}].`);
    announceCanvas(`Action Zone ${title}. Drop an accepted card here to execute.`);
  });

  // Native HTML5 Drop
  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (activeDraggedCard && isDropValid(zone.dataset.actionZone, activeDraggedCard.type)) {
      e.dataTransfer.dropEffect = "move";
      zone.classList.add("is-over");
    }
  });

  zone.addEventListener("dragleave", () => {
    zone.classList.remove("is-over");
  });

  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("is-over");
    try {
      const dataRaw = e.dataTransfer.getData("text/plain");
      const cardData = dataRaw ? JSON.parse(dataRaw) : activeDraggedCard;
      if (cardData && cardData.type) {
        handleCanvasDrop(zone, cardData);
      }
    } catch (_) {
      if (activeDraggedCard) handleCanvasDrop(zone, activeDraggedCard);
    }
  });

  // Keyboard Drop Target Support
  zone.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && liftedCardElement) {
      e.preventDefault();
      const cardType = liftedCardElement.dataset.cardType;
      let payload = { type: cardType };
      if (cardType === "project-card") payload.projectId = liftedCardElement.dataset.projectId || currentProject.id;
      if (cardType === "github-repo") payload.repo = window.__stagedGitHubRepo;
      if (cardType === "file-batch") payload.batch = window.__stagedFileBatch;
      if (cardType === "note-card") payload.note = window.__stagedNote;

      handleCanvasDrop(zone, payload);
      cancelKeyboardLift();
    } else if (e.key === "Escape" && liftedCardElement) {
      e.preventDefault();
      cancelKeyboardLift();
    }
  });
}

function initCanvasProtocol() {
  $$(".data-card").forEach(bindCardInteractions);
  $$(".action-zone").forEach(bindZoneInteractions);
}

/* ========================================================
   PUBLIC GITHUB REPOSITORY IMPORT ENGINE
   ======================================================== */
const githubUrlInput = $("#githubUrlInput");
const githubFetchBtn = $("#githubFetchBtn");
const githubFetchStatus = $("#githubFetchStatus");
const githubCardSlot = $("#githubCardSlot");

function setGitHubStatus(msg, type = "info") {
  if (!githubFetchStatus) return;
  if (!msg) {
    githubFetchStatus.style.display = "none";
    githubFetchStatus.textContent = "";
    return;
  }
  githubFetchStatus.className = `intake-status ${type}`;
  githubFetchStatus.textContent = msg;
  githubFetchStatus.style.display = "block";
  announceCanvas(msg);
}

async function handleGitHubFetch() {
  const rawUrl = (githubUrlInput?.value || "").trim();
  if (!rawUrl) {
    setGitHubStatus("Please enter a GitHub repository URL or owner/repo path.", "error");
    return;
  }
  // Parse owner/repo
  const clean = rawUrl.replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");
  const parts = clean.split("/");
  if (parts.length < 2) {
    setGitHubStatus("Invalid format. Use owner/repo (e.g. facebook/react).", "error");
    return;
  }
  const [owner, repo] = parts;
  setGitHubStatus(`Connecting to GitHub API for ${owner}/${repo}…`, "info");
  githubFetchBtn.disabled = true;

  try {
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (repoRes.status === 403 || repoRes.status === 429) {
      setGitHubStatus("GitHub REST API rate limit reached. Use Local File Intake below or wait for rate limit reset.", "error");
      return;
    }
    if (!repoRes.ok) {
      setGitHubStatus(`Repository not found or private (HTTP ${repoRes.status}).`, "error");
      return;
    }

    const repoData = await repoRes.json();
    let readmeText = "";
    try {
      const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`);
      if (readmeRes.ok) {
        const readmeData = await readmeRes.json();
        readmeText = atob((readmeData.content || "").replace(/\s/g, ""));
      }
    } catch (_) {}

    let fileCount = 0;
    let detectedFiles = [];
    try {
      const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${repoData.default_branch}?recursive=1`);
      if (treeRes.ok) {
        const treeData = await treeRes.json();
        detectedFiles = (treeData.tree || []).slice(0, 300).map(t => t.path);
        fileCount = treeData.tree?.length || 0;
      }
    } catch (_) {}

    window.__stagedGitHubRepo = {
      id: `gh_${repoData.id}`,
      name: repoData.name,
      fullName: repoData.full_name,
      tech: repoData.language || "TypeScript",
      description: repoData.description || "Public repository imported from GitHub",
      readme: readmeText,
      files: detectedFiles,
      fileCount,
      stars: repoData.stargazers_count,
      updatedAt: repoData.updated_at
    };

    setGitHubStatus(`Staged ${repoData.full_name}! Drag card into [ IMPORT TO ARCHIVE ] or [ ANALYZE PROJECT ].`, "success");
    renderStagedGitHubCard(window.__stagedGitHubRepo);

  } catch (err) {
    setGitHubStatus("Network error connecting to GitHub: " + err.message, "error");
  } finally {
    githubFetchBtn.disabled = false;
  }
}

function renderStagedGitHubCard(repo) {
  if (!githubCardSlot) return;
  githubCardSlot.innerHTML = `
    <div id="stagedGhCard" class="data-card" draggable="true" tabindex="0" role="button" data-card-type="github-repo" aria-grabbed="false">
      <div class="card-meta"><span class="card-chip">GITHUB REPO</span><span class="card-handle" aria-hidden="true">⋮⋮</span></div>
      <strong class="card-title">${escapeHtml(repo.fullName)}</strong>
      <span class="card-sub">${escapeHtml(repo.tech)} · ${repo.fileCount} files · ${repo.stars} stars</span>
      <span class="card-hint">Drag into [ Import to Archive ] or [ Analyze Project ] ➔</span>
    </div>`;
  const card = $("#stagedGhCard", githubCardSlot);
  if (card) bindCardInteractions(card);
}

if (githubFetchBtn) githubFetchBtn.onclick = handleGitHubFetch;
if (githubUrlInput) githubUrlInput.onkeydown = e => { if (e.key === "Enter") handleGitHubFetch(); };

async function importStagedGitHubRepo(repo) {
  if (!repo) return;
  const project = {
    id: `proj_${Date.now()}`,
    name: repo.name,
    status: "Imported",
    ready: "Partial",
    tech: repo.tech,
    hours: 8,
    last: `Imported from ${repo.fullName} (${repo.fileCount} files)`,
    vision: repo.description,
    cause: "Imported from GitHub archive",
    blocker: "Awaiting initial context audit",
    failed: "None recorded yet",
    next: "Review repository README and run test suite",
    githubRepo: repo.fullName,
    createdAt: new Date().toISOString()
  };
  await dbPut("projects", project);
  activeProjects.unshift(project);
  currentProject = project;
  updateProjectViews();
  toast(`Imported "${project.name}" into archive!`);
}

function analyzeGitHubRepo(repo) {
  if (!repo) return;
  const container = $("#analysisReportContainer");
  if (!container) return;
  const manifests = repo.files.filter(f => /package\.json|Cargo\.toml|requirements\.txt|go\.mod|pom\.xml|composer\.json/i.test(f));
  const hasTests = repo.files.some(f => /test|spec/i.test(f));
  const readmeSnippet = repo.readme ? repo.readme.slice(0, 300) : "No README available.";

  container.innerHTML = `
    <div class="artifact-head">
      <h4 class="artifact-title">Structural Audit · ${escapeHtml(repo.fullName)}</h4>
      <span class="artifact-tag">DETERMINISTIC ANALYSIS</span>
    </div>
    <div style="font-size:13.5px;line-height:1.6">
      <p><b>Primary Stack:</b> ${escapeHtml(repo.tech)}</p>
      <p><b>Detected Manifests:</b> ${manifests.length ? manifests.map(escapeHtml).join(", ") : "None detected in root"}</p>
      <p><b>Test Coverage Signals:</b> ${hasTests ? "Test files detected" : "No test directory found"}</p>
      <p style="margin-top:8px"><b>README Context Excerpt:</b></p>
      <pre style="background:rgba(0,0,0,.6);padding:10px;border-radius:8px;font-size:12px;overflow:auto">${escapeHtml(readmeSnippet)}…</pre>
      <p style="margin-top:10px;color:var(--amber)"><b>Recommended Next Micro-Action:</b> Review ${manifests[0] || 'entry files'} and verify local build scripts.</p>
    </div>`;
  container.style.display = "block";
  toast(`Analysis complete for ${repo.fullName}`);
}

/* ========================================================
   LOCAL FILE & FOLDER INTAKE ENGINE
   ======================================================== */
const localFileInput = $("#localFileInput");
const localFolderInput = $("#localFolderInput");
const fileStageStatus = $("#fileStageStatus");
const fileBatchCardSlot = $("#fileBatchCardSlot");

function setFileStatus(msg, type = "info") {
  if (!fileStageStatus) return;
  if (!msg) {
    fileStageStatus.style.display = "none";
    fileStageStatus.textContent = "";
    return;
  }
  fileStageStatus.className = `intake-status ${type}`;
  fileStageStatus.textContent = msg;
  fileStageStatus.style.display = "block";
  announceCanvas(msg);
}

const IGNORED_DIRS = ["node_modules", ".git", ".venv", "venv", "dist", "build", "__pycache__", ".next", ".nuxt"];

async function handleFileListIntake(fileList) {
  if (!fileList || fileList.length === 0) return;
  setFileStatus("Reading and filtering local files…", "info");

  const validFiles = [];
  let totalBytes = 0;

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    const path = file.webkitRelativePath || file.name;
    const parts = path.split("/");
    const isIgnored = parts.some(p => IGNORED_DIRS.includes(p));
    if (isIgnored) continue;
    if (file.size > 500 * 1024) continue; // Skip huge binaries > 500KB

    totalBytes += file.size;
    validFiles.push({
      name: file.name,
      path: path,
      size: file.size,
      fileRef: file
    });
    if (validFiles.length >= 150) break;
  }

  if (validFiles.length === 0) {
    setFileStatus("No eligible code or text files found in selected folder.", "error");
    return;
  }

  // Read text content of first few files safely
  for (let j = 0; j < Math.min(10, validFiles.length); j++) {
    const item = validFiles[j];
    try {
      item.content = await readFileText(item.fileRef);
    } catch (_) {
      item.content = "";
    }
  }

  const folderName = validFiles[0].path.includes("/") ? validFiles[0].path.split("/")[0] : "LocalProject";
  window.__stagedFileBatch = {
    id: `batch_${Date.now()}`,
    name: folderName,
    count: validFiles.length,
    totalKb: Math.round(totalBytes / 1024),
    files: validFiles
  };

  setFileStatus(`Staged ${validFiles.length} files (${Math.round(totalBytes / 1024)} KB)! Drag card into Action Zone.`, "success");
  renderStagedFileBatchCard(window.__stagedFileBatch);
}

function readFileText(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || "");
    reader.onerror = () => resolve("");
    reader.readAsText(file);
  });
}

function renderStagedFileBatchCard(batch) {
  if (!fileBatchCardSlot) return;
  fileBatchCardSlot.innerHTML = `
    <div id="stagedBatchCard" class="data-card" draggable="true" tabindex="0" role="button" data-card-type="file-batch" aria-grabbed="false">
      <div class="card-meta"><span class="card-chip">FILE BATCH</span><span class="card-handle" aria-hidden="true">⋮⋮</span></div>
      <strong class="card-title">Staged Batch: ${escapeHtml(batch.name)}</strong>
      <span class="card-sub">${batch.count} files · ${batch.totalKb} KB total</span>
      <span class="card-hint">Drag into [ Import to Archive ] or [ Analyze Project ] ➔</span>
    </div>`;
  const card = $("#stagedBatchCard", fileBatchCardSlot);
  if (card) bindCardInteractions(card);
}

if (localFileInput) localFileInput.onchange = e => handleFileListIntake(e.target.files);
if (localFolderInput) localFolderInput.onchange = e => handleFileListIntake(e.target.files);

// Native drop on Stage Files Action Zone
const stageFilesZone = $("#stageFilesZone");
if (stageFilesZone) {
  stageFilesZone.addEventListener("dragover", e => {
    e.preventDefault();
    stageFilesZone.classList.add("is-over");
  });
  stageFilesZone.addEventListener("dragleave", () => stageFilesZone.classList.remove("is-over"));
  stageFilesZone.addEventListener("drop", e => {
    e.preventDefault();
    stageFilesZone.classList.remove("is-over");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileListIntake(e.dataTransfer.files);
    }
  });
}

async function importStagedFileBatch(batch) {
  if (!batch) return;
  const project = {
    id: `proj_${Date.now()}`,
    name: batch.name,
    status: "Imported",
    ready: "Partial",
    tech: "Local Source",
    hours: 4,
    last: `Imported ${batch.count} local files (${batch.totalKb} KB)`,
    vision: `Local file intake for ${batch.name}`,
    cause: "Preserved from local workstation",
    blocker: "Review intake files",
    failed: "None recorded yet",
    next: "Inspect file structure and document next step",
    createdAt: new Date().toISOString()
  };
  await dbPut("projects", project);
  // Persist files in db files store
  for (const f of batch.files) {
    await dbPut("files", {
      id: `f_${project.id}_${f.name}`,
      projectId: project.id,
      path: f.path,
      size: f.size,
      content: f.content || ""
    });
  }
  activeProjects.unshift(project);
  currentProject = project;
  updateProjectViews();
  toast(`Imported batch "${project.name}" into archive!`);
}

function analyzeFileBatch(batch) {
  if (!batch) return;
  const container = $("#analysisReportContainer");
  if (!container) return;
  const extensions = {};
  batch.files.forEach(f => {
    const ext = f.name.includes(".") ? f.name.split(".").pop().toLowerCase() : "other";
    extensions[ext] = (extensions[ext] || 0) + 1;
  });

  const extSummary = Object.entries(extensions).map(([ext, count]) => `.${ext} (${count})`).join(", ");
  container.innerHTML = `
    <div class="artifact-head">
      <h4 class="artifact-title">Local Batch Audit · ${escapeHtml(batch.name)}</h4>
      <span class="artifact-tag">FILE INTAKE ANALYSIS</span>
    </div>
    <div style="font-size:13.5px;line-height:1.6">
      <p><b>Total Processed Files:</b> ${batch.count} (${batch.totalKb} KB)</p>
      <p><b>Extension Distribution:</b> ${escapeHtml(extSummary)}</p>
      <p style="margin-top:8px"><b>Staged Path Sample:</b></p>
      <ul style="font-size:12px;list-style:none;padding-left:4px;color:var(--dim)">
        ${batch.files.slice(0, 5).map(f => `<li>• ${escapeHtml(f.path)}</li>`).join("")}
      </ul>
      <p style="margin-top:10px;color:var(--amber)"><b>Actionable Next Step:</b> Drag card into [ Import to Archive ] to link these files to your local archive.</p>
    </div>`;
  container.style.display = "block";
  toast(`Batch analysis complete for ${batch.name}`);
}

function analyzeCurrentProject(p) {
  if (!p) return;
  const container = $("#analysisReportContainer");
  if (!container) return;
  const score = computeReadinessScore(p);
  container.innerHTML = `
    <div class="artifact-head">
      <h4 class="artifact-title">Context Audit · ${escapeHtml(p.name)}</h4>
      <span class="artifact-tag">READINESS: ${score}/100</span>
    </div>
    <div style="font-size:13.5px;line-height:1.6">
      <p><b>Active Blocker:</b> ${escapeHtml(p.blocker)}</p>
      <p><b>Failed Approach Logged:</b> ${escapeHtml(p.failed)}</p>
      <p><b>Smallest Next Micro-Step:</b> ${escapeHtml(p.next)}</p>
      <p style="margin-top:8px;color:var(--amber)"><b>Recommendation:</b> ${score >= 70 ? 'High readiness: consider a "Continue" warm boot.' : 'Low readiness: draft a Black Box note to define the blocker first.'}</p>
    </div>`;
  container.style.display = "block";
  toast(`Context audit complete for ${p.name}`);
}

/* ========================================================
   BLACK BOX NOTES ENGINE (WITH PROVENANCE TAGGING)
   ======================================================== */
const stageNoteBtn = $("#stageNoteBtn");
const noteTextInput = $("#noteTextInput");
const noteProvenanceSelect = $("#noteProvenanceSelect");
const noteFieldSelect = $("#noteFieldSelect");
const noteCardSlot = $("#noteCardSlot");
const projectNotesList = $("#projectNotesList");

function stageNoteCard() {
  const text = (noteTextInput?.value || "").trim();
  if (!text) {
    toast("Please enter note content before staging.");
    return;
  }
  const provenance = noteProvenanceSelect?.value || "User note";
  const field = noteFieldSelect?.value || "blocker";

  window.__stagedNote = {
    id: `note_${Date.now()}`,
    projectId: currentProject.id,
    field,
    text,
    provenance,
    createdAt: new Date().toISOString()
  };

  renderStagedNoteCard(window.__stagedNote);
  toast("Note card staged! Drag into [ ATTACH NOTE TO PROJECT ].");
}
if (stageNoteBtn) stageNoteBtn.onclick = stageNoteCard;

function renderStagedNoteCard(note) {
  if (!noteCardSlot) return;
  const provClass = note.provenance.replace(/\s+/g, "-");
  noteCardSlot.innerHTML = `
    <div id="stagedNoteCard" class="data-card" draggable="true" tabindex="0" role="button" data-card-type="note-card" aria-grabbed="false">
      <div class="card-meta">
        <span class="prov-tag ${provClass}">${escapeHtml(note.provenance)}</span>
        <span class="card-handle" aria-hidden="true">⋮⋮</span>
      </div>
      <strong class="card-title">${escapeHtml(note.field.toUpperCase())} UPDATE</strong>
      <span class="card-sub">${escapeHtml(note.text.slice(0, 70))}…</span>
      <span class="card-hint">Drag into [ Attach Note to Project ] ➔</span>
    </div>`;
  const card = $("#stagedNoteCard", noteCardSlot);
  if (card) bindCardInteractions(card);
}

async function saveStagedNote(note) {
  if (!note) return;
  await dbPut("notes", note);
  // Update project field
  if (currentProject) {
    currentProject[note.field] = note.text;
    currentProject.updatedAt = new Date().toISOString();
    await dbPut("projects", currentProject);
    updateProjectViews();
  }
  if (noteTextInput) noteTextInput.value = "";
  if (noteCardSlot) noteCardSlot.innerHTML = "";
  toast(`Note attached to ${currentProject.name}!`);
  loadProjectNotes(currentProject.id);
}

async function loadProjectNotes(projectId) {
  if (!projectNotesList) return;
  const allNotes = await dbGetAll("notes");
  const filtered = allNotes.filter(n => n.projectId === projectId);
  if (filtered.length === 0) {
    projectNotesList.innerHTML = `<p class="muted">No notes recorded for this project yet. Stage a note and drop it here.</p>`;
    return;
  }
  projectNotesList.innerHTML = filtered.slice().reverse().map(n => {
    const provClass = n.provenance.replace(/\s+/g, "-");
    return `
      <div class="note-bubble">
        <div class="note-bubble-meta">
          <span class="prov-tag ${provClass}">${escapeHtml(n.provenance)}</span>
          <span>${new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <b>${escapeHtml(n.field.toUpperCase())}:</b> ${escapeHtml(n.text)}
      </div>`;
  }).join("");
}

/* ========================================================
   PERSISTENCE, JSON EXPORT & JSON IMPORT
   ======================================================== */
async function exportArchiveJSON() {
  const projects = await dbGetAll("projects");
  const artifacts = await dbGetAll("artifacts");
  const notes = await dbGetAll("notes");
  const exportPayload = {
    app: "Project Graveyard — VisionQuest",
    version: 3,
    exportedAt: new Date().toISOString(),
    projects,
    artifacts,
    notes
  };

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `project-graveyard-archive-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast("Archive exported to JSON file.");
}

const jsonFileInput = $("#jsonFileInput");
if (jsonFileInput) {
  jsonFileInput.onchange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await readFileText(file);
      const data = JSON.parse(text);
      if (!Array.isArray(data.projects)) {
        toast("Invalid archive JSON format: missing projects array.");
        return;
      }
      for (const p of data.projects) {
        if (p.id) await dbPut("projects", p);
      }
      if (Array.isArray(data.artifacts)) {
        for (const art of data.artifacts) {
          if (art.id) await dbPut("artifacts", art);
        }
      }
      if (Array.isArray(data.notes)) {
        for (const n of data.notes) {
          if (n.id) await dbPut("notes", n);
        }
      }
      activeProjects = await dbGetAll("projects");
      currentProject = activeProjects[0] || BASELINE_DEMO_PROJECTS[0];
      updateProjectViews();
      loadAllArtifacts();
      toast(`Successfully imported ${data.projects.length} projects from backup.`);
    } catch (err) {
      toast("Error parsing backup JSON: " + err.message);
    }
  };
}

/* ========================================================
   WORKBENCH CONTROLLER & SUB-TABS
   ======================================================== */
const wb = $("#workbench");
let filt = "All";

function drawWorkbenchList() {
  const plist = $("#plist");
  if (!plist) return;
  const list = activeProjects.filter(p => filt === "All" || p.status === filt || p.tech === filt || p.ready === filt);
  plist.innerHTML = list.map(p => `
    <div class="data-card project-card" draggable="true" tabindex="0" role="button" data-card-type="project-card" data-project-id="${p.id}" aria-current="${p.id === currentProject.id}">
      <b>▸ ${escapeHtml(p.name)}</b>
      <small>${escapeHtml(p.status)} · ${escapeHtml(p.tech)} · Context: ${escapeHtml(p.ready)}</small>
    </div>
  `).join("") || "<p class='muted'>No projects match this filter.</p>";

  $$(".project-card", plist).forEach(card => {
    card.onclick = () => {
      const p = activeProjects.find(x => x.id === card.dataset.projectId);
      if (p) {
        currentProject = p;
        updateProjectViews();
      }
    };
    bindCardInteractions(card);
  });
}

const chipVals = ["All","Paused","Blocked","Dormant","Python","React","TypeScript","Ready"];
const chipsEl = $("#chips");
if (chipsEl) {
  chipsEl.innerHTML = chipVals.map(v => `<button aria-pressed="${v===filt}" data-v="${v}">${v}</button>`).join("");
  $$("#chips button").forEach(b => {
    b.onclick = () => {
      filt = b.dataset.v;
      $$("#chips button").forEach(x => x.setAttribute("aria-pressed", x === b));
      drawWorkbenchList();
    };
  });
}

function openWB() {
  if (!wb) return;
  wb.classList.add("open");
  document.body.style.overflow = "hidden";
  updateProjectViews();
  $("#wbClose")?.focus();
}

function closeWB() {
  if (!wb) return;
  wb.classList.remove("open");
  document.body.style.overflow = "";
}

if ($("#wbClose")) $("#wbClose").onclick = closeWB;
addEventListener("keydown", e => { if (e.key === "Escape" && wb?.classList.contains("open")) closeWB(); });

const spinBtn = $("#spin");
if (spinBtn) {
  spinBtn.onclick = () => {
    const t = +($("#free")?.value || 2);
    const fit = activeProjects.filter(p => p.hours <= t);
    const pool = fit.length ? fit : activeProjects;
    const p = pool[Math.floor(Math.random() * pool.length)];
    if ($("#pick")) $("#pick").textContent = `Try ${p.name}: ${p.next}.`;
    currentProject = p;
    filt = "All";
    $$("#chips button").forEach(x => x.setAttribute("aria-pressed", x.dataset.v === "All"));
    updateProjectViews();
  };
}

/* Workbench Sub-Tab Navigation */
$$(".wb-tab").forEach(tab => {
  tab.onclick = () => {
    const targetTab = tab.dataset.wbtab;
    $$(".wb-tab").forEach(t => {
      t.classList.toggle("on", t === tab);
      t.setAttribute("aria-selected", t === tab);
    });
    $$(".wb-tab-panel").forEach(p => p.classList.remove("on"));
    const targetPanel = {
      records: $("#wbPanelRecords"),
      intake: $("#wbPanelIntake"),
      notes: $("#wbPanelNotes"),
      artifacts: $("#wbPanelArtifacts"),
      backup: $("#wbPanelBackup")
    }[targetTab];
    if (targetPanel) targetPanel.classList.add("on");
    if (targetTab === "artifacts") loadAllArtifacts();
  };
});

/* Guarded Access for Workbench and Import */
function guardedOpenWB(targetTab = "records") {
  if (!authState.authenticated) {
    toast("Sign in at the doorway to unlock the Workbench.");
    goTo("descent");
    setTimeout(() => authEmail?.focus(), 500);
    return;
  }
  openWB();
  if (targetTab) {
    const tabBtn = $(`.wb-tab[data-wbtab="${targetTab}"]`);
    if (tabBtn) tabBtn.click();
  }
}
if ($("#wbBtn")) $("#wbBtn").onclick = () => guardedOpenWB("records");
if ($("#wbBtn2")) $("#wbBtn2").onclick = () => guardedOpenWB("records");
if ($("#importBtn")) $("#importBtn").onclick = () => guardedOpenWB("intake");

/* ========================================================
   CHAPTERS & VIDEO SCRUBBING ENGINE
   ======================================================== */
const video = $("#journey"), dim = $("#dim"), tint = $("#tint"), progress = $("#progress i");
let vz = 1.03, vb = 0, px = 0, py = 0, tx = 0, ty = 0;
const chapters = $$(".chapter").map(el => {
  const [a, b] = el.dataset.range.split(",").map(Number);
  return { el, a, b, id: el.dataset.id };
});
const railItems = [
  ["hero","Entrance"],["problem","Problem"],["losses","What is lost"],["landscape","The Archive"],
  ["descent","Doorway"],["model","Model"],["triage","Triage"],["modes","Dashboard"],["trust","Trust"]
];
const rail = $("#rail");
if (rail) {
  rail.innerHTML = "";
  railItems.forEach(([id, label]) => {
    const b = document.createElement("button");
    b.dataset.go = id;
    b.innerHTML = `<i></i><span>${label}</span>`;
    b.setAttribute("aria-label", label);
    rail.appendChild(b);
  });
}
const railBtns = $$("#rail button");

function vt(p) {
  if (authState.inRoom || videoState === VIDEO_STATES.ROOM_COMPLETE) return T_END;
  return p < CUT ? T_OUT * clamp(p / (CUT - 0.01)) : T_OUT;
}

const mid = id => {
  const c = chapters.find(c => c.id === id);
  if (!c) return 0;
  const b = Math.min(c.b, 1);
  return Math.max(c.a, 0) + (b - Math.max(c.a, 0)) * 0.35;
};
const maxScroll = () => document.documentElement.scrollHeight - innerHeight;

function goTo(id) {
  const gateIds = ["model", "triage", "modes", "trust"];
  if (!authState.authenticated && gateIds.includes(id)) {
    toast("Sign in at the doorway to unlock this archive section.");
    goTo("descent");
    return;
  }
  scrollTo({ top: mid(id) * maxScroll(), behavior: reduce ? "auto" : "smooth" });
}
document.addEventListener("click", e => {
  const t = e.target.closest("[data-go]");
  if (t) goTo(t.dataset.go);
});
if ($("#topBtn")) $("#topBtn").onclick = () => scrollTo({ top: 0, behavior: "smooth" });

let target = 0, shown = 0, dur = 0, ready = false, videoAvailable = false;
function onScroll() {
  let raw = scrollY / Math.max(1, maxScroll());
  if (!authState.authenticated && raw > CUT) {
    raw = CUT;
  }
  target = clamp(raw);
}
addEventListener("scroll", onScroll, { passive: true });
addEventListener("resize", onScroll);

function update(p) {
  const F = 0.018;
  let active = null, best = 0;
  chapters.forEach(c => {
    const v = smooth((p - c.a) / F) * (c.b >= 1.5 ? 1 : 1 - smooth((p - c.b) / F));
    c.el.style.opacity = v.toFixed(3);
    c.el.style.transform = `translateY(${((1 - v) * 18).toFixed(1)}px)`;
    c.el.style.filter = v < 0.98 ? `blur(${((1 - v) * 6).toFixed(1)}px)` : "none";
    c.el.classList.toggle("live", v > 0.55);
    if (v > best) { best = v; active = c.id; }
  });

  if (dim) dim.style.opacity = "0";
  if (tint) tint.style.opacity = ".26";
  if (progress) progress.style.transform = `scaleX(${p.toFixed(4)})`;
  railBtns.forEach(b => b.classList.toggle("on", b.dataset.go === active));
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
  last = now;
  shown += (target - shown) * (reduce ? 1 : 1 - Math.exp(-dt / 0.085));
  if (Math.abs(target - shown) < 0.0002) shown = target;

  if (videoState === VIDEO_STATES.PLAYING_ROOM_ENTRANCE) {
    if (video.currentTime >= T_END - 0.08 || video.ended) {
      finishRoomEntrance();
    }
  } else if (videoState === VIDEO_STATES.AT_GATE) {
    if (ready && videoAvailable && dur) {
      const t = Math.min(vt(shown), dur - 0.05);
      if (!video.seeking && Math.abs(video.currentTime - t) > 0.008) {
        try { video.currentTime = t; } catch(_) {}
      }
    }
  }

  update(shown);
  px += (tx - px) * 0.06;
  py += (ty - py) * 0.06;
  if (video) {
    video.style.transform = `translate3d(${px.toFixed(2)}px,${py.toFixed(2)}px,0) scale(${vz.toFixed(4)})`;
    video.style.filter = `saturate(1.03) contrast(1.05)${vb > 0.05 ? ` blur(${vb.toFixed(2)}px)` : ""}`;
  }
  requestAnimationFrame(frame);
}

if (!reduce && matchMedia("(hover:hover)").matches) {
  addEventListener("pointermove", e => {
    tx = -(e.clientX / innerWidth - 0.5) * 14;
    ty = -(e.clientY / innerHeight - 0.5) * 8;
  }, { passive: true });
}

chapters.filter(c => c.id !== "hero").forEach(c => {
  $$(".veil > *, .panel > *, .losses > div, .cols > .box, .model > .box, .dossier > *, .paths button", c.el)
    .forEach((el, i) => {
      el.classList.add("st");
      el.style.setProperty("--i", Math.min(i, 8));
    });
});

/* ========================================================
   PORTABLE VIDEO LOADING
   ======================================================== */
const bar = $("#bar i");
const loaderMessage = $("#loaderMessage");
const videoCandidates = [
  "journey.mp4",
  "Journey.mp4",
  "JOURNEY.mp4",
  "assets/journey.mp4",
  "media/journey.mp4"
];

let sourceIndex = -1;
let videoStartupTimer = null;

function revealPage() {
  if (ready) return;
  ready = true;
  $("#loader")?.classList.add("done");
  document.body.classList.add("go");
  onScroll();
  shown = target;
}

function markVideoReady() {
  if (video.readyState < 2) return;
  videoAvailable = true;
  const mediaDuration = video.duration;
  dur = Number.isFinite(mediaDuration) && mediaDuration > 0 ? mediaDuration : 18.79;
  if (videoStartupTimer) clearTimeout(videoStartupTimer);
  revealPage();
}

function showVideoFallback() {
  videoAvailable = false;
  dur = 0;
  if (!ready) {
    if (loaderMessage) loaderMessage.textContent = "Camera footage unavailable — opening archive.";
    revealPage();
  }
  toast("Camera video could not be loaded. Keep journey.mp4 beside index.html.");
}

function loadNextVideoSource() {
  sourceIndex += 1;
  if (sourceIndex >= videoCandidates.length) {
    showVideoFallback();
    return;
  }
  const candidate = videoCandidates[sourceIndex];
  if (bar) bar.style.width = "0%";
  if (loaderMessage) loaderMessage.textContent = `Opening the archive · loading video`;
  videoAvailable = false;
  dur = 0;
  video.pause();
  video.src = candidate;
  video.load();
}

if (video) {
  video.addEventListener("progress", () => {
    try {
      const b = video.buffered;
      if (b.length && Number.isFinite(video.duration) && video.duration > 0 && bar) {
        bar.style.width = (b.end(b.length - 1) / video.duration * 100) + "%";
      }
    } catch (_) {}
  });
  video.addEventListener("loadeddata", () => {
    video.pause();
    markVideoReady();
  });
  video.addEventListener("canplaythrough", markVideoReady);
  video.addEventListener("error", () => {
    videoAvailable = false;
    dur = 0;
    loadNextVideoSource();
  });
}

videoStartupTimer = setTimeout(() => {
  if (ready) return;
  if (video && video.readyState >= 2) {
    markVideoReady();
  } else {
    if (loaderMessage) loaderMessage.textContent = "Opening the archive…";
    revealPage();
  }
}, 12000);

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ========================================================
   BOOTSTRAP & EXPORTS
   ======================================================== */
loadNextVideoSource();
requestAnimationFrame(frame);
initializeDatabase();
initCanvasProtocol();
checkDemoSession();

window.__PG_STAGE3__ = {
  vt,
  authState,
  videoState,
  VIDEO_STATES,
  CUT,
  T_OUT,
  T_IN,
  T_END,
  enterArchiveRoom,
  finishRoomEntrance,
  handleSignOut,
  deriveDemoKeyPBKDF2,
  verifyLegacySHA256,
  getStoredProfiles,
  saveStoredProfiles,
  clearDemoSession,
  computeReadinessScore,
  generateRevivalArtifact,
  executeAuthAction,
  handleCanvasDrop,
  dbGetAll,
  dbPut,
  dbDelete,
  dbClear
};

window.__PG_STAGE2__ = window.__PG_STAGE3__;
window.__PG_STEP1__ = window.__PG_STAGE3__;

})();

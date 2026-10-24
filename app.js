(() => {
"use strict";
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const clamp = (v,a=0,b=1) => Math.min(b,Math.max(a,v));
const smooth = t => { t = clamp(t); return t*t*(3-2*t); };
const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;

/* ---------- demo data (offline, preloaded) ---------- */
const PROJECTS = [
  { id:"atlas", name:"Atlas", status:"Paused", ready:"Ready", tech:"TypeScript", hours:5,
    last:"Schema parser complete", vision:"UI done; sync left", cause:"Paused during semester exams",
    blocker:"OAuth callback in auth.ts", failed:"Custom token refresh loop", next:"Test provider redirect URL" },
  { id:"lumen", name:"Lumen", status:"Blocked", ready:"Partial", tech:"Python", hours:16,
    last:"Data loader works on sample set", vision:"Model trained; no front end", cause:"Waiting on a dataset licence",
    blocker:"Licence terms unclear", failed:"Scraping the public mirror", next:"Email the dataset owner" },
  { id:"inkwell", name:"Inkwell", status:"Dormant", ready:"Needs notes", tech:"React", hours:2,
    last:"Editor toolbar renders", vision:"Toolbar done; export left", cause:"Priorities changed",
    blocker:"Not recorded yet", failed:"Not recorded yet", next:"Write down the blocker first" }
];
const PATHS = {
  Continue:{when:"Spark: the idea still pulls you.", d:"Existing direction is valid and worth resuming.", a:"Review recorded context and confirm immediate micro-tasks.", o:"Warm-Boot Re-entry Checklist", r:"Warm-boot checklist ready: re-open auth.ts, run the schema parser, then test the redirect URL."},
  Restart:{when:"Build: the approach, not the goal, is the problem.", d:"Core goal remains useful, but the current build needs replacement.", a:"Carry forward lessons while resetting the technical approach.", o:"V2 Blueprint Card (linked to V1)", r:"V2 blueprint created and linked to V1. Lessons carried over, technical approach reset."},
  "Change idea":{when:"Blocker: the scope is the wall.", d:"Original scope is too broad, blocked, or misaligned.", a:"Sort proposed features to isolate a smaller, achievable build.", o:"Scope Scalpel Board", r:"Scope Scalpel board opened: sort every feature into keep, cut, or later."},
  Repurpose:{when:"Pause: the product ends, the parts do not.", d:"Full product idea ends, but specific components hold value.", a:"Tag working parts and lessons for cross-project discovery.", o:"Salvage Yard Asset Collection", r:"Working parts tagged and added to the Salvage Yard with their source project."},
  Archive:{when:"Decision: stop, with no guilt.", d:"Stop pursuing the project for now or permanently.", a:"Document final state, takeaways, and future wake-up conditions.", o:"Post-Mortem / Epitaph Card", r:"Epitaph card written: final state, takeaways, and what would wake this project up."}
};

const toastEl = $("#toast"); let tt;
function toast(m){ toastEl.textContent = m; toastEl.classList.add("show"); clearTimeout(tt); tt = setTimeout(()=>toastEl.classList.remove("show"), 2800); }

function renderDossier(el, p){
  el.innerHTML = `
    <div class="side"><h3>▸ ${p.name}</h3>
      <span class="tag">${p.status}</span><span class="tag">Context: ${p.ready}</span>
      <dl><dt>Last state</dt><dd>${p.last}</dd><dt>Tech</dt><dd>${p.tech}</dd></dl></div>
    <div class="black"><h3>Dossier and Black Box</h3>
      <div class="rows">
        <div><b>Vision vs. reality</b><span>${p.vision}</span></div>
        <div><b>Cause</b><span>${p.cause}</span></div>
        <div><b>Blocker</b><span>${p.blocker}</span></div>
        <div><b>Failed try</b><span>${p.failed}</span></div>
        <div class="next"><b>Next step</b><span>${p.next}</span></div></div>
      <div class="choose"><span>Choose a revival path</span><div>
        ${Object.keys(PATHS).map(k=>`<button data-path="${k}">${k}</button>`).join("")}</div></div>
      <div class="result" aria-live="polite">Pick a path to see the output it produces.</div></div>`;
  $$("[data-path]", el).forEach(b => b.onclick = () => { $(".result", el).textContent = PATHS[b.dataset.path].r; });
}
const dA = $("#dossierA"), dB = $("#dossierB");
renderDossier(dA, PROJECTS[0]);

/* ---------- triage ---------- */
const pathsEl = $("#paths"), card = $("#pathcard"), trig = $("#trigger");
function showPath(name){
  const p = PATHS[name];
  $$("button", pathsEl).forEach(b => b.setAttribute("aria-selected", b.dataset.k===name));
  trig.textContent = p.when;
  card.innerHTML = `<div><h3>Decision</h3><p>${p.d}</p></div><div><h3>Action</h3><p>${p.a}</p></div><div><h3>Output</h3><div class="out">${p.o}</div></div>`;
}
Object.keys(PATHS).forEach(k => {
  const b = document.createElement("button"); b.textContent = k; b.dataset.k = k; b.setAttribute("role","tab");
  b.onclick = () => showPath(k); pathsEl.appendChild(b);
});
showPath("Continue");

/* ---------- readiness ---------- */
const sl = [1,2,3,4].map(i => $("#s"+i)), W = [.3,.3,.2,.2];
function score(){ let s = 0; sl.forEach((e,i)=>{ $("#o"+(i+1)).textContent = e.value; s += e.value*W[i]; }); $("#score").textContent = Math.round(s); }
sl.forEach(e => e.addEventListener("input", score)); score();

/* ---------- workbench ---------- */
const wb = $("#workbench"); let filt = "All", cur = PROJECTS[0];
function drawWB(){
  const list = PROJECTS.filter(p => filt==="All" || p.status===filt || p.tech===filt || p.ready===filt);
  $("#plist").innerHTML = list.map(p => `<button data-id="${p.id}" aria-current="${p.id===cur.id}"><b>${p.name}</b><small>${p.status} · ${p.tech} · Context: ${p.ready}</small></button>`).join("") || "<p class='muted'>No projects match this filter.</p>";
  $$("#plist button").forEach(b => b.onclick = () => { cur = PROJECTS.find(p=>p.id===b.dataset.id); drawWB(); });
  renderDossier(dB, cur);
}
const chipVals = ["All","Paused","Blocked","Dormant","Python","React","TypeScript","Ready"];
$("#chips").innerHTML = chipVals.map(v => `<button aria-pressed="${v===filt}" data-v="${v}">${v}</button>`).join("");
$$("#chips button").forEach(b => b.onclick = () => { filt = b.dataset.v; $$("#chips button").forEach(x=>x.setAttribute("aria-pressed", x===b)); drawWB(); });
function openWB(){ wb.classList.add("open"); document.body.style.overflow="hidden"; drawWB(); $("#wbClose").focus(); }
function closeWB(){ wb.classList.remove("open"); document.body.style.overflow=""; }
$("#wbBtn").onclick = openWB; $("#wbBtn2").onclick = openWB; $("#wbClose").onclick = closeWB;
addEventListener("keydown", e => { if(e.key==="Escape") closeWB(); });
$("#spin").onclick = () => {
  const t = +$("#free").value, fit = PROJECTS.filter(p => p.hours <= t);
  const pool = fit.length ? fit : PROJECTS, p = pool[Math.floor(Math.random()*pool.length)];
  $("#pick").textContent = `Try ${p.name}: ${p.next}.`; cur = p; filt="All";
  $$("#chips button").forEach(x=>x.setAttribute("aria-pressed", x.dataset.v==="All")); drawWB();
};
/* ---------- Stage 2: Local Demo Mode & Timeline Engine ---------- */

/*
  Original Timeline Specification:
  - CUT = 0.5: Doorway authentication gate scroll threshold.
  - T_OUT = 5: Pause video frame at the doorway gate (5.0s).
  - T_IN = 16: Doorway room entry frame jumped to upon successful authentication (16.0s).
  - T_END = 18.74: Final resting frame showing tabletop dossiers (18.74s).

  Editorial cut: Seconds 5–16 are intentionally never played or scrubbed through.
*/
const CUT = 0.5, T_OUT = 5, T_IN = 16, T_END = 18.74;

/* ---------- Local Demo Storage & Cryptography ---------- */
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
    console.warn("Storage read error, using in-memory demo profiles:", e);
    return inMemoryProfiles;
  }
}

function saveStoredProfiles(profiles) {
  inMemoryProfiles = profiles;
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
  } catch (e) {
    console.warn("Storage write error for demo profiles:", e);
  }
}

function getStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    return raw ? JSON.parse(raw) : inMemorySession;
  } catch (e) {
    console.warn("Storage read error, using in-memory demo session:", e);
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
  } catch (e) {
    console.warn("Storage write error for demo session:", e);
  }
}

function clearDemoSession() {
  saveStoredSession(null);
}

// NOTE: Web Crypto salted hashing is used for browser-local demo mode only.
// This is not production-grade server authentication.
async function hashDemoPassword(password, salt) {
  try {
    const enc = new TextEncoder();
    const data = enc.encode(`${salt}:${password}`);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
  } catch (e) {
    let hash = 0;
    const str = `${salt}:${password}`;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(16, "0");
  }
}

function generateDemoSalt() {
  try {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
  } catch (_) {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

/* ---------- Optional Owner Email Notification (EmailJS) ---------- */
// EmailJS is an optional notification tool, NOT an authentication provider.
// If left blank, the app functions 100% offline in local Demo Mode.
const EMAIL_NOTIFICATION_CONFIG = {
  publicKey: "",   // Optional: Owner's EmailJS public key
  serviceId: "",   // Optional: EmailJS service ID connected to owner's Gmail
  templateId: ""   // Optional: EmailJS notification template ID
};

async function sendDemoEmailNotification(eventType, email) {
  const { publicKey, serviceId, templateId } = EMAIL_NOTIFICATION_CONFIG;
  if (!publicKey || !serviceId || !templateId) {
    console.info("Email notifications not configured; demo continues locally.");
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

    if (res.ok) {
      return { sent: true };
    } else {
      const errTxt = await res.text();
      console.warn("EmailJS notification failed:", res.status, errTxt);
      return { sent: false, reason: "failed", error: errTxt };
    }
  } catch (err) {
    console.warn("EmailJS network error:", err.message);
    return { sent: false, reason: "network_error", error: err.message };
  }
}

/* ---------- Doorway Auth Panel & Session State ---------- */
const authState = {
  user: null,
  authenticated: false,
  mode: "signin",
  videoAdvancing: false,
  inRoom: false
};

const authForm = $("#authForm");
const authEmail = $("#authEmail");
const authPassword = $("#authPassword");
const passwordLabel = $("#passwordLabel");
const passwordField = $("#passwordField");
const emailField = $("#emailField");
const authSubmitBtn = $("#authSubmitBtn");
const authToggleBtn = $("#authToggleBtn");
const authForgotBtn = $("#authForgotBtn");
const authBackBtn = $("#authBackBtn");
const authMsg = $("#authMsg");
const authEyebrow = $("#authEyebrow");
const authHeading = $("#authHeading");
const authSub = $("#authSub");
const userBadge = $("#userBadge");
const signOutBtn = $("#signOutBtn");

function setAuthMessage(text, type = "info") {
  if (!text) {
    authMsg.className = "auth-msg";
    authMsg.textContent = "";
    authMsg.style.display = "none";
    return;
  }
  authMsg.className = `auth-msg ${type}`;
  authMsg.textContent = text;
  authMsg.style.display = "block";
}

function setAuthMode(mode) {
  authState.mode = mode;
  setAuthMessage("");
  if (mode === "signin") {
    authEyebrow.textContent = "YOUR ARCHIVE AWAITS";
    authHeading.textContent = "Your work is waiting.";
    authSub.textContent = "Sign in with a demo profile stored in this browser, or create a new profile.";
    emailField.style.display = "grid";
    passwordField.style.display = "grid";
    passwordLabel.textContent = "Password";
    authPassword.autocomplete = "current-password";
    authSubmitBtn.style.display = "block";
    authSubmitBtn.textContent = "Sign in";
    authToggleBtn.style.display = "block";
    authToggleBtn.textContent = "Create account";
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
    authSubmitBtn.style.display = "block";
    authSubmitBtn.textContent = "Create account";
    authToggleBtn.style.display = "block";
    authToggleBtn.textContent = "Already have an account? Sign in";
    authForgotBtn.style.display = "none";
    authBackBtn.style.display = "none";
  } else if (mode === "forgot") {
    authEyebrow.textContent = "DEMO ACCESS RECOVERY";
    authHeading.textContent = "Local demo recovery.";
    authSub.textContent = "Password recovery is unavailable in browser-local Demo Mode. To start fresh, create a new demo profile with another email address.";
    emailField.style.display = "none";
    passwordField.style.display = "none";
    authSubmitBtn.style.display = "none";
    authToggleBtn.style.display = "none";
    authForgotBtn.style.display = "none";
    authBackBtn.style.display = "inline-block";
  }
}

if (authToggleBtn) authToggleBtn.onclick = () => setAuthMode(authState.mode === "signin" ? "signup" : "signin");
if (authForgotBtn) authForgotBtn.onclick = () => setAuthMode("forgot");
if (authBackBtn) authBackBtn.onclick = () => setAuthMode("signin");

async function handleAuthSubmit() {
  const email = (authEmail?.value || "").trim().toLowerCase();
  const password = authPassword?.value || "";
  setAuthMessage("");

  if (authState.mode === "forgot") {
    setAuthMessage(
      "Password recovery is not available in browser-local Demo Mode. You can create a new demo profile with another email.",
      "info"
    );
    return;
  }

  // Validate inputs
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

  authSubmitBtn.disabled = true;
  const originalText = authSubmitBtn.textContent;
  authSubmitBtn.textContent = "Verifying…";

  try {
    const profiles = getStoredProfiles();

    if (authState.mode === "signup") {
      if (profiles[email]) {
        setAuthMessage("A demo profile with this email already exists on this browser. Please sign in.", "error");
        return;
      }

      const salt = generateDemoSalt();
      const hash = await hashDemoPassword(password, salt);
      profiles[email] = {
        email,
        salt,
        hash,
        createdAt: new Date().toISOString()
      };
      saveStoredProfiles(profiles);

      const session = { email, signedInAt: new Date().toISOString() };
      saveStoredSession(session);

      // Best-effort optional email notification
      sendDemoEmailNotification("demo_signup", email);

      setAuthMessage("Demo profile created! Stepping inside the archive…", "success");
      setTimeout(() => onAuthSuccess(session, false), 400);

    } else if (authState.mode === "signin") {
      const profile = profiles[email];
      if (!profile) {
        setAuthMessage("No demo profile found for this email. Click 'Create account' to begin.", "error");
        return;
      }

      const hash = await hashDemoPassword(password, profile.salt);
      if (hash !== profile.hash) {
        setAuthMessage("Incorrect demo password. Please try again.", "error");
        return;
      }

      const session = { email, signedInAt: new Date().toISOString() };
      saveStoredSession(session);

      // Best-effort optional email notification
      sendDemoEmailNotification("demo_signin", email);

      setAuthMessage("Demo credentials verified! Stepping inside the archive…", "success");
      setTimeout(() => onAuthSuccess(session, false), 400);
    }
  } catch (err) {
    setAuthMessage("An unexpected error occurred during demo authentication: " + err.message, "error");
  } finally {
    authSubmitBtn.disabled = false;
    authSubmitBtn.textContent = originalText;
  }
}
if (authForm) authForm.onsubmit = e => { e.preventDefault(); handleAuthSubmit(); };

function onAuthSuccess(session, isRestored) {
  authState.user = { email: session.email };
  authState.authenticated = true;
  updateAuthHeader();

  if (isRestored) {
    authState.inRoom = true;
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
  authState.videoAdvancing = false;
  transitionInProgress = false;
  updateAuthHeader();
  setAuthMode("signin");
  toast("Signed out of demo archive.");
  goTo("hero");
  try { video.pause(); video.currentTime = 0; } catch(_) {}
}
if (signOutBtn) signOutBtn.onclick = handleSignOut;

let transitionInProgress = false;

function enterArchiveRoom() {
  if (transitionInProgress || authState.inRoom) return;
  transitionInProgress = true;
  authState.videoAdvancing = true;

  const startPlaybackAtTin = () => {
    const p = video.play();
    if (p !== undefined) {
      p.catch(err => {
        console.warn("Video playback error during transition:", err);
        finishRoomEntrance();
      });
    }
  };

  if (videoAvailable && dur) {
    let seekTimer = null;
    const onSeeked = () => {
      if (seekTimer) clearTimeout(seekTimer);
      video.removeEventListener("seeked", onSeeked);
      startPlaybackAtTin();
    };

    if (Math.abs(video.currentTime - T_IN) < 0.05) {
      startPlaybackAtTin();
    } else {
      video.addEventListener("seeked", onSeeked, { once: true });
      seekTimer = setTimeout(() => {
        video.removeEventListener("seeked", onSeeked);
        startPlaybackAtTin();
      }, 800);

      try {
        video.currentTime = T_IN;
      } catch (e) {
        if (seekTimer) clearTimeout(seekTimer);
        video.removeEventListener("seeked", onSeeked);
        startPlaybackAtTin();
      }
    }
  } else {
    finishRoomEntrance();
  }
}

function finishRoomEntrance() {
  authState.videoAdvancing = false;
  authState.inRoom = true;
  transitionInProgress = false;
  try {
    video.pause();
    video.currentTime = T_END;
  } catch(_) {}
  onEnteredRoom();
}

function onEnteredRoom() {
  authState.inRoom = true;
  try { video.currentTime = T_END; } catch(_) {}
  toast("Welcome to your archive (Demo Mode).");
  goTo("model");
}

/* Check for existing session in localStorage on page load */
function checkDemoSession() {
  const session = getStoredSession();
  if (session && session.email) {
    onAuthSuccess(session, true);
  }
}
checkDemoSession();

/* Guarded header & workbench interactions */
$("#importBtn").onclick = () => {
  if (!authState.authenticated) {
    toast("Please sign in to connect your GitHub repositories.");
    goTo("descent");
    setTimeout(() => authEmail?.focus(), 500);
    return;
  }
  toast("GitHub connection will be configured in Stage 4.");
};

function guardedOpenWB() {
  if (!authState.authenticated) {
    toast("Sign in required to access the Workbench.");
    goTo("descent");
    setTimeout(() => authEmail?.focus(), 500);
    return;
  }
  openWB();
}
$("#wbBtn").onclick = guardedOpenWB;
$("#wbBtn2").onclick = guardedOpenWB;

/* ---------- chapters + scrubbing ---------- */
const video = $("#journey"), dim = $("#dim"), tint = $("#tint"), progress = $("#progress i");
let vz = 1.03, vb = 0, px = 0, py = 0, tx = 0, ty = 0;
const chapters = $$(".chapter").map(el => { const [a,b] = el.dataset.range.split(",").map(Number); return {el, a, b, id:el.dataset.id}; });
const railItems = [["hero","Entrance"],["problem","Problem"],["losses","What is lost"],["landscape","The Archive"],["model","Model"],["triage","Triage"],["modes","Dashboard"],["trust","Trust"]];
const rail = $("#rail");
railItems.forEach(([id,label]) => { const b = document.createElement("button"); b.dataset.go = id; b.innerHTML = `<i></i><span>${label}</span>`; b.setAttribute("aria-label", label); rail.appendChild(b); });
const railBtns = $$("#rail button");

function vt(p){
  if (authState.inRoom) return T_END;
  return p < CUT ? T_OUT * clamp(p / (CUT - 0.01)) : T_OUT;
}

const mid = id => { const c = chapters.find(c=>c.id===id); const b = Math.min(c.b, 1); return Math.max(c.a,0) + (b - Math.max(c.a,0)) * .35; };
const maxScroll = () => document.documentElement.scrollHeight - innerHeight;
function goTo(id){
  const gateIds = ["model", "triage", "modes", "trust"];
  if (!authState.authenticated && gateIds.includes(id)) {
    toast("Sign in at the doorway to unlock this archive section.");
    goTo("descent");
    return;
  }
  scrollTo({top: mid(id)*maxScroll(), behavior: reduce ? "auto":"smooth"});
}
document.addEventListener("click", e => { const t = e.target.closest("[data-go]"); if(t) goTo(t.dataset.go); });
$("#topBtn").onclick = () => scrollTo({top:0, behavior:"smooth"});

let target = 0, shown = 0, dur = 0, ready = false, videoAvailable = false;
function onScroll(){
  let raw = scrollY / Math.max(1, maxScroll());
  if (!authState.authenticated && raw > CUT) {
    raw = CUT;
  }
  target = clamp(raw);
}
addEventListener("scroll", onScroll, {passive:true}); addEventListener("resize", onScroll);

function update(p){
  const F = .018; let active = null, best = 0;
  chapters.forEach(c => {
    const v = smooth((p - c.a)/F) * (c.b >= 1.5 ? 1 : 1 - smooth((p - c.b)/F));
    c.el.style.opacity = v.toFixed(3);
    c.el.style.transform = `translateY(${((1-v)*18).toFixed(1)}px)`;
    c.el.style.filter = v < .98 ? `blur(${((1-v)*6).toFixed(1)}px)` : "none";
    c.el.classList.toggle("live", v > .55);
    if(v > best){ best = v; active = c.id; }
  });

  /* Keep doorway scene clearly visible at the gate without artificial black dips */
  dim.style.opacity = "0";
  tint.style.opacity = ".26";
  progress.style.transform = `scaleX(${p.toFixed(4)})`;
  railBtns.forEach(b => b.classList.toggle("on", b.dataset.go === active));
}
let last = performance.now();
function frame(now){
  const dt = Math.min(.05, (now - last)/1000 || .016); last = now;
  shown += (target - shown) * (reduce ? 1 : 1 - Math.exp(-dt/.085));
  if(Math.abs(target-shown) < .0002) shown = target;

  if (authState.videoAdvancing) {
    /* Natural playback transitioning from T_IN (16s) through doorway to T_END (18.74s) */
    if (video.currentTime >= T_END - 0.08 || video.ended) {
      finishRoomEntrance();
    }
  } else if(ready && videoAvailable && dur){
    const t = Math.min(vt(shown), dur - .05);
    if(!video.seeking && Math.abs(video.currentTime - t) > .008){
      try { video.currentTime = t; } catch(_) { /* Keep the interface responsive */ }
    }
  }
  update(shown);
  px += (tx - px) * .06; py += (ty - py) * .06;
  video.style.transform = `translate3d(${px.toFixed(2)}px,${py.toFixed(2)}px,0) scale(${vz.toFixed(4)})`;
  video.style.filter = `saturate(1.03) contrast(1.05)${vb > .05 ? ` blur(${vb.toFixed(2)}px)` : ""}`;
  requestAnimationFrame(frame);
}
/* a hint of depth: the room drifts a few pixels against the pointer */
if(!reduce && matchMedia("(hover:hover)").matches) addEventListener("pointermove", e => { tx = -(e.clientX/innerWidth - .5) * 14; ty = -(e.clientY/innerHeight - .5) * 8; }, {passive:true});

/* staggered reveal: each chapter's children arrive one after another */
chapters.filter(c => c.id !== "hero").forEach(c => {
  $$(".veil > *, .panel > *, .losses > div, .cols > .box, .model > .box, .dossier > *, .paths button", c.el)
    .forEach((el,i) => { el.classList.add("st"); el.style.setProperty("--i", Math.min(i, 8)); });
});

/* ---------- portable video loading ---------- */
const bar = $("#bar i");
const loaderMessage = $("#loaderMessage");

/*
  Paths are checked relative to this HTML file, not relative to Downloads.
  The first entry supports the recommended layout. The other entries are
  compatibility fallbacks for common capitalization/nesting differences.
*/
const videoCandidates = [
  "journey.mp4",
  "Journey.mp4",
  "JOURNEY.mp4",
  "assets/journey.mp4",
  "assets/Journey.mp4",
  "media/journey.mp4",
  "media/Journey.mp4",
  "Only UI/journey.mp4",
  "Only UI/Journey.mp4",
  "Only UI/Only UI/journey.mp4",
  "Only UI/Only UI/Journey.mp4",
  "../journey.mp4",
  "../Journey.mp4",
  "../Only UI/journey.mp4",
  "../Only UI/Journey.mp4",
  "../../journey.mp4",
  "../../Journey.mp4"
];

let sourceIndex = -1;
let videoStartupTimer = null;

function revealPage(){
  if(ready) return;
  ready = true;
  $("#loader").classList.add("done");
  document.body.classList.add("go");
  onScroll();
  shown = target;
}

function markVideoReady(){
  if(video.readyState < 2) return;
  videoAvailable = true;
  const mediaDuration = video.duration;
  dur = Number.isFinite(mediaDuration) && mediaDuration > 0 ? mediaDuration : 18.79;
  if(videoStartupTimer) clearTimeout(videoStartupTimer);
  revealPage();
}

function showVideoFallback(){
  videoAvailable = false;
  dur = 0;
  if(!ready){
    loaderMessage.textContent = "Camera footage unavailable — opening the archive without video.";
    revealPage();
  }
  toast("Camera video could not be loaded. Keep journey.mp4 or Journey.mp4 beside index.html.");
}

function loadNextVideoSource(){
  sourceIndex += 1;
  if(sourceIndex >= videoCandidates.length){
    showVideoFallback();
    return;
  }
  const candidate = videoCandidates[sourceIndex];
  bar.style.width = "0%";
  loaderMessage.textContent = `Opening the archive · checking video location ${sourceIndex + 1}`;
  videoAvailable = false;
  dur = 0;
  video.pause();
  /* Relative URLs work for local copies, GitHub Pages subpaths and Vercel. */
  video.src = candidate;
  video.load();
}

video.addEventListener("progress", () => {
  try{
    const b = video.buffered;
    if(b.length && Number.isFinite(video.duration) && video.duration > 0){
      bar.style.width = (b.end(b.length - 1) / video.duration * 100) + "%";
    }
  }catch(_){}
});
video.addEventListener("loadeddata", () => {
  video.pause();
  markVideoReady();
});
video.addEventListener("canplaythrough", markVideoReady);
video.addEventListener("error", () => {
  /* A missing path or unreadable media file advances to the next known path. */
  videoAvailable = false;
  dur = 0;
  loadNextVideoSource();
});

/* Never leave visitors trapped on the loading screen if the video hangs. */
videoStartupTimer = setTimeout(() => {
  if(ready) return;
  if(video.readyState >= 2){
    markVideoReady();
  }else{
    loaderMessage.textContent = "The camera video is taking longer than expected. Opening the archive…";
    revealPage();
    toast("If the camera stays still, check that Journey.mp4 is included with the page.");
  }
}, 15000);

loadNextVideoSource();
requestAnimationFrame(frame);
window.__PG_STAGE2__ = { vt, authState, CUT, T_OUT, T_IN, T_END, enterArchiveRoom, handleSignOut, getStoredProfiles, saveStoredProfiles, clearDemoSession, sendDemoEmailNotification };
window.__PG_STEP1__ = window.__PG_STAGE2__;
})();
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
/* ---------- Doorway Auth Panel (Demo Interim) ---------- */
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
    authSub.textContent = "Sign in to return to your archive, or create an account to begin preserving your work.";
    emailField.style.display = "grid";
    passwordField.style.display = "grid";
    passwordLabel.textContent = "Password";
    authPassword.autocomplete = "current-password";
    authSubmitBtn.textContent = "Sign in";
    authToggleBtn.style.display = "block";
    authToggleBtn.textContent = "Create account";
    authForgotBtn.style.display = "inline-block";
    authBackBtn.style.display = "none";
  } else if (mode === "signup") {
    authEyebrow.textContent = "YOUR ARCHIVE AWAITS";
    authHeading.textContent = "Start preserving your work.";
    authSub.textContent = "Create an account to begin recording what you built, why you paused, and what to do next.";
    emailField.style.display = "grid";
    passwordField.style.display = "grid";
    passwordLabel.textContent = "Create password";
    authPassword.autocomplete = "new-password";
    authSubmitBtn.textContent = "Create account";
    authToggleBtn.style.display = "block";
    authToggleBtn.textContent = "Already have an account? Sign in";
    authForgotBtn.style.display = "none";
    authBackBtn.style.display = "none";
  } else if (mode === "forgot") {
    authEyebrow.textContent = "RESET PASSWORD";
    authHeading.textContent = "Recover your access.";
    authSub.textContent = "Enter your email address and we'll send you a link to reset your password.";
    emailField.style.display = "grid";
    passwordField.style.display = "none";
    authSubmitBtn.textContent = "Send reset link";
    authToggleBtn.style.display = "none";
    authForgotBtn.style.display = "none";
    authBackBtn.style.display = "inline-block";
  } else if (mode === "recovery") {
    authEyebrow.textContent = "UPDATE PASSWORD";
    authHeading.textContent = "Set a new password.";
    authSub.textContent = "Enter your new password below to secure your archive.";
    emailField.style.display = "none";
    passwordField.style.display = "grid";
    passwordLabel.textContent = "New password";
    authPassword.autocomplete = "new-password";
    authSubmitBtn.textContent = "Update password";
    authToggleBtn.style.display = "none";
    authForgotBtn.style.display = "none";
    authBackBtn.style.display = "none";
  }
}

if (authToggleBtn) authToggleBtn.onclick = () => setAuthMode(authState.mode === "signin" ? "signup" : "signin");
if (authForgotBtn) authForgotBtn.onclick = () => setAuthMode("forgot");
if (authBackBtn) authBackBtn.onclick = () => setAuthMode("signin");

function handleAuthSubmit() {
  setAuthMessage(
    "Live authentication has been removed for the local demo setup. The demo account flow will be implemented in the next stage. No account has been created.",
    "info"
  );
}
if (authForm) authForm.onsubmit = e => { e.preventDefault(); handleAuthSubmit(); };

function onAuthSuccess(session, isRestored) {
  authState.user = session.user;
  authState.authenticated = true;
  updateAuthHeader();

  if (isRestored) {
    authState.inRoom = true;
    try { video.currentTime = T_END; } catch(_) {}
    toast(`Welcome back, ${session.user.email}`);
  } else {
    setAuthMessage("Session verified. Stepping inside the archive…", "success");
    setTimeout(enterArchiveRoom, 600);
  }
}

function updateAuthHeader() {
  if (authState.authenticated && authState.user) {
    if (userBadge) {
      userBadge.textContent = authState.user.email.split("@")[0];
      userBadge.style.display = "inline-block";
    }
    if (signOutBtn) signOutBtn.style.display = "inline-block";
  } else {
    if (userBadge) userBadge.style.display = "none";
    if (signOutBtn) signOutBtn.style.display = "none";
  }
}

function handleSignOut() {
  authState.user = null;
  authState.authenticated = false;
  authState.inRoom = false;
  authState.videoAdvancing = false;
  updateAuthHeader();
  setAuthMode("signin");
  toast("Signed out of your archive.");
  goTo("hero");
  try { video.currentTime = 0; } catch(_) {}
}
if (signOutBtn) signOutBtn.onclick = handleSignOut;

function enterArchiveRoom() {
  authState.videoAdvancing = true;
  try {
    video.currentTime = T_DOORWAY;
    const p = video.play();
    if (p) p.catch(() => {
      authState.videoAdvancing = false;
      authState.inRoom = true;
      onEnteredRoom();
    });
  } catch(_) {
    authState.videoAdvancing = false;
    authState.inRoom = true;
    onEnteredRoom();
  }
}

function onEnteredRoom() {
  authState.inRoom = true;
  try { video.currentTime = T_END; } catch(_) {}
  toast("Welcome to your archive.");
  goTo("model");
}

/* Guarded header & workbench interactions */
$("#importBtn").onclick = () => {
  if (!authState.authenticated) {
    toast("Please sign in to connect your GitHub repositories.");
    goTo("descent");
    setTimeout(() => authEmail?.focus(), 500);
    return;
  }
  toast("GitHub connection will be configured in Step 2.");
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

/*
  Timeline mapping:
  - 0s to 15.10s: Corridor journey down the stairs and through the hallway up to the doorway.
  - 15.10s: Paused right outside the open doorway facing into the room (authentication gate).
  - Post-authentication: The video resumes from 15.10s through the doorway into the room,
    settling on the tabletop with project dossiers at 18.74s.
*/
const T_DOORWAY = 15.10, T_END = 18.74, P_GATE = 0.50;
function vt(p){
  if (authState.inRoom) return T_END;
  return p < P_GATE ? T_DOORWAY * clamp(p / (P_GATE - 0.01)) : T_DOORWAY;
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
  if (!authState.authenticated && raw > P_GATE) {
    raw = P_GATE;
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
    /* Natural playback transitioning through doorway into the room */
    if (video.currentTime >= T_END - 0.08 || video.ended) {
      video.pause();
      try { video.currentTime = T_END; } catch(_) {}
      authState.videoAdvancing = false;
      authState.inRoom = true;
      onEnteredRoom();
    }
  } else if(ready && videoAvailable && dur){
    const t = Math.min(vt(shown), dur - .05);
    if(!video.seeking && Math.abs(video.currentTime - t) > .008){
      try { video.currentTime = t; } catch(_) { /* Keep the interface responsive if seeking is unsupported. */ }
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
window.__PG_STEP1__ = { vt, authState, T_DOORWAY, T_END, P_GATE };
})();
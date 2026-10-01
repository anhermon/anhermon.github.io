(function () {
  "use strict";
  var doc = document.documentElement;
  var live = document.getElementById("live");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)");

  // Reveals: one IntersectionObserver toggles .in; CSS does the motion (works on every iOS Safari).
  var revealables = document.querySelectorAll("[data-r]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    revealables.forEach(function (el) { io.observe(el); });
  } else revealables.forEach(function (el) { el.classList.add("in"); });

  // One passive scroll -> rAF loop: image parallax, hero drift, pinned proof track.
  var pxEls = [].slice.call(document.querySelectorAll("[data-px]"));
  var heroMedia = document.getElementById("hero-media");
  var proof = document.getElementById("proof"), repos = document.getElementById("repos");
  var trackLen = 0, proofTop = 0, proofOn = false, ticking = false;
  function measureProof() {
    proofOn = !reduce.matches && innerWidth >= 900;
    proof.style.removeProperty("--proof-h");
    if (!proofOn) { repos.style.removeProperty("--tx"); return; }
    trackLen = Math.max(0, repos.scrollWidth - innerWidth);
    proof.style.setProperty("--proof-h", (innerHeight + trackLen) + "px");
    proofTop = proof.getBoundingClientRect().top + scrollY;
  }
  function frame() {
    ticking = false;
    if (reduce.matches) return;
    var vh = innerHeight, y = scrollY;
    for (var i = 0; i < pxEls.length; i++) {
      var el = pxEls[i], r = el.parentNode.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      var c = (r.top + r.height / 2 - vh / 2);
      var lim = r.height * 0.06; // stays inside the 1.14 scale bleed
      el.style.setProperty("--py", Math.max(-lim, Math.min(lim, -c * parseFloat(el.dataset.px))).toFixed(1) + "px");
    }
    if (y < vh * 1.2) heroMedia.style.setProperty("--hy", (y * 0.22).toFixed(1) + "px");
    if (proofOn) {
      var p = Math.min(1, Math.max(0, (y - proofTop) / (trackLen || 1)));
      repos.style.setProperty("--tx", (-p * trackLen).toFixed(1) + "px");
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", function () { measureProof(); onScroll(); });
  addEventListener("load", function () { measureProof(); onScroll(); });
  measureProof(); frame();

  // Desktop pointer parallax on the hero photo (hero.js adds its own strand parallax).
  if (matchMedia("(pointer: fine)").matches) {
    heroMedia.parentNode.addEventListener("pointermove", function (e) {
      if (reduce.matches) return;
      var nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      heroMedia.style.setProperty("--hx", (-nx * 18).toFixed(1) + "px");
      if (scrollY < 10) heroMedia.style.setProperty("--hy", (-ny * 12).toFixed(1) + "px");
    }, { passive: true });
  }

  // Hero run: span data is shared with hero.js (window.RUN).
  var RUN = window.RUN = {
    total: 4.82,
    spans: [
      ["agent.run", 0, 100, "4.82s"], ["plan", 0.5, 8.9, "0.43s"], ["llm.chat", 9.6, 27.2, "1.31s"],
      ["tools/call search", 37, 14.9, "0.72s"], ["tools/call fetch", 52.1, 22, "timeout"], ["retry fetch", 74.4, 9.1, "0.44s"],
      ["llm.chat", 83.7, 12, "0.58s"], ["respond", 96.1, 2.9, "0.14s"]
    ]
  };
  var runlog = document.getElementById("runlog"), readout = document.getElementById("readout"), runs = 1;
  RUN.read = function (t) { // t in 0..1 of the run -> deepest span at that time
    var hit = RUN.spans[0];
    for (var i = 1; i < RUN.spans.length; i++) { var s = RUN.spans[i]; if (t * 100 >= s[1] && t * 100 <= s[1] + s[2]) hit = s; }
    var at = (t * RUN.total).toFixed(2) + "s";
    readout.innerHTML = "t=" + at + " · " + hit[0] + " · " + (hit[3] === "timeout" ? '<span class="burn">timeout</span>' : hit[3]);
  };
  RUN.log = function (h1, h2) {
    runlog.innerHTML = h2 == null ? "<b>run 1</b> · frame " + h1
      : "<b>run " + runs + "</b> · frame " + h2 + (h1 === h2 ? ' = run ' + (runs - 1) + ' · diff <span class="zero">0</span>' : " ≠ run " + (runs - 1));
  };
  document.getElementById("replay").addEventListener("click", function () {
    runs++;
    vlTrackCTA("replay_run");
    if (RUN.replay) return RUN.replay(runs); // WebGL path: re-expose and hash the frame
    // Poster path: re-run the headline exposure; the run data is fixed, so the replay is identical.
    var tr = document.querySelector("h1 .tr");
    tr.style.animation = "none"; void tr.offsetWidth; tr.style.animation = "";
    runlog.innerHTML = "<b>run " + runs + "</b> · same 8 spans as run " + (runs - 1) + ' · diff <span class="zero">0</span>';
  });

  // Load the WebGL strand layer after first paint, only when it can run well.
  var conn = navigator.connection;
  function glOk() {
    if (reduce.matches || (conn && conn.saveData)) return false;
    try { var c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; }
  }
  addEventListener("load", function () {
    if (!glOk()) return;
    setTimeout(function () { var s = document.createElement("script"); s.type = "module"; s.src = "/assets/hero.js"; document.body.appendChild(s); }, 60);
  });

  // Guard: real calls against the real allowlist, one every ~2.4s while in view.
  var gate = document.getElementById("gate");
  var CALLS = [
    { m: "POST", p: "/api/Orders/SendOrder" },
    { m: "GET", p: "/api/Orders/SendOrder" },
    { m: "GET", p: "/api/Account/GetHoldingsSummary", near: 5 },
    { m: "GET", p: "/api/Account/GetHoldingsSummery" }
  ];
  var allowLis = [].slice.call(document.querySelectorAll("#allow li"));
  var ALLOWED = allowLis.map(function (li) { return li.textContent; });
  var stage = gate.querySelector(".gate-stage"), callEl = document.getElementById("call"), verdict = document.getElementById("verdict");
  var outs = document.querySelectorAll("#outcomes li");
  var gi = 0, gTimer = null, gVisible = false;
  function clearAllow() { allowLis.forEach(function (li) { li.className = li.className.replace(/ ?(scan|hit|near)/g, ""); }); }
  function step() {
    var c = CALLS[gi], ok = c.m === "GET" && ALLOWED.indexOf(c.p) >= 0; // same rule as Session.request()
    clearAllow(); stage.dataset.s = ""; callEl.className = "call"; callEl.textContent = c.m + " " + c.p; verdict.className = "verdict"; verdict.textContent = "";
    var lane = callEl.parentNode.clientWidth, w = callEl.offsetWidth;
    var a = callEl.animate([{ transform: "translateX(" + (-w) + "px)" }, { transform: "translateX(" + Math.max(0, (lane - w) / 2) + "px)" }], { duration: 700, easing: "cubic-bezier(.16,1,.3,1)", fill: "forwards" });
    a.onfinish = function () {
      var k = 0;
      var scan = setInterval(function () { // sweep the allowlist
        allowLis.forEach(function (li, j) { li.classList.toggle("scan", j === k); });
        k++;
        if (k > allowLis.length) {
          clearInterval(scan); clearAllow();
          if (c.near != null) allowLis[c.near].classList.add("near");
          if (ok) allowLis[ALLOWED.indexOf(c.p)].classList.add("hit");
          callEl.classList.add(ok ? "passed" : "burnt"); stage.dataset.s = ok ? "ok" : "no";
          verdict.className = "verdict " + (ok ? "ok" : "no");
          verdict.textContent = ok ? "exact match · request goes to the API" : "ValueError: " + c.m + " " + c.p + " is not a permitted read-only endpoint";
          outs.forEach(function (li, j) { li.classList.toggle("on", j === gi); });
          if (ok) callEl.animate([{ transform: "translateX(" + Math.max(0, (lane - w) / 2) + "px)" }, { transform: "translateX(" + lane + "px)" }], { duration: 900, delay: 600, easing: "cubic-bezier(.7,0,.84,0)", fill: "forwards" });
          gi = (gi + 1) % CALLS.length;
          if (gVisible) gTimer = setTimeout(step, ok ? 2600 : 2000);
          else gTimer = null;
        }
      }, 55);
    };
  }
  if (reduce.matches || !("IntersectionObserver" in window) || !callEl.animate) {
    outs[3].classList.add("on");
    var last = CALLS[3]; allowLis[ALLOWED.indexOf(last.p)].classList.add("hit"); callEl.classList.add("passed"); stage.dataset.s = "ok";
    verdict.className = "verdict ok"; verdict.textContent = "exact match · request goes to the API";
  } else {
    new IntersectionObserver(function (es) {
      gVisible = es[0].isIntersecting;
      if (gVisible && !gTimer) step();
    }, { threshold: 0.25 }).observe(gate);
  }

  // Copy email: "Copied" for 1.5s; falls back to mailto when the clipboard is unavailable.
  var copy = document.querySelector(".copy"), copyLbl = copy.querySelector(".lbl"), copyT;
  copy.addEventListener("click", function () {
    var email = copy.dataset.email;
    vlTrackCTA("copy_email");
    if (!navigator.clipboard) { location.href = "mailto:" + email; return; }
    navigator.clipboard.writeText(email).then(function () {
      copy.dataset.state = "copied"; copyLbl.textContent = "Copied"; live.textContent = "Email address copied";
      clearTimeout(copyT);
      copyT = setTimeout(function () { delete copy.dataset.state; copyLbl.textContent = "Copy"; live.textContent = ""; }, 1500);
    }, function () { location.href = "mailto:" + email; });
  });

  // Qualification form -> pre-filled mailto. Nothing leaves the browser until the visitor sends it.
  document.getElementById("lead").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target;
    if (!f.reportValidity()) return;
    var v = function (n) { return f.elements[n].value.trim(); };
    var body = "Name: " + v("name") + "\nEmail: " + v("email") + "\nCompany: " + (v("company") || "-") +
      "\nLooking for: " + v("kind") + "\nTimeline: " + (v("timeline") || "-") + "\n\nWhat runs today, and what goes wrong:\n" + v("problem") + "\n";
    vlTrackCTA("form_submit");
    location.href = "mailto:angel.hermon.mail@gmail.com?subject=" + encodeURIComponent("Inquiry via anhermon.dev: " + v("kind")) + "&body=" + encodeURIComponent(body);
  });
})();

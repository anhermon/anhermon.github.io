// Folio: reveals, header, phone menu, the index wall (signature), before/after compare, copy, forms.
(function () {
  "use strict";
  var PF = window.PF || { forms: { live: false } };
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Reveals
  var rv = $$("[data-r]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.04 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add("in"); });

  // Header hairline and phone menu
  var top = $(".top"), btn = $(".menu-btn"), menu = $("#menu");
  if (top) { var f = function () { top.classList.toggle("solid", scrollY > 8); }; addEventListener("scroll", f, { passive: true }); f(); }
  if (btn && menu) {
    var set = function (open) { btn.setAttribute("aria-expanded", open ? "true" : "false"); menu.hidden = !open; document.documentElement.style.overflow = open ? "hidden" : ""; };
    btn.addEventListener("click", function () { set(menu.hidden); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) set(false); });
    addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { set(false); btn.focus(); } });
    matchMedia("(min-width: 861px)").addEventListener("change", function (m) { if (m.matches) set(false); });
  }

  // The index: the wall repaints to the colour of the work under the pointer (touch: the row at the viewport centre).
  $$("[data-ix]").forEach(function (ix) {
    var rows = $$(".ix-row", ix), bgs = $$(".ix-bg", ix), cards = $$(".ix-card", ix), prev = $(".ix-prev", ix), list = $(".ix-list", ix);
    var py = 0, target = 0, raf = 0;
    function tick() { py += (target - py) * 0.2; if (prev) prev.style.setProperty("--py", py.toFixed(1) + "px"); if (Math.abs(target - py) > 0.4) raf = requestAnimationFrame(tick); else raf = 0; }
    function activate(i) {
      var row = i == null ? null : rows[i];
      rows.forEach(function (r, k) { r.classList.toggle("on", k === i); });
      bgs.forEach(function (b, k) { b.classList.toggle("on", k === i); });
      cards.forEach(function (c, k) { c.classList.toggle("on", k === i); });
      if (row) {
        ix.dataset.active = i; ix.style.setProperty("--ix-ink", row.dataset.ink);
        if (prev && list) {
          var lr = list.getBoundingClientRect(), rr = row.getBoundingClientRect(), card = cards[i], h = card ? card.offsetHeight : 260;
          var y = rr.top - lr.top + rr.height / 2 - h / 2 + (list.offsetTop || 0);
          target = Math.max(list.offsetTop - 8, Math.min(y, list.offsetTop + lr.height - h)); if (!raf) raf = requestAnimationFrame(reduce ? function () { py = target; tick(); } : tick);
        }
      } else { delete ix.dataset.active; ix.style.removeProperty("--ix-ink"); }
    }
    ix._activate = activate;
    var hover = matchMedia("(hover: hover) and (min-width: 901px)");
    rows.forEach(function (r, i) {
      r.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse" && hover.matches) activate(i); });
      r.addEventListener("focusin", function () { activate(i); });
    });
    if (list) { list.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse" && hover.matches && !list.contains(document.activeElement)) activate(null); }); list.addEventListener("focusout", function () { setTimeout(function () { if (!list.contains(document.activeElement) && !list.matches(":hover")) activate(null); }, 0); }); }
    // touch / narrow: the row nearest the middle of the viewport owns the wall
    if (!hover.matches && "IntersectionObserver" in window) {
      var io2 = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) activate(rows.indexOf(e.target)); }); }, { rootMargin: "-42% 0px -42% 0px", threshold: 0 });
      rows.forEach(function (r) { io2.observe(r); });
      var out = new IntersectionObserver(function (es) { es.forEach(function (e) { if (!e.isIntersecting) activate(null); }); }, { rootMargin: "-30% 0px -30% 0px" });
      out.observe(ix);
    }
  });

  // Plates | Index toggle on /work/
  var tog = $(".viewtog");
  if (tog) {
    document.documentElement.classList.add("js-toggle");
    var views = $$("[data-view]"), show = function (v) { views.forEach(function (el) { el.hidden = el.dataset.view !== v; }); $$("button", tog).forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.v === v ? "true" : "false"); }); try { history.replaceState(null, "", v === "index" ? "#index" : location.pathname); } catch (e) {} };
    $$("button", tog).forEach(function (b) { b.addEventListener("click", function () { show(b.dataset.v); }); });
    show(location.hash === "#index" ? "index" : "plates");
  }

  // Compare slider
  var cmp = document.getElementById("cmp");
  if (cmp) {
    var r = $(".cmp-r", cmp), frames = $$(".cmp-frame", cmp), tabs = $$(".cmp-tabs button", cmp);
    var setP = function (v) { cmp.style.setProperty("--p", v + "%"); r.setAttribute("aria-valuetext", Math.round(100 - v) + " percent after"); };
    r.addEventListener("input", function () { setP(r.value); });
    tabs.forEach(function (b) { b.addEventListener("click", function () {
      tabs.forEach(function (t) { t.setAttribute("aria-pressed", t === b ? "true" : "false"); });
      frames.forEach(function (fr) { var on = fr.dataset.frame === b.dataset.f; fr.hidden = !on; if (on) $$("img[loading]", fr).forEach(function (i) { i.loading = "eager"; }); });
    }); });
  }

  // Copy email
  $$(".copy").forEach(function (copy) {
    var lbl = $(".lbl", copy), t;
    copy.addEventListener("click", function () {
      var m = copy.dataset.email;
      if (!navigator.clipboard) { location.href = "mailto:" + m; return; }
      navigator.clipboard.writeText(m).then(function () { copy.dataset.state = "copied"; lbl.textContent = "Copied"; clearTimeout(t); t = setTimeout(function () { delete copy.dataset.state; lbl.textContent = "Copy"; }, 1500); }, function () { location.href = "mailto:" + m; });
    });
  });

  // Forms: honeypot, JSON POST to hermon-forms, 10 s timeout. Non-submitting while PF.forms.live is false.
  function fields(f) { var o = {}; Array.prototype.forEach.call(f.elements, function (el) { if (el.name) o[el.name] = el.type === "checkbox" ? el.checked : el.value.trim(); }); return o; }
  function status(f, state, msg) { var el = f.querySelector(".form-status"); el.dataset.state = state; el.textContent = msg; }
  function post(path, data) {
    var ctl = window.AbortController ? new AbortController() : null, to = setTimeout(function () { if (ctl) ctl.abort(); }, 10000);
    return fetch(PF.forms.endpoint + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), signal: ctl && ctl.signal })
      .then(function (r) { clearTimeout(to); return r.json().catch(function () { return {}; }).then(function (d) { d.status = r.status; return d; }); }, function (e) { clearTimeout(to); throw e; });
  }
  $$(".pf-form").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!f.reportValidity()) return;
      var v = fields(f), b = f.querySelector("button[type=submit]");
      if (!PF.forms.live) { status(f, "ok", "Preview, nothing sent. Everything you typed stayed in this browser."); return; }
      b.disabled = true; status(f, "", "Sending...");
      if (f.dataset.kind === "redesign") {
        var yn = function (x) { return x ? "yes" : "no"; };
        var payload = { name: v.name, email: v.email, kind: PF.forms.redesignSource, company: v.url, timeline: "", source: PF.forms.redesignSource, website: v.website,
          problem: "[source: " + PF.forms.redesignSource + "]\nSite: " + v.url + "\nGoal: " + v.goal + "\nDislikes: " + (v.dislikes || "-") + "\nOwns or is authorised: " + yn(v.owner) + "\nMay contact by email: " + yn(v.contact) + "\nMay show as case study (asked again before publishing): " + yn(v.casestudy) };
        post("lead", payload).then(function (d) { b.disabled = false; if (d.ok) { f.reset(); status(f, "ok", "Received. Your audit comes by email, and the private demo within about five days."); } else status(f, "err", d.error || "Could not send. Email me instead: " + PF.mail); }, function () { b.disabled = false; status(f, "err", "Could not reach the server. Email me instead: " + PF.mail); });
      } else {
        v.source_page = location.pathname;
        post("subscribe", v).then(function (d) { b.disabled = false; if (d.ok) { f.reset(); status(f, "ok", "Saved. A confirmation email with a link will follow; you are only added after you click it."); } else status(f, "err", d.error || "Could not save that. Email me instead."); }, function () { b.disabled = false; status(f, "err", "Could not reach the server. Email me instead."); });
      }
    });
  });
})();

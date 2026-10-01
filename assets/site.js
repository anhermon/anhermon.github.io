(function () {
  "use strict";
  var live = document.getElementById("live");
  var root = document.documentElement;

  // Theme: auto -> light -> dark -> auto. Stored per viewer; page works without storage.
  var themeBtn = document.querySelector(".theme");
  function themeLabel() { themeBtn.firstChild.textContent = "Theme: " + (root.dataset.theme || "auto"); }
  themeLabel();
  themeBtn.addEventListener("click", function () {
    var next = { "": "light", light: "dark", dark: "" }[root.dataset.theme || ""];
    if (next) root.dataset.theme = next; else delete root.dataset.theme;
    try { next ? localStorage.setItem("theme", next) : localStorage.removeItem("theme"); } catch (e) {}
    themeLabel();
  });

  // Copy email, "Copied" for 1.5s. Falls back to mailto if the clipboard is unavailable.
  var copy = document.querySelector(".copy");
  var copyLbl = copy.querySelector(".lbl"), copyHtml = copyLbl.innerHTML, copyT;
  copy.addEventListener("click", function () {
    var email = copy.dataset.email;
    window.vlTrackCTA("copy_email");
    if (!navigator.clipboard) { location.href = "mailto:" + email; return; }
    navigator.clipboard.writeText(email).then(function () {
      copy.style.minWidth = copy.offsetWidth + "px"; copy.dataset.state = "copied"; copyLbl.textContent = "Copied";
      live.textContent = "Email address copied";
      clearTimeout(copyT);
      copyT = setTimeout(function () { delete copy.dataset.state; copyLbl.innerHTML = copyHtml; copy.style.minWidth = ""; live.textContent = ""; }, 1500);
    }, function () { location.href = "mailto:" + email; });
  });

  // Replay: rerun the waterfall; the old run stays as a dashed ghost and the new bars land on it.
  var trace = document.getElementById("trace"), runlog = document.getElementById("runlog"), run = 1;
  document.getElementById("replay").addEventListener("click", function () {
    run++;
    trace.classList.add("replayed");
    trace.classList.remove("run");
    void trace.offsetWidth; // restart CSS animations
    trace.classList.add("run");
    runlog.innerHTML = "run " + (run - 1) + " → <b>run " + run + "</b> · diff <span class=\"zero\">0</span>";
  });

  // Rail ticks light as their section reaches the upper half of the viewport.
  var ticks = document.querySelectorAll(".rail li");
  if ("IntersectionObserver" in window && ticks.length) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var t = document.querySelector('.rail li[data-for="' + e.target.id + '"]');
        if (t) t.classList.toggle("on", e.boundingClientRect.top < window.innerHeight * 0.5);
      });
    }, { rootMargin: "0px 0px -50% 0px", threshold: [0, 1] });
    ticks.forEach(function (t) { var s = document.getElementById(t.dataset.for); if (s) io.observe(s); });
  }

  // Qualification form -> pre-filled mailto. Nothing leaves the browser until the visitor sends it.
  document.getElementById("lead").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target;
    if (!f.reportValidity()) return;
    var v = function (n) { return f.elements[n].value.trim(); };
    var body = "Name: " + v("name") + "\nEmail: " + v("email") + "\nCompany: " + (v("company") || "-") +
      "\nLooking for: " + v("kind") + "\nTimeline: " + (v("timeline") || "-") + "\n\nWhat runs today, and what goes wrong:\n" + v("problem") + "\n";
    window.vlTrackCTA("form_submit");
    location.href = "mailto:angel.hermon.mail@gmail.com?subject=" + encodeURIComponent("Inquiry via anhermon.dev: " + v("kind")) + "&body=" + encodeURIComponent(body);
  });
})();

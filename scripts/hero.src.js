// Hero light-strand layer. Build: see scripts/build-hero.mjs (esbuild bundles OGL into /assets/hero.js).
// The strands are the 8-span run in window.RUN, laid along the light thread photographed in the hero image:
// each span's bundle bows out of the thread for its duration; the fetch timeout burns amber and frays.
// Determinism: all strand attributes come from mulberry32(seed); Replay re-exposes and hashes a canonical frame.
import { Renderer } from "ogl/src/core/Renderer.js";
import { Program } from "ogl/src/core/Program.js";
import { Geometry } from "ogl/src/core/Geometry.js";
import { Mesh } from "ogl/src/core/Mesh.js";
import { RenderTarget } from "ogl/src/core/RenderTarget.js";

const RUN = window.RUN, doc = document.documentElement;
const hero = document.querySelector(".hero"), media = document.getElementById("hero-media");
const poster = document.getElementById("poster"), canvas = document.getElementById("strands");
const cursorEl = document.getElementById("cursor"), readout = document.getElementById("readout");
const touch = matchMedia("(pointer: coarse)").matches;

// Light thread centreline in hero-a image pixels (1536x1024), traced by eye from the photograph.
const THREAD = [[720, 467], [780, 462], [860, 424], [930, 462], [990, 522], [1060, 478], [1120, 418], [1180, 392], [1250, 404], [1330, 452], [1410, 505], [1480, 538], [1560, 560]];
const CROP_M = [560, 120]; // hero-m crop offset (see images.mjs)
const SEED = 0x4bf92f35, N = 128;

function mulberry32(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function catmull(p, t) { // uniform Catmull-Rom through THREAD, t in 0..1
  const n = p.length - 1, f = t * n, i = Math.min(n - 1, Math.floor(f)), u = f - i;
  const a = p[Math.max(0, i - 1)], b = p[i], c = p[i + 1], d = p[Math.min(n, i + 2)];
  return [0, 1].map((k) => 0.5 * (2 * b[k] + (-a[k] + c[k]) * u + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * u * u + (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * u * u * u));
}

let renderer;
try { renderer = new Renderer({ canvas, alpha: false, antialias: false, dpr: Math.min(devicePixelRatio, touch ? 1.5 : 2), powerPreference: "low-power", premultipliedAlpha: false }); }
catch (e) { fail(); }
const gl = renderer && renderer.gl;
if (gl) init();

function fail() { doc.dataset.hero = "poster"; RUN.replay = null; document.getElementById("readout").textContent = "8 spans, one timeout"; }

function init() {
  gl.clearColor(0, 0, 0, 1);
  const mobileCrop = /hero-m/.test(poster.currentSrc);
  const off = mobileCrop ? CROP_M : [0, 0];

  // Base strip: centreline position, normal and run-time t per vertex.
  const pos = new Float32Array(N * 2), nor = new Float32Array(N * 2), tt = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1), p = catmull(THREAD, t), q = catmull(THREAD, Math.min(1, t + 0.002)), r = catmull(THREAD, Math.max(0, t - 0.002));
    const dx = q[0] - r[0], dy = q[1] - r[1], l = Math.hypot(dx, dy) || 1;
    pos[i * 2] = p[0] - off[0]; pos[i * 2 + 1] = p[1] - off[1]; nor[i * 2] = -dy / l; nor[i * 2 + 1] = dx / l; tt[i] = t;
  }
  // Instances: strands per span, deterministic.
  const rnd = mulberry32(SEED), total = touch ? 380 : 760;
  const LANE = [0, -70, 96, -84, 130, -56, 72, -30]; // bow-out per span, image px
  const SHARE = [0.34, 0.06, 0.13, 0.09, 0.14, 0.06, 0.1, 0.08];
  const A = [], B = [];
  RUN.spans.forEach((s, k) => {
    const n = Math.round(total * SHARE[k]), st = s[1] / 100, en = (s[1] + s[2]) / 100;
    for (let j = 0; j < n; j++) {
      A.push(rnd(), st, Math.max(en, st + 0.03), LANE[k] * (0.82 + rnd() * 0.36));
      B.push(k === 0 ? 2 : k === 4 ? 1 : 0, (rnd() - 0.5) * (k === 0 ? 10 : 22));
    }
  });
  const geometry = new Geometry(gl, {
    position: { size: 2, data: pos }, normal: { size: 2, data: nor }, aT: { size: 1, data: tt },
    iA: { instanced: 1, size: 4, data: new Float32Array(A) }, iB: { instanced: 1, size: 2, data: new Float32Array(B) },
  });
  const program = new Program(gl, {
    vertex: /* glsl */ `
      attribute vec2 position; attribute vec2 normal; attribute float aT; attribute vec4 iA; attribute vec2 iB;
      uniform vec2 uScale, uOff, uRes, uPtr; uniform float uTime, uCursor;
      varying float vT, vEnv, vKind, vFr, vNear;
      float h(float n){ return fract(sin(n) * 43758.5453); }
      float nz(float x){ float i = floor(x), f = fract(x); return mix(h(i), h(i + 1.), f * f * (3. - 2. * f)) * 2. - 1.; }
      void main(){
        float s = iA.y, e = iA.z, seed = iA.x, t = aT;
        float rp = min(.07, (e - s) * .5);
        float env = iB.x > 1.5 ? 1. : smoothstep(s, s + rp, t) * (1. - smoothstep(e - rp, e, t));
        float burn = step(.5, iB.x) * step(iB.x, 1.5);
        float fr = burn * smoothstep(s + (e - s) * .35, e, t);
        float n = nz(t * 4. + seed * 31.) * .7 + nz(t * 11. + seed * 17.) * .3;
        float o = (iB.x > 1.5 ? 0. : iA.w * env) + iB.y * (.35 + env * .65) + n * (2.5 + env * 7. + fr * 90.) + sin(uTime * .6 + seed * 6.2832) * 1.4;
        vec2 p = position + normal * o + uPtr * (6. + seed * 26.);
        vec2 px = p * uScale + uOff;
        vec2 c = px / uRes * 2. - 1.;
        gl_Position = vec4(c.x, -c.y, 0., 1.);
        vT = t; vEnv = env; vKind = iB.x; vFr = fr; vNear = 1. - smoothstep(0., .035, abs(t - uCursor));
      }`,
    fragment: /* glsl */ `
      precision highp float;
      uniform float uExpose; uniform vec3 uSignal, uBurn;
      varying float vT, vEnv, vKind, vFr, vNear;
      void main(){
        if (vT > uExpose) discard;
        float burn = step(.5, vKind) * step(vKind, 1.5);
        float head = exp(-(uExpose - vT) * 70.) * (1. - step(.999, uExpose));
        float a = smoothstep(0., .07, vT) * (vKind > 1.5 ? .055 : .035 + .12 * vEnv + burn * vEnv * .12);
        a *= (1. + head * 7. + vNear * 3.) * (1. - vFr * .55);
        vec3 c = mix(uSignal, uBurn, burn * vEnv);
        gl_FragColor = vec4(c * a, 1.);
      }`,
    uniforms: {
      uScale: { value: [1, 1] }, uOff: { value: [0, 0] }, uRes: { value: [1, 1] }, uPtr: { value: [0, 0] },
      uTime: { value: 0 }, uCursor: { value: -1 }, uExpose: { value: 0 },
      uSignal: { value: [0.5, 0.64, 1.0] }, uBurn: { value: [1.0, 0.62, 0.26] },
    },
    transparent: true, depthTest: false, depthWrite: false,
  });
  program.setBlendFunc(gl.ONE, gl.ONE);
  const mesh = new Mesh(gl, { geometry, program, mode: gl.LINE_STRIP });
  const U = program.uniforms;
  const IW = mobileCrop ? 976 : 1536, IH = mobileCrop ? 904 : 1024;

  // Cover transform identical to the <img>'s object-fit: cover + object-position.
  let W = 0, H = 0, sc = 1, ox = 0, oy = 0;
  function layout() {
    W = media.clientWidth; H = media.clientHeight;
    renderer.setSize(W, H);
    const op = getComputedStyle(poster).objectPosition.split(" ").map((v) => parseFloat(v) / 100);
    sc = Math.max(W / IW, H / IH); ox = (W - IW * sc) * op[0]; oy = (H - IH * sc) * (op[1] ?? 0.5);
    dirty = true;
  }
  // Canonical frame for the replay hash: fixed 256x128 target, fixed uniforms, independent of viewport.
  const rt = new RenderTarget(gl, { width: 256, height: 128 });
  function frameHash() {
    const keep = [U.uScale.value, U.uOff.value, U.uRes.value, U.uPtr.value, U.uTime.value, U.uCursor.value, U.uExpose.value];
    Object.assign(U.uScale, { value: [256 / IW, 128 / IH] }); U.uOff.value = [0, 0]; U.uRes.value = [256, 128];
    U.uPtr.value = [0, 0]; U.uTime.value = 0; U.uCursor.value = -1; U.uExpose.value = 1;
    renderer.render({ scene: mesh, target: rt });
    const px = new Uint8Array(256 * 128 * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, rt.buffer); gl.readPixels(0, 0, 256, 128, gl.RGBA, gl.UNSIGNED_BYTE, px); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    [U.uScale.value, U.uOff.value, U.uRes.value, U.uPtr.value, U.uTime.value, U.uCursor.value, U.uExpose.value] = keep;
    let h = 0x811c9dc5; for (let i = 0; i < px.length; i++) { h ^= px[i]; h = Math.imul(h, 0x01000193); }
    let lit = 0; for (let i = 0; i < px.length; i += 4) if (px[i + 2] > 8) lit++;
    return lit > 200 ? (h >>> 0).toString(16).padStart(8, "0") : null; // null = blank frame, treat as failure
  }

  // State + loop
  const tr = document.querySelector("h1 .tr");
  let expose = 0, t0 = 0, exposing = true, dirty = true, visible = true, raf = 0, frames = 0, slow = 0, last = 0, hash1 = null, run = 1;
  let ptr = [0, 0], ptrT = [0, 0], cursor = -1, scrollP = 0;
  const DUR = 2600, ease = (x) => 1 - Math.pow(1 - x, 3);
  function setExpose(e) {
    expose = e; U.uExpose.value = e;
    doc.style.setProperty("--tw", Math.round(200 + 600 * e));
    doc.style.setProperty("--ts", (76 + 24 * e).toFixed(1) + "%");
  }
  function tick(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    if (!t0) t0 = now;
    if (last) { const dt = now - last; if (frames < 90) { frames++; if (dt > 24) slow++; } }
    last = now;
    if (frames >= 90 && slow > 60) { // sustained < ~40fps (Low Power Mode cap, weak GPU): fall back to the photograph
      fail(); return;
    }
    if (exposing) {
      const p = Math.min(1, (now - t0) / DUR); setExpose(ease(p));
      if (p >= 1) { exposing = false; done(); }
    }
    ptr[0] += (ptrT[0] - ptr[0]) * 0.08; ptr[1] += (ptrT[1] - ptr[1]) * 0.08;
    U.uPtr.value = [ptr[0], ptr[1] + scrollP * -30];
    U.uTime.value = now / 1000; U.uCursor.value = cursor;
    U.uScale.value = [sc, sc]; U.uOff.value = [ox, oy]; U.uRes.value = [W, H];
    renderer.render({ scene: mesh });
    if (!doc.dataset.hero || doc.dataset.hero === "") doc.dataset.hero = "gl";
    raf = requestAnimationFrame(tick);
  }
  function kick() { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(tick); }
  function done() {
    const h = frameHash();
    if (!h) { fail(); return; }
    if (run === 1) { hash1 = h; RUN.log(h); } else RUN.log(hash1, h);
  }
  RUN.replay = function (n) { run = n; t0 = 0; exposing = true; setExpose(0); kick(); };

  // Inputs: pointer = time cursor + parallax (fine); horizontal drag scrubs (touch); scroll = parallax depth.
  function toT(clientX) { // x on screen -> run time along the thread
    const ix = (clientX - media.getBoundingClientRect().left - ox) / sc + off[0];
    const x0 = THREAD[0][0], x1 = THREAD[THREAD.length - 1][0];
    return (ix - x0) / (x1 - x0);
  }
  function scrub(e) {
    const t = toT(e.clientX);
    if (t < 0 || t > 1 || t > expose + 0.001) { hero.classList.remove("scrub"); cursor = -1; return; }
    cursor = t; hero.classList.add("scrub"); cursorEl.style.setProperty("--cx", e.clientX - media.getBoundingClientRect().left + "px"); RUN.read(t);
  }
  hero.addEventListener("pointermove", (e) => {
    if (e.pointerType === "mouse") { ptrT = [(e.clientX / innerWidth - 0.5) * -1, (e.clientY / innerHeight - 0.5) * -1]; scrub(e); }
    else if (e.buttons || e.pressure) scrub(e);
  }, { passive: true });
  hero.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") scrub(e); }, { passive: true });
  hero.addEventListener("pointerleave", () => { cursor = -1; hero.classList.remove("scrub"); });
  addEventListener("scroll", () => { scrollP = Math.min(1, scrollY / innerHeight); }, { passive: true });

  new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) kick(); }).observe(hero);
  document.addEventListener("visibilitychange", kick);
  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); cancelAnimationFrame(raf); raf = 0; fail(); });
  addEventListener("resize", () => { layout(); kick(); });
  readout.textContent = touch ? "drag across the run" : "move across the run";
  layout();
  setExpose(0);
  kick();
}

// Bundle scripts/hero.src.js + OGL (Unlicense) into /assets/hero.js.
// Usage: NODE_PATH=<dir with node_modules containing ogl + esbuild> node scripts/build-hero.mjs
import { createRequire } from "node:module";
import path from "node:path";
const nodePaths = (process.env.NODE_PATH || "").split(":").filter(Boolean);
const require = createRequire(path.join(nodePaths[0] || process.cwd(), "x.js"));
const esbuild = require("esbuild");
const root = path.dirname(new URL(import.meta.url).pathname) + "/..";
const r = await esbuild.build({
  entryPoints: [root + "/scripts/hero.src.js"], outfile: root + "/assets/hero.js",
  bundle: true, minify: true, format: "esm", target: ["safari15", "chrome100"], nodePaths, metafile: true,
  banner: { js: "/* hero strands. OGL (c) Nathan Gordon, Unlicense. Source: /scripts/hero.src.js */" },
});
console.log(Object.entries(r.metafile.outputs).map(([f, o]) => f + " " + o.bytes + "B").join("\n"));

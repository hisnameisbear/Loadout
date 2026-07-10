// Bundles src/main.jsx with esbuild and splices the result into index.html,
// replacing the app <script> while leaving the head/CSS/SW registration intact.
import { build } from "esbuild";
import { readFileSync, writeFileSync } from "fs";

const result = await build({
  entryPoints: ["src/main.jsx"],
  bundle: true,
  minify: true,
  format: "iife",
  legalComments: "eof",
  write: false,
  define: { "process.env.NODE_ENV": '"production"' },
});
const js = result.outputFiles[0].text;

const html = readFileSync("index.html", "utf8");
const openTag = '<div id="root"></div>\n<script>';
const start = html.indexOf(openTag);
if (start < 0) throw new Error("app script open tag not found");
const from = start + openTag.length;
const swMarker = "<script>\nif ('serviceWorker' in navigator)";
const swAt = html.indexOf(swMarker);
if (swAt < 0) throw new Error("service worker script marker not found");
const closeTag = "</script>\n";
const end = html.lastIndexOf(closeTag, swAt);
if (end < 0 || end < from) throw new Error("app script close tag not found");

const out = html.slice(0, from) + "\n" + js + html.slice(end);
writeFileSync("index.html", out);
console.log(`index.html updated — bundle ${(js.length / 1024).toFixed(1)} kB`);

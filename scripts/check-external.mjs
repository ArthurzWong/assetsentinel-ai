/**
 * Post-build CSP self-check: scans the exported site (out/) for references the
 * strict serving CSP would block.
 *
 * Fetchable contexts checked:
 *  - HTML: <script|img|iframe|source|video|audio|link ... src=/href=/srcset=>
 *  - CSS:  url(...) and @import with absolute external targets
 *  - Source (src/): fetch()/XMLHttpRequest to external origins
 * URL strings inside JS bundles (error-message helpers, doc links, jsPDF's
 * optional PDFObject URL) are inert unless the code fetches them, so they are
 * listed informationally and do not fail the build.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "out");

const INERT_HOSTS = ["www.w3.org", "w3.org", "jspdf.default.namespaceuri"];

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

function isExternal(url) {
  const m = url.match(/^https?:\/\/([^/"'\s)]+)/i);
  if (!m) return false;
  return !INERT_HOSTS.includes(m[1].toLowerCase());
}

const files = walk(outDir);
const offenders = [];
const inertInfo = [];

for (const f of files) {
  const ext = extname(f);
  if (![".html", ".css", ".js", ".svg"].includes(ext)) continue;
  const content = readFileSync(f, "utf8");
  const rel = f.replace(outDir, "out");

  if (ext === ".html") {
    const re = /(?:src|href|srcset|poster)=["']((?:https?:)?\/\/[^"']+)["']/gi;
    let m;
    while ((m = re.exec(content)) !== null) {
      if (isExternal(m[1])) offenders.push({ file: rel, url: m[1] });
    }
  } else if (ext === ".css") {
    const re = /url\(\s*(["']?)(https?:)?\/\/[^)]*\1\s*\)|@import\s+(?:url\()?\s*(["'])(https?:)?\/\//gi;
    if (isExternal(content) === true) { /* handled below via simple scan */ }
    const re2 = /url\(\s*(["']?)([^)]*)\1\s*\)/gi;
    let m;
    while ((m = re2.exec(content)) !== null) {
      if (isExternal(m[2].trim())) offenders.push({ file: rel, url: m[2].trim() });
    }
    const imp = /@import\s+["']([^"']+)["']|@import\s+url\(\s*["']?([^"')]+)["']?\s*\)/gi;
    while ((m = imp.exec(content)) !== null) {
      const t = (m[1] ?? m[2] ?? "").trim();
      if (isExternal(t)) offenders.push({ file: rel, url: t });
    }
  } else if (ext === ".js") {
    const re = /((?:https?:)?\/\/[a-zA-Z0-9.-]+\.[a-z]{2,}(?:\/[^\s"'`<>)]*)?)/g;
    let m;
    while ((m = re.exec(content)) !== null) {
      if (isExternal(m[1])) inertInfo.push({ file: rel, url: m[1] });
    }
  }
}

// Source-level network call audit (our own code must not call out)
const srcFiles = walk(join(root, "src")).filter((f) => [".ts", ".tsx"].includes(extname(f)));
for (const f of srcFiles) {
  const content = readFileSync(f, "utf8");
  const re = /(?:fetch|XMLHttpRequest|axios)\s*\(\s*["'`](https?:)?\/\/[^"'`]+/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    offenders.push({ file: f.replace(root, ""), url: m[0] });
  }
}

if (offenders.length > 0) {
  console.error("[check-external] FAIL — fetchable external references found:");
  for (const o of offenders.slice(0, 40)) console.error(`  ${o.file}: ${o.url}`);
  process.exit(1);
}

console.log(`[check-external] OK — no fetchable external references in HTML/CSS/source.`);
if (inertInfo.length > 0) {
  const uniq = [...new Set(inertInfo.map((i) => i.url))];
  console.log(`[check-external] info: ${inertInfo.length} inert URL string(s) in JS bundles (${uniq.length} unique) — e.g. ${uniq.slice(0, 3).join(", ")}`);
}

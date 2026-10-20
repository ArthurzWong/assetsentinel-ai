/**
 * Generates the synthetic SVG demo scenes used across the app (public/images/).
 * These are clearly fictional illustrations — no photos of real premises.
 * Runs automatically before `npm run build` and writes deterministic SVGs.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "images");
mkdirSync(outDir, { recursive: true });

const W = 1200;
const H = 800;

function sky(top = "#dbe7f3", bottom = "#eef4fa") {
  return `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${top}"/><stop offset="100%" stop-color="${bottom}"/>
  </linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>`;
}

function ground() {
  return `<rect y="${H - 120}" width="${W}" height="120" fill="#cbd5cf"/>
  <rect y="${H - 120}" width="${W}" height="10" fill="#b6c2ba"/>`;
}

function corrugated(x, y, w, h, base, dark) {
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${base}"/>`;
  for (let i = x; i < x + w; i += 26) {
    s += `<rect x="${i}" y="${y}" width="7" height="${h}" fill="${dark}" opacity="0.5"/>`;
  }
  return s;
}

function panels(rows) {
  // standing-seam roof texture
  let s = "";
  for (let i = 0; i <= rows; i++) {
    const x = (i / rows) * W;
    s += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#8ea3b8" stroke-width="3" opacity="0.55"/>`;
  }
  return s;
}

function noiseDots(n, color, rMax = 3, seed = 1) {
  let s = "";
  let x = seed * 9301 % 233280;
  const rnd = () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
  for (let i = 0; i < n; i++) {
    s += `<circle cx="${Math.round(rnd() * W)}" cy="${Math.round(rnd() * H)}" r="${(rnd() * rMax + 1).toFixed(1)}" fill="${color}" opacity="${(rnd() * 0.4 + 0.2).toFixed(2)}"/>`;
  }
  return s;
}

function wrap(inner, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<metadata>AssetSentinel AI demo asset — synthetic scene, not a photograph of any real premises.</metadata>
${inner}
<g><rect x="${W - 470}" y="${H - 62}" width="440" height="40" rx="8" fill="#131e30" opacity="0.85"/>
<text x="${W - 250}" y="${H - 36}" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#fbbf24" text-anchor="middle">DEMO IMAGE — SYNTHETIC SCENE</text></g>
</svg>`;
}

const scenes = {};

// roof-1: metal deck roof field seen at an angle
scenes["roof-1.svg"] = wrap(`
${sky("#c9d9ec", "#eef4fa")}
${ground()}
<g>
  <polygon points="0,300 700,180 1200,320 1200,720 0,720" fill="#7f96ab"/>
  ${panels(16)}
  <polygon points="0,300 700,180 700,210 0,330" fill="#5d7288"/>
  <polygon points="700,180 1200,320 1200,350 700,210" fill="#9db1c4"/>
  ${noiseDots(70, "#a2704f", 4, 3)}
  ${noiseDots(28, "#7c4a2d", 5, 7)}
</g>
<rect x="80" y="640" width="240" height="90" rx="6" fill="#94a3b8" opacity="0.5"/>
<text x="200" y="180" font-family="Arial" font-size="26" fill="#33475b" opacity="0.65">Production hall — main roof field</text>
`, "roof-1");

// roof-2: gutter run close-up
scenes["roof-2.svg"] = wrap(`
${sky("#d3e0ee", "#f2f6fa")}
<g>
  <rect x="0" y="240" width="${W}" height="90" fill="#6e8399"/>
  ${corrugated(0, 0, W, 240, "#88a0b6", "#75909f")}
  <path d="M0 330 Q 300 318 600 330 T 1200 330 L1200 420 Q 900 408 600 420 T 0 420 Z" fill="#5b6d7d"/>
  <rect x="120" y="360" width="300" height="52" rx="20" fill="#8a7351"/>
  ${noiseDots(60, "#6d5a3e", 5, 11)}
  <ellipse cx="880" cy="392" rx="120" ry="24" fill="#4c5a66"/>
  <rect x="1130" y="420" width="44" height="330" fill="#46586a"/>
  <rect x="1096" y="420" width="40" height="330" fill="#3c4c5c"/>
</g>
<text x="120" y="120" font-family="Arial" font-size="26" fill="#33475b">North gutter run — mid span</text>
`, "roof-2");

// roof-3: low area with ponding look
scenes["roof-3.svg"] = wrap(`
${sky("#cddcea", "#eef4fa")}
<g>
  <rect x="0" y="200" width="${W}" height="520" fill="#8299ad"/>
  ${panels(12)}
  <ellipse cx="620" cy="470" rx="330" ry="120" fill="#5f7d94" opacity="0.9"/>
  <ellipse cx="620" cy="470" rx="240" ry="86" fill="#4e6a81"/>
  <ellipse cx="600" cy="462" rx="90" ry="30" fill="#7fa9c4" opacity="0.7"/>
  ${noiseDots(50, "#94613c", 3, 21)}
  <rect x="0" y="700" width="${W}" height="26" fill="#54687a"/>
</g>
<text x="120" y="120" font-family="Arial" font-size="26" fill="#33475b">Block C roof — low area</text>
`, "roof-3");

// roof-4: loading bay canopy + downpipes
scenes["roof-4.svg"] = wrap(`
${sky("#d7e4f0", "#f1f6fa")}
${ground()}
<g>
  <rect x="60" y="240" width="1080" height="60" fill="#64798d"/>
  ${corrugated(60, 200, 1080, 40, "#7d94a9", "#68808f")}
  <rect x="150" y="300" width="60" height="360" fill="#8d9cad"/>
  <rect x="990" y="300" width="60" height="360" fill="#8d9cad"/>
  <rect x="480" y="300" width="26" height="420" fill="#4d6274"/>
  <rect x="450" y="560" width="86" height="26" rx="8" fill="#405468"/>
  <rect x="640" y="380" width="220" height="220" fill="#a8b6c4"/>
  ${corrugated(640, 380, 220, 220, "#b6c3cf", "#a3b1bf")}
  ${noiseDots(40, "#7b5a3c", 3, 33)}
</g>
<text x="120" y="140" font-family="Arial" font-size="26" fill="#33475b">Loading bay — canopy &amp; downpipes</text>
`, "roof-4");

// ext-1: north elevation cladding
scenes["ext-1.svg"] = wrap(`
${sky("#d2dfec", "#f2f6fa")}
${ground()}
<g>
  <rect x="0" y="180" width="${W}" height="500" fill="#9db0c0"/>
  ${corrugated(0, 180, W, 500, "#a9bccb", "#93a7ba")}
  <rect x="0" y="180" width="${W}" height="26" fill="#5f7488"/>
  ${noiseDots(46, "#9c7a55", 4, 13)}
  <rect x="380" y="300" width="180" height="140" rx="6" fill="#c9d6e0"/>
  <rect x="700" y="300" width="180" height="140" rx="6" fill="#c9d6e0"/>
  <rect x="560" y="500" width="90" height="180" fill="#5a6d7f"/>
</g>
<text x="120" y="120" font-family="Arial" font-size="26" fill="#33475b">North elevation — cladding</text>
`, "ext-1");

for (const [name, svg] of Object.entries(scenes)) {
  writeFileSync(join(outDir, name), svg, "utf8");
}

console.log(`[gen-images] wrote ${Object.keys(scenes).length} synthetic demo scenes to public/images/`);

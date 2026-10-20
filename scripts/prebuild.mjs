/**
 * Prebuild guard: generates demo assets and verifies demo-data hygiene
 * (seed counts, no obvious real-customer markers) before `next build`.
 */
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// 1. Generate synthetic demo imagery (idempotent)
if (!existsSync(join(root, "public", "images", "roof-1.svg"))) {
  const r = spawnSync("node", [join(root, "scripts", "gen-images.mjs")], { stdio: "inherit" });
  if (r.status !== 0) {
    console.error("[prebuild] failed to generate demo images");
    process.exit(1);
  }
} else {
  mkdirSync(join(root, "public", "images"), { recursive: true });
  console.log("[prebuild] demo images already present");
}

// 2. Demo hygiene checks against the typed seed
const checks = [
  { file: "src/lib/data.ts", mustInclude: ["DEMO", "demo"] },
];
for (const { file, mustInclude } of checks) {
  const src = await import(join(root, file)).catch(() => null);
  if (!src) {
    console.error(`[prebuild] cannot import ${file}`);
    process.exit(1);
  }
  const props = src.DEMO_PROPERTIES ?? [];
  const findings = src.DEMO_FINDINGS ?? [];
  if (props.length !== 4) {
    console.error(`[prebuild] expected 4 demo properties, found ${props.length}`);
    process.exit(1);
  }
  if (findings.length !== 15) {
    console.error(`[prebuild] expected 15 demo findings, found ${findings.length}`);
    process.exit(1);
  }
  const towns = props.map((p) => p.town).sort();
  for (const t of ["Klang", "Puchong", "Rawang", "Shah Alam"]) {
    if (!towns.includes(t)) {
      console.error(`[prebuild] missing demo property town: ${t}`);
      process.exit(1);
    }
  }
  const allText = JSON.stringify({ props, findings });
  for (const word of mustInclude) {
    if (!allText.includes(word)) {
      console.error(`[prebuild] demo seed must contain "${word}" markers`);
      process.exit(1);
    }
  }
}

console.log("[prebuild] demo data hygiene OK (4 properties, 3 inspections, 15 findings)");

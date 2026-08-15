/**
 * Pre-bundles the Netlify Functions into self-contained ESM files.
 *
 * The functions share code with the site (src/lib/geo.ts, src/lib/services.ts).
 * Letting Netlify's own bundler follow those cross-directory imports has been
 * fragile, so we bundle them here with esbuild — the same tool Netlify uses —
 * and hand it finished files with no imports to resolve.
 *
 * Output goes to netlify/dist-functions, which is what netlify.toml points at.
 */
import { build } from "esbuild";
import { readdirSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const SRC = "netlify/functions";
const OUT = "netlify/dist-functions";

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const entries = readdirSync(SRC)
  .filter((f) => f.endsWith(".mts") || f.endsWith(".ts"))
  .map((f) => join(SRC, f));

if (entries.length === 0) {
  console.error("No functions found in", SRC);
  process.exit(1);
}

await build({
  entryPoints: entries,
  outdir: OUT,
  outExtension: { ".js": ".mjs" },
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  // Provided by the Netlify runtime — must stay external.
  external: ["@netlify/functions", "@netlify/blobs"],
  logLevel: "info",
});

console.log(`Bundled ${entries.length} function(s) into ${OUT}`);

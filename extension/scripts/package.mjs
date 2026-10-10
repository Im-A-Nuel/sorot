/**
 * Builds the extension against a deployed Sorot app and zips it for a GitHub release.
 *
 *   pnpm --filter extension package -- --api https://your-app.vercel.app/api
 *
 * The zip holds the built folder. Users unzip it and use "Load unpacked" in chrome://extensions.
 * It is also what a Chrome Web Store upload expects (a zip with manifest.json at the top level).
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync } from "fflate";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const flag = (name) => {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : undefined;
};

const api = flag("--api");
if (!api) {
  console.error("Pass --api <url>, for example: --api https://your-app.vercel.app/api");
  console.error("A package without an API would only run the demo matcher, so it is refused.");
  process.exit(1);
}
try {
  const u = new URL(api);
  if (u.protocol !== "https:" && u.hostname !== "localhost") throw new Error("not https");
} catch {
  console.error("--api must be an https URL (or localhost for a local test).");
  process.exit(1);
}

const outDir = process.env.OUT_DIR ?? "dist-release";
const buildArgs = ["scripts/build.mjs", "--api", api];
const app = flag("--app");
if (app) buildArgs.push("--app", app);

execFileSync(process.execPath, buildArgs, { cwd: root, stdio: "inherit", env: { ...process.env, OUT_DIR: outDir } });
execFileSync(process.execPath, ["scripts/check-dist.mjs"], { cwd: root, stdio: "inherit", env: { ...process.env, OUT_DIR: outDir } });

const dist = resolve(root, outDir);
const files = {};
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else files[relative(dist, full).split("\\").join("/")] = new Uint8Array(readFileSync(full));
  }
})(dist);

const manifest = JSON.parse(readFileSync(join(dist, "manifest.json"), "utf8"));
const releaseDir = resolve(root, "release");
rmSync(releaseDir, { recursive: true, force: true });
mkdirSync(releaseDir, { recursive: true });
const zipPath = join(releaseDir, `sorot-extension-v${manifest.version}.zip`);
writeFileSync(zipPath, zipSync(files, { level: 9 }));

console.log(`\nPackaged ${Object.keys(files).length} files -> ${zipPath}`);
console.log(`API: ${api}`);
console.log(`Host access: ${manifest.host_permissions.join(", ")}`);

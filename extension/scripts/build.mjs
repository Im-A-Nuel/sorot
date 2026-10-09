import { build } from "vite";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, process.env.OUT_DIR ?? "dist");
const watch = process.argv.includes("--watch");

const appUrl = process.env.VITE_APP_URL ?? "http://localhost:3000";
const apiUrl = process.env.VITE_API_URL ?? "";

const define = {
  __APP_URL__: JSON.stringify(appUrl),
  __API_URL__: JSON.stringify(apiUrl),
};

const common = {
  configFile: false,
  root,
  publicDir: false,
  logLevel: "warn",
  define,
};

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

// The content script is one self-contained file. Content scripts cannot use ES module imports.
await build({
  ...common,
  build: {
    outDir: dist,
    emptyOutDir: false,
    target: "chrome120",
    watch: watch ? {} : null,
    lib: { entry: resolve(root, "src/content/index.ts"), formats: ["iife"], name: "SorotContent", fileName: () => "content.js" },
  },
});

await build({
  ...common,
  build: {
    outDir: dist,
    emptyOutDir: false,
    target: "chrome120",
    watch: watch ? {} : null,
    lib: { entry: resolve(root, "src/background/index.ts"), formats: ["es"], fileName: () => "background.js" },
  },
});

await build({
  ...common,
  root: resolve(root, "src/popup"),
  base: "./",
  build: {
    outDir: resolve(dist, "popup"),
    emptyOutDir: false,
    target: "chrome120",
    watch: watch ? {} : null,
    rollupOptions: { input: resolve(root, "src/popup/popup.html") },
  },
});

cpSync(resolve(root, "public/icons"), resolve(dist, "icons"), { recursive: true });

// Host access is x.com plus the Sorot backend, nothing else.
const manifest = JSON.parse(readFileSync(resolve(root, "manifest.template.json"), "utf8"));
if (apiUrl) manifest.host_permissions.push(`${new URL(apiUrl).origin}/*`);
writeFileSync(resolve(dist, "manifest.json"), JSON.stringify(manifest, null, 2));

console.log(`Built extension to ${dist}`);
console.log(apiUrl ? `Backend: ${apiUrl}` : "Backend: none (demo matching)");

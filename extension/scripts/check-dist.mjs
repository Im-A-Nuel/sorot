import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Definition of done: the Panta API key and Panta's API host never appear in the extension bundle. */
const dist = resolve(dirname(fileURLToPath(import.meta.url)), "..", process.env.OUT_DIR ?? "dist");

const forbidden = [
  { label: "PANTA_API_KEY", re: /PANTA_API_KEY/ },
  { label: "pk_live_ or pk_test_ key", re: /pk_(live|test)_[A-Za-z0-9]/ },
  { label: "X-Api-Key header", re: /x-api-key/i },
  { label: "Panta API host", re: /live-api\.panta\.market/ },
];

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? files(full) : [full];
  });
}

let bad = 0;
for (const file of files(dist)) {
  if (/\.(png|ico)$/.test(file)) continue;
  const text = readFileSync(file, "utf8");
  for (const { label, re } of forbidden) {
    if (re.test(text)) {
      console.error(`FAIL ${label} found in ${file}`);
      bad++;
    }
  }
}

if (bad > 0) process.exit(1);
console.log("dist check passed: no Panta key or API host in the bundle");

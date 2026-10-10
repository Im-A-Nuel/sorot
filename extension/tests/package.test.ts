import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { unzipSync } from "fflate";

const root = fileURLToPath(new URL("..", import.meta.url));
const script = fileURLToPath(new URL("../scripts/package.mjs", import.meta.url));

function run(args: string[]) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, OUT_DIR: "dist-package-test" },
  });
}

describe("package script", () => {
  it("refuses to package without an API, because that would ship the demo matcher", () => {
    const r = run([]);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /--api/);
  });

  it("refuses a plain http API that is not localhost", () => {
    const r = run(["--api", "http://example.com/api"]);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /https/);
  });

  it("builds a zip with manifest.json at the top level and the API origin as the only extra host", () => {
    const r = run(["--api", "https://sorot.example.com/api"]);
    assert.equal(r.status, 0, r.stderr + r.stdout);
    const zip = join("release", "sorot-extension-v0.1.0.zip");
    const path = fileURLToPath(new URL(`../${zip.replace(/\\/g, "/")}`, import.meta.url));
    assert.ok(existsSync(path), "zip was not written");

    const files = unzipSync(new Uint8Array(readFileSync(path)));
    assert.ok(files["manifest.json"], "manifest.json is not at the top level");
    for (const f of ["content.js", "background.js", "popup/popup.html", "icons/icon-128.png"]) assert.ok(files[f], `${f} is missing`);

    const manifest = JSON.parse(new TextDecoder().decode(files["manifest.json"]));
    assert.deepEqual(manifest.host_permissions, ["https://x.com/*", "https://sorot.example.com/*"]);
    assert.deepEqual(manifest.permissions, ["storage"]);

    const bg = new TextDecoder().decode(files["background.js"]);
    assert.ok(bg.includes("https://sorot.example.com/api"), "the API url is not baked into the build");
    assert.ok(!/pk_(live|test)_/.test(bg) && !/x-api-key/i.test(bg), "a Panta key or header leaked into the bundle");
  });
});

import { join } from "node:path";

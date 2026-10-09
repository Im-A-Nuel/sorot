import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const script = fileURLToPath(new URL("../scripts/panta-setup.ts", import.meta.url));
const SECRET = "pk_test_abcdef0123456789abcdef0123456789";
const PASSWORD = "correct-horse-battery";

type Seen = { method: string; url: string; headers: IncomingMessage["headers"]; body: Record<string, unknown> };

async function withPanta(
  handler: (req: Seen, res: ServerResponse) => void,
  run: (base: string, seen: Seen[]) => Promise<void>,
) {
  const seen: Seen[] = [];
  const server = createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const entry: Seen = { method: req.method ?? "", url: req.url ?? "", headers: req.headers, body: raw ? JSON.parse(raw) : {} };
      seen.push(entry);
      handler(entry, res);
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  try {
    await run(`http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`, seen);
  } finally {
    await new Promise((r) => server.close(r));
  }
}

const reply = (res: ServerResponse, status: number, body: unknown) => {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
};

function happy(emailTaken = false) {
  return (req: Seen, res: ServerResponse) => {
    if (req.url === "/api/v1/auth/register/") {
      return emailTaken ? reply(res, 409, { code: "EMAIL_TAKEN" }) : reply(res, 201, { userId: "usr_new1", access: "jwt-a", refresh: "jwt-r" });
    }
    if (req.url === "/api/v1/auth/token/") return reply(res, 200, { userId: "usr_old1", access: "jwt-b", refresh: "jwt-r" });
    if (req.url === "/api/v1/account/keys/") return reply(res, 201, { secret: SECRET, id: "key_1" });
    if (req.url === "/api/v1/account/") return reply(res, 200, { userId: "usr_abc123", status: "active", canCreateMarkets: true, apiKeyId: "key_1" });
    reply(res, 404, {});
  };
}

/** Runs the script as a child process. It must be async: the mock Panta server lives in this same process. */
function exec(args: string[], stdin: string): Promise<{ status: number | null; stdout: string; stderr: string }> {
  return new Promise((done) => {
    const child = spawn(process.execPath, args, { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("close", (status) => done({ status, stdout, stderr }));
    child.stdin.end(stdin);
  });
}

async function run(base: string, args: string[] = [], stdin = PASSWORD) {
  const dir = mkdtempSync(join(tmpdir(), "sorot-setup-"));
  const envFile = join(dir, ".env");
  const r = await exec(
    [script, "--base", base, "--dotenv", envFile, "--email", "me@example.com", "--password-stdin", ...args],
    stdin,
  );
  return { ...r, envFile, read: () => readFileSync(envFile, "utf8") };
}

describe("panta-setup script", () => {
  it("registers, mints a key, and writes .env without printing the secret or password", async () => {
    await withPanta(happy(), async (base, seen) => {
      const r = await run(base);
      assert.equal(r.status, 0, r.stderr + r.stdout);
      const env = r.read();
      assert.match(env, new RegExp(`^PANTA_API_KEY=${SECRET}$`, "m"));
      assert.match(env, /^PANTA_ATTRIBUTION_ID=usr_abc123$/m);
      assert.ok(!r.stdout.includes(SECRET) && !r.stderr.includes(SECRET), "secret was printed");
      assert.ok(!r.stdout.includes(PASSWORD) && !r.stderr.includes(PASSWORD), "password was printed");

      assert.deepEqual(seen.map((s) => s.url), ["/api/v1/auth/register/", "/api/v1/account/keys/", "/api/v1/account/"]);
      assert.deepEqual(seen[0].body, { email: "me@example.com", password: PASSWORD });
      assert.equal(seen[1].headers.authorization, "Bearer jwt-a");
      assert.deepEqual(seen[1].body, { env: "test", name: "sorot" });
      assert.equal(seen[2].headers["x-api-key"], SECRET);
    });
  });

  it("logs in when the email is already registered", async () => {
    await withPanta(happy(true), async (base, seen) => {
      const r = await run(base, ["--env", "live"]);
      assert.equal(r.status, 0, r.stderr + r.stdout);
      assert.deepEqual(seen.map((s) => s.url), ["/api/v1/auth/register/", "/api/v1/auth/token/", "/api/v1/account/keys/", "/api/v1/account/"]);
      assert.equal(seen[2].headers.authorization, "Bearer jwt-b");
      assert.deepEqual(seen[2].body, { env: "live", name: "sorot" });
    });
  });

  it("stops on a wrong password and writes nothing", async () => {
    await withPanta(
      (req, res) => (req.url.includes("register") ? reply(res, 409, { code: "EMAIL_TAKEN" }) : reply(res, 401, { code: "UNAUTHORIZED" })),
      async (base) => {
        const r = await run(base);
        assert.notEqual(r.status, 0);
        assert.match(r.stderr, /Wrong email or password/);
        assert.throws(() => r.read());
      },
    );
  });

  it("writes nothing when the key cannot be created or does not work", async () => {
    await withPanta(
      (req, res) => (req.url.includes("keys") ? reply(res, 403, { code: "FORBIDDEN" }) : happy()(req, res)),
      async (base) => {
        const r = await run(base);
        assert.notEqual(r.status, 0);
        assert.throws(() => r.read());
      },
    );
    await withPanta(
      (req, res) => (req.url === "/api/v1/account/" ? reply(res, 401, {}) : happy()(req, res)),
      async (base) => {
        const r = await run(base);
        assert.notEqual(r.status, 0);
        assert.match(r.stderr, /rejected/);
        assert.throws(() => r.read());
      },
    );
  });

  it("refuses a short password before calling Panta", async () => {
    await withPanta(happy(), async (base, seen) => {
      const r = await run(base, [], "short");
      assert.notEqual(r.status, 0);
      assert.equal(seen.length, 0);
    });
  });

  it("does not mint another key when .env already has one, unless --force", async () => {
    await withPanta(happy(), async (base, seen) => {
      const dir = mkdtempSync(join(tmpdir(), "sorot-setup-"));
      const envFile = join(dir, ".env");
      writeFileSync(envFile, "PANTA_API_KEY=pk_live_existingkey1234567890\nOTHER=keep\n");
      const args = [script, "--base", base, "--dotenv", envFile, "--email", "me@example.com", "--password-stdin"];
      const first = await exec(args, PASSWORD);
      assert.equal(first.status, 0);
      assert.equal(seen.length, 0);
      assert.match(readFileSync(envFile, "utf8"), /pk_live_existingkey1234567890/);

      const forced = await exec([...args, "--force"], PASSWORD);
      assert.equal(forced.status, 0, forced.stderr);
      const env = readFileSync(envFile, "utf8");
      assert.match(env, new RegExp(`PANTA_API_KEY=${SECRET}`));
      assert.match(env, /^OTHER=keep$/m);
    });
  });
});

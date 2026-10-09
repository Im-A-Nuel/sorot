/**
 * Creates a Panta account (or logs in), mints an API key, and writes it to the repo's .env.
 * Run it yourself in a terminal: the password and the key never leave your machine except to Panta.
 *
 *   pnpm panta:setup
 *   pnpm panta:setup -- --env live --email you@example.com
 *
 * Flow, from the Panta docs:
 *   POST /auth/register/   {email, password, name?}  -> access JWT        (409 EMAIL_TAKEN: log in instead)
 *   POST /auth/token/      {email, password}          -> access JWT
 *   POST /account/keys/    {env, name}  + Bearer      -> one-time secret pk_test_... or pk_live_...
 *   GET  /account/         + X-Api-Key                -> userId (usr_...), used as the attribution id
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PANTA_BASE_URL } from "../src/panta/routes.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : undefined;
}
const has = (name: string) => process.argv.includes(name);

const base = (flag("--base") ?? process.env.PANTA_API_BASE ?? PANTA_BASE_URL).replace(/\/+$/, "");
const envPath = resolve(flag("--dotenv") ?? resolve(root, ".env"));
const keyEnv = flag("--env") ?? "test";
const keyName = flag("--key-name") ?? "sorot";

function fail(message: string): never {
  console.error(`\n${message}`);
  process.exit(1);
}

function readEnvFile(): string {
  if (existsSync(envPath)) return readFileSync(envPath, "utf8");
  const example = resolve(root, ".env.example");
  return existsSync(example) ? readFileSync(example, "utf8") : "";
}

function getVar(content: string, key: string): string {
  const m = new RegExp(`^${key}=(.*)$`, "m").exec(content);
  return m ? m[1].trim() : "";
}

function setVar(content: string, key: string, value: string): string {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(content)) return content.replace(re, () => line);
  return content.replace(/\s*$/, "\n") + line + "\n";
}

async function ask(question: string): Promise<string> {
  process.stdout.write(question);
  return new Promise((done) => {
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdin.once("data", (d) => {
      process.stdin.pause();
      done(String(d).trim());
    });
  });
}

/** Reads a line without echoing it, so the password is not shown or saved in terminal history. */
async function askHidden(question: string): Promise<string> {
  process.stdout.write(question);
  const stdin = process.stdin;
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");
  return new Promise((done) => {
    let value = "";
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          process.stdout.write("\n");
          done(value);
          return;
        }
        if (ch === "\u0003") {
          process.stdout.write("\n");
          process.exit(130);
        }
        if (ch === "\u007f" || ch === "\b") value = value.slice(0, -1);
        else value += ch;
      }
    };
    stdin.on("data", onData);
  });
}

async function readStdin(): Promise<string> {
  let data = "";
  for await (const chunk of process.stdin) data += chunk;
  return data.replace(/\r?\n$/, "");
}

type Json = Record<string, unknown>;

async function call(path: string, init: { method?: string; body?: unknown; headers?: Record<string, string> } = {}) {
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      method: init.method ?? "GET",
      headers: { accept: "application/json", ...(init.body ? { "content-type": "application/json" } : {}), ...init.headers },
      body: init.body ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    fail(`Could not reach Panta at ${base}. Check your connection.`);
  }
  const text = await res.text();
  let json: Json = {};
  try {
    json = text ? (JSON.parse(text) as Json) : {};
  } catch {
    json = {};
  }
  return { status: res.status, json };
}

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const errorCode = (j: Json): string => str(j.code) || str((j.error as Json | undefined)?.code);
const mask = (secret: string) => `${secret.slice(0, 8)}…${secret.slice(-4)}`;

// ------------------------------------------------------------------ main
if (!["test", "live"].includes(keyEnv)) fail('--env must be "test" or "live".');

const existing = getVar(readEnvFile(), "PANTA_API_KEY");
if (existing && !has("--force")) {
  console.log(`.env already has PANTA_API_KEY (${mask(existing)}). Nothing to do.`);
  console.log("Run again with --force to mint a new key and replace it.");
  process.exit(0);
}

console.log(`Panta: ${base}`);
const email = flag("--email") ?? (process.stdin.isTTY ? await ask("Email: ") : fail("Pass --email."));
if (!email) fail("An email is required.");

let password: string;
if (has("--password-stdin")) password = await readStdin();
else if (process.stdin.isTTY) password = await askHidden("Password (hidden, 8+ characters): ");
else fail("No terminal to read a password from. Run this in a normal terminal, or use --password-stdin.");
if (password.length < 8) fail("Panta needs a password of at least 8 characters.");

let access = "";
let userId = "";

const reg = await call("/auth/register/", { method: "POST", body: { email, password, ...(flag("--name") ? { name: flag("--name") } : {}) } });
if (reg.status === 201 || reg.status === 200) {
  access = str(reg.json.access);
  userId = str(reg.json.userId);
  console.log("Account created.");
} else if (reg.status === 409 && errorCode(reg.json) === "EMAIL_TAKEN") {
  console.log("That email already has an account. Logging in.");
  const login = await call("/auth/token/", { method: "POST", body: { email, password } });
  if (login.status === 401) fail("Wrong email or password, or the account is suspended.");
  if (login.status !== 200) fail(`Login failed with ${login.status} ${errorCode(login.json)}.`);
  access = str(login.json.access);
  userId = str(login.json.userId);
} else {
  fail(`Registration failed with ${reg.status} ${errorCode(reg.json)}. ${str(reg.json.message)}`.trim());
}
if (!access) fail("Panta did not return an access token.");

const created = await call("/account/keys/", {
  method: "POST",
  body: { env: keyEnv, name: keyName },
  headers: { authorization: `Bearer ${access}` },
});
const secret = str(created.json.secret) || str(created.json.key);
if (created.status >= 300 || !/^pk_(test|live)_/.test(secret)) {
  fail(`Could not create an API key (${created.status} ${errorCode(created.json)}). Nothing was written to .env.`);
}

// Confirm the key works and read the account's userId, which Sorot uses as its attribution id.
const who = await call("/account/", { headers: { "x-api-key": secret } });
if (who.status !== 200) fail(`The new key was rejected by /account/ (${who.status}). Nothing was written to .env.`);
userId = str(who.json.userId) || userId;
if (str(who.json.status) && who.json.status !== "active") fail(`The account is ${String(who.json.status)}. Nothing was written to .env.`);

let content = readEnvFile();
content = setVar(content, "PANTA_API_KEY", secret);
if (userId) content = setVar(content, "PANTA_ATTRIBUTION_ID", userId);
if (!getVar(content, "PANTA_API_BASE")) content = setVar(content, "PANTA_API_BASE", PANTA_BASE_URL);
writeFileSync(envPath, content);

console.log(`\nDone. Wrote ${envPath}`);
console.log(`  PANTA_API_KEY          ${mask(secret)}  (${keyEnv} key, shown only once by Panta)`);
console.log(`  PANTA_ATTRIBUTION_ID   ${userId || "(not returned)"}`);
if (who.json.canCreateMarkets === false) console.log("  Note: this account cannot create markets, which Sorot does not need.");
console.log("\nNext: pnpm --filter @sorot/core probe   (prints the real response shapes)");

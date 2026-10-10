/**
 * Browser test. Needs Google Chrome installed, and a dev server started with fixtures:
 *   PANTA_FORCE_FIXTURES=1 pnpm dev      then open each page once so the first compile is done
 */
import { chromium } from "playwright-core";
import fs from "node:fs";

const axeSrc = fs.readFileSync("node_modules/axe-core/axe.min.js", "utf8");
// Screenshots go to a folder git ignores.
fs.mkdirSync("tests/.screenshots", { recursive: true });
process.chdir("tests/.screenshots");
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const WALLET = "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin";
const BLOCKHASH = "4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi5";
const SIG = "5VERv8NMvzbJMEkV8xnXk2VoDZ8dQYKzy8cxEHjD4Tw6F4pzy8xiLSNvQ9QP3Lp7Z3dKx5mDq2v1WcYb9aRTsEfH";

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log((ok ? "PASS " : "FAIL ") + name + (!ok && extra ? "  " + extra : ""));
};

const browser = await chromium.launch({ channel: "chrome", headless: true });

async function open({ reject = false, rpcError = false, confirmAfter = 2 } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 420, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push(m.text()));

  await page.addInitScript(({ wallet, sig, reject }) => {
    const provider = {
      isPhantom: true,
      publicKey: null,
      async connect() { provider.publicKey = { toString: () => wallet }; return { publicKey: provider.publicKey }; },
      async disconnect() { provider.publicKey = null; },
      async signAndSendTransaction(tx) {
        if (reject) { const e = new Error("User rejected"); e.code = 4001; throw e; }
        const m = tx.message;
        window.__sent = {
          version: tx.version,
          payer: m.staticAccountKeys[0].toBase58(),
          blockhash: m.recentBlockhash,
          signers: m.header.numRequiredSignatures,
          instructions: m.compiledInstructions.map((ix) => ({
            program: m.staticAccountKeys[ix.programIdIndex].toBase58(),
            data: new TextDecoder().decode(ix.data),
            accounts: ix.accountKeyIndexes.map((i) => m.staticAccountKeys[i].toBase58()),
          })),
        };
        return { signature: sig };
      },
      on() {}, off() {},
    };
    window.phantom = { solana: provider };
  }, { wallet: WALLET, sig: SIG, reject });

  let statusCalls = 0;
  const rpcCalls = [];
  await page.route("https://api.devnet.solana.com/**", async (route) => {
    const body = JSON.parse(route.request().postData() || "{}");
    rpcCalls.push(body.method);
    const reply = (result) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ jsonrpc: "2.0", id: 1, result }) });
    if (rpcError) return route.fulfill({ contentType: "application/json", body: JSON.stringify({ jsonrpc: "2.0", id: 1, error: { code: -32005, message: "Node is unhealthy" } }) });
    if (body.method === "getLatestBlockhash") return reply({ context: { slot: 1 }, value: { blockhash: BLOCKHASH, lastValidBlockHeight: 999 } });
    if (body.method === "getSignatureStatuses") {
      statusCalls++;
      return reply({ context: { slot: 2 }, value: [statusCalls >= confirmAfter ? { slot: 2, confirmations: 1, err: null, confirmationStatus: "confirmed" } : null] });
    }
    return route.fulfill({ status: 404, body: "{}" });
  });
  return { ctx, page, errors, rpcCalls };
}

// 1. happy path
{
  const { ctx, page, errors, rpcCalls } = await open();
  await page.goto(BASE + "/dev/wallet-check", { waitUntil: "load", timeout: 120000 });
  await page.getByRole("heading", { name: "Wallet check" }).waitFor();
  check("send button is disabled until a wallet is connected", await page.getByRole("button", { name: "Connect Phantom first" }).isDisabled());
  await page.getByRole("button", { name: "Connect Phantom" }).first().click();
  const send = page.getByRole("button", { name: "Send a devnet memo" });
  await send.waitFor();
  let enabled = false;
  for (let i = 0; i < 20 && !enabled; i++) {
    enabled = await send.isEnabled();
    if (!enabled) await page.waitForTimeout(150);
  }
  check("send button is enabled after connecting", enabled);

  await page.addScriptTag({ content: axeSrc });
  const axe = await page.evaluate(async () => window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21aa", "best-practice"] }));
  check("axe: no violations", axe.violations.length === 0, axe.violations.map((v) => v.id).join(","));

  await send.click();
  await page.getByText("Done: Devnet confirms it").waitFor({ timeout: 20000 });
  const sent = await page.evaluate(() => window.__sent);
  check("a versioned (v0) transaction is handed to Phantom", sent?.version === 0, JSON.stringify(sent?.version));
  check("the connected wallet is the fee payer and the only signer", sent?.payer === WALLET && sent?.signers === 1, JSON.stringify([sent?.payer, sent?.signers]));
  check("it uses the blockhash devnet returned", sent?.blockhash === BLOCKHASH);
  check("it holds exactly one Memo instruction", sent?.instructions.length === 1 && sent.instructions[0].program === "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr", JSON.stringify(sent?.instructions?.map((i) => i.program)));
  check("the memo text survives base64 and compile", /^sorot wallet check \d{4}-/.test(sent?.instructions[0]?.data ?? ""), sent?.instructions[0]?.data);
  check("the memo is signed by the wallet only", JSON.stringify(sent?.instructions[0]?.accounts) === JSON.stringify([WALLET]));
  check("the explorer link points at devnet and the signature", (await page.getByRole("link", { name: /Solana Explorer/ }).getAttribute("href")) === `https://explorer.solana.com/tx/${SIG}?cluster=devnet`);
  check("confirmation was polled until confirmed", rpcCalls.filter((m) => m === "getSignatureStatuses").length >= 2, rpcCalls.join(","));
  check("no console errors", errors.length === 0, errors.join(" | "));
  await ctx.close();
}

// 2. the wallet declines
{
  const { ctx, page } = await open({ reject: true });
  await page.goto(BASE + "/dev/wallet-check", { waitUntil: "load" });
  await page.getByRole("button", { name: "Connect Phantom" }).first().click();
  await page.getByRole("button", { name: "Send a devnet memo" }).click();
  await page.getByText("You declined the request in Phantom.").waitFor({ timeout: 15000 });
  check("a declined request is reported as such, and nothing was sent", (await page.evaluate(() => window.__sent)) === undefined);
  check("the button works again after a failure", await page.getByRole("button", { name: "Send a devnet memo" }).isEnabled());
  await ctx.close();
}

// 3. devnet RPC is down
{
  const { ctx, page } = await open({ rpcError: true });
  await page.goto(BASE + "/dev/wallet-check", { waitUntil: "load" });
  await page.getByRole("button", { name: "Connect Phantom" }).first().click();
  await page.getByRole("button", { name: "Send a devnet memo" }).click();
  await page.getByText("Node is unhealthy").waitFor({ timeout: 15000 });
  check("an RPC error is shown and Phantom is never asked to sign", (await page.evaluate(() => window.__sent)) === undefined);
  await ctx.close();
}

await browser.close();
const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);

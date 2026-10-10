"use client";

import { useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { WalletButton } from "@/components/app/WalletButton";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { ExternalIcon } from "@/components/ui/Icons";
import { isApiError } from "@/lib/api/types";
import { approveInWallet, usePhantom } from "@/lib/wallet/phantom";

/**
 * Proves the Phantom signing path without Panta and without real money.
 * It builds a Memo transaction in the same instruction format Panta returns, and sends it through the same
 * `approveInWallet` that real trades use. Phantom must be in Testnet Mode on Solana Devnet. Devnet SOL is free.
 */

const DEVNET_RPC = process.env.NEXT_PUBLIC_DEVNET_RPC || "https://api.devnet.solana.com";
const MEMO_PROGRAM = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";

type Step = { label: string; state: "idle" | "running" | "done" | "failed"; detail?: string };

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(DEVNET_RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`Devnet RPC answered ${res.status}.`);
  const json = (await res.json()) as { result?: T; error?: { message: string } };
  if (json.error) throw new Error(json.error.message);
  return json.result as T;
}

const toBase64 = (text: string) => btoa(String.fromCharCode(...new TextEncoder().encode(text)));

export function WalletCheck() {
  const wallet = usePhantom();
  const [steps, setSteps] = useState<Step[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  function update(i: number, patch: Partial<Step>) {
    setSteps((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  }

  async function run() {
    if (!wallet.address) return;
    setRunning(true);
    setSignature(null);
    setSteps([
      { label: "Get a devnet blockhash", state: "running" },
      { label: "Phantom signs and sends the transaction", state: "idle" },
      { label: "Devnet confirms it", state: "idle" },
    ]);
    let step = 0;
    try {
      const bh = await rpc<{ value: { blockhash: string; lastValidBlockHeight: number } }>("getLatestBlockhash", [{ commitment: "confirmed" }]);
      update(0, { state: "done", detail: bh.value.blockhash.slice(0, 12) + "…" });

      step = 1;
      update(1, { state: "running", detail: "Look at the Phantom popup. It should show only a Memo and no balance changes." });
      const sig = await approveInWallet({
        label: "devnet wallet check",
        demo: false,
        wallet: wallet.address,
        built: {
          quoteId: "devnet-check",
          recentBlockhash: bh.value.blockhash,
          instructions: [
            {
              programId: MEMO_PROGRAM,
              data: toBase64(`sorot wallet check ${new Date().toISOString()}`),
              accounts: [{ pubkey: wallet.address, isSigner: true, isWritable: false }],
            },
          ],
        },
      });
      setSignature(sig);
      update(1, { state: "done", detail: sig.slice(0, 12) + "…" });

      step = 2;
      update(2, { state: "running" });
      for (let i = 0; i < 20; i++) {
        const res = await rpc<{ value: ({ confirmationStatus?: string; err: unknown } | null)[] }>("getSignatureStatuses", [[sig], { searchTransactionHistory: true }]);
        const status = res.value[0];
        if (status?.err) throw new Error("The transaction was rejected by the network.");
        if (status && (status.confirmationStatus === "confirmed" || status.confirmationStatus === "finalized")) {
          update(2, { state: "done", detail: status.confirmationStatus });
          setRunning(false);
          return;
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
      throw new Error("Not confirmed after 30 seconds. Check the explorer link.");
    } catch (e) {
      const message = isApiError(e) ? e.message : e instanceof Error ? e.message : "Something went wrong.";
      update(step, { state: "failed", detail: message });
    }
    setRunning(false);
  }

  const connected = wallet.status === "connected";

  return (
    <AppShell wallet={<WalletButton wallet={wallet} />} width="narrow">
      <div className="space-y-4">
        <h1 className="text-[26px] font-semibold tracking-[-0.025em]">Wallet check</h1>
        <p className="text-[15px] leading-relaxed text-muted">
          Tests the same signing code real trades use, with a free Memo transaction on Solana devnet. No Panta, no USDC, no real money.
        </p>

        <Notice tone="info" title="Before you run it">
          <ol className="mt-1 list-decimal space-y-1 pl-5">
            <li>In Phantom, open Settings, Developer Settings, and turn on Testnet Mode. Choose Solana Devnet.</li>
            <li>
              Get free devnet SOL at{" "}
              <a className="font-semibold underline" href="https://faucet.solana.com" target="_blank" rel="noopener noreferrer">
                faucet.solana.com
              </a>
              .
            </li>
            <li>Connect Phantom above, then press the button.</li>
          </ol>
        </Notice>

        <Button size="lg" className="w-full" disabled={!connected} loading={running} onClick={() => void run()}>
          {connected ? "Send a devnet memo" : "Connect Phantom first"}
        </Button>

        {steps.length > 0 && (
          <ol className="surface space-y-3 p-5" aria-live="polite" aria-label="Check progress">
            {steps.map((s) => (
              <li key={s.label} className="text-[14.5px]">
                <span className={s.state === "failed" ? "font-semibold text-danger" : s.state === "done" ? "font-semibold" : ""}>
                  {s.state === "done" ? "Done: " : s.state === "failed" ? "Failed: " : s.state === "running" ? "Working: " : ""}
                  {s.label}
                </span>
                {s.detail && <span className="mt-0.5 block break-words text-[13px] text-muted">{s.detail}</span>}
              </li>
            ))}
          </ol>
        )}

        {signature && (
          <a
            href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[14px] font-semibold underline"
          >
            View on Solana Explorer (devnet)
            <ExternalIcon />
          </a>
        )}
      </div>
    </AppShell>
  );
}

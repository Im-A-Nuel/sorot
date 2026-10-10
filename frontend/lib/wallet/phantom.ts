"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, isApiError, type BuiltTransaction } from "@/lib/api/types";

/**
 * Minimal Phantom integration through the injected provider. No private keys are ever read or stored here.
 * Phantom injects into normal web pages, which is why signing lives on the hosted pages and not in the extension.
 */

type PublicKeyLike = { toString(): string };

export type PhantomProvider = {
  isPhantom?: boolean;
  publicKey?: PublicKeyLike | null;
  connect(opts?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: PublicKeyLike }>;
  disconnect(): Promise<void>;
  signMessage?(message: Uint8Array, display?: "utf8" | "hex"): Promise<{ signature: Uint8Array }>;
  signAndSendTransaction?(transaction: unknown): Promise<{ signature: string }>;
  on?(event: string, handler: (...args: unknown[]) => void): void;
  off?(event: string, handler: (...args: unknown[]) => void): void;
};

declare global {
  interface Window {
    phantom?: { solana?: PhantomProvider };
    solana?: PhantomProvider;
  }
}

export function getPhantom(): PhantomProvider | null {
  if (typeof window === "undefined") return null;
  const injected = window.phantom?.solana ?? window.solana;
  return injected?.isPhantom ? injected : null;
}

export type WalletStatus = "checking" | "unavailable" | "disconnected" | "connecting" | "connected";

export type WalletState = {
  status: WalletStatus;
  address: string | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
};

const REJECTED = 4001;

function isRejected(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === REJECTED;
}

export function usePhantom(): WalletState {
  const [status, setStatus] = useState<WalletStatus>("checking");
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const provider = useRef<PhantomProvider | null>(null);

  useEffect(() => {
    // Phantom can inject a moment after hydration, so look once now and once shortly after.
    let cancelled = false;

    async function init() {
      const p = getPhantom();
      provider.current = p;
      if (!p) {
        setStatus("unavailable");
        return;
      }
      setStatus("disconnected");
      try {
        const res = await p.connect({ onlyIfTrusted: true });
        if (cancelled) return;
        setAddress(res.publicKey.toString());
        setStatus("connected");
      } catch {
        // Not trusted yet. The user connects with the button.
      }
    }

    const first = setTimeout(init, 0);
    const retry = setTimeout(() => {
      if (!provider.current) void init();
    }, 800);

    const onDisconnect = () => {
      setAddress(null);
      setStatus("disconnected");
    };
    const onAccountChanged = (key: unknown) => {
      if (key && typeof (key as PublicKeyLike).toString === "function") {
        setAddress((key as PublicKeyLike).toString());
        setStatus("connected");
      } else {
        onDisconnect();
      }
    };
    const p = getPhantom();
    p?.on?.("disconnect", onDisconnect);
    p?.on?.("accountChanged", onAccountChanged);

    return () => {
      cancelled = true;
      clearTimeout(first);
      clearTimeout(retry);
      p?.off?.("disconnect", onDisconnect);
      p?.off?.("accountChanged", onAccountChanged);
    };
  }, []);

  const connect = useCallback(async () => {
    const p = getPhantom();
    provider.current = p;
    if (!p) {
      setStatus("unavailable");
      return;
    }
    setError(null);
    setStatus("connecting");
    try {
      const res = await p.connect();
      setAddress(res.publicKey.toString());
      setStatus("connected");
    } catch (err) {
      setStatus("disconnected");
      setError(
        isRejected(err)
          ? "Connection request was declined in Phantom."
          : "Could not connect to Phantom. Try again.",
      );
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await provider.current?.disconnect();
    } finally {
      setAddress(null);
      setStatus("disconnected");
    }
  }, []);

  return { status, address, error, connect, disconnect };
}

type PantaInstruction = {
  programId: string;
  data: string;
  accounts: { pubkey: string; isSigner: boolean; isWritable: boolean }[];
};

function isInstruction(v: unknown): v is PantaInstruction {
  const o = v as PantaInstruction;
  return (
    typeof o === "object" &&
    o !== null &&
    typeof o.programId === "string" &&
    typeof o.data === "string" &&
    Array.isArray(o.accounts)
  );
}

function fromBase64(b64: string): Uint8Array {
  const raw = atob(b64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/**
 * Compiles Panta's instructions into a versioned transaction and has Phantom sign and send it.
 * UNVERIFIED against live Panta: the instruction shape follows the Panta docs, but it has not run with a real key.
 */
async function signAndSendLive(p: PhantomProvider, built: BuiltTransaction, wallet: string): Promise<string> {
  if (!p.signAndSendTransaction) {
    throw new ApiError("UNKNOWN", "This Phantom version cannot send transactions.");
  }
  if (!built.instructions.every(isInstruction)) {
    throw new ApiError("UNKNOWN", "Panta returned instructions in an unexpected format.");
  }

  const web3 = await import("@solana/web3.js");
  const payer = new web3.PublicKey(wallet);
  const instructions = built.instructions.map(
    (i) =>
      new web3.TransactionInstruction({
        programId: new web3.PublicKey(i.programId),
        keys: i.accounts.map((a) => ({
          pubkey: new web3.PublicKey(a.pubkey),
          isSigner: a.isSigner,
          isWritable: a.isWritable,
        })),
        data: fromBase64(i.data) as unknown as Buffer,
      }),
  );
  const message = new web3.TransactionMessage({
    payerKey: payer,
    recentBlockhash: built.recentBlockhash,
    instructions,
  }).compileToV0Message();

  const { signature } = await p.signAndSendTransaction(new web3.VersionedTransaction(message));
  return signature;
}

/**
 * Asks the wallet to approve an action and returns the signature.
 * Demo mode signs a harmless text message, so the real Phantom prompt and its rejection path can be tried without funds.
 * Live mode signs and sends the transaction built from Panta's instructions.
 */
export async function approveInWallet(opts: {
  label: string;
  demo: boolean;
  built: BuiltTransaction;
  wallet: string;
}): Promise<string> {
  const p = getPhantom();
  if (!p) throw new ApiError("UNKNOWN", "Phantom is not available.");

  try {
    if (!opts.demo) return await signAndSendLive(p, opts.built, opts.wallet);
    if (p.signMessage) {
      await p.signMessage(new TextEncoder().encode(`Sorot demo: ${opts.label}`), "utf8");
    }
  } catch (err) {
    if (isRejected(err)) throw new ApiError("USER_REJECTED", "You declined the request in Phantom.");
    if (isApiError(err)) throw err;
    throw new ApiError("UNKNOWN", "Phantom could not complete the request.");
  }
  return `demo-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

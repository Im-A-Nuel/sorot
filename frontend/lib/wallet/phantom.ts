"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/types";

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

/**
 * Asks the wallet to approve an action.
 * Demo mode signs a harmless text message so the real Phantom prompt and its rejection path can be tried.
 * Real mode needs the Panta instructions compiled into a transaction. TODO(backend): wire signAndSendTransaction with @solana/web3.js.
 */
export async function approveInWallet(label: string, demo: boolean): Promise<string> {
  const p = getPhantom();
  if (!p) throw new ApiError("UNKNOWN", "Phantom is not available.");

  if (!demo) {
    throw new ApiError("UNKNOWN", "Transaction signing is not connected to the backend yet.");
  }

  try {
    if (p.signMessage) {
      await p.signMessage(new TextEncoder().encode(`Sorot demo: ${label}`), "utf8");
    }
  } catch (err) {
    if (isRejected(err)) throw new ApiError("USER_REJECTED", "You declined the request in Phantom.");
    throw new ApiError("UNKNOWN", "Phantom could not sign the request.");
  }
  return `demo-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

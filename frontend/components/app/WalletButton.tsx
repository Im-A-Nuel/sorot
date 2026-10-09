"use client";

import { shortAddress } from "@/lib/api";
import type { WalletState } from "@/lib/wallet/phantom";
import { Button, buttonClasses } from "@/components/ui/Button";

/** Connect, install or account pill, depending on what Phantom reports. */
export function WalletButton({ wallet }: { wallet: WalletState }) {
  const { status, address, connect, disconnect } = wallet;

  if (status === "checking") {
    return <span className="skeleton block h-11 w-32 rounded-full" aria-hidden="true" />;
  }

  if (status === "unavailable") {
    return (
      <a
        href="https://phantom.app/download"
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClasses("secondary")}
      >
        Install Phantom
      </a>
    );
  }

  if (status === "connected" && address) {
    return (
      <div className="flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-full border border-ink/20 bg-white py-1 pl-3 pr-1 sm:pl-4">
        <span className="font-mono text-[13px] font-medium" title={address}>
          {shortAddress(address)}
        </span>
        <button
          type="button"
          onClick={() => void disconnect()}
          className="min-h-9 cursor-pointer rounded-full px-2.5 text-[13px] font-medium text-muted hover:bg-ink/[0.06]"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <Button variant="accent" loading={status === "connecting"} onClick={() => void connect()}>
      {status === "connecting" ? "Connecting" : "Connect Phantom"}
    </Button>
  );
}

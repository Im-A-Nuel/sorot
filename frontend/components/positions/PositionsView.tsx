"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, shortAddress, type ApiError, type Position } from "@/lib/api";
import { errorCopy, toApiError } from "@/lib/trade/errors";
import { usePhantom } from "@/lib/wallet/phantom";
import { AppShell } from "@/components/app/AppShell";
import { DemoBanner } from "@/components/app/DemoBanner";
import { WalletButton } from "@/components/app/WalletButton";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { PositionRow } from "./PositionRow";

type Tab = "open" | "claimable" | "resolved";

type Load =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: ApiError }
  | { status: "ready"; positions: Position[] };

const TABS: { id: Tab; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "claimable", label: "Claimable" },
  { id: "resolved", label: "Resolved" },
];

function inTab(p: Position, tab: Tab): boolean {
  if (tab === "open") return p.status === "open";
  if (tab === "claimable") return p.claimable;
  return p.status !== "open";
}

const emptyCopy: Record<Tab, string> = {
  open: "No open positions. Open a market from a tweet and your trade shows up here.",
  claimable: "Nothing to claim right now. Winnings appear here once a market resolves in your favor.",
  resolved: "No resolved positions yet.",
};

export function PositionsView() {
  const wallet = usePhantom();
  const [load, setLoad] = useState<Load>({ status: "idle" });
  const [tab, setTab] = useState<Tab>("open");
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({
    open: null,
    claimable: null,
    resolved: null,
  });

  const address = wallet.status === "connected" ? wallet.address : null;

  const fetchPositions = useCallback(() => {
    if (!address) return () => {};
    let cancelled = false;
    setLoad({ status: "loading" });
    api
      .positions(address)
      .then((positions) => !cancelled && setLoad({ status: "ready", positions }))
      .catch((e) => !cancelled && setLoad({ status: "error", error: toApiError(e) }));
    return () => {
      cancelled = true;
    };
  }, [address]);

  useEffect(() => {
    if (!address) {
      setLoad({ status: "idle" });
      return;
    }
    return fetchPositions();
  }, [address, fetchPositions]);

  const positions = load.status === "ready" ? load.positions : [];
  const counts = useMemo(
    () => ({
      open: positions.filter((p) => inTab(p, "open")).length,
      claimable: positions.filter((p) => inTab(p, "claimable")).length,
      resolved: positions.filter((p) => inTab(p, "resolved")).length,
    }),
    [positions],
  );
  const visible = positions.filter((p) => inTab(p, tab));

  function markClaimed(marketId: string) {
    setLoad((prev) =>
      prev.status === "ready"
        ? {
            status: "ready",
            positions: prev.positions.map((p) =>
              p.marketId === marketId ? { ...p, status: "claimed", claimable: false } : p,
            ),
          }
        : prev,
    );
  }

  function onTabKey(e: React.KeyboardEvent, index: number) {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = TABS[(index + dir + TABS.length) % TABS.length].id;
    setTab(next);
    tabRefs.current[next]?.focus();
  }

  function body() {
    if (wallet.status === "checking") {
      return <TableSkeleton />;
    }
    if (wallet.status === "unavailable") {
      return (
        <Notice
          tone="info"
          title="Phantom is not installed"
          actions={
            <a
              href="https://phantom.app/download"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("accent")}
            >
              Install Phantom
            </a>
          }
        >
          Positions are read from your wallet address, so Sorot needs Phantom to know which wallet to
          show.
        </Notice>
      );
    }
    if (!address) {
      return (
        <div className="surface p-8 text-center">
          <h2 className="text-[20px] font-semibold tracking-[-0.015em]">Connect your wallet</h2>
          <p className="mx-auto mt-2 max-w-[420px] text-[15px] leading-relaxed text-muted">
            Sorot reads positions for the wallet you connect. It never gets access to your keys.
          </p>
          <div className="mt-5 flex justify-center">
            <Button
              variant="accent"
              size="lg"
              loading={wallet.status === "connecting"}
              onClick={() => void wallet.connect()}
            >
              Connect Phantom
            </Button>
          </div>
          {wallet.error && (
            <p role="alert" className="mt-3 text-[13.5px] text-danger">
              {wallet.error}
            </p>
          )}
        </div>
      );
    }
    if (load.status === "loading" || load.status === "idle") {
      return <TableSkeleton />;
    }
    if (load.status === "error") {
      return (
        <Notice
          tone="error"
          title="Could not load positions"
          actions={
            <Button variant="secondary" onClick={() => fetchPositions()}>
              Try again
            </Button>
          }
        >
          {errorCopy(load.error).body}
        </Notice>
      );
    }

    return (
      <div className="space-y-5">
        {counts.claimable > 0 && tab !== "claimable" && (
          <Notice
            tone="success"
            title={`${counts.claimable} ${counts.claimable === 1 ? "position is" : "positions are"} ready to claim`}
            actions={
              <Button variant="secondary" onClick={() => setTab("claimable")}>
                Show claimable
              </Button>
            }
          />
        )}

        <div role="tablist" aria-label="Position filter" className="flex gap-1 border-b border-ink/15">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[t.id] = el;
              }}
              role="tab"
              id={`tab-${t.id}`}
              type="button"
              aria-selected={tab === t.id}
              aria-controls="positions-panel"
              tabIndex={tab === t.id ? 0 : -1}
              onClick={() => setTab(t.id)}
              onKeyDown={(e) => onTabKey(e, i)}
              className={`-mb-px min-h-11 cursor-pointer border-b-2 px-4 text-[15px] font-medium transition-colors ${
                tab === t.id
                  ? "border-brand-blue text-ink"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {t.label}
              <span className="ml-1.5 text-[13px] tabular-nums text-subtle">{counts[t.id]}</span>
            </button>
          ))}
        </div>

        <div id="positions-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
          {visible.length === 0 ? (
            <p className="py-10 text-center text-[15px] text-muted">
              {positions.length === 0 ? "No positions for this wallet yet." : emptyCopy[tab]}
            </p>
          ) : (
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">Your {tab} positions</caption>
              <thead className="hidden md:table-header-group">
                <tr className="border-b border-ink/25 text-[13px] font-semibold text-muted">
                  <th scope="col" className="py-3 pr-4 font-semibold">
                    Market
                  </th>
                  <th scope="col" className="py-3 pr-4 text-right font-semibold">
                    Shares
                  </th>
                  <th scope="col" className="py-3 pr-4 text-right font-semibold">
                    Avg price
                  </th>
                  <th scope="col" className="py-3 pr-4 text-right font-semibold">
                    Cost
                  </th>
                  <th scope="col" className="py-3 pl-4 text-right font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <PositionRow key={p.marketId} position={p} wallet={address} onClaimed={markClaimed} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  return (
    <AppShell wallet={<WalletButton wallet={wallet} />} width="wide" current="positions">
      <div className="space-y-5">
        <div>
          <h1 className="text-[clamp(28px,4vw,38px)] font-semibold tracking-[-0.03em]">Positions</h1>
          <p className="mt-1.5 text-[15px] text-muted">
            {address ? (
              <>
                Wallet <span className="font-mono">{shortAddress(address)}</span>
              </>
            ) : (
              "Your open and resolved trades on Panta markets."
            )}
          </p>
        </div>
        <DemoBanner />
        {body()}
      </div>
    </AppShell>
  );
}

function TableSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading positions" className="space-y-3">
      <div className="skeleton h-11 w-72" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="skeleton h-[72px] w-full" />
      ))}
    </div>
  );
}

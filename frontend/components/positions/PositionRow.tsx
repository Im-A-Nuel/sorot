"use client";

import { useState } from "react";
import { ApiError, api, formatDecimal, isMockApi, type Position } from "@/lib/api";
import { errorCopy, toApiError } from "@/lib/trade/errors";
import { approveInWallet } from "@/lib/wallet/phantom";
import { Button } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/Icons";

type ClaimState =
  | { phase: "idle" }
  | { phase: "building" | "approving" | "sending" | "confirming" }
  | { phase: "error"; error: ApiError };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const statusLabel: Record<Position["status"], string> = {
  open: "Open",
  won: "Won",
  lost: "Lost",
  claimed: "Claimed",
};

const statusTone: Record<Position["status"], string> = {
  open: "bg-ink/[0.07] text-ink",
  won: "bg-success-bg text-success",
  lost: "bg-ink/[0.07] text-muted",
  claimed: "bg-ink/[0.07] text-muted",
};

const inProgressLabel = {
  building: "Preparing",
  approving: "Waiting for Phantom",
  sending: "Sending",
  confirming: "Confirming",
} as const;

type Props = {
  position: Position;
  wallet: string;
  onClaimed: (marketId: string) => void;
};

export function PositionRow({ position, wallet, onClaimed }: Props) {
  const [claim, setClaim] = useState<ClaimState>({ phase: "idle" });
  const busy = claim.phase !== "idle" && claim.phase !== "error";

  async function runClaim() {
    setClaim({ phase: "building" });
    try {
      const built = await api.claimBuild({ wallet, marketId: position.marketId });
      setClaim({ phase: "approving" });
      const signature = await approveInWallet(`claim ${position.marketTitle}`, isMockApi);
      setClaim({ phase: "sending" });
      await api.submit({
        signature,
        wallet,
        marketId: position.marketId,
        quoteId: built.quoteId,
      });
      setClaim({ phase: "confirming" });
      for (let i = 0; i < 12; i++) {
        const status = await api.verify(signature);
        if (status === "confirmed") {
          setClaim({ phase: "idle" });
          onClaimed(position.marketId);
          return;
        }
        if (status === "failed") throw new ApiError("TX_FAILED");
        await sleep(1500);
      }
      throw new ApiError("UNKNOWN", "Still waiting for confirmation. Check your wallet before trying again.");
    } catch (e) {
      setClaim({ phase: "error", error: toApiError(e) });
    }
  }

  const failure = claim.phase === "error" ? errorCopy(claim.error) : null;

  return (
    <tr className="block border-b border-ink/15 py-4 md:table-row md:py-0">
      <th scope="row" className="block pb-2 text-left font-normal md:table-cell md:py-5 md:pr-4 md:align-top">
        <span className="block max-w-[34ch] text-[15.5px] font-semibold leading-snug">
          {position.marketTitle}
        </span>
        <span
          className={`mt-1.5 inline-block rounded-md px-2 py-0.5 text-[12.5px] font-semibold ${
            position.side === "yes" ? "bg-brand-blue/10 text-brand-blue" : "bg-ink/10 text-ink"
          }`}
        >
          {position.side.toUpperCase()}
        </span>
      </th>

      <Cell label="Shares">{formatDecimal(position.shares)}</Cell>
      <Cell label="Avg price">{position.avgPrice}</Cell>
      <Cell label="Cost">{formatDecimal(position.costUsdc)} USDC</Cell>

      <td className="block pt-2 md:table-cell md:py-5 md:pl-4 md:text-right md:align-top">
        <div className="flex flex-wrap items-center gap-3 md:flex-col md:items-end md:gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[12.5px] font-semibold ${statusTone[position.status]}`}
          >
            {position.status === "claimed" && <CheckIcon size={13} />}
            {statusLabel[position.status]}
          </span>

          {position.claimable && (
            <Button
              size="md"
              variant="accent"
              loading={busy}
              onClick={() => void runClaim()}
              aria-label={`Claim winnings for ${position.marketTitle}`}
            >
              {claim.phase === "idle"
                ? "Claim"
                : claim.phase === "error"
                  ? "Try again"
                  : inProgressLabel[claim.phase]}
            </Button>
          )}
        </div>

        {failure && (
          <p role="alert" className="mt-2 text-[13.5px] leading-snug text-danger md:ml-auto md:max-w-[22ch]">
            <span className="font-semibold">{failure.title}.</span> {failure.body}
          </p>
        )}
      </td>
    </tr>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <td className="flex justify-between gap-4 py-0.5 text-[14.5px] tabular-nums md:table-cell md:py-5 md:pr-4 md:text-right md:align-top">
      <span className="text-muted md:hidden">{label}</span>
      <span className="font-medium">{children}</span>
    </td>
  );
}

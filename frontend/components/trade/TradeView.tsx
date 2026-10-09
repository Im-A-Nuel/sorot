"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import {
  ApiError,
  api,
  checkAmount,
  formatDecimal,
  type Market,
  type Quote,
  type Side,
} from "@/lib/api";
import { errorCopy, toApiError } from "@/lib/trade/errors";
import { useNow } from "@/lib/use-now";
import { useDemo } from "@/lib/api/use-demo";
import { approveInWallet, usePhantom } from "@/lib/wallet/phantom";
import { AppShell } from "@/components/app/AppShell";
import { DemoBanner } from "@/components/app/DemoBanner";
import { WalletButton } from "@/components/app/WalletButton";
import { Button, buttonClasses } from "@/components/ui/Button";
import { ExternalIcon } from "@/components/ui/Icons";
import { Notice } from "@/components/ui/Notice";
import { AmountField } from "./AmountField";
import { QuoteSummary } from "./QuoteSummary";
import { RecentTrades } from "./RecentTrades";
import { SideSelect } from "./SideSelect";
import { Stepper } from "./Stepper";

type Phase =
  | "form"
  | "quoting"
  | "quoted"
  | "expired"
  | "approving"
  | "sending"
  | "confirming"
  | "done"
  | "failed";

type State = {
  phase: Phase;
  side: Side;
  amount: string;
  touched: boolean;
  quote: Quote | null;
  signature: string | null;
  error: ApiError | null;
  failedStep: number | null;
};

type Action =
  | { type: "side"; side: Side }
  | { type: "amount"; amount: string }
  | { type: "touch" }
  | { type: "quoteStart" }
  | { type: "quoteOk"; quote: Quote }
  | { type: "expire" }
  | { type: "approveStart" }
  | { type: "sendStart" }
  | { type: "confirmStart"; signature: string }
  | { type: "done" }
  | { type: "fail"; error: ApiError; step: number }
  | { type: "retry"; keepQuote: boolean };

const IN_FLIGHT: Phase[] = ["quoting", "approving", "sending", "confirming"];

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "side":
    case "amount": {
      // Any edit invalidates the quote, so the user can never approve numbers they did not see.
      const edited =
        action.type === "side" ? { side: action.side } : { amount: action.amount };
      return { ...state, ...edited, phase: "form", quote: null, error: null, failedStep: null };
    }
    case "touch":
      return { ...state, touched: true };
    case "quoteStart":
      return { ...state, phase: "quoting", touched: true, error: null, failedStep: null };
    case "quoteOk":
      return { ...state, phase: "quoted", quote: action.quote };
    case "expire":
      return { ...state, phase: "expired" };
    case "approveStart":
      return { ...state, phase: "approving", error: null, failedStep: null };
    case "sendStart":
      return { ...state, phase: "sending" };
    case "confirmStart":
      return { ...state, phase: "confirming", signature: action.signature };
    case "done":
      return { ...state, phase: "done" };
    case "fail":
      return { ...state, phase: "failed", error: action.error, failedStep: action.step };
    case "retry":
      return action.keepQuote && state.quote
        ? { ...state, phase: "quoted", error: null, failedStep: null }
        : { ...state, phase: "form", quote: null, error: null, failedStep: null };
  }
}

function stepFor(phase: Phase, failedStep: number | null): number {
  if (phase === "done") return 4;
  if (phase === "failed") return failedStep ?? 0;
  if (phase === "approving") return 1;
  if (phase === "sending") return 2;
  if (phase === "confirming") return 3;
  return 0;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const STATUS_TEXT: Partial<Record<Phase, string>> = {
  quoting: "Getting a quote from Panta.",
  quoted: "Quote ready. It expires in 90 seconds.",
  expired: "The quote expired.",
  approving: "Approve the request in Phantom.",
  sending: "Sending your signature to Panta.",
  confirming: "Confirming on Solana.",
  done: "Trade confirmed.",
};

type Props = { marketId: string; tweetId?: string; initialSide?: Side };

type MarketState =
  | { status: "loading" }
  | { status: "error"; error: ApiError }
  | { status: "ready"; market: Market };

export function TradeView({ marketId, tweetId, initialSide = "yes" }: Props) {
  const wallet = usePhantom();
  const demo = useDemo();
  const [marketState, setMarketState] = useState<MarketState>({ status: "loading" });
  const [state, dispatch] = useReducer(reducer, {
    phase: "form",
    side: initialSide,
    amount: "",
    touched: false,
    quote: null,
    signature: null,
    error: null,
    failedStep: null,
  });

  const loadMarket = useCallback(() => {
    let cancelled = false;
    setMarketState({ status: "loading" });
    api
      .getMarket(marketId)
      .then((market) => !cancelled && setMarketState({ status: "ready", market }))
      .catch((e) => !cancelled && setMarketState({ status: "error", error: toApiError(e) }));
    return () => {
      cancelled = true;
    };
  }, [marketId]);

  useEffect(() => loadMarket(), [loadMarket]);

  const now = useNow(state.phase === "quoted");
  const remaining = state.quote ? state.quote.expiresAt - now : 0;

  useEffect(() => {
    if (state.phase === "quoted" && state.quote && now >= state.quote.expiresAt) {
      dispatch({ type: "expire" });
    }
  }, [now, state.phase, state.quote]);

  // Move focus to the result so keyboard and screen reader users land on it.
  const alertRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.phase === "failed") alertRef.current?.focus();
    if (state.phase === "done") doneRef.current?.focus();
  }, [state.phase]);

  const inFlight = IN_FLIGHT.includes(state.phase);
  const check = checkAmount(state.amount);

  async function getQuote() {
    if (!check.ok) {
      dispatch({ type: "touch" });
      document.getElementById("amount")?.focus();
      return;
    }
    if (!wallet.address) return;
    dispatch({ type: "quoteStart" });
    try {
      const quote = await api.quote({
        marketId,
        side: state.side,
        amountUsdc: check.value,
        wallet: wallet.address,
        tweetId,
      });
      dispatch({ type: "quoteOk", quote });
    } catch (e) {
      dispatch({ type: "fail", error: toApiError(e), step: 0 });
    }
  }

  async function approve() {
    const quote = state.quote;
    if (!quote || !wallet.address || marketState.status !== "ready") return;
    let step = 1;
    dispatch({ type: "approveStart" });
    try {
      const built = await api.build({
        quoteId: quote.quoteId,
        maxSlippageBps: quote.maxSlippageBps,
        wallet: wallet.address,
      });
      const signature = await approveInWallet({
        label: `${state.side} ${quote.amountUsdc} USDC on ${marketId}`,
        demo: demo !== false,
        built,
        wallet: wallet.address,
      });
      step = 2;
      dispatch({ type: "sendStart" });
      await api.submit({ signature, wallet: wallet.address, marketId, quoteId: quote.quoteId });
      step = 3;
      dispatch({ type: "confirmStart", signature });
      for (let i = 0; i < 12; i++) {
        const status = await api.verify(signature);
        if (status === "confirmed") {
          dispatch({ type: "done" });
          return;
        }
        if (status === "failed") throw new ApiError("TX_FAILED");
        await sleep(1500);
      }
      throw new ApiError(
        "UNKNOWN",
        "Still waiting for confirmation. Check your wallet before trying again.",
      );
    } catch (e) {
      dispatch({ type: "fail", error: toApiError(e), step });
    }
  }

  const shell = (children: React.ReactNode) => (
    <AppShell wallet={<WalletButton wallet={wallet} />} width="narrow" current="trade">
      <div className="space-y-4">
        <DemoBanner />
        {children}
      </div>
    </AppShell>
  );

  if (marketState.status === "loading") {
    return shell(
      <div aria-busy="true" aria-label="Loading market" className="surface space-y-5 p-5">
        <div className="skeleton h-4 w-20" />
        <div className="skeleton h-14 w-full" />
        <div className="grid grid-cols-2 gap-2.5">
          <div className="skeleton h-[68px]" />
          <div className="skeleton h-[68px]" />
        </div>
        <div className="skeleton h-14 w-full" />
        <div className="skeleton h-12 w-full rounded-full" />
      </div>,
    );
  }

  if (marketState.status === "error") {
    const notFound = marketState.error.code === "NOT_FOUND";
    return shell(
      <Notice
        tone="error"
        title={notFound ? "Market not found" : "Could not load this market"}
        actions={
          notFound ? (
            <Link href="/" className={buttonClasses("secondary")}>
              Back to Sorot
            </Link>
          ) : (
            <Button variant="secondary" onClick={loadMarket}>
              Try again
            </Button>
          )
        }
      >
        {notFound
          ? "There is no market with this id. The link may be old."
          : errorCopy(marketState.error).body}
      </Notice>,
    );
  }

  const { market } = marketState;
  const tradable = market.status === "open";
  const failure = state.error ? errorCopy(state.error) : null;
  const status = STATUS_TEXT[state.phase];

  const explorer =
    state.signature && demo === false ? `https://solscan.io/tx/${state.signature}` : null;

  function renderAction() {
    if (wallet.status === "checking") {
      return <div className="skeleton h-12 w-full rounded-full" aria-hidden="true" />;
    }
    if (wallet.status === "unavailable") {
      return (
        <a
          href="https://phantom.app/download"
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonClasses("accent", "lg")} w-full`}
        >
          Install Phantom to trade
          <ExternalIcon />
        </a>
      );
    }
    if (wallet.status !== "connected") {
      return (
        <Button
          size="lg"
          variant="accent"
          className="w-full"
          loading={wallet.status === "connecting"}
          onClick={() => void wallet.connect()}
        >
          Connect Phantom
        </Button>
      );
    }
    if (state.phase === "quoted") {
      return (
        <Button size="lg" className="w-full" onClick={() => void approve()}>
          Approve in Phantom
        </Button>
      );
    }
    if (state.phase === "approving" || state.phase === "sending" || state.phase === "confirming") {
      return (
        <Button size="lg" className="w-full" loading disabled>
          {state.phase === "approving"
            ? "Waiting for Phantom"
            : state.phase === "sending"
              ? "Sending"
              : "Confirming"}
        </Button>
      );
    }
    return (
      <Button
        size="lg"
        variant={state.phase === "expired" ? "accent" : "primary"}
        className="w-full"
        loading={state.phase === "quoting"}
        onClick={() => void getQuote()}
      >
        {state.phase === "quoting"
          ? "Getting quote"
          : state.phase === "expired"
            ? "Get a new quote"
            : "Get quote"}
      </Button>
    );
  }

  return shell(
    <section className="surface space-y-5 p-5" aria-labelledby="market-title">
      <header>
        <p className="text-[13px] font-medium text-subtle">
          {market.category ?? "Market"} · Powered by Panta
        </p>
        <h1 id="market-title" className="mt-1.5 text-[22px] font-semibold leading-snug tracking-[-0.02em]">
          {market.title}
        </h1>
      </header>

      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>

      {!tradable && (
        <Notice
          tone="info"
          title={market.status === "resolved" ? "This market has resolved" : "This market is closed"}
          actions={
            <Link href="/positions" className={buttonClasses("secondary")}>
              View positions
            </Link>
          }
        >
          Panta is not taking new trades on it. If you hold a position, you can claim from the
          positions page once it is claimable.
        </Notice>
      )}

      {tradable && state.phase !== "done" && (
        <>
          <SideSelect
            value={state.side}
            onChange={(side) => dispatch({ type: "side", side })}
            yesPrice={market.yesPrice}
            noPrice={market.noPrice}
            disabled={inFlight}
          />
          <AmountField
            value={state.amount}
            onChange={(amount) => dispatch({ type: "amount", amount })}
            showErrors={state.touched}
            onBlur={() => state.amount !== "" && dispatch({ type: "touch" })}
            disabled={inFlight}
          />
        </>
      )}

      {tradable && state.quote && (state.phase === "quoted" || inFlight) && state.phase !== "quoting" && (
        <QuoteSummary quote={state.quote} remainingMs={remaining} />
      )}

      {state.phase === "expired" && (
        <Notice tone="info" title="The quote expired">
          Quotes only last about 90 seconds. Get a new one to see the current price.
        </Notice>
      )}

      {state.phase === "failed" && failure && (
        <Notice
          tone="error"
          title={failure.title}
          innerRef={alertRef}
          actions={
            <Button
              variant="secondary"
              onClick={() =>
                dispatch({
                  type: "retry",
                  keepQuote:
                    failure.retry === "same" &&
                    (state.failedStep ?? 0) >= 1 &&
                    !!state.quote &&
                    Date.now() < state.quote.expiresAt,
                })
              }
            >
              Try again
            </Button>
          }
        >
          {failure.body}
        </Notice>
      )}

      {state.phase === "done" && state.quote && (
        <Notice tone="success" title={demo ? "Demo trade confirmed" : "Trade confirmed"} innerRef={doneRef}>
          <dl className="mt-2 space-y-1.5">
            <div className="flex justify-between gap-4">
              <dt>Side</dt>
              <dd className="font-semibold">{state.side.toUpperCase()}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Paid</dt>
              <dd className="font-semibold tabular-nums">
                {formatDecimal(state.quote.amountUsdc)} USDC
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Estimated shares</dt>
              <dd className="font-semibold tabular-nums">{formatDecimal(state.quote.shares)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-[13px]">
            {explorer ? (
              <a
                href={explorer}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold underline"
              >
                View transaction
                <ExternalIcon />
              </a>
            ) : (
              "Demo signature. Nothing was sent on-chain."
            )}
          </p>
        </Notice>
      )}

      {tradable && (state.phase !== "done" ? (
        <div className="space-y-4">
          {state.phase !== "form" && state.phase !== "quoting" && state.phase !== "expired" && (
            <Stepper
              current={stepFor(state.phase, state.failedStep)}
              failedAt={state.phase === "failed" ? state.failedStep : null}
            />
          )}
          {renderAction()}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Link href="/positions" className={`${buttonClasses("primary", "lg")} flex-1`}>
            View positions
          </Link>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              if (window.opener) window.close();
              else dispatch({ type: "retry", keepQuote: false });
            }}
          >
            {typeof window !== "undefined" && window.opener ? "Close window" : "New trade"}
          </Button>
        </div>
      ))}

      <RecentTrades marketId={market.id} />
    </section>,
  );
}

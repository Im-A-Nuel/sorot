"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "./Icons";

/** Copies text to the clipboard and says so. Falls back to a visible failure message. */
export function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy command: ${label}`}
      className="flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-white/90 transition-colors hover:bg-white/10"
    >
      {state === "copied" ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
      <span role="status">
        {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : "Copy"}
      </span>
    </button>
  );
}

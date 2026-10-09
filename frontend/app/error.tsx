"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="content" className="flex min-h-svh flex-col items-center justify-center bg-base px-6 text-center">
      <h1 className="text-[clamp(30px,5vw,44px)] font-semibold tracking-[-0.03em]">
        Something broke on our side
      </h1>
      <p className="mt-3 max-w-[420px] text-[16px] leading-relaxed text-muted">
        The page hit an unexpected error. Nothing was sent to your wallet. Try again, and if it keeps
        happening, reload the page.
      </p>
      <div className="mt-7">
        <Button size="lg" onClick={() => retry()}>
          Try again
        </Button>
      </div>
    </main>
  );
}

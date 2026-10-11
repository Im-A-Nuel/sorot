"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonClasses } from "@/components/ui/Button";
import { StatusPage } from "@/components/ui/StatusPage";

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
    <StatusPage
      title="Something broke on our side"
      actions={
        <>
          <Button size="lg" onClick={() => retry()}>
            Try again
          </Button>
          <Link href="/" className={buttonClasses("secondary", "lg")}>
            Back to Sorot
          </Link>
        </>
      }
    >
      The page hit an unexpected error. Nothing was sent to your wallet. Try again, and if it keeps happening, reload the
      page.
    </StatusPage>
  );
}

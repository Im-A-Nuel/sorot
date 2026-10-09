"use client";

import { useEffect, useState } from "react";
import { api } from "./index";

let cached: Promise<boolean | null> | null = null;

function loadDemo(): Promise<boolean | null> {
  cached ??= api
    .meta()
    .then((m) => m.demo)
    .catch(() => {
      cached = null;
      return null;
    });
  return cached;
}

/** True while the backend serves demo data, false when it is live, null until known. */
export function useDemo(): boolean | null {
  const [demo, setDemo] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadDemo().then((value) => !cancelled && setDemo(value));
    return () => {
      cancelled = true;
    };
  }, []);
  return demo;
}

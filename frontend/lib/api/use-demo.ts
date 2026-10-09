"use client";

import { useEffect, useState } from "react";
import { api } from "./index";

type Meta = { demo: boolean; source: "live" | "sandbox" | "fixture" };

let cached: Promise<Meta | null> | null = null;

function loadMeta(): Promise<Meta | null> {
  cached ??= api.meta().catch(() => {
    cached = null;
    return null;
  });
  return cached;
}

/** Which data the backend serves. Null until known, or when the health check failed. */
export function useMeta(): Meta | null {
  const [meta, setMeta] = useState<Meta | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadMeta().then((value) => !cancelled && setMeta(value));
    return () => {
      cancelled = true;
    };
  }, []);
  return meta;
}

/** True while the backend serves demo data, false when it is live, null until known. */
export function useDemo(): boolean | null {
  const meta = useMeta();
  return meta ? meta.demo : null;
}

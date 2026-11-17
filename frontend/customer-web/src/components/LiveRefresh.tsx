"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Keeps a page up to date without a reload. `version` is the data version this page was rendered with; the live
 * route reports the current version as soon as the page connects and again after every change, and any
 * difference re-renders the page's server data. So a change that happens between rendering and connecting is
 * not missed. Renders nothing. Form fields the person is typing in keep their values.
 */
export function LiveRefresh({ version }: { version: number }) {
  const router = useRouter();
  const known = useRef(version);

  useEffect(() => {
    if (typeof EventSource === "undefined") return;
    const source = new EventSource("/live/providers");
    let pending: ReturnType<typeof setTimeout> | undefined;
    source.addEventListener("version", (event) => {
      const current = Number((event as MessageEvent<string>).data);
      if (!Number.isFinite(current) || current === known.current) return;
      known.current = current;
      clearTimeout(pending);
      pending = setTimeout(() => router.refresh(), 250);
    });
    return () => {
      clearTimeout(pending);
      source.close();
    };
  }, [router]);

  return null;
}

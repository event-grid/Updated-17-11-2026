"use client";

import { useState, useTransition } from "react";

import { setStatusAction } from "@/app/actions";
import type { ApprovalStatus } from "@/lib/store";

const LABELS: Record<ApprovalStatus, string> = { APPROVED: "Approve", REJECTED: "Reject", PENDING: "Mark as pending" };

/**
 * Approve / reject buttons that change the status in the background: the page does not reload, the buttons show
 * progress, and the list refreshes itself (and every other open page does too, through the live updates).
 */
export function StatusButtons({ id, current, only }: { id: string; current: ApprovalStatus; only?: ApprovalStatus[] }) {
  const [pending, startTransition] = useTransition();
  const [working, setWorking] = useState<ApprovalStatus | null>(null);
  const options = (only ?? ["APPROVED", "REJECTED", "PENDING"]).filter((s) => s !== current);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((status) => (
        <button
          key={status}
          type="button"
          disabled={pending}
          onClick={() => {
            setWorking(status);
            startTransition(async () => {
              await setStatusAction(id, status);
              setWorking(null);
            });
          }}
          className="min-h-11 rounded-md px-4 py-1.5 text-sm font-semibold text-ink ring-1 ring-line transition-colors hover:text-terracotta disabled:opacity-60 sm:min-h-0 sm:px-3"
        >
          {pending && working === status ? "Saving…" : LABELS[status]}
        </button>
      ))}
    </div>
  );
}

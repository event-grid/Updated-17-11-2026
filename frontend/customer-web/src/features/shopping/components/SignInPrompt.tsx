"use client";

import { useRouter } from "next/navigation";

import { signInHere } from "@/features/marketplace/components/FavouriteButton";

export function SignInPrompt({ what }: { what: string }) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-start gap-5 rounded-xl border border-dashed border-line bg-white p-10">
      <p className="font-display text-3xl text-ink">Sign in to see {what}</p>
      <p className="text-ink-soft">Use your mobile number or email — we&apos;ll send you a one-time code.</p>
      <button
        type="button"
        onClick={() => router.push(signInHere())}
        className="rounded-md bg-terracotta px-5 py-3 font-semibold text-white transition-all hover:bg-terracotta-600 active:scale-[0.98]"
      >
        Sign in
      </button>
    </div>
  );
}

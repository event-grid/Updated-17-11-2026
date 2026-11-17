"use client";

import { useEffect, useState } from "react";

import { setSignedIn } from "@/features/auth/session-store";
import { useRequestEmailCode, useVerifyEmail } from "@/features/shopping/hooks";
import { ApiError } from "@/lib/api/errors";
import type { EmailCode } from "@/lib/api/generated/customer";

const input =
  "mt-1.5 w-full rounded-lg border border-line px-3 py-3 text-ink focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20";
const primary =
  "rounded-md bg-plum px-5 py-3 font-semibold text-champagne-200 transition-all hover:bg-plum-700 active:scale-[0.98] disabled:opacity-60";
const secondary = "rounded-md px-4 py-3 text-sm font-semibold text-ink ring-1 ring-line transition-colors hover:text-terracotta disabled:opacity-60";

type Step = "idle" | "address" | "code";

/**
 * Add or change the email address on the profile. The address is saved only after the customer enters the
 * one-time code sent to it, so every saved email is a verified one.
 */
export function EmailSection({ email }: { email: string | null }) {
  const [step, setStep] = useState<Step>("idle");
  const [address, setAddress] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState<EmailCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [wait, setWait] = useState(0);
  const request = useRequestEmailCode();
  const verify = useVerifyEmail();

  // Count down until another code may be requested.
  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const message = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong. Please try again.");

  function sendCode() {
    setError(null);
    request.mutate(address.trim(), {
      onSuccess: (result) => {
        setSent(result);
        setCode("");
        setWait(result.resendAfterSeconds);
        setStep("code");
      },
      onError: (e) => setError(message(e)),
    });
  }

  function confirm() {
    if (!sent) return;
    setError(null);
    verify.mutate(
      { challengeId: sent.challengeId, code: code.trim() },
      {
        onSuccess: (account) => {
          setSignedIn(account); // header and profile show the new address at once
          setVerified(true);
          setStep("idle");
          setSent(null);
          setAddress("");
        },
        onError: (e) => setError(message(e)),
      },
    );
  }

  function cancel() {
    setStep("idle");
    setSent(null);
    setError(null);
    setCode("");
  }

  return (
    <section aria-labelledby="email-heading" className="flex flex-col gap-5 rounded-xl bg-white p-6 ring-1 ring-line">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="email-heading" className="text-sm font-semibold text-ink">
            Email address
          </h2>
          {email ? (
            <p className="mt-1 flex flex-wrap items-center gap-2 text-ink-soft">
              {email}
              <span className="rounded-full bg-[#e3efe6] px-2.5 py-0.5 text-xs font-semibold text-[#1f5a35]">Verified</span>
            </p>
          ) : (
            <p className="mt-1 text-ink-soft">Not added</p>
          )}
        </div>
        {step === "idle" && (
          <button type="button" onClick={() => { setStep("address"); setVerified(false); }} className={secondary}>
            {email ? "Change email" : "Add email"}
          </button>
        )}
      </div>

      {verified && step === "idle" && (
        <p role="status" className="animate-fade-in text-sm text-[#2f5a40]">
          Email verified and saved ✓
        </p>
      )}

      {step === "address" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendCode();
          }}
          noValidate
          className="flex flex-col gap-4"
        >
          <div>
            <label htmlFor="new-email" className="block text-sm font-semibold text-ink">
              {email ? "New email address" : "Email address"}
            </label>
            <input
              id="new-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              aria-invalid={!!error}
              className={input}
            />
            <p className="mt-1 text-xs text-ink-soft">We will send a one-time code to this address to confirm it is yours.</p>
          </div>
          {error && (
            <p role="alert" className="text-sm text-terracotta-600">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={request.isPending || address.trim() === ""} className={primary}>
              {request.isPending ? "Sending…" : "Send code"}
            </button>
            <button type="button" onClick={cancel} className={secondary}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {step === "code" && sent && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            confirm();
          }}
          noValidate
          className="flex flex-col gap-4"
        >
          <p className="text-sm text-ink-soft">
            We sent a code to <strong className="text-ink">{sent.sentTo}</strong>. It expires in a few minutes.
          </p>
          {sent.devCode && (
            <p className="rounded-lg bg-champagne-200/60 px-4 py-3 text-sm text-ink">
              Development mode: your code is <strong className="font-mono tracking-widest">{sent.devCode}</strong>
            </p>
          )}
          <div>
            <label htmlFor="email-code" className="block text-sm font-semibold text-ink">
              One-time code
            </label>
            <input
              id="email-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              aria-invalid={!!error}
              className={`${input} font-mono tracking-widest`}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-terracotta-600">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={verify.isPending || code.length < 4} className={primary}>
              {verify.isPending ? "Verifying…" : "Verify and save"}
            </button>
            <button type="button" onClick={sendCode} disabled={wait > 0 || request.isPending} className={secondary}>
              {wait > 0 ? `Resend code in ${wait}s` : "Resend code"}
            </button>
            <button type="button" onClick={() => setStep("address")} className={secondary}>
              Use a different address
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ApiError, callBrowserApi, identityApi } from "@/lib/api/client";
import type { SignInCode, SignInOptions } from "@/lib/api/generated/public";

import { setSignedIn } from "../session-store";

type Channel = "PHONE" | "EMAIL";

/**
 * Sign in with a one-time code to a mobile number or an email address.
 * In development mode the backend returns the code and it is shown on screen; the dummy test number is
 * offered as a shortcut.
 */
export function SignInForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));

  const [options, setOptions] = useState<SignInOptions | null>(null);
  const [channel, setChannel] = useState<Channel>("PHONE");
  const [destination, setDestination] = useState("");
  const [sent, setSent] = useState<SignInCode | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    callBrowserApi(() => identityApi.getSignInOptions())
      .then(setOptions)
      .catch((e: unknown) => setError(message(e)));
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  async function requestCode(event?: React.FormEvent) {
    event?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await callBrowserApi(() =>
        identityApi.requestSignInCode({ signInCodeRequest: { channel, destination } }),
      );
      setSent(result);
      setCode("");
      setResendIn(result.resendAfterSeconds);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    if (!sent) return;
    setBusy(true);
    setError(null);
    try {
      const account = await callBrowserApi(() =>
        identityApi.signIn({ signInRequest: { challengeId: sent.challengeId, code } }),
      );
      setSignedIn(account);
      router.replace(next);
      router.refresh();
    } catch (e) {
      setError(message(e));
      if (e instanceof ApiError && (e.code === "OTP_EXPIRED" || e.code === "OTP_ATTEMPTS_EXCEEDED")) {
        setCode("");
      }
      setBusy(false);
    }
  }

  function switchChannel(next: Channel) {
    setChannel(next);
    setDestination("");
    setError(null);
  }

  const testPhone = options?.devMode ? options.testPhone : undefined;

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-card ring-1 ring-line sm:p-8">
      {options?.devMode && (
        <div className="mb-6 rounded-lg bg-tile-butter/60 px-4 py-3 text-sm text-ink ring-1 ring-gold/30">
          <p className="font-semibold">Development mode</p>
          <p className="mt-1 text-ink-soft">No SMS is sent. Your code is shown on this screen.</p>
          {testPhone && (
            <p className="mt-2">
              Dummy number: <strong className="font-semibold tracking-wide">{formatPhone(testPhone)}</strong> · Code:{" "}
              <strong className="font-semibold tracking-widest">{options.testCode}</strong>
            </p>
          )}
        </div>
      )}

      {!sent ? (
        <form key="destination" onSubmit={requestCode} noValidate className="animate-fade-up">
          <div role="tablist" aria-label="Sign in with" className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-sand p-1">
            {(["PHONE", "EMAIL"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={channel === value}
                onClick={() => switchChannel(value)}
                className={`rounded-md px-3 py-2 text-sm font-semibold transition-all duration-300 ${
                  channel === value ? "bg-white text-ink shadow-sm" : "text-ink-soft hover:text-ink"
                }`}
              >
                {value === "PHONE" ? "Mobile number" : "Email"}
              </button>
            ))}
          </div>

          <label htmlFor="destination" className="block text-sm font-semibold text-ink">
            {channel === "PHONE" ? "Mobile number" : "Email address"}
          </label>
          <div className="mt-2 flex items-stretch overflow-hidden rounded-lg border border-line bg-white focus-within:border-terracotta focus-within:ring-2 focus-within:ring-terracotta/20">
            {channel === "PHONE" && (
              <span className="flex items-center border-r border-line bg-sand px-3 text-sm text-ink-soft">+91</span>
            )}
            <input
              id="destination"
              name="destination"
              type={channel === "PHONE" ? "tel" : "email"}
              inputMode={channel === "PHONE" ? "numeric" : "email"}
              autoComplete={channel === "PHONE" ? "tel-national" : "email"}
              maxLength={channel === "PHONE" ? 10 : 254}
              required
              autoFocus
              value={destination}
              // A mobile number is exactly 10 digits, numbers only: anything else typed or pasted is dropped.
              onChange={(e) => setDestination(channel === "PHONE" ? e.target.value.replace(/\D/g, "").slice(0, 10) : e.target.value)}
              placeholder={channel === "PHONE" ? "98765 43210" : "you@example.com"}
              className="w-full px-3 py-3 text-ink placeholder:text-ink-soft/60 focus:outline-none"
            />
          </div>

          {channel === "PHONE" && testPhone && (
            <button
              type="button"
              onClick={() => setDestination(testPhone)}
              className="mt-2 text-sm font-semibold text-terracotta hover:text-terracotta-600"
            >
              Use dummy number
            </button>
          )}

          {error && <ErrorText>{error}</ErrorText>}

          <SubmitButton busy={busy || !options} disabled={!destination.trim()}>
            {busy ? "Sending code…" : "Send code"}
          </SubmitButton>
        </form>
      ) : (
        <form key="code" onSubmit={verify} noValidate className="animate-fade-up">
          <p className="text-sm text-ink-soft">
            Enter the code sent to <strong className="font-semibold text-ink">{sent.sentTo}</strong>.
          </p>

          {sent.devCode && (
            <p className="mt-4 animate-[pop-in_0.6s_var(--ease-out-soft)_0.15s_backwards] rounded-lg bg-plum px-4 py-3 text-center text-champagne-200">
              <span className="block text-xs uppercase tracking-wider">Your code (development mode)</span>
              <span className="mt-1 block font-display text-3xl tracking-[0.4em]">{sent.devCode}</span>
            </p>
          )}

          <label htmlFor="code" className="mt-6 block text-sm font-semibold text-ink">
            One-time code
          </label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={8}
            required
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="mt-2 w-full rounded-lg border border-line px-3 py-3 text-center text-2xl tracking-[0.4em] text-ink focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
          />

          {error && <ErrorText>{error}</ErrorText>}

          <SubmitButton busy={busy} disabled={code.length < 4}>
            {busy ? "Signing in…" : "Verify and sign in"}
          </SubmitButton>

          <div className="mt-4 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setSent(null);
                setError(null);
              }}
              className="font-semibold text-ink-soft hover:text-ink"
            >
              ← Change {channel === "PHONE" ? "number" : "email"}
            </button>
            <button
              type="button"
              disabled={resendIn > 0 || busy}
              onClick={() => requestCode()}
              className="font-semibold text-terracotta hover:text-terracotta-600 disabled:cursor-not-allowed disabled:text-ink-soft/70"
            >
              {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function SubmitButton({ busy, disabled, children }: { busy: boolean; disabled: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={busy || disabled}
      aria-busy={busy}
      className="mt-6 inline-flex w-full items-center justify-center gap-2.5 rounded-md bg-terracotta px-5 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_-14px_rgb(217_115_90/0.9)] transition-all hover:-translate-y-px hover:bg-terracotta-600 active:translate-y-0 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
    >
      {busy && <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
      {children}
    </button>
  );
}

/** The message shakes once each time it changes, so a repeated wrong code is still noticed. */
function ErrorText({ children }: { children: string }) {
  return (
    <p key={children} role="alert" className="mt-3 animate-shake text-sm text-terracotta-600">
      {children}
    </p>
  );
}

function message(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "API_UNREACHABLE") return "We could not reach EVENTGRID. Please try again shortly.";
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

function formatPhone(digits: string) {
  return digits.length === 10 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits;
}

/** Only same-site paths, so the sign-in page cannot be used to redirect elsewhere. */
function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/sign-in") ? value : "/";
}

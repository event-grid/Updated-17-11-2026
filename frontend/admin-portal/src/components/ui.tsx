export const inputClass =
  "mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-3 text-base text-ink placeholder:text-ink-soft/60 focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20 sm:py-2.5 sm:text-sm";

export const primaryButton =
  "rounded-md bg-terracotta px-6 py-3 font-semibold text-white transition-all hover:bg-terracotta-600 active:scale-[0.98] disabled:opacity-60";

export const secondaryButton =
  "rounded-md px-6 py-3 font-semibold text-ink ring-1 ring-line transition-colors hover:text-terracotta";

export function Field({
  label,
  name,
  error,
  hint,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
      {error && (
        <p id={`${name}-error`} role="alert" className="mt-1 text-sm text-terracotta-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormMessage({ message, ok }: { message?: string; ok?: boolean }) {
  if (!message) return null;
  return (
    <p
      role={ok ? "status" : "alert"}
      className={`rounded-lg px-4 py-3 text-sm ${ok ? "bg-[#e3efe6] text-[#1f5a35]" : "bg-[#f8e3dd] text-terracotta-600"}`}
    >
      {message}
    </p>
  );
}

export function StatusBadge({ status }: { status: "PENDING" | "APPROVED" | "REJECTED" }) {
  const style = {
    PENDING: "bg-champagne-200 text-gold",
    APPROVED: "bg-[#e3efe6] text-[#1f5a35]",
    REJECTED: "bg-[#f8e3dd] text-terracotta-600",
  }[status];
  const label = { PENDING: "Waiting for approval", APPROVED: "Approved", REJECTED: "Not approved" }[status];
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${style}`}>{label}</span>;
}

type Tone = "good" | "warn" | "bad" | "neutral";

/** A small coloured label for statuses. */
export function Pill({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  const style = {
    good: "bg-[#e3efe6] text-[#1f5a35]",
    warn: "bg-champagne-200 text-gold",
    bad: "bg-[#f8e3dd] text-terracotta-600",
    neutral: "bg-sand text-ink-soft",
  }[tone];
  return <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${style}`}>{children}</span>;
}

/** One number on the dashboard. */
export function StatCard({ label, value, hint, href }: { label: string; value: string | number; hint?: string; href?: string }) {
  const body = (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">{label}</p>
      <p className="font-display text-4xl text-ink">{value}</p>
      {hint && <p className="text-sm text-ink-soft">{hint}</p>}
    </>
  );
  const className = "flex flex-col gap-1 rounded-xl bg-white p-5 ring-1 ring-line";
  return href ? (
    <a href={href} className={`${className} transition-all hover:-translate-y-0.5 hover:shadow-card`}>
      {body}
    </a>
  ) : (
    <div className={className}>{body}</div>
  );
}

/** A notice for backend problems or empty states. */
export function Notice({ tone = "warn", children }: { tone?: "warn" | "bad"; children: React.ReactNode }) {
  return (
    <p role={tone === "bad" ? "alert" : "status"} className={`rounded-xl px-5 py-4 text-sm ${tone === "bad" ? "bg-[#f8e3dd] text-terracotta-600" : "bg-champagne-200/70 text-ink"}`}>
      {children}
    </p>
  );
}

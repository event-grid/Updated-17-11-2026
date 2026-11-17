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

import type { CatalogueCategory } from "@/lib/catalogue";

/**
 * Checklist of every catalogue service, grouped by event category. Checkboxes are named "service" and carry
 * "<category>:<service>" values. Categories that contain a selected service start open.
 */
export function ServicePicker({
  catalogue,
  selected,
  error,
}: {
  catalogue: CatalogueCategory[];
  selected: string[];
  error?: string;
}) {
  const chosen = new Set(selected);
  return (
    <fieldset aria-describedby={error ? "service-error" : undefined} className="flex flex-col gap-3">
      <legend className="text-sm font-semibold text-ink">Services you offer</legend>
      <p className="text-xs text-ink-soft">
        Tick every service you provide. You will fill in the details of each one after this step.
      </p>
      <div className="flex flex-col gap-2">
        {catalogue.map((category) => {
          const count = category.services.filter((s) => chosen.has(`${category.slug}:${s.code}`)).length;
          return (
            <details key={category.slug} open={count > 0} className="rounded-lg bg-white ring-1 ring-line">
              <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-ink">
                {category.name}
                <span className="text-xs font-normal text-ink-soft">{count > 0 ? `${count} selected` : `${category.services.length} services`}</span>
              </summary>
              <ul className="grid gap-x-4 gap-y-2 border-t border-line px-4 py-3 sm:grid-cols-2">
                {category.services.map((service) => {
                  const value = `${category.slug}:${service.code}`;
                  return (
                    <li key={value}>
                      <label className="flex items-start gap-2 text-sm text-ink">
                        <input type="checkbox" name="service" value={value} defaultChecked={chosen.has(value)} className="mt-0.5 accent-terracotta" />
                        {service.name}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </details>
          );
        })}
      </div>
      {error && (
        <p id="service-error" role="alert" className="text-sm text-terracotta-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}

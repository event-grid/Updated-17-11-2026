"use client";

import { useActionState, useState } from "react";

import { saveProfileAction, saveServiceDetailsAction, saveServicesAction } from "@/app/actions";
import { initialState } from "@/lib/action-state";
import type { CatalogueCategory, CatalogueService } from "@/lib/catalogue";
import { split } from "@/lib/commission-math";
import { PACKAGE_SLOT_COUNT } from "@/lib/forms";
import { formatRupees } from "@/lib/format";
import type { ServiceDetails } from "@/lib/store";

import { ProfileFields } from "./ProfileFields";
import { ServicePicker } from "./ServicePicker";
import { Field, FormMessage, inputClass, primaryButton } from "./ui";

type Profile = {
  name: string;
  type: string;
  email: string;
  phone: string;
  city: string;
  area: string;
  about: string;
};

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(saveProfileAction, initialState);
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <FormMessage message={state.message} ok={state.ok} />
      <ProfileFields values={state.values ?? profile} errors={state.errors} emailLocked />
      <div>
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Saving…" : "Save profile"}
        </button>
      </div>
    </form>
  );
}

export function ServicesForm({ catalogue, selected }: { catalogue: CatalogueCategory[]; selected: string[] }) {
  const [state, action, pending] = useActionState(saveServicesAction, initialState);
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <FormMessage message={state.message} ok={state.ok} />
      <ServicePicker catalogue={catalogue} selected={selected} error={state.errors.service} />
      <div>
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Saving…" : "Update my services"}
        </button>
      </div>
    </form>
  );
}

/**
 * Under a price: what EVENTGRID keeps and what the vendor receives, using the platform commission. Shows nothing
 * until a valid price is typed, or when the rate could not be loaded.
 */
function Earnings({ price, percent, perGuest }: { price: string; percent: number | null; perGuest: boolean }) {
  const rupees = Number(price);
  if (percent === null || !price || !Number.isFinite(rupees) || rupees <= 0) return null;
  const { commissionMinor, payoutMinor } = split(rupees, percent);
  return (
    <p className="mt-1.5 text-xs text-ink-soft" aria-live="polite">
      Commission ({percent}%): {formatRupees(commissionMinor)} · <strong className="text-ink">You receive {formatRupees(payoutMinor)}</strong>
      {perGuest ? " per guest" : ""}
    </p>
  );
}

/**
 * The detail form of one service. Its fields come from the catalogue entry of that service: the options it
 * offers and its attributes (for example Cost and Type for tents), plus price, description and packages.
 */
export function ServiceDetailsForm({
  details,
  service,
  commissionPercent,
}: {
  details: ServiceDetails;
  service: CatalogueService;
  /** The platform commission in percent, or null when it could not be loaded. */
  commissionPercent: number | null;
}) {
  const [state, action, pending] = useActionState(saveServiceDetailsAction, initialState);
  const values = state.values;
  const errors = state.errors;
  const text = (name: string, fallback: string) => values?.[name] ?? fallback;
  const chosen = values ? (values.__options ?? "").split("|").filter(Boolean) : details.options;
  const id = (name: string) => `${details.key}-${name}`;
  // Prices are tracked only to show the commission live; the inputs stay ordinary form fields.
  const [startPrice, setStartPrice] = useState(text("startingPrice", details.startingPriceRupees?.toString() ?? ""));
  const [packagePrices, setPackagePrices] = useState<string[]>(
    Array.from({ length: PACKAGE_SLOT_COUNT }, (_, i) => text(`pkg${i + 1}Price`, details.packages[i] ? String(details.packages[i].priceRupees) : "")),
  );
  const [unit, setUnit] = useState(text("priceUnit", details.priceUnit));

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="key" value={details.key} />
      <FormMessage message={state.message} ok={state.ok} />

      {service.options.length > 0 && (
        <fieldset>
          <legend className="text-sm font-semibold text-ink">What you offer</legend>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
            {service.options.map((option) => (
              <label key={option} className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" name="option" value={option} defaultChecked={chosen.includes(option)} className="accent-terracotta" />
                {option}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {service.attributes.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2">
          {service.attributes.map((attribute) => (
            <Field key={attribute} label={attribute.charAt(0).toUpperCase() + attribute.slice(1)} name={id(`attr-${attribute}`)} error={errors[`attr:${attribute}`]}>
              <input
                id={id(`attr-${attribute}`)}
                name={`attr:${attribute}`}
                defaultValue={text(`attr:${attribute}`, details.attributes[attribute] ?? "")}
                className={inputClass}
              />
            </Field>
          ))}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Starting price (₹)" name={id("price")} error={errors.startingPrice}>
          <input
            id={id("price")}
            name="startingPrice"
            type="number"
            min={1}
            inputMode="numeric"
            defaultValue={text("startingPrice", details.startingPriceRupees?.toString() ?? "")}
            onChange={(e) => setStartPrice(e.target.value)}
            className={inputClass}
          />
          <Earnings price={startPrice} percent={commissionPercent} perGuest={unit === "PER_GUEST"} />
        </Field>
        <Field label="Price is" name={id("unit")}>
          <select id={id("unit")} name="priceUnit" defaultValue={text("priceUnit", details.priceUnit)} onChange={(e) => setUnit(e.target.value)} className={inputClass}>
            <option value="FIXED">Per event (fixed)</option>
            <option value="PER_GUEST">Per guest</option>
          </select>
        </Field>
      </div>

      <Field label="Describe this service" name={id("description")} error={errors.description} hint="What customers get, how you work, anything they should know.">
        <textarea id={id("description")} name="description" rows={4} defaultValue={text("description", details.description)} className={inputClass} />
      </Field>

      <fieldset className="flex flex-col gap-4">
        <legend className="text-sm font-semibold text-ink">Packages (optional, up to {PACKAGE_SLOT_COUNT})</legend>
        {Array.from({ length: PACKAGE_SLOT_COUNT }, (_, index) => {
          const n = index + 1;
          const existing = details.packages[index];
          return (
            <div key={n} className="grid gap-4 rounded-lg bg-sand/60 p-4 sm:grid-cols-[1fr_9rem]">
              <Field label={`Package ${n} name`} name={id(`pkg${n}Name`)} error={errors[`pkg${n}Name`]}>
                <input id={id(`pkg${n}Name`)} name={`pkg${n}Name`} defaultValue={text(`pkg${n}Name`, existing?.name ?? "")} className={inputClass} />
              </Field>
              <Field label="Price (₹)" name={id(`pkg${n}Price`)} error={errors[`pkg${n}Price`]}>
                <input
                  id={id(`pkg${n}Price`)}
                  name={`pkg${n}Price`}
                  type="number"
                  min={1}
                  inputMode="numeric"
                  defaultValue={text(`pkg${n}Price`, existing ? String(existing.priceRupees) : "")}
                  onChange={(e) => setPackagePrices((prices) => prices.map((p, i) => (i === index ? e.target.value : p)))}
                  className={inputClass}
                />
                <Earnings price={packagePrices[index]} percent={commissionPercent} perGuest={unit === "PER_GUEST"} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="What is included" name={id(`pkg${n}Description`)}>
                  <input
                    id={id(`pkg${n}Description`)}
                    name={`pkg${n}Description`}
                    defaultValue={text(`pkg${n}Description`, existing?.description ?? "")}
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          );
        })}
      </fieldset>

      <div>
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Saving…" : "Save service details"}
        </button>
      </div>
    </form>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { signInHere } from "@/features/marketplace/components/FavouriteButton";
import { ApiError } from "@/lib/api/errors";
import type { Package } from "@/lib/api/generated/public";
import { formatRupees, tomorrowIso } from "@/lib/format";

import { useCartMutations, useSignedIn } from "../hooks";

function schema(pkg: Package) {
  const perGuest = pkg.priceUnit === "PER_GUEST";
  return z.object({
    eventDate: z
      .string()
      .min(1, "Choose your event date.")
      .refine((d) => d >= tomorrowIso(), "Choose a date from tomorrow onwards."),
    quantity: z
      .number({ error: perGuest ? "Enter the number of guests." : "Enter a quantity." })
      .int("Enter a whole number.")
      .min(pkg.minQuantity, perGuest ? `At least ${pkg.minQuantity} guests.` : `At least ${pkg.minQuantity}.`)
      .max(pkg.maxQuantity, perGuest ? `At most ${pkg.maxQuantity} guests.` : `At most ${pkg.maxQuantity}.`),
    notes: z.string().max(500, "Keep notes under 500 characters.").optional(),
  });
}

type Values = z.infer<ReturnType<typeof schema>>;

/**
 * Adds one package to the cart for an event date. The date is a request: the provider confirms availability.
 * Validation mirrors the backend; the backend's answer is still final (its errors are shown under the form).
 */
export function AddToCart({ pkg }: { pkg: Package }) {
  const id = useId();
  const router = useRouter();
  const { session } = useSignedIn();
  const { add } = useCartMutations();
  const perGuest = pkg.priceUnit === "PER_GUEST";
  const fixedSingle = !perGuest && pkg.maxQuantity === 1;

  const form = useForm<Values>({
    resolver: zodResolver(schema(pkg)),
    defaultValues: { eventDate: "", quantity: pkg.minQuantity, notes: "" },
  });
  const quantity = useWatch({ control: form.control, name: "quantity" });
  const lineTotal = Number.isFinite(quantity) && quantity > 0 ? pkg.priceMinor * quantity : null;

  if (session.status !== "signed-in") {
    return (
      <button
        type="button"
        onClick={() => router.push(signInHere())}
        className="w-full rounded-md bg-terracotta px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-terracotta-600 active:scale-[0.99]"
      >
        Sign in to add to cart
      </button>
    );
  }

  const onSubmit = form.handleSubmit((values) => {
    add.mutate(
      { packageId: pkg.id, quantity: values.quantity, eventDate: new Date(`${values.eventDate}T00:00:00Z`), notes: values.notes || undefined },
      {
        onError: (error) => {
          const message = error instanceof ApiError ? error.message : "Could not add to cart. Please try again.";
          form.setError("root", { message });
        },
      },
    );
  });

  const errors = form.formState.errors;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      <div className={`grid gap-3 ${fixedSingle ? "" : "sm:grid-cols-2"}`}>
        <div>
          <label htmlFor={`${id}-date`} className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
            Event date
          </label>
          <input
            id={`${id}-date`}
            type="date"
            min={tomorrowIso()}
            aria-invalid={!!errors.eventDate}
            {...form.register("eventDate")}
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
          />
          {errors.eventDate && <FieldError>{errors.eventDate.message}</FieldError>}
        </div>
        {!fixedSingle && (
          <div>
            <label htmlFor={`${id}-qty`} className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
              {perGuest ? "Guests" : "Quantity"}
            </label>
            <input
              id={`${id}-qty`}
              type="number"
              inputMode="numeric"
              min={pkg.minQuantity}
              max={pkg.maxQuantity}
              aria-invalid={!!errors.quantity}
              {...form.register("quantity", { valueAsNumber: true })}
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
            />
            {errors.quantity && <FieldError>{errors.quantity.message}</FieldError>}
          </div>
        )}
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-ink-soft hover:text-ink">Add a note for the vendor</summary>
        <textarea
          aria-label="Note for the vendor"
          rows={2}
          maxLength={500}
          {...form.register("notes")}
          className="mt-2 w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
        />
        {errors.notes && <FieldError>{errors.notes.message}</FieldError>}
      </details>

      {errors.root && <FieldError>{errors.root.message}</FieldError>}

      {add.isSuccess ? (
        <p role="status" className="flex animate-fade-up items-center justify-between gap-3 rounded-lg bg-tile-mint px-4 py-3 text-sm text-ink">
          <span>✓ Added to your cart</span>
          <Link href="/cart" className="font-semibold text-plum underline underline-offset-4">
            View cart
          </Link>
        </p>
      ) : (
        <button
          type="submit"
          disabled={add.isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-terracotta px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-terracotta-600 active:scale-[0.99] disabled:opacity-60"
        >
          {add.isPending && <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          Add to cart{lineTotal ? ` · ${formatRupees(lineTotal)}` : ""}
        </button>
      )}
      <p className="text-xs text-ink-soft">The date is a request. The vendor confirms availability after booking.</p>
    </form>
  );
}

function FieldError({ children }: { children?: React.ReactNode }) {
  return (
    <p role="alert" className="mt-1 text-xs text-terracotta-600">
      {children}
    </p>
  );
}

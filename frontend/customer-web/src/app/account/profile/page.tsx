"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { EmailSection } from "@/features/account/components/EmailSection";
import { setSignedIn } from "@/features/auth/session-store";
import { useSignedIn, useUpdateProfile } from "@/features/shopping/hooks";
import { SignInPrompt } from "@/features/shopping/components/SignInPrompt";
import { ApiError } from "@/lib/api/errors";

const schema = z.object({
  displayName: z.string().trim().max(80, "Keep your name under 80 characters."),
});
type Values = z.infer<typeof schema>;

export default function ProfilePage() {
  const { session } = useSignedIn();
  if (session.status === "loading") return <div aria-hidden="true" className="skeleton h-96 rounded-xl" />;
  if (session.status === "signed-out") return <SignInPrompt what="your profile" />;
  return <ProfileForm displayName={session.account.displayName ?? ""} phone={session.account.phone} email={session.account.email} />;
}

function ProfileForm({ displayName, phone, email }: { displayName: string; phone?: string | null; email?: string | null }) {
  const update = useUpdateProfile();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { displayName } });

  const onSubmit = form.handleSubmit((values) =>
    update.mutate(values.displayName, {
      onSuccess: (account) => {
        setSignedIn(account);
        form.reset({ displayName: account.displayName ?? "" });
      },
      onError: (error) => form.setError("displayName", { message: error instanceof ApiError ? error.message : "Could not save." }),
    }),
  );

  return (
    <div className="flex max-w-xl flex-col gap-8">
      <h1 className="font-display text-4xl text-ink">Profile</h1>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5 rounded-xl bg-white p-6 ring-1 ring-line">
        <div>
          <label htmlFor="displayName" className="block text-sm font-semibold text-ink">
            Your name
          </label>
          <input
            id="displayName"
            autoComplete="name"
            aria-invalid={!!form.formState.errors.displayName}
            {...form.register("displayName")}
            className="mt-1.5 w-full rounded-lg border border-line px-3 py-3 text-ink focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
          />
          {form.formState.errors.displayName && (
            <p role="alert" className="mt-1 text-sm text-terracotta-600">
              {form.formState.errors.displayName.message}
            </p>
          )}
        </div>
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="font-semibold text-ink">Mobile number</dt>
            <dd className="text-ink-soft">{phone ?? "Not added"}</dd>
          </div>
        </dl>
        <p className="text-xs text-ink-soft">You sign in with a one-time code, so there is no password to manage.</p>
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={update.isPending || !form.formState.isDirty}
            className="rounded-md bg-plum px-5 py-3 font-semibold text-champagne-200 transition-all hover:bg-plum-700 active:scale-[0.98] disabled:opacity-60"
          >
            {update.isPending ? "Saving…" : "Save"}
          </button>
          {update.isSuccess && !form.formState.isDirty && (
            <p role="status" className="animate-fade-in text-sm text-[#2f5a40]">
              Saved ✓
            </p>
          )}
        </div>
      </form>
      <EmailSection email={email ?? null} />
    </div>
  );
}

import { Field, inputClass } from "./ui";

type Values = Record<string, string | undefined>;

/** The business profile inputs shared by registration and the profile page. */
export function ProfileFields({
  values = {},
  errors = {},
  emailLocked = false,
}: {
  values?: Values;
  errors?: Record<string, string>;
  /** True on the profile page: the sign-in email cannot be changed there. */
  emailLocked?: boolean;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <fieldset className="sm:col-span-2">
        <legend className="text-sm font-semibold text-ink">Vendor type</legend>
        <div className="mt-2 flex flex-wrap gap-5 text-sm text-ink">
          {[
            ["INDIVIDUAL", "An individual vendor"],
            ["COMPANY", "An event management company or business"],
          ].map(([value, label]) => (
            <label key={value} className="flex items-center gap-2">
              <input type="radio" name="type" value={value} defaultChecked={(values.type ?? "INDIVIDUAL") === value} className="accent-terracotta" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Name or business name" name="name" error={errors.name}>
        <input id="name" name="name" defaultValue={values.name} autoComplete="organization" className={inputClass} />
      </Field>
      <Field label="Email" name="email" error={errors.email} hint={emailLocked ? "Your sign-in email cannot be changed here." : "You will sign in with this."}>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={values.email}
          readOnly={emailLocked}
          autoComplete="email"
          className={`${inputClass} ${emailLocked ? "bg-sand" : ""}`}
        />
      </Field>
      <Field label="Mobile number" name="phone" error={errors.phone} hint="Exactly 10 digits, numbers only, for example 9876543210.">
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={10}
          pattern="[0-9]{10}"
          title="Exactly 10 digits, numbers only"
          defaultValue={values.phone}
          onInput={(e) => {
            e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "").slice(0, 10);
          }}
          className={inputClass}
        />
      </Field>
      <Field label="City" name="city" error={errors.city}>
        <input id="city" name="city" defaultValue={values.city} autoComplete="address-level2" className={inputClass} />
      </Field>
      <Field label="Area (optional)" name="area" error={errors.area}>
        <input id="area" name="area" defaultValue={values.area} className={inputClass} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="About you (optional)" name="about" error={errors.about} hint="Shown to customers on the vendor page once approved.">
          <textarea id="about" name="about" rows={4} defaultValue={values.about} className={inputClass} />
        </Field>
      </div>
    </div>
  );
}

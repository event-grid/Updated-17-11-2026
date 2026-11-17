import type { CatalogueService } from "./catalogue";
import type { ProviderType, ServiceDetails, ServicePackage } from "./store";

export type FormErrors = Record<string, string>;

export const PASSWORD_MIN = 10;

const text = (form: FormData, name: string): string => {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
};

export type ProfileInput = {
  name: string;
  type: ProviderType;
  email: string;
  phone: string;
  city: string;
  area: string;
  about: string;
};

/** Reads and checks the business profile fields shared by registration, admin creation and profile edits. */
export function readProfile(form: FormData): { value: ProfileInput; errors: FormErrors } {
  const type = text(form, "type") === "COMPANY" ? "COMPANY" : "INDIVIDUAL";
  const value: ProfileInput = {
    name: text(form, "name"),
    type,
    email: text(form, "email").toLowerCase(),
    phone: text(form, "phone"),
    city: text(form, "city"),
    area: text(form, "area"),
    about: text(form, "about"),
  };
  const errors: FormErrors = {};
  if (value.name.length < 2 || value.name.length > 120) errors.name = "Enter your name or business name (2 to 120 characters).";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) errors.email = "Enter a valid email address.";
  if (!/^[0-9]{10}$/.test(value.phone)) errors.phone = "Enter exactly 10 digits, numbers only.";
  if (value.city.length < 2) errors.city = "Enter the city you work in.";
  if (value.about.length > 1000) errors.about = "Keep the description under 1000 characters.";
  return { value, errors };
}

export function readPassword(form: FormData, field = "password"): { value: string; error?: string } {
  const value = typeof form.get(field) === "string" ? (form.get(field) as string) : "";
  if (value.length < PASSWORD_MIN) return { value, error: `Use at least ${PASSWORD_MIN} characters.` };
  if (value.length > 128) return { value, error: "Use at most 128 characters." };
  return { value };
}

export function readSelectedServices(form: FormData): string[] {
  return form.getAll("service").filter((v): v is string => typeof v === "string");
}

const PACKAGE_SLOTS = 3;
export const PACKAGE_SLOT_COUNT = PACKAGE_SLOTS;

/** Reads the detail form of one service. Only options and attributes that exist in the catalogue are kept. */
export function readServiceDetails(
  form: FormData,
  current: ServiceDetails,
  catalogue: CatalogueService,
): { value: ServiceDetails; errors: FormErrors } {
  const errors: FormErrors = {};

  const options = form
    .getAll("option")
    .filter((v): v is string => typeof v === "string" && catalogue.options.includes(v));

  const attributes: Record<string, string> = {};
  for (const name of catalogue.attributes) {
    const value = text(form, `attr:${name}`);
    if (value.length > 200) errors[`attr:${name}`] = "Keep this under 200 characters.";
    if (value) attributes[name] = value;
  }

  const priceText = text(form, "startingPrice");
  let startingPriceRupees: number | null = null;
  if (priceText) {
    const price = Number(priceText);
    if (!Number.isFinite(price) || price < 1 || price > 100_000_000) errors.startingPrice = "Enter a price in rupees, 1 or more.";
    else startingPriceRupees = Math.round(price);
  } else {
    errors.startingPrice = "Enter your starting price.";
  }

  const description = text(form, "description");
  if (description.length < 10) errors.description = "Describe this service in at least 10 characters.";
  if (description.length > 1500) errors.description = "Keep the description under 1500 characters.";

  const packages: ServicePackage[] = [];
  for (let i = 1; i <= PACKAGE_SLOTS; i++) {
    const name = text(form, `pkg${i}Name`);
    const priceRaw = text(form, `pkg${i}Price`);
    const packageDescription = text(form, `pkg${i}Description`);
    if (!name && !priceRaw && !packageDescription) continue;
    const price = Number(priceRaw);
    if (!name) errors[`pkg${i}Name`] = "Name this package.";
    if (!Number.isFinite(price) || price < 1) errors[`pkg${i}Price`] = "Enter the package price in rupees.";
    packages.push({ name, priceRupees: Math.round(price) || 0, description: packageDescription.slice(0, 500) });
  }

  return {
    value: {
      ...current,
      options,
      attributes,
      startingPriceRupees,
      priceUnit: text(form, "priceUnit") === "PER_GUEST" ? "PER_GUEST" : "FIXED",
      description,
      packages,
      completed: Object.keys(errors).length === 0,
    },
    errors,
  };
}

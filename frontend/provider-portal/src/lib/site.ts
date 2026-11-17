/**
 * Address of the main customer website, for the "back to EVENTGRID" links. Set CUSTOMER_SITE_URL in production
 * (for example https://www.evntgrid.com); without it, production shows no such links and development uses the
 * local customer site.
 */
export const customerSiteUrl = (
  process.env.CUSTOMER_SITE_URL ?? (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000")
).replace(/\/+$/, "");

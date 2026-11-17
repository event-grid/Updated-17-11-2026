/**
 * Addresses of the other two websites, for the header and footer links. Set CUSTOMER_SITE_URL and
 * PARTNER_PORTAL_URL in production; without them production shows no such links and development uses the local sites.
 */
const dev = process.env.NODE_ENV !== "production";
const clean = (value: string | undefined, devDefault: string) => (value ?? (dev ? devDefault : "")).replace(/\/+$/, "");

export const customerSiteUrl = clean(process.env.CUSTOMER_SITE_URL, "http://localhost:3000");
export const partnerPortalUrl = clean(process.env.PARTNER_PORTAL_URL, "http://localhost:3001");

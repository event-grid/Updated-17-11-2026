/**
 * Where service providers register and sign in (provider-portal, a separate website).
 * Server-side only. Set PARTNER_PORTAL_URL in production (for example https://partner.evntgrid.com); without it,
 * production shows no provider links and development uses the local portal.
 */
const base = (process.env.PARTNER_PORTAL_URL ?? (process.env.NODE_ENV === "production" ? "" : "http://localhost:3001")).replace(/\/+$/, "");

export const partnerLinks = base ? { register: `${base}/register`, login: `${base}/login` } : null;

/** The administration website (admin-portal). Same rule: set ADMIN_PORTAL_URL in production, otherwise no link there. */
const adminBase = (process.env.ADMIN_PORTAL_URL ?? (process.env.NODE_ENV === "production" ? "" : "http://localhost:3002")).replace(/\/+$/, "");

export const adminLoginUrl = adminBase ? `${adminBase}/login` : null;

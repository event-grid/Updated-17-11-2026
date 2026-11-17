import { connection } from "next/server";

import { readSettings } from "@/lib/site-settings";

const NETWORKS = [
  ["instagram", "Instagram"],
  ["facebook", "Facebook"],
  ["youtube", "YouTube"],
  ["x", "X"],
] as const;

/**
 * The footer's social buttons. Each links to the address an administrator set under Site settings; a network with
 * no address yet still shows its button, which stays on the page.
 */
export async function SocialLinks() {
  await connection();
  const { social } = await readSettings();
  return (
    <ul aria-label="Social media" className="flex flex-wrap items-center justify-center gap-2">
      {NETWORKS.map(([key, name]) => {
        const href = social[key];
        return (
          <li key={key}>
            <a
              href={href || "#"}
              target={href ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="inline-flex rounded-full px-3 py-1 text-xs text-champagne-200 ring-1 ring-champagne/30 transition-colors hover:bg-champagne/10 hover:text-white"
            >
              {name}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

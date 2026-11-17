import { connection } from "next/server";

import { hiddenSections, readSettings } from "@/lib/site-settings";

import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

type HeaderProps = React.ComponentProps<typeof SiteHeader>;
type FooterProps = React.ComponentProps<typeof SiteFooter>;

/** The header without the pages an administrator has switched off. */
export async function ConfiguredHeader(props: HeaderProps) {
  await connection();
  return <SiteHeader {...props} hiddenSections={hiddenSections(await readSettings())} />;
}

/** The footer without the pages an administrator has switched off. */
export async function ConfiguredFooter(props: FooterProps) {
  await connection();
  return <SiteFooter {...props} hiddenSections={hiddenSections(await readSettings())} />;
}

import { notFound } from "next/navigation";
import { connection } from "next/server";

import { readSettings, type SectionKey } from "@/lib/site-settings";

/** Put at the top of a page an administrator can switch off: when it is off, the page answers "not found". */
export async function SectionGuard({ section }: { section: SectionKey }) {
  await connection();
  const { sections } = await readSettings();
  if (!sections[section]) notFound();
  return null;
}

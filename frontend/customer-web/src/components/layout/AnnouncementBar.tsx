import { connection } from "next/server";

import { readSettings } from "@/lib/site-settings";

/** The strip at the top of every page. Its text, and whether it shows at all, are set by an administrator. */
export async function AnnouncementBar() {
  await connection();
  const { announcement } = await readSettings();
  if (!announcement.enabled || !announcement.text.trim()) return null;
  return (
    <div className="bg-plum px-4 py-2.5 text-center text-sm tracking-wide text-champagne-200">
      <span aria-hidden="true" className="mr-2 inline-block size-1.5 -translate-y-0.5 rounded-full bg-terracotta" />
      {announcement.text}
    </div>
  );
}

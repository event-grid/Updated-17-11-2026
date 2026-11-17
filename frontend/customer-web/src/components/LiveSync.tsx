import { connection } from "next/server";

import { storeVersion } from "@/lib/provider-store";

import { LiveRefresh } from "./LiveRefresh";

/** Puts live updates on a page: renders the current data version and refreshes the page when it changes. */
export async function LiveSync() {
  await connection();
  return <LiveRefresh version={await storeVersion()} />;
}

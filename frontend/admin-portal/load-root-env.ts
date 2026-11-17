import fs from "node:fs";
import path from "node:path";

/**
 * The project's one settings file is `.env` in the root folder. The frontends need almost none of it (they never
 * see database or payment secrets), so this reads only the names an app asks for and sets them in process.env
 * unless they are already set (a real environment variable always wins). Server-side only: nothing here reaches
 * the browser. The file is optional.
 */
export function loadRootEnv(allowed: string[]): void {
  const file = path.resolve(process.cwd(), "..", "..", ".env");
  let text: string;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    return;
  }
  for (const line of text.split(/\r?\n/)) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!match || !allowed.includes(match[1]) || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}

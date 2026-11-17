#!/usr/bin/env node
/**
 * API contract tool (API_DESIGN.md section 7).
 *
 *   node scripts/development/api-contract.mjs           export + regenerate
 *   node scripts/development/api-contract.mjs --check   fail if the committed contract or client is out of date
 *
 * Needs the backend running (scripts/development/run-backend.ps1). Reads each surface's OpenAPI document
 * from the backend, writes it to backend/openapi/<surface>-v1.json and regenerates the matching
 * frontend client with OpenAPI Generator. The contract and the generated client are committed and never
 * edited by hand. Override the backend address with EVNTGRID_API_BASE_URL.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const API = process.env.EVNTGRID_API_BASE_URL ?? "http://localhost:8080";
const CHECK = process.argv.includes("--check");

/** Surfaces and the frontends that consume them. Add provider with its first endpoints. */
const SURFACES = [
  { name: "public", apps: ["customer-web"] },
  { name: "customer", apps: ["customer-web"] },
  { name: "admin", apps: ["admin-portal"] },
];

let failed = false;

for (const surface of SURFACES) {
  const contractFile = path.join(ROOT, "backend", "openapi", `${surface.name}-v1.json`);
  const contract = await fetchContract(surface.name);

  if (CHECK) {
    const committed = fs.existsSync(contractFile) ? fs.readFileSync(contractFile, "utf8") : "";
    if (committed !== contract) {
      fail(`${rel(contractFile)} is out of date with the running backend. Run: node scripts/development/api-contract.mjs`);
    } else {
      console.log(`ok  ${rel(contractFile)}`);
    }
  } else {
    fs.mkdirSync(path.dirname(contractFile), { recursive: true });
    fs.writeFileSync(contractFile, contract);
    console.log(`wrote ${rel(contractFile)}`);
  }

  for (const app of surface.apps) {
    const appDir = path.join(ROOT, "frontend", app);
    const target = path.join(appDir, "src", "lib", "api", "generated", surface.name);
    if (CHECK) {
      const temp = fs.mkdtempSync(path.join(os.tmpdir(), "evntgrid-client-"));
      generate(appDir, contractFile, temp);
      const diff = compareTrees(target, temp);
      fs.rmSync(temp, { recursive: true, force: true });
      if (diff.length > 0) {
        fail(`${rel(target)} differs from a fresh generation (${diff.slice(0, 5).join(", ")}). Run: node scripts/development/api-contract.mjs`);
      } else {
        console.log(`ok  ${rel(target)}`);
      }
    } else {
      // Generate next to the target, then swap, so a running dev server never sees the folder missing.
      const staging = `${target}.staging`;
      const previous = `${target}.previous`;
      fs.rmSync(staging, { recursive: true, force: true });
      fs.rmSync(previous, { recursive: true, force: true });
      generate(appDir, contractFile, staging);
      if (fs.existsSync(target)) renameWithRetry(target, previous);
      try {
        renameWithRetry(staging, target);
      } catch (error) {
        // Put the previous client back rather than leaving the folder missing.
        if (fs.existsSync(previous) && !fs.existsSync(target)) renameWithRetry(previous, target);
        throw error;
      }
      fs.rmSync(previous, { recursive: true, force: true });
      console.log(`generated ${rel(target)}`);
    }
  }
}

process.exit(failed ? 1 : 0);

async function fetchContract(surface) {
  let response;
  try {
    response = await fetch(`${API}/v3/api-docs/${surface}`);
  } catch {
    console.error(`Cannot reach the backend at ${API}. Start it first: scripts/development/run-backend.ps1`);
    process.exit(2);
  }
  if (!response.ok) {
    console.error(`GET ${API}/v3/api-docs/${surface} returned ${response.status}.`);
    process.exit(2);
  }
  const doc = await response.json();
  // The server URL depends on where the backend runs; clients always pass their own base path.
  doc.servers = [{ url: "/", description: "Clients set their own base URL" }];
  return JSON.stringify(sortKeys(doc), null, 2) + "\n";
}

function generate(appDir, contractFile, outputDir) {
  // Resolved like Node does from the app folder: the package sits in the shared frontend/node_modules
  // (npm workspace) unless the app pins its own version in <app>/node_modules.
  const cli = createRequire(path.join(appDir, "package.json")).resolve("@openapitools/openapi-generator-cli/main.js");
  execFileSync(
    process.execPath,
    [
      // Explicit pin file: without it the CLI may silently fall back to the newest generator release
      // when started from another folder.
      cli, "--openapitools", path.join(appDir, "openapitools.json"),
      "generate",
      "-i", contractFile,
      "-g", "typescript-fetch",
      "-o", outputDir,
      "--additional-properties=supportsES6=true,useSingleRequestParameter=true,enumPropertyNaming=original",
      "--global-property=apiDocs=false,modelDocs=false,apiTests=false,modelTests=false",
    ],
    { cwd: appDir, stdio: ["ignore", "ignore", "inherit"] },
  );
}

/**
 * On Windows a folder rename briefly fails (EPERM, EBUSY) while OneDrive, an antivirus scan or a running dev server
 * still has a file in it open. Retry for a few seconds instead of failing half-way.
 */
function renameWithRetry(from, to) {
  for (let attempt = 1; ; attempt++) {
    try {
      fs.renameSync(from, to);
      return;
    } catch (error) {
      if (attempt >= 20 || !["EPERM", "EBUSY", "EACCES"].includes(error.code)) throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
    }
  }
}

function compareTrees(a, b) {
  const files = (dir) => (fs.existsSync(dir) ? listFiles(dir).map((f) => path.relative(dir, f)).sort() : []);
  const left = files(a);
  const right = files(b);
  const all = [...new Set([...left, ...right])];
  return all.filter((f) => {
    const pa = path.join(a, f);
    const pb = path.join(b, f);
    return !fs.existsSync(pa) || !fs.existsSync(pb) || !fs.readFileSync(pa).equals(fs.readFileSync(pb));
  });
}

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? listFiles(p) : [p];
  });
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((k) => [k, sortKeys(value[k])]));
  }
  return value;
}

function rel(p) {
  return path.relative(ROOT, p).replaceAll("\\", "/");
}

function fail(message) {
  failed = true;
  console.error(`FAIL ${message}`);
}

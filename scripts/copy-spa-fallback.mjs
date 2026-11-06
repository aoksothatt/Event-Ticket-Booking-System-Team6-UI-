import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const source = resolve("dist/index.html");
const targets = ["dist/auth/google/callback/index.html"];

for (const target of targets) {
  const destination = resolve(target);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(source, destination);
}

console.log(`Copied SPA entry to ${targets.length} fallback path(s).`);

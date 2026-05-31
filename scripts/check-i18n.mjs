import fs from "fs";
import path from "path";

const fr = JSON.parse(fs.readFileSync("src/locales/fr.json", "utf8"));

function get(obj, keyPath) {
  return keyPath.split(".").reduce((o, k) => (o != null ? o[k] : undefined), obj);
}

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, files);
    else if (/\.(jsx|js)$/.test(e.name)) files.push(p);
  }
  return files;
}

const keys = new Set();
const routeKeys = new Set();

for (const f of walk("src")) {
  const c = fs.readFileSync(f, "utf8");
  for (const m of c.matchAll(/t\(\s*["']([a-z][a-zA-Z0-9_.]*)["']/g)) keys.add(m[1]);
  for (const m of c.matchAll(/labelKey:\s*["']([^"']+)["']/g)) keys.add(m[1]);
  if (f.includes("AppLayout")) {
    for (const m of c.matchAll(/["'](routes\.[^"']+)["']/g)) routeKeys.add(m[1]);
  }
}

const missing = [];
for (const k of [...keys, ...routeKeys].sort()) {
  if (k.includes("${") || !k.includes(".")) continue;
  const val = get(fr, k);
  if (val === undefined || val === null) missing.push(k);
  else if (typeof val === "object") missing.push(`${k} (is object, expected string)`);
}

console.log(`Checked ${keys.size + routeKeys.size} keys`);
if (missing.length === 0) {
  console.log("All keys OK");
} else {
  console.log(`Missing or invalid (${missing.length}):`);
  missing.forEach((k) => console.log(" -", k));
  process.exit(1);
}

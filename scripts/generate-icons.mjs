import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(path.join(root, "public", "app-icon.svg"));

for (const size of [192, 512]) {
  await sharp(svg, { density: Math.ceil((size / 512) * 72 * 4) })
    .resize(size, size)
    .png()
    .toFile(path.join(root, "public", `icon-${size}.png`));
  console.log(`Wrote public/icon-${size}.png`);
}

/**
 * Build src/data/rdcTerritories.json from MoH health-zone shapefile attributes.
 * Source: INRB-UMIE/BDBV2026-Data (HDX / DRC health zones, 519 features).
 *
 * Run: node scripts/build-rdc-territories.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DBF_URL =
  "https://github.com/INRB-UMIE/BDBV2026-Data/raw/main/data/shapefiles/DRC_Health_zones.dbf";
const DBF_LOCAL = path.join(__dirname, "_zones.dbf");
const OUT = path.join(__dirname, "../src/data/rdcTerritories.json");
const REGISTRY_OUT = path.join(
  __dirname,
  "../convex/lib/rdcTerritoryRegistry.ts"
);

/** Canonical 26 provinces — stable ids used in the app. */
const PROVINCE_CANONICAL = [
  { id: "bas-uélé", labelFr: "Bas-Uélé", labelEn: "Bas-Uélé" },
  { id: "équateur", labelFr: "Équateur", labelEn: "Équateur" },
  { id: "haut-katanga", labelFr: "Haut-Katanga", labelEn: "Haut-Katanga" },
  { id: "haut-lomami", labelFr: "Haut-Lomami", labelEn: "Haut-Lomami" },
  { id: "haut-uélé", labelFr: "Haut-Uélé", labelEn: "Haut-Uélé" },
  { id: "ituri", labelFr: "Ituri", labelEn: "Ituri" },
  { id: "kasaï", labelFr: "Kasaï", labelEn: "Kasaï" },
  { id: "kasaï-central", labelFr: "Kasaï-Central", labelEn: "Kasaï-Central" },
  { id: "kasaï-oriental", labelFr: "Kasaï-Oriental", labelEn: "Kasaï-Oriental" },
  { id: "kinshasa", labelFr: "Kinshasa", labelEn: "Kinshasa" },
  { id: "kongo-central", labelFr: "Kongo Central", labelEn: "Kongo Central" },
  { id: "kwango", labelFr: "Kwango", labelEn: "Kwango" },
  { id: "kwilu", labelFr: "Kwilu", labelEn: "Kwilu" },
  { id: "lomami", labelFr: "Lomami", labelEn: "Lomami" },
  { id: "lualaba", labelFr: "Lualaba", labelEn: "Lualaba" },
  { id: "maï-ndombe", labelFr: "Mai-Ndombe", labelEn: "Mai-Ndombe" },
  { id: "maniema", labelFr: "Maniema", labelEn: "Maniema" },
  { id: "mongala", labelFr: "Mongala", labelEn: "Mongala" },
  { id: "nord-kivu", labelFr: "Nord-Kivu", labelEn: "North Kivu" },
  { id: "nord-ubangi", labelFr: "Nord-Ubangi", labelEn: "Nord-Ubangi" },
  { id: "sankuru", labelFr: "Sankuru", labelEn: "Sankuru" },
  { id: "sud-kivu", labelFr: "Sud-Kivu", labelEn: "South Kivu" },
  { id: "sud-ubangi", labelFr: "Sud-Ubangi", labelEn: "Sud-Ubangi" },
  { id: "tanganyika", labelFr: "Tanganyika", labelEn: "Tanganyika" },
  { id: "tshopo", labelFr: "Tshopo", labelEn: "Tshopo" },
  { id: "tshuapa", labelFr: "Tshuapa", labelEn: "Tshuapa" },
];

const PROVINCE_ALIASES = {
  "bas uele": "bas-uélé",
  "bas-uele": "bas-uélé",
  "equateur": "équateur",
  "haut katanga": "haut-katanga",
  "haut lomami": "haut-lomami",
  "haut uele": "haut-uélé",
  "haut-uele": "haut-uélé",
  "kasai": "kasaï",
  "kasai-central": "kasaï-central",
  "kasai-oriental": "kasaï-oriental",
  "kongo central": "kongo-central",
  "mai-ndombe": "maï-ndombe",
  "mai ndombe": "maï-ndombe",
  "nord kivu": "nord-kivu",
  "nord ubangi": "nord-ubangi",
  "sud kivu": "sud-kivu",
  "sud ubangi": "sud-ubangi",
};

function normalizeKey(s) {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function resolveProvinceId(raw) {
  const key = normalizeKey(raw);
  if (PROVINCE_ALIASES[key]) return PROVINCE_ALIASES[key];
  const byId = PROVINCE_CANONICAL.find((p) => normalizeKey(p.id) === key);
  if (byId) return byId.id;
  const byLabel = PROVINCE_CANONICAL.find(
    (p) => normalizeKey(p.labelFr) === key || normalizeKey(p.labelEn) === key
  );
  if (byLabel) return byLabel.id;
  return null;
}

function slugZoneId(provinceId, name, code) {
  const base = (code || name)
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${provinceId}__${base}`;
}

function parseDbf(buffer) {
  const numRecords = buffer.readUInt32LE(4);
  const headerLength = buffer.readUInt16LE(8);
  const recordLength = buffer.readUInt16LE(10);
  let offset = 32;
  const fields = [];
  while (buffer[offset] !== 0x0d) {
    const name = buffer
      .slice(offset, offset + 11)
      .toString("ascii")
      .replace(/\0/g, "")
      .trim();
    const length = buffer[offset + 16];
    fields.push({ name, length });
    offset += 32;
  }
  const dataStart = headerLength;
  const rows = [];
  for (let i = 0; i < numRecords; i++) {
    const recStart = dataStart + i * recordLength;
    if (buffer[recStart] === 0x2a) continue;
    let pos = recStart + 1;
    const row = {};
    for (const field of fields) {
      const raw = buffer
        .slice(pos, pos + field.length)
        .toString("utf8")
        .trim();
      row[field.name] = raw;
      pos += field.length;
    }
    rows.push(row);
  }
  return rows;
}

async function ensureDbf() {
  if (!fs.existsSync(DBF_LOCAL)) {
    const res = await fetch(DBF_URL);
    if (!res.ok) throw new Error(`Failed to download DBF: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(DBF_LOCAL, buf);
  }
  return fs.readFileSync(DBF_LOCAL);
}

async function main() {
  const buffer = await ensureDbf();
  const rows = parseDbf(buffer);
  const provinceMap = new Map(PROVINCE_CANONICAL.map((p) => [p.id, { ...p, zones: [] }]));
  const unmatchedProvinces = new Set();

  for (const row of rows) {
    const provinceRaw = row.PROVINCE || "";
    const provinceId = resolveProvinceId(provinceRaw);
    if (!provinceId) {
      unmatchedProvinces.add(provinceRaw);
      continue;
    }
    const name = (row.Nom || "").trim();
    const code = (row.ZSCode || "").trim();
    if (!name) continue;
    const id = slugZoneId(provinceId, name, code);
    provinceMap.get(provinceId).zones.push({
      id,
      labelFr: name,
      labelEn: name,
      code: code || undefined,
    });
  }

  if (unmatchedProvinces.size > 0) {
    console.warn("Unmatched province labels:", [...unmatchedProvinces]);
  }

  const provinces = PROVINCE_CANONICAL.map((p) => {
    const entry = provinceMap.get(p.id);
    entry.zones.sort((a, b) => a.labelFr.localeCompare(b.labelFr, "fr"));
    return {
      id: p.id,
      labelFr: p.labelFr,
      labelEn: p.labelEn,
      zones: entry.zones,
    };
  });

  const totalZones = provinces.reduce((n, p) => n + p.zones.length, 0);

  const output = {
    version: 1,
    source:
      "INRB-UMIE/BDBV2026-Data — DRC_Health_zones.shp (519 zones, MoH / HDX)",
    builtAt: new Date().toISOString(),
    provinces,
    meta: {
      provinceCount: provinces.length,
      zoneCount: totalZones,
    },
  };

  fs.writeFileSync(OUT, JSON.stringify(output, null, 2) + "\n");

  const zoneIdsByProvince = Object.fromEntries(
    provinces.map((p) => [p.id, p.zones.map((z) => z.id)])
  );
  const registryTs = `/** Auto-generated by scripts/build-rdc-territories.mjs — do not edit. */
export const RDC_PROVINCE_IDS = ${JSON.stringify(
    provinces.map((p) => p.id),
    null,
    2
  )} as const;

export const RDC_ZONE_IDS_BY_PROVINCE: Record<string, readonly string[]> = ${JSON.stringify(
    zoneIdsByProvince,
    null,
    2
  )};
`;
  fs.writeFileSync(REGISTRY_OUT, registryTs);

  console.log(`Written ${OUT}`);
  console.log(`Written ${REGISTRY_OUT}`);
  console.log(`Provinces: ${provinces.length}, Zones: ${totalZones}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

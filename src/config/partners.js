/**
 * Partner logos for the auth marquee — auto-loaded from `src/assets/partners/`.
 * Add svg/png/jpg/webp files to that folder (one brand per normalized id).
 */

const logoModules = import.meta.glob("../assets/partners/*.{svg,png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
  query: "?url",
});

const EXT_PRIORITY = { svg: 0, png: 1, webp: 2, jpg: 3, jpeg: 4 };

/** Display names / alt text by normalized id (filename without extension, `-logo` stripped). */
const PARTNER_META = {
  cdc: {
    name: "CDC",
    logoAlt: "Centers for Disease Control and Prevention",
  },
  "gates-foundation": {
    name: "Fondation Gates",
    logoAlt: "Fondation Bill & Melinda Gates",
  },
  oim: {
    name: "OIM",
    logoAlt: "Organisation internationale pour les migrations",
  },
  oms: {
    name: "OMS",
    logoAlt: "Organisation mondiale de la Santé",
  },
  path: {
    name: "PATH",
    logoAlt: "PATH",
  },
  rdc: {
    name: "RDC",
    logoAlt: "République démocratique du Congo",
  },
  rotary: {
    name: "Rotary",
    logoAlt: "Rotary International",
  },
  "solina-center": {
    name: "Solina Center",
    logoAlt: "Solina Center",
  },
  unicef: {
    name: "UNICEF",
    logoAlt: "UNICEF",
  },
  "village-reach": {
    name: "VillageReach",
    logoAlt: "VillageReach",
  },
};

function stemFromPath(path) {
  const file = path.split("/").pop() ?? "";
  return file.replace(/\.[^.]+$/, "");
}

function extensionFromPath(path) {
  const match = path.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : "";
}

/** `oms-logo` and `oms` → `oms` so we keep one asset per partner. */
function normalizePartnerId(stem) {
  return stem.replace(/-logo$/i, "").toLowerCase();
}

function defaultNameFromStem(stem) {
  return stem
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function pickBestLogoPerPartner(entries) {
  const byId = new Map();

  for (const [path, logo] of entries) {
    const stem = stemFromPath(path);
    const id = normalizePartnerId(stem);
    const ext = extensionFromPath(path);
    const priority = EXT_PRIORITY[ext] ?? 99;
    const existing = byId.get(id);

    if (!existing || priority < existing.priority) {
      byId.set(id, { id, logo, priority, stem });
    }
  }

  return [...byId.values()];
}

const resolved = pickBestLogoPerPartner(Object.entries(logoModules));

export const PARTNERS = resolved
  .map(({ id, logo }) => {
    const meta = PARTNER_META[id];
    return {
      id,
      name: meta?.name ?? defaultNameFromStem(id),
      logo,
      logoAlt: meta?.logoAlt ?? meta?.name ?? defaultNameFromStem(id),
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name, "fr"));

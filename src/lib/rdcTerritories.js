import territoriesData from "../data/rdcTerritories.json";

/** @typedef {{ id: string, labelFr: string, labelEn: string, code?: string }} RdcZone */
/** @typedef {{ id: string, labelFr: string, labelEn: string, zones: RdcZone[] }} RdcProvince */

/** @type {{ provinces: RdcProvince[] }} */
export const RDC_TERRITORIES = territoriesData;

export const RDC_PROVINCES = territoriesData.provinces;

export function getProvinceById(provinceId) {
  return RDC_PROVINCES.find((p) => p.id === provinceId) ?? null;
}

export function getZoneById(provinceId, zoneId) {
  const province = getProvinceById(provinceId);
  if (!province) return null;
  return province.zones.find((z) => z.id === zoneId) ?? null;
}

export function getProvinceLabel(provinceId, lang = "fr") {
  const p = getProvinceById(provinceId);
  if (!p) return provinceId ?? "—";
  return lang === "en" ? p.labelEn : p.labelFr;
}

export function getZoneLabel(provinceId, zoneId, lang = "fr") {
  const z = getZoneById(provinceId, zoneId);
  if (!z) return zoneId ?? "—";
  return lang === "en" ? z.labelEn : z.labelFr;
}

/** Find a zone (and its province) when only the zone id is known. */
export function findZoneAcrossProvinces(zoneId) {
  if (!zoneId) return null;
  for (const province of RDC_PROVINCES) {
    const zone = province.zones.find((z) => z.id === zoneId);
    if (zone) return { province, zone };
  }
  return null;
}

/** Resolved display labels for admin/profile views. */
export function getLearnerTerritoryLabels(
  { learnerProvinceId, learnerHealthZoneId },
  lang = "fr"
) {
  let provinceLabel = null;
  let healthZoneLabel = null;

  if (learnerProvinceId && getProvinceById(learnerProvinceId)) {
    provinceLabel = getProvinceLabel(learnerProvinceId, lang);
  }

  if (learnerHealthZoneId) {
    if (learnerProvinceId && getZoneById(learnerProvinceId, learnerHealthZoneId)) {
      healthZoneLabel = getZoneLabel(
        learnerProvinceId,
        learnerHealthZoneId,
        lang
      );
    } else {
      const found = findZoneAcrossProvinces(learnerHealthZoneId);
      if (found) {
        healthZoneLabel =
          lang === "en" ? found.zone.labelEn : found.zone.labelFr;
        if (!provinceLabel) {
          provinceLabel =
            lang === "en" ? found.province.labelEn : found.province.labelFr;
        }
      }
    }
  }

  return { provinceLabel, healthZoneLabel };
}

export function formatLearnerTerritory(
  { learnerCategoryKey, learnerProvinceId, learnerHealthZoneId },
  lang = "fr"
) {
  if (!learnerCategoryKey) return "—";
  if (learnerCategoryKey === "national") return null;
  if (learnerCategoryKey === "provincial" && learnerProvinceId) {
    return getProvinceLabel(learnerProvinceId, lang);
  }
  if (learnerCategoryKey === "zonal" && learnerProvinceId && learnerHealthZoneId) {
    const zone = getZoneLabel(learnerProvinceId, learnerHealthZoneId, lang);
    const prov = getProvinceLabel(learnerProvinceId, lang);
    return `${zone} (${prov})`;
  }
  return null;
}

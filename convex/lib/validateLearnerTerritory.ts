import type { LearnerCategoryKey } from "./learnerCategories";
import {
  RDC_PROVINCE_IDS,
  RDC_ZONE_IDS_BY_PROVINCE,
} from "./rdcTerritoryRegistry";

const provinceSet = new Set<string>(RDC_PROVINCE_IDS);

export type LearnerTerritoryFields = {
  learnerProvinceId?: string;
  learnerHealthZoneId?: string;
};

export function resolveLearnerTerritory(
  category: LearnerCategoryKey,
  provinceId?: string,
  healthZoneId?: string
): LearnerTerritoryFields {
  if (category === "national") {
    return {
      learnerProvinceId: undefined,
      learnerHealthZoneId: undefined,
    };
  }

  if (category === "provincial") {
    if (!provinceId || !provinceSet.has(provinceId)) {
      throw new Error("Veuillez sélectionner une province valide.");
    }
    return {
      learnerProvinceId: provinceId,
      learnerHealthZoneId: undefined,
    };
  }

  // zonal
  if (!provinceId || !provinceSet.has(provinceId)) {
    throw new Error("Veuillez sélectionner une province valide.");
  }
  if (!healthZoneId) {
    throw new Error("Veuillez sélectionner une zone de santé.");
  }
  const zones = RDC_ZONE_IDS_BY_PROVINCE[provinceId];
  if (!zones?.includes(healthZoneId)) {
    throw new Error("La zone de santé ne correspond pas à la province sélectionnée.");
  }
  return {
    learnerProvinceId: provinceId,
    learnerHealthZoneId: healthZoneId,
  };
}

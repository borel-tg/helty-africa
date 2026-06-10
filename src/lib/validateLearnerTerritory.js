import { getProvinceById, getZoneById } from "./rdcTerritories";

/**
 * Client-side validation for learner territory fields.
 * Returns error keys matching form field names.
 */
export function validateLearnerTerritoryFields(categoryKey, provinceId, healthZoneId) {
  const errors = {};
  if (!categoryKey) {
    errors.learnerCategoryKey = true;
    return errors;
  }
  if (categoryKey === "national") return errors;

  if (!provinceId || !getProvinceById(provinceId)) {
    errors.learnerProvinceId = true;
  }

  if (categoryKey === "zonal") {
    if (!healthZoneId || !getZoneById(provinceId, healthZoneId)) {
      errors.learnerHealthZoneId = true;
    }
  }

  return errors;
}

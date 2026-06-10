import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Select } from "../ui/Input";
import { SearchableSelect } from "../ui/SearchableSelect";
import { LEARNER_CATEGORIES } from "../../lib/learnerCategories";
import { RDC_PROVINCES } from "../../lib/rdcTerritories";

/**
 * Category + conditional province / health zone pickers for learner accounts.
 */
export function LearnerTerritoryFields({
  categoryKey,
  provinceId,
  healthZoneId,
  onCategoryChange,
  onProvinceChange,
  onHealthZoneChange,
  errors = {},
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith("en") ? "en" : "fr";

  const provinceOptions = useMemo(
    () =>
      RDC_PROVINCES.map((p) => ({
        value: p.id,
        label: lang === "en" ? p.labelEn : p.labelFr,
        searchText: `${p.labelFr} ${p.labelEn}`,
      })),
    [lang]
  );

  const zoneOptions = useMemo(() => {
    const province = RDC_PROVINCES.find((p) => p.id === provinceId);
    if (!province) return [];
    return province.zones.map((z) => ({
      value: z.id,
      label: z.code ? `${z.labelFr} (${z.code})` : z.labelFr,
      searchText: `${z.labelFr} ${z.code ?? ""}`,
    }));
  }, [provinceId]);

  useEffect(() => {
    if (categoryKey === "national") {
      if (provinceId) onProvinceChange("");
      if (healthZoneId) onHealthZoneChange("");
      return;
    }
    if (categoryKey === "provincial" && healthZoneId) {
      onHealthZoneChange("");
    }
  }, [categoryKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!provinceId || !healthZoneId) return;
    const valid = zoneOptions.some((z) => z.value === healthZoneId);
    if (!valid) onHealthZoneChange("");
  }, [provinceId, healthZoneId, zoneOptions, onHealthZoneChange]);

  return (
    <>
      <Select
        label={`${t("auth.learnerCategory")} *`}
        value={categoryKey}
        onChange={(e) => onCategoryChange(e.target.value)}
        error={errors.learnerCategoryKey}
        required
      >
        <option value="" disabled>
          {t("auth.selectCategory")}
        </option>
        {LEARNER_CATEGORIES.map((c) => (
          <option key={c.key} value={c.key}>
            {lang === "en" ? c.labelEn : c.labelFr}
          </option>
        ))}
      </Select>

      {categoryKey === "provincial" && (
        <SearchableSelect
          label={t("auth.province")}
          value={provinceId}
          onChange={onProvinceChange}
          options={provinceOptions}
          placeholder={t("auth.selectProvince")}
          searchPlaceholder={t("auth.searchProvince")}
          emptyMessage={t("auth.noProvinceMatch")}
          error={errors.learnerProvinceId}
          required
        />
      )}

      {categoryKey === "zonal" && (
        <>
          <SearchableSelect
            label={t("auth.province")}
            value={provinceId}
            onChange={onProvinceChange}
            options={provinceOptions}
            placeholder={t("auth.selectProvince")}
            searchPlaceholder={t("auth.searchProvince")}
            emptyMessage={t("auth.noProvinceMatch")}
            error={errors.learnerProvinceId}
            required
          />
          <SearchableSelect
            label={t("auth.healthZone")}
            value={healthZoneId}
            onChange={onHealthZoneChange}
            options={zoneOptions}
            placeholder={
              provinceId ? t("auth.selectHealthZone") : t("auth.selectProvinceFirst")
            }
            searchPlaceholder={t("auth.searchHealthZone")}
            emptyMessage={t("auth.noHealthZoneMatch")}
            error={errors.learnerHealthZoneId}
            disabled={!provinceId}
            required
          />
        </>
      )}
    </>
  );
}

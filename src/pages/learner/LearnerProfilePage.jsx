import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "convex/react";
import { User } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../hooks/useAuth";
import { LearnerTerritoryFields } from "../../components/auth/LearnerTerritoryFields";
import { validateLearnerTerritoryFields } from "../../lib/validateLearnerTerritory";
import {
  DRC_COUNTRY_CODE,
  formatDrcPhoneInput,
  formatStoredDrcPhone,
  isValidDrcPhone,
  normalizeDrcPhone,
} from "../../lib/phoneDrc";
import { splitFullName } from "../../lib/splitName";
import {
  clearFormFieldError,
  clearFormFieldErrors,
} from "../../lib/formErrors";

export default function LearnerProfilePage() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const { currentUser } = useAuth();
  const updateProfile = useMutation(api.users.updateMyProfile);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState(DRC_COUNTRY_CODE + " ");
  const [learnerCategoryKey, setLearnerCategoryKey] = useState("zonal");
  const [learnerProvinceId, setLearnerProvinceId] = useState("");
  const [learnerHealthZoneId, setLearnerHealthZoneId] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const { firstName: fn, lastName: ln } = splitFullName(currentUser.name);
    setFirstName(fn);
    setLastName(ln);
    setPhone(formatStoredDrcPhone(currentUser.phone));
    setLearnerCategoryKey(currentUser.learnerCategoryKey || "zonal");
    setLearnerProvinceId(currentUser.learnerProvinceId || "");
    setLearnerHealthZoneId(currentUser.learnerHealthZoneId || "");
  }, [
    currentUser?._id,
    currentUser?.name,
    currentUser?.phone,
    currentUser?.learnerCategoryKey,
    currentUser?.learnerProvinceId,
    currentUser?.learnerHealthZoneId,
  ]);

  const validate = () => {
    const next = {};
    if (!firstName.trim()) next.firstName = t("auth.firstNameRequired");
    if (!lastName.trim()) next.lastName = t("auth.lastNameRequired");
    if (!isValidDrcPhone(phone)) next.phone = t("auth.phoneInvalidDrc");
    const territoryErrs = validateLearnerTerritoryFields(
      learnerCategoryKey,
      learnerProvinceId,
      learnerHealthZoneId
    );
    if (territoryErrs.learnerCategoryKey) {
      next.learnerCategoryKey = t("auth.categoryRequired");
    }
    if (territoryErrs.learnerProvinceId) {
      next.learnerProvinceId = t("auth.provinceRequired");
    }
    if (territoryErrs.learnerHealthZoneId) {
      next.learnerHealthZoneId = t("auth.healthZoneRequired");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: normalizeDrcPhone(phone),
        learnerCategoryKey,
        learnerProvinceId: learnerProvinceId || undefined,
        learnerHealthZoneId: learnerHealthZoneId || undefined,
      });
      toast.success(t("learner.profileSaved"));
    } catch (err) {
      toast.error(err.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="p-6 text-sm text-text-secondary">{t("common.loading")}</div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">
          {t("learner.profileTitle")}
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          {t("learner.profileSubtitle")}
        </p>
      </div>

      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <User size={20} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {currentUser.name || "—"}
            </p>
            <p className="text-xs text-text-secondary truncate">
              {currentUser.email}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={`${t("auth.firstName")} *`}
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                clearFormFieldError(setErrors, "firstName");
              }}
              error={errors.firstName}
              autoComplete="given-name"
            />
            <Input
              label={`${t("auth.lastName")} *`}
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                clearFormFieldError(setErrors, "lastName");
              }}
              error={errors.lastName}
              autoComplete="family-name"
            />
          </div>

          <Input
            label={`${t("auth.phone")} *`}
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(formatDrcPhoneInput(e.target.value));
              clearFormFieldError(setErrors, "phone");
            }}
            error={errors.phone}
            helperText={t("auth.phoneHelperDrc")}
            autoComplete="tel"
          />

          <LearnerTerritoryFields
            categoryKey={learnerCategoryKey}
            provinceId={learnerProvinceId}
            healthZoneId={learnerHealthZoneId}
            onCategoryChange={(v) => {
              setLearnerCategoryKey(v);
              clearFormFieldErrors(setErrors, [
                "learnerCategoryKey",
                "learnerProvinceId",
                "learnerHealthZoneId",
              ]);
            }}
            onProvinceChange={(v) => {
              setLearnerProvinceId(v);
              clearFormFieldErrors(setErrors, [
                "learnerProvinceId",
                "learnerHealthZoneId",
              ]);
            }}
            onHealthZoneChange={(v) => {
              setLearnerHealthZoneId(v);
              clearFormFieldError(setErrors, "learnerHealthZoneId");
            }}
            errors={errors}
          />

          <p className="text-xs text-text-secondary">{t("learner.profileCategoryHint")}</p>

          <div className="flex justify-end pt-2">
            <Button type="submit" loading={saving}>
              {t("common.saveChanges")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

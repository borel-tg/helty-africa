import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "convex/react";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../hooks/useAuth";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { LearnerTerritoryFields } from "../../components/auth/LearnerTerritoryFields";
import { validateLearnerTerritoryFields } from "../../lib/validateLearnerTerritory";
import {
  DRC_COUNTRY_CODE,
  formatDrcPhoneInput,
  isValidDrcPhone,
  normalizeDrcPhone,
} from "../../lib/phoneDrc";
import {
  clearFormFieldError,
  clearFormFieldErrors,
} from "../../lib/formErrors";

export default function RegisterPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const invitation = useQuery(
    api.invitations.getPublicByToken,
    token ? { token } : "skip"
  );
  const completeRegistration = useMutation(api.invitations.completeRegistration);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: DRC_COUNTRY_CODE + " ",
    learnerCategoryKey: "",
    learnerProvinceId: "",
    learnerHealthZoneId: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setStep("invalid");
      return;
    }
    if (invitation === undefined) return;
    if (invitation.status === "valid") {
      setStep("register");
      if (
        invitation.role === "learner" ||
        invitation.role === "lead"
      ) {
        setForm((prev) => ({
          ...prev,
          learnerCategoryKey: prev.learnerCategoryKey || "zonal",
        }));
      }
    } else setStep("invalid");
  }, [token, invitation]);

  const update = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    clearFormFieldError(setErrors, field);
    if (field === "password") {
      clearFormFieldError(setErrors, "confirmPassword");
    }
  };

  const handlePhoneChange = (e) => {
    setForm((prev) => ({
      ...prev,
      phone: formatDrcPhoneInput(e.target.value),
    }));
    clearFormFieldError(setErrors, "phone");
  };

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = t("auth.firstNameRequired");
    if (!form.lastName.trim()) errs.lastName = t("auth.lastNameRequired");
    if (!isValidDrcPhone(form.phone)) errs.phone = t("auth.phoneInvalidDrc");
    if (invitation?.role === "learner" || invitation?.role === "lead") {
      const territoryErrs = validateLearnerTerritoryFields(
        form.learnerCategoryKey,
        form.learnerProvinceId,
        form.learnerHealthZoneId
      );
      if (territoryErrs.learnerCategoryKey) {
        errs.learnerCategoryKey = t("auth.categoryRequired");
      }
      if (territoryErrs.learnerProvinceId) {
        errs.learnerProvinceId = t("auth.provinceRequired");
      }
      if (territoryErrs.learnerHealthZoneId) {
        errs.learnerHealthZoneId = t("auth.healthZoneRequired");
      }
    }
    if (!form.password) errs.password = t("auth.passwordRequired");
    else if (form.password.length < 8) errs.password = t("auth.passwordMin");
    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = t("auth.passwordsMismatch");
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const phone = normalizeDrcPhone(form.phone);
      const result = await completeRegistration({
        token,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: phone ?? form.phone.trim(),
        password: form.password,
        learnerCategoryKey:
          invitation?.role === "learner" || invitation?.role === "lead"
            ? form.learnerCategoryKey
            : undefined,
        learnerProvinceId:
          (invitation?.role === "learner" || invitation?.role === "lead") &&
          form.learnerProvinceId
            ? form.learnerProvinceId
            : undefined,
        learnerHealthZoneId:
          (invitation?.role === "learner" || invitation?.role === "lead") &&
          form.learnerHealthZoneId
            ? form.learnerHealthZoneId
            : undefined,
      });

      setStep("success");
      const email = result.user.email;
      setTimeout(async () => {
        const loginResult = await login(email, form.password);
        if (loginResult.success) {
          if (result.user.role === "learner") navigate("/learn");
          else if (result.user.role === "lead") navigate("/lead/learners");
          else navigate("/admin");
        }
      }, 1200);
    } catch (err) {
      setErrors({ form: err.message ?? t("common.error") });
    } finally {
      setLoading(false);
    }
  };

  if (!token || invitation === undefined || step === null) {
    return (
      <AuthLayout title={t("common.loading")} showFooter={false}>
        <p className="text-center text-sm text-text-secondary">{t("common.loading")}</p>
      </AuthLayout>
    );
  }

  if (step === "invalid") {
    const subtitle =
      invitation?.status === "used"
        ? t("auth.invitationUsed")
        : invitation?.status === "expired"
          ? t("auth.invitationExpired")
          : t("auth.invalidInvitationDesc");
    return (
      <AuthLayout
        title={t("auth.invalidInvitation")}
        subtitle={subtitle}
        showFooter={false}
      >
        <div className="text-center py-2">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl font-bold">!</span>
          </div>
          <Link
            to="/login"
            className="text-sm text-primary hover:underline font-medium"
          >
            {t("auth.backToLogin")}
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (step === "success") {
    return (
      <AuthLayout
        title={t("auth.accountCreatedTitle")}
        subtitle={t("auth.accountCreatedDesc")}
        showFooter={false}
      >
        <div className="text-center py-2">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle size={32} className="text-green-500" />
          </div>
        </div>
      </AuthLayout>
    );
  }

  const showTerritoryFields =
    invitation?.role === "learner" || invitation?.role === "lead";

  return (
    <AuthLayout
      title={t("auth.completeAccount")}
      subtitle={
        invitation.organizationName
          ? t("auth.invitedToOrg", { org: invitation.organizationName })
          : t("auth.invitedSubtitle")
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label={t("auth.email")}
          type="email"
          value={invitation.email}
          readOnly
          disabled
          className="rounded-xl bg-gray-50"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={`${t("auth.firstName")} *`}
            value={form.firstName}
            onChange={update("firstName")}
            error={errors.firstName}
            autoComplete="given-name"
            className="rounded-xl"
          />
          <Input
            label={`${t("auth.lastName")} *`}
            value={form.lastName}
            onChange={update("lastName")}
            error={errors.lastName}
            autoComplete="family-name"
            className="rounded-xl"
          />
        </div>

        <Input
          label={`${t("auth.phone")} *`}
          type="tel"
          value={form.phone}
          onChange={handlePhoneChange}
          error={errors.phone}
          helperText={t("auth.phoneHelperDrc")}
          autoComplete="tel"
          className="rounded-xl"
        />

        {showTerritoryFields && (
          <div className="space-y-4">
            <LearnerTerritoryFields
              categoryKey={form.learnerCategoryKey}
              provinceId={form.learnerProvinceId}
              healthZoneId={form.learnerHealthZoneId}
              onCategoryChange={(v) => {
                setForm((prev) => ({ ...prev, learnerCategoryKey: v }));
                clearFormFieldErrors(setErrors, [
                  "learnerCategoryKey",
                  "learnerProvinceId",
                  "learnerHealthZoneId",
                ]);
              }}
              onProvinceChange={(v) => {
                setForm((prev) => ({ ...prev, learnerProvinceId: v }));
                clearFormFieldErrors(setErrors, [
                  "learnerProvinceId",
                  "learnerHealthZoneId",
                ]);
              }}
              onHealthZoneChange={(v) => {
                setForm((prev) => ({ ...prev, learnerHealthZoneId: v }));
                clearFormFieldError(setErrors, "learnerHealthZoneId");
              }}
              errors={errors}
            />
            <p className="text-xs text-text-secondary">
              {t("learner.profileCategoryHint")}
            </p>
          </div>
        )}

        <Input
          label={t("auth.password")}
          type={showPassword ? "text" : "password"}
          placeholder={t("auth.passwordMin")}
          value={form.password}
          onChange={update("password")}
          error={errors.password}
          autoComplete="new-password"
          className="rounded-xl"
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <Input
          label={t("auth.confirmPassword")}
          type={showPassword ? "text" : "password"}
          value={form.confirmPassword}
          onChange={update("confirmPassword")}
          error={errors.confirmPassword}
          autoComplete="new-password"
          className="rounded-xl"
        />

        {errors.form && (
          <p className="text-sm text-red-600 text-center">{errors.form}</p>
        )}

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={loading}
          className="rounded-xl"
        >
          {t("auth.createAndStart")}
        </Button>
      </form>
    </AuthLayout>
  );
}

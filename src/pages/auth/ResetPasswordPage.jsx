import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, CheckCircle, Eye, EyeOff, Lock } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../hooks/useAuth";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { clearFormFieldError } from "../../lib/formErrors";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const navigate = useNavigate();
  const { login } = useAuth();
  const completeReset = useMutation(api.passwordReset.completeReset);

  const [done, setDone] = useState(false);

  const resetInfo = useQuery(
    api.passwordReset.getPublicByToken,
    done || !token ? "skip" : { token }
  );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(null);

  useEffect(() => {
    if (done) return;
    if (!token) {
      setStep("invalid");
      return;
    }
    if (resetInfo === undefined) return;
    if (resetInfo.status === "valid") setStep("form");
    else setStep("invalid");
  }, [token, resetInfo, done]);

  const validate = () => {
    const errs = {};
    if (!password) errs.password = t("auth.passwordRequired");
    else if (password.length < 8) errs.password = t("auth.passwordMin");
    if (password !== confirmPassword) {
      errs.confirmPassword = t("auth.passwordsMismatch");
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const result = await completeReset({ token, password });
      setDone(true);
      if (result.success && result.email) {
        await login(result.email, password);
      }
      navigate("/", { replace: true });
    } catch (err) {
      setErrors({ form: err.message || t("common.error") });
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthLayout title={t("auth.resetSuccessTitle")} showFooter={false}>
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle size={28} className="text-green-500" />
          </div>
          <p className="text-text-secondary text-sm">{t("auth.resetSuccessDesc")}</p>
        </div>
      </AuthLayout>
    );
  }

  if (step === null) {
    return (
      <AuthLayout title={t("common.loading")} showFooter={false}>
        <p className="text-center text-text-secondary">{t("common.loading")}</p>
      </AuthLayout>
    );
  }

  if (step === "invalid") {
    const messageKey =
      resetInfo?.status === "used"
        ? "auth.resetLinkUsed"
        : resetInfo?.status === "expired"
          ? "auth.resetLinkExpired"
          : "auth.invalidResetLinkDesc";

    return (
      <AuthLayout
        title={t("auth.invalidResetLink")}
        subtitle={t(messageKey)}
        showFooter={false}
      >
        <div className="space-y-4 text-center">
          <Link
            to="/forgot-password"
            className="inline-flex items-center justify-center gap-2 text-sm text-primary font-medium hover:underline"
          >
            {t("auth.requestNewResetLink")}
          </Link>
          <div>
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary"
            >
              <ArrowLeft size={14} />
              {t("auth.backToLogin")}
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t("auth.resetPasswordTitle")}
      subtitle={
        resetInfo?.email
          ? t("auth.resetPasswordSubtitle", { email: resetInfo.email })
          : t("auth.resetPasswordSubtitleGeneric")
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {errors.form && (
          <p className="text-sm text-red-500 text-center">{errors.form}</p>
        )}

        <Input
          label={t("auth.password")}
          type={showPassword ? "text" : "password"}
          placeholder={t("auth.passwordPlaceholder")}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearFormFieldError(setErrors, "password");
            clearFormFieldError(setErrors, "confirmPassword");
          }}
          error={errors.password}
          leftIcon={<Lock size={16} />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          autoComplete="new-password"
          className="rounded-xl"
        />

        <Input
          label={t("auth.confirmPassword")}
          type={showPassword ? "text" : "password"}
          placeholder={t("auth.confirmPasswordPlaceholder")}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            clearFormFieldError(setErrors, "confirmPassword");
          }}
          error={errors.confirmPassword}
          leftIcon={<Lock size={16} />}
          autoComplete="new-password"
          className="rounded-xl"
        />

        <p className="text-xs text-text-secondary">{t("auth.resetLinkExpires1h")}</p>

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={loading}
          className="rounded-xl"
        >
          {t("auth.saveNewPassword")}
        </Button>

        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary font-medium"
          >
            <ArrowLeft size={14} />
            {t("auth.backToLogin")}
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

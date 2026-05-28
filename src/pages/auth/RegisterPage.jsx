import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../hooks/useAuth";
import { AuthLayout } from "../../components/auth/AuthLayout";

export default function RegisterPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [step, setStep] = useState(token ? "register" : "invalid");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = t("auth.fullNameRequired");
    if (!form.phone.trim()) errs.phone = t("auth.phoneRequired");
    else if (!/^[+\d\s().-]{8,15}$/.test(form.phone))
      errs.phone = t("auth.phoneInvalid");
    if (!form.password) errs.password = t("auth.passwordRequired");
    else if (form.password.length < 8)
      errs.password = t("auth.passwordMin");
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = t("auth.passwordsMismatch");
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
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setStep("success");
    setTimeout(async () => {
      await login("learner@helty.africa", "demo1234");
      navigate("/learn");
    }, 1500);
  };

  if (step === "invalid") {
    return (
      <AuthLayout
        title={t("auth.invalidInvitation")}
        subtitle={t("auth.invalidInvitationDesc")}
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

  return (
    <AuthLayout
      title={t("auth.completeAccount")}
      subtitle={t("auth.invitedSubtitle")}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label={t("auth.fullName")}
          type="text"
          placeholder={t("auth.fullNamePlaceholder")}
          value={form.name}
          onChange={update("name")}
          error={errors.name}
          autoComplete="name"
          className="rounded-xl"
        />

        <Input
          label={t("auth.phone")}
          type="tel"
          placeholder={t("admin.phonePlaceholder")}
          value={form.phone}
          onChange={update("phone")}
          error={errors.phone}
          helperText={t("auth.phoneHelper")}
          autoComplete="tel"
          className="rounded-xl"
        />

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
          placeholder={t("auth.confirmPasswordPlaceholder")}
          value={form.confirmPassword}
          onChange={update("confirmPassword")}
          error={errors.confirmPassword}
          autoComplete="new-password"
          className="rounded-xl"
        />

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

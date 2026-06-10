import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { DemoAccountsPanel } from "../../components/auth/DemoAccountsPanel";
import {
  clearFormFieldError,
  clearFormFieldErrors,
} from "../../lib/formErrors";

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const { currentUser, isInitializing, login, isLoading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isInitializing || !currentUser) return;
    if (currentUser.role === "learner") navigate("/learn", { replace: true });
    else if (currentUser.role === "lead") navigate("/lead/learners", { replace: true });
    else navigate("/admin", { replace: true });
  }, [currentUser, isInitializing, navigate]);

  const validate = () => {
    const errs = {};
    if (!email) errs.email = t("auth.emailRequired");
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = t("auth.emailInvalid");
    if (!password) errs.password = t("auth.passwordRequired");
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
    const result = await login(email, password);
    if (!result.success) {
      toast.error(t("auth.invalidCredentials"));
    }
  };

  return (
    <AuthLayout
      title={t("auth.welcomeBack")}
      subtitle={t("auth.enterAccountDetails")}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label={t("auth.email")}
          type="email"
          placeholder={t("auth.emailPlaceholder")}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearFormFieldError(setErrors, "email");
          }}
          error={errors.email}
          autoComplete="email"
          className="rounded-xl"
        />

        <Input
          label={t("auth.password")}
          type={showPassword ? "text" : "password"}
          placeholder={t("auth.passwordPlaceholder")}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearFormFieldError(setErrors, "password");
          }}
          error={errors.password}
          autoComplete="current-password"
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

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm text-primary hover:underline font-medium"
          >
            {t("auth.forgotPassword")}
          </Link>
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={isLoading}
          className="mt-2 rounded-xl"
        >
          <LogIn size={18} />
          {t("auth.signIn")}
        </Button>
      </form>

      <DemoAccountsPanel
        onSelect={(demoEmail, demoPassword) => {
          setEmail(demoEmail);
          setPassword(demoPassword);
          clearFormFieldErrors(setErrors, ["email", "password"]);
        }}
      />
    </AuthLayout>
  );
}

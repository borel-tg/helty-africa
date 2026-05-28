import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";

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
    else if (currentUser.role === "lead") navigate("/lead", { replace: true });
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
    if (result.success) {
      const role = result.user.role;
      if (role === "learner") navigate("/learn");
      else if (role === "lead") navigate("/lead");
      else navigate("/admin");
    } else {
      toast.error(t("auth.invalidCredentials"));
    }
  };

  const demoAccounts = [
    ["superadmin@helty.africa", "roles.super_admin"],
    ["admin@helty.africa", "roles.admin"],
    ["lead@helty.africa", "roles.lead"],
    ["learner@helty.africa", "roles.learner"],
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">H</span>
          </div>
          <h1 className="text-2xl font-semibold text-text-primary">
            {t("auth.welcomeBack")}
          </h1>
          <p className="text-text-secondary mt-1">
            {t("auth.signInSubtitle")}
          </p>
        </div>

        <div className="bg-white rounded-card shadow-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label={t("auth.email")}
              type="email"
              placeholder={t("auth.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
            />

            <Input
              label={t("auth.password")}
              type={showPassword ? "text" : "password"}
              placeholder={t("auth.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="current-password"
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
                className="text-sm text-primary hover:underline"
              >
                {t("auth.forgotPassword")}
              </Link>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={isLoading}
              className="mt-2"
            >
              <LogIn size={18} />
              {t("auth.signIn")}
            </Button>
          </form>
        </div>

        <div className="mt-6 bg-primary-50 rounded-card p-4 border border-primary-100">
          <p className="text-sm font-medium text-primary mb-2">
            {t("auth.demoAccounts")}
          </p>
          <div className="space-y-1">
            {demoAccounts.map(([demoEmail, roleKey]) => (
              <button
                key={demoEmail}
                type="button"
                onClick={() => {
                  setEmail(demoEmail);
                  setPassword("demo1234");
                }}
                className="block w-full text-left text-xs text-primary-700 hover:underline"
              >
                {t(roleKey)}: {demoEmail}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-text-secondary mt-2">
            {t("auth.demoPassword")}
          </p>
        </div>
      </div>
    </div>
  );
}

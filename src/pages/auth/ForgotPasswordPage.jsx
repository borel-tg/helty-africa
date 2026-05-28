import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { AuthLayout } from "../../components/auth/AuthLayout";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError(t("auth.emailRequired"));
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(t("auth.emailInvalid"));
      return;
    }
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <AuthLayout
      title={t("auth.forgotTitle")}
      subtitle={t("auth.forgotSubtitle")}
    >
      {submitted ? (
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle size={28} className="text-green-500" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary">
            {t("auth.checkEmail")}
          </h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            {t("auth.resetLinkSent")}{" "}
            <span className="font-medium text-text-primary">{email}</span>.
            {" "}{t("auth.linkExpires")}
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline mt-2 font-medium"
          >
            <ArrowLeft size={14} />
            {t("auth.backToLogin")}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label={t("auth.email")}
            type="email"
            placeholder={t("auth.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
            leftIcon={<Mail size={16} />}
            autoComplete="email"
            className="rounded-xl"
          />

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={loading}
            className="rounded-xl"
          >
            {t("auth.sendResetLink")}
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
      )}
    </AuthLayout>
  );
}

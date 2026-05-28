import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">H</span>
          </div>
          <h1 className="text-2xl font-semibold text-text-primary">
            {t("auth.forgotTitle")}
          </h1>
          <p className="text-text-secondary mt-1">
            {t("auth.forgotSubtitle")}
          </p>
        </div>

        <div className="bg-white rounded-card shadow-card p-6">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle size={28} className="text-green-500" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">
                {t("auth.checkEmail")}
              </h2>
              <p className="text-text-secondary">
                {t("auth.resetLinkSent")}{" "}
                <span className="font-medium text-text-primary">{email}</span>.
                {" "}{t("auth.linkExpires")}
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline mt-2"
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
              />

              <Button type="submit" fullWidth size="lg" loading={loading}>
                {t("auth.sendResetLink")}
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary"
                >
                  <ArrowLeft size={14} />
                  {t("auth.backToLogin")}
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

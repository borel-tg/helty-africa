import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Mail,
  Phone,
  MessageCircle,
  Send,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  SUPPORT_WHATSAPP,
  phoneToTelUrl,
  phoneToWhatsAppUrl,
} from "../../lib/supportConfig";
import { clearFormFieldError } from "../../lib/formErrors";

export default function SupportPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next = {};
    if (!subject.trim()) next.subject = t("support.subjectRequired");
    if (!message.trim()) next.message = t("support.messageRequired");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    const name = currentUser?.name || t("support.unknownUser");
    const email = currentUser?.email || "";
    const role = currentUser?.role || "";
    const body = [
      t("support.emailBodyIntro"),
      "",
      `${t("support.emailBodyName")}: ${name}`,
      `${t("support.emailBodyEmail")}: ${email}`,
      `${t("support.emailBodyRole")}: ${role}`,
      "",
      message.trim(),
    ].join("\n");

    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject.trim())}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setLoading(false);
    setSubmitted(true);
  };

  const contactLinks = [
    {
      icon: Mail,
      label: t("support.emailLabel"),
      value: SUPPORT_EMAIL,
      href: `mailto:${SUPPORT_EMAIL}`,
    },
    {
      icon: Phone,
      label: t("support.phoneLabel"),
      value: SUPPORT_PHONE,
      href: phoneToTelUrl(SUPPORT_PHONE),
    },
    {
      icon: MessageCircle,
      label: t("support.whatsappLabel"),
      value: SUPPORT_WHATSAPP,
      href: phoneToWhatsAppUrl(SUPPORT_WHATSAPP),
      external: true,
    },
  ];

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">
          {t("support.title")}
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          {t("support.subtitle")}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-text-primary">
              {t("support.contactTitle")}
            </h3>
          </CardHeader>
          <CardBody className="space-y-4">
            {contactLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/50 transition-colors"
              >
                <span className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                  <item.icon size={18} className="text-primary" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-text-secondary">
                    {item.label}
                  </p>
                  <p className="text-sm font-medium text-text-primary break-all">
                    {item.value}
                  </p>
                </div>
              </a>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-text-primary">
              {t("support.formTitle")}
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              {t("support.formHint", { email: SUPPORT_EMAIL })}
            </p>
          </CardHeader>
          <CardBody>
            {submitted ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle size={28} className="text-green-500" />
                </div>
                <h4 className="text-lg font-semibold text-text-primary">
                  {t("support.sentTitle")}
                </h4>
                <p className="text-sm text-text-secondary">
                  {t("support.sentDescription")}
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSubmitted(false);
                    setSubject("");
                    setMessage("");
                  }}
                >
                  {t("support.sendAnother")}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <Input
                  label={t("support.subject")}
                  placeholder={t("support.subjectPlaceholder")}
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    clearFormFieldError(setErrors, "subject");
                  }}
                  error={errors.subject}
                />
                <Textarea
                  label={t("support.message")}
                  placeholder={t("support.messagePlaceholder")}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    clearFormFieldError(setErrors, "message");
                  }}
                  error={errors.message}
                  rows={5}
                />
                <Button type="submit" fullWidth loading={loading}>
                  <Send size={16} />
                  {t("support.send")}
                </Button>
              </form>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

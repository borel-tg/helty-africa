import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { useTranslation } from "react-i18next";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { FileUpload } from "../../components/ui/FileUpload";
import { useToast } from "../../components/ui/Toast";
import { useConvexSession } from "../../hooks/useConvexSession";
import {
  CertificateView,
  getCertificatePreviewSample,
} from "../../components/certificate/CertificateView";
import {
  mergeTemplate,
  DEFAULT_CERTIFICATE_TEMPLATE,
} from "../../lib/certificate/defaults";

export default function CertificateTemplatePage() {
  const { t } = useTranslation();
  const toast = useToast();
  const {
    convexUser,
    template: savedTemplate,
    isLoading,
    convexSyncError,
    convexUserMissing,
  } = useConvexSession();
  const upsertTemplate = useMutation(api.certificates.upsertTemplate);
  const previewSample = getCertificatePreviewSample(t);

  const [form, setForm] = useState({
    organizationName: DEFAULT_CERTIFICATE_TEMPLATE.organizationName,
    programSubtitle: DEFAULT_CERTIFICATE_TEMPLATE.programSubtitle,
    signatureLine: DEFAULT_CERTIFICATE_TEMPLATE.signatureLine,
    borderColor: DEFAULT_CERTIFICATE_TEMPLATE.borderColor,
    accentColor: DEFAULT_CERTIFICATE_TEMPLATE.accentColor,
    footerText: DEFAULT_CERTIFICATE_TEMPLATE.footerText,
    logoUrl: null,
    signatureImageUrl: null,
    backgroundImageUrl: null,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (savedTemplate) {
      setForm({
        organizationName: savedTemplate.organizationName,
        programSubtitle: savedTemplate.programSubtitle ?? "",
        signatureLine: savedTemplate.signatureLine ?? "",
        borderColor: savedTemplate.borderColor,
        accentColor: savedTemplate.accentColor ?? savedTemplate.borderColor,
        footerText: savedTemplate.footerText ?? "",
        logoUrl: savedTemplate.logoUrl ?? null,
        signatureImageUrl: savedTemplate.signatureImageUrl ?? null,
        backgroundImageUrl: savedTemplate.backgroundImageUrl ?? null,
      });
    }
  }, [savedTemplate]);

  const update = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSave = async () => {
    if (!convexUser?.organizationId) {
      toast.error(
        "Connectez Convex et exécutez le seed pour enregistrer le modèle.",
      );
      return;
    }
    setSaving(true);
    try {
      await upsertTemplate({
        organizationId: convexUser.organizationId,
        organizationName: form.organizationName.trim(),
        programSubtitle: form.programSubtitle.trim() || undefined,
        signatureLine: form.signatureLine.trim() || undefined,
        borderColor: form.borderColor,
        accentColor: form.accentColor || form.borderColor,
        footerText: form.footerText.trim() || undefined,
        logoUrl: form.logoUrl ?? undefined,
        signatureImageUrl: form.signatureImageUrl ?? undefined,
        backgroundImageUrl: form.backgroundImageUrl ?? undefined,
      });
      toast.success(t("certificate.templateSaved"));
    } catch {
      toast.error("Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  };

  const previewTemplate = mergeTemplate(form);

  return (
    <div className="p-4 md:p-6 w-full">
      <h2 className="text-xl font-semibold text-text-primary mb-6">
        {t("admin.certificateTemplate")}
      </h2>

      {convexSyncError && (
        <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900">
          Convex backend is out of date. Run{" "}
          <code className="font-mono text-xs bg-amber-100 px-1 rounded">
            npx convex dev
          </code>{" "}
          in the project folder, then reload.
        </div>
      )}

      {convexUserMissing && (
        <div className="mb-4 p-4 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-900">
          No Convex user for this login. Seed demo data:{" "}
          <code className="font-mono text-xs bg-blue-100 px-1 rounded">
            npx convex run seed:seedDemo
          </code>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white rounded-card shadow-card p-5 space-y-4">
          <h3 className="text-base font-semibold text-text-primary">
            {t("certificate.templateSettings")}
          </h3>

          <Input
            label={t("admin.orgName")}
            value={form.organizationName}
            onChange={update("organizationName")}
          />
          <Input
            label={t("certificate.programSubtitle")}
            value={form.programSubtitle}
            onChange={update("programSubtitle")}
            placeholder="Employee Training Programme"
          />
          <Input
            label={t("certificate.signatureLine")}
            value={form.signatureLine}
            onChange={update("signatureLine")}
            placeholder="Dr. Jane Smith, Training Director"
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-text-primary">
              {t("certificate.borderColor")}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.borderColor}
                onChange={update("borderColor")}
                className="w-10 h-10 rounded cursor-pointer border border-gray-200"
              />
              <Input
                value={form.borderColor}
                onChange={update("borderColor")}
                className="flex-1"
              />
            </div>
          </div>

          <Textarea
            label={t("certificate.footerText")}
            value={form.footerText}
            onChange={update("footerText")}
            rows={3}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-text-primary">
              {t("certificate.accentColor")}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.accentColor}
                onChange={update("accentColor")}
                className="w-10 h-10 rounded cursor-pointer border border-gray-200"
              />
              <Input
                value={form.accentColor}
                onChange={update("accentColor")}
                className="flex-1"
              />
            </div>
          </div>

          <FileUpload
            preset="logo"
            label={t("admin.orgLogo")}
            value={form.logoUrl}
            onUploaded={(result) =>
              setForm((p) => ({ ...p, logoUrl: result?.url ?? null }))
            }
          />

          <FileUpload
            preset="logo"
            label={t("certificate.signatureImage")}
            value={form.signatureImageUrl}
            onUploaded={(result) =>
              setForm((p) => ({ ...p, signatureImageUrl: result?.url ?? null }))
            }
          />

          <FileUpload
            preset="certificateBackground"
            label={t("certificate.backgroundWatermark")}
            value={form.backgroundImageUrl}
            onUploaded={(result) =>
              setForm((p) => ({
                ...p,
                backgroundImageUrl: result?.url ?? null,
              }))
            }
          />

          <Button
            fullWidth
            loading={saving || isLoading}
            onClick={handleSave}
            disabled={!convexUser}
          >
            {t("certificate.saveTemplate")}
          </Button>
        </div>

        <div>
          <h3 className="text-base font-semibold text-text-primary mb-3">
            {t("certificate.livePreview")}
          </h3>
          <div className="shadow-modal rounded-card overflow-hidden bg-gray-50 p-2 md:p-4">
            <CertificateView
              template={previewTemplate}
              learnerName={previewSample.learnerName}
              moduleTitle={previewSample.moduleTitle}
              score={previewSample.score}
              issuedAt={previewSample.issuedAt}
              certificateNumber={previewSample.certificateNumber}
              verifyUrl={previewSample.verifyUrl}
            />
          </div>
          <p className="text-xs text-text-secondary mt-2 text-center">
            {t("certificate.previewNote")}
          </p>
        </div>
      </div>
    </div>
  );
}

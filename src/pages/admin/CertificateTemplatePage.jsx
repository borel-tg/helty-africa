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
  CERTIFICATE_LAYOUTS,
  DEFAULT_LAYOUT_ID,
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
    layoutId: DEFAULT_LAYOUT_ID,
    organizationName: DEFAULT_CERTIFICATE_TEMPLATE.organizationName,
    programSubtitle: DEFAULT_CERTIFICATE_TEMPLATE.programSubtitle,
    signatureLine: DEFAULT_CERTIFICATE_TEMPLATE.signatureLine,
    signature2Line: "",
    borderColor: DEFAULT_CERTIFICATE_TEMPLATE.borderColor,
    accentColor: DEFAULT_CERTIFICATE_TEMPLATE.accentColor,
    footerText: DEFAULT_CERTIFICATE_TEMPLATE.footerText,
    logoUrl: null,
    logoStorageId: null,
    secondLogoUrl: null,
    secondLogoStorageId: null,
    signatureImageUrl: null,
    signatureImageStorageId: null,
    signature2ImageUrl: null,
    signature2ImageStorageId: null,
    backgroundImageUrl: null,
    backgroundImageStorageId: null,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (savedTemplate) {
      setForm({
        layoutId: savedTemplate.layoutId ?? DEFAULT_LAYOUT_ID,
        organizationName: savedTemplate.organizationName,
        programSubtitle: savedTemplate.programSubtitle ?? "",
        signatureLine: savedTemplate.signatureLine ?? "",
        signature2Line: savedTemplate.signature2Line ?? "",
        borderColor: savedTemplate.borderColor,
        accentColor: savedTemplate.accentColor ?? savedTemplate.borderColor,
        footerText: savedTemplate.footerText ?? "",
        logoUrl: savedTemplate.logoUrl ?? null,
        logoStorageId: savedTemplate.logoStorageId ?? null,
        secondLogoUrl: savedTemplate.secondLogoUrl ?? null,
        secondLogoStorageId: savedTemplate.secondLogoStorageId ?? null,
        signatureImageUrl: savedTemplate.signatureImageUrl ?? null,
        signatureImageStorageId: savedTemplate.signatureImageStorageId ?? null,
        signature2ImageUrl: savedTemplate.signature2ImageUrl ?? null,
        signature2ImageStorageId:
          savedTemplate.signature2ImageStorageId ?? null,
        backgroundImageUrl: savedTemplate.backgroundImageUrl ?? null,
        backgroundImageStorageId:
          savedTemplate.backgroundImageStorageId ?? null,
      });
    }
  }, [savedTemplate]);

  const update = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSave = async () => {
    if (!convexUser?._id || !convexUser?.organizationId) {
      toast.error(
        "Connectez-vous avec un compte admin et exécutez le seed Convex.",
      );
      return;
    }
    setSaving(true);
    try {
      await upsertTemplate({
        organizationId: convexUser.organizationId,
        layoutId: form.layoutId,
        organizationName: form.organizationName.trim(),
        programSubtitle: form.programSubtitle.trim() || undefined,
        signatureLine: form.signatureLine.trim() || undefined,
        signature2Line: form.signature2Line.trim() || undefined,
        borderColor: form.borderColor,
        accentColor: form.accentColor || form.borderColor,
        footerText: form.footerText.trim() || undefined,
        logoUrl: form.logoUrl ?? undefined,
        logoStorageId: form.logoStorageId ?? undefined,
        secondLogoUrl: form.secondLogoUrl ?? undefined,
        secondLogoStorageId: form.secondLogoStorageId ?? undefined,
        signatureImageUrl: form.signatureImageUrl ?? undefined,
        signatureImageStorageId: form.signatureImageStorageId ?? undefined,
        signature2ImageUrl: form.signature2ImageUrl ?? undefined,
        signature2ImageStorageId: form.signature2ImageStorageId ?? undefined,
        backgroundImageUrl: form.backgroundImageUrl ?? undefined,
        backgroundImageStorageId: form.backgroundImageStorageId ?? undefined,
      });
      toast.success(t("certificate.templateSaved"));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Enregistrement impossible",
      );
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
        <div className="bg-white rounded-card shadow-card p-5 space-y-6">
          <h3 className="text-base font-semibold text-text-primary">
            {t("certificate.templateSettings")}
          </h3>

          {/* ── Layout ── */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-text-primary border-b pb-1">
              {t("certificate.layoutId")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                {
                  id: CERTIFICATE_LAYOUTS.classic,
                  label: t("certificate.layoutClassic"),
                },
                {
                  id: CERTIFICATE_LAYOUTS.premium,
                  label: t("certificate.layoutPremium"),
                },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() =>
                    setForm((p) => ({ ...p, layoutId: option.id }))
                  }
                  className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                    form.layoutId === option.id
                      ? "border-primary bg-primary/5 text-primary font-medium"
                      : "border-gray-200 hover:border-gray-300 text-text-primary"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Organisation ── */}
          <div className="space-y-4">
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
          </div>

          {/* ── Header logos ── */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-text-primary border-b pb-1">
              {t("certificate.headerLogos", "Header Logos")}
            </p>
            <FileUpload
              preset="logo"
              label={t("admin.orgLogo") + " (left)"}
              value={form.logoUrl}
              onUploaded={(result) =>
                setForm((p) => ({
                  ...p,
                  logoUrl: result?.url ?? null,
                  logoStorageId: result?.storageId ?? null,
                }))
              }
            />
            <FileUpload
              preset="logo"
              label={t("certificate.secondLogo", "Second logo (right)")}
              value={form.secondLogoUrl}
              onUploaded={(result) =>
                setForm((p) => ({
                  ...p,
                  secondLogoUrl: result?.url ?? null,
                  secondLogoStorageId: result?.storageId ?? null,
                }))
              }
            />
          </div>

          {/* ── Signatures ── */}
          <div className="space-y-4">
            <p className="text-sm font-semibold text-text-primary border-b pb-1">
              {t("certificate.signatures", "Signatures")}
            </p>

            {/* Signature 1 */}
            <div className="space-y-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                {t("certificate.signature1", "Signature 1")}
              </p>
              <Input
                label={t("certificate.signatureLine")}
                value={form.signatureLine}
                onChange={update("signatureLine")}
                placeholder="Dr. Jane Smith, Training Director"
              />
              <FileUpload
                preset="logo"
                label={t("certificate.signatureImage", "Signature image")}
                value={form.signatureImageUrl}
                onUploaded={(result) =>
                  setForm((p) => ({
                    ...p,
                    signatureImageUrl: result?.url ?? null,
                    signatureImageStorageId: result?.storageId ?? null,
                  }))
                }
              />
            </div>

            {/* Signature 2 (optional) */}
            <div className="space-y-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                {t("certificate.signature2", "Signature 2")}{" "}
                <span className="normal-case font-normal text-text-secondary">
                  ({t("common.optional", "optional")})
                </span>
              </p>
              <Input
                label={t("certificate.signatureLine")}
                value={form.signature2Line}
                onChange={update("signature2Line")}
                placeholder="Dr. John Doe, Medical Director"
              />
              <FileUpload
                preset="logo"
                label={t("certificate.signatureImage", "Signature image")}
                value={form.signature2ImageUrl}
                onUploaded={(result) =>
                  setForm((p) => ({
                    ...p,
                    signature2ImageUrl: result?.url ?? null,
                    signature2ImageStorageId: result?.storageId ?? null,
                  }))
                }
              />
            </div>
          </div>

          {/* ── Colours ── */}
          <div className="space-y-4">
            <p className="text-sm font-semibold text-text-primary border-b pb-1">
              {t("certificate.colours", "Colours")}
            </p>
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
          </div>

          {/* ── Other ── */}
          <div className="space-y-4">
            <Textarea
              label={t("certificate.footerText")}
              value={form.footerText}
              onChange={update("footerText")}
              rows={3}
            />
            <FileUpload
              preset="certificateBackground"
              label={t("certificate.backgroundWatermark")}
              value={form.backgroundImageUrl}
              onUploaded={(result) =>
                setForm((p) => ({
                  ...p,
                  backgroundImageUrl: result?.url ?? null,
                  backgroundImageStorageId: result?.storageId ?? null,
                }))
              }
            />
          </div>

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

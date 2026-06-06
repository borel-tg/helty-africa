import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "convex/react";
import { CheckCircle, Loader2, XCircle, Award } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { formatDate } from "../../lib/utils";
import { mergeTemplate } from "../../lib/certificate/defaults";
import { CertificateView } from "../../components/certificate/CertificateView";
import {
  buildCertificateVerifyUrl,
  getConvexUrlForDebug,
  logVerifyDebug,
  normalizeCertificateNumber,
} from "../../lib/certificate/verifyUrl";

const VERIFY_TIMEOUT_MS = 12000;

export default function VerifyCertificatePage() {
  const { certificateNumber: rawNumber } = useParams();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const [verifyTimedOut, setVerifyTimedOut] = useState(false);

  const certificateNumber = useMemo(
    () => normalizeCertificateNumber(rawNumber),
    [rawNumber]
  );
  const showDebug =
    import.meta.env.DEV || searchParams.get("debug") === "1" || verifyTimedOut;
  const convexDebug = useMemo(() => getConvexUrlForDebug(), []);
  const verifyPageUrl = useMemo(
    () =>
      certificateNumber ? buildCertificateVerifyUrl(certificateNumber) : "",
    [certificateNumber]
  );

  useEffect(() => {
    logVerifyDebug("page_mount", {
      rawNumber,
      certificateNumber,
      verifyPageUrl,
      ...convexDebug,
    });
  }, [rawNumber, certificateNumber, verifyPageUrl, convexDebug]);

  const verify = useQuery(
    api.certificates.verifyByNumber,
    certificateNumber ? { certificateNumber } : "skip"
  );

  const template = useQuery(
    api.certificates.getTemplate,
    verify?.organizationId
      ? { organizationId: verify.organizationId }
      : "skip"
  );

  useEffect(() => {
    if (verify === undefined) return;
    logVerifyDebug("verify_settled", {
      certificateNumber,
      found: verify != null,
      certificateId: verify?.certificate?._id ?? null,
    });
  }, [verify, certificateNumber]);

  useEffect(() => {
    if (template === undefined || verify == null) return;
    logVerifyDebug("preview_settled", {
      certificateNumber,
      hasTemplate: template != null,
    });
  }, [template, verify, certificateNumber]);

  useEffect(() => {
    if (verify !== undefined) {
      setVerifyTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setVerifyTimedOut(true);
      logVerifyDebug("verify_timeout", {
        certificateNumber,
        timeoutMs: VERIFY_TIMEOUT_MS,
        ...convexDebug,
      });
    }, VERIFY_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [verify, certificateNumber, convexDebug]);

  const isVerifying = verify === undefined;
  const isVerified = verify != null;
  const isPreviewLoading = isVerified && template === undefined;
  const convexMisconfigured =
    !convexDebug.configured || convexDebug.isPlaceholder;

  if (!certificateNumber) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <p className="text-text-secondary">{t("certificate.verifyInvalidDesc")}</p>
      </div>
    );
  }

  if (isVerifying && !verifyTimedOut && !convexMisconfigured) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-3">
        <Loader2 size={28} className="animate-spin text-primary" />
        <p className="text-text-secondary">{t("certificate.verifying")}</p>
        {showDebug && (
          <DebugPanel
            certificateNumber={certificateNumber}
            verifyPageUrl={verifyPageUrl}
            convexDebug={convexDebug}
            status="verifying"
          />
        )}
      </div>
    );
  }

  if (isVerifying && (verifyTimedOut || convexMisconfigured)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-card shadow-card p-6 space-y-4">
          <h1 className="text-lg font-bold text-text-primary">
            {t("certificate.verifyLoadError", "Impossible de charger le certificat")}
          </h1>
          <p className="text-sm text-text-secondary">
            {convexMisconfigured
              ? t(
                  "certificate.verifyConvexMissing",
                  "La connexion au serveur (Convex) n'est pas configurée sur ce site."
                )
              : t(
                  "certificate.verifyLoadTimeout",
                  "Le serveur met trop de temps à répondre. Vérifiez la connexion et VITE_CONVEX_URL."
                )}
          </p>
          <DebugPanel
            certificateNumber={certificateNumber}
            verifyPageUrl={verifyPageUrl}
            convexDebug={convexDebug}
            status="timeout"
          />
        </div>
      </div>
    );
  }

  if (!isVerified) {
    logVerifyDebug("not_found_ui", { certificateNumber });
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-card shadow-card p-8 text-center">
          <XCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-text-primary mb-2">
            {t("certificate.verifyInvalid")}
          </h1>
          <p className="text-sm text-text-secondary">
            {t("certificate.verifyInvalidDesc")}
          </p>
          <p className="text-xs text-gray-400 mt-4 font-mono">{certificateNumber}</p>
          {showDebug && (
            <div className="mt-6 text-left">
              <DebugPanel
                certificateNumber={certificateNumber}
                verifyPageUrl={verifyPageUrl}
                convexDebug={convexDebug}
                status="not_found"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  const { certificate, learnerName, moduleTitle, organizationName } = verify;
  const merged = mergeTemplate(template);
  const verifyUrl = buildCertificateVerifyUrl(certificate.certificateNumber);

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 justify-center mb-6 text-green-700">
          <CheckCircle size={24} />
          <h1 className="text-lg font-semibold">{t("certificate.verifyValid")}</h1>
        </div>

        <div className="bg-white rounded-card shadow-card p-4 md:p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-text-secondary">{t("certificate.issuedTo")}</p>
              <p className="font-semibold text-text-primary">{learnerName}</p>
            </div>
            <div>
              <p className="text-text-secondary">{t("certificate.module")}</p>
              <p className="font-semibold text-text-primary">{moduleTitle}</p>
            </div>
            <div>
              <p className="text-text-secondary">{t("certificate.score")}</p>
              <p className="font-semibold text-primary">{certificate.score}%</p>
            </div>
            <div>
              <p className="text-text-secondary">{t("certificate.issuedOn")}</p>
              <p className="font-semibold">{formatDate(certificate.issuedAt)}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-text-secondary">{t("certificate.issuedBy")}</p>
              <p className="font-semibold">{organizationName}</p>
            </div>
            <div className="sm:col-span-2 flex items-center gap-2 text-xs text-gray-500 font-mono">
              <Award size={14} />
              {certificate.certificateNumber}
            </div>
          </div>
        </div>

        <div className="shadow-modal rounded-card overflow-hidden bg-gray-50 p-2 md:p-4">
          {isPreviewLoading ? (
            <CertificatePreviewSkeleton label={t("certificate.loadingPreview")} />
          ) : (
            <CertificateView
              template={merged}
              learnerName={learnerName}
              moduleTitle={moduleTitle}
              score={certificate.score}
              issuedAt={certificate.issuedAt}
              certificateNumber={certificate.certificateNumber}
              verifyUrl={verifyUrl}
            />
          )}
        </div>

        {showDebug && (
          <div className="mt-6">
            <DebugPanel
              certificateNumber={certificateNumber}
              verifyPageUrl={verifyPageUrl}
              convexDebug={convexDebug}
              status={isPreviewLoading ? "preview_loading" : "ok"}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function CertificatePreviewSkeleton({ label }) {
  return (
    <div
      className="mx-auto w-full max-w-[900px] flex flex-col items-center justify-center gap-4 py-16 px-6"
      style={{ aspectRatio: "297 / 210" }}
    >
      <Loader2 size={32} className="animate-spin text-primary" />
      <p className="text-sm text-text-secondary text-center">{label}</p>
      <div className="w-full max-w-md space-y-3 opacity-40">
        <div className="h-3 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-4/5 mx-auto" />
        <div className="h-8 bg-gray-200 rounded animate-pulse w-3/5 mx-auto mt-4" />
      </div>
    </div>
  );
}

function DebugPanel({ certificateNumber, verifyPageUrl, convexDebug, status }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-mono text-amber-950 space-y-2 break-all">
      <p className="font-sans font-semibold text-amber-900">Debug verify</p>
      <p>
        <span className="text-amber-800">status:</span> {status}
      </p>
      <p>
        <span className="text-amber-800">ref:</span> {certificateNumber}
      </p>
      <p>
        <span className="text-amber-800">url:</span>{" "}
        <a href={verifyPageUrl} className="underline">
          {verifyPageUrl}
        </a>
      </p>
      <p>
        <span className="text-amber-800">debug url:</span>{" "}
        <a href={`${verifyPageUrl}?debug=1`} className="underline">
          {verifyPageUrl}?debug=1
        </a>
      </p>
      <p>
        <span className="text-amber-800">VITE_CONVEX_URL:</span>{" "}
        {convexDebug.configured ? convexDebug.url : "(not set)"}
        {convexDebug.isPlaceholder ? " (placeholder — broken)" : ""}
      </p>
      <p className="font-sans text-[11px] text-amber-900">
        Console: <strong>[verify-certificate]</strong>. Convex logs:{" "}
        <strong>verifyByNumber</strong>, <strong>getTemplate</strong>.
      </p>
    </div>
  );
}

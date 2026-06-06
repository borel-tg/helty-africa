import { forwardRef } from "react";
import { CertificateViewClassic } from "./CertificateViewClassic";
import { CertificateViewPremium } from "./CertificateViewPremium";
import { DEFAULT_LAYOUT_ID } from "../../lib/certificate/defaults";
import "./certificate.css";

export const CertificateView = forwardRef(function CertificateView(props, ref) {
  const layoutId = props.template?.layoutId ?? DEFAULT_LAYOUT_ID;
  const Component =
    layoutId === "classic" ? CertificateViewClassic : CertificateViewPremium;
  return <Component ref={ref} {...props} />;
});

/** Preview placeholders for the admin template editor. */
export function getCertificatePreviewSample(t) {
  return {
    learnerName: t("certificate.sampleLearner"),
    moduleTitle: t("certificate.sampleModule"),
    score: 85,
    issuedAt: Date.now(),
    certificateNumber: "EVT-2026-PREVIEW",
    verifyUrl:
      typeof window !== "undefined"
        ? `${window.location.origin}/verify/EVT-2026-PREVIEW`
        : "",
  };
}

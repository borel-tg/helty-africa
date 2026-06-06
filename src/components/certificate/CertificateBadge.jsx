import badgeImg from "../../assets/certificate/badge.png";

/** COUP RDC award seal — right sidebar of both certificate layouts. */
export function CertificateBadge({ className = "cert-badge-wrap" }) {
  return (
    <img
      src={badgeImg}
      alt=""
      className={`object-contain max-w-full h-auto ${className}`}
      draggable={false}
    />
  );
}

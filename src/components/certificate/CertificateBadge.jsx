import badgeImg from "../../assets/certificate/badge.png";

/** COUP RDC award seal — right sidebar of both certificate layouts. */
export function CertificateBadge({ className = "w-20 md:w-24" }) {
  return (
    <img
      src={badgeImg}
      alt=""
      className={`object-contain ${className}`}
      draggable={false}
    />
  );
}

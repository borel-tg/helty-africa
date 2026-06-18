/**
 * Certificate footer: up to 3 signatures on one row, completion date on the row below.
 */
export function CertificateSignaturesFooter({
  template,
  dateStr,
  dateLabel,
  borderTopStyle,
  signatureLineStyle,
  className = "",
  variant = "premium",
}) {
  const isClassic = variant === "classic";
  const labelClass = isClassic
    ? "cert-signature-label text-text-secondary"
    : "cert-signature-label";
  const labelStyle = isClassic ? undefined : { color: "#6B7280" };
  const dateLabelClass = isClassic
    ? "cert-date-block-label font-medium text-text-primary"
    : "cert-date-block-label font-semibold";
  const dateLabelStyle = isClassic ? undefined : { color: "#1A1A1A" };
  const dateSubClass = isClassic
    ? "cert-date-block-sub text-text-secondary"
    : "cert-date-block-sub";
  const dateSubStyle = isClassic ? undefined : { color: "#6B7280" };

  const signatures = [
    {
      imageUrl: template.signatureImageUrl,
      line: template.signatureLine,
      alwaysShow: true,
    },
    {
      imageUrl: template.signature2ImageUrl,
      line: template.signature2Line,
    },
    {
      imageUrl: template.signature3ImageUrl,
      line: template.signature3Line,
    },
  ].filter((sig) => sig.alwaysShow || sig.imageUrl || sig.line);

  return (
    <div
      className={`cert-footer flex flex-col ${className}`}
      style={borderTopStyle}
    >
      <div className="cert-signatures-row flex items-end justify-between">
        {signatures.map((sig, index) => (
          <div key={index} className="min-w-0 flex-1">
            {sig.imageUrl ? (
              <img
                src={sig.imageUrl}
                alt=""
                className="cert-signature-img object-contain object-left"
              />
            ) : (
              <div
                className={
                  isClassic
                    ? "cert-signature-line border-b-2 border-gray-300"
                    : "cert-signature-line"
                }
                style={isClassic ? undefined : signatureLineStyle}
              />
            )}
            {sig.line && (
              <p className={labelClass} style={labelStyle}>
                {sig.line}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="cert-date-row text-center">
        <p className={dateLabelClass} style={dateLabelStyle}>
          {dateStr}
        </p>
        <p className={dateSubClass} style={dateSubStyle}>
          {dateLabel}
        </p>
      </div>
    </div>
  );
}

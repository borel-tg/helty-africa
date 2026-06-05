import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

/**
 * Export a certificate DOM node as a landscape A4 PDF.
 * @param {HTMLElement} element  - The certificate root element (must have a ref attached)
 * @param {string}      filename - Output filename
 */
export async function downloadCertificatePdf(
  element,
  filename = "certificate.pdf"
) {
  if (!element) throw new Error("Certificate element not found");

  // Capture at 3× for crisp output on high-DPI screens / when printed
  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: 3,
    backgroundColor: "#ffffff",
    useCORS: true,
    includeQueryParams: true,
    width: element.scrollWidth,
    height: element.scrollHeight,
    style: {
      transform: "none",
      transformOrigin: "top left",
    },
    filter: (node) => {
      if (node.tagName === "IMG") {
        const img = /** @type {HTMLImageElement} */ (node);
        if (!img.complete || img.naturalWidth === 0) return false;
      }
      return true;
    },
  });

  // A4 landscape in mm
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();   // 297 mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 210 mm

  // Fit the image to the full page with no margins
  pdf.addImage(dataUrl, "PNG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
  pdf.save(filename);
}

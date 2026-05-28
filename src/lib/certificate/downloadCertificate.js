import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

/**
 * Export a certificate DOM node as a landscape PDF.
 * @param {HTMLElement} element
 * @param {string} filename
 */
export async function downloadCertificatePdf(element, filename = "certificate.pdf") {
  if (!element) throw new Error("Certificate element not found");

  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: "#ffffff",
  });

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  pdf.addImage(dataUrl, "PNG", 0, 0, pageWidth, pageHeight);
  pdf.save(filename);
}

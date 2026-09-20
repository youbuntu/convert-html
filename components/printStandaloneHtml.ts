import {
  createStandaloneHtml,
  EXPORT_WIDTH,
  type HtmlExportOptions,
} from "./exportStandaloneHtml";

/** Open synchronously from the click so popup blockers retain user activation. */
export async function printStandaloneHtml(options: HtmlExportOptions) {
  const preview = window.open("", "_blank");
  if (!preview)
    throw new Error(
      "인쇄 창이 차단되었습니다. 이 사이트의 팝업을 허용한 후 다시 시도해 주세요.",
    );
  preview.opener = null;
  preview.document.title = "PDF 인쇄 준비 중";
  preview.document.body.textContent = "인쇄 문서를 준비하고 있습니다…";

  try {
    const html = await createStandaloneHtml(options);
    if (preview.closed) return;
    preview.document.open();
    preview.document.write(html);
    preview.document.close();

    // Only the exported document receives print styles; the source DOM is untouched.
    // Scale the existing 1440px layout into A4's 186mm printable width.
    const printStyle = preview.document.createElement("style");
    const scale = (186 * 96) / (25.4 * EXPORT_WIDTH);
    printStyle.textContent = `
      @page { size: A4 portrait; margin: 12mm; }
      @media print {
        html { width: auto !important; min-width: 0 !important; }
        body { zoom: ${scale}; margin: 0 auto !important; }
        *, *::before, *::after {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;
    preview.document.head.appendChild(printStyle);
    preview.document.body.getBoundingClientRect();
    await Promise.all([
      preview.document.fonts.ready,
      ...Array.from(preview.document.images, (image) => image.decode()),
    ]);
    if (preview.closed) return;
    for (const font of preview.document.fonts) {
      if (font.status === "error")
        throw new Error("인쇄용 폰트를 불러오지 못했습니다.");
    }
    // Fires when the print dialog closes, including save, cancel, and dismissal.
    // Register before print(); closing immediately after print() can interrupt
    // browsers whose print dialog opens asynchronously.
    preview.addEventListener("afterprint", () => preview.close(), {
      once: true,
    });
    preview.focus();
    preview.print();
  } catch (error) {
    if (!preview.closed) preview.close();
    throw error;
  }
}

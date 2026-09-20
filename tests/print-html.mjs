import assert from "node:assert/strict";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || "msedge",
  headless: true,
});
const url = process.env.TEST_URL || "http://127.0.0.1:3001";
try {
  for (const route of ["/", "/mixed"]) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    await page.goto(new URL(route, url).href);
    await page.waitForFunction(() =>
      Object.keys(document.querySelector("button") ?? {}).some((key) =>
        key.startsWith("__reactProps"),
      ),
    );
    await page.evaluate(() => document.fonts.ready);
    const original = await page
      .locator("main")
      .evaluate((node) => node.outerHTML);
    // Headless browsers cannot show the OS print UI. Observe the actual call
    // while preserving window creation, document generation, and resource loading.
    await page.evaluate(() => {
      const open = window.open.bind(window);
      window.open = (...args) => {
        const preview = open(...args);
        if (preview)
          preview.print = () => {
            preview.__printState = {
              calls: (preview.__printState?.calls ?? 0) + 1,
              fonts: preview.document.fonts.status,
              images: [...preview.document.images].every(
                (image) => image.complete && image.naturalWidth > 0,
              ),
            };
          };
        return preview;
      };
    });
    const popup = page.waitForEvent("popup");
    await page.getByRole("button", { name: "PDF 내보내기" }).click();
    const preview = await popup;
    await preview.waitForFunction(() => window.__printState?.calls === 1);
    assert.deepEqual(await preview.evaluate(() => window.__printState), {
      calls: 1,
      fonts: "loaded",
      images: true,
    });
    assert.equal(
      await preview.locator("main").innerText(),
      await page.locator("main").innerText(),
    );
    assert.equal(
      await preview.locator("[data-export-ignore],script").count(),
      0,
    );
    assert.equal(
      await preview
        .locator("body")
        .evaluate((node) => node.getBoundingClientRect().width),
      1440,
    );
    assert.equal(
      await page.locator("main").evaluate((node) => node.outerHTML),
      original,
      "Printing must not mutate source content",
    );

    await preview.emulateMedia({ media: "print" });
    const printWidth = await preview
      .locator("body")
      .evaluate((node) => node.getBoundingClientRect().width);
    assert.ok(
      Math.abs(printWidth - (186 * 96) / 25.4) < 1,
      "Fixed layout must fit A4 printable width",
    );
    assert.equal(
      await preview
        .locator("h1")
        .evaluate((node) => getComputedStyle(node).printColorAdjust),
      "exact",
    );
    const closed = preview.waitForEvent("close");
    await preview.evaluate(() => {
      window.dispatchEvent(new Event("afterprint"));
    });
    await closed;
    assert.equal(
      preview.isClosed(),
      true,
      "Print preview tab must close when the print dialog finishes or is dismissed",
    );
    assert.equal(page.isClosed(), false, "The source tab must remain open");

    await page.evaluate(() => {
      window.open = () => null;
    });
    await page.getByRole("button", { name: "PDF 내보내기" }).click();
    await page.getByRole("alert").filter({ hasText: "팝업을 허용" }).waitFor();
    assert.equal(
      await page.locator("main").evaluate((node) => node.outerHTML),
      original,
    );
    assert.equal(
      await page.getByRole("button", { name: "PDF 내보내기" }).isEnabled(),
      true,
    );
    console.log(
      `${route}: print invocation, loaded fonts, A4 scaling, unchanged source, automatic preview closure, popup blocking passed`,
    );
    await context.close();
  }
} finally {
  await browser.close();
}

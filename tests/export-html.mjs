import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || "msedge",
  headless: true,
});
const outputDirectory = resolve(".export-test");
await mkdir(outputDirectory, { recursive: true });
const url = process.env.TEST_URL || "http://127.0.0.1:3001";
try {
  for (const route of ["/", "/mixed"]) {
    const mixed = route === "/mixed";
    const prefix = mixed ? "mixed-" : "";
    const results = [];
    for (const [name, width, scale] of [
      ["desktop", 1440, 1],
      ["mobile", 390, 2],
    ]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        deviceScaleFactor: scale,
        acceptDownloads: true,
      });
      const page = await context.newPage();
      page.on("pageerror", (error) => console.error(error));
      await page.goto(new URL(route, url).href);
      await page.getByRole("button", { name: "HTML 내보내기" }).waitFor();
      await page.waitForFunction(() =>
        Object.keys(document.querySelector("button") ?? {}).some((key) =>
          key.startsWith("__reactProps"),
        ),
      );
      const downloading = page.waitForEvent("download");
      await page.getByRole("button", { name: "HTML 내보내기" }).click();
      const download = await Promise.race([
        downloading,
        page
          .getByRole("alert")
          .waitFor()
          .then(async () => {
            throw new Error(await page.getByRole("alert").innerText());
          }),
      ]);
      const path = resolve(outputDirectory, `${prefix}${name}.html`);
      await download.saveAs(path);
      if (name === "desktop") {
        await page
          .locator("[data-export-ignore]")
          .evaluateAll((nodes) => nodes.forEach((node) => node.remove()));
        await page.screenshot({
          path: resolve(outputDirectory, `${prefix}source.png`),
          fullPage: true,
        });
      }
      const html = await readFile(path, "utf8");
      assert.ok(
        html.includes("data:font/woff2;base64,") ||
          html.includes("data:application/font-woff"),
      );
      assert.ok(!html.includes("<script"));
      assert.ok(!html.includes("HTML 내보내기"));
      const requests = [];
      page.on("request", (request) => {
        if (/^https?:/.test(request.url())) requests.push(request.url());
      });
      await context.setOffline(true);
      await page.goto(pathToFileURL(path).href);
      await page.evaluate(() => document.fonts.ready);
      const metrics = await page.evaluate((mixed) => {
        const rect = (selector) => {
          const { x, y, width, height } = document
            .querySelector(selector)
            .getBoundingClientRect();
          return { x, y, width, height };
        };
        return {
          page: rect(mixed ? '[data-testid="mixed-page"]' : ".page-shell"),
          title: rect("h1"),
          chart: rect("svg"),
          end: rect(mixed ? '[aria-labelledby="next-title"]' : "footer"),
          columns: mixed
            ? getComputedStyle(
                document.querySelector('[data-testid="metric-grid"]'),
              ).gridTemplateColumns
            : null,
          progress: mixed ? rect(".mantine-Progress-root") : null,
          fonts: [...document.fonts].map((font) => ({
            family: font.family,
            weight: font.weight,
            status: font.status,
          })),
          fill: getComputedStyle(
            document.querySelector(mixed ? 'path[fill^="url"]' : "polygon"),
          ).fill,
        };
      }, mixed);
      assert.equal(metrics.page.width, 1440);
      assert.ok(metrics.end.y > metrics.chart.y);
      if (mixed) {
        assert.equal(metrics.columns.split(" ").length, 3);
        assert.ok(metrics.progress.width > 0);
      } else {
        assert.ok(
          await page
            .locator(".brand-mark + p")
            .evaluate((node) => node.getBoundingClientRect().y < 40),
          "Brand must remain on the header's first row",
        );
      }
      assert.ok(metrics.fonts.some((font) => font.status === "loaded"));
      assert.ok(metrics.fonts.every((font) => font.status !== "error"));
      assert.match(metrics.fill, mixed ? /#mixed-chart-area/ : /#area/);
      assert.deepEqual(requests, []);
      results.push(metrics);
      await page.screenshot({
        path: resolve(outputDirectory, `${prefix}${name}.png`),
        fullPage: true,
      });
      for (const viewportWidth of [1920, 2560, 390]) {
        await page.setViewportSize({ width: viewportWidth, height: 900 });
        const centered = await page.evaluate((mixed) => {
          const root = document
            .querySelector(mixed ? '[data-testid="mixed-page"]' : ".page-shell")
            .getBoundingClientRect();
          const title = document.querySelector("h1").getBoundingClientRect();
          return {
            x: root.x,
            width: root.width,
            height: root.height,
            titleX: title.x,
            titleWidth: title.width,
          };
        }, mixed);
        const offset = Math.max(0, (viewportWidth - 1440) / 2);
        assert.equal(
          centered.x,
          offset,
          "Export must be centered on wide screens and start at the left on narrow screens",
        );
        assert.equal(centered.width, metrics.page.width);
        assert.equal(centered.height, metrics.page.height);
        assert.equal(centered.titleX, metrics.title.x + offset);
        assert.equal(centered.titleWidth, metrics.title.width);
      }
      await context.close();
    }
    assert.deepEqual(
      { ...results[0], fonts: undefined },
      { ...results[1], fonts: undefined },
      "Export geometry must not depend on viewport or pixel density",
    );
    console.log(
      JSON.stringify({ passed: true, route, metrics: results[0] }, null, 2),
    );
  }
} finally {
  await browser.close();
}

import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createServer as createViteServer } from "vite";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const fixture = resolve("tests/fixtures/design-system");
const files = new Map();
for (const name of [
  "styles.css",
  "tokens.css",
  "unsupported.css",
  "background.svg",
])
  files.set(name, await readFile(resolve(fixture, name)));
files.set(
  "font.woff2",
  await readFile("assets/fonts/SpoqaHanSansNeo-Regular.woff2"),
);
files.set("print.css", Buffer.from(".ds-card { display: none; }"));
function serve(req, res) {
  const name = new URL(req.url, "http://fixture").pathname.split("/").pop();
  const body = files.get(name);
  res.writeHead(body ? 200 : 404, {
    "Content-Type": name.endsWith(".css")
      ? "text/css"
      : name.endsWith(".svg")
        ? "image/svg+xml"
        : "font/woff2",
    // Deliberately no Access-Control-Allow-Origin on the external CSS.
    ...(name.endsWith(".woff2") ? { "Access-Control-Allow-Origin": "*" } : {}),
  });
  res.end(body || "Missing fixture");
}
const external = createServer(serve);
let vite;
let browser;
try {
  await new Promise((resolve) => external.listen(0, "127.0.0.1", resolve));
  const externalOrigin = `http://127.0.0.1:${external.address().port}`;
  vite = await createViteServer({
    configFile: false,
    server: { host: "127.0.0.1", port: 0 },
    appType: "custom",
  });
  vite.middlewares.use((req, res, next) => {
    if (req.url.startsWith("/vendor/")) return serve(req, res);
    if (req.url !== "/fixture") return next();
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(`<!doctype html><html lang="ko"><head>
      <link rel="stylesheet" href="${externalOrigin}/styles.css?v=1">
      <link rel="stylesheet" href="${externalOrigin}/print.css" media="print">
      <style>.ds-button { border-radius: 7px; }</style>
      </head><body><div class="ds-card"><h1>외부 디자인 시스템</h1>
      <button class="ds-button">내보내기 확인</button></div></body></html>`);
  });
  await vite.listen();
  const origin = `http://127.0.0.1:${vite.httpServer.address().port}`;
  assert.notEqual(origin, externalOrigin);
  assert.equal(
    (await fetch(`${externalOrigin}/styles.css`)).headers.get(
      "access-control-allow-origin",
    ),
    null,
  );
  browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL || "msedge",
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await page.goto(`${origin}/fixture`);
  await page.evaluate(() => document.fonts.ready);
  const metrics = () => {
    const card = document.querySelector(".ds-card");
    const button = document.querySelector(".ds-button");
    const css = getComputedStyle(card);
    const btn = getComputedStyle(button);
    return {
      width: card.getBoundingClientRect().width,
      height: card.getBoundingClientRect().height,
      display: css.display,
      radius: css.borderRadius,
      font: css.fontFamily,
      background: btn.backgroundColor,
      buttonRadius: btn.borderRadius,
      before: getComputedStyle(button, "::before").content,
    };
  };
  const before = await page.evaluate(metrics);
  assert.equal(before.background, "rgb(22, 119, 255)");
  assert.equal(before.radius, "12px");
  assert.equal(before.buttonRadius, "7px");
  assert.notEqual(before.display, "none");
  const blocked = await page.evaluate(() => {
    try {
      return document.styleSheets[0].cssRules.length;
    } catch (error) {
      return error.name;
    }
  });
  assert.equal(blocked, "SecurityError");
  const replacements = {
    [`${externalOrigin}/styles.css?v=1`]: "/vendor/styles.css",
    [`${externalOrigin}/print.css`]: "/vendor/print.css",
  };
  const exportPage = (mapping) =>
    page.evaluate(async (stylesheetReplacements) => {
      const { createStandaloneHtml } = await import(
        "/components/exportStandaloneHtml.ts"
      );
      try {
        return {
          html: await createStandaloneHtml({
            target: document.querySelector(".ds-card"),
            stylesheetReplacements,
          }),
        };
      } catch (error) {
        return { error: error.message };
      }
    }, mapping);
  assert.match((await exportPage({})).error, /外部|외부 스타일시트/);
  assert.match(
    (
      await exportPage({
        ...replacements,
        [`${externalOrigin}/styles.css?v=1`]: `${externalOrigin}/styles.css`,
      })
    ).error,
    /같은 출처/,
  );
  assert.match(
    (
      await exportPage({
        ...replacements,
        [`${externalOrigin}/styles.css?v=1`]: "/vendor/missing.css",
      })
    ).error,
    /로딩 실패/,
  );
  const result = await exportPage(replacements);
  assert.equal(result.error, undefined);
  assert.match(result.html, /data:font\/woff2;base64,/);
  assert.match(result.html, /data:image\/svg\+xml;base64,/);
  assert.ok(!result.html.includes(externalOrigin));
  assert.deepEqual(
    await page.evaluate(metrics),
    before,
    "Original page must remain unchanged",
  );
  assert.equal(await page.locator("iframe").count(), 0);
  assert.equal(
    await page.locator(`link[href="${externalOrigin}/styles.css?v=1"]`).count(),
    1,
  );
  const output = resolve(".export-test/external-stylesheet.html");
  await mkdir(resolve(".export-test"), { recursive: true });
  await writeFile(output, result.html);
  await page.screenshot({ path: resolve(".export-test/external-source.png") });
  await context.setOffline(true);
  const requests = [];
  page.on("request", (req) => {
    if (/^https?:/.test(req.url())) requests.push(req.url());
  });
  await page.goto(pathToFileURL(output).href);
  await page.evaluate(() => document.fonts.ready);
  assert.deepEqual(await page.evaluate(metrics), before);
  assert.deepEqual(requests, []);
  assert.ok(
    await page.evaluate(() =>
      [...document.fonts].some(
        (font) => font.family === "ExportFixture" && font.status === "loaded",
      ),
    ),
  );
  assert.ok(
    await page
      .locator(".ds-card")
      .evaluate((node) =>
        getComputedStyle(node).backgroundImage.includes("data:image/svg+xml"),
      ),
  );
  await page.screenshot({ path: resolve(".export-test/external-offline.png") });
  console.log(
    JSON.stringify(
      {
        passed: true,
        corsBlocked: true,
        offlineRequests: requests,
        metrics: before,
        output,
      },
      null,
      2,
    ),
  );
} finally {
  await browser?.close();
  await vite?.close();
  await new Promise((resolve) => external.close(resolve));
}

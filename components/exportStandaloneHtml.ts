import fontLicense from "../assets/fonts/LICENSE?raw";

/** Standard CSS-pixel viewport; document height grows to include the entire target. */
export const EXPORT_WIDTH = 1440;
const EXPORT_HEIGHT = 900;

export interface HtmlExportOptions {
  target: HTMLElement;
  filename?: string;
  title?: string;
  /** Exact external stylesheet URL -> same-origin copy used only for export. */
  stylesheetReplacements?: Record<string, string>;
}

/** Export a static, selectable DOM snapshot, without a server or runtime scripts. */
export async function createStandaloneHtml({
  target,
  title = document.title,
  stylesheetReplacements = {},
}: HtmlExportOptions) {
  const cache = new Map<string, Promise<string>>();
  const asDataUrl = (
    value: string,
    base = document.baseURI,
  ): Promise<string> => {
    if (value.startsWith("data:") || value.startsWith("#"))
      return Promise.resolve(value);
    const url = new URL(value, base).href;
    // Browsers may resolve local SVG paint references to the current document URL.
    if (url.includes("#") && url.split("#")[0] === document.URL.split("#")[0]) {
      return Promise.resolve(`#${url.split("#").slice(1).join("#")}`);
    }
    let pending = cache.get(url);
    if (!pending) {
      pending = (async () => {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(30_000),
        });
        if (!response.ok)
          throw new Error(
            `리소스를 읽을 수 없습니다 (${response.status}): ${url}`,
          );
        const blob = await response.blob();
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error(`리소스 변환 실패: ${url}`));
          reader.readAsDataURL(blob);
        });
      })();
      cache.set(url, pending);
    }
    return pending;
  };
  const embedUrls = async (css: string, base = document.baseURI) => {
    const matches = [
      ...css.matchAll(/url\(\s*(?:"([^"\n]*)"|'([^'\n]*)'|([^)]*?))\s*\)/g),
    ];
    const replacements = await Promise.all(
      matches.map(
        async (match) =>
          `url("${await asDataUrl(match[1] ?? match[2] ?? match[3], base)}")`,
      ),
    );
    let index = 0;
    return css.replace(
      /url\(\s*(?:"([^"\n]*)"|'([^'\n]*)'|([^)]*?))\s*\)/g,
      () => replacements[index++],
    );
  };
  const fontRules: string[] = [];
  async function readLocalSheet(path: string): Promise<string> {
    const url = new URL(path, document.baseURI);
    if (url.origin !== window.location.origin) {
      throw new Error(`대체 CSS는 같은 출처여야 합니다: ${url.href}`);
    }
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.tabIndex = -1;
    frame.style.display = "none";
    document.body.appendChild(frame);
    try {
      const doc = frame.contentDocument;
      if (!doc) throw new Error("CSS 로딩 문서를 만들 수 없습니다.");
      const link = doc.createElement("link");
      link.rel = "stylesheet";
      await new Promise<void>((resolve, reject) => {
        const finish = (error?: Error) => {
          clearTimeout(timer);
          link.onload = null;
          link.onerror = null;
          if (error) reject(error);
          else resolve();
        };
        const timer = window.setTimeout(
          () => finish(new Error(`대체 CSS 로딩 시간 초과: ${url.href}`)),
          30_000,
        );
        link.onload = () => finish();
        link.onerror = () =>
          finish(new Error(`대체 CSS 로딩 실패: ${url.href}`));
        link.href = url.href;
        doc.head.appendChild(link);
      });
      if (!link.sheet)
        throw new Error(`대체 CSS를 읽을 수 없습니다: ${url.href}`);
      // The local copy must be self-contained; do not apply replacements again.
      return await readSheet(link.sheet, false);
    } finally {
      frame.remove();
    }
  }
  async function readSheet(
    sheet: CSSStyleSheet,
    allowReplacement = true,
  ): Promise<string> {
    const replacement =
      sheet.href &&
      allowReplacement &&
      Object.hasOwn(stylesheetReplacements, sheet.href)
        ? stylesheetReplacements[sheet.href]
        : undefined;
    if (replacement !== undefined) return readLocalSheet(replacement);
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      throw new Error(
        `외부 스타일시트에 접근할 수 없습니다. 같은 출처에서 제공하거나 stylesheetReplacements에 로컬 CSS를 지정해 주세요: ${sheet.href}`,
      );
    }
    const result: string[] = [];
    for (const rule of Array.from(rules)) {
      // Replacement rules belong to another iframe realm: avoid instanceof.
      if (rule.type === CSSRule.IMPORT_RULE) {
        const importRule = rule as CSSImportRule;
        if (!importRule.styleSheet)
          throw new Error("스타일시트가 아직 로드되지 않았습니다.");
        let imported = await readSheet(importRule.styleSheet, allowReplacement);
        if (importRule.media.mediaText)
          imported = `@media ${importRule.media.mediaText}{${imported}}`;
        if (importRule.supportsText)
          imported = `@supports (${importRule.supportsText}){${imported}}`;
        if (importRule.layerName !== null)
          imported = `@layer ${importRule.layerName}{${imported}}`;
        result.push(imported);
      } else {
        const text = await embedUrls(
          rule.cssText,
          sheet.href ?? document.baseURI,
        );
        result.push(text);
        if (rule.type === CSSRule.FONT_FACE_RULE) fontRules.push(text);
      }
    }
    return result.join("\n");
  }
  const styles = (
    await Promise.all(
      Array.from(document.styleSheets)
        .filter((sheet) => !sheet.disabled)
        .map(async (sheet) => {
          const css = await readSheet(sheet);
          return sheet.media.mediaText
            ? `@media ${sheet.media.mediaText}{${css}}`
            : css;
        }),
    )
  ).join("\n");
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.tabIndex = -1;
  frame.style.cssText = `position:fixed;left:-100000px;top:0;width:${EXPORT_WIDTH}px;height:${EXPORT_HEIGHT}px;border:0;pointer-events:none;`;
  document.body.appendChild(frame);
  try {
    const doc = frame.contentDocument;
    const view = frame.contentWindow;
    if (!doc || !view) throw new Error("내보내기 문서를 만들 수 없습니다.");
    for (const attribute of Array.from(document.documentElement.attributes))
      doc.documentElement.setAttribute(attribute.name, attribute.value);
    for (const attribute of Array.from(document.body.attributes))
      doc.body.setAttribute(attribute.name, attribute.value);
    const style = doc.createElement("style");
    style.textContent = `${styles}\n*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important} html{font-size:16px!important;scroll-behavior:auto!important} body{margin:0!important}`;
    doc.head.appendChild(style);
    // Preserve ancestor selectors and inherited theme variables for arbitrary targets.
    let parent: HTMLElement = doc.body;
    const ancestors: HTMLElement[] = [];
    for (
      let ancestor = target.parentElement;
      ancestor && ancestor !== document.body;
      ancestor = ancestor.parentElement
    )
      ancestors.unshift(ancestor);
    for (const ancestor of ancestors) {
      const shell = ancestor.cloneNode(false) as HTMLElement;
      parent.appendChild(shell);
      parent = shell;
    }
    const source = target.cloneNode(true) as HTMLElement;
    const originals = [target, ...target.querySelectorAll("*")];
    const clones = [source, ...source.querySelectorAll("*")];
    // Copy live state before filtering nodes, while the DOM indexes still match.
    originals.forEach((original, index) => {
      const copy = clones[index];
      if (
        original instanceof HTMLInputElement &&
        copy instanceof HTMLInputElement
      ) {
        copy.value = original.value;
        copy.checked = original.checked;
      }
      if (
        original instanceof HTMLTextAreaElement &&
        copy instanceof HTMLTextAreaElement
      )
        copy.value = original.value;
      if (
        original instanceof HTMLSelectElement &&
        copy instanceof HTMLSelectElement
      )
        copy.value = original.value;
    });
    source.querySelectorAll("script,[data-export-ignore]").forEach((node) => {
      node.remove();
    });
    if (source.querySelector("iframe,object,embed,video,audio,canvas"))
      throw new Error("미디어 또는 캔버스는 이미지로 변환한 뒤 내보내 주세요.");
    parent.appendChild(source);
    await Promise.all(
      Array.from(source.querySelectorAll("img")).map(async (img) => {
        img.removeAttribute("srcset");
        img.removeAttribute("sizes");
        img
          .closest("picture")
          ?.querySelectorAll("source")
          .forEach((node) => {
            node.remove();
          });
        img.loading = "eager";
        img.src = await asDataUrl(img.getAttribute("src") ?? "");
        await img.decode();
      }),
    );
    for (const node of source.querySelectorAll("svg image,svg use")) {
      const href = node.getAttribute("href") ?? node.getAttribute("xlink:href");
      if (href && !href.startsWith("#")) {
        if (node.localName === "use")
          throw new Error(
            "외부 SVG 심볼은 문서 내부에 포함한 뒤 내보내 주세요.",
          );
        node.setAttribute("href", await asDataUrl(href));
        node.removeAttribute("xlink:href");
      }
    }
    // Force layout before waiting so all actually used font faces are requested.
    source.getBoundingClientRect();
    await doc.fonts.ready;
    for (const face of doc.fonts)
      if (face.status === "error")
        throw new Error("폰트를 불러오지 못했습니다.");
    const output = source.cloneNode(true) as HTMLElement;
    const sourceNodes = [source, ...source.querySelectorAll("*")];
    const outputNodes = [output, ...output.querySelectorAll("*")];
    const pseudos: string[] = [];
    async function declaration(computed: CSSStyleDeclaration) {
      const holder = document.createElement("span");
      for (const property of Array.from(computed)) {
        if (!property.startsWith("--"))
          holder.style.setProperty(
            property,
            await embedUrls(computed.getPropertyValue(property)),
          );
      }
      return holder.style.cssText;
    }
    for (let index = 0; index < sourceNodes.length; index++) {
      const node = sourceNodes[index];
      const copy = outputNodes[index];
      copy.setAttribute(
        "style",
        await declaration(view.getComputedStyle(node)),
      );
      // Resolved intrinsic widths are rounded by CSSOM. Avoid creating a new
      // flex line from that rounding when the standard viewport has one row.
      const layout = view.getComputedStyle(node);
      if (
        layout.display === "flex" &&
        layout.flexDirection.startsWith("row") &&
        layout.flexWrap !== "nowrap"
      ) {
        const boxes = Array.from(node.children)
          .map((child) => child.getBoundingClientRect())
          .filter((box) => box.width && box.height);
        if (
          boxes.length > 1 &&
          Math.max(...boxes.map((box) => box.top)) <
            Math.min(...boxes.map((box) => box.bottom))
        ) {
          (copy as HTMLElement).style.flexWrap = "nowrap";
        }
      }
      copy.setAttribute("data-export-node", String(index));
      for (const pseudo of ["::before", "::after"] as const) {
        const computed = view.getComputedStyle(node, pseudo);
        if (computed.content !== "none" && computed.content !== "normal")
          pseudos.push(
            `[data-export-node="${index}"]${pseudo}{${await declaration(computed)}}`,
          );
      }
      for (const attribute of Array.from(copy.attributes)) {
        if (
          /^on/i.test(attribute.name) ||
          /^(srcset|sizes|autofocus|contenteditable)$/i.test(attribute.name)
        )
          copy.removeAttribute(attribute.name);
        if (
          /^(href|action|formaction)$/i.test(attribute.name) &&
          /^javascript:/i.test(attribute.value.trim())
        )
          copy.removeAttribute(attribute.name);
      }
      if (node.localName === "input") {
        copy.setAttribute("value", (node as HTMLInputElement).value);
        copy.toggleAttribute("checked", (node as HTMLInputElement).checked);
      }
      if (node.localName === "textarea")
        copy.textContent = (node as HTMLTextAreaElement).value;
      if (node.localName === "option")
        copy.toggleAttribute("selected", (node as HTMLOptionElement).selected);
    }
    output.querySelectorAll("style,link,script").forEach((node) => {
      node.remove();
    });
    const exported = document.implementation.createHTMLDocument(title);
    exported.documentElement.lang = document.documentElement.lang || "ko";
    const charset = exported.createElement("meta");
    charset.setAttribute("charset", "utf-8");
    exported.head.insertBefore(charset, exported.head.firstChild);
    exported.head.appendChild(
      exported.createComment(` Bundled font license:\n${fontLicense}\n`),
    );
    const viewport = exported.createElement("meta");
    viewport.name = "viewport";
    viewport.content = `width=${EXPORT_WIDTH}`;
    exported.head.appendChild(viewport);
    const frozen = exported.createElement("style");
    frozen.textContent = `${fontRules.join("\n")}\nhtml{min-width:${EXPORT_WIDTH}px;font-size:16px}body{margin:0 auto;width:${EXPORT_WIDTH}px;background:${view.getComputedStyle(doc.body).backgroundColor}}\n${pseudos.join("\n")}`;
    exported.head.appendChild(frozen);
    exported.body.appendChild(output);
    return `<!doctype html>\n${exported.documentElement.outerHTML}`;
  } finally {
    frame.remove();
  }
}

export async function downloadStandaloneHtml(options: HtmlExportOptions) {
  const html = await createStandaloneHtml(options);
  const url = URL.createObjectURL(
    new Blob([html], { type: "text/html;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = options.filename ?? "page.html";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

Generated with [vike.dev/new](https://vike.dev/new) ([version 681](https://www.npmjs.com/package/create-vike/v/0.0.681)) using this command:

```sh
pnpm create vike@latest --react --tailwindcss --mantine --cloudflare --oxlint --biome
```

## Contents

- [Vike](#vike)
  - [Plus files](#plus-files)
  - [Routing](#routing)
  - [SSR](#ssr)
  - [HTML Streaming](#html-streaming)
- [Mantine](#mantine)

## Standalone HTML 내보내기

다른 도메인의 디자인 시스템 CSS는 `stylesheetReplacements`로 동일 출처의 로컬 사본을 지정할 수 있습니다. [외부 CSS 적용 가이드](docs/external-stylesheets.md)에 다운로드·연결 방법, 구현 원리, 실제 CORS/오프라인 검증 절차를 정리했습니다.

**PDF 내보내기**는 동일한 standalone HTML을 별도 창에 생성하고 폰트·이미지 로딩 후 브라우저 인쇄창을 엽니다. 인쇄 대상에서 **PDF로 저장**을 선택하세요. 원래 페이지 본문은 변경하지 않으며, 인쇄 문서에만 A4 세로/12mm 여백과 고정 레이아웃 축소 배율을 적용합니다. 저장·취소·닫기 등으로 인쇄창이 종료되면 인쇄용 새 탭도 자동으로 닫힙니다. 원래 페이지 탭은 유지됩니다. 팝업이 차단된 경우 버튼 아래에 안내합니다.

인쇄 흐름 검증: `node tests/print-html.mjs` (아래 HTML 테스트와 같은 실행 환경). 헤드리스 환경에서 실제 OS 인쇄창 대신 `print()` 호출을 관찰하고, 리소스 로딩·A4 배율·본문 불변·팝업 차단 처리를 확인합니다.

페이지 상단의 **HTML 내보내기** 버튼은 `Page`의 루트에 연결된 `exportTarget` ref를 `briefly.html`로 저장합니다. 버튼과 오류 안내는 `data-export-ignore`로 제외됩니다.

- 1440 × 900 CSS px의 별도 viewport에서 레이아웃을 계산하며, 문서 높이는 전체 콘텐츠에 맞춰 늘어납니다. 원래 창 크기나 화면 배율에 영향을 받지 않습니다.
- 계산된 스타일, 이미지, SVG 차트, 로컬 Spoqa Han Sans Neo 폰트를 문서 안에 포함합니다. 저장한 파일은 `file://` 및 오프라인 환경에서 열 수 있으며 텍스트 선택도 가능합니다.
- 다른 부분을 저장하려면 `downloadStandaloneHtml({ target: element, filename: "section.html" })`에 해당 DOM 요소를 전달합니다. `createStandaloneHtml`은 다운로드 없이 HTML 문자열을 반환합니다.
- 정적 스냅샷이므로 React 이벤트와 스크립트는 포함하지 않습니다. iframe, canvas, 동영상 및 외부 SVG 심볼은 먼저 이미지 또는 내부 SVG로 변환해야 합니다.
- 내보내는 시점에는 리소스를 읽을 수 있어야 합니다. 외부 리소스가 CORS를 허용하지 않으면 동일 출처에서 제공해야 하며, 누락된 리소스가 있는 파일을 저장하는 대신 오류를 표시합니다. 현재 페이지의 폰트는 CDN 대신 프로젝트에 포함되어 있습니다.

검증: `node tests/export-html.mjs` (Playwright와 Edge 필요). 개발 서버 주소는 `TEST_URL`, 브라우저 채널은 `BROWSER_CHANNEL`로 지정할 수 있습니다. 기본 주소는 `http://127.0.0.1:3001`입니다. 모바일/데스크톱 다운로드, 오프라인 직접 열기, 외부 요청 없음, 동일한 배치와 폰트 로딩을 검사합니다.

## Vike

This app is ready to start. It's powered by [Vike](https://vike.dev) and [React](https://react.dev/learn).

### Plus files

[The + files are the interface](https://vike.dev/config) between Vike and your code.

- [`+config.ts`](https://vike.dev/settings) — Settings (e.g. `<title>`)
- [`+Page.tsx`](https://vike.dev/Page) — The `<Page>` component
- [`+data.ts`](https://vike.dev/data) — Fetching data (for your `<Page>` component)
- [`+Layout.tsx`](https://vike.dev/Layout) — The `<Layout>` component (wraps your `<Page>` components)
- [`+Head.tsx`](https://vike.dev/Head) - Sets `<head>` tags
- [`/pages/_error/+Page.tsx`](https://vike.dev/error-page) — The error page (rendered when an error occurs)
- [`+onPageTransitionStart.ts`](https://vike.dev/onPageTransitionStart) and `+onPageTransitionEnd.ts` — For page transition animations

### Routing

[Vike's built-in router](https://vike.dev/routing) lets you choose between:

- [Filesystem Routing](https://vike.dev/filesystem-routing) (the URL of a page is determined based on where its `+Page.jsx` file is located on the filesystem)
- [Route Strings](https://vike.dev/route-string)
- [Route Functions](https://vike.dev/route-function)

### SSR

SSR is enabled by default. You can [disable it](https://vike.dev/ssr) for all or specific pages.

### HTML Streaming

You can [enable/disable HTML streaming](https://vike.dev/stream) for all or specific pages.

## Mantine

This is a boilerplate for Mantine based on the [Getting Started](https://mantine.dev/docs/getting-started/) guide.

The following Packages are installed:

- `@mantine/hooks` Hooks for state and UI management
- `@mantine/core` Core components library: inputs, buttons, overlays, etc.

If you add more packages, make sure to update the `layouts/Layout.tsx` file to include the required CSSs.

The theme is defined in `layouts/theme.ts`.

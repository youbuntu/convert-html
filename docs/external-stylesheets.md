# 외부 디자인 시스템 CSS를 포함하는 standalone HTML 내보내기

## 대상과 해결 방식

antd 기반 사내 디자인 시스템의 CSS를 애플리케이션과 다른 출처에서 가져오는 상황을 대상으로 합니다. 폰트 CSS뿐 아니라 버튼, 표, 간격, 색상 등 디자인 시스템 전체 CSS가 해당합니다.

화면에서 CSS가 정상 적용되더라도 JavaScript의 `sheet.cssRules` 접근은 차단될 수 있습니다. 출처는 프로토콜·호스트·포트로 구분됩니다. 오류의 `sheet.href`는 문제가 발생한 CSS 주소를 나타낼 뿐, 그 내용을 읽을 권한을 의미하지 않습니다.

이 프로젝트는 `stylesheetReplacements` 옵션으로 해결합니다.

1. 개발 환경에서 사용 중인 디자인 시스템 CSS와 종속 리소스를 다운로드합니다.
2. 다운로드한 사본을 애플리케이션과 같은 출처에서 제공합니다.
3. 내보내기 호출에 외부 URL → 로컬 URL 매핑을 전달합니다.
4. 원래 화면의 외부 CSS 링크는 유지합니다. 내보내기만 로컬 사본을 읽습니다.

브라우저 CORS를 우회하거나 외부 서버에 프록시 요청을 보내는 기능은 아닙니다. `fetch(url, { mode: "no-cors" })`도 읽을 수 있는 CSS 본문을 제공하지 않습니다.

## 1. 현재 적용된 CSS 주소 확인

외부 프로젝트의 브라우저 콘솔에서 실행합니다.

```js
Array.from(document.styleSheets, (sheet) => ({
  href: sheet.href,
  disabled: sheet.disabled,
  media: sheet.media.mediaText,
}));
```

오류에 표시된 URL 전체를 기록합니다. 버전 쿼리 문자열도 매핑 키에 포함해야 합니다. `href: null`은 보통 인라인 스타일입니다. antd 또는 사내 라이브러리가 동적으로 주입한 인라인 CSS는 읽을 수 있다면 기존 경로로 처리됩니다. 라이브러리 이름을 기준으로 CSS를 제외하지 않습니다.

## 2. CSS와 종속 리소스 저장

외부 프로젝트 루트에서 PowerShell을 실행합니다. 아래 주소는 예시이므로 실제 `sheet.href`로 변경합니다.

```powershell
New-Item -ItemType Directory -Force public/vendor/design-system

Invoke-WebRequest `
  -Uri "https://design.example.com/releases/1.2.3/styles.css?v=1" `
  -OutFile "public/vendor/design-system/styles.css"
```

이 명령은 개발 PC에서 수행하므로 브라우저 CORS 제한을 받지 않습니다. 네트워크 접근 권한과 서버 인증은 여전히 필요합니다. 인증이 필요한 경우 사내 승인된 다운로드 방법을 사용하고, 인증 정보를 저장소에 커밋하지 않습니다.

위 명령은 CSS 한 파일만 다운로드합니다. 다음 참조를 확인하여 필요한 파일도 함께 저장해야 합니다.

| CSS 참조 | 처리 |
| --- | --- |
| `@import "./tokens.css"` | tokens.css와 그 하위 import도 저장 |
| `url("./fonts/ui.woff2")` | 동일한 상대 디렉터리 구조로 폰트 저장 |
| `url("https://cdn.example.com/bg.svg")` | 이미지 저장 후 로컬 상대 경로로 수정 |
| `url("/assets/bg.svg")` | 로컬 서버 루트 기준 경로이므로 해당 위치에 제공하거나 상대 경로로 수정 |
| `url("data:...")`, `url("#icon")` | 그대로 유지 |

예시 디렉터리:

```text
public/vendor/design-system/
  styles.css
  tokens.css
  fonts/ui.woff2
  images/background.svg
```

```css
@import "./tokens.css";

@font-face {
  font-family: "Company UI";
  src: url("./fonts/ui.woff2") format("woff2");
}

.company-panel {
  background-image: url("./images/background.svg");
}
```

사용 중인 디자인 시스템 버전과 로컬 사본의 버전을 맞추고 해당 라이선스도 함께 보관합니다. 현재 저장소의 폰트 라이선스 주석은 Spoqa 폰트용이며, 외부 디자인 시스템의 라이선스를 자동 수집하지 않습니다.

`public` 파일이 같은 출처로 제공되는지 실제 배포 환경에서 확인합니다. CDN으로 리디렉션되면 다시 접근이 막힐 수 있습니다. 하위 경로로 배포하는 앱은 `/my-app/vendor/...` 등 실제 제공 경로를 사용합니다.

## 3. 내보내기에 매핑 전달

```tsx
await downloadStandaloneHtml({
  target: exportTarget.current!,
  filename: "report.html",
  stylesheetReplacements: {
    "https://design.example.com/releases/1.2.3/styles.css?v=1":
      "/vendor/design-system/styles.css",
  },
});
```

HTML 문자열만 필요하면 같은 옵션을 `createStandaloneHtml()`에 전달합니다. `downloadStandaloneHtml()`은 옵션을 그대로 전달합니다. `printStandaloneHtml()`도 동일한 `HtmlExportOptions`를 사용하므로 직접 호출할 때 같은 옵션을 전달할 수 있습니다.

옵션의 키는 `sheet.href`와 정확히 일치해야 합니다. 값은 프로젝트와 같은 출처의 CSS URL이어야 합니다. 여러 외부 스타일시트가 있다면 각각 매핑합니다. 비활성화된 스타일시트는 기존처럼 제외합니다.

원본 링크를 제거하거나 로컬 링크를 원래 페이지에 추가할 필요는 없습니다. 디자인 시스템이 링크를 자동 삽입하는 경우에도 매핑을 사용할 수 있습니다. 다만 동적 스타일 주입과 데이터 렌더링이 완료된 뒤 내보내기를 호출해야 합니다.

## 4. 구현 동작

구현 파일: `components/exportStandaloneHtml.ts`.

- `readSheet()`는 지정된 외부 URL을 발견하면 원래 `cssRules`를 읽기 전에 대체 CSS로 전환합니다.
- 로컬 CSS는 숨겨진 별도 iframe의 `<link>`로 로드합니다. 원래 화면의 스타일 순서는 변경하지 않습니다.
- 로딩은 최대 30초 기다리고, 실패하거나 시간이 초과되면 명시적으로 오류를 반환합니다.
- CSS 규칙이 별도 iframe에 속하므로 `instanceof` 대신 `rule.type`으로 import와 font-face를 식별합니다.
- 중첩 `@import`를 처리하고 `media`, `supports`, `layer` 조건을 보존합니다. 상위 스타일시트의 media 조건도 보존합니다.
- CSS의 상대 리소스 경로는 로컬 CSS URL을 기준으로 해석하고 기존 로직으로 데이터 URL에 내장합니다.
- 원본 스타일시트 순서에 맞춰 CSS를 모아 1440px 내보내기 문서에 적용하고 계산된 스타일을 고정합니다.
- 성공·실패 모두 임시 iframe을 정리합니다.

대체 로컬 CSS를 읽는 동안에는 추가 URL 매핑을 적용하지 않습니다. 로컬 사본 자체의 모든 import와 이미지·폰트 경로를 준비해야 합니다. 원본에 대체 파일이 없거나 대체 파일에 읽을 수 없는 리소스가 남아 있으면 오류를 무시하지 않고 내보내기를 중단합니다.

## 5. 실제 외부 CSS 검증

자동 검증 파일: `tests/external-stylesheet.mjs`.

```sh
node tests/external-stylesheet.mjs
```

Playwright와 Edge가 설치된 환경에서 실행합니다. Playwright가 프로젝트 모듈 경로에 없다면 `PLAYWRIGHT_MODULE`에 모듈 경로 또는 파일 URL을 지정합니다. `BROWSER_CHANNEL`로 브라우저 채널을 변경할 수 있습니다. 별도로 개발 서버를 실행할 필요는 없습니다.

테스트는 서로 다른 포트의 HTTP 서버 두 개를 실제 실행합니다. 한 서버가 애플리케이션과 로컬 사본을 제공하고, 다른 서버가 CORS 허용 헤더 없는 디자인 시스템 테스트 CSS를 제공합니다. 요청을 가로채거나 `cssRules`를 모킹하지 않습니다. 테스트 폰트에는 원래 화면과 비교할 수 있도록 CORS를 허용하지만, 오류를 재현하는 외부 CSS에는 허용하지 않습니다.

검증 항목:

1. 실제 외부 CSS가 원본 화면에 적용됩니다.
2. 외부 CSS의 `cssRules`를 읽으면 브라우저가 `SecurityError`를 발생시킵니다.
3. 매핑 없이 내보내면 기존 접근 오류가 발생합니다.
4. 다른 출처의 대체 URL은 거부되고, 없는 로컬 파일은 로딩 오류를 반환합니다.
5. 로컬 매핑을 적용하면 중첩 import의 토큰·레이어·supports 조건, 배경 이미지, 폰트, 의사 요소가 처리됩니다.
6. `media="print"` 스타일이 화면용 내보내기에 잘못 적용되지 않습니다.
7. 원본 링크와 원본 화면의 주요 계산 스타일이 유지되고 임시 iframe이 남지 않습니다.
8. 저장한 HTML을 브라우저 오프라인 모드의 `file://`로 다시 열어 크기·색상·폰트·모서리·의사 요소를 비교합니다.
9. 오프라인 문서에서 HTTP 요청이 발생하지 않고 내장 폰트가 로드됩니다.

결과물은 git에서 제외된 `.export-test/`에 생성됩니다.

```text
external-stylesheet.html
external-source.png
external-offline.png
```

2026-09-21 Edge 검증 결과: 통과. 카드 크기 420 × 186.875px, 모서리 12px, 버튼 색상 `rgb(22, 119, 255)`, 폰트와 의사 요소가 일치했으며 오프라인 HTTP 요청은 0건입니다.

추가 회귀 검증: `tests/export-html.mjs`로 기존 `/`, `/mixed` 페이지의 데스크톱·모바일 내보내기와 오프라인 재열기를 확인했고 모두 통과했습니다. TypeScript `tsc --noEmit`과 변경한 TypeScript/JavaScript 파일의 Biome lint도 통과했습니다.

이 검증은 실제 네트워크와 브라우저에서 테스트용 디자인 시스템 CSS를 사용한 검증입니다. 사내 antd 기반 디자인 시스템의 실제 URL과 파일은 제공되지 않았으므로 그 제품 자체의 호환성까지 검증한 것은 아닙니다. 적용 후 대표 버튼·표·모달 등 사용하는 컴포넌트를 별도로 확인해야 합니다. 포털로 target 밖에 렌더링된 요소나 Shadow DOM은 이 옵션으로 자동 포함되지 않습니다.

## 6. 문제 해결과 운영

| 증상 | 확인할 내용 |
| --- | --- |
| 원래 외부 CSS 접근 오류가 계속 발생 | 쿼리 문자열을 포함한 매핑 키, 다른 외부 CSS 누락, 옵션 전달 여부 |
| 대체 CSS 로딩 실패 | 404, 인증 응답, CSS MIME 타입, CSP, 실제 배포 경로 |
| 대체 CSS는 같은 출처여야 합니다 | 로컬 URL의 프로토콜·호스트·포트 |
| 로컬 CSS인데 접근 오류 발생 | 외부 도메인으로 리디렉션, 하위 import의 외부 URL |
| 이미지·폰트 리소스 변환 실패 | CSS 내부 경로, 실제 파일 존재 여부, 외부 URL 잔존 |
| 화면과 저장 결과가 다름 | 디자인 시스템 버전 차이, target 밖 포털, 아직 주입되지 않은 동적 스타일, 1440px 기준 레이아웃 |

디자인 시스템 업데이트 시 로컬 사본과 종속 리소스를 함께 갱신합니다. 버전이 고정된 원본 URL을 매핑하면 다른 버전의 CSS를 실수로 대체하는 일을 줄일 수 있습니다. 이 기능은 CSS 파일 자동 동기화나 전체 antd 컴포넌트 호환성을 보장하지 않습니다.

참고: [MDN CSSStyleSheet](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet), [MDN Request.mode](https://developer.mozilla.org/en-US/docs/Web/API/Request/mode).

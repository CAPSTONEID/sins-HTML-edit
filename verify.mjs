import { readFile, writeFile } from "node:fs/promises";

const cdpPort = Number(process.env.CDP_PORT || 9339);
const appUrl = process.env.APP_URL || "http://127.0.0.1:4189/index.html";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getPageWebSocketUrl() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${cdpPort}/json/list`);
      const pages = await response.json();
      const page = pages.find((item) => item.type === "page") || pages[0];
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      await sleep(250);
    }
  }
  throw new Error("Chrome CDP 엔드포인트를 찾을 수 없습니다.");
}

function connect(wsUrl) {
  const socket = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();

  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    if (!data.id || !pending.has(data.id)) return;
    const { resolve, reject } = pending.get(data.id);
    pending.delete(data.id);
    if (data.error) reject(new Error(data.error.message));
    else resolve(data.result);
  });

  return new Promise((resolve, reject) => {
    socket.addEventListener("open", () => {
      resolve({
        send(method, params = {}) {
          id += 1;
          socket.send(JSON.stringify({ id, method, params }));
          return new Promise((cmdResolve, cmdReject) => {
            pending.set(id, { resolve: cmdResolve, reject: cmdReject });
          });
        },
        close() {
          socket.close();
        }
      });
    });
    socket.addEventListener("error", reject);
  });
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true
  });

  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || "브라우저 평가 실패");
  }

  return result.result.value;
}

async function capture(client, path, width, height) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 700
  });
  await sleep(250);
  const result = await client.send("Page.captureScreenshot", { format: "png", fromSurface: true });
  await writeFile(path, Buffer.from(result.data, "base64"));
}

const wsUrl = await getPageWebSocketUrl();
const client = await connect(wsUrl);

try {
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Storage.clearDataForOrigin", {
    origin: new URL(appUrl).origin,
    storageTypes: "local_storage"
  });
  await client.send("Page.navigate", { url: appUrl });
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const ready = await evaluate(client, "document.readyState");
    if (ready === "complete") break;
    await sleep(150);
  }
  await sleep(800);

  const initial = await evaluate(client, `({
    pages: document.querySelectorAll(".page-item").length,
    sourceHasSample: document.getElementById("sourceEditor").value.includes("화면에서 바로 고치는 HTML 문서"),
    frameReady: Boolean(document.getElementById("previewFrame").contentDocument?.querySelector("h1"))
  })`);

  if (initial.pages !== 3 || !initial.sourceHasSample || !initial.frameReady) {
    throw new Error("초기 샘플 로드 검증 실패: " + JSON.stringify(initial));
  }

  const previewRatio = await evaluate(client, `(() => {
    const rect = document.querySelector(".preview-stage").getBoundingClientRect();
    return {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      ratio: rect.width / rect.height
    };
  })()`);

  if (Math.abs(previewRatio.ratio - (16 / 9)) > 0.01) {
    throw new Error("16:9 미리보기 비율 검증 실패: " + JSON.stringify(previewRatio));
  }

  const typography = await evaluate(client, `(async () => {
    const setInput = (id, value) => {
      const input = document.getElementById(id);
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    };
    setInput("titleFontInput", "Noto Serif KR");
    setInput("titleColorInput", "#123456");
    setInput("bodyFontInput", "Noto Sans KR");
    setInput("bodyColorInput", "#654321");
    setInput("pointFontInput", "Gowun Dodum");
    setInput("pointColorInput", "#0f766e");
    await new Promise((resolve) => setTimeout(resolve, 700));
    const source = document.getElementById("sourceEditor").value;
    const frameDoc = document.getElementById("previewFrame").contentDocument;
    const h1 = frameDoc.querySelector("h1");
    const bodyText = frameDoc.querySelector("p");
    const point = frameDoc.querySelector("a, strong, b, .button");
    return {
      hasFontLink: source.includes("id=\\"html-live-editor-fonts\\""),
      hasTypographyStyle: source.includes("id=\\"html-live-editor-typography\\""),
      hasTitleFont: source.includes("--hle-title-font: \\"Noto Serif KR\\""),
      titleColor: frameDoc.defaultView.getComputedStyle(h1).color,
      bodyColor: frameDoc.defaultView.getComputedStyle(bodyText).color,
      pointColor: point ? frameDoc.defaultView.getComputedStyle(point).color : ""
    };
  })()`);

  if (!typography.hasFontLink || !typography.hasTypographyStyle || !typography.hasTitleFont || typography.titleColor !== "rgb(18, 52, 86)" || typography.bodyColor !== "rgb(101, 67, 33)" || typography.pointColor !== "rgb(15, 118, 110)") {
    throw new Error("웹폰트 설정 검증 실패: " + JSON.stringify(typography));
  }

  const customFontFace = await evaluate(client, `(async () => {
    const setInput = (id, value) => {
      const input = document.getElementById(id);
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    };
    setInput("fontFaceCssInput", "@font-face {\\n  font-family: 'Pretendard';\\n  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-Regular.woff2') format('woff2');\\n  font-weight: 400;\\n  font-display: swap;\\n}");
    setInput("titleFontInput", "Pretendard");
    setInput("bodyFontInput", "Pretendard");
    setInput("pointFontInput", "Pretendard");
    setInput("titleColorInput", "#111111");
    setInput("bodyColorInput", "#222222");
    setInput("pointColorInput", "#333333");
    await new Promise((resolve) => setTimeout(resolve, 800));
    const source = document.getElementById("sourceEditor").value;
    const frameDoc = document.getElementById("previewFrame").contentDocument;
    const h1 = frameDoc.querySelector("h1");
    const point = frameDoc.querySelector("a, strong, b, .button");
    return {
      hasFontFace: source.includes("@font-face") && source.includes("Pretendard-Regular.woff2"),
      hasNoGoogleFontLink: !source.includes("id=\\"html-live-editor-fonts\\""),
      hasFamily: source.includes("--hle-title-font: \\"Pretendard\\""),
      titleFamily: frameDoc.defaultView.getComputedStyle(h1).fontFamily,
      pointColor: point ? frameDoc.defaultView.getComputedStyle(point).color : ""
    };
  })()`);

  if (!customFontFace.hasFontFace || !customFontFace.hasNoGoogleFontLink || !customFontFace.hasFamily || !customFontFace.titleFamily.includes("Pretendard") || customFontFace.pointColor !== "rgb(51, 51, 51)") {
    throw new Error("@font-face 웹폰트 검증 실패: " + JSON.stringify(customFontFace));
  }

  const edited = await evaluate(client, `(() => {
    const frame = document.getElementById("previewFrame");
    const doc = frame.contentDocument;
    const h1 = doc.querySelector("h1");
    h1.textContent = "검증된 직접 편집";
    h1.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: "검증" }));
    return document.getElementById("sourceEditor").value.includes("검증된 직접 편집");
  })()`);

  if (!edited) throw new Error("화면 편집 후 소스 동기화 실패");

  const duplicated = await evaluate(client, `(() => {
    document.getElementById("duplicatePageBtn").click();
    return document.querySelectorAll(".page-item").length;
  })()`);

  if (duplicated !== 4) throw new Error("페이지 복제 검증 실패");

  const revealVisible = await evaluate(client, `(async () => {
    const source = document.getElementById("sourceEditor");
    source.value = ${JSON.stringify(`<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; background: #101514; }
    .slide { width: 100vw; height: 100vh; overflow: hidden; display: flex; align-items: center; justify-content: center; color: #f5efe4; }
    .reveal { opacity: 0; transform: translateY(32px); transition: opacity .6s ease, transform .6s ease; }
    .slide.visible .reveal { opacity: 1; transform: translateY(0); }
  </style>
</head>
<body>
  <section class="slide"><h1 class="reveal">스크립트 없이도 보여야 하는 제목</h1></section>
  <section class="slide"><h2 class="reveal">다음 페이지</h2></section>
</body>
</html>`)};
    document.getElementById("applySourceBtn").click();
    await new Promise((resolve) => setTimeout(resolve, 500));
    const frameDoc = document.getElementById("previewFrame").contentDocument;
    const reveal = frameDoc.querySelector(".reveal");
    const exported = source.value;
    return {
      pages: document.querySelectorAll(".page-item").length,
      opacity: frameDoc.defaultView.getComputedStyle(reveal).opacity,
      transform: frameDoc.defaultView.getComputedStyle(reveal).transform,
      hasEditorAttrInSource: exported.includes("data-html-editor-active") || exported.includes("data-editor-page-id"),
      text: reveal.textContent
    };
  })()`);

  if (revealVisible.pages !== 2 || revealVisible.opacity !== "1" || revealVisible.hasEditorAttrInSource) {
    throw new Error("애니메이션 슬라이드 미리보기 검증 실패: " + JSON.stringify(revealVisible));
  }

  const sanitized = await evaluate(client, `(() => {
    const source = document.getElementById("sourceEditor");
    source.value = '<!doctype html><html><body><section data-page="x" onclick="alert(1)"><h1>안전 테스트</h1><script>window.bad=true</script><a href="javascript:alert(1)">링크</a></section><section data-page="y"><h2>다음</h2></section></body></html>';
    document.getElementById("applySourceBtn").click();
    const next = source.value;
    return {
      pages: document.querySelectorAll(".page-item").length,
      noScript: !next.includes("<script"),
      noOnclick: !next.includes("onclick"),
      noJavascriptUrl: !next.includes("javascript:"),
      report: document.getElementById("sanitizeText").textContent
    };
  })()`);

  if (sanitized.pages !== 2 || !sanitized.noScript || !sanitized.noOnclick || !sanitized.noJavascriptUrl) {
    throw new Error("HTML 정리 검증 실패: " + JSON.stringify(sanitized));
  }

  const layoutPicker = await evaluate(client, `(async () => {
    const category = document.getElementById("layoutCategorySelect");
    const counts = {};
    Array.from(category.options).forEach((option) => {
      category.value = option.value;
      category.dispatchEvent(new Event("change", { bubbles: true }));
      counts[option.value] = document.querySelectorAll(".layout-card").length;
    });
    const preservedImage = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%2210%22%3E%3Crect%20width%3D%2210%22%20height%3D%22110%22%20fill%3D%22red%22%2F%3E%3C%2Fsvg%3E";
    const source = document.getElementById("sourceEditor");
    source.value = '<!doctype html><html><body><section data-page="keep"><h1>보존 제목</h1><p>보존 본문 문장입니다</p><ul><li>보존 항목 A</li><li>보존 항목 B</li></ul><img src="' + preservedImage + '" alt="old"></section></body></html>';
    document.getElementById("applySourceBtn").click();
    await new Promise((resolve) => setTimeout(resolve, 300));
    category.value = "bodyPhoto";
    category.dispatchEvent(new Event("change", { bubbles: true }));
    document.getElementById("layoutSelect").value = "photo-grid";
    document.getElementById("layoutSelect").dispatchEvent(new Event("change", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 500));
    const nextSource = document.getElementById("sourceEditor").value;
    return {
      categoryCount: category.options.length,
      counts,
      hasAiUi: Boolean(document.getElementById("aiApplyBtn") || document.querySelector(".ai-panel")),
      hasLayoutPanelInPreview: Boolean(document.querySelector(".preview-panel .layout-panel")),
      hasLayoutStyle: nextSource.includes("html-live-editor-layouts"),
      hasImageLayout: nextSource.includes("hle-template-photo-grid") && nextSource.includes("<img"),
      preservesTitle: nextSource.includes("보존 제목"),
      preservesBody: nextSource.includes("보존 본문 문장입니다"),
      preservesItem: nextSource.includes("보존 항목 A"),
      preservesImage: nextSource.includes(preservedImage)
    };
  })()`);

  if (layoutPicker.categoryCount !== 9 || layoutPicker.hasAiUi || !layoutPicker.hasLayoutPanelInPreview || !layoutPicker.hasLayoutStyle || !layoutPicker.hasImageLayout || !layoutPicker.preservesTitle || !layoutPicker.preservesBody || !layoutPicker.preservesItem || !layoutPicker.preservesImage) {
    throw new Error("레이아웃 선택기 검증 실패: " + JSON.stringify(layoutPicker));
  }

  const layoutCountsOk = Object.entries(layoutPicker.counts).every(([key, value]) => key === "bodyPhoto" ? value >= 10 : value >= 5);
  if (!layoutCountsOk) {
    throw new Error("레이아웃 카테고리별 개수 검증 실패: " + JSON.stringify(layoutPicker.counts));
  }

  const formatControls = await evaluate(client, `(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const frameDoc = document.getElementById("previewFrame").contentDocument;
    const heading = frameDoc.querySelector("[data-html-editor-active] h2, [data-html-editor-active] h1");
    const range = frameDoc.createRange();
    range.selectNodeContents(heading);
    const selection = frameDoc.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.getElementById("fontSizeSelect").value = "44";
    document.getElementById("fontSizeSelect").dispatchEvent(new Event("change", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 150));
    const sourceAfterSize = document.getElementById("sourceEditor").value;
    const nextHeading = document.getElementById("previewFrame").contentDocument.querySelector("[data-html-editor-active] h2, [data-html-editor-active] h1");
    const lineRange = document.getElementById("previewFrame").contentDocument.createRange();
    lineRange.selectNodeContents(nextHeading);
    const nextSelection = document.getElementById("previewFrame").contentDocument.getSelection();
    nextSelection.removeAllRanges();
    nextSelection.addRange(lineRange);
    document.getElementById("lineHeightSelect").value = "1.8";
    document.getElementById("lineHeightSelect").dispatchEvent(new Event("change", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 150));
    const sourceAfterLineHeight = document.getElementById("sourceEditor").value;
    return {
      hasHeadingButtons: Boolean(document.querySelector("[data-heading='h1']") && document.querySelector("[data-heading='h2']") && document.querySelector("[data-heading='h3']")),
      hasHighlight: Boolean(document.getElementById("highlightBtn")),
      hasLink: Boolean(document.getElementById("linkBtn")),
      hasFontSize: sourceAfterSize.includes("font-size: 44px"),
      hasLineHeight: sourceAfterLineHeight.includes("line-height: 1.8")
    };
  })()`);

  if (!formatControls.hasHeadingButtons || !formatControls.hasHighlight || !formatControls.hasLink || !formatControls.hasFontSize || !formatControls.hasLineHeight) {
    throw new Error("확장 서식 도구 검증 실패: " + JSON.stringify(formatControls));
  }

  const imageControls = await evaluate(client, `(async () => {
    document.getElementById("imageUrlInput").value = "https://example.com/sample-photo.jpg";
    document.getElementById("applyImageUrlBtn").click();
    await new Promise((resolve) => setTimeout(resolve, 300));
    const afterUrl = document.getElementById("sourceEditor").value;
    const fileInput = document.getElementById("imageFileInput");
    const dt = new DataTransfer();
    dt.items.add(new File([new Uint8Array([137, 80, 78, 71])], "local.png", { type: "image/png" }));
    fileInput.files = dt.files;
    fileInput.dispatchEvent(new Event("change", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 500));
    const afterFile = document.getElementById("sourceEditor").value;
    return {
      hasUrlControl: Boolean(document.getElementById("imageUrlInput") && document.getElementById("applyImageUrlBtn")),
      hasFileControl: Boolean(document.getElementById("chooseImageFileBtn") && document.getElementById("imageFileInput")),
      urlApplied: afterUrl.includes("https://example.com/sample-photo.jpg"),
      localApplied: afterFile.includes("data:image/png")
    };
  })()`);

  if (!imageControls.hasUrlControl || !imageControls.hasFileControl || !imageControls.urlApplied || !imageControls.localApplied) {
    throw new Error("이미지 입력 도구 검증 실패: " + JSON.stringify(imageControls));
  }

  await evaluate(client, `(() => {
    document.getElementById("resetFontsBtn").click();
    return true;
  })()`);
  await sleep(300);

  let realReport = null;
  try {
    const reportHtml = await readFile("/Users/maketing/Desktop/보고서/성수_PlayX_입점_검토_보고서.html", "utf8");
    realReport = await evaluate(client, `(async () => {
      const source = document.getElementById("sourceEditor");
      source.value = ${JSON.stringify(reportHtml)};
      document.getElementById("applySourceBtn").click();
      await new Promise((resolve) => setTimeout(resolve, 700));
      const frameDoc = document.getElementById("previewFrame").contentDocument;
      const target = frameDoc.querySelector("[data-html-editor-active]");
      const reveal = frameDoc.querySelector("[data-html-editor-active] .reveal");
      return {
        pages: document.querySelectorAll(".page-item").length,
        hasActive: Boolean(target),
        hasText: Boolean(target && target.textContent.trim().length > 20),
        revealOpacity: reveal ? frameDoc.defaultView.getComputedStyle(reveal).opacity : "none"
      };
    })()`);

    if (realReport.pages !== 10 || !realReport.hasActive || !realReport.hasText || (realReport.revealOpacity !== "none" && realReport.revealOpacity !== "1")) {
      throw new Error("실제 보고서 미리보기 검증 실패: " + JSON.stringify(realReport));
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      realReport = { skipped: "실제 보고서 파일 없음" };
    } else {
      throw error;
    }
  }

  await capture(client, "/Users/maketing/html-live-editor/verify-desktop.png", 1440, 960);
  await capture(client, "/Users/maketing/html-live-editor/verify-mobile.png", 390, 920);

  console.log(JSON.stringify({ ok: true, initial, previewRatio, typography, customFontFace, edited, duplicated, revealVisible, sanitized, layoutPicker, formatControls, imageControls, realReport }, null, 2));
} finally {
  client.close();
}

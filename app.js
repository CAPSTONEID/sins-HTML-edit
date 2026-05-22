(function () {
  "use strict";

  var STORAGE_KEY = "html-live-editor-document";
  var FONT_LINK_ID = "html-live-editor-fonts";
  var TYPOGRAPHY_STYLE_ID = "html-live-editor-typography";
  var LAYOUT_STYLE_ID = "html-live-editor-layouts";
  var DEFAULT_TYPOGRAPHY = {
    titleFont: "Gowun Batang",
    titleColor: "#f5efe4",
    bodyFont: "IBM Plex Sans KR",
    bodyColor: "#f5efe4",
    pointFont: "IBM Plex Sans KR",
    pointColor: "#8ac6a2",
    fontFaceCss: "",
    active: false
  };
  var PAGE_SELECTORS = [
    { selector: "[data-page]", label: "data-page" },
    { selector: "[data-screen]", label: "data-screen" },
    { selector: "[data-slide]", label: "data-slide" },
    { selector: ".page", label: ".page" },
    { selector: ".slide", label: ".slide" }
  ];
  var LAYOUT_CATEGORIES = [
    {
      id: "title",
      name: "제목",
      layouts: [
        { id: "title-center", name: "중앙 타이틀", description: "제목과 부제를 중앙에 크게 배치" },
        { id: "title-split-meta", name: "분할 메타", description: "왼쪽 제목, 오른쪽 정보 요약" },
        { id: "title-photo-band", name: "이미지 밴드", description: "상단 비주얼과 하단 제목" },
        { id: "title-chapter", name: "챕터 넘버", description: "번호와 제목을 강하게 구분" },
        { id: "title-quote", name: "인용 오프너", description: "짧은 문장을 중심으로 시작" }
      ]
    },
    {
      id: "toc",
      name: "목차",
      layouts: [
        { id: "toc-numbered", name: "번호 목차", description: "큰 번호와 섹션명 목록" },
        { id: "toc-two-column", name: "2열 목차", description: "긴 목차를 좌우로 정리" },
        { id: "toc-timeline", name: "진행 타임라인", description: "순서를 시간 축으로 표시" },
        { id: "toc-cards", name: "카드 목차", description: "섹션별 핵심 설명 카드" },
        { id: "toc-agenda", name: "회의식 아젠다", description: "시간과 목적을 함께 표기" }
      ]
    },
    {
      id: "bodyText",
      name: "본문 사진 제외",
      layouts: [
        { id: "text-editorial", name: "에디토리얼", description: "긴 본문과 강조 문장" },
        { id: "text-points", name: "핵심 포인트", description: "본문과 3개 핵심 항목" },
        { id: "text-stats", name: "지표 중심", description: "본문과 숫자 지표 3개" },
        { id: "text-process", name: "프로세스", description: "단계형 설명 구조" },
        { id: "text-memo", name: "메모 보드", description: "판단 근거와 메모 정리" }
      ]
    },
    {
      id: "bodyPhoto",
      name: "본문 사진 포함",
      layouts: [
        { id: "photo-left", name: "사진 왼쪽", description: "좌측 이미지와 우측 본문" },
        { id: "photo-right", name: "사진 오른쪽", description: "좌측 본문과 우측 이미지" },
        { id: "photo-full", name: "풀블리드", description: "전체 이미지 위 텍스트" },
        { id: "photo-grid", name: "이미지 그리드", description: "사진 3장과 설명" },
        { id: "photo-card", name: "카드형 사진", description: "프레임 이미지와 본문 카드" },
        { id: "photo-portrait", name: "인물/장소", description: "세로 이미지와 스토리" },
        { id: "photo-map", name: "지도형 비주얼", description: "위치 이미지와 설명" },
        { id: "photo-overlay", name: "오버레이", description: "이미지 위 반투명 정보" },
        { id: "photo-metric", name: "사진+지표", description: "비주얼과 주요 수치" },
        { id: "photo-compare", name: "사진 비교", description: "두 이미지 비교 구조" }
      ]
    },
    {
      id: "comparison",
      name: "비교",
      layouts: [
        { id: "compare-two", name: "2안 비교", description: "A/B 선택지 비교" },
        { id: "compare-before-after", name: "전후 비교", description: "Before와 After 구분" },
        { id: "compare-matrix", name: "평가 매트릭스", description: "항목별 점수 비교" },
        { id: "compare-pros-cons", name: "장단점", description: "장점과 리스크 분리" },
        { id: "compare-score", name: "스코어 카드", description: "요약 점수 중심 비교" }
      ]
    },
    {
      id: "pricing",
      name: "가격 및 견적",
      layouts: [
        { id: "price-cards", name: "패키지 카드", description: "3개 가격 옵션" },
        { id: "price-quote", name: "견적 요약", description: "총액과 포함 범위" },
        { id: "price-table", name: "항목별 견적", description: "라인 아이템 표" },
        { id: "price-tier", name: "티어 비교", description: "Basic/Pro/Premium" },
        { id: "price-schedule", name: "비용 일정", description: "월별 집행 비용" }
      ]
    },
    {
      id: "summary",
      name: "내용 요약 및 정리",
      layouts: [
        { id: "summary-takeaways", name: "핵심 요약", description: "3개 결론 정리" },
        { id: "summary-checklist", name: "체크리스트", description: "확인 항목 중심" },
        { id: "summary-decision", name: "의사결정", description: "추천안과 근거" },
        { id: "summary-metrics", name: "성과 요약", description: "지표와 해석" },
        { id: "summary-actions", name: "액션 플랜", description: "다음 할 일 정리" }
      ]
    },
    {
      id: "contact",
      name: "연락",
      layouts: [
        { id: "contact-profile", name: "담당자 카드", description: "이름과 직책, 연락처" },
        { id: "contact-qr", name: "QR 안내", description: "QR 영역과 안내 문구" },
        { id: "contact-office", name: "오피스 정보", description: "주소와 운영 시간" },
        { id: "contact-form", name: "문의 폼", description: "입력 항목 스타일" },
        { id: "contact-channels", name: "채널 목록", description: "메일, 전화, SNS" }
      ]
    },
    {
      id: "closing",
      name: "마무리",
      layouts: [
        { id: "closing-thanks", name: "감사 인사", description: "큰 감사 문구" },
        { id: "closing-next", name: "다음 단계", description: "후속 단계 3개" },
        { id: "closing-quote", name: "마지막 문장", description: "강한 한 문장" },
        { id: "closing-commit", name: "약속 정리", description: "커밋먼트와 일정" },
        { id: "closing-dark", name: "다크 엔딩", description: "어두운 배경의 종료 화면" }
      ]
    }
  ];

  var sampleHtml = [
    "<!doctype html>",
    "<html lang=\"ko\">",
    "<head>",
    "  <meta charset=\"utf-8\">",
    "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
    "  <title>샘플 HTML 문서</title>",
    "  <style>",
    "    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f3ea; color: #1f2328; }",
    "    .slide { min-height: 100vh; padding: 72px 8vw; display: grid; align-content: center; border-bottom: 1px solid #e1d7c8; }",
    "    .hero { background: #173f35; color: #fff; }",
    "    .hero p { color: #d7ece4; }",
    "    h1, h2 { max-width: 760px; font-size: clamp(36px, 7vw, 72px); line-height: 1.02; margin: 0 0 22px; }",
    "    p { max-width: 660px; font-size: 20px; line-height: 1.55; margin: 0; color: #4f5a5f; }",
    "    .button { display: inline-block; width: max-content; margin-top: 28px; padding: 13px 18px; border-radius: 8px; background: #f2b84b; color: #151515; font-weight: 800; text-decoration: none; }",
    "  </style>",
    "</head>",
    "<body>",
    "  <section class=\"slide hero\" data-page=\"intro\" data-title=\"인트로\">",
    "    <h1>화면에서 바로 고치는 HTML 문서</h1>",
    "    <p>이 문장은 미리보기 화면에서 클릭하고 바로 수정할 수 있습니다.</p>",
    "    <a class=\"button\" href=\"#\">시작하기</a>",
    "  </section>",
    "  <section class=\"slide\" data-page=\"features\" data-title=\"핵심 기능\">",
    "    <h2>페이지를 나누고, 문구를 고치고, 다시 내보냅니다</h2>",
    "    <p>왼쪽 목록에서 페이지를 선택하고 순서를 바꿀 수 있습니다. 오른쪽 소스도 자동으로 갱신됩니다.</p>",
    "  </section>",
    "  <section class=\"slide\" data-page=\"closing\" data-title=\"마무리\">",
    "    <h2>코드를 몰라도 빠르게 교정합니다</h2>",
    "    <p>카드뉴스, 랜딩페이지, 슬라이드형 HTML 초안을 손쉽게 수정하는 흐름을 목표로 합니다.</p>",
    "  </section>",
    "</body>",
    "</html>"
  ].join("\n");

  var state = {
    workingDoc: null,
    pages: [],
    activePage: 0,
    detectionLabel: "단일 문서",
    sanitizeReport: { removedNodes: 0, removedAttributes: 0, rewrittenUrls: 0 },
    sourceDirty: false,
    typography: copyTypography(DEFAULT_TYPOGRAPHY),
    typographyTimer: null,
    selectedLayoutCategory: "title",
    selectedLayoutId: "title-center",
    pendingImageSrc: ""
  };

  var els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    els.fileInput = document.getElementById("fileInput");
    els.openFileBtn = document.getElementById("openFileBtn");
    els.sampleBtn = document.getElementById("sampleBtn");
    els.copyBtn = document.getElementById("copyBtn");
    els.downloadBtn = document.getElementById("downloadBtn");
    els.pageList = document.getElementById("pageList");
    els.addPageBtn = document.getElementById("addPageBtn");
    els.renamePageBtn = document.getElementById("renamePageBtn");
    els.duplicatePageBtn = document.getElementById("duplicatePageBtn");
    els.moveUpBtn = document.getElementById("moveUpBtn");
    els.moveDownBtn = document.getElementById("moveDownBtn");
    els.deletePageBtn = document.getElementById("deletePageBtn");
    els.previewStage = document.querySelector(".preview-stage");
    els.previewFrame = document.getElementById("previewFrame");
    els.fontSizeSelect = document.getElementById("fontSizeSelect");
    els.lineHeightSelect = document.getElementById("lineHeightSelect");
    els.highlightBtn = document.getElementById("highlightBtn");
    els.linkBtn = document.getElementById("linkBtn");
    els.sourceEditor = document.getElementById("sourceEditor");
    els.applySourceBtn = document.getElementById("applySourceBtn");
    els.statusText = document.getElementById("statusText");
    els.detectionText = document.getElementById("detectionText");
    els.activePageTitle = document.getElementById("activePageTitle");
    els.editStateText = document.getElementById("editStateText");
    els.sourceStateText = document.getElementById("sourceStateText");
    els.selectedElementText = document.getElementById("selectedElementText");
    els.selectedTextText = document.getElementById("selectedTextText");
    els.sanitizeText = document.getElementById("sanitizeText");
    els.fontStateText = document.getElementById("fontStateText");
    els.resetFontsBtn = document.getElementById("resetFontsBtn");
    els.fontFaceCssInput = document.getElementById("fontFaceCssInput");
    els.titleFontInput = document.getElementById("titleFontInput");
    els.titleColorInput = document.getElementById("titleColorInput");
    els.bodyFontInput = document.getElementById("bodyFontInput");
    els.bodyColorInput = document.getElementById("bodyColorInput");
    els.pointFontInput = document.getElementById("pointFontInput");
    els.pointColorInput = document.getElementById("pointColorInput");
    els.layoutCategorySelect = document.getElementById("layoutCategorySelect");
    els.layoutSelect = document.getElementById("layoutSelect");
    els.layoutList = document.getElementById("layoutList");
    els.applyLayoutBtn = document.getElementById("applyLayoutBtn");
    els.layoutStateText = document.getElementById("layoutStateText");
    els.imageUrlInput = document.getElementById("imageUrlInput");
    els.applyImageUrlBtn = document.getElementById("applyImageUrlBtn");
    els.imageFileInput = document.getElementById("imageFileInput");
    els.chooseImageFileBtn = document.getElementById("chooseImageFileBtn");
    els.imageStateText = document.getElementById("imageStateText");

    initLayoutControls();
    bindEvents();
    syncTypographyControls();

    var saved = localStorage.getItem(STORAGE_KEY);
    loadHtml(saved || sampleHtml, saved ? "자동 저장 문서" : "샘플 문서");
  }

  function bindEvents() {
    els.openFileBtn.addEventListener("click", function () {
      els.fileInput.click();
    });

    els.fileInput.addEventListener("change", function (event) {
      var file = event.target.files && event.target.files[0];
      if (!file) return;

      var reader = new FileReader();
      reader.onload = function () {
        loadHtml(String(reader.result || ""), file.name);
      };
      reader.readAsText(file);
      els.fileInput.value = "";
    });

    els.sampleBtn.addEventListener("click", function () {
      loadHtml(sampleHtml, "샘플 문서");
    });

    els.copyBtn.addEventListener("click", copyHtml);
    els.downloadBtn.addEventListener("click", downloadHtml);
    els.addPageBtn.addEventListener("click", addPage);
    els.renamePageBtn.addEventListener("click", renamePage);
    els.duplicatePageBtn.addEventListener("click", duplicatePage);
    els.moveUpBtn.addEventListener("click", function () { movePage(-1); });
    els.moveDownBtn.addEventListener("click", function () { movePage(1); });
    els.deletePageBtn.addEventListener("click", deletePage);

    els.applySourceBtn.addEventListener("click", function () {
      loadHtml(els.sourceEditor.value, "소스 적용");
    });

    els.sourceEditor.addEventListener("input", function () {
      state.sourceDirty = true;
      els.sourceStateText.textContent = "적용 대기";
      setStatus("소스가 수정됨");
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-command]"), function (button) {
      button.addEventListener("click", function () {
        runFormatCommand(button.getAttribute("data-command"));
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-heading]"), function (button) {
      button.addEventListener("click", function () {
        runHeadingCommand(button.getAttribute("data-heading"));
      });
    });

    els.fontSizeSelect.addEventListener("change", function () {
      if (!els.fontSizeSelect.value) return;
      applyFontSize(els.fontSizeSelect.value);
      els.fontSizeSelect.value = "";
    });

    els.lineHeightSelect.addEventListener("change", function () {
      if (!els.lineHeightSelect.value) return;
      applyLineHeight(els.lineHeightSelect.value);
      els.lineHeightSelect.value = "";
    });

    els.highlightBtn.addEventListener("click", applyHighlight);
    els.linkBtn.addEventListener("click", applyLink);

    [els.fontFaceCssInput, els.titleFontInput, els.bodyFontInput, els.pointFontInput].forEach(function (input) {
      input.addEventListener("input", scheduleTypographyApply);
      input.addEventListener("change", applyTypographyFromControls);
    });

    [els.titleColorInput, els.bodyColorInput, els.pointColorInput].forEach(function (input) {
      input.addEventListener("input", applyTypographyFromControls);
    });

    els.resetFontsBtn.addEventListener("click", function () {
      state.typography = copyTypography(DEFAULT_TYPOGRAPHY);
      state.typography.active = true;
      syncTypographyControls();
      applyTypographyChange("기본 웹폰트 적용됨");
    });

    els.layoutCategorySelect.addEventListener("change", function () {
      state.selectedLayoutCategory = els.layoutCategorySelect.value;
      var category = getLayoutCategory(state.selectedLayoutCategory);
      state.selectedLayoutId = category && category.layouts[0] ? category.layouts[0].id : "";
      renderLayoutPicker();
    });

    els.layoutSelect.addEventListener("change", function () {
      state.selectedLayoutId = els.layoutSelect.value;
      renderLayoutCards();
      applySelectedLayout();
    });

    els.applyLayoutBtn.addEventListener("click", applySelectedLayout);
    els.applyImageUrlBtn.addEventListener("click", applyImageFromUrl);
    els.chooseImageFileBtn.addEventListener("click", function () {
      els.imageFileInput.click();
    });
    els.imageFileInput.addEventListener("change", applyImageFromFile);

    window.addEventListener("resize", updatePreviewScale);
  }

  function initLayoutControls() {
    els.layoutCategorySelect.innerHTML = "";
    LAYOUT_CATEGORIES.forEach(function (category) {
      var option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.name;
      els.layoutCategorySelect.appendChild(option);
    });
    renderLayoutPicker();
  }

  function renderLayoutPicker() {
    var category = getLayoutCategory(state.selectedLayoutCategory) || LAYOUT_CATEGORIES[0];
    if (!category) return;

    state.selectedLayoutCategory = category.id;
    if (!getLayoutById(category, state.selectedLayoutId)) {
      state.selectedLayoutId = category.layouts[0] ? category.layouts[0].id : "";
    }

    els.layoutCategorySelect.value = category.id;
    els.layoutSelect.innerHTML = "";
    category.layouts.forEach(function (layout) {
      var option = document.createElement("option");
      option.value = layout.id;
      option.textContent = layout.name;
      els.layoutSelect.appendChild(option);
    });
    els.layoutSelect.value = state.selectedLayoutId;
    els.layoutStateText.textContent = category.name + " " + category.layouts.length + "개";
    renderLayoutCards();
  }

  function renderLayoutCards() {
    var category = getLayoutCategory(state.selectedLayoutCategory);
    if (!category) return;
    els.layoutList.innerHTML = "";

    category.layouts.forEach(function (layout) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "layout-card" + (layout.id === state.selectedLayoutId ? " is-selected" : "");
      card.innerHTML = "<strong></strong><span></span>";
      card.querySelector("strong").textContent = layout.name;
      card.querySelector("span").textContent = layout.description;
      card.addEventListener("click", function () {
        state.selectedLayoutId = layout.id;
        els.layoutSelect.value = layout.id;
        renderLayoutCards();
        applySelectedLayout();
      });
      els.layoutList.appendChild(card);
    });
  }

  function getLayoutCategory(categoryId) {
    return LAYOUT_CATEGORIES.find(function (category) {
      return category.id === categoryId;
    });
  }

  function getLayoutById(category, layoutId) {
    if (!category) return null;
    return category.layouts.find(function (layout) {
      return layout.id === layoutId;
    });
  }

  function getSelectedLayout() {
    var category = getLayoutCategory(state.selectedLayoutCategory);
    var layout = getLayoutById(category, state.selectedLayoutId);
    return category && layout ? { category: category, layout: layout } : null;
  }

  function applySelectedLayout() {
    syncFrameToWorkingDoc();
    var selected = getSelectedLayout();
    var active = state.pages[state.activePage];
    if (!selected || !active || !active.element) return;

    ensureLayoutStyles();
    var content = extractLayoutContent(active.element, active.label);
    active.element.innerHTML = mergeContentIntoLayout(renderLayoutHtml(selected.category, selected.layout), content);
    applyLayoutClasses(active.element, selected.category.id, selected.layout.id);
    active.element.setAttribute("data-layout", selected.layout.id);
    if (active.element !== state.workingDoc.body && !active.element.getAttribute("data-title")) {
      active.element.setAttribute("data-title", selected.layout.name);
    }

    applyTypographyToWorkingDoc();
    refreshPages();
    renderAll();
    persist();
    setStatus("레이아웃 적용됨");
  }

  function applyLayoutClasses(element, categoryId, layoutId) {
    var classes = String(element.getAttribute("class") || "").split(/\s+/).filter(function (name) {
      return name && name.indexOf("hle-layout") !== 0 && name.indexOf("hle-category-") !== 0 && name.indexOf("hle-template-") !== 0;
    });
    classes.push("hle-layout", "hle-category-" + categoryId, "hle-template-" + layoutId);
    element.setAttribute("class", classes.join(" "));
  }

  function ensureLayoutStyles() {
    if (!state.workingDoc) return;
    var head = state.workingDoc.head || state.workingDoc.documentElement.insertBefore(state.workingDoc.createElement("head"), state.workingDoc.body);
    var style = state.workingDoc.getElementById(LAYOUT_STYLE_ID);
    if (!style) {
      style = state.workingDoc.createElement("style");
      style.id = LAYOUT_STYLE_ID;
      head.appendChild(style);
    }
    style.textContent = buildLayoutCss();
  }

  function extractLayoutContent(element, fallbackTitle) {
    var clone = element.cloneNode(true);
    stripEditorArtifacts(clone);

    var titleNode = clone.querySelector("h1, h2, h3");
    var title = cleanContentText(titleNode ? titleNode.textContent : "") || cleanContentText(fallbackTitle) || "제목을 입력하세요";
    var textNodes = Array.prototype.slice.call(clone.querySelectorAll("p, li, td, th, figcaption, blockquote, span"))
      .filter(function (node) {
        return !node.classList || (!node.classList.contains("hle-kicker") && !node.closest(".hle-kicker"));
      })
      .map(function (node) { return cleanContentText(node.textContent); })
      .filter(Boolean)
      .filter(function (text) { return text !== title; });

    var unique = [];
    textNodes.forEach(function (text) {
      if (unique.indexOf(text) === -1) unique.push(text);
    });

    var images = Array.prototype.slice.call(clone.querySelectorAll("img"))
      .map(function (img) { return img.getAttribute("src") || ""; })
      .filter(Boolean);

    if (state.pendingImageSrc) images.unshift(state.pendingImageSrc);

    return {
      title: title,
      lead: unique[0] || "핵심 메시지를 입력하세요.",
      body: unique[1] || unique[0] || "본문 내용을 입력하세요.",
      items: unique.length ? unique : ["핵심 발견", "실행 제안", "다음 단계", "검토 사항", "결정 항목"],
      images: dedupe(images)
    };
  }

  function mergeContentIntoLayout(html, content) {
    var parser = new DOMParser();
    var doc = parser.parseFromString("<!doctype html><html><body>" + html + "</body></html>", "text/html");
    var body = doc.body;
    var heading = body.querySelector("h1, h2");
    var lead = body.querySelector(".hle-lead") || firstNonKickerParagraph(body);
    var images = content.images.length ? content.images : [];

    if (heading) heading.textContent = content.title;
    if (lead) lead.textContent = content.lead;

    var paragraphs = Array.prototype.slice.call(body.querySelectorAll("p"))
      .filter(function (node) { return node !== lead && !node.classList.contains("hle-kicker"); });
    fillTextNodes(paragraphs, content.items, 1);

    fillTextNodes(Array.prototype.slice.call(body.querySelectorAll("li")), content.items, 0);
    fillTextNodes(Array.prototype.slice.call(body.querySelectorAll("figcaption")), content.items, 0);
    fillTextNodes(Array.prototype.slice.call(body.querySelectorAll(".hle-cards article span, .hle-note-grid span, .hle-steps span, .hle-timeline span")), content.items, 0);
    appendRemainingItems(doc, body, content.items.slice(1));

    if (images.length) {
      Array.prototype.forEach.call(body.querySelectorAll("img"), function (img, index) {
        img.setAttribute("src", images[index % images.length]);
        img.setAttribute("alt", content.title);
      });
    }

    return body.innerHTML;
  }

  function appendRemainingItems(doc, body, items) {
    if (!items.length || body.querySelector("li")) return;
    var list = doc.createElement("ul");
    list.className = "hle-clean-list hle-imported-list";
    items.slice(0, 4).forEach(function (item) {
      var li = doc.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    });
    body.appendChild(list);
  }

  function firstNonKickerParagraph(root) {
    return Array.prototype.slice.call(root.querySelectorAll("p")).find(function (node) {
      return !node.classList.contains("hle-kicker");
    });
  }

  function fillTextNodes(nodes, values, offset) {
    if (!nodes.length || !values.length) return;
    nodes.forEach(function (node, index) {
      node.textContent = values[(index + offset) % values.length];
    });
  }

  function applyImageFromUrl() {
    var url = normalizeImageUrl(els.imageUrlInput.value);
    if (!url) {
      setImageState("이미지 URL 확인 필요");
      return;
    }
    setCurrentPageImage(url, "웹 이미지 적용됨");
  }

  function applyImageFromFile(event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      setImageState("이미지 파일만 가능");
      return;
    }

    var reader = new FileReader();
    reader.onload = function () {
      setCurrentPageImage(String(reader.result || ""), "로컬 이미지 적용됨");
      els.imageFileInput.value = "";
    };
    reader.readAsDataURL(file);
  }

  function setCurrentPageImage(src, message) {
    syncFrameToWorkingDoc();
    state.pendingImageSrc = src;

    var active = state.pages[state.activePage];
    if (!active || !active.element) return;

    var images = Array.prototype.slice.call(active.element.querySelectorAll("img"));
    if (images.length) {
      images.forEach(function (img) {
        img.setAttribute("src", src);
        img.setAttribute("alt", active.label || "선택 이미지");
      });
      refreshPages();
      renderAll();
      persist();
      setStatus(message);
      setImageState(message);
    } else {
      setStatus("이미지가 저장됨");
      setImageState("이미지 레이아웃 적용 시 사용");
    }
  }

  function normalizeImageUrl(value) {
    var url = String(value || "").trim();
    if (!url || /^\s*javascript:/i.test(url)) return "";
    if (/^(https?:|data:image\/|blob:)/i.test(url)) return url;
    return "https://" + url;
  }

  function setImageState(message) {
    els.imageStateText.textContent = message;
  }

  function cleanContentText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function dedupe(values) {
    var seen = {};
    return values.filter(function (value) {
      if (!value || seen[value]) return false;
      seen[value] = true;
      return true;
    });
  }

  function loadHtml(html, label) {
    var parsed = parseAndSanitize(html);
    state.workingDoc = parsed.doc;
    state.sanitizeReport = parsed.report;
    state.activePage = 0;
    state.sourceDirty = false;

    var embeddedTypography = readEmbeddedTypography(state.workingDoc);
    if (embeddedTypography) {
      state.typography = embeddedTypography;
    }
    syncTypographyControls();
    applyTypographyToWorkingDoc();
    refreshPages();
    renderAll();
    persist();
    setStatus(label + " 로드됨");
  }

  function parseAndSanitize(html) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(html || "<!doctype html><html><body></body></html>", "text/html");
    var report = { removedNodes: 0, removedAttributes: 0, rewrittenUrls: 0 };

    Array.prototype.forEach.call(doc.querySelectorAll("script, object, embed, iframe, meta[http-equiv='refresh']"), function (node) {
      report.removedNodes += 1;
      node.remove();
    });

    Array.prototype.forEach.call(doc.querySelectorAll("*"), function (node) {
      Array.prototype.slice.call(node.attributes).forEach(function (attr) {
        var name = attr.name.toLowerCase();
        var value = attr.value || "";

        if (name.indexOf("on") === 0) {
          node.removeAttribute(attr.name);
          report.removedAttributes += 1;
          return;
        }

        if ((name === "href" || name === "src" || name === "xlink:href" || name === "formaction") && /^\s*javascript:/i.test(value)) {
          node.removeAttribute(attr.name);
          report.rewrittenUrls += 1;
        }
      });
    });

    return { doc: doc, report: report };
  }

  function refreshPages() {
    var detected = detectPages(state.workingDoc);
    state.pages = detected.pages;
    state.detectionLabel = detected.label;

    state.pages.forEach(function (page) {
      if (!page.element.getAttribute("data-editor-page-id")) {
        page.element.setAttribute("data-editor-page-id", makeId());
      }
      page.id = page.element.getAttribute("data-editor-page-id");
    });

    if (state.activePage >= state.pages.length) {
      state.activePage = Math.max(0, state.pages.length - 1);
    }
  }

  function detectPages(doc) {
    var body = doc.body;
    var found = [];
    var label = "단일 문서";

    PAGE_SELECTORS.some(function (entry) {
      var candidates = removeNested(Array.prototype.slice.call(body.querySelectorAll(entry.selector)));
      if (candidates.length > 0) {
        found = candidates;
        label = entry.label + " " + candidates.length + "개";
        return true;
      }
      return false;
    });

    if (found.length === 0) {
      var sections = removeNested(Array.prototype.slice.call(body.querySelectorAll("section")));
      if (sections.length > 1) {
        found = sections;
        label = "section " + sections.length + "개";
      }
    }

    if (found.length === 0) {
      found = [body];
      label = "단일 문서";
    }

    return {
      label: label,
      pages: found.map(function (element, index) {
        return {
          element: element,
          id: element.getAttribute("data-editor-page-id"),
          label: getPageLabel(element, index),
          preview: getPreviewText(element)
        };
      })
    };
  }

  function removeNested(elements) {
    return elements.filter(function (element) {
      return !elements.some(function (candidate) {
        return candidate !== element && candidate.contains(element);
      });
    });
  }

  function getPageLabel(element, index) {
    var explicit = element.getAttribute("data-title") || element.getAttribute("aria-label") || element.getAttribute("title");
    if (explicit && explicit.trim()) return explicit.trim();

    var heading = element.querySelector("h1, h2, h3");
    if (heading && heading.textContent.trim()) return trimText(heading.textContent, 42);

    if (element === state.workingDoc.body) return "전체 문서";
    return "Page " + (index + 1);
  }

  function getPreviewText(element) {
    return trimText((element.textContent || "").replace(/\s+/g, " ").trim(), 92) || "빈 페이지";
  }

  function renderAll() {
    renderPageList();
    renderSource();
    renderPreview();
    renderMeta();
  }

  function renderPageList() {
    els.pageList.innerHTML = "";

    state.pages.forEach(function (page, index) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "page-item" + (index === state.activePage ? " is-active" : "");
      button.addEventListener("click", function () {
        syncFrameToWorkingDoc();
        state.activePage = index;
        renderAll();
      });

      var number = document.createElement("span");
      number.className = "page-index";
      number.textContent = String(index + 1);

      var textWrap = document.createElement("span");
      var title = document.createElement("span");
      title.className = "page-title";
      title.textContent = page.label;
      var preview = document.createElement("span");
      preview.className = "page-preview";
      preview.textContent = page.preview;

      textWrap.appendChild(title);
      textWrap.appendChild(preview);
      button.appendChild(number);
      button.appendChild(textWrap);
      els.pageList.appendChild(button);
    });
  }

  function renderSource() {
    els.sourceEditor.value = serializeWorkingDoc();
    state.sourceDirty = false;
    els.sourceStateText.textContent = "동기화됨";
  }

  function renderPreview() {
    var html = buildPreviewHtml();
    els.previewFrame.addEventListener("load", setupFrameEditing, { once: true });
    els.previewFrame.srcdoc = html;
    updatePreviewScale();
    window.requestAnimationFrame(updatePreviewScale);
  }

  function renderMeta() {
    var active = state.pages[state.activePage];
    els.detectionText.textContent = state.detectionLabel;
    els.activePageTitle.textContent = active ? active.label : "미리보기";
    els.editStateText.textContent = active && active.element === state.workingDoc.body ? "전체 문서 편집" : "현재 페이지 편집";
    els.sanitizeText.textContent = "노드 " + state.sanitizeReport.removedNodes + "개, 속성 " + state.sanitizeReport.removedAttributes + "개, URL " + state.sanitizeReport.rewrittenUrls + "개";
    updatePageButtons();
  }

  function updatePageButtons() {
    var isSingle = state.pages.length <= 1;
    els.deletePageBtn.disabled = isSingle;
    els.moveUpBtn.disabled = state.activePage <= 0;
    els.moveDownBtn.disabled = state.activePage >= state.pages.length - 1;
  }

  function buildPreviewHtml() {
    var clone = state.workingDoc.cloneNode(true);
    var active = state.pages[state.activePage];
    var activeId = active && active.id;

    if (activeId) {
      Array.prototype.forEach.call(clone.querySelectorAll("[data-editor-page-id]"), function (node) {
        if (node.getAttribute("data-editor-page-id") === activeId) {
          node.setAttribute("data-html-editor-active", "true");
        } else if (node !== clone.body) {
          node.setAttribute("data-html-editor-hidden", "true");
        }
      });
    }

    injectPreviewStyles(clone);
    return "<!doctype html>\n" + clone.documentElement.outerHTML;
  }

  function injectPreviewStyles(doc) {
    var style = doc.createElement("style");
    style.setAttribute("data-html-editor-style", "true");
    style.textContent = [
      "[data-html-editor-hidden] { display: none !important; }",
      "html, body { overflow: auto !important; scroll-snap-type: none !important; }",
      "[data-html-editor-active] { opacity: 1 !important; visibility: visible !important; transform: none !important; overflow: auto !important; }",
      "[data-html-editor-active], [data-html-editor-active] * { animation: none !important; transition-duration: 0s !important; }",
      "[data-html-editor-active] .reveal, [data-html-editor-active] [class*='reveal'], [data-html-editor-active] [data-reveal] { opacity: 1 !important; visibility: visible !important; transform: none !important; }",
      "[data-html-editor-active] .visible, [data-html-editor-active] .active { opacity: 1 !important; visibility: visible !important; transform: none !important; }",
      ".progress-bar, .nav-dots, .keyboard-hint { display: none !important; }",
      "[contenteditable='true'] { outline: 3px solid rgba(27,115,232,.35); outline-offset: 6px; }",
      "[contenteditable='true'] *:hover { outline: 1px dashed rgba(37,111,91,.45); outline-offset: 2px; }",
      "html { min-height: 100%; }",
      "body { min-height: 100%; }"
    ].join("\n");
    (doc.head || doc.documentElement).appendChild(style);
  }

  function scheduleTypographyApply() {
    window.clearTimeout(state.typographyTimer);
    state.typographyTimer = window.setTimeout(applyTypographyFromControls, 260);
  }

  function applyTypographyFromControls() {
    window.clearTimeout(state.typographyTimer);
    state.typography = {
      titleFont: cleanFontName(els.titleFontInput.value) || DEFAULT_TYPOGRAPHY.titleFont,
      titleColor: normalizeColor(els.titleColorInput.value, DEFAULT_TYPOGRAPHY.titleColor),
      bodyFont: cleanFontName(els.bodyFontInput.value) || DEFAULT_TYPOGRAPHY.bodyFont,
      bodyColor: normalizeColor(els.bodyColorInput.value, DEFAULT_TYPOGRAPHY.bodyColor),
      pointFont: cleanFontName(els.pointFontInput.value) || DEFAULT_TYPOGRAPHY.pointFont,
      pointColor: normalizeColor(els.pointColorInput.value, DEFAULT_TYPOGRAPHY.pointColor),
      fontFaceCss: sanitizeFontCss(els.fontFaceCssInput.value),
      active: true
    };
    syncTypographyControls();
    applyTypographyChange("웹폰트 설정 적용됨");
  }

  function applyTypographyChange(message) {
    syncFrameToWorkingDoc();
    applyTypographyToWorkingDoc();
    refreshPages();
    renderSource();
    renderPreview();
    renderMeta();
    persist();
    setStatus(message);
  }

  function applyTypographyToWorkingDoc() {
    if (!state.workingDoc) return;

    removeTypographyNodes(state.workingDoc);
    if (!state.typography.active) {
      els.fontStateText.textContent = "변경 전";
      return;
    }

    var head = state.workingDoc.head || state.workingDoc.documentElement.insertBefore(state.workingDoc.createElement("head"), state.workingDoc.body);
    var customFonts = extractFontFaceFamilies(state.typography.fontFaceCss);
    var fontNames = uniqueFonts([state.typography.titleFont, state.typography.bodyFont, state.typography.pointFont]).filter(function (font) {
      return !customFonts[font.toLowerCase()];
    });
    if (fontNames.length > 0) {
      var link = state.workingDoc.createElement("link");
      link.id = FONT_LINK_ID;
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?" + fontNames.map(function (font) {
        return "family=" + encodeURIComponent(font).replace(/%20/g, "+");
      }).join("&") + "&display=swap";
      head.appendChild(link);
    }

    var style = state.workingDoc.createElement("style");
    style.id = TYPOGRAPHY_STYLE_ID;
    style.textContent = buildTypographyCss(state.typography);
    head.appendChild(style);
    els.fontStateText.textContent = "문서에 적용됨";
  }

  function removeTypographyNodes(doc) {
    Array.prototype.forEach.call(doc.querySelectorAll("#" + FONT_LINK_ID + ", #" + TYPOGRAPHY_STYLE_ID), function (node) {
      node.remove();
    });
  }

  function buildTypographyCss(config) {
    var titleFont = quoteCssFont(config.titleFont);
    var bodyFont = quoteCssFont(config.bodyFont);
    var pointFont = quoteCssFont(config.pointFont);
    var customCss = sanitizeFontCss(config.fontFaceCss);
    var lines = [
      "/* HTML Live Editor typography settings */",
      "/* hle-custom-font-css:start */",
      customCss,
      "/* hle-custom-font-css:end */",
      ":root {",
      "  --hle-title-font: " + titleFont + ";",
      "  --hle-title-color: " + config.titleColor + ";",
      "  --hle-body-font: " + bodyFont + ";",
      "  --hle-body-color: " + config.bodyColor + ";",
      "  --hle-point-font: " + pointFont + ";",
      "  --hle-point-color: " + config.pointColor + ";",
      "}",
      "body, p, li, td, th, blockquote, figcaption, .body, .content, .description, .muted {",
      "  font-family: var(--hle-body-font) !important;",
      "  color: var(--hle-body-color) !important;",
      "}",
      "h1, h2, h3, h4, h5, h6, .title, .headline, .heading, .slide-title {",
      "  font-family: var(--hle-title-font) !important;",
      "  color: var(--hle-title-color) !important;",
      "}",
      ".eyebrow, .kicker, .stamp, .metric, .metric-label, .point, .accent, .highlight, mark, strong, b, a, .button, .cta {",
      "  font-family: var(--hle-point-font) !important;",
      "  color: var(--hle-point-color) !important;",
      "}"
    ];
    return lines.filter(function (line) { return line !== ""; }).join("\n");
  }

  function readEmbeddedTypography(doc) {
    var style = doc.getElementById(TYPOGRAPHY_STYLE_ID);
    if (!style) return null;

    var css = style.textContent || "";
    return {
      titleFont: readCssStringVar(css, "hle-title-font", DEFAULT_TYPOGRAPHY.titleFont),
      titleColor: readCssColorVar(css, "hle-title-color", DEFAULT_TYPOGRAPHY.titleColor),
      bodyFont: readCssStringVar(css, "hle-body-font", DEFAULT_TYPOGRAPHY.bodyFont),
      bodyColor: readCssColorVar(css, "hle-body-color", DEFAULT_TYPOGRAPHY.bodyColor),
      pointFont: readCssStringVar(css, "hle-point-font", DEFAULT_TYPOGRAPHY.pointFont),
      pointColor: readCssColorVar(css, "hle-point-color", DEFAULT_TYPOGRAPHY.pointColor),
      fontFaceCss: readCustomFontCss(css),
      active: true
    };
  }

  function syncTypographyControls() {
    els.fontFaceCssInput.value = state.typography.fontFaceCss || "";
    els.titleFontInput.value = state.typography.titleFont;
    els.titleColorInput.value = state.typography.titleColor;
    els.bodyFontInput.value = state.typography.bodyFont;
    els.bodyColorInput.value = state.typography.bodyColor;
    els.pointFontInput.value = state.typography.pointFont;
    els.pointColorInput.value = state.typography.pointColor;
    els.fontStateText.textContent = state.typography.active ? "문서에 적용됨" : "변경 전";
  }

  function setupFrameEditing() {
    var frameDoc = els.previewFrame.contentDocument;
    if (!frameDoc) return;

    var active = state.pages[state.activePage];
    var target = active && active.id
      ? frameDoc.querySelector("[data-editor-page-id='" + active.id + "']")
      : frameDoc.body;

    if (!target) target = frameDoc.body;

    target.setAttribute("contenteditable", "true");
    target.setAttribute("spellcheck", "false");

    target.addEventListener("input", function () {
      syncFrameToWorkingDoc();
      renderSource();
      persist();
      setStatus("화면에서 수정됨");
    });

    frameDoc.addEventListener("selectionchange", function () {
      updateInspector(frameDoc);
    });

    frameDoc.addEventListener("click", function () {
      updateInspector(frameDoc);
    });

    updateInspector(frameDoc);
  }

  function syncFrameToWorkingDoc() {
    var frameDoc = els.previewFrame.contentDocument;
    var active = state.pages[state.activePage];
    if (!frameDoc || !active) return;

    var frameTarget = active.id
      ? frameDoc.querySelector("[data-editor-page-id='" + active.id + "']")
      : frameDoc.body;

    if (!frameTarget) return;

    var clean = frameTarget.cloneNode(true);
    stripEditorArtifacts(clean);

    if (active.element === state.workingDoc.body) {
      state.workingDoc.body.innerHTML = clean.innerHTML;
    } else {
      active.element.innerHTML = clean.innerHTML;
      copyPageAttributes(clean, active.element);
    }

    refreshPages();
  }

  function copyPageAttributes(source, target) {
    var keepId = target.getAttribute("data-editor-page-id");
    Array.prototype.slice.call(target.attributes).forEach(function (attr) {
      if (attr.name !== "data-editor-page-id") {
        target.removeAttribute(attr.name);
      }
    });

    Array.prototype.slice.call(source.attributes).forEach(function (attr) {
      if (attr.name !== "contenteditable" && attr.name !== "spellcheck" && attr.name !== "data-html-editor-hidden") {
        if (attr.name === "data-html-editor-active") return;
        target.setAttribute(attr.name, attr.value);
      }
    });

    if (keepId) target.setAttribute("data-editor-page-id", keepId);
  }

  function updateInspector(frameDoc) {
    var selection = frameDoc.getSelection ? frameDoc.getSelection() : null;
    var selectedText = selection ? selection.toString() : "";
    var node = selection && selection.anchorNode ? selection.anchorNode : frameDoc.body;
    var element = node.nodeType === 1 ? node : node.parentElement;

    els.selectedTextText.textContent = selectedText.length + "자";
    els.selectedElementText.textContent = element ? getElementPath(element) : "없음";
  }

  function updatePreviewScale() {
    if (!els.previewStage) return;
    var width = els.previewStage.clientWidth;
    var scale = Math.max(0.1, width / 1280);
    els.previewStage.style.setProperty("--preview-scale", String(scale));
  }

  function getElementPath(element) {
    var parts = [];
    var current = element;
    while (current && current.nodeType === 1 && current.tagName.toLowerCase() !== "html") {
      var tag = current.tagName.toLowerCase();
      if (current.id) tag += "#" + current.id;
      if (current.className && typeof current.className === "string") {
        tag += "." + current.className.trim().split(/\s+/).slice(0, 2).join(".");
      }
      parts.unshift(tag);
      current = current.parentElement;
      if (parts.length >= 4) break;
    }
    return parts.join(" > ");
  }

  function runFormatCommand(rawCommand) {
    var frameDoc = els.previewFrame.contentDocument;
    if (!frameDoc) return;

    var parts = rawCommand.split(":");
    var command = parts[0];
    var value = parts[1] || null;
    frameDoc.execCommand(command, false, value);
    syncFrameToWorkingDoc();
    renderSource();
    persist();
    setStatus("서식 적용됨");
  }

  function runHeadingCommand(tag) {
    var frameDoc = els.previewFrame.contentDocument;
    if (!frameDoc) return;
    frameDoc.execCommand("formatBlock", false, tag);
    syncFrameToWorkingDoc();
    renderSource();
    persist();
    setStatus(tag.toUpperCase() + " 적용됨");
  }

  function applyFontSize(size) {
    var frameDoc = els.previewFrame.contentDocument;
    if (!frameDoc) return;
    frameDoc.execCommand("fontSize", false, "7");
    Array.prototype.forEach.call(frameDoc.querySelectorAll("font[size='7']"), function (font) {
      font.removeAttribute("size");
      font.style.fontSize = size + "px";
    });
    syncFrameToWorkingDoc();
    renderSource();
    persist();
    setStatus("글자 크기 적용됨");
  }

  function applyLineHeight(value) {
    var frameDoc = els.previewFrame.contentDocument;
    var block = getSelectionBlock(frameDoc);
    if (!block) return;
    block.style.lineHeight = value;
    syncFrameToWorkingDoc();
    renderSource();
    persist();
    setStatus("줄간격 적용됨");
  }

  function applyHighlight() {
    var frameDoc = els.previewFrame.contentDocument;
    if (!frameDoc) return;
    frameDoc.execCommand("backColor", false, "#fff2a8");
    syncFrameToWorkingDoc();
    renderSource();
    persist();
    setStatus("하이라이트 적용됨");
  }

  function applyLink() {
    var frameDoc = els.previewFrame.contentDocument;
    if (!frameDoc) return;
    var selection = frameDoc.getSelection ? frameDoc.getSelection() : null;
    if (!selection || selection.rangeCount === 0 || !selection.toString().trim()) {
      window.alert("링크를 적용할 텍스트를 먼저 선택하세요.");
      return;
    }

    var url = window.prompt("링크 URL", "https://");
    if (!url || !url.trim()) return;
    url = normalizeLinkUrl(url);
    if (!url) return;

    frameDoc.execCommand("createLink", false, url);
    syncFrameToWorkingDoc();
    renderSource();
    persist();
    setStatus("링크 적용됨");
  }

  function getSelectionBlock(frameDoc) {
    if (!frameDoc) return null;
    var selection = frameDoc.getSelection ? frameDoc.getSelection() : null;
    if (!selection || selection.rangeCount === 0) return null;
    var node = selection.anchorNode;
    var element = node && node.nodeType === 1 ? node : node && node.parentElement;
    while (element && element !== frameDoc.body) {
      if (/^(P|H1|H2|H3|H4|H5|H6|LI|BLOCKQUOTE|DIV|SECTION|ARTICLE)$/i.test(element.tagName)) {
        return element;
      }
      element = element.parentElement;
    }
    return frameDoc.body;
  }

  function normalizeLinkUrl(value) {
    var url = String(value || "").trim();
    if (!url || /^\s*javascript:/i.test(url)) return "";
    if (/^(https?:|mailto:|tel:|#)/i.test(url)) return url;
    return "https://" + url;
  }

  function renderLayoutHtml(category, layout) {
    var index = category.layouts.indexOf(layout);
    var photoA = placeholderImage(layout.name, "#173f35", "#f5efe4");
    var photoB = placeholderImage(category.name, "#9d5b17", "#fff7ed");
    var photoC = placeholderImage("Visual", "#2f4858", "#f8fafc");

    if (category.id === "title") return renderTitleLayout(index, layout, photoA);
    if (category.id === "toc") return renderTocLayout(index);
    if (category.id === "bodyText") return renderBodyTextLayout(index);
    if (category.id === "bodyPhoto") return renderBodyPhotoLayout(index, photoA, photoB, photoC);
    if (category.id === "comparison") return renderComparisonLayout(index);
    if (category.id === "pricing") return renderPricingLayout(index);
    if (category.id === "summary") return renderSummaryLayout(index);
    if (category.id === "contact") return renderContactLayout(index, photoA);
    return renderClosingLayout(index);
  }

  function renderTitleLayout(index, layout, image) {
    var blocks = [
      "<div class=\"hle-stack hle-center\"><p class=\"hle-kicker\">FIELD REPORT</p><h1>프로젝트 핵심 제목을 입력하세요</h1><p class=\"hle-lead\">한 줄로 메시지를 정리하고, 바로 아래에서 핵심 맥락을 보강합니다.</p></div>",
      "<div class=\"hle-grid hle-grid-2\"><div><p class=\"hle-kicker\">2026 STRATEGY</p><h1>제목과 실행 정보를 분리한 표지</h1></div><div class=\"hle-meta\"><p><strong>작성자</strong><span>담당자 이름</span></p><p><strong>일정</strong><span>2026.05.22</span></p><p><strong>목적</strong><span>검토 및 의사결정</span></p></div></div>",
      "<div class=\"hle-photo-band\"><img src=\"" + image + "\" alt=\"표지 이미지\"><div><p class=\"hle-kicker\">VISUAL COVER</p><h1>" + escapeHtml(layout.name) + "</h1><p>이미지를 먼저 보여주고 제목으로 맥락을 고정합니다.</p></div></div>",
      "<div class=\"hle-chapter\"><strong>01</strong><div><p class=\"hle-kicker\">CHAPTER</p><h1>장표의 시작을 명확하게 구분합니다</h1><p>파트 전환, 섹션 시작, 보고서 구분 페이지에 적합합니다.</p></div></div>",
      "<blockquote class=\"hle-quote\"><p>\"가장 중요한 판단은 한 문장으로 기억되어야 합니다.\"</p><cite>핵심 메시지 또는 발화자</cite></blockquote>"
    ];
    return blocks[index] || blocks[0];
  }

  function renderTocLayout(index) {
    var blocks = [
      "<div><p class=\"hle-kicker\">CONTENTS</p><h2>목차</h2></div><ol class=\"hle-number-list\"><li><strong>시장 상황</strong><span>핵심 배경과 문제 정의</span></li><li><strong>주요 발견</strong><span>데이터로 확인한 시사점</span></li><li><strong>실행 제안</strong><span>우선순위와 다음 단계</span></li></ol>",
      "<div><p class=\"hle-kicker\">CONTENTS</p><h2>2열 목차</h2></div><div class=\"hle-grid hle-grid-2\"><ul class=\"hle-clean-list\"><li>01 문제 정의</li><li>02 고객 신호</li><li>03 운영 이슈</li></ul><ul class=\"hle-clean-list\"><li>04 비교 검토</li><li>05 실행 계획</li><li>06 결론</li></ul></div>",
      "<div><p class=\"hle-kicker\">AGENDA</p><h2>진행 순서</h2></div><div class=\"hle-timeline\"><p><strong>1</strong><span>현황 진단</span></p><p><strong>2</strong><span>대안 비교</span></p><p><strong>3</strong><span>결정 사항</span></p><p><strong>4</strong><span>후속 실행</span></p></div>",
      "<div><p class=\"hle-kicker\">SECTIONS</p><h2>카드형 목차</h2></div><div class=\"hle-cards\"><article><strong>Insight</strong><span>핵심 발견</span></article><article><strong>Action</strong><span>실행 제안</span></article><article><strong>Result</strong><span>기대 효과</span></article></div>",
      "<div><p class=\"hle-kicker\">MEETING</p><h2>회의 아젠다</h2></div><table class=\"hle-table\"><tr><th>시간</th><th>주제</th><th>목적</th></tr><tr><td>10분</td><td>배경 공유</td><td>맥락 정렬</td></tr><tr><td>20분</td><td>안건 검토</td><td>의사결정</td></tr><tr><td>10분</td><td>다음 단계</td><td>담당 확정</td></tr></table>"
    ];
    return blocks[index] || blocks[0];
  }

  function renderBodyTextLayout(index) {
    var blocks = [
      "<article class=\"hle-editorial\"><p class=\"hle-kicker\">CONTEXT</p><h2>본문 중심 레이아웃</h2><p>핵심 내용을 긴 문장으로 설명할 때 사용합니다. 첫 문단에는 배경을, 두 번째 문단에는 판단과 근거를 넣으면 읽는 흐름이 안정적입니다.</p><p class=\"hle-callout\">강조해야 할 문장은 별도 영역으로 분리합니다.</p></article>",
      "<div><p class=\"hle-kicker\">KEY POINTS</p><h2>핵심 포인트 3가지</h2></div><div class=\"hle-cards\"><article><strong>문제</strong><span>현재 확인된 이슈</span></article><article><strong>근거</strong><span>판단을 뒷받침하는 데이터</span></article><article><strong>제안</strong><span>바로 실행할 수 있는 방향</span></article></div>",
      "<div><p class=\"hle-kicker\">SIGNAL</p><h2>지표로 보는 본문</h2></div><div class=\"hle-metrics\"><p><strong>72%</strong><span>긍정 반응</span></p><p><strong>3.4x</strong><span>효율 개선</span></p><p><strong>12일</strong><span>실행 기간</span></p></div><p class=\"hle-lead\">숫자를 먼저 보여주고 아래 문장으로 해석을 붙입니다.</p>",
      "<div><p class=\"hle-kicker\">PROCESS</p><h2>단계별 설명</h2></div><div class=\"hle-steps\"><p><strong>01</strong><span>자료를 수집하고 기준을 정합니다.</span></p><p><strong>02</strong><span>핵심 항목을 비교해 우선순위를 잡습니다.</span></p><p><strong>03</strong><span>실행안과 담당자를 확정합니다.</span></p></div>",
      "<div><p class=\"hle-kicker\">MEMO</p><h2>판단 메모</h2></div><div class=\"hle-note-grid\"><p><strong>관찰</strong><span>현장에서 반복적으로 보인 신호</span></p><p><strong>해석</strong><span>비즈니스 관점의 의미</span></p><p><strong>결정</strong><span>다음 회의 전 확정할 항목</span></p><p><strong>리스크</strong><span>추가 확인이 필요한 조건</span></p></div>"
    ];
    return blocks[index] || blocks[0];
  }

  function renderBodyPhotoLayout(index, a, b, c) {
    var blocks = [
      "<div class=\"hle-grid hle-grid-2\"><img class=\"hle-photo\" src=\"" + a + "\" alt=\"본문 이미지\"><div><p class=\"hle-kicker\">PHOTO STORY</p><h2>이미지 왼쪽 본문</h2><p>장소, 제품, 현장 사진을 먼저 보여주고 오른쪽에서 의미를 설명합니다.</p></div></div>",
      "<div class=\"hle-grid hle-grid-2\"><div><p class=\"hle-kicker\">VISUAL NOTE</p><h2>이미지 오른쪽 본문</h2><p>본문 흐름을 먼저 잡고 보조 이미지로 근거를 보강합니다.</p></div><img class=\"hle-photo\" src=\"" + a + "\" alt=\"본문 이미지\"></div>",
      "<div class=\"hle-full-photo\"><img src=\"" + a + "\" alt=\"배경 이미지\"><div><p class=\"hle-kicker\">FULL BLEED</p><h2>사진 위에 핵심 메시지</h2><p>사진이 메시지의 주인공일 때 사용합니다.</p></div></div>",
      "<div><p class=\"hle-kicker\">GALLERY</p><h2>이미지 그리드</h2></div><div class=\"hle-image-grid\"><img src=\"" + a + "\" alt=\"이미지 1\"><img src=\"" + b + "\" alt=\"이미지 2\"><img src=\"" + c + "\" alt=\"이미지 3\"></div><p>여러 장면을 한 페이지에서 비교해 보여줍니다.</p>",
      "<div class=\"hle-photo-card\"><img src=\"" + a + "\" alt=\"카드 이미지\"><article><p class=\"hle-kicker\">CASE</p><h2>카드형 이미지 설명</h2><p>이미지와 설명을 하나의 카드처럼 묶어 보여줍니다.</p></article></div>",
      "<div class=\"hle-grid hle-grid-2 hle-portrait\"><img class=\"hle-photo\" src=\"" + b + "\" alt=\"세로 이미지\"><div><p class=\"hle-kicker\">PROFILE</p><h2>인물 또는 장소 스토리</h2><p>세로형 사진과 서술형 본문이 필요한 페이지에 적합합니다.</p></div></div>",
      "<div class=\"hle-grid hle-grid-2\"><div><p class=\"hle-kicker\">LOCATION</p><h2>위치 기반 설명</h2><p>지도, 상권, 이동 동선처럼 공간 맥락이 중요한 내용을 정리합니다.</p></div><img class=\"hle-photo hle-map\" src=\"" + c + "\" alt=\"지도형 이미지\"></div>",
      "<div class=\"hle-overlay-photo\"><img src=\"" + a + "\" alt=\"오버레이 이미지\"><div><strong>핵심 정보</strong><span>이미지 위에 짧은 설명과 상태값을 얹습니다.</span></div></div>",
      "<div class=\"hle-grid hle-grid-2\"><img class=\"hle-photo\" src=\"" + b + "\" alt=\"지표 이미지\"><div><p class=\"hle-kicker\">PHOTO + METRIC</p><h2>비주얼과 수치</h2><div class=\"hle-metrics compact\"><p><strong>28%</strong><span>증가</span></p><p><strong>4곳</strong><span>후보지</span></p></div></div></div>",
      "<div><p class=\"hle-kicker\">VISUAL COMPARE</p><h2>사진 비교</h2></div><div class=\"hle-grid hle-grid-2\"><figure><img class=\"hle-photo\" src=\"" + a + "\" alt=\"비교 A\"><figcaption>대안 A</figcaption></figure><figure><img class=\"hle-photo\" src=\"" + b + "\" alt=\"비교 B\"><figcaption>대안 B</figcaption></figure></div>"
    ];
    return blocks[index] || blocks[0];
  }

  function renderComparisonLayout(index) {
    var blocks = [
      "<div><p class=\"hle-kicker\">COMPARE</p><h2>2안 비교</h2></div><div class=\"hle-grid hle-grid-2\"><article class=\"hle-compare-card\"><strong>대안 A</strong><p>빠르게 실행할 수 있지만 확장성은 제한적입니다.</p></article><article class=\"hle-compare-card\"><strong>대안 B</strong><p>초기 준비가 필요하지만 장기 운영에 유리합니다.</p></article></div>",
      "<div><p class=\"hle-kicker\">BEFORE / AFTER</p><h2>전후 비교</h2></div><div class=\"hle-grid hle-grid-2\"><article><strong>Before</strong><p>수작업 중심, 기준 불명확, 반복 확인 필요</p></article><article><strong>After</strong><p>템플릿 기반, 기준 명확, 빠른 수정 가능</p></article></div>",
      "<div><p class=\"hle-kicker\">MATRIX</p><h2>평가 매트릭스</h2></div><table class=\"hle-table\"><tr><th>항목</th><th>A안</th><th>B안</th></tr><tr><td>비용</td><td>낮음</td><td>중간</td></tr><tr><td>속도</td><td>빠름</td><td>보통</td></tr><tr><td>확장성</td><td>보통</td><td>높음</td></tr></table>",
      "<div><p class=\"hle-kicker\">PROS & CONS</p><h2>장단점 정리</h2></div><div class=\"hle-grid hle-grid-2\"><ul class=\"hle-clean-list\"><li>장점: 빠른 도입</li><li>장점: 낮은 비용</li><li>장점: 단순 운영</li></ul><ul class=\"hle-clean-list muted\"><li>리스크: 수동 관리</li><li>리스크: 확장 한계</li><li>리스크: 품질 편차</li></ul></div>",
      "<div><p class=\"hle-kicker\">SCORE</p><h2>스코어 카드</h2></div><div class=\"hle-score-row\"><p><strong>8.5</strong><span>전략 적합도</span></p><p><strong>7.2</strong><span>실행 난이도</span></p><p><strong>9.1</strong><span>기대 효과</span></p></div>"
    ];
    return blocks[index] || blocks[0];
  }

  function renderPricingLayout(index) {
    var blocks = [
      "<div><p class=\"hle-kicker\">PRICING</p><h2>패키지 옵션</h2></div><div class=\"hle-cards price\"><article><strong>Basic</strong><span>₩900,000</span><p>기본 구성</p></article><article><strong>Pro</strong><span>₩1,800,000</span><p>추천 구성</p></article><article><strong>Premium</strong><span>₩3,200,000</span><p>확장 구성</p></article></div>",
      "<div class=\"hle-quote-summary\"><p class=\"hle-kicker\">QUOTE</p><h2>총 견적 ₩2,400,000</h2><p>기획, 디자인, HTML 편집 템플릿 구성을 포함합니다.</p></div>",
      "<div><p class=\"hle-kicker\">LINE ITEM</p><h2>항목별 견적</h2></div><table class=\"hle-table\"><tr><th>항목</th><th>수량</th><th>금액</th></tr><tr><td>디자인</td><td>10p</td><td>₩1,000,000</td></tr><tr><td>편집</td><td>10p</td><td>₩700,000</td></tr><tr><td>검수</td><td>1식</td><td>₩300,000</td></tr></table>",
      "<div><p class=\"hle-kicker\">TIERS</p><h2>등급별 비교</h2></div><div class=\"hle-cards price\"><article><strong>Start</strong><p>초안 수정</p></article><article><strong>Grow</strong><p>이미지 포함</p></article><article><strong>Scale</strong><p>브랜드 시스템</p></article></div>",
      "<div><p class=\"hle-kicker\">SCHEDULE</p><h2>비용 집행 일정</h2></div><div class=\"hle-timeline\"><p><strong>1주차</strong><span>₩500,000 기획</span></p><p><strong>2주차</strong><span>₩900,000 제작</span></p><p><strong>3주차</strong><span>₩400,000 검수</span></p></div>"
    ];
    return blocks[index] || blocks[0];
  }

  function renderSummaryLayout(index) {
    var blocks = [
      "<div><p class=\"hle-kicker\">SUMMARY</p><h2>핵심 요약</h2></div><div class=\"hle-cards\"><article><strong>1</strong><span>가장 중요한 발견</span></article><article><strong>2</strong><span>실행해야 할 제안</span></article><article><strong>3</strong><span>결정이 필요한 항목</span></article></div>",
      "<div><p class=\"hle-kicker\">CHECKLIST</p><h2>확인 목록</h2></div><ul class=\"hle-checklist\"><li>핵심 메시지가 한 문장으로 정리되었는가</li><li>실행 담당자가 명확한가</li><li>다음 일정이 확정되었는가</li></ul>",
      "<div><p class=\"hle-kicker\">DECISION</p><h2>추천안과 근거</h2></div><div class=\"hle-decision\"><strong>추천: B안 진행</strong><p>비용은 다소 높지만 운영 안정성과 확장성이 가장 높습니다.</p></div>",
      "<div><p class=\"hle-kicker\">RESULT</p><h2>성과 요약</h2></div><div class=\"hle-metrics\"><p><strong>+18%</strong><span>전환</span></p><p><strong>-24%</strong><span>시간</span></p><p><strong>92점</strong><span>만족도</span></p></div>",
      "<div><p class=\"hle-kicker\">ACTION</p><h2>다음 실행</h2></div><div class=\"hle-steps\"><p><strong>오늘</strong><span>검토 의견 수집</span></p><p><strong>이번 주</strong><span>최종안 제작</span></p><p><strong>다음 주</strong><span>배포 및 측정</span></p></div>"
    ];
    return blocks[index] || blocks[0];
  }

  function renderContactLayout(index, image) {
    var blocks = [
      "<div class=\"hle-contact-card\"><img src=\"" + image + "\" alt=\"담당자 이미지\"><div><p class=\"hle-kicker\">CONTACT</p><h2>담당자 이름</h2><p>brand@example.com<br>010-0000-0000</p></div></div>",
      "<div class=\"hle-grid hle-grid-2\"><div><p class=\"hle-kicker\">SCAN</p><h2>QR로 문의하기</h2><p>상담 예약, 자료 요청, 추가 질문을 한 번에 접수합니다.</p></div><div class=\"hle-qr\">QR</div></div>",
      "<div><p class=\"hle-kicker\">OFFICE</p><h2>오피스 정보</h2></div><div class=\"hle-meta wide\"><p><strong>주소</strong><span>서울 성동구 연무장길 73</span></p><p><strong>운영</strong><span>평일 10:00-18:00</span></p><p><strong>메일</strong><span>hello@example.com</span></p></div>",
      "<div><p class=\"hle-kicker\">FORM</p><h2>문의 항목</h2></div><div class=\"hle-form-mock\"><p>이름</p><p>연락처</p><p>문의 내용</p><strong>보내기</strong></div>",
      "<div><p class=\"hle-kicker\">CHANNELS</p><h2>연락 채널</h2></div><div class=\"hle-cards\"><article><strong>Email</strong><span>hello@example.com</span></article><article><strong>Phone</strong><span>010-0000-0000</span></article><article><strong>Social</strong><span>@brand</span></article></div>"
    ];
    return blocks[index] || blocks[0];
  }

  function renderClosingLayout(index) {
    var blocks = [
      "<div class=\"hle-center\"><p class=\"hle-kicker\">THANK YOU</p><h1>감사합니다</h1><p class=\"hle-lead\">검토 의견과 다음 단계를 기다리겠습니다.</p></div>",
      "<div><p class=\"hle-kicker\">NEXT</p><h2>다음 단계</h2></div><div class=\"hle-steps\"><p><strong>01</strong><span>의견 수렴</span></p><p><strong>02</strong><span>최종 수정</span></p><p><strong>03</strong><span>배포 준비</span></p></div>",
      "<blockquote class=\"hle-quote\"><p>\"좋은 문서는 결정의 속도를 높입니다.\"</p><cite>마무리 메시지</cite></blockquote>",
      "<div><p class=\"hle-kicker\">COMMITMENT</p><h2>확정할 약속</h2></div><div class=\"hle-decision\"><strong>2026.05.29까지 최종안 공유</strong><p>수정 범위와 책임자를 오늘 안에 확정합니다.</p></div>",
      "<div class=\"hle-center hle-dark-card\"><p class=\"hle-kicker\">END</p><h1>마무리</h1><p>문의 사항은 언제든 연락 주세요.</p></div>"
    ];
    return blocks[index] || blocks[0];
  }

  function placeholderImage(label, background, color) {
    var svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"960\" height=\"540\" viewBox=\"0 0 960 540\"><rect width=\"960\" height=\"540\" fill=\"" + background + "\"/><circle cx=\"760\" cy=\"110\" r=\"150\" fill=\"rgba(255,255,255,.12)\"/><circle cx=\"170\" cy=\"420\" r=\"190\" fill=\"rgba(255,255,255,.10)\"/><text x=\"70\" y=\"300\" fill=\"" + color + "\" font-size=\"56\" font-family=\"Arial, sans-serif\" font-weight=\"700\">" + escapeHtml(label).slice(0, 22) + "</text></svg>";
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }

  function buildLayoutCss() {
    return [
      ".hle-layout { box-sizing: border-box !important; width: 100% !important; min-height: 100vh !important; height: 100vh !important; padding: 64px 72px !important; display: grid !important; align-content: center !important; gap: 24px !important; overflow: hidden !important; background: #f7f1e7 !important; color: #15231f !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important; }",
      ".hle-layout * { box-sizing: border-box; }",
      ".hle-layout h1, .hle-layout h2 { margin: 0; max-width: 860px; letter-spacing: 0; line-height: 1.04; color: inherit; }",
      ".hle-layout h1 { font-size: clamp(44px, 7vw, 86px); }",
      ".hle-layout h2 { font-size: clamp(34px, 5vw, 58px); }",
      ".hle-layout p { margin: 0; font-size: 20px; line-height: 1.55; color: #51605b; }",
      ".hle-kicker { color: #256f5b !important; font-size: 13px !important; font-weight: 800 !important; letter-spacing: 0 !important; text-transform: uppercase; }",
      ".hle-lead { max-width: 760px; font-size: 24px !important; }",
      ".hle-center { text-align: center; justify-items: center; }",
      ".hle-stack { display: grid; gap: 18px; }",
      ".hle-grid { display: grid; gap: 34px; align-items: center; }",
      ".hle-grid-2 { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }",
      ".hle-cards, .hle-metrics, .hle-score-row, .hle-note-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }",
      ".hle-note-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }",
      ".hle-cards article, .hle-compare-card, .hle-note-grid p, .hle-decision, .hle-contact-card, .hle-form-mock, .hle-meta { padding: 22px; border: 1px solid rgba(21,35,31,.16); border-radius: 8px; background: rgba(255,255,255,.68); }",
      ".hle-cards strong, .hle-metrics strong, .hle-score-row strong { display: block; font-size: 34px; line-height: 1; color: #173f35; }",
      ".hle-cards span, .hle-metrics span, .hle-score-row span { display: block; margin-top: 10px; color: #51605b; font-size: 16px; }",
      ".hle-photo, .hle-full-photo img, .hle-photo-card img, .hle-overlay-photo img, .hle-image-grid img, .hle-contact-card img { width: 100%; height: 100%; min-height: 280px; object-fit: cover; border-radius: 8px; }",
      ".hle-full-photo, .hle-overlay-photo { position: relative; min-height: 520px; border-radius: 8px; overflow: hidden; }",
      ".hle-full-photo > div, .hle-overlay-photo > div { position: absolute; left: 36px; right: 36px; bottom: 36px; padding: 24px; border-radius: 8px; background: rgba(17,24,22,.78); color: #fff; }",
      ".hle-full-photo p, .hle-overlay-photo span { color: #dce8e1 !important; }",
      ".hle-image-grid { display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 12px; }",
      ".hle-photo-card, .hle-contact-card { display: grid; grid-template-columns: 1.1fr .9fr; gap: 22px; align-items: center; }",
      ".hle-photo-band { display: grid; grid-template-rows: 280px auto; gap: 26px; }",
      ".hle-photo-band img { width: 100%; height: 280px; object-fit: cover; border-radius: 8px; }",
      ".hle-chapter { display: grid; grid-template-columns: 210px 1fr; gap: 36px; align-items: center; }",
      ".hle-chapter > strong { font-size: 140px; line-height: .9; color: #256f5b; }",
      ".hle-quote { margin: 0; max-width: 980px; }",
      ".hle-quote p { color: #15231f !important; font-size: clamp(42px, 6vw, 78px) !important; line-height: 1.12; }",
      ".hle-quote cite { display: block; margin-top: 24px; color: #697077; font-size: 18px; font-style: normal; }",
      ".hle-number-list, .hle-clean-list, .hle-checklist { margin: 0; padding: 0; list-style: none; display: grid; gap: 14px; }",
      ".hle-imported-list { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 18px; }",
      ".hle-imported-list li { padding: 10px 0; border-top: 1px solid rgba(21,35,31,.12); color: #51605b; font-size: 17px; }",
      ".hle-number-list li { display: grid; grid-template-columns: 120px 1fr; padding: 16px 0; border-bottom: 1px solid rgba(21,35,31,.14); }",
      ".hle-number-list strong { font-size: 30px; color: #173f35; }",
      ".hle-timeline, .hle-steps { display: grid; gap: 14px; }",
      ".hle-timeline p, .hle-steps p { display: grid; grid-template-columns: 120px 1fr; gap: 18px; align-items: center; padding: 14px 0; border-bottom: 1px solid rgba(21,35,31,.14); }",
      ".hle-table { width: 100%; border-collapse: collapse; overflow: hidden; border-radius: 8px; background: rgba(255,255,255,.72); }",
      ".hle-table th, .hle-table td { padding: 16px; border-bottom: 1px solid rgba(21,35,31,.12); text-align: left; font-size: 17px; }",
      ".price span { color: #9d5b17 !important; font-size: 28px !important; font-weight: 800; }",
      ".hle-qr { display: grid; place-items: center; width: 260px; height: 260px; justify-self: center; border: 16px solid #173f35; border-radius: 8px; font-size: 46px; font-weight: 900; color: #173f35; background: #fff; }",
      ".hle-form-mock { display: grid; gap: 12px; }",
      ".hle-form-mock p { padding: 14px; border-radius: 6px; background: #fff; border: 1px solid rgba(21,35,31,.14); }",
      ".hle-form-mock strong { display: inline-block; width: max-content; padding: 12px 18px; border-radius: 6px; background: #173f35; color: #fff; }",
      ".hle-dark-card { min-height: 100%; padding: 70px; border-radius: 10px; background: #101514; color: #f8f3ea; }",
      ".hle-dark-card p { color: #c7d8cf !important; }"
    ].join("\n");
  }

  function addPage() {
    syncFrameToWorkingDoc();

    var doc = state.workingDoc;
    var section = doc.createElement("section");
    section.setAttribute("data-page", "page-" + (state.pages.length + 1));
    section.setAttribute("data-title", "새 페이지");
    section.innerHTML = "<h2>새 페이지</h2><p>여기에 내용을 입력하세요.</p>";

    var active = state.pages[state.activePage];
    if (active && active.element !== doc.body && active.element.parentNode) {
      active.element.parentNode.insertBefore(section, active.element.nextSibling);
      state.activePage += 1;
    } else {
      doc.body.appendChild(section);
      state.activePage = state.pages.length;
    }

    refreshPages();
    renderAll();
    persist();
    setStatus("페이지 추가됨");
  }

  function renamePage() {
    syncFrameToWorkingDoc();

    var active = state.pages[state.activePage];
    if (!active) return;

    var nextName = window.prompt("페이지 이름", active.label);
    if (!nextName || !nextName.trim()) return;

    active.element.setAttribute("data-title", nextName.trim());
    var heading = active.element.querySelector("h1, h2, h3");
    if (heading) heading.textContent = nextName.trim();

    refreshPages();
    renderAll();
    persist();
    setStatus("페이지 이름 변경됨");
  }

  function duplicatePage() {
    syncFrameToWorkingDoc();

    var active = state.pages[state.activePage];
    if (!active || active.element === state.workingDoc.body) return;

    var clone = active.element.cloneNode(true);
    clone.removeAttribute("data-editor-page-id");
    clone.setAttribute("data-title", active.label + " 복사본");
    active.element.parentNode.insertBefore(clone, active.element.nextSibling);
    state.activePage += 1;

    refreshPages();
    renderAll();
    persist();
    setStatus("페이지 복제됨");
  }

  function deletePage() {
    syncFrameToWorkingDoc();

    if (state.pages.length <= 1) return;

    var active = state.pages[state.activePage];
    if (!active || active.element === state.workingDoc.body) return;

    active.element.remove();
    state.activePage = Math.max(0, state.activePage - 1);

    refreshPages();
    renderAll();
    persist();
    setStatus("페이지 삭제됨");
  }

  function movePage(direction) {
    syncFrameToWorkingDoc();

    var nextIndex = state.activePage + direction;
    if (nextIndex < 0 || nextIndex >= state.pages.length) return;

    var current = state.pages[state.activePage].element;
    var next = state.pages[nextIndex].element;
    var parent = current.parentNode;

    if (!parent || current === state.workingDoc.body || next === state.workingDoc.body) return;

    if (direction < 0) {
      parent.insertBefore(current, next);
    } else {
      parent.insertBefore(next, current);
    }

    state.activePage = nextIndex;
    refreshPages();
    renderAll();
    persist();
    setStatus("페이지 순서 변경됨");
  }

  function copyHtml() {
    syncFrameToWorkingDoc();
    var html = serializeWorkingDoc();

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(html).then(function () {
        setStatus("HTML 복사됨");
      }).catch(copyFallback);
    } else {
      copyFallback();
    }

    function copyFallback() {
      els.sourceEditor.value = html;
      els.sourceEditor.select();
      document.execCommand("copy");
      setStatus("HTML 복사됨");
    }
  }

  function downloadHtml() {
    syncFrameToWorkingDoc();
    var blob = new Blob([serializeWorkingDoc()], { type: "text/html;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "edited-document.html";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus("HTML 다운로드됨");
  }

  function serializeWorkingDoc() {
    if (!state.workingDoc) return "";
    var clone = state.workingDoc.cloneNode(true);
    stripEditorArtifacts(clone.documentElement);
    return "<!doctype html>\n" + clone.documentElement.outerHTML;
  }

  function stripEditorArtifacts(root) {
    var nodes = root.nodeType === 1 ? [root].concat(Array.prototype.slice.call(root.querySelectorAll("*"))) : [];
    nodes.forEach(function (node) {
      node.removeAttribute("data-editor-page-id");
      node.removeAttribute("data-html-editor-hidden");
      node.removeAttribute("data-html-editor-active");
      node.removeAttribute("contenteditable");
      node.removeAttribute("spellcheck");
      if (node.getAttribute("data-html-editor-style") === "true") {
        node.remove();
      }
    });
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, serializeWorkingDoc());
  }

  function setStatus(message) {
    els.statusText.textContent = message;
  }

  function trimText(text, maxLength) {
    var normalized = String(text || "").replace(/\s+/g, " ").trim();
    if (normalized.length <= maxLength) return normalized;
    return normalized.slice(0, maxLength - 1) + "…";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function copyTypography(config) {
    return {
      titleFont: config.titleFont,
      titleColor: config.titleColor,
      bodyFont: config.bodyFont,
      bodyColor: config.bodyColor,
      pointFont: config.pointFont,
      pointColor: config.pointColor,
      fontFaceCss: config.fontFaceCss || "",
      active: Boolean(config.active)
    };
  }

  function cleanFontName(value) {
    return String(value || "")
      .replace(/[{};<>]/g, "")
      .replace(/["']/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);
  }

  function normalizeColor(value, fallback) {
    var color = String(value || "").trim();
    return /^#[0-9a-fA-F]{6}$/.test(color) ? color : fallback;
  }

  function uniqueFonts(fonts) {
    var seen = {};
    return fonts.map(cleanFontName).filter(function (font) {
      if (!font || seen[font.toLowerCase()]) return false;
      seen[font.toLowerCase()] = true;
      return true;
    });
  }

  function quoteCssFont(font) {
    var cleaned = cleanFontName(font);
    return "\"" + cleaned.replace(/\\/g, "\\\\") + "\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif";
  }

  function sanitizeFontCss(value) {
    return String(value || "")
      .replace(/<\/?style[^>]*>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/[<>]/g, "")
      .trim()
      .slice(0, 4000);
  }

  function extractFontFaceFamilies(css) {
    var families = {};
    var blocks = String(css || "").match(/@font-face\s*{[\s\S]*?}/gi) || [];
    blocks.forEach(function (block) {
      var match = block.match(/font-family\s*:\s*['"]?([^;'"}]+)['"]?/i);
      if (match && match[1]) {
        families[cleanFontName(match[1]).toLowerCase()] = true;
      }
    });
    return families;
  }

  function readCustomFontCss(css) {
    var match = String(css || "").match(/\/\*\s*hle-custom-font-css:start\s*\*\/([\s\S]*?)\/\*\s*hle-custom-font-css:end\s*\*\//);
    return match ? sanitizeFontCss(match[1]) : "";
  }

  function readCssStringVar(css, name, fallback) {
    var match = css.match(new RegExp("--" + name + "\\s*:\\s*\"([^\"]+)\""));
    return match ? cleanFontName(match[1]) || fallback : fallback;
  }

  function readCssColorVar(css, name, fallback) {
    var match = css.match(new RegExp("--" + name + "\\s*:\\s*(#[0-9a-fA-F]{6})"));
    return match ? normalizeColor(match[1], fallback) : fallback;
  }

  function makeId() {
    return "page-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }
})();

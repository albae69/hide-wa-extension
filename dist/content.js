// src/content.ts
var STORAGE_KEY = "wa_sidebar_blurred";
var BLUR_AMOUNT = 8;
var STYLE_EL_ID = "wa-blur-sidebar-style";
var HOVERED_ATTR = "data-wa-hovered";
var CHAT_ROW_SELECTORS = [
  '[data-testid="cell-frame-container"]',
  "[data-id]",
  '[tabindex="0"][role]',
  "li"
];
var isBlurred = false;
var paneSide = null;
var currentHovered = null;
var paneObserver = null;
function getOrCreateStyleEl() {
  let el = document.getElementById(STYLE_EL_ID);
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_EL_ID;
    (document.head ?? document.documentElement).appendChild(el);
  }
  return el;
}
function buildBlurCSS() {
  const blurTargets = CHAT_ROW_SELECTORS.map((s) => `#pane-side ${s}`).join(`,
      `);
  return `
    ${blurTargets} {
      filter: blur(${BLUR_AMOUNT}px);
      transition: filter 0.2s ease;
      user-select: none;
    }
    [${HOVERED_ATTR}="true"] {
      filter: blur(0px) !important;
      user-select: auto !important;
    }
  `;
}
function findChatRow(el) {
  for (const selector of CHAT_ROW_SELECTORS) {
    const found = el.closest(selector);
    if (found)
      return found;
  }
  return null;
}
function handleMouseOver(e) {
  const row = findChatRow(e.target);
  if (row === currentHovered)
    return;
  currentHovered?.removeAttribute(HOVERED_ATTR);
  currentHovered = row;
  currentHovered?.setAttribute(HOVERED_ATTR, "true");
}
function handleMouseOut(e) {
  const related = e.relatedTarget;
  if (!paneSide?.contains(related)) {
    currentHovered?.removeAttribute(HOVERED_ATTR);
    currentHovered = null;
  }
}
function attachPaneListeners(pane) {
  paneSide = pane;
  pane.addEventListener("mouseover", handleMouseOver);
  pane.addEventListener("mouseout", handleMouseOut);
}
function detachPaneListeners() {
  paneSide?.removeEventListener("mouseover", handleMouseOver);
  paneSide?.removeEventListener("mouseout", handleMouseOut);
  currentHovered?.removeAttribute(HOVERED_ATTR);
  currentHovered = null;
  paneSide = null;
}
function waitForPane() {
  const existing = document.getElementById("pane-side");
  if (existing) {
    attachPaneListeners(existing);
    return;
  }
  paneObserver = new MutationObserver(() => {
    const pane = document.getElementById("pane-side");
    if (pane) {
      paneObserver?.disconnect();
      paneObserver = null;
      attachPaneListeners(pane);
    }
  });
  paneObserver.observe(document.body, { childList: true, subtree: true });
}
function applyBlur(blur) {
  const styleEl = getOrCreateStyleEl();
  if (blur) {
    styleEl.textContent = buildBlurCSS();
    waitForPane();
  } else {
    styleEl.textContent = "";
    paneObserver?.disconnect();
    paneObserver = null;
    detachPaneListeners();
  }
  isBlurred = blur;
}
chrome.storage.sync.get(STORAGE_KEY, (result) => {
  const saved = result[STORAGE_KEY];
  if (saved === true) {
    applyBlur(true);
  }
});
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SET_BLUR" && message.value !== undefined) {
    applyBlur(message.value);
    chrome.storage.sync.set({ [STORAGE_KEY]: message.value });
    sendResponse({ success: true, isBlurred });
  } else if (message.type === "GET_STATE") {
    sendResponse({ success: true, isBlurred });
  }
  return true;
});

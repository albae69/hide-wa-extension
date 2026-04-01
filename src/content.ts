const STORAGE_KEY = 'wa_sidebar_blurred'
const BLUR_AMOUNT = 8
const STYLE_EL_ID = 'wa-blur-sidebar-style'
const HOVERED_ATTR = 'data-wa-hovered'

// Selectors tried in order — covers different WA Web versions
const CHAT_ROW_SELECTORS = [
  '[data-testid="cell-frame-container"]',
  '[data-id]',
  '[tabindex="0"][role]',
  'li',
]

let isBlurred = false
let paneSide: Element | null = null
let currentHovered: Element | null = null
let paneObserver: MutationObserver | null = null

function getOrCreateStyleEl(): HTMLStyleElement {
  let el = document.getElementById(STYLE_EL_ID) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = STYLE_EL_ID
    ;(document.head ?? document.documentElement).appendChild(el)
  }
  return el
}

function buildBlurCSS(): string {
  // Apply blur to every candidate selector inside pane-side
  const blurTargets = CHAT_ROW_SELECTORS.map((s) => `#pane-side ${s}`).join(
    ',\n      ',
  )
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
  `
}

function findChatRow(el: Element): Element | null {
  for (const selector of CHAT_ROW_SELECTORS) {
    const found = el.closest(selector)
    if (found) return found
  }
  return null
}

function handleMouseOver(e: MouseEvent): void {
  const row = findChatRow(e.target as Element)
  if (row === currentHovered) return
  currentHovered?.removeAttribute(HOVERED_ATTR)
  currentHovered = row
  currentHovered?.setAttribute(HOVERED_ATTR, 'true')
}

function handleMouseOut(e: MouseEvent): void {
  const related = e.relatedTarget as Element | null
  if (!paneSide?.contains(related)) {
    currentHovered?.removeAttribute(HOVERED_ATTR)
    currentHovered = null
  }
}

function attachPaneListeners(pane: Element): void {
  paneSide = pane
  pane.addEventListener('mouseover', handleMouseOver)
  pane.addEventListener('mouseout', handleMouseOut)
}

function detachPaneListeners(): void {
  paneSide?.removeEventListener('mouseover', handleMouseOver)
  paneSide?.removeEventListener('mouseout', handleMouseOut)
  currentHovered?.removeAttribute(HOVERED_ATTR)
  currentHovered = null
  paneSide = null
}

function waitForPane(): void {
  const existing = document.getElementById('pane-side')
  if (existing) {
    attachPaneListeners(existing)
    return
  }

  paneObserver = new MutationObserver(() => {
    const pane = document.getElementById('pane-side')
    if (pane) {
      paneObserver?.disconnect()
      paneObserver = null
      attachPaneListeners(pane)
    }
  })
  paneObserver.observe(document.body, { childList: true, subtree: true })
}

function applyBlur(blur: boolean): void {
  const styleEl = getOrCreateStyleEl()

  if (blur) {
    styleEl.textContent = buildBlurCSS()
    waitForPane()
  } else {
    styleEl.textContent = ''
    paneObserver?.disconnect()
    paneObserver = null
    detachPaneListeners()
  }

  isBlurred = blur
}

// Load persisted state on page load
chrome.storage.sync.get(STORAGE_KEY, (result) => {
  const saved = result[STORAGE_KEY] as boolean | undefined
  if (saved === true) {
    applyBlur(true)
  }
})

// Listen for messages from popup
chrome.runtime.onMessage.addListener(
  (
    message: { type: string; value?: boolean },
    _sender,
    sendResponse: (response: { success: boolean; isBlurred: boolean }) => void,
  ) => {
    if (message.type === 'SET_BLUR' && message.value !== undefined) {
      applyBlur(message.value)
      chrome.storage.sync.set({ [STORAGE_KEY]: message.value })
      sendResponse({ success: true, isBlurred })
    } else if (message.type === 'GET_STATE') {
      sendResponse({ success: true, isBlurred })
    }
    return true
  },
)

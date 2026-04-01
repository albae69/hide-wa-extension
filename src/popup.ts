type ContentResponse = { success: boolean; isBlurred: boolean }

const btn = document.getElementById('toggle-btn') as HTMLButtonElement
const statusEl = document.getElementById('status') as HTMLParagraphElement
const dotEl = document.getElementById('dot') as HTMLDivElement

function updateUI(blurred: boolean): void {
  btn.disabled = false

  if (blurred) {
    btn.textContent = 'Tampilkan Sidebar'
    btn.classList.add('active')
    dotEl.classList.add('blurred')
    statusEl.textContent = 'Sidebar sedang disamarkan'
  } else {
    btn.textContent = 'Sembunyikan Sidebar'
    btn.classList.remove('active')
    dotEl.classList.remove('blurred')
    statusEl.textContent = 'Sidebar terlihat normal'
  }
}

function setError(msg: string): void {
  statusEl.textContent = msg
  btn.disabled = true
  dotEl.classList.remove('blurred')
}

async function queryActiveTab(): Promise<chrome.tabs.Tab> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) throw new Error('No active tab found')
  return tab
}

async function sendMessage(message: object): Promise<ContentResponse> {
  const tab = await queryActiveTab()
  return chrome.tabs.sendMessage(tab.id!, message)
}

// Get initial state from the content script
sendMessage({ type: 'GET_STATE' })
  .then((res) => updateUI(res.isBlurred))
  .catch(() => setError('Buka WhatsApp Web terlebih dahulu'))

btn.addEventListener('click', async () => {
  const nextState = !btn.classList.contains('active')
  btn.disabled = true

  try {
    const res = await sendMessage({ type: 'SET_BLUR', value: nextState })
    updateUI(res.isBlurred)
  } catch {
    setError('Gagal terhubung. Coba refresh halaman.')
  }
})

// src/popup.ts
var btn = document.getElementById("toggle-btn");
var statusEl = document.getElementById("status");
var dotEl = document.getElementById("dot");
function updateUI(blurred) {
  btn.disabled = false;
  if (blurred) {
    btn.textContent = "Tampilkan Sidebar";
    btn.classList.add("active");
    dotEl.classList.add("blurred");
    statusEl.textContent = "Sidebar sedang disamarkan";
  } else {
    btn.textContent = "Sembunyikan Sidebar";
    btn.classList.remove("active");
    dotEl.classList.remove("blurred");
    statusEl.textContent = "Sidebar terlihat normal";
  }
}
function setError(msg) {
  statusEl.textContent = msg;
  btn.disabled = true;
  dotEl.classList.remove("blurred");
}
async function queryActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id)
    throw new Error("No active tab found");
  return tab;
}
async function sendMessage(message) {
  const tab = await queryActiveTab();
  return chrome.tabs.sendMessage(tab.id, message);
}
sendMessage({ type: "GET_STATE" }).then((res) => updateUI(res.isBlurred)).catch(() => setError("Buka WhatsApp Web terlebih dahulu"));
btn.addEventListener("click", async () => {
  const nextState = !btn.classList.contains("active");
  btn.disabled = true;
  try {
    const res = await sendMessage({ type: "SET_BLUR", value: nextState });
    updateUI(res.isBlurred);
  } catch {
    setError("Gagal terhubung. Coba refresh halaman.");
  }
});

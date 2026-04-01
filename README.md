# hide-wa-extension

Chrome extension untuk blur sidebar kiri WhatsApp Web. Hover ke chat item untuk melihatnya sebentar.

## Install dependencies

```bash
bun install
```

## Build

```bash
bun run build
```

Output akan dihasilkan di folder `dist/`.

## Load ke Chrome

1. Buka `chrome://extensions` di browser
2. Aktifkan **Developer mode** (toggle di pojok kanan atas)
3. Klik **Load unpacked**
4. Pilih folder `hide-wa-extension` (root project ini)
5. Extension akan muncul di toolbar Chrome

## Cara pakai

1. Buka [web.whatsapp.com](https://web.whatsapp.com)
2. Klik icon extension di toolbar
3. Tekan **Sembunyikan Sidebar** untuk mengaktifkan blur
4. Hover ke salah satu chat untuk melihat nama/isi chat tersebut
5. Tekan lagi untuk menonaktifkan blur

> Setiap kali ada perubahan kode, jalankan `bun run build` lalu klik **Reload** (ikon refresh) pada extension di `chrome://extensions`.

---

This project was created using `bun init` in bun v1.3.5. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

# Panel Kontrol — Cari & Edit Data dari Banyak Google Sheets

Web app kecil berbasis Google Apps Script untuk mencari dan mengedit data
dari banyak Google Sheets sekaligus, dari satu halaman web, tanpa perlu
membuka sheet-sheet aslinya satu per satu.

## Struktur Project

```
.
├── Code.gs                  # Logika utama (search, update cell, menu)
├── WebApp.html               # Tampilan web app (UI pencarian & edit)
├── appsscript.json            # Manifest Apps Script
├── .clasp.json.example        # Template konfigurasi clasp (copy → .clasp.json)
└── .gitignore
```

## Cara Kerja Singkat

- Daftar sheet yang ingin disambungkan disimpan di **tab `Daftar_Sheet`
  di dalam Google Sheet "Panel Kontrol" itu sendiri** (bukan di kode).
  Jadi repo ini aman untuk di-publish — tidak berisi link/ID spreadsheet
  siapa pun.
- `Code.gs` membaca daftar itu, mencari keyword di semua sheet terdaftar,
  dan bisa menulis balik perubahan ke sheet asal lewat `updateCell()`.
- `WebApp.html` disajikan lewat `doGet()` sebagai Web App dengan URL sendiri.

## Setup

Ada dua cara: **manual (copy-paste)** atau **pakai `clasp`** (disarankan
kalau kamu mau alur edit-di-GitHub → deploy).

### Cara A — Manual (tanpa install apa pun)

1. Buat Google Sheet baru, beri nama bebas (misal "Panel Kontrol")
2. Buka **Extensions > Apps Script**
3. Hapus isi `Code.gs` bawaan, tempel isi [`Code.gs`](./Code.gs) dari repo ini
4. Buat file HTML baru bernama **WebApp**, tempel isi [`WebApp.html`](./WebApp.html)
5. Save, lalu **Deploy > New deployment > Web app**
   - Execute as: **Me**
   - Who has access: **Only myself** (atau sesuai kebutuhan)
6. Copy URL Web App yang muncul
7. Kembali ke Sheet, refresh, jalankan menu **Panel Kontrol > Setup / Buat Tab Daftar Sheet**
8. Isi tab `Daftar_Sheet` dengan sheet-sheet yang mau disambungkan

### Cara B — Pakai `clasp` (untuk alur GitHub)

[`clasp`](https://github.com/google/clasp) adalah CLI resmi Google untuk
push/pull kode Apps Script dari terminal, sehingga project ini bisa
dikelola sepenuhnya lewat git.

```bash
# 1. Install clasp
npm install -g @google/clasp

# 2. Login dengan akun Google kamu
clasp login

# 3. Clone repo ini
git clone <url-repo-kamu>
cd panel-kontrol

# 4. Buat project Apps Script baru yang terikat ke sebuah Google Sheet
#    (jalankan ini SEKALI saja di awal)
clasp create --type sheets --title "Panel Kontrol" --rootDir ./

# Ini akan otomatis membuat .clasp.json (JANGAN di-commit, sudah ada di .gitignore)

# 5. Push kode ke Apps Script
clasp push

# 6. Buka editor Apps Script di browser kalau perlu
clasp open

# 7. Deploy sebagai Web App
clasp deploy --description "Panel Kontrol v1"
```

Setelah ini, alur kerja sehari-hari cukup:

```bash
# edit Code.gs / WebApp.html di editor pilihanmu (VS Code, dll)
git add .
git commit -m "update fitur pencarian"
git push

clasp push      # kirim perubahan ke Apps Script
clasp deploy    # buat versi deployment baru (URL tetap sama)
```

## ⚠️ Keamanan

- **Jangan commit `.clasp.json`** — file ini berisi Script ID unik milikmu.
  Sudah dimasukkan ke `.gitignore` secara default.
- **Jangan taruh URL Web App hasil deploy di README/commit publik** kalau
  "Who has access" di-set selain "Only myself" — siapa pun yang tahu URL
  itu berpotensi bisa membuka panel edit datamu.
- Daftar link spreadsheet (`Daftar_Sheet`) hidup di dalam Google Sheet,
  bukan di repo ini — tetap begitu, jangan pindahkan ke kode/README.

## Lisensi

Bebas dipakai dan dimodifikasi untuk keperluan pribadi/internal.

#!/usr/bin/env bash
# simpan-url.sh
# Menyimpan URL Web App hasil deploy ke file .env lokal (tidak ikut ke GitHub).
# Jalankan: bash simpan-url.sh

set -e

ENV_FILE=".env"

echo "=== Simpan URL Panel Kontrol ==="
read -rp "Tempel URL Web App hasil deploy (https://script.google.com/macros/s/.../exec): " URL

if [[ -z "$URL" ]]; then
  echo "URL kosong, dibatalkan."
  exit 1
fi

echo "PANEL_URL=$URL" > "$ENV_FILE"
echo "Tersimpan ke $ENV_FILE"

# Pastikan .env memang diabaikan git, bukan cuma ada di .gitignore tapi juga
# belum kadung ke-track sebelumnya
if command -v git >/dev/null 2>&1 && [[ -d .git ]]; then
  if git ls-files --error-unmatch "$ENV_FILE" >/dev/null 2>&1; then
    echo ""
    echo "⚠️  PERINGATAN: $ENV_FILE ternyata SUDAH ter-track oleh git sebelumnya."
    echo "   Ini berarti pernah ke-commit dan mungkin sudah ada riwayatnya di GitHub."
    echo "   Jalankan ini untuk berhenti men-tracknya (riwayat lama tetap perlu dibersihkan manual):"
    echo "   git rm --cached $ENV_FILE"
  else
    echo "Aman: $ENV_FILE tidak ter-track oleh git (sudah masuk .gitignore)."
  fi
fi

echo ""
echo "Untuk buka URL-nya nanti, jalankan:  cat .env"

/**
 * PANEL KONTROL - Cari & Edit Data dari Banyak Google Sheets
 * ============================================================
 * Lihat README.md di root repo untuk panduan setup lengkap
 * (manual copy-paste, atau lewat clasp untuk alur GitHub).
 */

const CONFIG_SHEET_NAME = "Daftar_Sheet";

/**
 * Membuat menu custom saat spreadsheet dibuka
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Panel Kontrol")
    .addItem("Setup / Buat Tab Daftar Sheet", "setupConfigSheet")
    .addToUi();
}

/**
 * Membuat tab "Daftar_Sheet" otomatis jika belum ada.
 * Di sinilah kamu mendaftarkan semua sheet yang ingin disambungkan.
 */
function setupConfigSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let configSheet = ss.getSheetByName(CONFIG_SHEET_NAME);

  if (!configSheet) {
    configSheet = ss.insertSheet(CONFIG_SHEET_NAME);
    configSheet.getRange(1, 1, 1, 4).setValues([
      ["Nama Label", "URL atau ID Spreadsheet", "Nama Tab (kosongkan = semua tab)", "Aktif? (YES/NO)"]
    ]);
    configSheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#4a86e8").setFontColor("white");
    configSheet.setColumnWidths(1, 4, 220);
    configSheet.getRange(2, 1, 1, 4).setValues([
      ["Contoh: Data Penjualan Jan", "https://docs.google.com/spreadsheets/d/xxxxxxx/edit", "", "YES"]
    ]);
    SpreadsheetApp.getUi().alert(
      "Tab 'Daftar_Sheet' berhasil dibuat.\n\nSilakan isi baris demi baris:\n- Kolom B: tempel URL lengkap spreadsheet yang mau disambungkan\n- Kolom C: kosongkan jika ingin cari di semua tab dalam sheet itu\n- Kolom D: isi YES agar ikut dicari, NO untuk sementara nonaktifkan"
    );
  } else {
    SpreadsheetApp.getUi().alert("Tab 'Daftar_Sheet' sudah ada.");
  }
}

/**
 * Menyajikan halaman web penuh saat diakses lewat URL Web App.
 * Setelah di-deploy (Deploy > New deployment > Web app), akan ada
 * URL sendiri yang bisa dibuka di tab browser mana pun, halaman penuh.
 */
function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName(CONFIG_SHEET_NAME)) {
    setupConfigSheet();
  }
  return HtmlService.createHtmlOutputFromFile("WebApp")
    .setTitle("Panel Kontrol")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Dipanggil dari WebApp.html untuk mendapatkan daftar sumber sheet
 * (dipakai untuk menampilkan info jumlah sheet aktif di header)
 */
function getSourceSummary() {
  const configs = getActiveSheetConfigs_();
  return {
    total: configs.length,
    labels: configs.map(c => c.label)
  };
}

/**
 * Mengambil daftar sheet aktif dari tab konfigurasi
 */
function getActiveSheetConfigs_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName(CONFIG_SHEET_NAME);
  if (!configSheet) return [];

  const data = configSheet.getDataRange().getValues();
  const configs = [];

  for (let i = 1; i < data.length; i++) {
    const [label, urlOrId, tabName, aktif] = data[i];
    if (!urlOrId) continue;
    if (String(aktif).trim().toUpperCase() === "NO") continue;

    const id = extractSpreadsheetId_(urlOrId);
    if (id) {
      configs.push({ label: label || id, id: id, tabName: (tabName || "").trim() });
    }
  }
  return configs;
}

/**
 * Ekstrak ID spreadsheet dari URL atau string ID langsung
 */
function extractSpreadsheetId_(urlOrId) {
  const str = String(urlOrId).trim();
  const match = str.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  if (/^[a-zA-Z0-9-_]{20,}$/.test(str)) return str;
  return null;
}

/**
 * FUNGSI UTAMA: Mencari keyword di semua sheet terdaftar
 * Dipanggil dari WebApp.html
 */
function searchAllSheets(keyword) {
  if (!keyword || keyword.trim() === "") return [];
  const keywordLower = keyword.trim().toLowerCase();
  const configs = getActiveSheetConfigs_();
  const results = [];
  const MAX_RESULTS = 100;

  for (const config of configs) {
    let targetSpreadsheet;
    try {
      targetSpreadsheet = SpreadsheetApp.openById(config.id);
    } catch (e) {
      continue; // skip jika tidak bisa dibuka (no access / ID salah)
    }

    const sheetsToSearch = config.tabName
      ? [targetSpreadsheet.getSheetByName(config.tabName)].filter(Boolean)
      : targetSpreadsheet.getSheets();

    for (const sheet of sheetsToSearch) {
      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();
      if (lastRow < 1 || lastCol < 1) continue;

      const values = sheet.getRange(1, 1, lastRow, lastCol).getDisplayValues();
      const headers = values[0];

      for (let r = 1; r < values.length; r++) {
        const row = values[r];
        const rowMatches = row.some(cell => String(cell).toLowerCase().includes(keywordLower));

        if (rowMatches) {
          results.push({
            sourceLabel: config.label,
            spreadsheetId: config.id,
            sheetName: sheet.getName(),
            rowNumber: r + 1,
            headers: headers,
            rowData: row,
            url: `https://docs.google.com/spreadsheets/d/${config.id}/edit#gid=${sheet.getSheetId()}&range=A${r + 1}`
          });
          if (results.length >= MAX_RESULTS) return results;
        }
      }
    }
  }

  return results;
}

/**
 * Update satu cell tertentu di sheet sumber
 * Dipanggil dari WebApp.html saat user menyimpan edit
 */
function updateCell(spreadsheetId, sheetName, rowNumber, colIndex, newValue) {
  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return { success: false, message: "Tab tidak ditemukan." };

    sheet.getRange(rowNumber, colIndex + 1).setValue(newValue);
    return { success: true, message: "Tersimpan." };
  } catch (e) {
    return { success: false, message: "Gagal menyimpan: " + e.message };
  }
}

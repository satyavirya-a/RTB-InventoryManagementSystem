/**
 * =============================================================================
 * GUDANG RTB — GOOGLE APPS SCRIPT BACKUP CONNECTOR
 * =============================================================================
 *
 * File ini berisi kode Google Apps Script untuk dipasang di Google Spreadsheet Anda.
 * Script ini berfungsi sebagai Webhook (Web App) yang menerima kiriman data transaksi
 * dari aplikasi React Gudang RTB secara otomatis.
 *
 * FITUR SCRIPT:
 * 1. Otomatis membuat header tabel Google Sheet jika sheet masih kosong.
 * 2. Mencatat setiap transaksi (Pemakaian, Pengembalian, Penitipan, Pengambilan, Penambahan)
 *    ke baris baru di spreadsheet.
 * 3. Jika ada foto bukti, script otomatis mendownload foto dari Supabase dan menyimpannya
 *    ke dalam folder khusus di Google Drive ("Gudang RTB - Foto Bukti").
 *
 * -----------------------------------------------------------------------------
 * CARA MEMASANG DI GOOGLE SPREADSHEET (Hanya 1x Setup):
 * -----------------------------------------------------------------------------
 * 1. Buat Google Spreadsheet baru di Google Drive Anda (misal: "Backup Gudang RTB").
 * 2. Di menu atas Google Sheet, klik: Extensions (Ekstensi) → Apps Script.
 * 3. Hapus semua kode default di Apps Script, lalu salin dan tempel SEMUA isi file ini.
 * 4. Klik tombol "Save" (ikon disket) 💾.
 * 5. Klik tombol "Deploy" (di kanan atas) → pilih "New deployment".
 * 6. Klik ikon gerigi ⚙️ di sebelah kiri "Select type" → pilih "Web app".
 * 7. Isi konfigurasi:
 *    - Description: "Gudang RTB Sync Webhook"
 *    - Execute as: "Me (email Anda)"
 *    - Who has access: "Anyone" (PENTING! Pilih 'Anyone' agar React frontend bisa mengirim data).
 * 8. Klik "Deploy" → berikan izin akses (Authorize access) ke akun Google Anda.
 * 9. Salin "Web app URL" (format: https://script.google.com/macros/s/.../exec).
 * 10. Buka file .env.local di project React Anda, lalu masukkan:
 *     VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
 * =============================================================================
 */

/**
 * OPSI PENGATURAN SPREADSHEET:
 * - Jika script ini dibuat dari menu "Extensions → Apps Script" di Google Sheet: biarkan KOSONG ("").
 * - Jika script dibuat dari script.google.com terpisah: masukkan Spreadsheet ID atau URL Google Sheet di sini.
 */
var CUSTOM_SPREADSHEET_ID = ""; // Contoh: "1abc2XYZ..." atau kosongkan

/**
 * Handler utama untuk menerima HTTP POST request dari aplikasi React.
 *
 * @param {object} e - Event object dari Google Apps Script yang memuat postData
 * @returns {GoogleAppsScript.Content.TextOutput} Output JSON status keberhasilan
 */
function doPost(e) {
  try {
    // 1. Validasi isi body request
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ status: 'error', message: 'No post data received' });
    }

    // 2. Parse data JSON dari frontend React
    var data = JSON.parse(e.postData.contents);
    var timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
    var transactionType = data.transaction_type || '-';
    var actorName = data.actor_name || '-';
    var eventName = data.event_name || '-';
    var itemsSummary = data.items_summary || '-';
    var notes = data.notes || '-';
    var proofPhotoUrl = data.proof_photo_url || '';

    // 3. Dapatkan Sheet target
    var sheet = getSheetInstance();
    if (!sheet) {
      throw new Error('Tidak dapat menemukan Google Spreadsheet aktif. Pastikan script terhubung dengan sheet atau isi CUSTOM_SPREADSHEET_ID.');
    }

    // 4. Inisialisasi Header Tabel jika sheet masih kosong
    if (sheet.getLastRow() === 0) {
      var headers = [
        'Waktu Transaksi (WIB)',
        'Jenis Transaksi',
        'Nama Panitia / PIC',
        'Divisi / Event',
        'Detail Barang',
        'Catatan / Rincian',
        'Link Foto Supabase',
        'Salinan Foto Google Drive'
      ];
      sheet.appendRow(headers);
      
      // Styling header agar rapi dan tebal
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#1e293b');
      headerRange.setFontColor('#ffffff');
    }

    // 5. Simpan salinan foto ke Google Drive (jika ada foto)
    var drivePhotoLink = '-';
    if (proofPhotoUrl && proofPhotoUrl.startsWith('http')) {
      try {
        drivePhotoLink = savePhotoToDriveFolder(proofPhotoUrl, transactionType, actorName);
      } catch (photoErr) {
        drivePhotoLink = 'Gagal sync ke Drive: ' + photoErr.toString();
      }
    }

    // 6. Format tanggal lokal Indonesia
    var formattedDate = Utilities.formatDate(timestamp, 'Asia/Jakarta', 'dd-MM-yyyy HH:mm:ss') + ' WIB';

    // 7. Tambahkan baris data baru ke Google Sheet
    var newRow = [
      formattedDate,
      transactionType.toUpperCase(),
      actorName,
      eventName,
      itemsSummary,
      notes,
      proofPhotoUrl || '-',
      drivePhotoLink
    ];

    sheet.appendRow(newRow);

    return createJsonResponse({
      status: 'success',
      message: 'Transaksi berhasil dicatat ke Google Sheets & Drive!',
      row: sheet.getLastRow()
    });

  } catch (error) {
    return createJsonResponse({
      status: 'error',
      message: error.toString()
    });
  }
}

/**
 * Helper untuk mendapatkan instance Sheet yang tepat
 * @returns {GoogleAppsScript.Spreadsheet.Sheet|null}
 */
function getSheetInstance() {
  if (CUSTOM_SPREADSHEET_ID && CUSTOM_SPREADSHEET_ID.trim() !== '') {
    if (CUSTOM_SPREADSHEET_ID.startsWith('http')) {
      return SpreadsheetApp.openByUrl(CUSTOM_SPREADSHEET_ID).getActiveSheet();
    }
    return SpreadsheetApp.openById(CUSTOM_SPREADSHEET_ID).getActiveSheet();
  }
  
  var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (activeSpreadsheet) {
    return activeSpreadsheet.getActiveSheet();
  }
  return null;
}

/**
 * Menyimpan salinan file gambar dari URL Supabase ke Folder khusus di Google Drive.
 *
 * @param {string} photoUrl - URL foto publik dari Supabase Storage
 * @param {string} transactionType - Tipe transaksi untuk penamaan file
 * @param {string} actorName - Nama panitia untuk penamaan file
 * @returns {string} URL file di Google Drive
 */
function savePhotoToDriveFolder(photoUrl, transactionType, actorName) {
  var folderName = 'Gudang RTB - Foto Bukti';
  var folders = DriveApp.getFoldersByName(folderName);
  var targetFolder;

  // Buat folder jika belum ada di Google Drive
  if (folders.hasNext()) {
    targetFolder = folders.next();
  } else {
    targetFolder = DriveApp.createFolder(folderName);
  }

  // Unduh blob gambar dari URL
  var response = UrlFetchApp.fetch(photoUrl);
  var imageBlob = response.getBlob();

  // Buat nama file yang rapi: YYYYMMDD_TIPE_NAMA.ext
  var timeStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd_HHmmss');
  var cleanActor = actorName.replace(/[^a-zA-Z0-9]/g, '_');
  var fileName = timeStr + '_' + transactionType.toUpperCase() + '_' + cleanActor + '.webp';
  imageBlob.setName(fileName);

  // Simpan file ke folder Google Drive
  var file = targetFolder.createFile(imageBlob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return file.getUrl();
}

/**
 * Helper untuk membuat response HTTP JSON.
 *
 * @param {object} data - Objek data response
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handler GET sederhana untuk pengujian koneksi via browser.
 */
function doGet() {
  return createJsonResponse({
    status: 'online',
    message: 'Webhook Google Apps Script Gudang RTB aktif dan siap menerima data!'
  });
}

/**
 * Fungsi uji coba internal di editor Apps Script:
 * Klik fungsi ini lalu klik tombol "Run" di atas editor Apps Script untuk menguji tanpa lewat web.
 */
function testDoPost() {
  var mockEvent = {
    postData: {
      contents: JSON.stringify({
        timestamp: new Date().toISOString(),
        transaction_type: 'pemakaian',
        actor_name: 'Tester Panitia',
        event_name: 'RTB Test Logistik',
        items_summary: '2x Double Tape, 1x Terminal Listrik',
        notes: 'Uji coba sync otomatis',
        proof_photo_url: ''
      })
    }
  };
  
  var result = doPost(mockEvent);
  Logger.log(result.getContent());
}

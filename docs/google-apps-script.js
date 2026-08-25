/**
 * =============================================================================
 * GUDANG RTB — GOOGLE APPS SCRIPT BACKUP CONNECTOR (MULTI-SHEET & DRIVE FOTO)
 * =============================================================================
 *
 * Script ini mengelola 2 SHEET & 2 FOLDER GOOGLE DRIVE secara otomatis:
 *
 * 📑 STRUKTUR SHEET:
 * 1. Sheet "Log Transaksi"      : Riwayat pergerakan (Pemakaian, Pengembalian, Penitipan, dll)
 * 2. Sheet "Rekap Stok Barang"   : Master data inventaris + Link Salinan Foto di Google Drive
 *
 * 📁 STRUKTUR FOLDER GOOGLE DRIVE:
 * 1. Folder "Gudang RTB - Foto Bukti Transaksi" : Salinan foto bukti serah terima & penitipan
 * 2. Folder "Gudang RTB - Foto Barang Katalog"  : Salinan foto seluruh katalog barang
 *
 * -----------------------------------------------------------------------------
 * CARA MEMASANG DI GOOGLE SPREADSHEET (Hanya 1x Setup):
 * -----------------------------------------------------------------------------
 * 1. Buka Google Spreadsheet Anda.
 * 2. Di menu atas, klik: Extensions (Ekstensi) → Apps Script.
 * 3. Hapus semua kode lama, lalu tempel SEMUA isi file ini.
 * 4. Klik tombol "Save" (ikon disket) 💾.
 * 5. Klik "Deploy" → "Manage deployments".
 * 6. Klik ikon pensil ✏️ (Edit) pada deployment aktif:
 *    - Version: pilih "New version" (PENTING! Jangan lupa pilih 'New version').
 *    - Klik tombol "Deploy".
 * =============================================================================
 */

/**
 * ID Spreadsheet Anda:
 */
var CUSTOM_SPREADSHEET_ID = "1REb2dCwLBp1-x4wcBeI_w2BvgK02QSBRl01Cf0-KDEE";

/**
 * Handler utama untuk menerima HTTP POST request dari aplikasi React.
 *
 * @param {object} e - Event object dari Google Apps Script yang memuat postData
 * @returns {GoogleAppsScript.Content.TextOutput} Output JSON status keberhasilan
 */
function doPost(e) {
  // Gunakan ScriptLock untuk mencegah race condition jika ada 2 request sync masuk bersamaan
  var lock = LockService.getScriptLock();
  var hasLock = false;
  try {
    // Tunggu giliran hingga 30 detik
    hasLock = lock.tryLock(30000);

    // 1. Validasi isi body request
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ status: 'error', message: 'No post data received' });
    }

    // 2. Parse data JSON dari frontend React
    var data = JSON.parse(e.postData.contents);
    var spreadsheet = getSpreadsheetInstance();
    if (!spreadsheet) {
      throw new Error('Tidak dapat menemukan Google Spreadsheet. Periksa ID Spreadsheet Anda.');
    }

    // Pastikan kedua sheet selalu ada
    ensureBothSheetsExist(spreadsheet);

    // =========================================================================
    // AKSI 1: SINKRONISASI REKAP MASTER BARANG (Sheet: "Rekap Stok Barang")
    // =========================================================================
    if (data.action === 'sync_inventory_catalog' && data.items) {
      return handleSyncInventoryCatalog(spreadsheet, data.items);
    }

    // =========================================================================
    // AKSI 2: PENCATATAN LOG TRANSAKSI HARIAN (Sheet: "Log Transaksi")
    // =========================================================================
    return handleLogTransaction(spreadsheet, data);

  } catch (error) {
    return createJsonResponse({
      status: 'error',
      message: error.toString()
    });
  } finally {
    if (hasLock) {
      lock.releaseLock();
    }
  }
}

/**
 * Memastikan Sheet "Log Transaksi" dan "Rekap Stok Barang" keduanya selalu ada.
 *
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} spreadsheet
 */
function ensureBothSheetsExist(spreadsheet) {
  var logSheet = spreadsheet.getSheetByName('Log Transaksi');
  var rekapSheet = spreadsheet.getSheetByName('Rekap Stok Barang');

  // Jika baru ada Sheet1 kosong bawaan
  var defaultSheet1 = spreadsheet.getSheetByName('Sheet1');
  if (defaultSheet1) {
    if (!logSheet) {
      defaultSheet1.setName('Log Transaksi');
      logSheet = defaultSheet1;
    } else if (!rekapSheet) {
      defaultSheet1.setName('Rekap Stok Barang');
      rekapSheet = defaultSheet1;
    }
  }

  if (!logSheet) {
    logSheet = spreadsheet.insertSheet('Log Transaksi', 0);
  }
  if (!rekapSheet) {
    rekapSheet = spreadsheet.insertSheet('Rekap Stok Barang', 1);
  }
}

/**
 * Handler untuk mencatat log transaksi ke sheet "Log Transaksi".
 *
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} spreadsheet
 * @param {object} data
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function handleLogTransaction(spreadsheet, data) {
  var sheet = spreadsheet.getSheetByName('Log Transaksi');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('Log Transaksi', 0);
  }

  var timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
  var transactionType = data.transaction_type || '-';
  var actorName = data.actor_name || '-';
  var eventName = data.event_name || '-';
  var itemsSummary = data.items_summary || '-';
  var notes = data.notes || '-';
  var proofPhotoUrl = data.proof_photo_url || '';

  // Inisialisasi Header jika sheet Log masih kosong
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
    styleHeaderRow(sheet, headers.length, '#1e293b');
  }

  // Simpan salinan foto bukti transaksi ke Google Drive
  var drivePhotoLink = '-';
  if (proofPhotoUrl && proofPhotoUrl.startsWith('http')) {
    try {
      drivePhotoLink = saveProofPhotoToDrive(proofPhotoUrl, transactionType, actorName);
    } catch (photoErr) {
      drivePhotoLink = 'Gagal sync ke Drive: ' + photoErr.toString();
    }
  }

  var formattedDate = Utilities.formatDate(timestamp, 'Asia/Jakarta', 'dd-MM-yyyy HH:mm:ss') + ' WIB';

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
    message: 'Transaksi berhasil dicatat ke sheet "Log Transaksi"!',
    row: sheet.getLastRow()
  });
}

/**
 * Handler untuk memperbarui master data di sheet "Rekap Stok Barang" dan mem-backup foto barang ke Drive.
 *
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} spreadsheet
 * @param {Array<object>} items
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function handleSyncInventoryCatalog(spreadsheet, items) {
  var sheet = spreadsheet.getSheetByName('Rekap Stok Barang');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('Rekap Stok Barang', 1);
  }

  // Header Tabel Rekap Stok Lengkap
  var headers = [
    'No',
    'Nama Barang',
    'Kategori',
    'Deskripsi',
    'Stok Siap Pakai',
    'Sedang Dipakai / Dipinjam',
    'Total Unit',
    'Satuan',
    'Status',
    'Link Foto Supabase',
    'Salinan Foto Google Drive',
    'Terakhir Diperbarui (WIB)'
  ];

  var nowFormatted = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd-MM-yyyy HH:mm:ss') + ' WIB';

  // Siapkan data baris barang & cadangkan foto katalog ke Google Drive
  var rows = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var available = Number(item.stock_available) || 0;
    var inUse = Number(item.stock_in_use) || 0;
    var total = available + inUse;
    var statusText = item.status === 'archived' ? 'Diarsipkan (Soft Delete)' : 'Aktif';

    // Backup foto katalog barang ke folder Google Drive jika ada foto
    var drivePhotoLink = '-';
    if (item.photo_url && item.photo_url.startsWith('http')) {
      try {
        drivePhotoLink = saveCatalogPhotoToDrive(item.photo_url, item.name);
      } catch (err) {
        drivePhotoLink = 'Error Drive: ' + err.toString();
      }
    }

    rows.push([
      i + 1,
      item.name || '-',
      item.category || 'Lain-lain',
      item.description || '-',
      available,
      inUse,
      total,
      item.unit || 'pcs',
      statusText,
      item.photo_url || '-',
      drivePhotoLink,
      nowFormatted
    ]);
  }

  // Bersihkan data lama HANYA setelah data baru siap ditulis (mencegah sheet kosong jika ada error)
  sheet.clear();
  sheet.appendRow(headers);
  styleHeaderRow(sheet, headers.length, '#0f766e');

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);

    // Pasang aturan Dropdown (Data Validation) 15 Kategori otomatis di Kolom C (Kategori)
    var categoryList = [
      'Kertas',
      'Kain',
      'Alat Tulis',
      'Alat Mewarnai',
      'Lem & Perekat',
      'Alat Potong',
      'Tali',
      'Pita',
      'Bola',
      'Pipa',
      'Banner',
      'Aksesoris',
      'Alat Makan',
      'Elektronik & Sound',
      'Lain-lain'
    ];
    var categoryValidation = SpreadsheetApp.newDataValidation()
      .requireValueInList(categoryList, true)
      .setAllowInvalid(true)
      .build();
    sheet.getRange(2, 3, rows.length, 1).setDataValidation(categoryValidation);

    sheet.autoResizeColumns(1, headers.length);
  }

  return createJsonResponse({
    status: 'success',
    message: 'Master inventaris berhasil disinkronkan (' + items.length + ' barang) ke sheet "Rekap Stok Barang"!',
    total_items: items.length
  });
}

/**
 * Menyimpan salinan foto BUKTI transaksi ke dalam SUBFOLDER KHUSUS per transaksi di Google Drive.
 *
 * Struktur Folder:
 * 📁 Gudang RTB - Foto Bukti Transaksi
 *    └── 📁 YYYY-MM-DD_HHmm_JENIS_NAMA (Subfolder per transaksi)
 *          ├── 🖼️ Foto_1.webp
 *          └── 🖼️ Foto_2.webp
 *
 * @param {string} photoUrlString - URL foto (bisa 1 URL atau multi-URL dipisahkan koma)
 * @param {string} transactionType - Tipe transaksi
 * @param {string} actorName - Nama panitia
 * @returns {string} URL Subfolder Google Drive yang memuat seluruh foto transaksi tersebut
 */
function saveProofPhotoToDrive(photoUrlString, transactionType, actorName) {
  if (!photoUrlString || !photoUrlString.trim()) return '-';

  var mainFolder = getOrCreateDriveFolder('Gudang RTB - Foto Bukti Transaksi');

  // Pecah string jika berisi lebih dari 1 URL
  var urls = photoUrlString.split(',').map(function(u) { return u.trim(); }).filter(function(u) { return u.startsWith('http'); });
  if (urls.length === 0) return '-';

  var timeStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd_HHmm');
  var cleanActor = (actorName || 'Panitia').replace(/[^a-zA-Z0-9]/g, '_');
  var cleanType = (transactionType || 'BUKTI').toUpperCase();
  
  // Buat subfolder khusus untuk transaksi ini agar Google Drive selalu rapi
  var subfolderName = timeStr + '_' + cleanType + '_' + cleanActor;
  var subfolder = mainFolder.createFolder(subfolderName);
  subfolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // Unduh dan simpan setiap foto ke dalam subfolder tersebut
  for (var i = 0; i < urls.length; i++) {
    try {
      var response = UrlFetchApp.fetch(urls[i]);
      var imageBlob = response.getBlob();
      var fileName = 'Foto_' + (i + 1) + '.webp';
      imageBlob.setName(fileName);
      
      var file = subfolder.createFile(imageBlob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (err) {
      Logger.log('Gagal unduh foto ke-' + (i + 1) + ': ' + err.toString());
    }
  }

  // Kembalikan Link Subfolder Google Drive
  return subfolder.getUrl();
}

/**
 * Menyimpan salinan foto KATALOG BARANG ke folder Google Drive "Gudang RTB - Foto Barang Katalog".
 *
 * @param {string} photoUrl
 * @param {string} itemName
 * @returns {string} URL file Google Drive
 */
function saveCatalogPhotoToDrive(photoUrl, itemName) {
  var folder = getOrCreateDriveFolder('Gudang RTB - Foto Barang Katalog');

  var cleanItem = (itemName || 'Barang').replace(/[^a-zA-Z0-9]/g, '_');
  var fileName = cleanItem + '.webp';
  var oldPrefixFileName = 'Katalog_' + cleanItem + '.webp';

  // 1. Cek apakah file dengan nama baru (tanpa Katalog_) sudah ada
  var existingFiles = folder.getFilesByName(fileName);
  if (existingFiles.hasNext()) {
    var primaryFile = existingFiles.next();
    
    // Jika ada duplikat berlebih, pindahkan ke Trash
    while (existingFiles.hasNext()) {
      var extraDuplicate = existingFiles.next();
      extraDuplicate.setTrashed(true);
    }
    
    return primaryFile.getUrl();
  }

  // 2. Jika ada file versi lama yang masih memakai awalan 'Katalog_', ganti namanya menjadi nama baru
  var oldFiles = folder.getFilesByName(oldPrefixFileName);
  if (oldFiles.hasNext()) {
    var oldFile = oldFiles.next();
    oldFile.setName(fileName);
    
    while (oldFiles.hasNext()) {
      var extraOld = oldFiles.next();
      extraOld.setTrashed(true);
    }
    
    return oldFile.getUrl();
  }

  // 3. Jika belum pernah ada sama sekali, unduh dan buat file baru
  var response = UrlFetchApp.fetch(photoUrl);
  var imageBlob = response.getBlob();
  imageBlob.setName(fileName);

  var file = folder.createFile(imageBlob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return file.getUrl();
}

/**
 * Helper untuk mendapatkan atau membuat folder Google Drive.
 *
 * @param {string} folderName
 * @returns {GoogleAppsScript.Drive.Folder}
 */
function getOrCreateDriveFolder(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}

/**
 * Helper untuk styling header tabel.
 */
function styleHeaderRow(sheet, numCols, bgColor) {
  var headerRange = sheet.getRange(1, 1, 1, numCols);
  headerRange.setFontWeight('bold');
  headerRange.setBackground(bgColor || '#1e293b');
  headerRange.setFontColor('#ffffff');
  headerRange.setHorizontalAlignment('center');
}

/**
 * Helper untuk mendapatkan instance Spreadsheet target.
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet|null}
 */
function getSpreadsheetInstance() {
  if (CUSTOM_SPREADSHEET_ID && CUSTOM_SPREADSHEET_ID.trim() !== '') {
    if (CUSTOM_SPREADSHEET_ID.startsWith('http')) {
      return SpreadsheetApp.openByUrl(CUSTOM_SPREADSHEET_ID);
    }
    return SpreadsheetApp.openById(CUSTOM_SPREADSHEET_ID);
  }
  
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Helper untuk membuat response HTTP JSON.
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
 * Fungsi uji coba internal di editor Apps Script untuk menguji sinkronisasi 2 sheet & drive:
 * Klik fungsi ini di dropdown toolbar Apps Script, lalu klik "Run" untuk menguji langsung!
 */
function testSyncInventory() {
  var mockEvent = {
    postData: {
      contents: JSON.stringify({
        action: 'sync_inventory_catalog',
        items: [
          { name: 'Kabel Ties', description: 'Panjang 30cm', stock_available: 0, stock_in_use: 0, unit: 'pcs', status: 'archived', photo_url: '' },
          { name: 'Proyektor', description: 'Epson EB-X05', stock_available: 3, stock_in_use: 0, unit: 'unit', status: 'active', photo_url: '' },
          { name: 'Ikan', description: 'Putih', stock_available: 0, stock_in_use: 12, unit: 'pcs', status: 'active', photo_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400' }
        ]
      })
    }
  };
  
  var result = doPost(mockEvent);
  Logger.log(result.getContent());
}

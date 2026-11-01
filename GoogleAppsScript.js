/**
 * BLACKNIGHT-NEXUS CENTRAL BACKEND V.23 (AUTH SUPPORT)
 * 🚀 ปรับปรุง: เพิ่มระบบ Register/Login ผ่าน Sheet "Users"
 */

const GAS_VERSION = "V29-MAIL-I18N";
// TODO(ตั้งค่า): เปลี่ยนเป็น ID ของ Google Sheet ร้านคุณเอง
// (ดู ID ได้จาก URL ชีต: docs.google.com/spreadsheets/d/<<< SPREADSHEET_ID >>>/edit)
const SPREADSHEET_ID = "PASTE_YOUR_SHEET_ID_HERE";
// ชื่อแท็บ (sheet tab) — ต้องตรงกับชื่อแท็บในไฟล์ Google Sheet ของคุณเป๊ะ
const SHEET_PRODUCTS = "Products";
const SHEET_ORDERS = "Orders";
const SHEET_BANK = "BankAccounts";
const SHEET_USERS = "Users";

// --- อีเมลแจ้งเตือนออเดอร์ใหม่ (ใส่หลายอีเมลได้ คั่นด้วย ,) ---
const NOTIFY_EMAIL = "ped.siraphob@gmail.com";
const SHOP_NAME = "Siam Cannabis อ่อนนุช";

function getSS() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    if (ss) return ss;
  } catch (e) {}
  return SpreadsheetApp.getActiveSpreadsheet();
}

// ===== ไฟล์ส่วนตัวสำหรับข้อมูลลูกค้า (Orders + Users) =====
// ตั้งรหัสไฟล์ที่ Project Settings → Script Properties → PRIVATE_SHEET_ID
// ยังไม่ตั้ง = ใช้ไฟล์หลักตามเดิม (deploy ก่อนย้ายแท็บได้ ไม่มีอะไรพัง)
function getPrivateSS() {
  try {
    var id = PropertiesService.getScriptProperties().getProperty("PRIVATE_SHEET_ID");
    if (id) return SpreadsheetApp.openById(id);
  } catch (e) {}
  return getSS();
}

function initSheets() {
  const ss = getSS();
  let pSheet = ss.getSheetByName(SHEET_PRODUCTS);
  if (!pSheet) {
    pSheet = ss.insertSheet(SHEET_PRODUCTS);
    pSheet.appendRow(["name", "size", "price", "note", "image", "tags", "status", "stock", "sold", "category"]);
  }
}

/** Hash password ด้วย SHA-256 */
function hashPassword(password) {
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  var hex = "";
  for (var i = 0; i < raw.length; i++) {
    var val = (raw[i] + 256) % 256;
    hex += ("0" + val.toString(16)).slice(-2);
  }
  return hex;
}

/** สร้าง simple token */
function generateToken() {
  return Utilities.getUuid();
}

// ===== ตรวจสิทธิ์ก่อนเขียนข้อมูล (Authorization) =====
// รหัสแอดมินเก็บที่ Apps Script → Project Settings → Script Properties → ADMIN_KEY
// ไม่อยู่ในโค้ด ไม่อยู่ใน repo ไม่ถูก build ลงไฟล์ JS ที่ลูกค้าโหลด
// คำสั่งที่ไม่อยู่ในลิสต์นี้ = ต้องมีรหัสเสมอ (ของใหม่ที่เพิ่มทีหลังจึงถูกปิดไว้ก่อนโดยอัตโนมัติ)
const PUBLIC_ACTIONS = ["checkVersion", "getProducts", "getBank", "register", "login", "log"];

function isAuthorized_(action, key) {
  if (PUBLIC_ACTIONS.indexOf(action) !== -1) return true;
  const expected = PropertiesService.getScriptProperties().getProperty("ADMIN_KEY");
  // ยังไม่ได้ตั้ง ADMIN_KEY = ปฏิเสธไว้ก่อน ปลอดภัยกว่าเปิดทิ้งไว้
  return !!expected && key === expected;
}

function denyResponse_() {
  return sendResponse({ error: "UNAUTHORIZED" });
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    if (!isAuthorized_(action, e.parameter.key)) return denyResponse_();
    if (action === "checkVersion") return sendResponse({ version: GAS_VERSION });

    const ss = getSS();
    if (action === "getProducts") {
      const sheet = ss.getSheetByName(SHEET_PRODUCTS);
      if (!sheet) return sendResponse({ error: "Product sheet missing" });
      const values = sheet.getDataRange().getValues();
      return sendResponse(values); // ส่งเป็น Array ดิบเลยเพื่อความชัวร์
    }

    if (action === "getBank") {
      const sheet = ss.getSheetByName(SHEET_BANK);
      return sendResponse(sheet ? sheet.getDataRange().getValues() : []);
    }
    return sendResponse({ error: "UNKNOWN_ACTION: " + action });
  } catch (err) {
    return sendResponse({ error: "GAS doGet Error: " + err.toString() });
  }
}

function doPost(e) {
  try {
    const ss = getSS();
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    if (!isAuthorized_(action, data.adminKey)) return denyResponse_();

    // ใช้ตรวจรหัสแอดมินตอนล็อกอิน (ผ่าน isAuthorized_ มาแล้ว = รหัสถูก)
    if (action === "verifyAdmin") return sendResponse({ result: "success" });

    // ===== REGISTER =====
    if (action === "register") {
      var pss = getPrivateSS();
      var uSheet = pss.getSheetByName(SHEET_USERS);
      if (!uSheet) {
        uSheet = pss.insertSheet(SHEET_USERS);
        uSheet.appendRow(["Timestamp", "Name", "Email", "PasswordHash", "Status"]);
      }
      var uRows = uSheet.getDataRange().getValues();
      var emailLower = (data.email || "").toLowerCase().trim();
      // ตรวจ email ซ้ำ
      for (var i = 1; i < uRows.length; i++) {
        if (String(uRows[i][2]).toLowerCase().trim() === emailLower) {
          return sendResponse({ error: "Email นี้ถูกใช้งานแล้ว" });
        }
      }
      var hashed = hashPassword(data.password);
      uSheet.appendRow([new Date(), cellSafe_(data.name), cellSafe_(emailLower), hashed, "active"]);
      SpreadsheetApp.flush();
      return sendResponse({ result: "success" });
    }

    // ===== LOGIN =====
    if (action === "login") {
      var uSheet2 = getPrivateSS().getSheetByName(SHEET_USERS);
      if (!uSheet2) return sendResponse({ error: "ยังไม่มีผู้ใช้ในระบบ" });
      var uRows2 = uSheet2.getDataRange().getValues();
      var emailLower2 = (data.email || "").toLowerCase().trim();
      var passHash = hashPassword(data.password);
      for (var j = 1; j < uRows2.length; j++) {
        if (String(uRows2[j][2]).toLowerCase().trim() === emailLower2 && uRows2[j][3] === passHash) {
          return sendResponse({
            result: "success",
            name: uRows2[j][1],
            email: uRows2[j][2],
            token: generateToken()
          });
        }
      }
      return sendResponse({ error: "Email หรือ Password ไม่ถูกต้อง" });
    }

    // ===== SAVE PROMPTPAY / บัญชีรับโอน (หน้า admin → แท็บ BankAccounts) =====
    // หน้าร้านอ่านแท็บนี้ผ่าน getBank เพื่อแสดงช่องทางโอนตอนชำระเงิน
    if (action === "saveSettings" || action === "saveBank") {
      const rows = data.settings;
      const valid = Array.isArray(rows) && rows.length >= 1 && rows.length <= 51 &&
        rows.every(r => Array.isArray(r) && r.length === 5);
      if (!valid) return sendResponse({ error: "INVALID_SETTINGS" });
      const clean = rows.map(r => r.map(c => String(c == null ? "" : c)));
      // รูป QR อาจเป็นลิงก์ ImgBB หรือรูปแบบ base64 (data:image/...) ถ้าอัปโหลดไม่สำเร็จ ซึ่งยาวหลายหมื่นตัวอักษร
      // เซลล์ Google Sheets รับได้ไม่เกิน 50,000 ตัวอักษร จึงเผื่อไว้ที่ 45,000 เกินกว่านี้ต้องย่อรูปก่อน
      if (clean.some(r => r.some(c => c.length > 45000))) return sendResponse({ error: "VALUE_TOO_LONG: รูป QR ใหญ่เกินไป กรุณาใช้ไฟล์ที่เล็กลง" });
      let bSheet = ss.getSheetByName(SHEET_BANK);
      if (!bSheet) bSheet = ss.insertSheet(SHEET_BANK);
      bSheet.clearContents();
      const range = bSheet.getRange(1, 1, clean.length, 5);
      // เก็บเป็นข้อความล้วน: เลขพร้อมเพย์/บัญชีที่ขึ้นต้นด้วย 0 จะไม่หาย และค่าที่ขึ้นต้นด้วย = จะไม่กลายเป็นสูตร
      range.setNumberFormat("@");
      range.setValues(clean);
      SpreadsheetApp.flush();
      return sendResponse({ result: "success" });
    }

    // ===== PRODUCTS & ORDERS =====
    let sheet = ss.getSheetByName(SHEET_PRODUCTS);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_PRODUCTS);
      sheet.appendRow(["name", "size", "price", "note", "image", "tags", "status", "stock", "sold", "category"]);
    }

    if (action === "updateProduct" || action === "addProduct") {
      if (!Array.isArray(data.variants) || data.variants.length === 0) {
        return sendResponse({ error: "NO_VARIANTS" }); // กันลบสินค้าทิ้งทั้งชื่อโดยไม่มีแถวใหม่มาแทน
      }
      const rows = sheet.getDataRange().getValues();
      const targetName = String(data.oldName || data.name).trim();

      // หาแถวเดิมของสินค้านี้ แล้วลบ (จากล่างขึ้นบน)
      let firstRow = -1;
      for (let i = rows.length - 1; i >= 1; i--) {
        if (String(rows[i][0]).trim() === targetName) {
          sheet.deleteRow(i + 1);
          firstRow = i + 1;
        }
      }

      const newRows = data.variants.map(v => [
        data.name,
        v.size || "Standard",
        v.price || 0,
        data.note || "",
        data.image || "",
        data.tags || "",
        (parseInt(v.stock) > 0 ? "มีของ" : "หมด"),
        v.stock || 0,
        v.sold || 0,
        data.category || "อื่นๆ"
      ]);
      if (firstRow > 0) {
        // ใส่กลับที่ตำแหน่งเดิม ลำดับสินค้าบนหน้าร้านจึงไม่สลับทุกครั้งที่แก้
        sheet.insertRowsBefore(firstRow, newRows.length);
        sheet.getRange(firstRow, 1, newRows.length, newRows[0].length).setValues(newRows);
      } else {
        sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
      }
      SpreadsheetApp.flush();
      return sendResponse({ result: "success" });
    }

    // ===== แก้ราคา/สต๊อกหลายแถวในคำสั่งเดียว (หน้า "ราคา / สต๊อก") =====
    // แก้ในแถวเดิม ไม่ลบ-เขียนใหม่ · items: [{ name, size, price, stock }]
    if (action === "bulkUpdate") {
      const items = Array.isArray(data.items) ? data.items : [];
      if (!items.length) return sendResponse({ error: "NO_ITEMS" });
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) return sendResponse({ error: "NO_PRODUCTS" });
      const range = sheet.getRange(2, 1, lastRow - 1, 8); // A:H = name..stock
      const values = range.getValues();
      const key = (n, sz) => String(n).trim() + "|" + String(sz || "Standard").trim().toUpperCase();
      const index = {};
      values.forEach((r, i) => { index[key(r[0], r[1])] = i; });
      const notFound = [];
      let updated = 0;
      items.forEach(it => {
        const i = index[key(it.name, it.size)];
        const price = Number(it.price), stock = parseInt(it.stock);
        if (i === undefined || !(price > 0) || isNaN(stock) || stock < 0) { notFound.push(it.name + " " + (it.size || "")); return; }
        values[i][2] = price;
        values[i][7] = stock;
        values[i][6] = stock > 0 ? "มีของ" : "หมด";
        updated++;
      });
      // เขียนกลับเฉพาะคอลัมน์ C (ราคา) และ G:H (สถานะ, สต๊อก) ไม่แตะคอลัมน์อื่น
      sheet.getRange(2, 3, values.length, 1).setValues(values.map(r => [r[2]]));
      sheet.getRange(2, 7, values.length, 2).setValues(values.map(r => [r[6], r[7]]));
      SpreadsheetApp.flush();
      return sendResponse({ result: "success", updated: updated, notFound: notFound });
    }

    // ===== ลบสินค้าทั้งหมด (สำรองเป็นแท็บใหม่ก่อนเสมอ กู้คืนได้) =====
    if (action === "clearProducts") {
      const backupName = "Products_backup_" + Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyyMMdd_HHmmss");
      sheet.copyTo(ss).setName(backupName);
      const last = sheet.getLastRow();
      // ล้างเฉพาะข้อมูล ไม่ลบแถว: หัวคอลัมน์และ gid ของแท็บ Products (ที่หน้าร้านอ่าน CSV) อยู่ครบ
      if (last > 1) sheet.getRange(2, 1, last - 1, sheet.getLastColumn()).clearContent();
      SpreadsheetApp.flush();
      return sendResponse({ result: "success", backup: backupName });
    }

    if (action === "deleteProduct") {
      const target = String(data.name || "").trim();
      if (!target) return sendResponse({ error: "NO_NAME" });
      const rows = sheet.getDataRange().getValues();
      let deleted = 0;
      for (let i = rows.length - 1; i >= 1; i--) {
        if (String(rows[i][0]).trim() === target) { sheet.deleteRow(i + 1); deleted++; }
      }
      return sendResponse(deleted ? { result: "success", deleted: deleted } : { error: "NOT_FOUND" });
    }

    if (action === "log") {
      const pssLog = getPrivateSS();
      let oSheet = pssLog.getSheetByName(SHEET_ORDERS);
      if (!oSheet) oSheet = pssLog.insertSheet(SHEET_ORDERS);
      // ใส่หัวคอลัมน์อัตโนมัติถ้าแท็บ Orders ยังว่าง (กันออเดอร์แรกกลายเป็น header)
      if (oSheet.getLastRow() === 0) {
        oSheet.appendRow(["วันที่", "ชื่อ", "เบอร์โทร", "ที่อยู่", "mapUrl", "รายการ", "ยอดรวม", "สลิป", "ชำระเงิน", "สถานะ"]);
      }
      oSheet.appendRow([new Date(), data.name, data.phone, data.address, data.mapUrl, data.items, data.total, data.slipUrl, data.paymentMethod, "รอดำเนินการ"].map(cellSafe_));
      // แจ้งเตือนอีเมลเมื่อมีออเดอร์ใหม่ (ไม่ให้ error เรื่องอีเมลทำให้บันทึกออเดอร์ล้มเหลว)
      try {
        notifyNewOrder(data);          // แจ้งเตือนร้าน
      } catch (mailErr) {
        Logger.log("Email notify (shop) failed: " + mailErr.toString());
      }
      try {
        sendCustomerConfirmation(data); // ใบยืนยันส่งให้ลูกค้า (ถ้ามีอีเมล)
      } catch (custErr) {
        Logger.log("Email confirm (customer) failed: " + custErr.toString());
      }
      return sendResponse({ result: "success" });
    }

    // ===== GET ORDERS (เฉพาะหน้า admin — ไม่อยู่ใน PUBLIC_ACTIONS จึงต้องมี ADMIN_KEY) =====
    if (action === "getOrders") {
      const oSheet = getPrivateSS().getSheetByName(SHEET_ORDERS);
      // getDisplayValues = ค่าตามที่ตาเห็นในชีต (รูปแบบวันที่/ตัวเลขเหมือน CSV เดิมทุกประการ)
      return sendResponse(oSheet ? oSheet.getDataRange().getDisplayValues() : []);
    }

    // ===== UPDATE ORDER STATUS (รับยอด / จัดส่ง) =====
    if (action === "updateStatus") {
      const oSheet = getPrivateSS().getSheetByName(SHEET_ORDERS);
      if (!oSheet) return sendResponse({ error: "Orders sheet missing" });

      const rows = oSheet.getDataRange().getValues();
      const headers = rows[0];

      // หา index ของ column ที่ต้องการ (รองรับทั้ง header ภาษาไทยและอังกฤษ)
      const findCol = (targets) => {
        const idx = headers.findIndex(h =>
          targets.some(t => h.toString().toLowerCase().includes(t.toLowerCase()))
        );
        return idx;
      };

      const nameIdx  = findCol(["ชื่อลูกค้า", "ชื่อ", "name"]);
      const slipIdx  = findCol(["ลิงก์สลิป", "slipUrl", "slip"]);
      const statusIdx = findCol(["สถานะ", "status"]);

      // ถ้าไม่พบ column สถานะ ให้ใช้ column ที่ 10 (index 9) ตามที่ log ใส่ไว้
      const sCol = statusIdx !== -1 ? statusIdx : 9;
      const nCol = nameIdx  !== -1 ? nameIdx  : 1;
      const slCol = slipIdx !== -1 ? slipIdx  : 7;

      // หลายออเดอร์อาจมีชื่อ+สลิปเหมือนกัน (เช่น COD) ถ้าหน้า admin ส่งวันที่มา ใช้แยกให้ตรงแถว
      const display = data.date ? oSheet.getDataRange().getDisplayValues() : null;
      const dCol = Math.max(0, findCol(["วันที่", "date", "timestamp"]));
      const wantDate = (data.date || "").toString().trim();
      const sameOrder = (i) => (rows[i][nCol] || "").toString().trim() === (data.name || "").trim()
        && (rows[i][slCol] || "").toString().trim() === (data.slipUrl || "").trim();
      let target = -1;
      for (let i = 1; i < rows.length; i++) {
        if (!sameOrder(i)) continue;
        if (target === -1) target = i;                       // เดิม: แถวแรกที่ตรง
        if (display && display[i][dCol].toString().trim() === wantDate) { target = i; break; }
      }

      if (target === -1) return sendResponse({ error: "Order not found" });

      oSheet.getRange(target + 1, sCol + 1).setValue(data.status);
      if (data.tracking) {
        // ยังไม่มีคอลัมน์เลขพัสดุ → สร้างต่อท้ายหัวตาราง (เดิมเลขที่กรอกหายไปเฉยๆ)
        let trackIdx = findCol(["tracking", "เลขพัสดุ", "หมายเหตุ"]);
        if (trackIdx === -1) {
          trackIdx = headers.length;
          oSheet.getRange(1, trackIdx + 1).setValue("เลขพัสดุ");
        }
        oSheet.getRange(target + 1, trackIdx + 1).setValue(cellSafe_(String(data.tracking)));
      }
      SpreadsheetApp.flush();
      return sendResponse({ result: "success" });
    }

    return sendResponse({ error: "UNKNOWN_ACTION: " + action });
  } catch (err) {
    return sendResponse({ error: "GAS doPost Error: " + err.toString() });
  }
}

// ค่าที่มาจากหน้าร้านสาธารณะ (ชื่อ/ที่อยู่/อีเมล) ถ้าขึ้นต้นด้วย = + - @ ชีตจะตีเป็นสูตร
// ใส่ ' นำหน้าให้เป็นข้อความเสมอ (ชีตซ่อน ' ไว้ ค่าที่อ่านกลับยังเหมือนเดิม)
function cellSafe_(v) {
  return (typeof v === "string" && /^[=+\-@]/.test(v)) ? "'" + v : v;
}

// ข้อความที่ใส่ลงอีเมล HTML ต้อง escape ไม่งั้นใครก็ฝังลิงก์/HTML ส่งออกจากอีเมลร้านได้
function h_(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function sendResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * ▶️ ฟังก์ชันทดสอบ/ขออนุญาตส่งอีเมล
 * เลือกฟังก์ชันนี้ใน editor แล้วกด Run หนึ่งครั้ง
 * - ครั้งแรกจะมีหน้าต่างขออนุญาต (Authorization required) ให้กดอนุญาตจนจบ
 * - ถ้าสำเร็จจะมีอีเมลทดสอบส่งไปที่ NOTIFY_EMAIL ทันที
 */
function testEmail() {
  notifyNewOrder({
    name: "ทดสอบส่งเมล (Run จาก Editor)",
    phone: "0800000000",
    address: "ที่อยู่ทดสอบ",
    items: "สินค้าทดสอบ x1",
    itemsArray: [{ name: "สินค้าทดสอบ", size: "-", qty: 1 }],
    total: 999,
    slipUrl: "-",
    paymentMethod: "ทดสอบ"
  });
  Logger.log("ส่งอีเมลทดสอบไปที่ " + NOTIFY_EMAIL + " เรียบร้อย");
}

/** ▶️ ทดสอบใบยืนยันออเดอร์ฝั่งลูกค้า (ส่งเข้า NOTIFY_EMAIL เพื่อดูหน้าตา) */
function testCustomerEmail() {
  sendCustomerConfirmation({
    name: "คุณลูกค้าทดสอบ",
    phone: "0899999999",
    email: NOTIFY_EMAIL,
    address: "123 ที่อยู่ทดสอบ",
    itemsArray: [{ name: "สินค้าทดสอบ A", size: "3.5g", qty: 2 }],
    total: 1590,
    paymentMethod: "โอนเงิน"
  });
  Logger.log("ส่งใบยืนยันทดสอบไปที่ " + NOTIFY_EMAIL + " เรียบร้อย");
}

/**
 * ▶️ ลบแถวออเดอร์ทดสอบในชีต Orders (กดรันครั้งเดียวใน editor)
 * ลบเฉพาะแถวที่ชื่อลูกค้ามีคำว่า "ทดสอบ", "Test Order" หรือ "E2E"
 * จะ log ทุกแถวที่ลบไว้ให้ตรวจสอบ
 */
function deleteTestOrders() {
  const oSheet = getPrivateSS().getSheetByName(SHEET_ORDERS);
  if (!oSheet) { Logger.log("ไม่พบชีต Orders"); return; }

  const rows = oSheet.getDataRange().getValues();
  // คอลัมน์ชื่อลูกค้าอยู่ index 1 (B) ตามที่ action "log" บันทึก
  var deleted = 0;
  // ลบจากล่างขึ้นบนเพื่อไม่ให้ index เลื่อน
  for (var i = rows.length - 1; i >= 1; i--) {
    var name = (rows[i][1] || "").toString();
    if (/ทดสอบ|Test Order|E2E/i.test(name)) {
      Logger.log("ลบแถว " + (i + 1) + ": " + name);
      oSheet.deleteRow(i + 1);
      deleted++;
    }
  }
  SpreadsheetApp.flush();
  Logger.log("ลบออเดอร์ทดสอบทั้งหมด " + deleted + " แถว");
}

/** ส่งอีเมลแจ้งเตือนเมื่อมีออเดอร์ใหม่ */
function notifyNewOrder(data) {
  if (!NOTIFY_EMAIL) return;

  const total = (typeof data.total === "number")
    ? data.total.toLocaleString()
    : data.total;

  // รองรับทั้งรายการแบบ string และ itemsArray
  let itemsHtml = "";
  if (Array.isArray(data.itemsArray) && data.itemsArray.length) {
    itemsHtml = data.itemsArray
      .map(i => "<li>" + h_(i.name) + " [" + h_(i.size || "-") + "] x" + h_(i.qty) + "</li>")
      .join("");
    itemsHtml = "<ul>" + itemsHtml + "</ul>";
  } else {
    itemsHtml = "<p>" + h_(data.items || "-") + "</p>";
  }

  const slipHtml = (data.slipUrl && /^https?:\/\//.test(data.slipUrl))
    ? '<a href="' + h_(data.slipUrl) + '">ดูสลิป/หลักฐาน</a>'
    : h_(data.slipUrl || "-");

  const subject = "🛒 ออเดอร์ใหม่ " + SHOP_NAME + " - " + h_(data.name || "ลูกค้า") + " (" + total + " บาท)";

  const htmlBody =
    '<div style="font-family:Arial,sans-serif;font-size:14px;color:#222;">' +
      '<h2 style="margin:0 0 12px;">✨ มีออเดอร์ใหม่เข้ามา!</h2>' +
      '<table cellpadding="6" style="border-collapse:collapse;">' +
        '<tr><td><b>👤 ผู้รับ</b></td><td>' + h_(data.name || "-") + '</td></tr>' +
        '<tr><td><b>📞 เบอร์</b></td><td>' + h_(data.phone || "-") + '</td></tr>' +
        '<tr><td><b>🏠 ที่อยู่</b></td><td>' + h_(data.address || "-") + '</td></tr>' +
        '<tr><td><b>💳 วิธีชำระ</b></td><td>' + h_(data.paymentMethod || "-") + '</td></tr>' +
        '<tr><td><b>🌐 ภาษาลูกค้า</b></td><td>' + MAIL_I18N[mailLang_(data.lang)].label + '</td></tr>' +
        '<tr><td><b>💰 ยอดรวม</b></td><td>' + h_(total) + ' บาท</td></tr>' +
        '<tr><td><b>🖼️ หลักฐาน</b></td><td>' + slipHtml + '</td></tr>' +
      '</table>' +
      '<h3 style="margin:16px 0 4px;">🛒 รายการสินค้า</h3>' +
      itemsHtml +
      '<p style="color:#888;font-size:12px;margin-top:16px;">บันทึกเมื่อ ' + new Date().toLocaleString("th-TH") + '</p>' +
    '</div>';

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: subject,
    htmlBody: htmlBody
  });
}

/** สร้าง HTML รายการสินค้า (ใช้ร่วมกัน) */
function buildItemsHtml(data) {
  if (Array.isArray(data.itemsArray) && data.itemsArray.length) {
    return "<ul>" + data.itemsArray
      .map(i => "<li>" + h_(i.name) + " [" + h_(i.size || "-") + "] x" + h_(i.qty) + "</li>")
      .join("") + "</ul>";
  }
  return "<p>" + h_(data.items || "-") + "</p>";
}

// ===== อีเมลยืนยันถึงลูกค้า: ภาษาเดียวกับที่ลูกค้าใช้ตอนสั่ง (หน้าเว็บส่ง data.lang มา) =====
const MAIL_I18N = {
  th: {
    shop: "Siam Cannabis อ่อนนุช", locale: "th-TH", currency: "บาท",
    subject: "✅ ขอบคุณที่สั่งซื้อกับ {shop} — ยอดรวม {total} บาท",
    heading: "ขอบคุณสำหรับการสั่งซื้อ 🙏",
    greeting: "สวัสดีคุณ {name}",
    received: "เราได้รับออเดอร์ของคุณเรียบร้อยแล้ว และกำลังตรวจสอบให้อยู่ค่ะ",
    name: "ชื่อผู้รับ", phone: "เบอร์โทร", address: "ที่อยู่จัดส่ง", payment: "วิธีชำระ", total: "ยอดรวม",
    items: "รายการสินค้า",
    next: "ทางร้านจะติดต่อกลับเพื่อยืนยันการจัดส่งอีกครั้ง หากมีข้อสงสัยตอบกลับอีเมลนี้ได้เลย",
    thanks: "ขอบคุณที่ไว้วางใจ {shop} 💚 หวังว่าจะได้ดูแลคุณอีกนะคะ",
    transfer: "โอนเงิน", cod: "เก็บเงินปลายทาง", label: "ไทย"
  },
  en: {
    shop: "Siam Cannabis On Nut", locale: "en-US", currency: "THB",
    subject: "✅ Thank you for your order at {shop} — total {total} THB",
    heading: "Thank you for your order 🙏",
    greeting: "Hi {name},",
    received: "We've received your order and are reviewing it now.",
    name: "Recipient", phone: "Phone", address: "Delivery address", payment: "Payment", total: "Total",
    items: "Your items",
    next: "We'll contact you shortly to confirm delivery. If you have any questions, just reply to this email.",
    thanks: "Thank you for choosing {shop} 💚 We look forward to serving you again!",
    transfer: "Bank transfer", cod: "Cash on delivery", label: "English"
  },
  zh: {
    shop: "Siam Cannabis 安努店", locale: "zh-CN", currency: "泰铢",
    subject: "✅ 感谢您在 {shop} 下单 — 合计 {total} 泰铢",
    heading: "感谢您的订购 🙏",
    greeting: "{name}，您好！",
    received: "我们已收到您的订单，正在为您确认。",
    name: "收件人", phone: "电话", address: "收货地址", payment: "付款方式", total: "合计",
    items: "商品清单",
    next: "我们会尽快联系您确认配送。如有任何疑问，直接回复此邮件即可。",
    thanks: "感谢您选择 {shop} 💚 期待再次为您服务！",
    transfer: "银行转账", cod: "货到付款", label: "中文"
  },
  ko: {
    shop: "Siam Cannabis 온눗점", locale: "ko-KR", currency: "바트",
    subject: "✅ {shop}에서 주문해 주셔서 감사합니다 — 합계 {total} 바트",
    heading: "주문해 주셔서 감사합니다 🙏",
    greeting: "{name}님, 안녕하세요!",
    received: "주문이 정상적으로 접수되었으며 지금 확인하고 있습니다.",
    name: "받는 분", phone: "전화번호", address: "배송 주소", payment: "결제 방법", total: "합계",
    items: "주문 상품",
    next: "배송 확인을 위해 곧 연락드리겠습니다. 궁금한 점은 이 메일에 회신해 주세요.",
    thanks: "{shop}을 이용해 주셔서 감사합니다 💚 다시 만나기를 기대합니다!",
    transfer: "계좌 이체", cod: "착불 결제", label: "한국어"
  }
};

function mailLang_(lang) {
  return MAIL_I18N[String(lang || "").toLowerCase()] ? String(lang).toLowerCase() : "th";
}

function fill_(tpl, vars) {
  return String(tpl).replace(/\{(\w+)\}/g, function (_, k) { return vars[k] == null ? "" : vars[k]; });
}

// หน้าเว็บส่งวิธีชำระเป็นภาษาไทยเสมอ → แปลงเป็นภาษาของอีเมล
function paymentLabel_(method, L) {
  const m = String(method || "");
  if (m.indexOf("ปลายทาง") !== -1 || /cod/i.test(m)) return L.cod;
  if (m.indexOf("โอน") !== -1 || /transfer/i.test(m)) return L.transfer;
  return m || "-";
}

/** ส่งอีเมลใบยืนยันออเดอร์ให้ลูกค้า (เฉพาะเมื่อลูกค้ากรอกอีเมล) เป็นภาษาที่ลูกค้าใช้ */
function sendCustomerConfirmation(data) {
  var email = (data.email || "").trim();
  // ส่งเฉพาะเมื่อมีอีเมลที่อยู่ในรูปแบบถูกต้อง
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return;

  const lang = mailLang_(data.lang);
  const L = MAIL_I18N[lang];
  const totalNum = Number(data.total);
  const total = isNaN(totalNum) ? String(data.total || "-") : totalNum.toLocaleString(L.locale);
  const row = (label, value, bold) =>
    '<tr><td style="color:#555;padding:6px 12px 6px 0;">' + label + '</td><td style="padding:6px 0;">' +
    (bold ? '<b>' + value + '</b>' : value) + '</td></tr>';

  const htmlBody =
    '<div lang="' + lang + '" style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;font-size:14px;color:#222;max-width:560px;">' +
      '<h2 style="margin:0 0 6px;">' + L.heading + '</h2>' +
      '<p style="margin:0 0 4px;">' + fill_(L.greeting, { name: h_(data.name || "-") }) + '</p>' +
      '<p style="margin:0 0 16px;color:#555;">' + L.received + '</p>' +
      '<table cellpadding="0" style="border-collapse:collapse;">' +
        row("👤 " + L.name, h_(data.name || "-")) +
        row("📞 " + L.phone, h_(data.phone || "-")) +
        row("🏠 " + L.address, h_(data.address || "-")) +
        row("💳 " + L.payment, h_(paymentLabel_(data.paymentMethod, L))) +
        row("💰 " + L.total, h_(total) + " " + L.currency, true) +
      '</table>' +
      '<h3 style="margin:18px 0 4px;">🛒 ' + L.items + '</h3>' +
      buildItemsHtml(data) +
      '<p style="margin-top:16px;color:#555;">' + L.next + '</p>' +
      '<p style="margin-top:12px;font-weight:600;color:#1a7f43;">' + fill_(L.thanks, { shop: L.shop }) + '</p>' +
      '<p style="color:#888;font-size:12px;margin-top:16px;">' + L.shop + ' • ' + new Date().toLocaleString(L.locale) + '</p>' +
    '</div>';

  MailApp.sendEmail({
    to: email,
    subject: fill_(L.subject, { shop: L.shop, total: total }),
    htmlBody: htmlBody,
    name: L.shop
  });
}

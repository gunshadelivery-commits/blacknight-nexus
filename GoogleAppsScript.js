/**
 * BLACKNIGHT-NEXUS CENTRAL BACKEND V.23 (AUTH SUPPORT)
 * 🚀 ปรับปรุง: เพิ่มระบบ Register/Login ผ่าน Sheet "Users"
 */

const GAS_VERSION = "V27-BANK";
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
const SHOP_NAME = "Cannabis Flower อ่อนนุช";

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
      uSheet.appendRow([new Date(), data.name, emailLower, hashed, "active"]);
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
      // ลิงก์ QR ต้องเป็น URL (เช่น ImgBB) ถ้าอัปโหลดไม่สำเร็จจะได้ base64 ยาวมาก → ปฏิเสธดีกว่าตัดทิ้งจนรูปเสีย
      if (clean.some(r => r.some(c => c.length > 2000))) return sendResponse({ error: "VALUE_TOO_LONG (อัปโหลดรูป QR ไม่สำเร็จ?)" });
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
      const rows = sheet.getDataRange().getValues();
      const targetName = data.oldName || data.name;
      
      // ลบรายการเดิมออก
      for (let i = rows.length - 1; i >= 1; i--) {
        if (rows[i][0] == targetName) {
          sheet.deleteRow(i + 1);
        }
      }
      
      // เพิ่มใหม่
      if (data.variants && data.variants.length > 0) {
        data.variants.forEach(v => {
          sheet.appendRow([
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
        });
      }
      SpreadsheetApp.flush();
      return sendResponse({ result: "success" });
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
      const rows = sheet.getDataRange().getValues();
      for (let i = rows.length - 1; i >= 1; i--) {
        if (rows[i][0] == data.name) sheet.deleteRow(i + 1);
      }
      return sendResponse({ result: "success" });
    }

    if (action === "log") {
      const pssLog = getPrivateSS();
      let oSheet = pssLog.getSheetByName(SHEET_ORDERS);
      if (!oSheet) oSheet = pssLog.insertSheet(SHEET_ORDERS);
      // ใส่หัวคอลัมน์อัตโนมัติถ้าแท็บ Orders ยังว่าง (กันออเดอร์แรกกลายเป็น header)
      if (oSheet.getLastRow() === 0) {
        oSheet.appendRow(["วันที่", "ชื่อ", "เบอร์โทร", "ที่อยู่", "mapUrl", "รายการ", "ยอดรวม", "สลิป", "ชำระเงิน", "สถานะ"]);
      }
      oSheet.appendRow([new Date(), data.name, data.phone, data.address, data.mapUrl, data.items, data.total, data.slipUrl, data.paymentMethod, "รอดำเนินการ"]);
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

      let found = false;
      for (let i = 1; i < rows.length; i++) {
        const rowName = (rows[i][nCol] || "").toString().trim();
        const rowSlip = (rows[i][slCol] || "").toString().trim();
        if (rowName === (data.name || "").trim() && rowSlip === (data.slipUrl || "").trim()) {
          oSheet.getRange(i + 1, sCol + 1).setValue(data.status);
          // บันทึกเลขพัสดุถ้ามี
          if (data.tracking) {
            const trackIdx = findCol(["tracking", "เลขพัสดุ", "หมายเหตุ"]);
            if (trackIdx !== -1) oSheet.getRange(i + 1, trackIdx + 1).setValue(data.tracking);
          }
          found = true;
          break;
        }
      }

      SpreadsheetApp.flush();
      return sendResponse(found ? { result: "success" } : { error: "Order not found" });
    }

    return sendResponse({ error: "UNKNOWN_ACTION: " + action });
  } catch (err) {
    return sendResponse({ error: "GAS doPost Error: " + err.toString() });
  }
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
      .map(i => "<li>" + i.name + " [" + (i.size || "-") + "] x" + i.qty + "</li>")
      .join("");
    itemsHtml = "<ul>" + itemsHtml + "</ul>";
  } else {
    itemsHtml = "<p>" + (data.items || "-") + "</p>";
  }

  const slipHtml = (data.slipUrl && /^https?:\/\//.test(data.slipUrl))
    ? '<a href="' + data.slipUrl + '">ดูสลิป/หลักฐาน</a>'
    : (data.slipUrl || "-");

  const subject = "🛒 ออเดอร์ใหม่ " + SHOP_NAME + " - " + (data.name || "ลูกค้า") + " (" + total + " บาท)";

  const htmlBody =
    '<div style="font-family:Arial,sans-serif;font-size:14px;color:#222;">' +
      '<h2 style="margin:0 0 12px;">✨ มีออเดอร์ใหม่เข้ามา!</h2>' +
      '<table cellpadding="6" style="border-collapse:collapse;">' +
        '<tr><td><b>👤 ผู้รับ</b></td><td>' + (data.name || "-") + '</td></tr>' +
        '<tr><td><b>📞 เบอร์</b></td><td>' + (data.phone || "-") + '</td></tr>' +
        '<tr><td><b>🏠 ที่อยู่</b></td><td>' + (data.address || "-") + '</td></tr>' +
        '<tr><td><b>💳 วิธีชำระ</b></td><td>' + (data.paymentMethod || "-") + '</td></tr>' +
        '<tr><td><b>💰 ยอดรวม</b></td><td>' + total + ' บาท</td></tr>' +
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
      .map(i => "<li>" + i.name + " [" + (i.size || "-") + "] x" + i.qty + "</li>")
      .join("") + "</ul>";
  }
  return "<p>" + (data.items || "-") + "</p>";
}

/** ส่งอีเมลใบยืนยันออเดอร์ให้ลูกค้า (เฉพาะเมื่อลูกค้ากรอกอีเมล) */
function sendCustomerConfirmation(data) {
  var email = (data.email || "").trim();
  // ส่งเฉพาะเมื่อมีอีเมลที่อยู่ในรูปแบบถูกต้อง
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return;

  const total = (typeof data.total === "number")
    ? data.total.toLocaleString()
    : data.total;

  const itemsHtml = buildItemsHtml(data);
  const subject = "✅ ยืนยันการสั่งซื้อจาก " + SHOP_NAME + " (ยอดรวม " + total + " บาท)";

  const htmlBody =
    '<div style="font-family:Arial,sans-serif;font-size:14px;color:#222;max-width:560px;">' +
      '<h2 style="margin:0 0 4px;">ขอบคุณสำหรับการสั่งซื้อ 🙏</h2>' +
      '<p style="margin:0 0 16px;color:#555;">สวัสดีคุณ ' + (data.name || "ลูกค้า") +
        ' เราได้รับออเดอร์ของคุณเรียบร้อยแล้ว และกำลังดำเนินการตรวจสอบ</p>' +
      '<table cellpadding="6" style="border-collapse:collapse;">' +
        '<tr><td><b>👤 ชื่อผู้รับ</b></td><td>' + (data.name || "-") + '</td></tr>' +
        '<tr><td><b>📞 เบอร์</b></td><td>' + (data.phone || "-") + '</td></tr>' +
        '<tr><td><b>🏠 ที่อยู่จัดส่ง</b></td><td>' + (data.address || "-") + '</td></tr>' +
        '<tr><td><b>💳 วิธีชำระ</b></td><td>' + (data.paymentMethod || "-") + '</td></tr>' +
        '<tr><td><b>💰 ยอดรวม</b></td><td><b>' + total + ' บาท</b></td></tr>' +
      '</table>' +
      '<h3 style="margin:16px 0 4px;">🛒 รายการสินค้า</h3>' +
      itemsHtml +
      '<p style="margin-top:16px;color:#555;">ทางร้านจะติดต่อกลับเพื่อยืนยันการจัดส่งอีกครั้ง ' +
        'หากมีข้อสงสัยสามารถตอบกลับอีเมลนี้ได้เลย</p>' +
      '<p style="color:#888;font-size:12px;margin-top:16px;">' + SHOP_NAME +
        ' • ' + new Date().toLocaleString("th-TH") + '</p>' +
    '</div>';

  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: htmlBody,
    name: SHOP_NAME
  });
}

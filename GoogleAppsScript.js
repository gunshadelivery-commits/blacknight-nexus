/**
 * BLACKNIGHT-NEXUS CENTRAL BACKEND V.23 (AUTH SUPPORT)
 * 🚀 ปรับปรุง: เพิ่มระบบ Register/Login ผ่าน Sheet "Users"
 */

const GAS_VERSION = "V24-MAIL";
const SPREADSHEET_ID = "11p5OmXlmYoSvrjatX1JTRKlM6QcRnJdBIxm1EwqM0Sw";
const SHEET_PRODUCTS = "Blacknight69 - Product List";
const SHEET_ORDERS = "Orders";
const SHEET_BANK = "BankAccounts";
const SHEET_USERS = "Users";

// --- อีเมลแจ้งเตือนออเดอร์ใหม่ (ใส่หลายอีเมลได้ คั่นด้วย ,) ---
const NOTIFY_EMAIL = "ped.siraphob@gmail.com";
const SHOP_NAME = "BlackNight69";

function getSS() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    if (ss) return ss;
  } catch (e) {}
  return SpreadsheetApp.getActiveSpreadsheet();
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

function doGet(e) {
  try {
    const action = e.parameter.action;
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
  } catch (err) {
    return sendResponse({ error: "GAS doGet Error: " + err.toString() });
  }
}

function doPost(e) {
  try {
    const ss = getSS();
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    // ===== REGISTER =====
    if (action === "register") {
      var uSheet = ss.getSheetByName(SHEET_USERS);
      if (!uSheet) {
        uSheet = ss.insertSheet(SHEET_USERS);
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
      var uSheet2 = ss.getSheetByName(SHEET_USERS);
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

    if (action === "deleteProduct") {
      const rows = sheet.getDataRange().getValues();
      for (let i = rows.length - 1; i >= 1; i--) {
        if (rows[i][0] == data.name) sheet.deleteRow(i + 1);
      }
      return sendResponse({ result: "success" });
    }

    if (action === "log") {
      const oSheet = ss.getSheetByName(SHEET_ORDERS);
      if (oSheet) {
        oSheet.appendRow([new Date(), data.name, data.phone, data.address, data.mapUrl, data.items, data.total, data.slipUrl, data.paymentMethod, "รอดำเนินการ"]);
      }
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

    // ===== UPDATE ORDER STATUS (รับยอด / จัดส่ง) =====
    if (action === "updateStatus") {
      const oSheet = ss.getSheetByName(SHEET_ORDERS);
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

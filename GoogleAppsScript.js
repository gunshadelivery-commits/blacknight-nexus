/**
 * BLACKNIGHT-NEXUS CENTRAL BACKEND V.23 (AUTH SUPPORT)
 * 🚀 ปรับปรุง: เพิ่มระบบ Register/Login ผ่าน Sheet "Users"
 */

const GAS_VERSION = "V23-AUTH";
const SPREADSHEET_ID = "11p5OmXlmYoSvrjatX1JTRKlM6QcRnJdBIxm1EwqM0Sw";
const SHEET_PRODUCTS = "Blacknight69 - Product List";
const SHEET_ORDERS = "Orders";
const SHEET_BANK = "BankAccounts";
const SHEET_USERS = "Users";

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
      return sendResponse({ result: "success" });
    }

  } catch (err) {
    return sendResponse({ error: "GAS doPost Error: " + err.toString() });
  }
}

function sendResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

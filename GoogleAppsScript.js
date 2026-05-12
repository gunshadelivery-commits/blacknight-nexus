/**
 * BLACKNIGHT-NEXUS CENTRAL BACKEND V.22 (ULTRA-ROBUST)
 * 🚀 ปรับปรุง: ระบบจัดการหัวตารางอัตโนมัติ และระบบดึงข้อมูลแบบ Array (กันพลาด)
 */

const GAS_VERSION = "V22-ULTRA-ROBUST";
const SPREADSHEET_ID = "11p5OmXlmYoSvrjatX1JTRKlM6QcRnJdBIxm1EwqM0Sw";
const SHEET_PRODUCTS = "Blacknight69 - Product List";
const SHEET_ORDERS = "Orders";
const SHEET_BANK = "BankAccounts";

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
  const expectedHeaders = ["name", "size", "price", "note", "image", "tags", "status", "stock", "sold", "category"];
  if (!pSheet) {
    pSheet = ss.insertSheet(SHEET_PRODUCTS);
    pSheet.appendRow(expectedHeaders);
  } else {
    const headerRange = pSheet.getRange(1, 1, 1, pSheet.getLastColumn());
    const headers = headerRange.getValues()[0];
    let needsUpdate = false;
    for (let i = 0; i < expectedHeaders.length; i++) {
      if (headers[i] !== expectedHeaders[i]) {
        headers[i] = expectedHeaders[i];
        needsUpdate = true;
      }
    }
    if (needsUpdate) {
      pSheet.getRange(1, 1, 1, expectedHeaders.length).setValues([headers]);
    }
  }
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
    let sheet = ss.getSheetByName(SHEET_PRODUCTS);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_PRODUCTS);
      sheet.appendRow(["name", "size", "price", "note", "image", "tags", "status", "stock", "sold", "category"]);
    }

    if (action === "updateProduct" || action === "addProduct") {
      const expectedHeaders = ["name", "size", "price", "note", "image", "tags", "status", "stock", "sold", "category"];
      const currentHeaderRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
      const currentHeaders = currentHeaderRange.getValues()[0];
      let needsHeaderUpdate = false;
      for (let i = 0; i < expectedHeaders.length; i++) {
        if (currentHeaders[i] !== expectedHeaders[i]) {
          currentHeaders[i] = expectedHeaders[i];
          needsHeaderUpdate = true;
        }
      }
      if (needsHeaderUpdate) {
        sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([currentHeaders]);
      }

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

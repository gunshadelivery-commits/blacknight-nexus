/**
 * BLACKNIGHT-NEXUS CENTRAL BACKEND V.21 (PRO)
 * 🚀 ปรับปรุง: ระบบ updateProduct แบบ Single-Action เพื่อความแม่นยำสูง
 */

const GAS_VERSION = "V21-PRO-SYNC";
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

function doGet(e) {
  try {
    const action = e.parameter.action;
    if (action === "checkVersion") return sendResponse({ version: GAS_VERSION });

    const ss = getSS();
    if (action === "getProducts") {
      const sheet = ss.getSheetByName(SHEET_PRODUCTS);
      if (!sheet) return sendResponse({ error: "Sheet not found" });
      const values = sheet.getDataRange().getValues();
      // แปลงเป็น JSON Array เพื่อให้หน้าร้านใช้งานง่าย
      const headers = values[0];
      const data = values.slice(1).map(row => {
        let obj = {};
        headers.forEach((h, i) => { obj[h] = row[i]; });
        return obj;
      });
      return sendResponse(data);
    }

    if (action === "getBank") {
      let sheet = ss.getSheetByName(SHEET_BANK);
      return sendResponse(sheet ? sheet.getDataRange().getValues() : []);
    }
    
    if (action === "getOrders") {
      let sheet = ss.getSheetByName(SHEET_ORDERS);
      return sendResponse(sheet ? sheet.getDataRange().getValues() : []);
    }
  } catch (err) {
    return sendResponse({ error: err.toString() });
  }
}

function doPost(e) {
  try {
    const ss = getSS();
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const sheet = ss.getSheetByName(SHEET_PRODUCTS);

    // ✅ ฟังชันใหม่: อัปเดตสินค้าทีเดียวจบ (ลบของเก่าทิ้งแล้วแอดใหม่)
    if (action === "updateProduct" || action === "addProduct") {
      const rows = sheet.getDataRange().getValues();
      const targetName = data.oldName || data.name;
      
      // 1. ลบของเดิมทิ้ง (ถ้ามี)
      for (let i = rows.length - 1; i >= 1; i--) {
        if (rows[i][0] == targetName) {
          sheet.deleteRow(i + 1);
        }
      }
      
      // 2. เพิ่มใหม่ทั้งหมด (รวม Variants)
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

    if (action === "saveBank") {
      let bSheet = ss.getSheetByName(SHEET_BANK) || ss.insertSheet(SHEET_BANK);
      bSheet.clear();
      if (data.settings) bSheet.getRange(1, 1, data.settings.length, data.settings[0].length).setValues(data.settings);
      return sendResponse({ result: "success" });
    }

    if (action === "log") {
      const oSheet = ss.getSheetByName(SHEET_ORDERS);
      oSheet.appendRow([new Date(), data.name, data.phone, data.address, data.mapUrl, data.items, data.total, data.slipUrl, data.paymentMethod, "รอดำเนินการ"]);
      return sendResponse({ result: "success" });
    }

  } catch (err) {
    return sendResponse({ error: err.toString() });
  }
}

function sendResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * BLACKNIGHT-NEXUS CENTRAL BACKEND V.19
 * 🕵️‍♂️ VERSION CHECKER: ถ้าตัวนี้ยังขึ้น Error เดิม แสดงว่าเรียกผิดไฟล์แน่นอน!
 */

const GAS_VERSION = "V19-I-AM-HERE";
const SPREADSHEET_ID = "11p5OmXlmYoSvrjatX1JTRKlM6QcRnJdBIxm1EwqM0Sw";
const SHEET_PRODUCTS = "Blacknight69 - Product List";
const SHEET_ORDERS = "Orders";
const SHEET_BANK = "BankAccounts";

function getSS() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    if (ss) return ss;
    throw new Error("openById returned null");
  } catch (e) {
    var ss2 = SpreadsheetApp.getActiveSpreadsheet();
    if (ss2) return ss2;
    throw new Error("หาไฟล์ Google Sheets ไม่เจอ: " + e.toString());
  }
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    
    // 🔥 จุดเช็คเวอร์ชัน
    if (action === "checkVersion") return sendResponse({ version: GAS_VERSION });

    const ss = getSS();
    if (action === "getBank") {
      let sheet = ss.getSheetByName(SHEET_BANK);
      if (!sheet) {
        sheet = ss.insertSheet(SHEET_BANK);
        sheet.appendRow(["Name", "Bank", "Number", "QR", "Status"]);
      }
      return sendResponse(sheet.getDataRange().getValues());
    }
    
    // ... ส่วนอื่นๆ เหมือนเดิม ...
    if (action === "getProducts") return sendResponse(ss.getSheetByName(SHEET_PRODUCTS).getDataRange().getValues());
    if (action === "getOrders") return sendResponse(ss.getSheetByName(SHEET_ORDERS).getDataRange().getValues());

    return sendResponse({ error: "Invalid action: " + action });
  } catch (err) {
    return sendResponse({ error: "V19 doGet Error: " + err.toString() });
  }
}

function doPost(e) {
  try {
    const ss = getSS();
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === "saveBank") {
      let sheet = ss.getSheetByName(SHEET_BANK) || ss.insertSheet(SHEET_BANK);
      sheet.clear();
      if (data.settings && data.settings.length > 0) {
        sheet.getRange(1, 1, data.settings.length, data.settings[0].length).setValues(data.settings);
      } else {
        sheet.appendRow(["Name", "Bank", "Number", "QR", "Status"]);
      }
      SpreadsheetApp.flush();
      return sendResponse({ result: "success", version: GAS_VERSION });
    }

    if (action === "log") {
      const sheet = ss.getSheetByName(SHEET_ORDERS);
      sheet.appendRow([new Date(), data.name, data.phone, data.address, data.mapUrl, data.items, data.total, data.slipUrl, data.paymentMethod, "รอดำเนินการ"]);
      SpreadsheetApp.flush();
      return sendResponse({ result: "success", version: GAS_VERSION });
    }

    return sendResponse({ result: "success", version: GAS_VERSION });

  } catch (err) {
    return sendResponse({ error: "V19 doPost Error: " + err.toString() });
  }
}

function sendResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

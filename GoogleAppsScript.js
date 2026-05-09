/**
 * BLACKNIGHT-NEXUS CENTRAL BACKEND V.16
 * 🚀 แท็บจัดการบัญชี: BankAccounts
 */

const SPREADSHEET_ID = "11p5OmXlmYoSvrjatX1JTRKlM6QcRnJdBIxm1EwqM0Sw";
const SHEET_PRODUCTS = "Blacknight69 - Product List";
const SHEET_ORDERS = "Orders";
const SHEET_BANK = "BankAccounts"; // แท็บใหม่ตามที่คุณต้องการ

function getSS() {
  // ลองเปิดด้วย ID ก่อน ถ้าไม่ได้ให้ลอง GetActive
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    if (ss) return ss;
  } catch (e) {}
  return SpreadsheetApp.getActiveSpreadsheet();
}

function doGet(e) {
  const action = e.parameter.action;
  const ss = getSS();
  if (!ss) return sendResponse({ error: "Cannot access Spreadsheet. ss is null." });

  try {
    if (action === "getSettings" || action === "getBank") {
      let sheet = ss.getSheetByName(SHEET_BANK);
      if (!sheet) {
        sheet = ss.insertSheet(SHEET_BANK);
        sheet.appendRow(["Name", "Bank", "Number", "QR", "Status"]);
      }
      return sendResponse(sheet.getDataRange().getValues());
    }
    // ... ส่วนของ Products และ Orders ยังคงเดิม ...
    if (action === "getProducts") return sendResponse(ss.getSheetByName(SHEET_PRODUCTS).getDataRange().getValues());
    if (action === "getOrders") return sendResponse(ss.getSheetByName(SHEET_ORDERS).getDataRange().getValues());
  } catch (err) {
    return sendResponse({ error: err.toString() });
  }
}

function doPost(e) {
  const ss = getSS();
  if (!ss) return sendResponse({ error: "Cannot access Spreadsheet in POST." });
  
  const data = JSON.parse(e.postData.contents);
  const action = data.action;

  try {
    if (action === "saveSettings" || action === "saveBank") {
      let sheet = ss.getSheetByName(SHEET_BANK) || ss.insertSheet(SHEET_BANK);
      sheet.clear();
      if (data.settings && data.settings.length > 0) {
        sheet.getRange(1, 1, data.settings.length, data.settings[0].length).setValues(data.settings);
      } else {
        sheet.appendRow(["Name", "Bank", "Number", "QR", "Status"]);
      }
      return sendResponse({ result: "success" });
    }

    if (action === "log") {
      ss.getSheetByName(SHEET_ORDERS).appendRow([
        new Date(), data.name, data.phone, data.address, data.mapUrl, data.items, data.total, data.slipUrl, data.paymentMethod, "รอดำเนินการ"
      ]);
      return sendResponse({ result: "success" });
    }
    // ... ส่วนอื่นๆ ...
  } catch (err) {
    return sendResponse({ error: err.toString() });
  }
}

function sendResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

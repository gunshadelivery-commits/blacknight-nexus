/**
 * BLACKNIGHT-NEXUS CENTRAL BACKEND V.17
 * 🕵️‍♂️ VERSION: DEBUG & ROBUST
 */

const SPREADSHEET_ID = "11p5OmXlmYoSvrjatX1JTRKlM6QcRnJdBIxm1EwqM0Sw";
const SHEET_PRODUCTS = "Blacknight69 - Product List";
const SHEET_ORDERS = "Orders";
const SHEET_BANK = "BankAccounts";

function getSS() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    if (ss) return { ss: ss };
    return { error: "SpreadsheetApp.openById returned null for ID: " + SPREADSHEET_ID };
  } catch (e) {
    try {
      var ss2 = SpreadsheetApp.getActiveSpreadsheet();
      if (ss2) return { ss: ss2 };
      return { error: "openById failed: " + e.toString() + " | getActiveSpreadsheet also null." };
    } catch (e2) {
      return { error: "Both methods failed. e1: " + e.toString() + " | e2: " + e2.toString() };
    }
  }
}

function doGet(e) {
  const ssResult = getSS();
  if (ssResult.error) return sendResponse({ error: ssResult.error });
  const ss = ssResult.ss;
  
  const action = e.parameter.action;
  try {
    if (action === "getBank") {
      let sheet = ss.getSheetByName(SHEET_BANK);
      if (!sheet) {
        sheet = ss.insertSheet(SHEET_BANK);
        sheet.appendRow(["Name", "Bank", "Number", "QR", "Status"]);
      }
      return sendResponse(sheet.getDataRange().getValues());
    }
    // ... อื่นๆ ...
    if (action === "getProducts") return sendResponse(ss.getSheetByName(SHEET_PRODUCTS).getDataRange().getValues());
  } catch (err) {
    return sendResponse({ error: "doGet Error: " + err.toString() });
  }
}

function doPost(e) {
  const ssResult = getSS();
  if (ssResult.error) return sendResponse({ error: ssResult.error });
  const ss = ssResult.ss;

  try {
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
      return sendResponse({ result: "success" });
    }
    
    // Default action for orders
    if (action === "log") {
      const sheet = ss.getSheetByName(SHEET_ORDERS);
      if (!sheet) return sendResponse({ error: "Order sheet not found" });
      sheet.appendRow([new Date(), data.name, data.phone, data.address, data.mapUrl, data.items, data.total, data.slipUrl, data.paymentMethod, "รอดำเนินการ"]);
      return sendResponse({ result: "success" });
    }
  } catch (err) {
    return sendResponse({ error: "doPost Error: " + err.toString() });
  }
}

function sendResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

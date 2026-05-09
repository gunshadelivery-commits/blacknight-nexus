/**
 * BLACKNIGHT-NEXUS CENTRAL BACKEND V.12
 * 🚀 รองรับ: ดึงข้อมูลสินค้า, บันทึกออเดอร์, ตัดสต็อก, เพิ่ม/ลบสินค้า
 */

const SHEET_PRODUCTS = "Blacknight69 - Product List";
const SHEET_ORDERS = "Orders";
const SHEET_SETTINGS = "Settings";

function doGet(e) {
  if (!e || !e.parameter) {
    return ContentService.createTextOutput(JSON.stringify({ "error": "No parameters" })).setMimeType(ContentService.MimeType.JSON);
  }
  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  try {
    if (action === "getProducts") {
      const data = ss.getSheetByName(SHEET_PRODUCTS).getDataRange().getValues();
      return sendResponse(data);
    }
    
    if (action === "getOrders") {
      const data = ss.getSheetByName(SHEET_ORDERS).getDataRange().getValues();
      return sendResponse(data);
    }

    if (action === "getSettings") {
      const data = ss.getSheetByName(SHEET_SETTINGS).getDataRange().getValues();
      return sendResponse(data);
    }
  } catch (err) {
    return sendResponse({ error: "Sheet not found: " + err.toString() });
  }
  
  return sendResponse({ error: "Invalid action" });
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const sheetProducts = ss.getSheetByName(SHEET_PRODUCTS);
    const sheetOrders = ss.getSheetByName(SHEET_ORDERS);
    const sheetSettings = ss.getSheetByName(SHEET_SETTINGS) || ss.insertSheet(SHEET_SETTINGS);

    // --- 0. บันทึก Settings ---
    if (action === "saveSettings") {
      sheetSettings.clear();
      if (data.settings && data.settings.length > 0) {
        // บันทึกแบบยกแผง แม่นยำกว่า
        sheetSettings.getRange(1, 1, data.settings.length, data.settings[0].length).setValues(data.settings);
      }
      SpreadsheetApp.flush();
      return sendResponse({ result: "success" });
    }

    // --- 1. บันทึกออเดอร์ใหม่ + ตัดสต็อก ---
    if (action === "log") {
      sheetOrders.appendRow([
        new Date(), data.name || "-", data.phone || "-", data.address || "-", 
        data.mapUrl || "-", data.items || "-", data.total || 0, data.slipUrl || "-", 
        data.paymentMethod || "โอนเงิน", "รอดำเนินการ"
      ]);

      if (data.itemsArray) {
        const productData = sheetProducts.getDataRange().getValues();
        data.itemsArray.forEach(item => {
          for (let i = 1; i < productData.length; i++) {
            if (productData[i][0] == item.name && productData[i][1] == item.size) {
              const currentStock = parseInt(productData[i][7]) || 0;
              const currentSold = parseInt(productData[i][8]) || 0;
              sheetProducts.getRange(i + 1, 8).setValue(currentStock - item.qty);
              sheetProducts.getRange(i + 1, 9).setValue(currentSold + item.qty);
              break;
            }
          }
        });
      }
      SpreadsheetApp.flush();
      return sendResponse({ result: "success" });
    }

    // --- 2. เพิ่มสินค้าใหม่ (Add Product) ---
    if (action === "addProduct") {
      if (data.variants && data.variants.length > 0) {
        data.variants.forEach(v => {
          sheetProducts.appendRow([
            data.name, v.size || "Standard", v.price || 0, data.note || "", 
            data.image || "", data.tags || "", (parseInt(v.stock) > 0 ? "มีของ" : "หมด"), v.stock || 0, 0
          ]);
        });
      }
      SpreadsheetApp.flush();
      return sendResponse({ result: "success" });
    }

    // --- 3. ลบสินค้าทีละรายการ (Delete Product) ---
    if (action === "deleteProduct") {
      const rows = sheetProducts.getDataRange().getValues();
      for (let i = rows.length - 1; i >= 1; i--) {
        if (rows[i][0].toString().trim() === data.name.toString().trim() && 
            rows[i][1].toString().trim() === data.size.toString().trim()) {
          sheetProducts.deleteRow(i + 1);
        }
      }
      SpreadsheetApp.flush();
      return sendResponse({ result: "success" });
    }

    // --- 4. ลบสินค้าทั้งหมด (Clear Products) ---
    if (action === "clearProducts") {
      const lastRow = sheetProducts.getLastRow();
      if (lastRow > 1) {
        sheetProducts.deleteRows(2, lastRow - 1);
      }
      SpreadsheetApp.flush();
      return sendResponse({ result: "success" });
    }

    // --- 5. อัปเดตสถานะออเดอร์ (Update Status) ---
    if (action === "updateStatus") {
      const rows = sheetOrders.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        // เช็คชื่อหรือสลิปเพื่อให้ตรงออเดอร์
        if (rows[i][1].toString() === data.name.toString() && rows[i][7].toString() === data.slipUrl.toString()) {
          sheetOrders.getRange(i + 1, 10).setValue(data.status);
          SpreadsheetApp.flush();
          return sendResponse({ result: "success" });
        }
      }
    }

    return sendResponse({ result: "error", message: "Action not found: " + action });

  } catch (err) {
    return sendResponse({ result: "error", error: err.toString() });
  }
}

/**
 * ส่งข้อมูลกลับในรูปแบบ JSON
 */
function sendResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

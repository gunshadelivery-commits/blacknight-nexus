// ============================================================
// CANNABIS FLOWER อ่อนนุช - Central Configuration
// ============================================================
// แก้ไขค่าต่างๆ ในไฟล์นี้เพียงไฟล์เดียว เพื่อเชื่อมต่อกับระบบภายนอก
// ============================================================

// --- ข้อมูลร้าน (Shop Branding) ---
export const SHOP_NAME = "Cannabis Flower อ่อนนุช";
export const SHOP_VERSION = "1.0.0";
export const SHOP_TAGLINE = "ดอกแท้คัดเกรด · ส่งด่วน ส่งฟรี ย่านอ่อนนุช สุขุมวิท 🌿";

// --- Google Sheets CSV URL (Product List) - from environment ---
export const SHEET_CSV_URL = import.meta.env.VITE_SHEET_CSV_URL || "";

// --- Google Apps Script (GAS) Web App URL - from environment ---
export const GAS_URL = import.meta.env.VITE_GAS_URL || "";

// --- LINE OA ID - from environment ---
export const LINE_OA_ID = import.meta.env.VITE_LINE_OA_ID || "";

// --- ImgBB API Key - from environment (NEVER hardcode!) ---
export const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY || "";

// --- Admin Password ---
// ย้ายไปฝั่ง Apps Script แล้ว (Script Properties → ADMIN_KEY)
// อย่าเอากลับมาไว้ที่นี่: ค่า VITE_* ทุกตัวถูก build ฝังลงไฟล์ JS ที่ลูกค้าโหลดได้
// VITE_ADMIN_PASSWORD และ VITE_ORDERS_CSV_URL เลิกใช้แล้ว (ออเดอร์อ่านผ่าน GAS getOrders)

// ============================================================
// ฟังก์ชันช่วยเหลือ (Helper Functions)
// ============================================================

/**
 * สร้าง LINE OA Message URL
 * @param {string} message - ข้อความที่จะส่ง
 * @returns {string} LINE URL scheme
 */
export function buildLineUrl(message) {
    if (LINE_OA_ID) {
        // ใช้รูปแบบ oaMessage เพื่อให้ทักแชทร้านได้โดยตรง และ encode @ เป็น %40
        const encodedId = encodeURIComponent(LINE_OA_ID);
        return `https://line.me/R/oaMessage/${encodedId}/?${encodeURIComponent(message)}`;
    }
    // Fallback
    return `https://line.me/R/msg/text/?${encodeURIComponent(message)}`;
}

/**
 * สร้าง URL สำหรับเปิด LINE OA chat ตรงๆ (ไม่มี pre-filled message)
 */
export function getLineOaUrl() {
    if (LINE_OA_ID) {
        const encodedId = encodeURIComponent(LINE_OA_ID);
        return `https://line.me/R/ti/p/${encodedId}`;
    }
    return "https://line.me";
}

/**
 * สร้าง ImgBB Upload URL
 * @returns {string} ImgBB API endpoint with key
 */
export function getImgbbUploadUrl() {
    return `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`;
}

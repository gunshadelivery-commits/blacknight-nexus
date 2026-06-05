// ============================================================
// GUNSHA DELIVERY - Central Configuration
// ============================================================
// แก้ไขค่าต่างๆ ในไฟล์นี้เพียงไฟล์เดียว เพื่อเชื่อมต่อกับระบบภายนอก
// ============================================================

// --- ข้อมูลร้าน (Shop Branding) ---
export const SHOP_NAME = "BlackNight69";
export const SHOP_VERSION = "3.0.0";
export const SHOP_TAGLINE = "พรีเมียมทุกระดับ ประทับใจทุกชิ้น 🚀";

// --- Google Sheets CSV URL (Product List) - from environment ---
export const SHEET_CSV_URL = import.meta.env.VITE_SHEET_CSV_URL || "";

// --- Google Sheets Orders CSV URL - from environment ---
export const ORDERS_CSV_URL = import.meta.env.VITE_ORDERS_CSV_URL || "";

// --- Google Apps Script (GAS) Web App URL - from environment ---
export const GAS_URL = import.meta.env.VITE_GAS_URL || "";

// --- LINE OA ID - from environment ---
export const LINE_OA_ID = import.meta.env.VITE_LINE_OA_ID || "";

// --- ImgBB API Key - from environment (NEVER hardcode!) ---
export const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY || "";

// --- Admin Password - from environment (should use proper auth in production!) ---
export const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "";

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
 * สร้าง ImgBB Upload URL
 * @returns {string} ImgBB API endpoint with key
 */
export function getImgbbUploadUrl() {
    return `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`;
}

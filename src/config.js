// ============================================================
// SIAM CANNABIS อ่อนนุช - Central Configuration
// ============================================================
// แก้ไขค่าต่างๆ ในไฟล์นี้เพียงไฟล์เดียว เพื่อเชื่อมต่อกับระบบภายนอก
// ============================================================

// --- ข้อมูลร้าน (Shop Branding) ---
export const SHOP_NAME = "Siam Cannabis อ่อนนุช";
export const SHOP_VERSION = "1.0.0";
export const SHOP_TAGLINE = "ดอกแท้คัดเกรด · ส่งด่วนย่านอ่อนนุช สุขุมวิท · จ่ายเงินตอนรับของ 🌿";

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
 * มือถือ/แท็บเล็ต (มีแอป LINE) หรือคอมพิวเตอร์
 * ลิงก์ oaMessage (เปิดแชตร้านพร้อมข้อความ) ใช้ได้เฉพาะเครื่องที่มีแอป LINE — เปิดจากคอมพิวเตอร์จะเด้งไปหน้าแรก line.me
 * ลูกค้าจึงทักร้านไม่ได้ (ตรวจ 18 พ.ย. 2026) · iPad รุ่นใหม่รายงานตัวเป็น Mac แต่มีจอสัมผัส → นับเป็นมือถือ
 */
export function isMobileDevice() {
    if (typeof navigator === 'undefined') return true;
    const ua = navigator.userAgent || '';
    return /Android|iPhone|iPad|iPod|Mobile|Line\//i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/**
 * สร้าง LINE OA Message URL
 * บนคอมพิวเตอร์ใช้หน้าเพิ่มเพื่อนของร้านแทน (มี QR ให้สแกนด้วยมือถือ) เพราะแนบข้อความไม่ได้อยู่แล้ว
 * @param {string} message - ข้อความที่จะส่ง
 * @returns {string} LINE URL scheme
 */
export function buildLineUrl(message) {
    if (LINE_OA_ID && !isMobileDevice()) return getLineOaUrl();
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
 * ลิงก์ LINE ที่ฝังใน HTML ตั้งแต่ตอน build (หน้าสายพันธุ์ที่ prerender ไว้) สร้างแบบมือถือเสมอ
 * บนคอมพิวเตอร์ให้เปลี่ยนเป็นหน้าเพิ่มเพื่อนของร้าน
 */
export function fixLineLinksForDesktop(root = document) {
    if (!LINE_OA_ID || isMobileDevice()) return;
    root.querySelectorAll('a[href*="line.me/R/oaMessage/"], a[href*="line.me/R/msg/text/"]').forEach(a => {
        a.href = getLineOaUrl();
    });
}

/**
 * สร้าง ImgBB Upload URL
 * @returns {string} ImgBB API endpoint with key
 */
export function getImgbbUploadUrl() {
    return `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`;
}

// ตรรกะสินค้าที่ใช้ร่วมกันระหว่างหน้าร้าน (main.js), หน้าสายพันธุ์ (strain.js) และตัว prerender ตอน build (scripts/prerender.mjs)
// ไฟล์นี้ต้องรันใน Node ได้ด้วย: ห้ามแตะ DOM และห้าม import config.js (ใช้ import.meta.env ซึ่งไม่มีใน Node)
// ส่วนที่ใช้เฉพาะหน้าสายพันธุ์ (ข้อความ SEO, HTML ของหน้า) อยู่ที่ src/strainView.js เพื่อไม่ให้หน้าแรกต้องโหลดไปด้วย

export const SITE_URL = 'https://blacknight69.com';

export function esc(value = '') {
    return String(value).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
    }[c]));
}

// ข้อความที่จะฝังเป็น argument ใน onclick="fn(...)" — JSON ก่อนแล้วค่อย escape เป็น HTML
// (ชื่อสินค้าที่มี ' " < > จะไม่ทำให้ปุ่มพังหรือกลายเป็นโค้ด)
export function jsArg(value = '') {
    return esc(JSON.stringify(String(value)));
}

// ─── slug ────────────────────────────────────────────────────────────────────

// เก็บตัวอักษรทุกภาษา (รวมไทย) เพื่อให้สินค้าชื่อไทยมี URL ของตัวเอง
export function toSlug(name = '') {
    return String(name).toLowerCase().trim()
        .replace(/\s+/g, '-')
        .replace(/[^\p{L}\p{M}\p{N}-]/gu, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

// slug รุ่นเก่า (ASCII ล้วน) — ใช้จับคู่ลิงก์เดิมที่ Google/ลูกค้าเคยเก็บไว้
export function legacySlug(name = '') {
    return String(name).toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

// ชื่อซ้ำ slug กัน (เช่น "KING JUICE" กับ "👑King Juice") ตัวหลังได้ -2, -3 ตามลำดับแถวในชีต
export function assignSlugs(products) {
    const used = new Map();
    products.forEach(p => {
        const base = toSlug(p.name);
        if (!base) { p.slug = ''; return; }
        const n = (used.get(base) || 0) + 1;
        used.set(base, n);
        p.slug = n === 1 ? base : `${base}-${n}`;
    });
    return products;
}

export function strainPath(slug) {
    if (!slug) return '/';
    return `/strain/${encodeURIComponent(slug)}/`;
}

export function strainUrl(slug) {
    return `${SITE_URL}/strain/${encodeURIComponent(slug)}/`;
}

export function findBySlug(products, rawSlug = '') {
    let slug = rawSlug;
    try { slug = decodeURIComponent(rawSlug); } catch { /* ใช้ค่าดิบ */ }
    slug = slug.trim().toLowerCase();
    if (!slug) return null;
    const asName = slug.replace(/-/g, ' ').trim();
    const trimmed = slug.replace(/-+/g, '-').replace(/^-|-$/g, '');
    return products.find(p => p.slug === slug)
        || products.find(p => p.slug === trimmed)
        || products.find(p => legacySlug(p.name) === trimmed)
        || products.find(p => p.name.trim().toLowerCase() === asName)
        || null;
}

// ─── จัดประเภท ────────────────────────────────────────────────────────────────

const has = (text, words) => words.some(w => text.includes(w));

export function classifyType(name = '', tags = []) {
    // รวมชื่อสินค้า + แท็ก (คอลัมน์ tags ในชีตมักระบุสายพันธุ์ เช่น "ไฮบริด (Hybrid) 50/50")
    const n = (name + ' ' + (Array.isArray(tags) ? tags.join(' ') : tags)).toLowerCase();
    if (has(n, ['น้ำท่อม', 'ท่อมมี่', 'โยเกิร์ต', 'น้ำผลไม้', 'เครื่องดื่ม', 'drink', 'juice'])) return 'เครื่องดื่ม';
    // อุปกรณ์ต้องเช็คก่อนสายพันธุ์
    if (has(n, ['บอง', 'บ้อง', 'bong', 'กระดาษ', 'paper', 'rolling', 'เครื่องบด', 'grinder', 'ที่บด', 'ไฟแช็ก', 'lighter', 'อุปกรณ์', 'pipe', 'ที่สูบ', 'ถาด', 'tray'])) return 'อุปกรณ์';
    if (has(n, ['pre-roll', 'preroll', 'pre roll', 'พรีโรล', 'มวนสำเร็จ', 'joint'])) return 'Pre-roll';
    const sativa = has(n, ['sativa', 'ซาติวา', 'ซาทิวา', 'ซาไทวา', 'เซทีวา']);
    const indica = has(n, ['indica', 'อินดิก้า', 'อินดิกา', 'อินดิ']);
    // Hybrid: ระบุตรงๆ หรือมีทั้ง sativa และ indica ในสายพันธุ์เดียว (เช่น "Indica 70% Sativa 30")
    if (has(n, ['hybrid', 'ไฮบริด', 'ไฮบริค', 'ผสม']) || (sativa && indica)) return 'Hybrid';
    if (sativa) return 'Sativa';
    if (indica) return 'Indica';
    // fallback จากเอฟเฟกต์ใน tags สำหรับแถวที่ยังไม่ได้ใส่ category ในชีต
    if (has(n, ['ตื่นตัว', 'สดชื่น', 'โฟกัส', 'focus', 'energetic', 'energy'])) return 'Sativa';
    if (has(n, ['ง่วง', 'ลงตา', 'หนักตา', 'พักผ่อน', 'ผ่อนคลาย', 'relax', 'sleep'])) return 'Indica';
    // สินค้าที่ไม่ใช่อุปกรณ์/พรีโรลในร้านนี้เป็นดอก จึงใช้ Hybrid เป็นค่ากลาง
    return 'Hybrid';
}

export function isAccessory(type = '') {
    const t = type.toLowerCase();
    return t.includes('อุปกรณ์') || t.includes('accessor') || t === 'อื่นๆ';
}

export function isDrinkType(type = '') {
    return type === 'เครื่องดื่ม';
}

export function getPerfectFor(type = '') {
    const t = type.toLowerCase();
    if (t.includes('pre-roll') || t.includes('preroll')) return ['SMOOTH SMOKE', 'CONVENIENT', 'SOCIAL'];
    if (t === 'sativa') return ['ENERGY & FOCUS', 'CREATIVITY', 'DAYTIME USE'];
    if (t === 'indica') return ['DEEP RELAX', 'SLEEP SUPPORT', 'BODY RELIEF'];
    return ['BALANCE', 'EUPHORIA', 'SOCIAL EASE'];
}

// ป้าย "Perfect For" บนการ์ดสินค้าหน้าร้าน (ฉบับสั้น)
export function getCardPerfectFor(aiType, tags = []) {
    const type = (aiType || '').toLowerCase();
    const tagStr = tags.join(' ').toLowerCase();
    if (type.includes('pre-roll') || type.includes('preroll')) return ['SMOOTH', 'CONVENIENT', 'SOCIAL'];
    if (type === 'sativa') return ['ENERGY', 'CREATIVITY', 'FOCUS'];
    if (type === 'indica') return ['RELAX', 'SLEEP', 'BODY RELIEF'];
    if (type === 'hybrid') return ['BALANCE', 'EUPHORIA', 'SOCIAL'];
    if (tagStr.includes('ตื่นตัว') || tagStr.includes('focus') || tagStr.includes('energetic')) return ['ENERGY', 'CREATIVITY', 'FOCUS'];
    if (tagStr.includes('ผ่อนคลาย') || tagStr.includes('relax') || tagStr.includes('sleep')) return ['RELAX', 'CHILL', 'BODY RELIEF'];
    return ['BALANCE', 'EUPHORIA', 'SOCIAL'];
}

export function isPremiumProduct(product) {
    const hasPremiumTag = product.tags && product.tags.some(t =>
        ['premium', 'พรีเมียม', 'luxury', 'brand', 'branded'].includes(t.toLowerCase())
    );
    const highPrice = product.variants && product.variants.some(v => v.price >= 1200);
    return hasPremiumTag || highPrice;
}

// ─── แปลงแถว CSV เป็นสินค้า ─────────────────────────────────────────────────────
// คอลัมน์ชีต: name, size, price, note, image, tags, status, stock, sold_count, category

export function groupProducts(rows) {
    const grouped = {};
    rows.slice(1).forEach(row => {
        const name = row[0];
        if (!name || !String(name).trim()) return;
        const key = String(name).trim().toLowerCase();
        if (!grouped[key]) {
            const tags = (row[5] || '').toString().split(',').map(t => t.trim()).filter(Boolean);
            // รูปในชีตที่เป็นชื่อไฟล์เฉยๆ (เช่น sluricane.jpg) อยู่ที่ root ของเว็บ: ทำเป็น path เต็มให้ใช้ได้จาก /strain/<slug>/
            let images = (row[4] || '').toString().split(',').map(i => i.trim()).filter(Boolean)
                .map(i => (/^(https?:|data:|\/)/i.test(i) ? i : `/${i}`));
            if (!images.length) images = [''];
            images = images.slice(0, 6);
            const aiType = (row[9] && row[9].toString().trim()) || classifyType(name, tags);
            grouped[key] = {
                name: String(name),
                note: row[3] || '',
                image: images[0],
                images,
                tags,
                status: (row[6] || '').toString().trim().toLowerCase(),
                variants: [],
                totalSold: 0,
                aiType,
                isDrink: isDrinkType(aiType),
            };
        }
        const size = row[1] || 'Standard';
        const sold = parseInt(row[8]) || 0;
        const variant = { size, price: parseFloat(row[2]) || 0, stock: parseInt(row[7]) || 0, sold_count: sold, originalPrice: null };
        // ชื่อ+ขนาดซ้ำในชีต: แถวล่างทับแถวบน
        const existingIdx = grouped[key].variants.findIndex(v => v.size === size);
        if (existingIdx >= 0) grouped[key].variants[existingIdx] = variant;
        else grouped[key].variants.push(variant);
        grouped[key].totalSold += sold;
    });
    return assignSlugs(Object.values(grouped));
}

export function isSoldOut(p) {
    return ['หมด', 'sold out', '0'].includes(p.status) || p.variants.every(v => v.stock <= 0);
}

// เรียงแบบเดียวกับหน้าร้าน: สินค้าที่มีแท็ก new ขึ้นก่อน
export function sortForStorefront(products) {
    const isNew = p => (p.tags || []).some(t => t.trim().toLowerCase() === 'new') ? 0 : 1;
    return [...products].sort((a, b) => isNew(a) - isNew(b));
}

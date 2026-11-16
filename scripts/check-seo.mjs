// ตรวจ dist/ หลัง build ว่าสัญญาณที่ส่งให้ Google ไม่ขัดกันเอง และข้อมูลสินค้า (JSON-LD) ผ่านเกณฑ์ Product snippet
//   npm run build && npm run check:seo            ตรวจจากไฟล์ใน dist/
//   npm run check:seo -- --images                 ตรวจด้วยว่ารูปใน JSON-LD โหลดได้จริง (ต้องต่อเน็ต)
// เจอข้อผิดพลาด = exit 1 · คำเตือน (เช่น ไม่มี review/aggregateRating ซึ่งร้านไม่มีข้อมูลจริง) ไม่ทำให้ล้ม
import { readFile, readdir, access } from 'node:fs/promises';
import { resolve } from 'node:path';

const SITE = 'https://blacknight69.com';
const dist = resolve(process.cwd(), 'dist');
const checkImages = process.argv.includes('--images');
const errors = [];
const warnings = new Map(); // ข้อความ → จำนวนหน้า

const fail = (page, message) => errors.push(`${page}: ${message}`);
const warn = (message) => warnings.set(message, (warnings.get(message) || 0) + 1);
const exists = path => access(path).then(() => true, () => false);

const robotsOf = html => (html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/i) || [])[1] || '';
const canonicalOf = html => (html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i) || [])[1] || '';
const unescapeHtml = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

// คืน node ทุกตัวจากทุกบล็อก JSON-LD ในหน้า (แตก @graph และ array ให้แล้ว)
function jsonLdNodes(page, html) {
    const nodes = [];
    for (const [, body] of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
        let data;
        try { data = JSON.parse(body); } catch (err) { fail(page, `JSON-LD อ่านไม่ได้ (${err.message})`); continue; }
        for (const item of Array.isArray(data) ? data : [data]) {
            if (item && Array.isArray(item['@graph'])) nodes.push(...item['@graph']);
            else if (item) nodes.push(item);
        }
    }
    return nodes;
}

const isType = (node, type) => [].concat(node['@type'] || []).includes(type);
const isHttpsUrl = value => typeof value === 'string' && /^https:\/\/[^\s/]+\/?\S*$/.test(value);
const isPositive = value => typeof value === 'number' ? value > 0 : /^\d+(\.\d+)?$/.test(String(value)) && Number(value) > 0;

// เกณฑ์ Product snippet ของ Google: ต้องมี name และอย่างน้อยหนึ่งใน offers / review / aggregateRating
// offers แบบ AggregateOffer ต้องมี lowPrice + priceCurrency · ราคาต้องมากกว่า 0
function checkProduct(page, node, images) {
    if (!node.name || !String(node.name).trim()) fail(page, 'Product ไม่มี name');
    const imageList = [].concat(node.image || []);
    if (!imageList.length) fail(page, 'Product ไม่มี image');
    imageList.forEach(url => {
        if (!isHttpsUrl(url)) fail(page, `Product image ไม่ใช่ URL เต็มแบบ https: ${url}`);
        else images.add(url);
    });
    if (node.url && !isHttpsUrl(node.url)) fail(page, `Product url ไม่ใช่ URL เต็ม: ${node.url}`);

    const offers = [].concat(node.offers || []);
    if (!offers.length && !node.review && !node.aggregateRating) {
        fail(page, 'Product ไม่มี offers, review หรือ aggregateRating เลย (Google ถือว่าไม่ถูกต้อง)');
    }
    for (const offer of offers) {
        if (offer.priceCurrency !== 'THB') fail(page, `priceCurrency ต้องเป็น THB (เจอ ${offer.priceCurrency})`);
        if (offer.availability && !/^https:\/\/schema\.org\/(InStock|OutOfStock|PreOrder|BackOrder|LimitedAvailability|SoldOut|Discontinued|InStoreOnly|OnlineOnly)$/.test(offer.availability)) {
            fail(page, `availability ไม่ใช่ค่าของ schema.org: ${offer.availability}`);
        }
        if (isType(offer, 'AggregateOffer')) {
            if (!isPositive(offer.lowPrice)) fail(page, `lowPrice ต้องมากกว่า 0 (เจอ ${offer.lowPrice})`);
            if (offer.highPrice !== undefined && !(isPositive(offer.highPrice) && Number(offer.highPrice) >= Number(offer.lowPrice))) {
                fail(page, `highPrice ต้องไม่น้อยกว่า lowPrice (เจอ ${offer.lowPrice}–${offer.highPrice})`);
            }
            if (offer.offerCount !== undefined && !(Number.isInteger(offer.offerCount) && offer.offerCount >= 1)) {
                fail(page, `offerCount ต้องเป็นจำนวนเต็มตั้งแต่ 1 (เจอ ${offer.offerCount})`);
            }
        } else if (isType(offer, 'Offer')) {
            if (!isPositive(offer.price)) fail(page, `price ต้องมากกว่า 0 (เจอ ${offer.price})`);
        } else {
            fail(page, `offers มี @type ที่ไม่รู้จัก: ${offer['@type']}`);
        }
    }
    if (!node.aggregateRating) warn('Product ไม่มี aggregateRating (ไม่บังคับ — ร้านไม่มีคะแนนรีวิวจริง จึงไม่ใส่)');
    if (!node.review) warn('Product ไม่มี review (ไม่บังคับ — ร้านไม่มีรีวิวจริง จึงไม่ใส่)');
}

function checkBreadcrumb(page, node) {
    const items = node.itemListElement || [];
    if (!items.length) fail(page, 'BreadcrumbList ว่าง');
    items.forEach((item, i) => {
        if (item.position !== i + 1) fail(page, `BreadcrumbList position ไม่เรียง (ตำแหน่ง ${i + 1})`);
        if (!item.name || !String(item.name).trim()) fail(page, `BreadcrumbList รายการที่ ${i + 1} ไม่มี name`);
        if (i < items.length - 1 && !isHttpsUrl(item.item)) fail(page, `BreadcrumbList รายการที่ ${i + 1} ไม่มี item ที่เป็น URL เต็ม`);
    });
}

function checkStructuredData(page, html, images) {
    const nodes = jsonLdNodes(page, html);
    nodes.filter(n => isType(n, 'Product')).forEach(n => checkProduct(page, n, images));
    nodes.filter(n => isType(n, 'BreadcrumbList')).forEach(n => checkBreadcrumb(page, n));
    return nodes;
}

// URL ใน sitemap → ไฟล์ใน dist
function fileForUrl(loc) {
    const path = decodeURIComponent(new URL(loc).pathname);
    return resolve(dist, `.${path.endsWith('/') ? `${path}index.html` : path}`);
}

async function main() {
    if (!await exists(resolve(dist, 'sitemap.xml'))) {
        console.error('ไม่พบ dist/sitemap.xml — รัน npm run build ก่อน');
        process.exit(1);
    }
    const images = new Set();

    // 1) ทุกหน้าใน sitemap: มีไฟล์จริง ไม่มี noindex canonical ชี้ตัวเอง
    const sitemap = await readFile(resolve(dist, 'sitemap.xml'), 'utf8');
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => unescapeHtml(m[1]));
    if (!locs.length) fail('sitemap.xml', 'ไม่มี URL เลย');
    if (new Set(locs).size !== locs.length) fail('sitemap.xml', 'มี URL ซ้ำ');
    for (const loc of locs) {
        if (!loc.startsWith(`${SITE}/`)) { fail('sitemap.xml', `URL นอกโดเมนร้าน: ${loc}`); continue; }
        const file = fileForUrl(loc);
        if (!await exists(file)) { fail('sitemap.xml', `ไม่มีไฟล์สำหรับ ${loc}`); continue; }
        const html = await readFile(file, 'utf8');
        if (/noindex/i.test(robotsOf(html))) fail(loc, 'อยู่ใน sitemap แต่หน้ามี noindex');
        const canonical = unescapeHtml(canonicalOf(html));
        if (!canonical) fail(loc, 'ไม่มี canonical ใน HTML');
        else if (canonical !== loc) fail(loc, `canonical (${canonical}) ไม่ตรงกับ URL ใน sitemap`);
    }

    // 2) หน้าสายพันธุ์ทุกหน้า: อยู่ใน sitemap + มี Product ที่ผ่านเกณฑ์
    const strainDir = resolve(dist, 'strain');
    const slugs = await exists(strainDir) ? await readdir(strainDir) : [];
    let productPages = 0;
    for (const slug of slugs) {
        const page = `/strain/${slug}/`;
        const html = await readFile(resolve(strainDir, slug, 'index.html'), 'utf8');
        const loc = `${SITE}/strain/${encodeURIComponent(slug)}/`;
        if (!locs.includes(loc)) fail(page, 'ไม่อยู่ใน sitemap.xml');
        const nodes = checkStructuredData(page, html, images);
        const products = nodes.filter(n => isType(n, 'Product'));
        if (products.length > 1) fail(page, `มี Product ${products.length} ก้อนในหน้าเดียว`);
        if (products.length) {
            productPages++;
            if (products[0].url !== loc) fail(page, `Product url (${products[0].url}) ไม่ตรงกับ URL ของหน้า`);
        } else {
            warn('หน้าสายพันธุ์ที่ไม่มีก้อน Product (สินค้ายังไม่มีราคาในชีต)');
        }
        if (!nodes.some(n => isType(n, 'BreadcrumbList'))) fail(page, 'ไม่มี BreadcrumbList');
    }

    // 3) หน้าอื่น: JSON-LD ต้องอ่านได้ · หน้าที่ noindex ต้องไม่อยู่ใน sitemap และไม่ประกาศ canonical
    for (const name of ['index.html', 'accessories.html', 'login.html', 'register.html', 'strain.html', '404.html']) {
        const file = resolve(dist, name);
        if (!await exists(file)) continue;
        const html = await readFile(file, 'utf8');
        checkStructuredData(`/${name}`, html, images);
        if (/noindex/i.test(robotsOf(html))) {
            if (locs.includes(`${SITE}/${name}`)) fail(`/${name}`, 'มี noindex แต่อยู่ใน sitemap');
            if (canonicalOf(html)) fail(`/${name}`, 'มี noindex พร้อม canonical (สัญญาณขัดกัน)');
        }
    }

    // 4) (เลือกได้) รูปใน JSON-LD โหลดได้จริง
    if (checkImages) {
        for (const url of images) {
            try {
                const res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' }, signal: AbortSignal.timeout(20000) });
                const type = res.headers.get('content-type') || '';
                if (!res.ok) fail(url, `รูปโหลดไม่ได้ (HTTP ${res.status})`);
                else if (!type.startsWith('image/')) fail(url, `ไม่ใช่ไฟล์รูป (${type})`);
            } catch (err) {
                fail(url, `รูปโหลดไม่ได้ (${err.message})`);
            }
        }
    }

    for (const [message, count] of warnings) console.log(`คำเตือน (${count} หน้า): ${message}`);
    console.log(`ตรวจ ${locs.length} URL ใน sitemap, ${slugs.length} หน้าสายพันธุ์ (มี Product ${productPages} หน้า)${checkImages ? `, รูป ${images.size} ใบ` : ''}`);
    if (errors.length) {
        console.error(`\nพบข้อผิดพลาด ${errors.length} จุด:`);
        errors.forEach(e => console.error(`  ✗ ${e}`));
        process.exit(1);
    }
    console.log('ผ่าน: ไม่พบข้อผิดพลาด');
}

main();

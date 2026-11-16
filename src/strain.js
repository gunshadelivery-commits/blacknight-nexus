import Papa from 'papaparse';
import { SHEET_CSV_URL, buildLineUrl } from './config.js';
import { buildAnalyticsItem, initAnalyticsTracking, trackEvent } from './analytics.js';
import { groupProducts, findBySlug, optimizedImage, parseImageKeys, firstAvailableIndex, isSoldOut, isCatalogCsv, strainPath } from './catalog.js';
import {
    STRAIN_I18N, makeT, strainMeta, buildSchema, renderStrainHtml, variantPriceHtml, lineMessage,
} from './strainView.js';
import { getLanguage } from './i18n.js';
import { initAgeGate } from './agegate.js';

// ภาษาเดียวกับหน้าร้าน (cf_language · ค่าเริ่มต้นตาม src/i18n.js)
function getLang() {
    const lang = getLanguage();
    return STRAIN_I18N[lang] ? lang : 'en';
}

// slug มาจาก /strain/<slug>/ (หน้าที่ prerender ตอน build) หรือ ?s=<slug> (ลิงก์เดิม)
function readSlug() {
    const match = window.location.pathname.match(/^\/strain\/([^/]+)\/?$/);
    if (match) return match[1];
    return new URLSearchParams(window.location.search).get('s') || '';
}

const rawSlug = readSlug();
// หน้าที่ build สร้างไว้แล้ว (/strain/<slug>/) มีเนื้อหา + meta ครบใน HTML · ที่เหลือคือ 404.html และตอน dev ที่ต้องรอข้อมูลจากชีต
const prerendered = document.getElementById('strain-content').dataset.prerendered === '1';
const builtImages = parseImageKeys(window.__imgKeys); // รูปที่ build ย่อไว้ให้หน้านี้ (ดู scripts/prerender.mjs)
let currentVariantIdx = 0;
let currentProduct = null;
let catalog = [];

// หน้า prerender ฝังข้อมูลสินค้าไว้ ให้ปุ่มเลือกขนาด/เพิ่มลงตะกร้าใช้ได้ทันทีก่อน CSV โหลดเสร็จ
try {
    const seed = document.getElementById('strain-data');
    if (seed) {
        currentProduct = JSON.parse(seed.textContent);
        currentVariantIdx = firstAvailableIndex(currentProduct);
    }
} catch { /* รอข้อมูลจาก CSV */ }

// นับการดูสินค้าครั้งเดียวต่อการเปิดหน้า (หน้า prerender นับได้ทันทีจากข้อมูลที่ฝังมา ไม่ต้องรอ CSV)
let viewTracked = false;
function trackView(p) {
    if (viewTracked || !p || !p.variants || !p.variants.length) return;
    viewTracked = true;
    const variant = p.variants[firstAvailableIndex(p)];
    trackEvent('view_item', {
        currency: 'THB',
        value: Number(variant.price) || 0,
        items: [buildAnalyticsItem(p, variant)],
    });
}

function setMeta(name, content) {
    let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(name.startsWith('og:') ? 'property' : 'name', name);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}

function canAdd() {
    if (!currentProduct) return false;
    const variant = currentProduct.variants[currentVariantIdx];
    return !isSoldOut(currentProduct) && !!variant && variant.stock > 0;
}

// แถบปุ่มสั่งซื้อติดขอบล่าง (มือถือ): โผล่เมื่อปุ่มหลักเลื่อนพ้นจอขึ้นไป
let ctaObserver = null;
function watchCta() {
    if (ctaObserver) ctaObserver.disconnect();
    const row = document.getElementById('cta-row');
    const sticky = document.getElementById('sticky-cta');
    if (!row || !sticky || !('IntersectionObserver' in window)) return;
    ctaObserver = new IntersectionObserver(([entry]) => {
        // ซ่อนตอนปุ่มหลักอยู่ในจอ หรือยังอยู่ต่ำกว่าจอ (ยังเลื่อนไม่ถึง)
        sticky.hidden = entry.isIntersecting || entry.boundingClientRect.top > 0;
    });
    ctaObserver.observe(row);
}

function updateBackLabel(t) {
    const backLabel = document.getElementById('back-label');
    if (backLabel) backLabel.textContent = t('backToShop');
    const backBtn = document.getElementById('back-btn');
    if (backBtn) backBtn.setAttribute('aria-label', t('backToShop'));
}

function render(p, allProducts) {
    currentProduct = p;
    catalog = allProducts;
    currentVariantIdx = firstAvailableIndex(p);
    trackView(p);
    const t = makeT(getLang());
    const meta = strainMeta(p);

    document.title = meta.title;
    setMeta('description', meta.description);
    setMeta('og:title', meta.ogTitle);
    setMeta('og:description', meta.ogDescription);
    setMeta('og:url', meta.canonical);
    setMeta('og:image', meta.image);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = meta.canonical;

    // โครงหน้า (strain.html / 404.html) ไม่มี JSON-LD ติดมา: สร้างเมื่อรู้ข้อมูลสินค้าจริงแล้วเท่านั้น
    let schemaEl = document.getElementById('strain-schema');
    if (!schemaEl) {
        schemaEl = document.createElement('script');
        schemaEl.type = 'application/ld+json';
        schemaEl.id = 'strain-schema';
        document.head.appendChild(schemaEl);
    }
    schemaEl.textContent = JSON.stringify(buildSchema(p));

    document.getElementById('strain-content').innerHTML = renderStrainHtml(p, allProducts, {
        t,
        lineUrlFor: buildLineUrl,
        img: (src, size) => optimizedImage(src, size, builtImages),
    });
    document.getElementById('loading').style.display = 'none';
    document.getElementById('strain-content').style.display = 'block';
    updateBackLabel(t);
    watchCta();
}

window.selectVariant = (idx) => {
    if (!currentProduct || !currentProduct.variants[idx]) return;
    currentVariantIdx = idx;
    const variant = currentProduct.variants[idx];
    const t = makeT(getLang());
    document.querySelectorAll('.variant-btn').forEach((b, i) => {
        b.classList.toggle('is-active', i === idx);
        b.setAttribute('aria-pressed', String(i === idx));
    });
    document.getElementById('price-display').innerHTML = variantPriceHtml(variant);
    const stickyPrice = document.getElementById('sticky-price');
    if (stickyPrice) stickyPrice.textContent = `${variant.size} · ${variant.price.toLocaleString('en-US')} ฿`;
    // ปุ่มเพิ่มลงตะกร้ากดได้เฉพาะขนาดที่มีของ · ปุ่ม LINE แนบชื่อ+ขนาดที่เลือก
    const disabled = !canAdd();
    ['add-btn', 'sticky-add'].forEach(id => { const btn = document.getElementById(id); if (btn) btn.disabled = disabled; });
    const lineHref = buildLineUrl(lineMessage(currentProduct, variant, t));
    ['line-btn', 'sticky-line'].forEach(id => { const link = document.getElementById(id); if (link) link.href = lineHref; });
};

window.addToCartAndBack = () => {
    if (!canAdd()) return;
    // หน้าแรกอ่าน intent นี้หลังโหลดสินค้าเสร็จ แล้วเพิ่มลงตะกร้าให้
    sessionStorage.setItem('sc_add_intent', JSON.stringify({ name: currentProduct.name, variantIdx: currentVariantIdx }));
    window.location.href = '/';
};

// ใช้เฉพาะหน้าที่ไม่ได้ prerender (404.html / ตอน dev) — ห้ามเรียกบนหน้า /strain/<slug>/ ที่ build สร้างไว้:
// Google รันสคริปต์นี้ตอนเก็บหน้า ถ้าไปซ่อนเนื้อหาหรือใส่ noindex หน้าที่ดีอยู่แล้วจะหลุดจากผลค้นหา
function showMessage(text, { noindex = false } = {}) {
    if (prerendered) return;
    if (noindex) setMeta('robots', 'noindex');
    document.getElementById('strain-content').style.display = 'none';
    const loading = document.getElementById('loading');
    loading.style.display = '';
    loading.innerHTML = `<p>${text} <a href="/" style="color:var(--green);">Back to shop</a></p>`;
}

function parseAndRender(csvText) {
    const rows = Papa.parse(csvText, { skipEmptyLines: true }).data || [];
    const allProducts = groupProducts(rows);
    const found = findBySlug(allProducts, rawSlug);
    if (!found) {
        // หน้า prerender: สินค้าอาจเพิ่งถูกเอาออกจากชีต — คงหน้าเดิมไว้ build รอบถัดไป (ทุกวัน 03:00) จะเอาหน้านี้ออกเอง
        // หน้าอื่น: ชีตตอบมาครบแล้วและไม่มีสินค้านี้จริง จึงบอก Google ว่าไม่ต้องเก็บ
        showMessage('Strain not found.', { noindex: true });
        return;
    }
    // เข้ามาด้วย slug แบบเก่าหรือชื่อสินค้า (ผ่าน 404.html): พาไป URL จริงของสินค้า ถ้ายังไม่ได้อยู่ที่นั่น
    if (!prerendered && currentPath() !== `/strain/${found.slug}/`) {
        window.location.replace(strainPath(found.slug));
        return;
    }
    render(found, allProducts);
}

function currentPath() {
    try { return decodeURIComponent(window.location.pathname); } catch { return window.location.pathname; }
}

const CACHE_KEY = 'sc_sheet_cache';
const CACHE_TTL = 5 * 60 * 1000;

function readCache() {
    try {
        const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
        if (cached && Date.now() - cached.ts < CACHE_TTL && isCatalogCsv(cached.csv)) return cached.csv;
    } catch { /* ไม่มี cache */ }
    return null;
}

function fetchCsv() {
    // <head> ของหน้าเริ่มดึง CSV ไว้ก่อนแล้ว (window.__catalogCsv) เพื่อไม่ต้องรอ JS โหลดเสร็จ
    const early = window.__catalogCsv;
    window.__catalogCsv = null;
    const download = () => fetch(`${SHEET_CSV_URL}&t=${Date.now()}`).then(r => {
        if (!r.ok) throw new Error(`csv ${r.status}`);
        return r.text();
    });
    // ลิงก์ชีตตอบเป็นหน้า HTML ของ Google ได้ (error / จำกัดความถี่ / redirect ไม่ครบ): ไม่ใช่ข้อมูลสินค้า = ถือว่าโหลดไม่สำเร็จ
    const onlyCatalog = csv => {
        if (!isCatalogCsv(csv)) throw new Error('csv invalid');
        return csv;
    };
    const request = early ? early.then(onlyCatalog).catch(() => download().then(onlyCatalog)) : download().then(onlyCatalog);
    return request.then(csv => {
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), csv })); } catch { /* เต็ม/ปิดไว้ */ }
        return csv;
    });
}

initAnalyticsTracking();
trackView(currentProduct);
// ยืนยันอายุ 20+ เหมือนหน้าแรก (ลูกค้าจาก Google เข้าหน้านี้โดยตรง) และเปิดใช้ปุ่มสลับภาษาใน nav
initAgeGate();
updateBackLabel(makeT(getLang()));
// สลับภาษา: วาดหน้าใหม่ด้วยภาษาที่เลือก
document.addEventListener('cf:languagechange', () => {
    if (currentProduct && catalog.length) render(currentProduct, catalog);
    else updateBackLabel(makeT(getLang()));
});
watchCta();

if (!rawSlug) {
    window.location.replace('/');
} else {
    const cachedCsv = readCache();
    if (cachedCsv) {
        parseAndRender(cachedCsv);
    } else {
        fetchCsv()
            .then(parseAndRender)
            .catch(() => {
                // หน้า prerender มีเนื้อหาอยู่แล้ว ปล่อยไว้ได้ ถ้าไม่มีจึงแจ้งว่าโหลดไม่ได้ (โหลดไม่ได้ชั่วคราว ≠ ไม่มีสินค้า จึงไม่ใส่ noindex)
                showMessage('Could not load strain data.');
            });
    }
}

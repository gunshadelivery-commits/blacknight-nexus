import Papa from 'papaparse';
import { SHEET_CSV_URL, getLineOaUrl } from './config.js';
import { initAnalyticsTracking } from './analytics.js';
import { groupProducts, findBySlug } from './catalog.js';
import {
    STRAIN_I18N, makeT, strainMeta, buildSchema, renderStrainHtml, variantPriceHtml,
} from './strainView.js';

function getLang() {
    try {
        const l = localStorage.getItem('cf_language') || 'en';
        return STRAIN_I18N[l] ? l : 'en';
    } catch { return 'en'; }
}

// slug มาจาก /strain/<slug>/ (หน้าที่ prerender ตอน build) หรือ ?s=<slug> (ลิงก์เดิม)
function readSlug() {
    const match = window.location.pathname.match(/^\/strain\/([^/]+)\/?$/);
    if (match) return match[1];
    return new URLSearchParams(window.location.search).get('s') || '';
}

const rawSlug = readSlug();
let currentVariantIdx = 0;
let currentProduct = null;

// หน้า prerender ฝังข้อมูลสินค้าไว้ ให้ปุ่มเลือกขนาด/เพิ่มลงตะกร้าใช้ได้ทันทีก่อน CSV โหลดเสร็จ
try {
    const seed = document.getElementById('strain-data');
    if (seed) currentProduct = JSON.parse(seed.textContent);
} catch { /* รอข้อมูลจาก CSV */ }

function setMeta(name, content) {
    let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(name.startsWith('og:') ? 'property' : 'name', name);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}

function render(p, allProducts) {
    currentProduct = p;
    currentVariantIdx = 0;
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
    document.querySelectorAll('link[hreflang]').forEach(l => { l.href = meta.canonical; });

    const schemaEl = document.getElementById('strain-schema');
    if (schemaEl) schemaEl.textContent = JSON.stringify(buildSchema(p));

    document.getElementById('strain-content').innerHTML = renderStrainHtml(p, allProducts, { t, lineUrl: getLineOaUrl() });
    document.getElementById('loading').style.display = 'none';
    document.getElementById('strain-content').style.display = 'block';

    const backBtn = document.getElementById('back-btn');
    if (backBtn) backBtn.lastChild.textContent = ' ' + t('backToShop');
}

window.selectVariant = (idx) => {
    if (!currentProduct) return;
    currentVariantIdx = idx;
    document.querySelectorAll('.variant-btn').forEach((b, i) => b.classList.toggle('is-active', i === idx));
    document.getElementById('price-display').innerHTML = variantPriceHtml(currentProduct.variants[idx]);
};

window.addToCartAndBack = () => {
    if (!currentProduct) return;
    // หน้าแรกอ่าน intent นี้หลังโหลดสินค้าเสร็จ แล้วเพิ่มลงตะกร้าให้
    sessionStorage.setItem('sc_add_intent', JSON.stringify({ name: currentProduct.name, variantIdx: currentVariantIdx }));
    window.location.href = '/';
};

function showMessage(text) {
    setMeta('robots', 'noindex');
    document.getElementById('strain-content').style.display = 'none';
    const loading = document.getElementById('loading');
    loading.style.display = '';
    loading.innerHTML = `<p>${text} <a href="/" style="color:var(--green);">Back to shop</a></p>`;
}

function parseAndRender(csvText) {
    const rows = Papa.parse(csvText, { skipEmptyLines: true }).data || [];
    const allProducts = groupProducts(rows);
    const found = findBySlug(allProducts, rawSlug);
    if (!found) { showMessage('Strain not found.'); return; }
    render(found, allProducts);
}

const CACHE_KEY = 'sc_sheet_cache';
const CACHE_TTL = 5 * 60 * 1000;

function readCache() {
    try {
        const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
        if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.csv;
    } catch { /* ไม่มี cache */ }
    return null;
}

function fetchCsv() {
    // <head> ของหน้าเริ่มดึง CSV ไว้ก่อนแล้ว (window.__catalogCsv) เพื่อไม่ต้องรอ JS โหลดเสร็จ
    const early = window.__catalogCsv;
    window.__catalogCsv = null;
    const request = early
        ? early.catch(() => fetch(`${SHEET_CSV_URL}&t=${Date.now()}`).then(r => r.text()))
        : fetch(`${SHEET_CSV_URL}&t=${Date.now()}`).then(r => r.text());
    return request.then(csv => {
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), csv })); } catch { /* เต็ม/ปิดไว้ */ }
        return csv;
    });
}

initAnalyticsTracking();

if (!rawSlug) {
    window.location.replace('/');
} else {
    const prerendered = document.getElementById('strain-content').dataset.prerendered === '1';
    const cachedCsv = readCache();
    if (cachedCsv) {
        parseAndRender(cachedCsv);
    } else {
        fetchCsv()
            .then(parseAndRender)
            .catch(() => {
                // หน้า prerender มีเนื้อหาอยู่แล้ว ปล่อยไว้ได้ ถ้าไม่มีจึงแจ้งว่าโหลดไม่ได้
                if (!prerendered) showMessage('Could not load strain data.');
            });
    }
}

// สร้างสคริปต์ inline ท้าย <body> ที่แปลหน้าเป็นภาษาของผู้เข้าชม "ก่อนภาพแรกขึ้น"
//
// ทำไมต้องมี: ข้อความใน HTML เป็นไทย แต่ภาษาเริ่มต้นของหน้าร้านคืออังกฤษ เดิมจึงต้องซ่อนทั้งหน้า
// (html.i18n-pending) รอจน JS ก้อนหลักโหลดเสร็จแล้วค่อยแปล — ผู้เข้าชมใหม่ทุกคนเห็นจอดำนานเท่าเวลาโหลด JS
// สคริปต์นี้ฝังเฉพาะคำแปลที่หน้านั้นใช้จริง (en/zh/ko) ไว้ใน HTML เลย แปลเสร็จทันทีที่ HTML มาถึง
// แล้ว src/i18n.js รับช่วงต่อเมื่อโหลดเสร็จ (สลับภาษา, เนื้อหาที่ JS วาดทีหลัง)
//
// ต้องให้ผลเหมือน applyTranslations() ใน src/i18n.js — ถ้าแก้ตรรกะที่นั่น ให้แก้ที่นี่ด้วย
import { translations } from '../src/i18n.js';

const BOOT_LANGS = ['en', 'zh', 'ko'];
const escapeRegExp = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const htmlText = s => s.replace(/&/g, '&amp;');

function collect(html) {
    const th = translations.th;
    const keys = new Set();
    for (const m of html.matchAll(/data-i18n(?:-html|-placeholder|-aria|-title)?="([^"]+)"/g)) {
        if (th[m[1]] !== undefined) keys.add(m[1]);
    }

    // ข้อความไทยที่ไม่มี data-i18n: จับคู่จากตัวข้อความ แบบเดียวกับ literalIndex ใน i18n.js (ข้อความซ้ำ key หลังชนะ)
    const literalKey = new Map();
    for (const [key, value] of Object.entries(th)) {
        if (typeof value === 'string' && !value.includes('{{') && !value.includes('<')) literalKey.set(value, key);
    }
    const literals = {};
    for (const [value, key] of literalKey) {
        const variants = [...new Set([value, htmlText(value)])].map(escapeRegExp).join('|');
        const inText = new RegExp(`>\\s*(?:${variants})\\s*<`);
        const inAttr = new RegExp(`(?:placeholder|aria-label|title)="(?:${variants})"`);
        if (inText.test(html) || inAttr.test(html)) {
            literals[value] = key;
            keys.add(key);
        }
    }

    const table = {};
    for (const key of keys) {
        table[key] = BOOT_LANGS.map(lang => translations[lang]?.[key] ?? translations.en[key] ?? th[key]);
    }
    return { k: table, l: literals };
}

// โค้ดที่รันในเบราว์เซอร์ (ES5 ล้วน ไม่ผ่าน bundler) — D = { k: {key: [en, zh, ko]}, l: {ข้อความไทย: key} }
function boot(D) {
    var LANGS = ['th', 'en', 'zh', 'ko'];
    var root = document.documentElement;
    var lang = null;
    try { lang = localStorage.getItem('cf_language'); } catch (e) { /* ปิด storage ไว้ */ }
    if (LANGS.indexOf(lang) < 0) {
        // ต้องตรงกับ defaultLanguage() ใน src/i18n.js
        var preferred = root.getAttribute('data-default-lang');
        if (LANGS.indexOf(preferred) >= 0) lang = preferred;
        else {
            var browser = ((navigator.languages && navigator.languages[0]) || navigator.language || '').toLowerCase();
            lang = browser.indexOf('zh') === 0 ? 'zh' : browser.indexOf('ko') === 0 ? 'ko' : 'en';
        }
    }
    var each = function (selector, fn) { Array.prototype.forEach.call(document.querySelectorAll(selector), fn); };
    var index = ['en', 'zh', 'ko'].indexOf(lang);
    if (index >= 0) {
        var tr = function (key) { var v = key && D.k[key]; return v ? v[index] : null; };
        each('[data-i18n]', function (el) { var v = tr(el.getAttribute('data-i18n')); if (v != null) el.textContent = v; });
        each('[data-i18n-html]', function (el) { var v = tr(el.getAttribute('data-i18n-html')); if (v != null) el.innerHTML = v; });
        [['placeholder', 'data-i18n-placeholder'], ['aria-label', 'data-i18n-aria'], ['title', 'data-i18n-title']].forEach(function (pair) {
            each('[' + pair[0] + '],[' + pair[1] + ']', function (el) {
                var key = el.getAttribute(pair[1]) || D.l[el.getAttribute(pair[0])];
                var v = tr(key);
                if (v == null) return;
                el.setAttribute(pair[0], v);
                (el.__i18nAttr = el.__i18nAttr || {})[pair[0]] = key; // i18n.js ใช้ key นี้ตอนสลับภาษา
            });
        });
        var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        var node;
        while ((node = walker.nextNode())) {
            var raw = node.nodeValue;
            var text = raw.trim();
            if (!text) continue;
            var key = D.l[text];
            var value = tr(key);
            if (value == null) continue;
            var at = raw.indexOf(text);
            node.nodeValue = raw.slice(0, at) + value + raw.slice(at + text.length);
            node.__i18nKey = key; // ข้อความไทยเดิมหายไปแล้ว: ฝาก key ไว้ให้ i18n.js สลับภาษาได้
        }
    }
    root.lang = lang;
    each('[data-language-option]', function (button) {
        var active = button.getAttribute('data-language-option') === lang;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
    });
    root.classList.remove('i18n-pending');
}

export function injectI18nBoot(html) {
    const marker = '</body>';
    if (!html.includes(marker)) throw new Error('[i18n-boot] ไม่พบ </body>');
    const data = JSON.stringify(collect(html)).replace(/</g, '\\u003c');
    const script = `<script>(${boot.toString()})(${data});</script>`;
    return html.replace(marker, () => `${script}\n${marker}`);
}

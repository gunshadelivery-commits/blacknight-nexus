import { initI18n } from './i18n.js';

const STORAGE_KEY = 'bn_age_verified';
const REMEMBER_DAYS = 30; // ยืนยันแล้วจำไว้บนเครื่องนี้กี่วัน (เดิมจำแค่จนปิดแท็บ ลูกค้าประจำต้องกดทุกครั้งที่เข้า)

function isVerified() {
    try {
        if (sessionStorage.getItem(STORAGE_KEY)) return true;
        const at = Number(localStorage.getItem(STORAGE_KEY));
        return at > 0 && Date.now() - at < REMEMBER_DAYS * 24 * 60 * 60 * 1000;
    } catch {
        return false;
    }
}

function rememberVerified() {
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch { /* ปิด storage ไว้ */ }
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch { /* ปิด storage ไว้ */ }
}

function createAgeGateHTML() {
    return `
<div id="age-gate" role="dialog" aria-modal="true" aria-labelledby="age-gate-title" style="
    position: fixed;
    inset: 0;
    z-index: 99999;
    background: rgba(0,0,0,0.97);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Sukhumvit Set", "Helvetica Neue", "Inter", "Noto Sans Thai", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Apple SD Gothic Neo", "Malgun Gothic", "Segoe UI", Roboto, sans-serif;
">
    <div style="
        max-width: 420px;
        width: 100%;
        text-align: center;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 32px;
        padding: 48px 32px;
        backdrop-filter: blur(20px);
        position: relative;
    ">
        <div class="language-switcher" role="group" data-i18n-aria="language.label" style="position:absolute;top:20px;right:20px;">
            <button type="button" data-language-option="th" data-i18n-title="language.thai">TH</button>
            <button type="button" data-language-option="en" data-i18n-title="language.english">EN</button>
            <button type="button" data-language-option="zh" data-i18n-title="language.chinese" lang="zh">中文</button>
            <button type="button" data-language-option="ko" data-i18n-title="language.korean" lang="ko">한국</button>
        </div>
        <div style="font-size: 56px; margin-bottom: 16px;">🌿</div>
        <h2 id="age-gate-title" data-i18n="age.title" style="color: #fff; font-size: 26px; font-weight: 800; margin: 0 0 8px;">ยืนยันอายุ</h2>
        <p style="color: rgba(255,255,255,0.6); font-size: 14px; line-height: 1.6; margin: 0 0 12px;">
            <strong data-i18n-html="age.product" style="color: rgba(255,255,255,0.85);">ผลิตภัณฑ์กัญชา<br>ดอกแท้คัดเกรด พรีโรล และอุปกรณ์</strong>
        </p>
        <p data-i18n-html="age.requirement" style="color: rgba(255,255,255,0.7); font-size: 13px; margin: 0 0 32px;">
            จำหน่ายสำหรับผู้ที่มีอายุ <strong style="color: #4ade80;">20 ปีขึ้นไปเท่านั้น</strong><br>
            งดจำหน่ายแก่สตรีมีครรภ์และสตรีให้นมบุตร
        </p>
        <div style="display: flex; flex-direction: column; gap: 12px;">
            <button id="age-gate-confirm" style="
                background: #4ade80;
                color: #052e16;
                border: none;
                border-radius: 16px;
                padding: 16px 24px;
                font-size: 16px;
                font-weight: 800;
                cursor: pointer;
                font-family: inherit;
                transition: opacity 0.2s;
            " data-i18n="age.confirm">ฉันอายุ 20 ปีขึ้นไป — เข้าสู่เว็บไซต์</button>
            <button id="age-gate-exit" style="
                background: rgba(255,255,255,0.08);
                color: rgba(255,255,255,0.75);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 16px;
                padding: 12px 24px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                font-family: inherit;
            " data-i18n="age.exit">ฉันอายุต่ำกว่า 20 ปี — ออก</button>
        </div>
        <p data-i18n-html="age.notice" style="color: rgba(255,255,255,0.6); font-size: 11px; margin-top: 24px; line-height: 1.5;">
            การเข้าสู่เว็บไซต์นี้ถือว่าคุณยืนยันว่ามีอายุครบ 20 ปีบริบูรณ์<br>โปรดใช้ผลิตภัณฑ์อย่างมีความรับผิดชอบ
        </p>
    </div>
</div>`;
}

export function initAgeGate() {
    initI18n();
    if (isVerified()) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = createAgeGateHTML();
    document.body.appendChild(wrapper.firstElementChild);
    initI18n(); // แปลข้อความในหน้าต่างที่เพิ่งใส่เข้าไป

    const confirmBtn = document.getElementById('age-gate-confirm');
    confirmBtn.focus({ preventScroll: true });
    // กัน Tab หลุดไปหลังหน้าต่าง: วนอยู่ในปุ่มของหน้าต่างนี้
    document.getElementById('age-gate').addEventListener('keydown', (event) => {
        if (event.key !== 'Tab') return;
        const focusable = [...document.querySelectorAll('#age-gate button')];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });

    confirmBtn.addEventListener('click', () => {
        rememberVerified();
        const gate = document.getElementById('age-gate');
        gate.style.opacity = '0';
        gate.style.transition = 'opacity 0.4s ease';
        setTimeout(() => gate.remove(), 400);
    });

    document.getElementById('age-gate-exit').addEventListener('click', () => {
        window.location.href = 'https://www.google.com';
    });
}

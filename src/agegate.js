const STORAGE_KEY = 'bn_age_verified';

function createAgeGateHTML() {
    return `
<div id="age-gate" style="
    position: fixed;
    inset: 0;
    z-index: 99999;
    background: rgba(0,0,0,0.97);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    font-family: 'Kanit', 'Prompt', sans-serif;
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
    ">
        <div style="font-size: 56px; margin-bottom: 16px;">🔞</div>
        <h2 style="color: #fff; font-size: 26px; font-weight: 800; margin: 0 0 8px;">ยืนยันอายุ</h2>
        <p style="color: rgba(255,255,255,0.6); font-size: 14px; line-height: 1.6; margin: 0 0 12px;">
            เว็บไซต์นี้จำหน่าย<strong style="color: rgba(255,255,255,0.85);">ของเล่นผู้ใหญ่ อุปกรณ์คู่รัก<br>และสินค้าเพื่อสุขภาพทางเพศ</strong>
        </p>
        <p style="color: rgba(255,255,255,0.5); font-size: 13px; margin: 0 0 32px;">
            เหมาะสำหรับผู้ที่มีอายุ <strong style="color: #f87171;">18 ปีขึ้นไปเท่านั้น</strong><br>
            กรุณายืนยันว่าคุณมีอายุครบ 18 ปีบริบูรณ์
        </p>
        <div style="display: flex; flex-direction: column; gap: 12px;">
            <button id="age-gate-confirm" style="
                background: #fff;
                color: #000;
                border: none;
                border-radius: 16px;
                padding: 16px 24px;
                font-size: 16px;
                font-weight: 800;
                cursor: pointer;
                font-family: inherit;
                transition: opacity 0.2s;
            ">ฉันอายุ 18 ปีขึ้นไป — เข้าสู่เว็บไซต์</button>
            <button id="age-gate-exit" style="
                background: rgba(255,255,255,0.08);
                color: rgba(255,255,255,0.5);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 16px;
                padding: 12px 24px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                font-family: inherit;
            ">ฉันอายุต่ำกว่า 18 ปี — ออก</button>
        </div>
        <p style="color: rgba(255,255,255,0.2); font-size: 11px; margin-top: 24px; line-height: 1.5;">
            การเข้าสู่เว็บไซต์นี้ถือว่าคุณยืนยันว่ามีอายุครบ 18 ปีบริบูรณ์<br>และยินยอมรับชมเนื้อหาสำหรับผู้ใหญ่
        </p>
    </div>
</div>`;
}

export function initAgeGate() {
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = createAgeGateHTML();
    document.body.appendChild(wrapper.firstElementChild);

    document.getElementById('age-gate-confirm').addEventListener('click', () => {
        sessionStorage.setItem(STORAGE_KEY, '1');
        const gate = document.getElementById('age-gate');
        gate.style.opacity = '0';
        gate.style.transition = 'opacity 0.4s ease';
        setTimeout(() => gate.remove(), 400);
    });

    document.getElementById('age-gate-exit').addEventListener('click', () => {
        window.location.href = 'https://www.google.com';
    });
}

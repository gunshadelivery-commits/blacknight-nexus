const MAX_TEXT_LENGTH = 100;

function cleanText(value) {
    return String(value || '').trim().slice(0, MAX_TEXT_LENGTH);
}

export function buildAnalyticsItem(product, variant, quantity = 1) {
    return {
        item_id: cleanText(product.name),
        item_name: cleanText(product.name),
        item_category: cleanText(product.aiType || product.category || 'Other'),
        item_variant: cleanText(variant.size),
        price: Number(variant.price) || 0,
        quantity: Number(quantity) || 1,
    };
}

// รายการในตะกร้า (name/size/price/qty) → items ของ GA4 — ไม่มีข้อมูลลูกค้า
export function buildCartItems(cart = []) {
    return cart.map(item => ({
        item_id: cleanText(item.name),
        item_name: cleanText(item.name),
        item_category: cleanText(item.category || 'Other'),
        item_variant: cleanText(item.size),
        price: Number(item.price) || 0,
        quantity: Number(item.qty) || 1,
    }));
}

export function trackEvent(eventName, params = {}) {
    if (!eventName || typeof window.gtag !== 'function') return;

    // ห้ามส่งชื่อ เบอร์โทร อีเมล ที่อยู่ หรือข้อมูลลูกค้าอื่นเข้า Analytics
    window.gtag('event', eventName, {
        ...params,
        transport_type: 'beacon',
    });
}

export function initAnalyticsTracking() {
    document.addEventListener('click', (event) => {
        const target = event.target.closest('[data-analytics-event]');
        if (!target) return;

        trackEvent(target.dataset.analyticsEvent, {
            placement: cleanText(target.dataset.analyticsPlacement || 'unknown'),
            link_text: cleanText(target.textContent),
        });
    });
}

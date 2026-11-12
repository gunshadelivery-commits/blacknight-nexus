import './style.css';
import { GAS_URL, SHOP_NAME, SHOP_VERSION, buildLineUrl } from './config.js';
import { getLanguage, t } from './i18n.js';
import { esc, jsArg } from './catalog.js';
import { buildAnalyticsItem, buildCartItems, initAnalyticsTracking, trackEvent } from './analytics.js';

let products = []; // Keyed by Name
let cart = [];
let currentCategory = "All";
let currentLineUrl = "";
// จ่ายเงินตอนรับสินค้าเท่านั้น · ค่าบริการจัดส่งจริง 50–80 บาทตามระยะทาง (ไม่เกิน 100) เว็บบวกค่าเริ่มต้นไว้ ร้านยืนยันยอดสุดท้ายทาง LINE
const SERVICE_FEE = 50;
const PAYMENT_LABEL = 'เก็บเงินปลายทาง';

// --- CUSTOM UI: TOAST ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✨' : '❌';
    const iconEl = document.createElement('span');
    iconEl.textContent = icon;
    const textEl = document.createElement('span');
    textEl.textContent = message;
    toast.append(iconEl, ' ', textEl);
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Secret Admin Access
let logoClickCount = 0;
let logoClickTimeout;
function handleLogoClick() {
    logoClickCount++;
    clearTimeout(logoClickTimeout);
    if (logoClickCount >= 5) { window.location.href = "admin.html"; logoClickCount = 0; }
    logoClickTimeout = setTimeout(() => { logoClickCount = 0; }, 2000);
}

function loadProductsFromSheet() {
    fetch(`${GAS_URL}?action=getProducts&t=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
            if (!data || data.error || data.length < 2) {
                showToast(t('store.product.noData'), "error");
                return;
            }
            
            const grouped = {};
            data.slice(1).forEach(row => {
                const name = row[0];
                const cat = row[9] || "";
                
                // เฉพาะหมวดหมู่ Accessories เท่านั้น
                if (cat.toLowerCase() !== "accessories" && cat !== "อุปกรณ์") return;
                if (!name || name.trim() === "") return;
                
                if (!grouped[name]) {
                    grouped[name] = {
                        name: name,
                        note: row[3] || '',
                        image: row[4] || '',
                        category: cat,
                        status: (row[6] || '').toString().trim(),
                        variants: [],
                        selectedVariantIdx: 0, // เดิมไม่ได้ตั้งค่า → variants[undefined].stock พัง หน้าอุปกรณ์ไม่แสดงสินค้าเลย
                        totalSold: 0,
                        aiType: cat
                    };
                }

                const size = row[1] || 'Standard';
                const price = parseFloat(row[2]) || 0;
                const stock = parseInt(row[7]) || 0;
                const sold = parseInt(row[8]) || 0;

                grouped[name].variants.push({ size, price, stock, sold_count: sold });
                grouped[name].totalSold += sold;
            });

            products = Object.values(grouped);
            renderProducts();
        })
        .catch(err => {
            console.error("Fetch Accessories Error:", err);
            showToast(t('store.product.loadError'), "error");
        });
}

function renderProducts(filter = "") {
    const grid = document.getElementById("productList");
    if (!grid) return;
    grid.innerHTML = "";
    let q = "";
    if (typeof filter === "string") q = filter.toLowerCase();
    
    const filtered = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(q) || p.note.toLowerCase().includes(q);
        const matchesCategory = currentCategory === "All" || p.aiType === currentCategory;
        return matchesSearch && matchesCategory;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-2 text-center text-slate-600 py-10">${t('store.catalog.emptyTitle')}</div>`;
        return;
    }

    filtered.forEach((p) => {
        const card = document.createElement("div");
        card.className = "bg-white rounded-3xl p-3 border border-slate-50 flex flex-col animate-in";
        const isOutOfStock = p.status === 'หมด' || p.status === 'sold out' || p.status === '0';
        const variant = p.variants[p.selectedVariantIdx];
        const isVariantOutOfStock = variant.stock <= 0;
        const nameArg = jsArg(p.name);

        card.innerHTML = `
            <div class="aspect-square bg-slate-50 rounded-2xl mb-3 relative overflow-hidden">
                <img src="${esc(p.image)}" alt="${esc(p.name)}" width="300" height="300" loading="lazy" decoding="async" class="w-full h-full object-cover ${isOutOfStock || isVariantOutOfStock ? 'grayscale opacity-50' : ''}" onerror="this.outerHTML='<span class=\\'text-3xl flex items-center justify-center h-full\\'>📦</span>';" />
                ${(isOutOfStock || isVariantOutOfStock) ? `<div class="absolute inset-0 flex items-center justify-center"><span class="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">${t('store.product.outOfStock')}</span></div>` : ''}
            </div>
            <div class="flex-1 flex flex-col">
                <h3 class="font-bold text-slate-800 text-sm line-clamp-1">${esc(p.name)}</h3>
                <p class="text-[10px] text-slate-400 mt-0.5 line-clamp-1">${esc(p.note)}</p>
                
                <div class="mt-2 flex flex-wrap gap-1">
                    ${p.variants.length > 1 ? p.variants.map((v, vIdx) => `
                        <button onclick="window.selectVariant(${nameArg}, ${vIdx})" class="px-2 py-0.5 text-[9px] border rounded-lg transition-all font-bold ${p.selectedVariantIdx === vIdx ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white text-slate-400 border-slate-100'}">
                            ${esc(v.size)}
                        </button>
                    `).join('') : ''}
                </div>

                <div class="mt-auto pt-3 flex items-center justify-between">
                    <p class="font-black text-indigo-600 text-sm">${variant.price.toLocaleString()} ฿</p>
                    <button onclick="window.addToCart(${nameArg}, ${p.selectedVariantIdx})" ${isOutOfStock || isVariantOutOfStock ? 'disabled' : ''} aria-label="${esc(p.name)} +" class="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition active:scale-90 disabled:opacity-20 shadow-md">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function selectVariant(pName, vIdx) {
    const product = products.find(p => p.name === pName);
    if (product) {
        product.selectedVariantIdx = vIdx;
        renderProducts();
    }
}

function switchCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll('.category-tab').forEach(t => {
        t.classList.remove('category-tab-active');
        t.classList.add('category-tab-inactive');
    });
    const tabEl = document.getElementById('tab-' + cat);
    if(tabEl) {
        tabEl.classList.remove('category-tab-inactive');
        tabEl.classList.add('category-tab-active');
    }
    renderProducts();
}

function addToCart(pName, vIdx) {
    const product = products.find(p => p.name === pName);
    if (!product) return;
    const variant = product.variants[vIdx];
    const existing = cart.find(item => item.name === product.name && item.size === variant.size);
    if (existing) existing.qty++;
    else cart.push({ name: product.name, size: variant.size, price: variant.price, qty: 1, image: product.image, category: product.aiType || '' });
    trackEvent('add_to_cart', { currency: 'THB', value: Number(variant.price) || 0, items: [buildAnalyticsItem(product, variant)] });
    updateCartUI();
    toggleCart(true);
}

function toggleCart(force = null) {
    const sidebar = document.getElementById("cartSidebar");
    const content = document.getElementById("cartContent");
    const isOpen = force !== null ? force : sidebar.classList.contains("hidden");
    if (isOpen) {
        sidebar.classList.remove("hidden");
        setTimeout(() => content.classList.remove("translate-y-full"), 10);
    } else {
        content.classList.add("translate-y-full");
        setTimeout(() => sidebar.classList.add("hidden"), 300);
    }
}

function updateCartUI() {
    const container = document.getElementById("cartItems");
    const badge = document.getElementById("cartCount");
    const totalEl = document.getElementById("cartTotal");
    const count = cart.reduce((sum, i) => sum + i.qty, 0);
    badge.textContent = count;
    badge.classList.toggle("hidden", count === 0);
    let total = 0;
    let cartHTML = '';

    if (cart.length === 0) {
        cartHTML = `<div class="text-center py-20 text-slate-600">${t('store.cart.empty')}</div>`;
    } else {
        cartHTML = cart.map((item, idx) => {
            total += item.price * item.qty;
            return `
                <div class="flex gap-4 items-center">
                    <img src="${esc(item.image)}" alt="" width="64" height="64" class="w-16 h-16 object-cover rounded-2xl bg-slate-50" onerror="this.outerHTML='📦';">
                    <div class="flex-1">
                        <h4 class="font-bold text-slate-800 text-sm">${esc(item.name)}</h4>
                        <p class="text-xs text-indigo-600 font-black mt-1">${item.price.toLocaleString()} ฿</p>
                    </div>
                    <div class="flex items-center gap-1 bg-white border border-slate-200 rounded-full p-1 shadow-sm">
                        <button onclick="window.updateQty(${idx}, -1)" class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-600 transition active:scale-90">-</button>
                        <span class="text-xs font-black text-slate-900 min-w-[24px] text-center">${item.qty}</span>
                        <button onclick="window.updateQty(${idx}, 1)" class="w-7 h-7 flex items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-800 transition active:scale-90 shadow-sm">+</button>
                    </div>
                </div>`;
        }).join('');
    }

    container.innerHTML = cartHTML;
    totalEl.textContent = total.toLocaleString() + " ฿";
}

function updateQty(idx, change) {
    cart[idx].qty += change;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
    updateCartUI();
}

function goToCheckout() {
    if (cart.length === 0) return showToast(t('store.cart.empty'), "error");
    trackEvent('begin_checkout', { currency: 'THB', value: cart.reduce((sum, i) => sum + i.price * i.qty, 0), items: buildCartItems(cart) });
    document.getElementById('checkoutModal').classList.remove('hidden');
    updateCheckoutSummary();
}
function closeCheckout() { document.getElementById('checkoutModal').classList.add('hidden'); }


function updateCheckoutSummary() {
    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const total = subtotal + SERVICE_FEE;
    document.getElementById('checkoutSubtotal').textContent = `${subtotal.toLocaleString()} ฿`;
    document.getElementById('checkoutFee').textContent = `${SERVICE_FEE} ฿`;
    document.getElementById('checkoutTotal').textContent = `${total.toLocaleString()} ฿`;
    const btn = document.getElementById('submitOrderBtn');
    if (btn && !btn.disabled) btn.textContent = t('store.checkout.confirmCodTotal', { total: total.toLocaleString() });
}

async function submitOrder() {
    const btn = document.getElementById('submitOrderBtn');
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const email = (document.getElementById('custEmail')?.value || '').trim();
    const address = document.getElementById('custAddress').value.trim();

    if (cart.length === 0) return showToast(t('store.cart.empty'), "error");
    if (!name || !phone || !address) return showToast(t('store.checkout.required'), "error");
    if (phone.replace(/\D/g, '').length < 8) return showToast(t('store.checkout.phoneInvalid'), "error");

    btn.disabled = true;
    btn.textContent = t('store.checkout.saving');

    try {
        const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
        const finalTotal = subtotal + SERVICE_FEE;
        const orderItems = cart.map(i => `${i.name} [${i.size}] x${i.qty}`).join(', ');
        const itemsArray = cart.map(i => ({ name: i.name, size: i.size, qty: i.qty }));

        // บันทึกลงชีต Orders (ถ้าพลาด ลูกค้ายังไป LINE พร้อมรายการครบ)
        try {
            await fetch(GAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    action: "log", name, phone, email, address, mapUrl: "-",
                    items: orderItems, itemsArray: itemsArray, total: finalTotal, slipUrl: "COD (ไม่แนบสลิป)",
                    paymentMethod: PAYMENT_LABEL,
                    lang: getLanguage(),
                    status: "รอดำเนินการ"
                })
            });
        } catch (e) {
            console.warn("บันทึกออเดอร์ลงชีตไม่สำเร็จ (ลูกค้ายังส่งออเดอร์ทาง LINE ได้):", e);
        }

        const itemsDetail = cart.map(i => `- ${i.name.toUpperCase()} [${i.size}] x${i.qty}`).join('\n');
        const lineMsg = `✨ ออเดอร์ใหม่! [${SHOP_NAME} v${SHOP_VERSION}]
💰 วิธีชำระ: ${PAYMENT_LABEL} (จ่ายตอนรับของ)
👤 ผู้รับ: ${name}
📞 เบอร์: ${phone}
🏠 ที่อยู่: ${address}

🛒 รายการ:
${itemsDetail}
ค่าสินค้า: ${subtotal.toLocaleString()} บาท
ค่าบริการจัดส่ง (เริ่มต้น): ${SERVICE_FEE} บาท
💰 ยอดรวมประมาณ: ${finalTotal.toLocaleString()} บาท
(รอร้านยืนยันยอดสุดท้ายและเวลาจัดส่ง)`;

        currentLineUrl = buildLineUrl(lineMsg);
        // ส่งเฉพาะยอดและรายการสินค้า — ห้ามใส่ชื่อ เบอร์ อีเมล ที่อยู่ลูกค้า
        trackEvent('purchase', {
            transaction_id: window.crypto?.randomUUID?.() || `order-${Date.now()}`,
            currency: 'THB',
            value: finalTotal,
            shipping: SERVICE_FEE,
            payment_type: 'cod',
            items: buildCartItems(cart),
        });
        document.getElementById('finalOrderTotal').textContent = finalTotal.toLocaleString() + " ฿";
        document.getElementById('successModal').classList.remove('hidden');
        import('canvas-confetti').then(({ default: confetti }) => confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } })).catch(() => {});
        setTimeout(() => {
            if (!currentLineUrl) return;
            trackEvent('contact_line', { placement: 'accessories_order_success_auto' });
            window.location.href = currentLineUrl;
        }, 3000);
    } catch (e) {
        showToast(t('store.checkout.error'), "error");
        btn.disabled = false;
        updateCheckoutSummary();
    }
}

window.handleLogoClick = handleLogoClick;
window.toggleCart = toggleCart;
window.switchCategory = switchCategory;
window.selectVariant = selectVariant;
window.addToCart = addToCart;
window.updateQty = updateQty;
window.goToCheckout = goToCheckout;
window.closeCheckout = closeCheckout;
window.submitOrder = submitOrder;
window.redirectToLine = () => {
    if (!currentLineUrl) return;
    trackEvent('contact_line', { placement: 'accessories_order_success_button' });
    window.location.href = currentLineUrl;
};

document.addEventListener('DOMContentLoaded', () => {
    initAnalyticsTracking();
    loadProductsFromSheet(renderProducts);
});

// สลับภาษา: วาดส่วนที่ JS สร้างใหม่ด้วยภาษาที่เลือก
document.addEventListener('cf:languagechange', () => {
    renderProducts();
    updateCartUI();
    updateCheckoutSummary();
});

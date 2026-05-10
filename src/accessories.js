import './style.css';
import Papa from 'papaparse';
import confetti from 'canvas-confetti';
import { SHEET_CSV_URL, GAS_URL, SHOP_NAME, SHOP_VERSION, buildLineUrl, getImgbbUploadUrl } from './config.js';

let products = []; // Keyed by Name
let cart = [];
let currentCategory = "All";
let currentLineUrl = "";
let selectedPaymentMethod = "transfer"; // "transfer" or "cod"
const COD_FEE = 50;

// --- GENERIC CATEGORY CLASSIFIER ---
function classifyItem(name) {
    const n = name.toLowerCase();
    if (["phone", "laptop", "watch", "tech", "gadget"].some(s => n.includes(s))) return "Electronics";
    if (["shirt", "pants", "dress", "bag", "shoe"].some(i => n.includes(i))) return "Fashion";
    if (["chair", "table", "lamp", "sofa", "bed"].some(h => n.includes(h))) return "Home";
    return "Other";
}

// --- CUSTOM UI: TOAST ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✨' : '❌';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
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

function loadProductsFromSheet(callback) {
    const cacheBuster = `?t=${Date.now()}`;
    Papa.parse(SHEET_CSV_URL + cacheBuster, {
        download: true, header: true,
        complete: function(results) {
            const data = results.data;
            const grouped = {};
            
            data.forEach(item => {
                if(!item.name || item.name.trim() === "") return;
                if(!grouped[item.name]) {
                    let tags = [];
                    if (item.tags) tags = item.tags.split(',').map(t => t.trim()).filter(t => t !== '');
                    grouped[item.name] = {
                        name: item.name,
                        note: item.note || '',
                        image: item.image || '',
                        tags: tags,
                        status: (item.status || '').trim().toLowerCase(),
                        variants: [],
                        selectedVariantIdx: 0,
                        totalSold: 0,
                        aiType: item["หมวดหมู่"] || classifyItem(item.name)
                    };
                }

                const stock = parseInt(item.stock || item.Stock) || 0;
                const price = parseFloat(item.price || item.Price) || 0;
                const size = item.size || item.Size || 'Standard';
                const sold = parseInt(item.sold || item.Sold || item.sold_count) || 0;

                grouped[name].variants.push({ size, price, stock, sold_count: sold });
                grouped[name].totalSold += sold;
            });

            products = Object.values(grouped);
            renderProducts();
        })
        .catch(err => {
            console.error("Fetch Accessories Error:", err);
            showToast("โหลดข้อมูลสินค้าล้มเหลว", "error");
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
        grid.innerHTML = `<div class="col-span-2 text-center text-slate-400 py-10">ไม่พบสินค้าในหมวดหมู่นี้</div>`;
        return;
    }

    filtered.forEach((p) => {
        const card = document.createElement("div");
        card.className = "bg-white rounded-3xl p-3 border border-slate-50 flex flex-col animate-in";
        const isOutOfStock = p.status === 'หมด' || p.status === 'sold out' || p.status === '0';
        const variant = p.variants[p.selectedVariantIdx];
        const isVariantOutOfStock = variant.stock <= 0;
        const pNameEscaped = p.name.replace(/'/g, "\\'");

        card.innerHTML = `
            <div class="aspect-square bg-slate-50 rounded-2xl mb-3 relative overflow-hidden">
                <img src="${p.image}" class="w-full h-full object-cover ${isOutOfStock || isVariantOutOfStock ? 'grayscale opacity-50' : ''}" onerror="this.outerHTML='<span class=\\'text-3xl flex items-center justify-center h-full\\'>📦</span>';" />
                ${(isOutOfStock || isVariantOutOfStock) ? `<div class="absolute inset-0 flex items-center justify-center"><span class="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">หมด</span></div>` : ''}
            </div>
            <div class="flex-1 flex flex-col">
                <h3 class="font-bold text-slate-800 text-sm line-clamp-1">${p.name}</h3>
                <p class="text-[10px] text-slate-400 mt-0.5 line-clamp-1">${p.note}</p>
                
                <div class="mt-2 flex flex-wrap gap-1">
                    ${p.variants.length > 1 ? p.variants.map((v, vIdx) => `
                        <button onclick="window.selectVariant('${pNameEscaped}', ${vIdx})" class="px-2 py-0.5 text-[9px] border rounded-lg transition-all font-bold ${p.selectedVariantIdx === vIdx ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white text-slate-400 border-slate-100'}">
                            ${v.size}
                        </button>
                    `).join('') : ''}
                </div>

                <div class="mt-auto pt-3 flex items-center justify-between">
                    <p class="font-black text-indigo-600 text-sm">${variant.price.toLocaleString()} ฿</p>
                    <button onclick="window.addToCart('${pNameEscaped}', ${p.selectedVariantIdx})" ${isOutOfStock || isVariantOutOfStock ? 'disabled' : ''} class="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition active:scale-90 disabled:opacity-20 shadow-md">
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
    else cart.push({ name: product.name, size: variant.size, price: variant.price, qty: 1, image: product.image });
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
        cartHTML = `<div class="text-center py-20 text-slate-400">รถเข็นว่างเปล่า</div>`;
    } else {
        cartHTML = cart.map((item, idx) => {
            total += item.price * item.qty;
            return `
                <div class="flex gap-4 items-center">
                    <img src="${item.image}" class="w-16 h-16 object-cover rounded-2xl bg-slate-50" onerror="this.outerHTML='📦';">
                    <div class="flex-1">
                        <h4 class="font-bold text-slate-800 text-sm">${item.name}</h4>
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
    document.getElementById('checkoutModal').classList.remove('hidden'); 
    loadAndDisplayPaymentMethods();
}
function closeCheckout() { document.getElementById('checkoutModal').classList.add('hidden'); }


function updateConfirmButtonText() {
    const btn = document.getElementById('submitOrderOrderBtn') || document.getElementById('submitOrderBtn');
    if (!btn) return;
    let subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const finalTotal = selectedPaymentMethod === 'cod' ? subtotal + COD_FEE : subtotal;
    
    if (selectedPaymentMethod === 'cod') {
        btn.innerHTML = `ยืนยันสั่งซื้อ (ยอดรวม ${finalTotal.toLocaleString()} ฿) 🛸`;
    } else {
        btn.innerHTML = `ยืนยันและส่งข้อมูล (${finalTotal.toLocaleString()} ฿) 🛸`;
    }
}

function previewSlip(input) {
    if (input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            document.getElementById('slipPreview').src = e.target.result;
            document.getElementById('slipPreview').classList.remove('hidden');
            document.getElementById('slipPlaceholder').classList.add('hidden');
        };
        reader.readAsDataURL(input.files[0]);
    }
}

async function loadAndDisplayPaymentMethods() {
    const container = document.getElementById('paymentMethodsContainer');
    container.innerHTML = `<div class="text-center py-4 text-slate-400 text-xs animate-pulse">กำลังโหลดข้อมูลชำระเงิน...</div>`;
    try {
        const res = await fetch(`${GAS_URL}?action=getBank`);
        const data = await res.json();
        const promptpayList = data.length > 0 ? data.slice(1).map(row => ({
            name: row[0], bank: row[1], number: row[2], qrImage: row[3], status: row[4] || 'active'
        })) : [];
        const activePromptpay = promptpayList.filter(pp => pp.status === 'active');
        if (activePromptpay.length === 0) {
            container.innerHTML = `<div class="text-center py-4 text-slate-400 text-xs">ยังไม่มีข้อมูลการชำระเงิน</div>`;
            return;
        }
        container.innerHTML = activePromptpay.map(pp => `
            <div class="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:border-indigo-200 transition group">
                <div class="flex gap-4">
                    ${pp.qrImage ? `<img src="${pp.qrImage}" class="w-16 h-16 object-cover rounded-xl border border-slate-100 shadow-sm">` : ''}
                    <div class="flex-1">
                        <h5 class="font-bold text-slate-800 text-xs mb-1">${pp.name}</h5>
                        <p class="text-[10px] text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded inline-block">${pp.number}</p>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) { container.innerHTML = `<div class="text-center py-4 text-red-400 text-xs">โหลดข้อมูลล้มเหลว</div>`; }
}

function updatePaymentMethod(method) {
    selectedPaymentMethod = method;
    const btnTransfer = document.getElementById('payTransfer');
    const btnCOD = document.getElementById('payCOD');
    const details = document.getElementById('paymentDetailsSection');
    const slipSection = document.getElementById('slipUploadSection');

    if (method === 'transfer') {
        btnTransfer.className = "flex flex-col items-center gap-2 p-4 rounded-3xl border-2 border-slate-900 bg-white transition shadow-sm";
        btnCOD.className = "flex flex-col items-center gap-2 p-4 rounded-3xl border-2 border-slate-50 bg-slate-50 text-slate-400 transition";
        details.classList.remove('hidden');
        slipSection.classList.remove('hidden');
    } else {
        btnTransfer.className = "flex flex-col items-center gap-2 p-4 rounded-3xl border-2 border-slate-50 bg-slate-50 text-slate-400 transition";
        btnCOD.className = "flex flex-col items-center gap-2 p-4 rounded-3xl border-2 border-slate-900 bg-white transition shadow-sm text-slate-900";
        details.classList.add('hidden');
        slipSection.classList.add('hidden');
    }
    updateConfirmButtonText();
}

async function submitOrder() {
    const btn = document.getElementById('submitOrderBtn');
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    const slip = document.getElementById('slipInput').files[0];

    if(!name || !phone || !address) return showToast("กรุณากรอกข้อมูลให้ครบ", "error");
    if(selectedPaymentMethod === 'transfer' && !slip) return showToast("กรุณาแนบสลิป", "error");
    
    btn.disabled = true;
    btn.textContent = "กำลังดำเนินการ...";

    try {
        let slipUrl = "-";
        if (selectedPaymentMethod === 'transfer') {
            const formData = new FormData(); formData.append('image', slip);
            const imgRes = await fetch(getImgbbUploadUrl(), { method: 'POST', body: formData });
            const imgData = await imgRes.json();
            if(!imgData.success) throw new Error("Upload Fail");
            slipUrl = imgData.data.url;
        }

        const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
        const finalTotal = selectedPaymentMethod === 'cod' ? subtotal + COD_FEE : subtotal;
        const orderItems = cart.map(i => `${i.name} [${i.size}] x${i.qty}`).join(', ');
        const itemsArray = cart.map(i => ({ name: i.name, size: i.size, qty: i.qty }));

        await fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({
                action: "log", name, phone, address, mapUrl: "-", 
                items: orderItems, itemsArray: itemsArray, total: finalTotal, slipUrl: slipUrl, 
                paymentMethod: selectedPaymentMethod === 'cod' ? 'เก็บเงินปลายทาง' : 'โอนเงิน',
                status: "รอดำเนินการ"
            })
        });

        const itemsDetail = cart.map(i => `- ${i.name.toUpperCase()} x${i.qty}`).join('\n');
        const lineMsg = `✨ ออเดอร์ใหม่! [${SHOP_NAME} v${SHOP_VERSION}]
💰 วิธีชำระ: ${selectedPaymentMethod === 'cod' ? 'เก็บเงินปลายทาง' : 'โอนเงิน'}
👤 ผู้รับ: ${name}
📞 เบอร์: ${phone}
🏠 ที่อยู่: ${address}

🛒 รายการ:
${itemsDetail}
💰 ยอดรวม: ${finalTotal.toLocaleString()} บาท

🖼️ สลิป: ${slipUrl}`;
        
        currentLineUrl = buildLineUrl(lineMsg);
        document.getElementById('finalOrderTotal').textContent = finalTotal.toLocaleString() + " ฿";
        document.getElementById('successModal').classList.remove('hidden');
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        setTimeout(() => { if(currentLineUrl) window.location.href = currentLineUrl; }, 3000);
    } catch(e) { 
        showToast("เกิดข้อผิดพลาด", "error"); 
        btn.disabled = false; 
        btn.textContent = "สั่งซื้ออีกครั้ง"; 
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
window.previewSlip = previewSlip;
window.updatePaymentMethod = updatePaymentMethod;
window.submitOrder = submitOrder;
window.redirectToLine = () => { if(currentLineUrl) window.location.href = currentLineUrl; };

document.addEventListener('DOMContentLoaded', () => { loadProductsFromSheet(renderProducts); });

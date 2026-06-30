import './style.css';
import Papa from 'papaparse';
import confetti from 'canvas-confetti';
import { SHEET_CSV_URL, GAS_URL, SHOP_NAME, SHOP_VERSION, buildLineUrl, getImgbbUploadUrl, getLineOaUrl } from './config.js';
import { isLoggedIn } from './auth.js';

let products = [];
let cart = [];
let currentCategory = "All";
let currentLineUrl = "";
let selectedPaymentMethod = "transfer";
const COD_FEE = 50;

function classifyItem(name) {
    const n = name.toLowerCase();
    // ไวเบรเตอร์ / ไข่สั่น
    if (["ไข่สั่น", "ไข่", "vibrat", "วิบ", "egg"].some(s => n.includes(s))) return "ไข่สั่น";
    // ดิลโด้
    if (["ดิลโด้", "ดิวโด้", "dildo", "ควยปลอม", "แท่ง"].some(s => n.includes(s))) return "ดิลโด้";
    // เจลหล่อลื่น / ถุงยาง
    if (["เจล", "หล่อลื่น", "lube", "ถุงยาง", "condom"].some(s => n.includes(s))) return "เจล & ถุงยาง";
    // BDSM
    if (["bdsm", "มัด", "ตรวน", "แส้", "กุญแจ", "bondage", "sm", "ปิดตา"].some(s => n.includes(s))) return "BDSM";
    // สินค้าผู้ชาย
    if (["จิ๋ม", "ปลอกเพิ่ม", "sleeve", "masturbat", "กระป๋อง", "อากาศ", "เพิ่มขนาด"].some(s => n.includes(s))) return "สำหรับผู้ชาย";
    // Anal / Butt plug
    if (["anal", "butt", "ทวาร", "ประตูหลัง", "plug"].some(s => n.includes(s))) return "Anal";
    // ชุดชั้นใน / เซ็กซี่
    if (["lingerie", "ชุด", "sexy", "stocking", "bikini"].some(s => n.includes(s))) return "ชุดเซ็กซี่";
    return "อื่นๆ";
}

function isPremiumProduct(product) {
    const hasPremiumTag = product.tags && product.tags.some(t =>
        ["premium", "พรีเมียม", "luxury", "brand", "branded"].includes(t.toLowerCase())
    );
    const highPrice = product.variants && product.variants.some(v => v.price >= 1200);
    return hasPremiumTag || highPrice;
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
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

let touchStart = 0;
let isRefreshing = false;
document.addEventListener('touchstart', e => { touchStart = e.touches[0].pageY; }, { passive: true });
document.addEventListener('touchmove', e => {
    const touchMove = e.touches[0].pageY;
    if (window.scrollY === 0 && touchMove > touchStart + 80 && !isRefreshing) {
        isRefreshing = true;
        document.body.classList.add('ptr-loading');
        if (window.navigator.vibrate) window.navigator.vibrate(10);
        loadProductsFromSheet(() => {
            renderProducts();
            initRevealObserver();
            setTimeout(() => {
                document.body.classList.remove('ptr-loading');
                isRefreshing = false;
                showToast("อัปเดตข้อมูลเรียบร้อย!");
            }, 500);
        });
    }
}, { passive: true });

let logoClickCount = 0;
let logoClickTimeout;
function handleLogoClick() {
    logoClickCount++;
    clearTimeout(logoClickTimeout);
    if (logoClickCount >= 5) { window.location.href = "admin.html"; logoClickCount = 0; }
    logoClickTimeout = setTimeout(() => { logoClickCount = 0; }, 2000);
}

function loadProductsFromSheet(callback) {
    fetch(`${GAS_URL}?action=getProducts&t=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
            if (!data || data.error || data.length < 2) {
                showToast("ไม่พบข้อมูลสินค้า", "error");
                return;
            }
            
            const grouped = {};
            data.slice(1).forEach(row => {
                const name = row[0];
                if (!name || name.trim() === "") return;
                
                if (!grouped[name]) {
                    let tags = [];
                    const rawTags = row[5] || "";
                    if (rawTags) tags = rawTags.toString().split(',').map(t => t.trim()).filter(t => t !== '');
                    
                    let rawImages = (row[4] || '').toString().split(',').map(img => img.trim()).filter(img => img !== '');
                    if (rawImages.length === 0) rawImages = [''];
                    rawImages = rawImages.slice(0, 6);
                    
                    grouped[name] = {
                        name: name,
                        size: row[1],
                        price: parseFloat(row[2]) || 0,
                        note: row[3] || '',
                        image: rawImages[0],
                        images: rawImages,
                        tags: tags,
                        status: (row[6] || '').toString().trim().toLowerCase(),
                        variants: [],
                        selectedVariantIdx: 0,
                        totalSold: 0,
                        aiType: row[9] || classifyItem(name)
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
            if (callback) callback(products);
        })
        .catch(err => {
            console.error("Fetch Products Error:", err);
            showToast("โหลดข้อมูลสินค้าล้มเหลว", "error");
        });
}

function initRevealObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

function renderProducts(filter = "") {
    try {
        const grid = document.getElementById("productList");
        if (!grid) return; 
        grid.innerHTML = "";
        
        let q = "";
        if (typeof filter === "string") q = filter.toLowerCase();

        if (products.length === 0) {
            grid.innerHTML = `<div class="col-span-2 text-center text-white/40 py-20 animate-pulse">กำลังโหลดข้อมูลสินค้า...</div>`;
            return;
        }

        const filtered = products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(q) || (p.note && p.note.toLowerCase().includes(q));
            const matchesCategory = currentCategory === "All"
                || (currentCategory === "พรีเมียม" && isPremiumProduct(p))
                || p.aiType === currentCategory;
            return matchesSearch && matchesCategory;
        });

        if (filtered.length === 0) {
            grid.innerHTML = `<div class="col-span-2 text-center text-white/40 py-20">ไม่พบสินค้าในหมวดหมู่นี้</div>`;
            return;
        }

        filtered.forEach((p, idx) => {
            const card = document.createElement("div");
            const pNameEscaped = p.name.replace(/'/g, "\\'");
            const premium = isPremiumProduct(p);
            card.className = `rounded-3xl shadow-lg overflow-hidden flex flex-col reveal cursor-pointer hover:scale-[1.02] transition-transform duration-300 ${premium ? 'premium-card' : 'glass-card'}`;
            card.style.transitionDelay = `${(idx % 4) * 100}ms`;
            card.onclick = (e) => {
                if(e.target.closest('button') || e.target.closest('a')) return;
                window.openProductDetails(p.name);
            };
            const isOutOfStock = p.status === 'หมด' || p.status === 'sold out' || p.status === '0';

            const variant = p.variants[p.selectedVariantIdx];
            const isVariantOutOfStock = variant.stock <= 0;

            const priorityAttr = products.indexOf(p) < 4 ? 'fetchpriority="high"' : 'loading="lazy"';

            card.innerHTML = `
                <div class="h-44 bg-white/5 flex items-center justify-center relative overflow-hidden">
                    <img src="${p.image}"
                         alt="${p.name}"
                         ${priorityAttr}
                         class="w-full h-full object-cover img-fade-in ${isOutOfStock || isVariantOutOfStock ? 'grayscale opacity-30' : ''}"
                         onload="this.classList.add('img-loaded')"
                         onerror="this.outerHTML='<span class=\\'text-3xl\\'>📦</span>';" />
                    <div class="absolute top-2 left-2 flex flex-col gap-1">
                        ${premium ? `<span class="premium-badge text-[9px] px-2 py-0.5 rounded-full font-black shadow-lg w-fit flex items-center gap-1">👑 PREMIUM</span>` : (p.tags.length ? `<span class="bg-indigo-500/80 backdrop-blur-md text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow-sm w-fit">${p.tags[0]}</span>` : '')}
                        ${p.totalSold > 0 ? `<span class="bg-orange-500/80 backdrop-blur-md text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow-sm w-fit">ขายแล้ว ${p.totalSold}+</span>` : ''}
                    </div>
                    ${(isOutOfStock || isVariantOutOfStock) ? `<div class="absolute inset-0 bg-black/60 flex items-center justify-center transition-all opacity-100"><span class="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">OUT OF STOCK</span></div>` : ''}
                </div>
                <div class="p-3 flex-1 flex flex-col">
                    <div class="flex-1">
                        <h3 class="font-bold ${premium ? 'text-amber-200' : 'text-white'} leading-tight text-sm">${p.name}</h3>
                        <p class="text-[10px] text-white/40 mt-1 line-clamp-1">${p.note}</p>
                    </div>

                    <div class="mt-3 flex flex-wrap gap-1">
                        ${p.variants.map((v, vIdx) => `
                            <button onclick="window.selectVariant('${pNameEscaped}', ${vIdx})" class="px-3 py-1.5 text-[10px] border rounded-lg transition-all font-bold min-h-[32px] ${p.selectedVariantIdx === vIdx ? 'bg-white/20 border-white/40 text-white' : 'bg-black/20 text-white/30 border-white/5'} ${v.stock <= 0 ? 'opacity-20' : ''}">
                                ${v.size}
                            </button>
                        `).join('')}
                    </div>
                    ${variant.stock > 0 && variant.stock <= 5 ? `<p class="text-[9px] text-red-400 font-bold mt-2">🔥 Only ${variant.stock} left!</p>` : ''}

                    <div class="mt-3 flex items-center justify-between">
                        <p class="font-bold ${premium ? 'text-amber-300' : 'text-white'} text-sm">${variant.price.toLocaleString()} ฿</p>
                        <button onclick="window.addToCart('${pNameEscaped}', ${p.selectedVariantIdx})" ${isOutOfStock || isVariantOutOfStock ? 'disabled' : ''} class="${premium ? 'bg-amber-400/20 hover:bg-amber-400/40 border border-amber-400/30' : 'bg-white/10 hover:bg-white/20'} text-white p-2 rounded-xl transition-all disabled:opacity-10">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                        </button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
        
        initRevealObserver();
    } catch (err) {
        console.error("Render Error:", err);
        showToast("เกิดข้อผิดพลาดในการแสดงสินค้า", "error");
    }
}

function switchCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll('#categoryTabs button').forEach(btn => {
        btn.classList.remove('category-active');
        btn.classList.add('category-inactive');
    });
    const activeTab = document.getElementById('tab-' + cat);
    if(activeTab) {
        activeTab.classList.remove('category-inactive');
        activeTab.classList.add('category-active');
    }
    const searchInput = document.getElementById('searchInput');
    renderProducts(searchInput ? searchInput.value : "");
}

function selectVariant(pName, vIdx) {
    const product = products.find(p => p.name === pName);
    if (product) {
        product.selectedVariantIdx = vIdx;
        const searchInput = document.getElementById('searchInput');
        renderProducts(searchInput ? searchInput.value : "");
    }
}

function openProductDetails(pName) {
    const product = products.find(p => p.name === pName);
    if (!product) return;
    
    const modal = document.getElementById('productModal');
    if (!modal) return;
    
    const variant = product.variants[product.selectedVariantIdx];
    const isOutOfStock = product.status === 'หมด' || product.status === 'sold out' || product.status === '0' || variant.stock <= 0;
    
    document.getElementById('modalMainImage').src = product.image;
    
    const galleryContainer = document.getElementById('modalGallery');
    galleryContainer.innerHTML = '';
    if (product.images && product.images.length > 1) {
        product.images.forEach((imgSrc) => {
            if (!imgSrc) return;
            const thumb = document.createElement('img');
            thumb.src = imgSrc;
            thumb.className = "w-16 h-16 object-cover rounded-xl cursor-pointer hover:opacity-80 transition border-2 border-transparent hover:border-white/50";
            thumb.onclick = () => window.changeProductImage(imgSrc);
            galleryContainer.appendChild(thumb);
        });
    }

    const premium = isPremiumProduct(product);
    const nameEl = document.getElementById('modalProductName');
    nameEl.textContent = product.name;
    nameEl.className = premium
        ? 'text-xl font-black text-amber-200 leading-snug'
        : 'text-xl font-black text-white leading-snug';

    const premiumBannerEl = document.getElementById('modalPremiumBanner');
    if (premiumBannerEl) {
        premiumBannerEl.style.display = premium ? 'flex' : 'none';
    }

    document.getElementById('modalProductNote').textContent = product.note || '';
    
    const priceEl = document.getElementById('modalProductPrice');
    const actionEl = document.getElementById('modalActionContainer');
    const variantsEl = document.getElementById('modalVariants');
    const pNameEsc = product.name.replace(/'/g, "\\'");

    priceEl.textContent = `${variant.price.toLocaleString()} ฿`;
    priceEl.className = premium ? 'text-2xl font-black text-amber-300' : 'text-2xl font-black text-white';

    // Render variant buttons
    if (variantsEl) {
        variantsEl.innerHTML = product.variants.map((v, vIdx) => `
            <button onclick="window.selectModalVariant('${pNameEsc}', ${vIdx})"
                class="px-4 py-2 text-sm border rounded-xl font-bold min-h-[40px] transition-all
                    ${product.selectedVariantIdx === vIdx
                        ? (premium ? 'bg-amber-400/30 border-amber-400/60 text-amber-200' : 'bg-white/20 border-white/40 text-white')
                        : 'bg-black/20 text-white/40 border-white/10'}
                    ${v.stock <= 0 ? 'opacity-30' : ''}">
                ${v.size} — ${v.price.toLocaleString()} ฿
            </button>
        `).join('');
    }

    const lineMsg = `สนใจสินค้า: ${product.name} (${variant.size}) ราคา ${variant.price.toLocaleString()} ฿`;
    actionEl.innerHTML = `
        <div class="flex flex-col gap-3 pb-2">
            <button onclick="window.addToCart('${pNameEsc}', ${product.selectedVariantIdx}); window.closeProductDetails();"
                    ${isOutOfStock ? 'disabled' : ''}
                    class="w-full ${premium ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black' : 'bg-white text-black'} py-4 rounded-2xl font-bold hover:opacity-90 transition shadow-xl disabled:opacity-40 disabled:cursor-not-allowed text-sm">
                ${isOutOfStock ? '❌ สินค้าหมด' : (premium ? '👑 เพิ่มลงตะกร้า' : '🛒 เพิ่มลงตะกร้า')}
            </button>
            ${!isOutOfStock ? `
            <a href="${buildLineUrl(lineMsg)}" target="_blank"
               class="w-full bg-[#06C755] text-white py-4 rounded-2xl font-bold hover:bg-[#05b34c] transition shadow-xl shadow-green-900/30 text-sm text-center flex items-center justify-center gap-2">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.03 2 11c0 2.84 1.38 5.38 3.56 7.12L4.5 22l3.78-1.98C9.37 20.63 10.66 21 12 21c5.52 0 10-4.03 10-9S17.52 2 12 2z"/></svg>
                ทัก LINE สั่งด่วน
            </a>` : ''}
        </div>
    `;

    modal.classList.remove('cart-closed');
    modal.classList.add('cart-open');
}

function closeProductDetails() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.add('cart-closed');
        modal.classList.remove('cart-open');
    }
}

function changeProductImage(src) {
    document.getElementById('modalMainImage').src = src;
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
    showToast(`เพิ่ม ${product.name} ลงในตะกร้าแล้ว!`);
}

function toggleCart(force = null) {
    const sidebar = document.getElementById("cartSidebar");
    const overlay = document.getElementById("cartOverlay");
    const isOpen = force !== null ? force : sidebar.classList.contains("translate-x-full");
    sidebar.classList.toggle("translate-x-full", !isOpen);
    overlay.classList.toggle("hidden", !isOpen);
}

function updateCartUI() {
    const container = document.getElementById("cartItemsContainer");
    const badge = document.getElementById("cartCountBadge");
    const subtotalEl = document.getElementById("cartSubtotal");
    const checkoutBtn = document.getElementById("checkoutBtn");

    const count = cart.reduce((sum, i) => sum + i.qty, 0);
    badge.textContent = count;
    badge.classList.toggle("hidden", count === 0);
    document.getElementById("cartTotalCount").textContent = `(${count})`;

    let subtotal = 0;
    let cartHTML = '';

    if (cart.length === 0) {
        cartHTML = `<div class="text-center py-20 text-slate-400">ยังไม่มีสินค้าในตะกร้า</div>`;
    } else {
        cartHTML = cart.map((item, idx) => {
            subtotal += item.price * item.qty;
            return `
                <div class="flex gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-xl bg-white shadow-sm" onerror="this.outerHTML='📦';">
                    <div class="flex-1">
                        <h4 class="font-bold text-slate-800 text-sm">${item.name}</h4>
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">${item.size}</p>
                        <div class="flex justify-between items-center mt-2">
                            <p class="text-indigo-600 font-bold text-sm">${(item.price * item.qty).toLocaleString()} ฿</p>
                            <div class="flex items-center gap-1 bg-white border border-slate-200 rounded-full p-1 shadow-sm">
                                <button onclick="window.updateQty(${idx}, -1)" class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-600 transition active:scale-90">-</button>
                                <span class="text-xs font-black text-slate-900 min-w-[24px] text-center">${item.qty}</span>
                                <button onclick="window.updateQty(${idx}, 1)" class="w-7 h-7 flex items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-800 transition active:scale-90 shadow-sm">+</button>
                            </div>
                        </div>
                    </div>
                </div>`;
        }).join('');
    }

    container.innerHTML = cartHTML;
    subtotalEl.textContent = subtotal.toLocaleString() + " ฿";
    checkoutBtn.disabled = cart.length === 0;
}

function updateQty(idx, change) {
    cart[idx].qty += change;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
    updateCartUI();
}

async function loadAndDisplayPaymentMethods() {
    const container = document.getElementById('paymentMethodsContainer');
    container.innerHTML = `<div class="text-center py-4 text-white/40 text-sm animate-pulse">กำลังโหลดข้อมูลชำระเงิน...</div>`;
    
    try {
        const res = await fetch(`${GAS_URL}?action=getBank`);
        const data = await res.json();
        
        const promptpayList = data.length > 0 ? data.slice(1).map(row => ({
            name: row[0],
            bank: row[1],
            number: row[2],
            qrImage: row[3],
            status: row[4] || 'active'
        })) : [];

        const activePromptpay = promptpayList.filter(pp => pp.status === 'active');

        if (activePromptpay.length === 0) {
            container.innerHTML = `<div class="text-center py-4 text-white/40 text-sm">ยังไม่มีข้อมูลการชำระเงิน</div>`;
            return;
        }

        container.innerHTML = activePromptpay.map((pp) => `
            <div class="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-sm hover:bg-white/10 transition group">
                <div class="flex gap-4">
                    ${pp.qrImage ? `
                        <div class="flex-shrink-0">
                            <img src="${pp.qrImage}" alt="QR Code โอนเงิน ${pp.name} ${pp.bank}" class="w-20 h-20 object-cover rounded-xl border border-white/10 shadow-lg">
                        </div>
                    ` : ''}
                    <div class="flex-1">
                        <h5 class="font-bold text-white text-sm mb-1">${pp.name}</h5>
                        <p class="text-[11px] text-white/60 mb-1">
                            <span class="font-semibold text-white/80">${pp.bank}</span>
                        </p>
                        <p class="text-[11px] text-white font-mono bg-white/10 px-2 py-1 rounded inline-block">
                            ${pp.number}
                        </p>
                        <p class="text-[10px] text-white/40 mt-2">โปรดโอนเงินไปยังบัญชีนี้</p>
                    </div>
                    ${pp.qrImage ? `
                        <div class="flex-shrink-0">
                            <button onclick="previewPaymentQR('${pp.qrImage}')" class="px-3 py-1 text-[10px] font-bold bg-white/10 text-white rounded-lg hover:bg-white/20 transition">
                                ดู QR
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error("Load Settings Error:", err);
        container.innerHTML = `<div class="text-center py-4 text-red-400 text-sm">โหลดข้อมูลล้มเหลว</div>`;
    }
}

function previewPaymentQR(qrUrl) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center animate-in zoom-in duration-300" onclick="event.stopPropagation()">
            <button onclick="this.closest('.fixed').remove()" class="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <img src="${qrUrl}" class="w-64 h-64 mx-auto rounded-xl shadow-md mb-4 object-cover">
            <p class="text-sm text-slate-600 font-medium">สแกน QR Code นี้เพื่อโอนเงิน</p>
        </div>
    `;
    modal.onclick = () => modal.remove();
    document.body.appendChild(modal);
}

function goToCheckout() {
    loadAndDisplayPaymentMethods();
    updatePaymentMethod('cod'); // COD เป็น default — ลด friction (ไม่ต้องโอนก่อน)
    document.getElementById('checkoutModal').classList.remove('hidden');
}
function closeCheckout() { document.getElementById('checkoutModal').classList.add('hidden'); }

function updatePaymentMethod(method) {
    selectedPaymentMethod = method;
    const paymentDetails = document.getElementById('paymentDetailsSection');
    const slipSection = document.getElementById('slipInput').parentElement.parentElement;
    const confirmBtn = document.getElementById('confirmBtn');

    if (method === 'cod') {
        paymentDetails.classList.add('hidden');
        slipSection.classList.add('hidden');
        confirmBtn.innerHTML = `ยืนยันสั่งซื้อ (เก็บเงินปลายทาง)`;
    } else {
        paymentDetails.classList.remove('hidden');
        slipSection.classList.remove('hidden');
        confirmBtn.innerHTML = `ยืนยันและสั่งซื้อ`;
    }
    updateConfirmButtonText();
}

function updateConfirmButtonText() {
    const btn = document.getElementById('confirmBtn');
    let subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const finalTotal = selectedPaymentMethod === 'cod' ? subtotal + COD_FEE : subtotal;
    
    if (selectedPaymentMethod === 'cod') {
        btn.innerHTML = `ยืนยันสั่งซื้อ (ยอดรวม ${finalTotal.toLocaleString()} ฿)`;
    } else {
        btn.innerHTML = `ยืนยันและสั่งซื้อ (${finalTotal.toLocaleString()} ฿)`;
    }
}

function previewSlip(input) {
    if (input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            document.getElementById('slipPreview').innerHTML = `<img src="${e.target.result}" class="h-32 w-auto mx-auto rounded-xl shadow-md"><p class="mt-2 text-xs text-indigo-600 font-bold">✓ เลือกสลิปแล้ว</p>`;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

async function submitOrder() {
    const btn = document.getElementById('confirmBtn');
    const imgbbUrl = getImgbbUploadUrl();

    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const finalTotal = selectedPaymentMethod === 'cod' ? subtotal + COD_FEE : subtotal;

    const data = {
        name: document.getElementById('custName').value.trim(),
        phone: document.getElementById('custPhone').value.trim(),
        email: (document.getElementById('custEmail')?.value || '').trim(),
        address: document.getElementById('custAddress').value.trim(),
        slip: document.getElementById('slipInput').files[0],
        paymentMethod: selectedPaymentMethod === 'cod' ? 'เก็บเงินปลายทาง' : 'โอนเงิน'
    };

    if (!data.name || !data.phone || !data.address) return showToast("กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง", "error");
    if (selectedPaymentMethod === 'transfer' && !data.slip) return showToast("กรุณาแนบสลิปโอนเงิน", "error");

    btn.disabled = true;
    btn.innerHTML = "กำลังบันทึกออเดอร์...";

    try {
        let slipUrl = "COD (ไม่แนบสลิป)";
        
        if (selectedPaymentMethod === 'transfer') {
            const formData = new FormData(); 
            formData.append('image', data.slip);
            const imgRes = await fetch(imgbbUrl, { method: 'POST', body: formData });
            const imgData = await imgRes.json();
            if (!imgData.success) throw new Error("Upload Fail");
            slipUrl = imgData.data.url;
        }

        let orderItems = cart.map(i => `${i.name} [${i.size}] x${i.qty}`).join(', ');
        let itemsArray = cart.map(i => ({ name: i.name, size: i.size, qty: i.qty }));
        let subtotalVal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

        try {
            await fetch(GAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    action: "log",
                    name: data.name,
                    phone: data.phone,
                    email: data.email,
                    address: data.address,
                    mapUrl: "-",
                    items: orderItems,
                    itemsArray: itemsArray,
                    total: finalTotal,
                    slipUrl: slipUrl,
                    paymentMethod: data.paymentMethod,
                    status: "รอดำเนินการ"
                })
            });
        } catch(e) {
            console.warn("GAS CORS error ignored:", e);
        }

        const itemsDetail = cart.map(i => `- ${i.name.toUpperCase()} [${i.size}] x${i.qty}`).join('\n');
        const lineMsg = `✨ ออเดอร์ใหม่! [${SHOP_NAME} v${SHOP_VERSION}]
💰 วิธีชำระ: ${data.paymentMethod}
👤 ผู้รับ: ${data.name}
📞 เบอร์: ${data.phone}
🏠 ที่อยู่: ${data.address}

🛒 รายการ:
${itemsDetail}
💰 ยอดรวม: ${finalTotal.toLocaleString()} บาท

🖼️ หลักฐาน: ${slipUrl}`;

        document.getElementById('finalOrderTotal').textContent = finalTotal.toLocaleString() + " ฿";
        document.getElementById('successModal').classList.remove('hidden');

        currentLineUrl = buildLineUrl(lineMsg);

        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#ffffff', '#fbbf24', '#ef4444']
        });

        setTimeout(() => {
            if (currentLineUrl) window.location.href = currentLineUrl;
        }, 3000);
    } catch (e) {
        showToast("เกิดข้อผิดพลาดในการสั่งซื้อ กรุณาลองใหม่อีกครั้ง", "error");
        btn.disabled = false;
        btn.innerHTML = "ยืนยันและสั่งซื้อ";
    }
}

function selectModalVariant(pName, vIdx) {
    const product = products.find(p => p.name === pName);
    if (!product) return;
    product.selectedVariantIdx = vIdx;
    // Re-open modal to refresh price + variant selection
    window.openProductDetails(pName);
}

function switchCategoryPremium() {
    currentCategory = "พรีเมียม";
    document.querySelectorAll('#categoryTabs button').forEach(btn => {
        btn.classList.remove('category-active', 'tab-premium-active');
        btn.classList.add('category-inactive');
    });
    const premTab = document.getElementById('tab-พรีเมียม');
    if (premTab) {
        premTab.classList.remove('category-inactive');
        premTab.classList.add('tab-premium-active');
    }
    const searchInput = document.getElementById('searchInput');
    renderProducts(searchInput ? searchInput.value : "");
}

// === EXPOSE TO GLOBAL ===
window.handleLogoClick = handleLogoClick;
window.toggleCart = toggleCart;
window.renderProducts = renderProducts;
window.switchCategory = switchCategory;
window.selectVariant = selectVariant;
window.addToCart = addToCart;
window.updateQty = updateQty;
window.goToCheckout = goToCheckout;
window.closeCheckout = closeCheckout;
window.previewSlip = previewSlip;
window.previewPaymentQR = previewPaymentQR;
window.updatePaymentMethod = updatePaymentMethod;
window.submitOrder = submitOrder;
window.openProductDetails = openProductDetails;
window.closeProductDetails = closeProductDetails;
window.changeProductImage = changeProductImage;
window.selectModalVariant = selectModalVariant;
window.switchCategoryPremium = switchCategoryPremium;
window.redirectToLine = () => {
    if (currentLineUrl) window.location.href = currentLineUrl;
    else window.location.reload();
};

document.addEventListener('DOMContentLoaded', () => {
    loadProductsFromSheet(renderProducts);
});

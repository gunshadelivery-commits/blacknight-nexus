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

// --- CUSTOM UI: PULL TO REFRESH ---
let touchStart = 0;
let isRefreshing = false;
document.addEventListener('touchstart', e => { touchStart = e.touches[0].pageY; }, { passive: true });
document.addEventListener('touchmove', e => {
    const touchMove = e.touches[0].pageY;
    if (window.scrollY === 0 && touchMove > touchStart + 80 && !isRefreshing) {
        isRefreshing = true;
        document.body.classList.add('ptr-loading');
        if (window.navigator.vibrate) window.navigator.vibrate(10); // Subtle Haptic
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
    const cacheBuster = (SHEET_CSV_URL.includes('?') ? '&' : '?') + `nocache=${Math.random()}&t=${Date.now()}`;
    Papa.parse(SHEET_CSV_URL + cacheBuster, {
        download: true, header: true,
        complete: function (results) {
            console.log("Sheet Data Fetched:", results);
            if (!results || !results.data || results.data.length === 0) {
                console.error("No data found in sheet");
                showToast("ไม่พบข้อมูลสินค้า", "error");
                return;
            }
            const data = results.data;
            const grouped = {};

            data.forEach(item => {
                if (!item.name || item.name.trim() === "") return;
                if (!grouped[item.name]) {
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
                        aiType: item["category"] || item["หมวดหมู่"] || classifyItem(item.name)
                    };
                }

                const stock = parseInt(item.stock) || 0;
                const sold = parseInt(item.sold_count) || 0;

                grouped[item.name].variants.push({
                    size: item.size || 'Standard',
                    price: parseFloat(item.price) || 0,
                    stock: stock,
                    sold: sold
                });
                grouped[item.name].totalSold += sold;
            });

            products = Object.values(grouped);
            console.log("Processed Products:", products);
            if (callback) callback();
        },
        error: function(err) {
            console.error("PapaParse Fetch Error:", err);
            showToast("โหลดข้อมูลล้มเหลว (เช็คการแชร์ Sheet)", "error");
        }
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

        // Apply Filters: Search + Category
        const filtered = products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(q) || (p.note && p.note.toLowerCase().includes(q));
            const matchesCategory = currentCategory === "All" || p.aiType === currentCategory;
            return matchesSearch && matchesCategory;
        });

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-2 text-center text-white/40 py-20">ไม่พบสินค้าในหมวดหมู่นี้</div>`;
        return;
    }

    filtered.forEach((p, idx) => {
        const card = document.createElement("div");
        card.className = "glass-card rounded-3xl shadow-lg overflow-hidden flex flex-col reveal";
        card.style.transitionDelay = `${(idx % 4) * 100}ms`;
        const isOutOfStock = p.status === 'หมด' || p.status === 'sold out' || p.status === '0';

        // Select Current Variant
        const variant = p.variants[p.selectedVariantIdx];
        const isVariantOutOfStock = variant.stock <= 0;

        // Priority loading for top items
        const priorityAttr = products.indexOf(p) < 4 ? 'fetchpriority="high"' : 'loading="lazy"';

        // Use name as identifier to avoid index mismatch in filtered views
        const pNameEscaped = p.name.replace(/'/g, "\\'");

        card.innerHTML = `
            <div class="h-32 bg-white/5 flex items-center justify-center relative overflow-hidden">
                <img src="${p.image}" 
                     ${priorityAttr} 
                     class="w-full h-full object-cover img-fade-in ${isOutOfStock || isVariantOutOfStock ? 'grayscale opacity-30' : ''}" 
                     onload="this.classList.add('img-loaded')"
                     onerror="this.outerHTML='<span class=\\'text-3xl\\'>📦</span>';" />
                <div class="absolute top-2 left-2 flex flex-col gap-1">
                    ${p.tags.length ? `<span class="bg-indigo-500/80 backdrop-blur-md text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow-sm w-fit">${p.tags[0]}</span>` : ''}
                    ${p.totalSold > 0 ? `<span class="bg-orange-500/80 backdrop-blur-md text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow-sm w-fit">SOLD ${p.totalSold}+</span>` : ''}
                </div>
                ${(isOutOfStock || isVariantOutOfStock) ? `<div class="absolute inset-0 bg-black/60 flex items-center justify-center transition-all opacity-100"><span class="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">OUT OF STOCK</span></div>` : ''}
            </div>
            <div class="p-3 flex-1 flex flex-col">
                <div class="flex-1">
                    <h3 class="font-bold text-white leading-tight text-sm">${p.name}</h3>
                    <p class="text-[10px] text-white/40 mt-1 line-clamp-1">${p.note}</p>
                </div>
                
                <!-- VARIANT SELECTOR -->
                <div class="mt-3 flex flex-wrap gap-1">
                    ${p.variants.map((v, vIdx) => `
                        <button onclick="window.selectVariant('${pNameEscaped}', ${vIdx})" class="px-2 py-1 text-[10px] border rounded-lg transition-all font-bold ${p.selectedVariantIdx === vIdx ? 'bg-white/20 border-white/40 text-white' : 'bg-black/20 text-white/30 border-white/5'} ${v.stock <= 0 ? 'opacity-20' : ''}">
                            ${v.size}
                        </button>
                    `).join('')}
                </div>

                ${variant.stock > 0 && variant.stock <= 5 ? `<p class="text-[9px] text-red-400 font-bold mt-2">🔥 Only ${variant.stock} left!</p>` : ''}

                <div class="mt-3 flex items-center justify-between">
                    <p class="font-bold text-white text-sm">${variant.price.toLocaleString()} ฿</p>
                    <button onclick="window.addToCart('${pNameEscaped}', ${p.selectedVariantIdx})" ${isOutOfStock || isVariantOutOfStock ? 'disabled' : ''} class="bg-white/10 text-white p-2 rounded-xl hover:bg-white/20 transition-all disabled:opacity-10">
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

// --- CART LOGIC ---
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
                    <img src="${item.image}" class="w-16 h-16 object-cover rounded-xl bg-white shadow-sm" onerror="this.outerHTML='📦';">
                    <div class="flex-1">
                        <h4 class="font-bold text-slate-800 text-sm">${item.name}</h4>
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">${item.size}</p>
                        <div class="flex justify-between items-center mt-2">
                            <p class="text-indigo-600 font-bold text-sm">${(item.price * item.qty).toLocaleString()} ฿</p>
                            <div class="flex items-center gap-3">
                                <button onclick="window.updateQty(${idx}, -1)" class="w-6 h-6 border flex items-center justify-center p-1 rounded-full">-</button>
                                <span class="text-sm font-bold">${item.qty}</span>
                                <button onclick="window.updateQty(${idx}, 1)" class="w-6 h-6 border flex items-center justify-center p-1 rounded-full">+</button>
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

// --- CHECKOUT ---
function loadAndDisplayPaymentMethods() {
    const container = document.getElementById('paymentMethodsContainer');
    const stored = localStorage.getItem('promptpayData');
    const promptpayList = stored ? JSON.parse(stored) : [];
    const normalizedPromptpay = promptpayList.map(pp => ({ status: pp.status || 'active', ...pp }));
    const activePromptpay = normalizedPromptpay.filter(pp => pp.status === 'active');

    if (activePromptpay.length === 0) {
        const message = normalizedPromptpay.length > 0
            ? 'ยังไม่มีช่องทาง Promptpay ที่เปิดใช้งาน'
            : 'ยังไม่มีข้อมูลการชำระเงิน';
        container.innerHTML = `<div class="text-center py-4 text-slate-500 text-sm">
            <p>${message}</p>
        </div>`;
        return;
    }

    container.innerHTML = activePromptpay.map((pp, idx) => `
        <div class="bg-white border border-blue-100 rounded-xl p-4 shadow-sm hover:shadow-md transition">
            <div class="flex gap-4">
                ${pp.qrImage ? `
                    <div class="flex-shrink-0">
                        <img src="${pp.qrImage}" class="w-20 h-20 object-cover rounded-lg border border-slate-200 shadow-sm">
                    </div>
                ` : ''}
                <div class="flex-1">
                    <h5 class="font-bold text-slate-800 text-sm mb-1">${pp.name}</h5>
                    <p class="text-[11px] text-slate-600 mb-1">
                        <span class="font-semibold text-slate-700">${pp.bank}</span>
                    </p>
                    <p class="text-[11px] text-slate-600 font-mono bg-slate-50 px-2 py-1 rounded inline-block">
                        ${pp.number}
                    </p>
                    <p class="text-[10px] text-slate-400 mt-2">โปรดโอนเงินไปยังบัญชีนี้</p>
                </div>
                ${pp.qrImage ? `
                    <div class="flex-shrink-0">
                        <button onclick="previewPaymentQR('${pp.qrImage}')" class="px-3 py-1 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition">
                            ดู QR
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
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
    updatePaymentMethod('transfer'); // Reset to default
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
    // Update total display in button if possible
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

// --- Geolocation Helper ---
function getCurrentLocation(event) {
    const btn = event.currentTarget;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;

    if (!navigator.geolocation) {
        showToast("เบราว์เซอร์ของคุณไม่รองรับการระบุพิกัด", "error");
        btn.disabled = false;
        btn.innerHTML = originalText;
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
            document.getElementById('custMap').value = mapUrl;
            btn.disabled = false;
            btn.innerHTML = "✅ สำเร็จ!";
            showToast("ดึงพิกัดปัจจุบันเรียบร้อย!");
            setTimeout(() => { btn.innerHTML = originalText; }, 2000);
        },
        (err) => {
            let msg = "ไม่สามารถดึงพิกัดได้ กรุณากดอนุญาตการเข้าถึงตำแหน่ง";
            if (err.code === 1) msg = "กรุณาอนุญาตการเข้าถึงตำแหน่ง (Permission Denied)";
            else if (err.code === 2) msg = "ไม่พบสัญญาณตำแหน่ง (Position Unavailable)";
            else if (err.code === 3) msg = "การค้นหาพิกัดใช้เวลานานเกินไป (Timeout)";

            showToast(msg, "error");
            btn.disabled = false;
            btn.innerHTML = originalText;
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // Increased timeout to 10s
    );
}

// --- MAP MODAL MANAGEMENT ---
let mapInstance = null;
let selectedLat = null;
let selectedLng = null;
let mapMarker = null;

function openMapModal() {
    const modal = document.getElementById('mapModal');
    modal.classList.remove('hidden');
    
    // Initialize map after modal is visible
    setTimeout(() => {
        if (!mapInstance) {
            initializeMap();
        } else {
            mapInstance.invalidateSize();
        }
    }, 100);
}

function closeMapModal() {
    const modal = document.getElementById('mapModal');
    modal.classList.add('hidden');
    document.getElementById('confirmMapBtn').disabled = true;
}

function initializeMap() {
    const container = document.getElementById('mapContainer');
    const custMapInput = document.getElementById('custMap');
    
    // Try to get initial location from current GPS or use Bangkok as default
    let initialLat = 13.7563, initialLng = 100.5018; // Bangkok
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            initialLat = pos.coords.latitude;
            initialLng = pos.coords.longitude;
            createMap(initialLat, initialLng);
        }, () => {
            createMap(initialLat, initialLng);
        }, { timeout: 5000 });
    } else {
        createMap(initialLat, initialLng);
    }
    
    function createMap(lat, lng) {
        if (mapInstance) mapInstance.remove();
        
        mapInstance = L.map('mapContainer').setView([lat, lng], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstance);
        
        // Click handler for map
        mapInstance.on('click', (e) => {
            selectedLat = e.latlng.lat;
            selectedLng = e.latlng.lng;
            
            // Remove old marker
            if (mapMarker) mapInstance.removeLayer(mapMarker);
            
            // Add new marker
            mapMarker = L.marker([selectedLat, selectedLng]).addTo(mapInstance)
                .bindPopup(`📍 พิกัด: ${selectedLat.toFixed(5)}, ${selectedLng.toFixed(5)}`)
                .openPopup();
            
            // Enable confirm button
            document.getElementById('confirmMapBtn').disabled = false;
        });
    }
}

function confirmMapLocation() {
    if (!selectedLat || !selectedLng) {
        showToast("กรุณาเลือกตำแหน่งบนแผนที่", "error");
        return;
    }
    
    // Create Google Maps URL
    const mapUrl = `https://www.google.com/maps?q=${selectedLat},${selectedLng}`;
    document.getElementById('custMap').value = mapUrl;
    
    showToast("✓ บันทึกตำแหน่งเรียบร้อย!", "success");
    closeMapModal();
}

async function submitOrder() {
    const btn = document.getElementById('confirmBtn');
    const imgbbUrl = getImgbbUploadUrl();

    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const finalTotal = selectedPaymentMethod === 'cod' ? subtotal + COD_FEE : subtotal;

    const data = {
        name: "Customer (" + document.getElementById('custPhone').value + ")",
        phone: document.getElementById('custPhone').value,
        address: "Google Maps Pin: " + document.getElementById('custMap').value,
        map: document.getElementById('custMap').value,
        slip: document.getElementById('slipInput').files[0],
        paymentMethod: selectedPaymentMethod === 'cod' ? 'เก็บเงินปลายทาง' : 'โอนเงิน'
    };

    // Validation
    if (!data.phone || !data.map) return showToast("กรุณากรอกข้อมูลให้ครบถ้วน", "error");
    if (selectedPaymentMethod === 'transfer' && !data.slip) return showToast("กรุณาแนบสลิปโอนเงิน", "error");

    btn.disabled = true;
    btn.innerHTML = "กำลังบันทึกออเดอร์...";

    try {
        let slipUrl = "COD (ไม่แนบสลิป)";
        
        // 1. Upload Slip (only for transfer)
        if (selectedPaymentMethod === 'transfer') {
            const formData = new FormData(); 
            formData.append('image', data.slip);
            const imgRes = await fetch(imgbbUrl, { method: 'POST', body: formData });
            const imgData = await imgRes.json();
            if (!imgData.success) throw new Error("Upload Fail");
            slipUrl = imgData.data.url;
        }

        // 2. Log to Sheet
        let orderItems = cart.map(i => `${i.name} [${i.size}] x${i.qty}`).join(', ');
        let itemsArray = cart.map(i => ({ name: i.name, size: i.size, qty: i.qty }));
        let subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

        await fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: "log", 
                name: data.name, 
                phone: data.phone, 
                address: data.address,
                mapUrl: data.map, 
                items: orderItems, 
                itemsArray: itemsArray, 
                total: finalTotal, 
                slipUrl: slipUrl, 
                paymentMethod: data.paymentMethod,
                status: "รอดำเนินการ"
            })
        });

        // 3. Premium LINE Message
        const itemsDetail = cart.map(i => `- ${i.name.toUpperCase()} [${i.size}] x${i.qty}`).join('\n');
        const lineMsg = `✨ ออเดอร์ใหม่! [${SHOP_NAME} v${SHOP_VERSION}]
💰 วิธีชำระ: ${data.paymentMethod}
📞 เบอร์: ${data.phone}
📍 พิกัดจัดส่ง: ${data.map}

🛒 รายการ:
${itemsDetail}
💰 ยอดรวม: ${finalTotal.toLocaleString()} บาท

🖼️ หลักฐาน: ${slipUrl}`;

        // --- CELEBRATION ---
        document.getElementById('finalOrderTotal').textContent = finalTotal.toLocaleString() + " ฿";
        document.getElementById('successModal').classList.remove('hidden');

        // Build direct OA URL
        currentLineUrl = buildLineUrl(lineMsg);

        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#ffffff', '#fbbf24', '#ef4444']
        });

        // Wait 3 seconds before auto redirect
        setTimeout(() => {
            if (currentLineUrl) window.location.href = currentLineUrl;
        }, 3000);
    } catch (e) {
        showToast("เกิดข้อผิดพลาดในการสั่งซื้อ กรุณาลองใหม่อีกครั้ง", "error");
        btn.disabled = false;
        btn.innerHTML = "ยืนยันและสั่งซื้อ";
    }
}

// === EXPOSE TO GLOBAL FOR INLINE HTML HANDLERS ===
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
window.getCurrentLocation = getCurrentLocation;
window.openMapModal = openMapModal;
window.closeMapModal = closeMapModal;
window.confirmMapLocation = confirmMapLocation;
window.updatePaymentMethod = updatePaymentMethod;
window.submitOrder = submitOrder;
window.redirectToLine = () => {
    if (currentLineUrl) window.location.href = currentLineUrl;
    else window.location.reload();
};

// --- THREE.JS 3D ANIMATION (POV SPACE FLIGHT) ---
function initHero3D() {
    const container = document.getElementById('three-canvas-container');
    if (!container || !window.THREE) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // 1. DEBRIS FIELD (Varied Shapes & Colors)
    const debris = [];
    const debrisCount = 60;
    const geometries = [
        new THREE.IcosahedronGeometry(1, 0),
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.TorusGeometry(0.5, 0.2, 8, 16),
        new THREE.OctahedronGeometry(1, 0)
    ];

    const colors = [0x6366f1, 0xec4899, 0xf59e0b, 0x10b981, 0x3b82f6, 0x8b5cf6, 0xf43f5e];

    for (let i = 0; i < debrisCount; i++) {
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const material = new THREE.MeshStandardMaterial({ 
            color: randomColor, 
            flatShading: true,
            metalness: 0.8,
            roughness: 0.2,
            emissive: randomColor,
            emissiveIntensity: 0.4
        });

        const geo = geometries[Math.floor(Math.random() * geometries.length)];
        const mesh = new THREE.Mesh(geo, material);
        resetAsteroid(mesh);
        mesh.position.z = Math.random() * -150;
        scene.add(mesh);
        debris.push({
            mesh,
            rotSpeedX: (Math.random() - 0.5) * 0.04,
            rotSpeedY: (Math.random() - 0.5) * 0.04,
            speed: Math.random() * 0.3 + 0.2
        });
    }

    function resetAsteroid(mesh) {
        mesh.position.x = (Math.random() - 0.5) * 60;
        mesh.position.y = (Math.random() - 0.5) * 30;
        mesh.position.z = -150;
        const scale = Math.random() * 1.2 + 0.2;
        mesh.scale.set(scale, scale, scale);
    }

    // 2. STARFIELD (Increased Density & Movement)
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ 
        color: 0xffffff, 
        size: 0.15,
        transparent: true,
        opacity: 0.8
    });
    const starVertices = [];
    for (let i = 0; i < 4000; i++) {
        starVertices.push((Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // 3. NEBULA CLOUDS (Procedural)
    const nebulaColors = [0x4f46e5, 0x7c3aed, 0xdb2777];
    const nebulae = [];
    for (let i = 0; i < 5; i++) {
        const geo = new THREE.SphereGeometry(20, 32, 32);
        const mat = new THREE.MeshBasicMaterial({
            color: nebulaColors[i % nebulaColors.length],
            transparent: true,
            opacity: 0.05,
            side: THREE.BackSide
        });
        const nebula = new THREE.Mesh(geo, mat);
        nebula.position.set((Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200, -300 - Math.random() * 200);
        nebula.scale.set(5, 5, 5);
        scene.add(nebula);
        nebulae.push(nebula);
    }

    // LIGHTING
    const mainLight = new THREE.PointLight(0xffffff, 2.5, 150);
    mainLight.position.set(0, 0, 10);
    scene.add(mainLight);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    camera.position.z = 5;

    let mouseX = 0;
    let mouseY = 0;
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX - window.innerWidth / 2) / 150;
        mouseY = (e.clientY - window.innerHeight / 2) / 150;
    });

    let scrollY = 0;
    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
        const progress = Math.min(scrollY / 300, 1) * 100;
        const progressBar = document.getElementById('scroll-progress');
        if(progressBar) progressBar.style.width = `${progress}%`;
    });

    function animate() {
        requestAnimationFrame(animate);

        const time = Date.now() * 0.001;
        const scrollBoost = scrollY * 0.005; // Speed increases as you scroll

        debris.forEach(d => {
            d.mesh.position.z += (d.speed + scrollBoost);
            d.mesh.rotation.x += d.rotSpeedX;
            d.mesh.rotation.y += d.rotSpeedY;
            if (d.mesh.position.z > 15) resetAsteroid(d.mesh);
        });

        // Dynamic Camera movement
        camera.position.x += (mouseX - camera.position.x) * 0.03;
        camera.position.y += (-mouseY - camera.position.y) * 0.03;
        camera.rotation.z = -camera.position.x * 0.1; // Bank on turn
        camera.lookAt(0, 0, -50);

        // Stars & Nebula movement
        stars.rotation.z += 0.0003;
        nebulae.forEach((n, i) => {
            n.rotation.y += 0.001 * (i + 1);
            n.position.z += (0.1 + scrollBoost);
            if (n.position.z > 100) n.position.z = -500;
        });

        renderer.render(scene, camera);
    }

    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    animate();
}

// --- DYNAMIC HERO BACKGROUND ---
function updateHeroBackground() {
    const bg = document.getElementById('hero-bg');
    if (!bg) return;
    
    // Using Unsplash source for high-quality landscape photos
    const keywords = ['landscape', 'nature', 'mountains', 'night', 'galaxy', 'abstract'];
    const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
    const imageUrl = `https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80`; // Default placeholder
    
    // Instead of fixed URL, let's use the dynamic source
    const dynamicUrl = `https://source.unsplash.com/random/1600x900/?${randomKeyword}`;
    
    // Smooth transition
    const tempImg = new Image();
    tempImg.src = dynamicUrl;
    tempImg.onload = () => {
        bg.style.backgroundImage = `url('${dynamicUrl}')`;
    };
}

// Setup input listeners to avoid parameter passing issues
document.addEventListener('DOMContentLoaded', () => {
    loadProductsFromSheet(renderProducts);
    initHero3D();
    updateHeroBackground();
    
    // Change background every 30 seconds
    setInterval(updateHeroBackground, 30000);
});

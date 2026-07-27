import './style.css';
import Papa from 'papaparse';
import confetti from 'canvas-confetti';
import { SHEET_CSV_URL, GAS_URL, SHOP_NAME, SHOP_VERSION, buildLineUrl, getImgbbUploadUrl, getLineOaUrl } from './config.js';
import { isLoggedIn } from './auth.js';
import { initI18n, t } from './i18n.js';

let products = [];
let cart = [];
let currentCategory = "All";
let currentLineUrl = "";
let selectedPaymentMethod = "transfer";
const COD_FEE = 50;

const DRINK_PRODUCTS = [
    {
        name: "น้ำท่อมมี่ ธรรมดา",
        note: "สูตรธรรมดา พร้อมดื่ม · แพ็ก 3 ขวดประหยัด 50 บาท",
        image: "",
        images: [],
        tags: ["เมนูน้ำ", "แพ็กคุ้ม"],
        status: "active",
        variants: [
            { size: "1 ขวด", price: 100, stock: 999, sold_count: 0 },
            { size: "3 ขวด", price: 250, originalPrice: 300, stock: 999, sold_count: 0 },
        ],
        selectedVariantIdx: 0,
        totalSold: 0,
        aiType: "เครื่องดื่ม",
        isDrink: true,
        drinkTheme: "herbal",
        drinkLabel: "ท่อมมี่",
    },
    {
        name: "น้ำโยเกิร์ต",
        note: "รสนุ่ม ดื่มง่าย · แพ็ก 3 ขวดประหยัด 20 บาท",
        image: "",
        images: [],
        tags: ["เมนูน้ำ", "ขายดี"],
        status: "active",
        variants: [
            { size: "1 ขวด", price: 80, stock: 999, sold_count: 0 },
            { size: "3 ขวด", price: 220, originalPrice: 240, stock: 999, sold_count: 0 },
        ],
        selectedVariantIdx: 0,
        totalSold: 0,
        aiType: "เครื่องดื่ม",
        isDrink: true,
        drinkTheme: "yogurt",
        drinkLabel: "โยเกิร์ต",
    },
    {
        name: "น้ำผลไม้",
        note: "หวานสดชื่น · แพ็ก 3 ขวดประหยัด 20 บาท",
        image: "",
        images: [],
        tags: ["เมนูน้ำ", "สดชื่น"],
        status: "active",
        variants: [
            { size: "1 ขวด", price: 80, stock: 999, sold_count: 0 },
            { size: "3 ขวด", price: 220, originalPrice: 240, stock: 999, sold_count: 0 },
        ],
        selectedVariantIdx: 0,
        totalSold: 0,
        aiType: "เครื่องดื่ม",
        isDrink: true,
        drinkTheme: "fruit",
        drinkLabel: "ผลไม้",
    },
    {
        name: "เซ็ตโปรโมชั่นเมนูน้ำ",
        note: "เลือกชุดลองครบ 3 รส หรือยกแก๊ง 9 ขวดในราคาพิเศษ",
        image: "",
        images: [],
        tags: ["โปรโมชั่น", "ประหยัดสูงสุด 130 บาท"],
        status: "active",
        variants: [
            { size: "ครบ 3 รส · 3 ขวด", price: 240, originalPrice: 260, stock: 999, sold_count: 0 },
            { size: "ยกแก๊ง · 9 ขวด", price: 650, originalPrice: 780, stock: 999, sold_count: 0 },
        ],
        selectedVariantIdx: 0,
        totalSold: 0,
        aiType: "เครื่องดื่ม",
        isDrink: true,
        isDrinkPromotion: true,
        drinkTheme: "mix",
        drinkLabel: "MIX",
    },
];

function classifyItem(name, tags = []) {
    // รวมชื่อสินค้า + แท็ก (คอลัมน์ tags ในชีตมักระบุสายพันธุ์ เช่น "ไฮบริด (Hybrid) 50/50")
    const n = (name + ' ' + (Array.isArray(tags) ? tags.join(' ') : tags)).toLowerCase();
    // เครื่องดื่ม
    if (["น้ำท่อม", "ท่อมมี่", "โยเกิร์ต", "น้ำผลไม้", "เครื่องดื่ม", "drink", "juice"].some(s => n.includes(s))) return "เครื่องดื่ม";
    // อุปกรณ์ (บอง / กระดาษ / เครื่องบด) - เช็คก่อนสายพันธุ์
    if (["บอง", "บ้อง", "bong", "กระดาษ", "paper", "rolling", "เครื่องบด", "grinder", "ที่บด", "ไฟแช็ก", "lighter", "อุปกรณ์", "pipe", "ที่สูบ", "ถาด", "tray"].some(s => n.includes(s))) return "อุปกรณ์";
    // Pre-roll / พรีโรล / มวนสำเร็จ
    if (["pre-roll", "preroll", "pre roll", "พรีโรล", "มวนสำเร็จ", "joint"].some(s => n.includes(s))) return "Pre-roll";
    const hasSativa = ["sativa", "ซาติวา", "ซาทิวา", "ซาไทวา"].some(s => n.includes(s));
    const hasIndica = ["indica", "อินดิก้า", "อินดิกา", "อินดิ"].some(s => n.includes(s));
    // Hybrid: ระบุ hybrid ตรงๆ หรือมีทั้ง sativa และ indica ในสายพันธุ์เดียว (เช่น "Indica 70% Sativa 30")
    if (["hybrid", "ไฮบริด", "ไฮบริค", "ผสม"].some(s => n.includes(s)) || (hasSativa && hasIndica)) return "Hybrid";
    if (hasSativa) return "Sativa";
    if (hasIndica) return "Indica";
    // fallback จากเอฟเฟกต์ใน tags สำหรับแถวที่ยังไม่ได้ใส่ category ในชีต
    if (["ตื่นตัว", "สดชื่น", "โฟกัส", "focus", "energetic", "energy"].some(s => n.includes(s))) return "Sativa";
    if (["ง่วง", "ลงตา", "หนักตา", "พักผ่อน", "ผ่อนคลาย", "relax", "sleep"].some(s => n.includes(s))) return "Indica";
    // สินค้าที่ไม่ใช่อุปกรณ์/พรีโรลในร้านนี้เป็นดอก จึงใช้ Hybrid เป็นค่ากลาง
    return "Hybrid";
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
                showToast(t('store.product.updated'));
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
    // โหลดรายการสินค้าจาก Google Sheet CSV (สาธารณะ) ด้วย PapaParse
    // คอลัมน์: name, size, price, note, image, tags, status, stock, sold_count
    Papa.parse(`${SHEET_CSV_URL}&t=${Date.now()}`, {
        download: true,
        complete: (results) => {
            const data = results.data || [];
            if (!data || data.length < 2) {
                showToast(t('store.product.noData'), "error");
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
                        aiType: (row[9] && row[9].toString().trim()) || classifyItem(name, tags)
                    };
                }

                const size = row[1] || 'Standard';
                const price = parseFloat(row[2]) || 0;
                const stock = parseInt(row[7]) || 0;
                const sold = parseInt(row[8]) || 0;

                grouped[name].variants.push({ size, price, stock, sold_count: sold });
                grouped[name].totalSold += sold;
            });

            const sheetProducts = Object.values(grouped);
            const sheetNames = new Set(sheetProducts.map(product => product.name.trim().toLowerCase()));
            const localDrinks = DRINK_PRODUCTS.filter(product => !sheetNames.has(product.name.trim().toLowerCase()));
            products = [...sheetProducts, ...localDrinks];
            if (callback) callback(products);
        },
        error: (err) => {
            console.error("Fetch Products Error:", err);
            showToast(t('store.product.loadError'), "error");
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

function escapeProductArtText(value = '') {
    return String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[character]));
}

function getProductArtTheme(product) {
    const type = `${product.aiType || ''} ${(product.tags || []).join(' ')}`.toLowerCase();
    if (type.includes('sativa')) return 'sativa';
    if (type.includes('indica')) return 'indica';
    if (type.includes('hybrid')) return 'hybrid';
    if (type.includes('pre-roll') || type.includes('preroll')) return 'preroll';
    if (type.includes('อุปกรณ์') || type.includes('accessory') || type.includes('equipment')) return 'gear';
    return 'flower';
}

function getProductMonogram(name = '') {
    const words = String(name).trim().split(/[\s-]+/).filter(Boolean);
    if (words.length > 1) {
        return `${Array.from(words[0])[0] || ''}${Array.from(words[1])[0] || ''}`.toUpperCase();
    }
    return Array.from(words[0] || 'CF').slice(0, 2).join('').toUpperCase();
}

function renderProductArt(product, modal = false) {
    const theme = getProductArtTheme(product);
    const name = escapeProductArtText(product.name);
    const type = escapeProductArtText(product.aiType || 'FLOWER');
    const monogram = escapeProductArtText(getProductMonogram(product.name));

    return `
        <div class="strain-art strain-art-${theme} ${modal ? 'strain-art-modal' : ''}" role="img" aria-label="${name}">
            <span class="strain-art-grid"></span>
            <span class="strain-art-orbit strain-art-orbit-large"></span>
            <span class="strain-art-orbit strain-art-orbit-small"></span>
            <span class="strain-art-brand">CF · ON NUT</span>
            <span class="strain-art-code">${monogram}</span>
            <span class="strain-art-type">${type}</span>
            <span class="strain-art-name">${name}</span>
        </div>`;
}

function renderProducts(filter = "") {
    try {
        const grid = document.getElementById("productList");
        const resultMeta = document.getElementById("productResultMeta");
        if (!grid) return; 
        grid.innerHTML = "";
        
        let q = "";
        if (typeof filter === "string") q = filter.toLowerCase();

        if (products.length === 0) {
            if (resultMeta) resultMeta.textContent = t('store.catalog.updating');
            grid.innerHTML = `<div class="empty-products animate-pulse">${t('store.catalog.loading')}</div>`;
            return;
        }

        const filtered = products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(q) || (p.note && p.note.toLowerCase().includes(q));
            const matchesCategory = currentCategory === "All"
                || (currentCategory === "พรีเมียม" && isPremiumProduct(p))
                || p.aiType === currentCategory;
            return matchesSearch && matchesCategory;
        });

        if (resultMeta) {
            const categoryLabels = {
                All: t('store.category.allLabel'),
                'พรีเมียม': t('store.category.premium').replace('✦ ', ''),
                'อุปกรณ์': t('store.category.accessories'),
                'เครื่องดื่ม': t('store.category.drinks').replace('🧃 ', '')
            };
            const categoryLabel = categoryLabels[currentCategory] || currentCategory;
            resultMeta.textContent = t('store.catalog.results', { count: filtered.length, category: categoryLabel });
        }

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="empty-products">
                    <div>
                        <div class="text-3xl mb-3">⌕</div>
                        <p class="font-bold text-white/70">${t('store.catalog.emptyTitle')}</p>
                        <p class="text-xs text-white/30 mt-1">${t('store.catalog.emptyHint')}</p>
                    </div>
                </div>`;
            return;
        }

        filtered.forEach((p, idx) => {
            const card = document.createElement("div");
            const pNameEscaped = p.name.replace(/'/g, "\\'");
            const premium = isPremiumProduct(p);
            card.className = `product-card reveal ${p.isDrink ? 'drink-card' : 'cursor-pointer'} ${p.isDrinkPromotion ? 'drink-promotion-card' : ''} ${premium ? 'premium-card' : ''}`;
            card.style.transitionDelay = `${(idx % 4) * 100}ms`;
            card.onclick = (e) => {
                if(p.isDrink || e.target.closest('button') || e.target.closest('a')) return;
                window.openProductDetails(p.name);
            };
            const isOutOfStock = p.status === 'หมด' || p.status === 'sold out' || p.status === '0';

            const variant = p.variants[p.selectedVariantIdx];
            const isVariantOutOfStock = variant.stock <= 0;

            const priorityAttr = products.indexOf(p) < 4 ? 'fetchpriority="high"' : 'loading="lazy"';

            card.innerHTML = `
                <div class="product-visual">
                    ${p.isDrink ? `
                        <div class="drink-art drink-art-${p.drinkTheme}" role="img" aria-label="${p.name}">
                            <span class="drink-orb drink-orb-one"></span>
                            <span class="drink-orb drink-orb-two"></span>
                            <div class="drink-bottle ${p.isDrinkPromotion ? 'drink-bottle-left' : ''}">
                                <span class="drink-cap"></span>
                                <span class="drink-label"><small>CF</small><strong>${p.drinkLabel}</strong></span>
                            </div>
                            ${p.isDrinkPromotion ? `
                                <div class="drink-bottle drink-bottle-right">
                                    <span class="drink-cap"></span>
                                    <span class="drink-label"><small>CF</small><strong>SET</strong></span>
                                </div>` : ''}
                        </div>
                    ` : (p.image ? `
                        <img src="${p.image}"
                             alt="${p.name}"
                             ${priorityAttr}
                             class="img-fade-in ${isOutOfStock || isVariantOutOfStock ? 'grayscale opacity-30' : ''}"
                             onload="this.classList.add('img-loaded')"
                             onerror="this.outerHTML='<span class=\\'text-3xl\\'>📦</span>';" />
                    ` : renderProductArt(p))}
                    <div class="product-badges">
                        ${p.isDrinkPromotion ? `<span class="drink-promo-badge">✦ PROMO SET</span>` : (premium ? `<span class="premium-badge text-[8px] px-2 py-1 rounded-full">✦ SELECT</span>` : (p.tags.length ? `<span class="product-pill">${p.tags[0]}</span>` : ''))}
                        ${p.totalSold > 0 ? `<span class="product-pill sold">${t('store.product.sold', { count: p.totalSold })}</span>` : ''}
                    </div>
                    ${(isOutOfStock || isVariantOutOfStock) ? `<div class="absolute inset-0 bg-black/60 flex items-center justify-center transition-all opacity-100"><span class="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">OUT OF STOCK</span></div>` : ''}
                </div>
                <div class="product-content">
                    <div>
                        <p class="product-type">${p.aiType || 'FLOWER'}</p>
                        <h3 class="product-name ${premium ? 'text-amber-100' : ''}">${p.name}</h3>
                        <p class="product-note">${p.note}</p>
                    </div>

                    <div class="variant-row">
                        ${p.variants.map((v, vIdx) => `
                            <button onclick="window.selectVariant('${pNameEscaped}', ${vIdx})"
                                class="variant-chip ${p.selectedVariantIdx === vIdx ? 'is-active' : ''} ${v.stock <= 0 ? 'is-empty' : ''}">
                                ${v.size}
                            </button>
                        `).join('')}
                    </div>
                    ${variant.stock > 0 && variant.stock <= 5 ? `<p class="stock-alert">${t('store.product.lowStock', { count: variant.stock })}</p>` : ''}

                    <div class="product-bottom">
                        <div>
                            <p class="product-price-label">${t('store.product.startingAt')}</p>
                            <div class="product-price-row">
                                <p class="product-price ${premium ? 'text-amber-200' : ''}">${variant.price.toLocaleString()} ฿</p>
                                ${variant.originalPrice ? `<span class="original-price">${variant.originalPrice.toLocaleString()} ฿</span>` : ''}
                            </div>
                        </div>
                        <button onclick="window.addToCart('${pNameEscaped}', ${p.selectedVariantIdx})"
                            ${isOutOfStock || isVariantOutOfStock ? 'disabled' : ''}
                            class="add-button" aria-label="${t('store.product.addAria', { name: p.name })}">
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
        showToast(t('store.product.renderError'), "error");
    }
}

function switchCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll('#categoryTabs button').forEach(btn => {
        btn.classList.remove('category-active', 'tab-premium-active');
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
    
    const modalMainImage = document.getElementById('modalMainImage');
    const modalProductArt = document.getElementById('modalProductArt');
    if (product.image) {
        modalMainImage.src = product.image;
        modalMainImage.classList.remove('hidden');
        modalProductArt.classList.add('hidden');
        modalProductArt.innerHTML = '';
    } else {
        modalMainImage.removeAttribute('src');
        modalMainImage.classList.add('hidden');
        modalProductArt.innerHTML = renderProductArt(product, true);
        modalProductArt.classList.remove('hidden');
    }
    
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
                ${isOutOfStock ? `❌ ${t('store.product.outOfStock')}` : (premium ? `👑 ${t('store.product.add')}` : `🛒 ${t('store.product.add')}`)}
            </button>
            ${!isOutOfStock ? `
            <a href="${buildLineUrl(lineMsg)}" target="_blank"
               class="w-full bg-[#06C755] text-white py-4 rounded-2xl font-bold hover:bg-[#05b34c] transition shadow-xl shadow-green-900/30 text-sm text-center flex items-center justify-center gap-2">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.03 2 11c0 2.84 1.38 5.38 3.56 7.12L4.5 22l3.78-1.98C9.37 20.63 10.66 21 12 21c5.52 0 10-4.03 10-9S17.52 2 12 2z"/></svg>
                ${t('store.product.lineOrder')}
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
    else cart.push({ name: product.name, size: variant.size, price: variant.price, qty: 1, image: product.image, icon: product.isDrink ? '🥤' : '📦' });

    updateCartUI();
    toggleCart(true);
    showToast(t('store.product.added', { name: product.name }));
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
        cartHTML = `<div class="text-center py-20 text-slate-400">${t('store.cart.empty')}</div>`;
    } else {
        cartHTML = cart.map((item, idx) => {
            subtotal += item.price * item.qty;
            return `
                <div class="flex gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    ${item.image
                        ? `<img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-xl bg-white shadow-sm" onerror="this.outerHTML='<div class=\\'cart-item-icon\\'>${item.icon || '📦'}</div>';">`
                        : `<div class="cart-item-icon">${item.icon || '📦'}</div>`}
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
    container.innerHTML = `<div class="text-center py-4 text-white/40 text-sm animate-pulse">${t('store.checkout.loadingPayment')}</div>`;
    
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
            container.innerHTML = `<div class="text-center py-4 text-white/40 text-sm">${t('store.checkout.noPayment')}</div>`;
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
                        <p class="text-[10px] text-white/40 mt-2">${t('store.checkout.transferHint')}</p>
                    </div>
                    ${pp.qrImage ? `
                        <div class="flex-shrink-0">
                            <button onclick="previewPaymentQR('${pp.qrImage}')" class="px-3 py-1 text-[10px] font-bold bg-white/10 text-white rounded-lg hover:bg-white/20 transition">
                                ${t('store.checkout.viewQr')}
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error("Load Settings Error:", err);
        container.innerHTML = `<div class="text-center py-4 text-red-400 text-sm">${t('store.checkout.paymentLoadError')}</div>`;
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
            <p class="text-sm text-slate-600 font-medium">${t('store.checkout.scanQr')}</p>
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
        confirmBtn.innerHTML = t('store.checkout.confirmCod');
    } else {
        paymentDetails.classList.remove('hidden');
        slipSection.classList.remove('hidden');
        confirmBtn.innerHTML = t('store.checkout.confirmTransfer');
    }
    updateConfirmButtonText();
}

function updateConfirmButtonText() {
    const btn = document.getElementById('confirmBtn');
    let subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const finalTotal = selectedPaymentMethod === 'cod' ? subtotal + COD_FEE : subtotal;
    
    if (selectedPaymentMethod === 'cod') {
        btn.innerHTML = t('store.checkout.confirmCodTotal', { total: finalTotal.toLocaleString() });
    } else {
        btn.innerHTML = t('store.checkout.confirmTransferTotal', { total: finalTotal.toLocaleString() });
    }
}

function previewSlip(input) {
    if (input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            document.getElementById('slipPreview').innerHTML = `<img src="${e.target.result}" class="h-32 w-auto mx-auto rounded-xl shadow-md"><p class="mt-2 text-xs text-indigo-600 font-bold">${t('store.checkout.slipSelected')}</p>`;
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

    if (!data.name || !data.phone || !data.address) return showToast(t('store.checkout.required'), "error");
    if (selectedPaymentMethod === 'transfer' && !data.slip) return showToast(t('store.checkout.slipRequired'), "error");

    btn.disabled = true;
    btn.innerHTML = t('store.checkout.saving');

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
        showToast(t('store.checkout.error'), "error");
        btn.disabled = false;
        btn.innerHTML = t('store.checkout.confirmTransfer');
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

function initSolExperience() {
    const hero = document.getElementById('hero-header');
    const nav = document.getElementById('siteNav');
    const searchInput = document.getElementById('searchInput');

    if (hero && window.matchMedia('(pointer: fine)').matches) {
        hero.addEventListener('pointermove', (event) => {
            const rect = hero.getBoundingClientRect();
            hero.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
            hero.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
        });
    }

    const updateScrollState = () => {
        if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 18);
    };
    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });

    document.addEventListener('keydown', (event) => {
        const target = event.target;
        const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
        if (event.key === '/' && !isTyping && searchInput) {
            event.preventDefault();
            searchInput.focus();
            searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (event.key === 'Escape' && document.activeElement === searchInput) {
            searchInput.blur();
        }
    });
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
    initI18n();
    initSolExperience();
    loadProductsFromSheet(renderProducts);
});

document.addEventListener('cf:languagechange', () => {
    const searchInput = document.getElementById('searchInput');
    renderProducts(searchInput ? searchInput.value : "");
    updateCartUI();
    updateConfirmButtonText();
});

import './style.css';
import Papa from 'papaparse';
import { SHEET_CSV_URL, GAS_URL, SHOP_NAME, SHOP_VERSION, buildLineUrl, getLineOaUrl } from './config.js';
import { getLanguage, initI18n, t } from './i18n.js';
import { buildAnalyticsItem, buildCartItems, initAnalyticsTracking, trackEvent } from './analytics.js';
import {
    groupProducts, sortForStorefront, strainPath, esc, jsArg, getCardPerfectFor as getPerfectFor, isPremiumProduct, firstAvailableIndex,
    IMAGE_SIZES, optimizedImage, parseImageKeys,
} from './catalog.js';

let products = [];
const CART_KEY = 'sc_cart_v1';
const CART_TTL = 3 * 24 * 60 * 60 * 1000; // เก็บตะกร้าไว้ 3 วัน

function loadCart() {
    try {
        const saved = JSON.parse(localStorage.getItem(CART_KEY) || 'null');
        if (!saved || Date.now() - saved.ts > CART_TTL || !Array.isArray(saved.items)) return [];
        return saved.items.filter(i => i && i.name && i.size && Number(i.price) >= 0 && Number(i.qty) > 0);
    } catch {
        return [];
    }
}

function saveCart() {
    try {
        if (cart.length) localStorage.setItem(CART_KEY, JSON.stringify({ ts: Date.now(), items: cart }));
        else localStorage.removeItem(CART_KEY);
    } catch { /* เต็ม/ปิดไว้ */ }
}

let cart = loadCart();

// ตะกร้าที่จำไว้จากครั้งก่อน: ปรับราคาตามชีตล่าสุด และตัดรายการที่ไม่มีขาย/หมดแล้วออก
function reconcileCart() {
    if (!cart.length || !products.length) return;
    const isOut = p => ['หมด', 'sold out', '0'].includes(p.status);
    const next = [];
    cart.forEach(item => {
        const product = products.find(p => p.name === item.name);
        const variant = product && product.variants.find(v => v.size === item.size);
        if (!product || !variant || isOut(product) || variant.stock <= 0) return;
        next.push({ ...item, price: variant.price });
    });
    const changed = next.length !== cart.length || next.some((item, i) => item.price !== cart[i].price);
    cart = next;
    if (changed) updateCartUI();
}
// รูปสินค้าที่ build ล่าสุดย่อเป็น WebP ไว้ (dist/img) — รูปที่ไม่อยู่ในนี้ใช้ URL เดิมจากชีต
const builtImages = parseImageKeys(window.__imgKeys);
const cardImage = src => optimizedImage(src, IMAGE_SIZES.card, builtImages);
const fullImage = src => optimizedImage(src, IMAGE_SIZES.full, builtImages);
let currentCategory = "All";
let currentLineUrl = "";
// จ่ายเงินตอนรับสินค้าเท่านั้น (ไม่มีโอนล่วงหน้า/แนบสลิปแล้ว) · ค่าบริการจัดส่งจริง 50–80 บาทตามระยะทาง ไม่เกิน 100
// เว็บบวกค่าเริ่มต้นไว้ก่อน ร้านแจ้งยอดสุดท้ายตอนยืนยันออเดอร์ทาง LINE
const SERVICE_FEE = 50;
const PAYMENT_LABEL = 'เก็บเงินปลายทาง'; // ค่าที่บันทึกลงชีต Orders (หลังบ้านรู้จักคำนี้อยู่แล้ว)

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
];

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✨' : '❌';
    const iconEl = document.createElement('span');
    iconEl.textContent = icon;
    const textEl = document.createElement('span');
    textEl.textContent = message; // ข้อความมีชื่อสินค้าจากชีตปน: ใส่เป็น text ไม่ใช่ HTML
    toast.append(iconEl, ' ', textEl);
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

const CATALOG_CACHE_KEY = 'sc_sheet_cache'; // ใช้ร่วมกับหน้า strain (src/strain.js)
const CATALOG_CACHE_TTL = 5 * 60 * 1000;
let lastCatalogCsv = null;

function readCatalogCache() {
    try {
        const cached = JSON.parse(sessionStorage.getItem(CATALOG_CACHE_KEY) || 'null');
        if (cached && Date.now() - cached.ts < CATALOG_CACHE_TTL) return cached.csv;
    } catch (e) { /* ไม่มี cache */ }
    return null;
}

function fetchCatalogCsv() {
    // <head> ของ index.html เริ่มดึง CSV ไว้ก่อนแล้ว (window.__catalogCsv) ใช้ได้ครั้งเดียวตอนเปิดหน้า
    const early = window.__catalogCsv;
    window.__catalogCsv = null;
    const download = () => fetch(`${SHEET_CSV_URL}&t=${Date.now()}`).then(r => {
        if (!r.ok) throw new Error(`csv ${r.status}`);
        return r.text();
    });
    return (early ? early.catch(download) : download()).then(csv => {
        try { sessionStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify({ ts: Date.now(), csv })); } catch (e) { /* เต็ม/ปิดไว้ */ }
        return csv;
    });
}

function loadProductsFromSheet(callback, { useCache = false } = {}) {
    // โหลดรายการสินค้าจาก Google Sheet CSV (สาธารณะ)
    // useCache: แสดงจาก cache ของ session ก่อน (กลับมาจากหน้า strain จะเห็นสินค้าทันที) แล้วดึงของใหม่ตามหลัง
    let applied = false;
    const apply = (csv) => {
        if (applied && csv === lastCatalogCsv) return;
        if (applyCatalogCsv(csv)) {
            applied = true;
            lastCatalogCsv = csv;
            if (callback) callback(products);
        }
    };
    const cached = useCache ? readCatalogCache() : null;
    if (cached) apply(cached);
    fetchCatalogCsv().then(apply).catch(err => {
        console.error("Fetch Products Error:", err);
        if (!applied) showToast(t('store.product.loadError'), "error");
    });
}

// ข้อมูลเฉพาะหน้าร้านที่เติมให้สินค้าจาก groupProducts(): ขนาดที่เลือกอยู่ + ภาพประกอบเครื่องดื่ม
function decorateForStorefront(product) {
    const n = product.name.toLowerCase();
    let drinkTheme = 'herbal';
    if (n.includes('โยเกิร์ต')) drinkTheme = 'yogurt';
    else if (n.includes('ผลไม้') || n.includes('ผลไม')) drinkTheme = 'fruit';
    else if (n.includes('มิกซ์') || n.includes('mix') || n.includes('เซ็ต') || n.includes('set')) drinkTheme = 'mix';
    return {
        ...product,
        selectedVariantIdx: firstAvailableIndex(product),
        isDrinkPromotion: product.isDrink && (n.includes('เซ็ต') || n.includes('set') || n.includes('โปรโม')),
        drinkTheme,
        drinkLabel: product.name.replace(/ธรรมดา|พิเศษ|ออริจินัล|ธรรมชาติ/g, '').trim().split(' ').slice(-1)[0] || 'SC',
    };
}

function applyCatalogCsv(csvText) {
    // จัดกลุ่มแถว CSV เป็นสินค้าด้วยตัวเดียวกับหน้าสายพันธุ์และ prerender (src/catalog.js)
    const data = Papa.parse(csvText, { skipEmptyLines: true }).data || [];
    if (data.length < 2) {
        showToast(t('store.product.noData'), "error");
        return false;
    }

    // สินค้าที่มีแท็ก new ขึ้นก่อน
    const sheetProducts = sortForStorefront(groupProducts(data)).map(decorateForStorefront);
    const sheetNames = new Set(sheetProducts.map(product => product.name.trim().toLowerCase()));
    const localDrinks = DRINK_PRODUCTS.filter(product => !sheetNames.has(product.name.trim().toLowerCase()));
    products = [...sheetProducts, ...localDrinks];
    return true;
}

function initRevealObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0, rootMargin: '0px 0px 60px 0px' });

    document.querySelectorAll('.reveal:not(.active)').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
            el.classList.add('active');
        } else {
            observer.observe(el);
        }
    });
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
    const name = esc(product.name);
    const type = esc(product.aiType || 'FLOWER');
    const monogram = esc(getProductMonogram(product.name));

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
        // index.html มีการ์ดสินค้าที่ prerender ไว้ตอน build: เก็บไว้จนกว่าข้อมูลจริงจะมา แล้วสลับโดยไม่เล่นแอนิเมชันซ้ำ
        const hydrating = grid.dataset.ssr === '1';
        if (hydrating && products.length === 0) return;
        delete grid.dataset.ssr;
        grid.innerHTML = "";

        let q = "";
        if (typeof filter === "string") q = filter.toLowerCase();
        trackSearch(q);

        if (products.length === 0) {
            if (resultMeta) resultMeta.textContent = t('store.catalog.updating');
            grid.innerHTML = `<div class="empty-products animate-pulse">${t('store.catalog.loading')}</div>`;
            return;
        }

        const filtered = products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(q) || (p.note && p.note.toLowerCase().includes(q));
            const matchesCategory = currentCategory === "All"
                || (currentCategory === "พรีเมียม" && isPremiumProduct(p))
                || p.aiType === currentCategory
                || p.family === currentCategory;
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
            const nameArg = jsArg(p.name);
            const nameHtml = esc(p.name);
            const premium = isPremiumProduct(p);
            card.className = `product-card ${hydrating ? '' : 'reveal'} ${p.isDrink ? 'drink-card' : 'cursor-pointer'} ${p.isDrinkPromotion ? 'drink-promotion-card' : ''} ${premium ? 'premium-card' : ''}`;
            card.style.transitionDelay = `${(idx % 4) * 50}ms`;
            card.onclick = (e) => {
                if(e.target.closest('button') || e.target.closest('a')) return;
                if(p.isDrink) { window.openProductDetails(p.name); return; }
                if (!p.slug) { window.openProductDetails(p.name); return; }
                card.style.transitionDelay = '0ms';
                trackEvent('select_item', { item_list_name: currentCategory, items: [buildAnalyticsItem(p, p.variants[p.selectedVariantIdx])] });
                window.location.href = strainPath(p.slug);
            };
            const isOutOfStock = p.status === 'หมด' || p.status === 'sold out' || p.status === '0';

            const variant = p.variants[p.selectedVariantIdx];
            const isVariantOutOfStock = variant.stock <= 0;

            // width/height = สัดส่วนของกรอบรูป กันหน้าเลื่อนกระตุกตอนรูปมา (ขนาดจริงคุมด้วย CSS)
            const priorityAttr = `width="480" height="480" decoding="async" ${products.indexOf(p) < 4 ? 'fetchpriority="high"' : 'loading="lazy"'}`;

            card.innerHTML = `
                <div class="product-visual">
                    ${p.isDrink && p.image ? `
                        <img src="${esc(cardImage(p.image))}"
                             alt="${nameHtml}"
                             ${priorityAttr}
                             class="img-fade-in ${isOutOfStock || isVariantOutOfStock ? 'grayscale opacity-30' : ''}"
                             onload="this.classList.add('img-loaded')"
                             onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
                        <div class="drink-art drink-art-${p.drinkTheme}" role="img" aria-label="${nameHtml}" style="display:none;">
                            <span class="drink-orb drink-orb-one"></span>
                            <span class="drink-orb drink-orb-two"></span>
                            <div class="drink-bottle"><span class="drink-cap"></span><span class="drink-label"><small>SC</small><strong>${esc(p.drinkLabel)}</strong></span></div>
                        </div>
                    ` : p.isDrink ? `
                        <div class="drink-art drink-art-${p.drinkTheme}" role="img" aria-label="${nameHtml}">
                            <span class="drink-orb drink-orb-one"></span>
                            <span class="drink-orb drink-orb-two"></span>
                            <div class="drink-bottle ${p.isDrinkPromotion ? 'drink-bottle-left' : ''}">
                                <span class="drink-cap"></span>
                                <span class="drink-label"><small>SC</small><strong>${esc(p.drinkLabel)}</strong></span>
                            </div>
                            ${p.isDrinkPromotion ? `
                                <div class="drink-bottle drink-bottle-right">
                                    <span class="drink-cap"></span>
                                    <span class="drink-label"><small>SC</small><strong>SET</strong></span>
                                </div>` : ''}
                        </div>
                    ` : (p.image ? `
                        <img src="${esc(cardImage(p.image))}"
                             alt="${nameHtml}"
                             ${priorityAttr}
                             class="img-fade-in ${isOutOfStock || isVariantOutOfStock ? 'grayscale opacity-30' : ''}"
                             onload="this.classList.add('img-loaded')"
                             onerror="this.outerHTML='<span class=\\'text-3xl\\'>📦</span>';" />
                    ` : renderProductArt(p))}
                    <div class="product-badges">
                        ${p.isDrinkPromotion ? `<span class="drink-promo-badge">✦ PROMO SET</span>` : (premium ? `<span class="premium-badge text-[8px] px-2 py-1 rounded-full">✦ SELECT</span>` : (p.tags.length ? `<span class="product-pill">${esc(p.tags[0])}</span>` : ''))}
                        ${p.totalSold > 0 ? `<span class="product-pill sold">${t('store.product.sold', { count: p.totalSold })}</span>` : ''}
                    </div>
                    ${(isOutOfStock || isVariantOutOfStock) ? `<div class="absolute inset-0 bg-black/60 flex items-center justify-center transition-all opacity-100"><span class="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">OUT OF STOCK</span></div>` : ''}
                </div>
                <div class="product-content">
                    <div>
                        <p class="product-type">${esc(p.aiType || 'FLOWER')}</p>
                        <h3 class="product-name ${premium ? 'text-amber-100' : ''}">${!p.isDrink && p.slug ? `<a href="${strainPath(p.slug)}">${nameHtml}</a>` : nameHtml}</h3>
                        <p class="product-note">${esc(p.note)}</p>
                        ${!p.isDrink ? `<p class="perfect-for-strip">Perfect For <span>${getPerfectFor(p.family || p.aiType, p.tags).join(' / ')}</span></p>` : ''}
                    </div>

                    <div class="variant-row">
                        ${p.variants.map((v, vIdx) => `
                            <button onclick="window.selectVariant(${nameArg}, ${vIdx})"
                                class="variant-chip ${p.selectedVariantIdx === vIdx ? 'is-active' : ''} ${v.stock <= 0 ? 'is-empty' : ''}">
                                ${esc(v.size)}
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
                        <button onclick="window.addToCart(${nameArg}, ${p.selectedVariantIdx})"
                            ${isOutOfStock || isVariantOutOfStock ? 'disabled' : ''}
                            class="add-button" aria-label="${esc(t('store.product.addAria', { name: p.name }))}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                        </button>
                    </div>
                </div>
            `;
            if (hydrating) card.querySelectorAll('.img-fade-in').forEach(img => img.classList.add('img-loaded'));
            grid.appendChild(card);
        });
        
        initRevealObserver();
    } catch (err) {
        console.error("Render Error:", err);
        showToast(t('store.product.renderError'), "error");
    }
}

let searchTrackTimer;
function trackSearch(term) {
    clearTimeout(searchTrackTimer);
    const q = String(term || '').trim();
    if (q.length < 2) return;
    searchTrackTimer = setTimeout(() => trackEvent('search', { search_term: q.slice(0, 60) }), 1500);
}

function switchCategory(cat) {
    currentCategory = cat;
    trackEvent('select_content', { content_type: 'category', content_id: cat });
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

    trackEvent('view_item', {
        currency: 'THB',
        value: Number(variant.price) || 0,
        items: [buildAnalyticsItem(product, variant)],
    });
    
    const modalMainImage = document.getElementById('modalMainImage');
    const modalProductArt = document.getElementById('modalProductArt');
    if (product.image) {
        modalMainImage.src = fullImage(product.image);
        modalMainImage.alt = product.name;
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
            thumb.src = cardImage(imgSrc);
            thumb.alt = '';
            thumb.width = 64;
            thumb.height = 64;
            thumb.loading = 'lazy';
            thumb.className = "w-16 h-16 object-cover rounded-xl cursor-pointer hover:opacity-80 transition border-2 border-transparent hover:border-white/50";
            thumb.onclick = () => window.changeProductImage(fullImage(imgSrc));
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
    const nameArg = jsArg(product.name);

    priceEl.textContent = `${variant.price.toLocaleString()} ฿`;
    priceEl.className = premium ? 'text-2xl font-black text-amber-300' : 'text-2xl font-black text-white';

    // Render variant buttons
    if (variantsEl) {
        variantsEl.innerHTML = product.variants.map((v, vIdx) => `
            <button onclick="window.selectModalVariant(${nameArg}, ${vIdx})"
                class="px-4 py-2 text-sm border rounded-xl font-bold min-h-[40px] transition-all
                    ${product.selectedVariantIdx === vIdx
                        ? (premium ? 'bg-amber-400/30 border-amber-400/60 text-amber-200' : 'bg-white/20 border-white/40 text-white')
                        : 'bg-black/20 text-white/40 border-white/10'}
                    ${v.stock <= 0 ? 'opacity-30' : ''}">
                ${esc(v.size)} — ${v.price.toLocaleString()} ฿
            </button>
        `).join('');
    }

    const lineMsg = `สนใจสินค้า: ${product.name} (${variant.size}) ราคา ${variant.price.toLocaleString()} ฿`;
    actionEl.innerHTML = `
        <div class="flex flex-col gap-3 pb-2">
            <button onclick="window.addToCart(${nameArg}, ${product.selectedVariantIdx}); window.closeProductDetails();"
                    ${isOutOfStock ? 'disabled' : ''}
                    class="w-full ${premium ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black' : 'bg-white text-black'} py-4 rounded-2xl font-bold hover:opacity-90 transition shadow-xl disabled:opacity-40 disabled:cursor-not-allowed text-sm">
                ${isOutOfStock ? `❌ ${t('store.product.outOfStock')}` : (premium ? `👑 ${t('store.product.add')}` : `🛒 ${t('store.product.add')}`)}
            </button>
            ${!isOutOfStock ? `
            <a href="${esc(buildLineUrl(lineMsg))}" target="_blank" rel="noopener"
               data-analytics-event="contact_line" data-analytics-placement="product_detail"
               class="w-full bg-[#06C755] text-white py-4 rounded-2xl font-bold hover:bg-[#05b34c] transition shadow-xl shadow-green-900/30 text-sm text-center flex items-center justify-center gap-2">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.03 2 11c0 2.84 1.38 5.38 3.56 7.12L4.5 22l3.78-1.98C9.37 20.63 10.66 21 12 21c5.52 0 10-4.03 10-9S17.52 2 12 2z"/></svg>
                ${t('store.product.lineOrder')}
            </a>` : ''}
        </div>
    `;

    modal.classList.remove('cart-closed');
    modal.classList.add('cart-open');
    syncOverlayState();
}

function closeProductDetails() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.add('cart-closed');
        modal.classList.remove('cart-open');
    }
    syncOverlayState();
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
    else cart.push({ name: product.name, size: variant.size, price: variant.price, qty: 1, image: cardImage(product.image), icon: product.isDrink ? '🥤' : '📦', category: product.aiType || '' });

    trackEvent('add_to_cart', {
        currency: 'THB',
        value: Number(variant.price) || 0,
        items: [buildAnalyticsItem(product, variant)],
    });

    updateCartUI();
    toggleCart(true);
    showToast(t('store.product.added', { name: product.name }));
}

// มีตะกร้า/หน้าสั่งซื้อ/รายละเอียดสินค้าเปิดอยู่ไหม — ใช้ซ่อนปุ่มลอย LINE ไม่ให้ทับปุ่มยืนยัน
function syncOverlayState() {
    const cartOpen = !document.getElementById("cartSidebar").classList.contains("translate-x-full");
    const checkoutOpen = !document.getElementById('checkoutModal').classList.contains('hidden');
    const successOpen = !document.getElementById('successModal').classList.contains('hidden');
    const productOpen = document.getElementById('productModal')?.classList.contains('cart-open');
    document.body.classList.toggle('overlay-open', cartOpen || checkoutOpen || successOpen || !!productOpen);
}

function toggleCart(force = null) {
    const sidebar = document.getElementById("cartSidebar");
    const overlay = document.getElementById("cartOverlay");
    const isOpen = force !== null ? force : sidebar.classList.contains("translate-x-full");
    sidebar.classList.toggle("translate-x-full", !isOpen);
    overlay.classList.toggle("hidden", !isOpen);
    syncOverlayState();
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
                        ? `<img src="${esc(item.image)}" alt="${esc(item.name)}" width="64" height="64" class="w-16 h-16 object-cover rounded-xl bg-white shadow-sm" onerror="this.outerHTML='<div class=\\'cart-item-icon\\'>${item.icon || '📦'}</div>';">`
                        : `<div class="cart-item-icon">${item.icon || '📦'}</div>`}
                    <div class="flex-1">
                        <h4 class="font-bold text-slate-800 text-sm">${esc(item.name)}</h4>
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">${esc(item.size)}</p>
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
    saveCart();

    // ปุ่ม LINE ในตะกร้า: มีของในตะกร้า → เปิดแชตร้านพร้อมรายการที่เลือก (ไม่ต้องกรอกฟอร์ม) · ตะกร้าว่าง → เปิดแชตเฉยๆ
    const cartLineLink = document.getElementById('cartLineLink');
    if (cartLineLink) {
        const lines = cart.map(i => `- ${i.name} [${i.size}] x${i.qty} = ${(i.price * i.qty).toLocaleString()} ฿`).join('\n');
        cartLineLink.href = cart.length
            ? buildLineUrl(`สนใจสั่งซื้อ:\n${lines}\nรวม ${subtotal.toLocaleString()} ฿`)
            : getLineOaUrl();
    }
}

function updateQty(idx, change) {
    cart[idx].qty += change;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
    updateCartUI();
}

const cartSubtotal = () => cart.reduce((sum, item) => sum + item.price * item.qty, 0);

function updateCheckoutSummary() {
    const subtotal = cartSubtotal();
    const total = subtotal + SERVICE_FEE;
    const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    set('checkoutSubtotal', `${subtotal.toLocaleString()} ฿`);
    set('checkoutFee', `${SERVICE_FEE.toLocaleString()} ฿`);
    set('checkoutTotal', `${total.toLocaleString()} ฿`);
    const btn = document.getElementById('confirmBtn');
    if (btn && !btn.disabled) btn.textContent = t('store.checkout.confirmCodTotal', { total: total.toLocaleString() });
}

function showCheckoutError(message, field) {
    const box = document.getElementById('checkoutError');
    if (box) {
        box.textContent = message;
        box.classList.toggle('hidden', !message);
    }
    ['custName', 'custPhone', 'custAddress'].forEach(id => document.getElementById(id)?.removeAttribute('aria-invalid'));
    if (field) {
        field.setAttribute('aria-invalid', 'true');
        field.focus();
    }
}

function goToCheckout() {
    if (cart.length === 0) return;
    trackEvent('begin_checkout', { currency: 'THB', value: cartSubtotal(), items: buildCartItems(cart) });
    showCheckoutError('');
    updateCheckoutSummary();
    document.getElementById('checkoutModal').classList.remove('hidden');
    document.body.classList.add('overlay-open');
    document.getElementById('custName')?.focus({ preventScroll: true });
}

function closeCheckout() {
    document.getElementById('checkoutModal').classList.add('hidden');
    syncOverlayState();
}

async function submitOrder() {
    const btn = document.getElementById('confirmBtn');
    if (btn.disabled || cart.length === 0) return;
    const fields = {
        name: document.getElementById('custName'),
        phone: document.getElementById('custPhone'),
        address: document.getElementById('custAddress'),
    };
    const data = {
        name: fields.name.value.trim(),
        phone: fields.phone.value.trim(),
        email: (document.getElementById('custEmail')?.value || '').trim(),
        address: fields.address.value.trim(),
    };

    // บอกช่องที่ยังขาดและพาไปที่ช่องนั้น (เดิมขึ้นแค่ "กรอกให้ครบทุกช่อง")
    const missing = ['name', 'phone', 'address'].find(key => !data[key]);
    if (missing) return showCheckoutError(t('store.checkout.required'), fields[missing]);
    if (data.phone.replace(/\D/g, '').length < 8) return showCheckoutError(t('store.checkout.phoneInvalid'), fields.phone);
    showCheckoutError('');

    const subtotal = cartSubtotal();
    const finalTotal = subtotal + SERVICE_FEE;
    btn.disabled = true;
    btn.textContent = t('store.checkout.saving');

    try {
        const orderItems = cart.map(i => `${i.name} [${i.size}] x${i.qty}`).join(', ');
        const itemsArray = cart.map(i => ({ name: i.name, size: i.size, qty: i.qty }));

        // บันทึกลงชีต Orders + อีเมลแจ้งร้าน/ยืนยันลูกค้า (GAS) — ถ้าพลาด ลูกค้ายังไป LINE พร้อมรายการครบ ร้านจึงยังได้ออเดอร์
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
                    slipUrl: "COD (ไม่แนบสลิป)",
                    paymentMethod: PAYMENT_LABEL,
                    lang: getLanguage(), // ภาษาที่ลูกค้าใช้ตอนสั่ง → อีเมลยืนยันส่งเป็นภาษานี้
                    status: "รอดำเนินการ"
                })
            });
        } catch (e) {
            console.warn("บันทึกออเดอร์ลงชีตไม่สำเร็จ (ลูกค้ายังส่งออเดอร์ทาง LINE ได้):", e);
        }

        const itemsDetail = cart.map(i => `- ${i.name.toUpperCase()} [${i.size}] x${i.qty}`).join('\n');
        const lineMsg = `✨ ออเดอร์ใหม่! [${SHOP_NAME} v${SHOP_VERSION}]
💰 วิธีชำระ: ${PAYMENT_LABEL} (จ่ายตอนรับของ)
👤 ผู้รับ: ${data.name}
📞 เบอร์: ${data.phone}
🏠 ที่อยู่: ${data.address}

🛒 รายการ:
${itemsDetail}
ค่าสินค้า: ${subtotal.toLocaleString()} บาท
ค่าบริการจัดส่ง (เริ่มต้น): ${SERVICE_FEE} บาท
💰 ยอดรวมประมาณ: ${finalTotal.toLocaleString()} บาท
(รอร้านยืนยันยอดสุดท้ายและเวลาจัดส่ง)`;

        document.getElementById('finalOrderTotal').textContent = finalTotal.toLocaleString() + " ฿";
        document.getElementById('successModal').classList.remove('hidden');
        document.body.classList.add('overlay-open');

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

        // ออเดอร์ส่งแล้ว: ล้างตะกร้า กันสั่งซ้ำเมื่อกลับมาจาก LINE
        cart = [];
        saveCart();
        updateCartUI();

        // โหลด confetti เฉพาะตอนสั่งซื้อสำเร็จ (ไม่ต้องให้ทุกคนที่เปิดหน้าแรกโหลด 15KB นี้)
        import('canvas-confetti').then(({ default: confetti }) => confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#34d399', '#ffffff', '#fbbf24', '#06C755']
        })).catch(() => {});

        setTimeout(() => {
            if (!currentLineUrl) return;
            trackEvent('contact_line', { placement: 'order_success_auto' });
            window.location.href = currentLineUrl;
        }, 3000);
    } catch (e) {
        console.error('Submit order error:', e);
        showCheckoutError(t('store.checkout.error'));
        btn.disabled = false;
        updateCheckoutSummary();
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
    trackEvent('select_content', { content_type: 'category', content_id: 'premium' });
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
        if (event.key === 'Escape') {
            if (document.activeElement === searchInput) searchInput.blur();
            // ปิดหน้าต่างบนสุดที่เปิดอยู่ (หน้าสั่งซื้อสำเร็จไม่ปิดด้วย Esc)
            if (!document.getElementById('checkoutModal').classList.contains('hidden')) closeCheckout();
            else if (document.getElementById('productModal')?.classList.contains('cart-open')) closeProductDetails();
            else if (!document.getElementById('cartSidebar').classList.contains('translate-x-full')) toggleCart(false);
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
window.submitOrder = submitOrder;
window.openProductDetails = openProductDetails;
window.closeProductDetails = closeProductDetails;
window.changeProductImage = changeProductImage;
window.selectModalVariant = selectModalVariant;
window.switchCategoryPremium = switchCategoryPremium;
window.redirectToLine = () => {
    if (currentLineUrl) {
        trackEvent('contact_line', { placement: 'order_success_button' });
        window.location.href = currentLineUrl;
    } else window.location.reload();
};

document.addEventListener('DOMContentLoaded', () => {
    initI18n();
    initAnalyticsTracking();
    initSolExperience();
    updateCartUI();
    loadProductsFromSheet(() => {
        const searchInput = document.getElementById('searchInput');
        renderProducts(searchInput ? searchInput.value : "");
        reconcileCart();
        const intent = sessionStorage.getItem('sc_add_intent');
        if (intent) {
            sessionStorage.removeItem('sc_add_intent');
            try {
                const { name, variantIdx } = JSON.parse(intent);
                window.addToCart(name, variantIdx);
            } catch(e) {}
        }
    }, { useCache: true });
});

document.addEventListener('cf:languagechange', () => {
    const searchInput = document.getElementById('searchInput');
    renderProducts(searchInput ? searchInput.value : "");
    updateCartUI();
    updateCheckoutSummary();
});

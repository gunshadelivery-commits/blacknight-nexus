import Papa from 'papaparse';
import { SHEET_CSV_URL, GAS_URL, buildLineUrl, getLineOaUrl } from './config.js';

// ─── i18n ────────────────────────────────────────────────────────────────────

const STRAIN_I18N = {
    th: {
        backToShop:   '← กลับร้าน',
        home:         'หน้าแรก',
        strains:      'สายพันธุ์',
        perfectFor:   'เหมาะสำหรับ',
        type:         'ประเภท',
        location:     'สาขา',
        delivery:     'ส่งภายใน',
        tourists:     'นักท่องเที่ยว',
        welcome:      'ยินดีต้อนรับ ✓',
        selectSize:   'เลือกขนาด',
        addToCart:    'เพิ่มลงตะกร้า',
        orderLine:    'สั่งซื้อ LINE',
        gallery:      'แกลเลอรี',
        aboutStrain:  'เกี่ยวกับสายพันธุ์นี้',
        alsoLike:     'สายพันธุ์ที่น่าสนใจ',
        from:         'เริ่มต้น ฿',
        shopTitle:    'ร้านกัญชาที่ดีที่สุดใกล้ BTS อ่อนนุช',
        shopSub:      'ยินดีต้อนรับนักท่องเที่ยว · สตาฟฟ์พูดภาษาอังกฤษ · ส่งด่วน สุขุมวิท · เปิดทุกวัน 10:00–23:00',
        browseAll:    'ดูสายพันธุ์ทั้งหมด →',
        outOfStock:   '· หมดสต็อก',
        deliveryVal:  '~1 ชั่วโมง',
    },
    zh: {
        backToShop:   '← 返回商店',
        home:         '首页',
        strains:      '品种',
        perfectFor:   '适合',
        type:         '类型',
        location:     '地点',
        delivery:     '配送',
        tourists:     '游客',
        welcome:      '欢迎 ✓',
        selectSize:   '选择规格',
        addToCart:    '加入购物车',
        orderLine:    'LINE 下单',
        gallery:      '图库',
        aboutStrain:  '关于此品种',
        alsoLike:     '您可能也喜欢',
        from:         '起价 ฿',
        shopTitle:    '曼谷 On Nut BTS 附近最佳大麻店',
        shopSub:      '欢迎游客 · 英语员工 · Sukhumvit 快速配送 · 每日 10:00–23:00',
        browseAll:    '浏览所有品种 →',
        outOfStock:   '· 缺货',
        deliveryVal:  '~1 小时',
    },
    ko: {
        backToShop:   '← 쇼핑으로 돌아가기',
        home:         '홈',
        strains:      '품종',
        perfectFor:   '추천 효과',
        type:         '타입',
        location:     '위치',
        delivery:     '배달',
        tourists:     '관광객',
        welcome:      '환영합니다 ✓',
        selectSize:   '사이즈 선택',
        addToCart:    '장바구니 추가',
        orderLine:    'LINE 주문',
        gallery:      '갤러리',
        aboutStrain:  '이 품종 정보',
        alsoLike:     '이런 품종도 좋아요',
        from:         '시작가 ฿',
        shopTitle:    'BTS 온눗 근처 방콕 최고의 대마초 매장',
        shopSub:      '관광객 환영 · 영어 직원 · Sukhumvit 빠른 배달 · 매일 10:00–23:00',
        browseAll:    '모든 품종 보기 →',
        outOfStock:   '· 품절',
        deliveryVal:  '~1 시간',
    },
    en: {
        backToShop:   '← Back to Shop',
        home:         'Home',
        strains:      'Strains',
        perfectFor:   'PERFECT FOR',
        type:         'TYPE',
        location:     'LOCATION',
        delivery:     'DELIVERY',
        tourists:     'TOURISTS',
        welcome:      'Welcome ✓',
        selectSize:   'SELECT SIZE',
        addToCart:    'Add to Cart',
        orderLine:    'Order on LINE',
        gallery:      'GALLERY',
        aboutStrain:  'ABOUT THIS STRAIN',
        alsoLike:     'YOU MAY ALSO LIKE',
        from:         'from ฿',
        shopTitle:    "Bangkok's Best Cannabis Shop Near BTS On Nut",
        shopSub:      'Tourists & expats welcome · English staff · Express delivery Sukhumvit · Open daily 10:00–23:00',
        browseAll:    'Browse All Strains →',
        outOfStock:   '· Out of Stock',
        deliveryVal:  '~1 Hour',
    },
};

function getLang() {
    try {
        const l = localStorage.getItem('cf_language') || 'en';
        return STRAIN_I18N[l] ? l : 'en';
    } catch { return 'en'; }
}

function t(key) {
    return STRAIN_I18N[getLang()][key] || STRAIN_I18N.en[key] || key;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function toSlug(name = '') {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function fromSlug(slug = '') {
    return decodeURIComponent(slug).replace(/-/g, ' ');
}

function classifyType(name = '', tags = []) {
    const n = (name + ' ' + tags.join(' ')).toLowerCase();
    if (['pre-roll','preroll','พรีโรล','มวนสำเร็จ'].some(s => n.includes(s))) return 'Pre-roll';
    if (['sativa','ซาติวา'].some(s => n.includes(s)) && ['indica','อินดิก้า'].some(s => n.includes(s))) return 'Hybrid';
    if (['hybrid','ไฮบริด'].some(s => n.includes(s))) return 'Hybrid';
    if (['sativa','ซาติวา'].some(s => n.includes(s))) return 'Sativa';
    if (['indica','อินดิก้า'].some(s => n.includes(s))) return 'Indica';
    return 'Hybrid';
}

function getPerfectFor(type = '') {
    const t = type.toLowerCase();
    if (t.includes('pre-roll') || t.includes('preroll')) return ['SMOOTH SMOKE', 'CONVENIENT', 'SOCIAL'];
    if (t === 'sativa') return ['ENERGY & FOCUS', 'CREATIVITY', 'DAYTIME USE'];
    if (t === 'indica') return ['DEEP RELAX', 'SLEEP SUPPORT', 'BODY RELIEF'];
    return ['BALANCE', 'EUPHORIA', 'SOCIAL EASE'];
}

function getBadgeClass(type = '') {
    const t = type.toLowerCase();
    if (t.includes('sativa')) return 'badge-sativa';
    if (t.includes('indica')) return 'badge-indica';
    if (t.includes('pre-roll') || t.includes('preroll')) return 'badge-preroll';
    return 'badge-hybrid';
}

function buildEnDescription(p) {
    const type = p.aiType || 'Hybrid';
    const price = p.variants[0]?.price || 0;
    const pFor = getPerfectFor(type).join(', ');
    return `${p.name} is a premium ${type} cannabis strain available at Siam Cannabis On Nut, Bangkok's top dispensary near BTS On Nut · Sukhumvit. ` +
        `Starting from ฿${price.toLocaleString()}. Perfect for ${pFor}. ` +
        `Express delivery to On Nut, Phra Khanong, Udom Suk and nearby Sukhumvit areas within ~1 hour. Tourists & expats welcome. Age 20+ only.`;
}

function buildSchema(p) {
    const minPrice = Math.min(...p.variants.map(v => v.price));
    const maxPrice = Math.max(...p.variants.map(v => v.price));
    const type = p.aiType || 'Hybrid';
    const pFor = getPerfectFor(type).join(', ');
    return {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Product",
                "name": p.name,
                "description": `Premium ${type} cannabis strain. Perfect for ${pFor}. Available at Siam Cannabis On Nut Bangkok.`,
                "brand": { "@type": "Brand", "name": "Siam Cannabis" },
                "image": p.image || "https://blacknight69.com/og-image.jpg",
                "category": type,
                "offers": {
                    "@type": "AggregateOffer",
                    "lowPrice": minPrice,
                    "highPrice": maxPrice,
                    "priceCurrency": "THB",
                    "availability": "https://schema.org/InStock",
                    "seller": { "@type": "Organization", "name": "Siam Cannabis" }
                }
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://blacknight69.com/" },
                    { "@type": "ListItem", "position": 2, "name": "Strains", "item": "https://blacknight69.com/index.html#products" },
                    { "@type": "ListItem", "position": 3, "name": p.name, "item": `https://blacknight69.com/strain.html?s=${encodeURIComponent(toSlug(p.name))}` }
                ]
            }
        ]
    };
}

// ─── render ─────────────────────────────────────────────────────────────────

let currentVariantIdx = 0;
let currentProduct = null;

function render(p, allProducts) {
    currentProduct = p;
    currentVariantIdx = 0;

    const type = p.aiType || classifyType(p.name, p.tags);
    const perfectFor = getPerfectFor(type);
    const badgeClass = getBadgeClass(type);
    const enDesc = buildEnDescription(p);
    const slug = toSlug(p.name);
    const canonicalUrl = `https://blacknight69.com/strain.html?s=${encodeURIComponent(slug)}`;

    // ── SEO meta ──
    document.title = `${p.name} ${type} | Siam Cannabis Bangkok · On Nut Dispensary`;
    setMeta('description', `${p.name} — Premium ${type} cannabis at Siam Cannabis On Nut Bangkok. ${perfectFor.join(' / ')}. Starting ฿${p.variants[0]?.price?.toLocaleString()}. Express delivery Sukhumvit. Tourists welcome.`);
    setMeta('og:title', `${p.name} | Siam Cannabis Bangkok`);
    setMeta('og:description', enDesc);
    setMeta('og:url', canonicalUrl);
    setMeta('og:image', p.image || 'https://blacknight69.com/og-image.jpg');

    // ── canonical ──
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = canonicalUrl;

    // ── hreflang ──
    document.querySelectorAll('link[hreflang]').forEach(l => l.href = canonicalUrl);

    // ── JSON-LD ──
    const schemaEl = document.getElementById('strain-schema');
    if (schemaEl) schemaEl.textContent = JSON.stringify(buildSchema(p));

    // ── HTML ──
    const related = allProducts
        .filter(x => x !== p && !x.isDrink && (x.aiType === type || x.aiType === p.aiType))
        .slice(0, 4);

    const galleryExtra = (p.images || []).filter(i => i && i !== p.image).slice(0, 5);

    document.getElementById('strain-content').innerHTML = `
        <nav class="breadcrumb" aria-label="Breadcrumb">
            <a href="index.html">${t('home')}</a> › <a href="index.html#products">${t('strains')}</a> › ${p.name}
        </nav>

        <div class="hero-grid">
            <!-- Image -->
            <div class="strain-image-wrap">
                ${p.image
                    ? `<img id="main-img" src="${p.image}" alt="${p.name} cannabis strain Bangkok" loading="eager">`
                    : `<div class="strain-image-placeholder">🌿</div>`
                }
            </div>

            <!-- Info -->
            <div>
                <span class="strain-type-badge ${badgeClass}">${type.toUpperCase()}</span>
                <h1 class="strain-name">${p.name}</h1>
                <p class="strain-tagline">${p.note || `Premium ${type} cannabis available at Siam Cannabis On Nut, Bangkok.`}</p>

                <p class="perfect-for-label">${t('perfectFor')}</p>
                <div class="perfect-for-tags">
                    ${perfectFor.map(tag => `<span class="perfect-tag">${tag}</span>`).join('')}
                </div>

                <div class="attr-grid">
                    <div class="attr-card">
                        <p class="attr-label">${t('type')}</p>
                        <p class="attr-value">${type}</p>
                    </div>
                    <div class="attr-card">
                        <p class="attr-label">${t('location')}</p>
                        <p class="attr-value">On Nut · BTS</p>
                    </div>
                    <div class="attr-card">
                        <p class="attr-label">${t('delivery')}</p>
                        <p class="attr-value">${t('deliveryVal')}</p>
                    </div>
                    <div class="attr-card">
                        <p class="attr-label">${t('tourists')}</p>
                        <p class="attr-value">${t('welcome')}</p>
                    </div>
                </div>

                <hr class="divider">

                <div class="price-section">
                    <p class="price-label">${t('selectSize')}</p>
                    <div class="variants-wrap" id="variants-wrap">
                        ${p.variants.map((v, i) => `
                            <button class="variant-btn ${i === 0 ? 'is-active' : ''} ${v.stock <= 0 ? 'opacity-40' : ''}"
                                onclick="selectVariant(${i})" data-idx="${i}">
                                ${v.size}${v.stock <= 0 ? t('outOfStock') : ''}
                            </button>
                        `).join('')}
                    </div>
                    <div class="price-display" id="price-display">
                        ${p.variants[0]?.price?.toLocaleString() || '—'}<span class="currency">฿</span>
                        ${p.variants[0]?.originalPrice ? `<span style="font-size:16px;color:var(--muted);text-decoration:line-through;margin-left:8px;">${p.variants[0].originalPrice.toLocaleString()} ฿</span>` : ''}
                    </div>
                </div>

                <div class="cta-row">
                    <button class="btn-primary" onclick="addToCartAndBack()">${t('addToCart')}</button>
                    <a href="${getLineOaUrl()}" class="btn-line" target="_blank" rel="noopener">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 5.94 2 10.76c0 2.91 1.59 5.49 4.07 7.2-.16.57-.53 2.07-.6 2.37-.09.37.14.37.3.27.12-.08 1.93-1.3 2.71-1.83.5.07 1.01.11 1.52.11 5.52 0 10-3.94 10-8.76S17.52 2 12 2z"/></svg>
                        ${t('orderLine')}
                    </a>
                </div>
            </div>
        </div>

        ${galleryExtra.length > 0 ? `
        <section style="margin-top:40px;">
            <p class="section-title">${t('gallery')}</p>
            <div class="gallery-grid">
                ${galleryExtra.map(img => `
                    <div class="gallery-thumb" onclick="document.getElementById('main-img').src='${img}'">
                        <img src="${img}" alt="${p.name} cannabis photo" loading="lazy">
                    </div>
                `).join('')}
            </div>
        </section>` : ''}

        <!-- English description (SEO content for Google) -->
        <section style="margin-top:40px; background:rgba(255,255,255,0.02); border:1px solid var(--border); border-radius:16px; padding:24px;">
            <p class="section-title">${t('aboutStrain')}</p>
            <p class="desc-en">${enDesc}</p>
            <p class="desc-en" style="margin-top:12px;">
                <strong style="color:var(--green);">Siam Cannabis On Nut</strong> is Bangkok's premier cannabis dispensary located near BTS On Nut (Sukhumvit Soi 77).
                We carry premium Sativa, Indica and Hybrid strains sourced from certified Thai growers.
                Express 1-hour delivery available to On Nut, Phra Khanong, Udom Suk, Suan Luang and surrounding Sukhumvit areas.
                Our English-speaking staff are ready to help tourists and expats find their perfect strain.
                Must be 20 years or older. Cannabis for personal use only, in compliance with Thai law.
            </p>
            ${p.note ? `<p class="desc-th" style="margin-top:12px;">🇹🇭 ${p.note}</p>` : ''}
        </section>

        ${related.length > 0 ? `
        <section style="margin-top:40px;">
            <p class="section-title">${t('alsoLike')}</p>
            <div class="related-grid">
                ${related.map(r => `
                    <a href="strain.html?s=${encodeURIComponent(toSlug(r.name))}" class="related-card">
                        <p class="related-type">${r.aiType || 'FLOWER'}</p>
                        <p class="related-name">${r.name}</p>
                        <p class="related-price">${t('from')}${r.variants[0]?.price?.toLocaleString()}</p>
                    </a>
                `).join('')}
            </div>
        </section>` : ''}

        <!-- Bottom CTA -->
        <section style="margin-top:48px; text-align:center; padding:32px 16px; background:rgba(74,222,128,0.05); border:1px solid rgba(74,222,128,0.12); border-radius:20px;">
            <p style="font-size:11px;font-weight:700;letter-spacing:0.12em;color:var(--green);margin-bottom:8px;">SIAM CANNABIS · ON NUT</p>
            <h2 style="font-size:20px;font-weight:800;margin-bottom:8px;">${t('shopTitle')}</h2>
            <p style="font-size:13px;color:var(--muted);margin-bottom:20px;">${t('shopSub')}</p>
            <a href="index.html" style="display:inline-block;background:var(--green);color:#031a07;font-weight:800;font-size:14px;padding:12px 28px;border-radius:12px;text-decoration:none;">${t('browseAll')}</a>
        </section>
    `;

    document.getElementById('loading').style.display = 'none';
    document.getElementById('strain-content').style.display = 'block';

    // update nav back button text
    const backBtn = document.getElementById('back-btn');
    if (backBtn) backBtn.lastChild.textContent = ' ' + t('backToShop');

    // expose to inline onclick
    window.selectVariant = (idx) => {
        currentVariantIdx = idx;
        document.querySelectorAll('.variant-btn').forEach((b, i) => b.classList.toggle('is-active', i === idx));
        const v = currentProduct.variants[idx];
        document.getElementById('price-display').innerHTML =
            `${v.price.toLocaleString()}<span class="currency">฿</span>` +
            (v.originalPrice ? `<span style="font-size:16px;color:var(--muted);text-decoration:line-through;margin-left:8px;">${v.originalPrice.toLocaleString()} ฿</span>` : '');
    };

    window.addToCartAndBack = () => {
        // store intent in sessionStorage so index.html can pick it up
        sessionStorage.setItem('sc_add_intent', JSON.stringify({ name: currentProduct.name, variantIdx: currentVariantIdx }));
        window.location.href = 'index.html';
    };
}

function setMeta(name, content) {
    let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(name.startsWith('og:') ? 'property' : 'name', name);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}

// ─── main ────────────────────────────────────────────────────────────────────

const params = new URLSearchParams(window.location.search);
const rawSlug = params.get('s') || '';
const targetName = fromSlug(rawSlug).trim().toLowerCase();

function parseAndRender(csvText) {
    const results = Papa.parse(csvText, { skipEmptyLines: true });
    const data = results.data || [];
    const grouped = {};
    data.slice(1).forEach(row => {
        const name = row[0];
        if (!name || !name.trim()) return;
        if (!grouped[name]) {
            let tags = (row[5] || '').toString().split(',').map(t => t.trim()).filter(Boolean);
            let images = (row[4] || '').toString().split(',').map(i => i.trim()).filter(Boolean);
            if (!images.length) images = [''];
            grouped[name] = {
                name,
                note: row[3] || '',
                image: images[0],
                images,
                tags,
                status: (row[6] || '').trim().toLowerCase(),
                variants: [],
                totalSold: 0,
                aiType: (row[9] && row[9].toString().trim()) || null,
                isDrink: false,
            };
            if (!grouped[name].aiType) {
                grouped[name].aiType = classifyType(name, grouped[name].tags);
            }
        }
        grouped[name].variants.push({
            size: row[1] || 'Standard',
            price: parseFloat(row[2]) || 0,
            stock: parseInt(row[7]) || 0,
            originalPrice: null,
        });
        grouped[name].totalSold += parseInt(row[8]) || 0;
    });
    const allProducts = Object.values(grouped);
    const found = allProducts.find(p => toSlug(p.name) === rawSlug || p.name.trim().toLowerCase() === targetName);
    if (!found) {
        document.getElementById('loading').innerHTML = `<p>Strain not found. <a href="index.html" style="color:var(--green);">Back to shop</a></p>`;
        return;
    }
    render(found, allProducts);
}

const CACHE_KEY = 'sc_sheet_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

if (!targetName) {
    window.location.href = 'index.html';
} else {
    try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
            const { ts, csv } = JSON.parse(cached);
            if (Date.now() - ts < CACHE_TTL) {
                parseAndRender(csv);
            } else {
                sessionStorage.removeItem(CACHE_KEY);
                throw new Error('stale');
            }
        } else {
            throw new Error('miss');
        }
    } catch {
        fetch(`${SHEET_CSV_URL}&t=${Date.now()}`)
            .then(r => r.text())
            .then(csv => {
                try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), csv })); } catch {}
                parseAndRender(csv);
            })
            .catch(() => {
                document.getElementById('loading').innerHTML = `<p>Could not load strain data. <a href="index.html" style="color:var(--green);">Back to shop</a></p>`;
            });
    }
}

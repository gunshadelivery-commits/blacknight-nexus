// หน้าสายพันธุ์: ข้อความ 4 ภาษา, SEO meta/JSON-LD และ HTML ของหน้า — ใช้ทั้งในเบราว์เซอร์ (strain.js) และตอน build (scripts/prerender.mjs)
// ต้องรันใน Node ได้เหมือน catalog.js: ห้ามแตะ DOM และห้าม import config.js
import {
    SITE_URL, IMAGE_SIZES, esc, strainPath, strainUrl, isAccessory, getPerfectFor, isSoldOut,
} from './catalog.js';

export const STRAIN_I18N = {
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

export function makeT(lang) {
    const table = STRAIN_I18N[lang] || STRAIN_I18N.en;
    return (key) => table[key] || STRAIN_I18N.en[key] || key;
}

export function getBadgeClass(type = '') {
    const t = type.toLowerCase();
    if (t.includes('sativa')) return 'badge-sativa';
    if (t.includes('indica')) return 'badge-indica';
    if (t.includes('pre-roll') || t.includes('preroll')) return 'badge-preroll';
    return 'badge-hybrid';
}

// คำเรียกสินค้าในประโยคอังกฤษ ตามหมวดในชีต (flower / trim / อุปกรณ์ / Sativa ...)
function describeKind(type = '') {
    const t = type.toLowerCase();
    if (isAccessory(type)) return 'cannabis accessory';
    if (t === 'trim') return 'indoor cannabis trim';
    if (t === 'flower') return 'premium cannabis flower';
    if (t.includes('pre-roll') || t.includes('preroll')) return 'cannabis pre-roll';
    if (['sativa', 'indica', 'hybrid'].includes(t)) return `premium ${type} cannabis strain`;
    return 'premium cannabis product';
}

// ─── SEO ─────────────────────────────────────────────────────────────────────

function absoluteImage(image) {
    if (!image) return `${SITE_URL}/og-image.jpg`;
    if (/^https?:\/\//i.test(image)) return image;
    return `${SITE_URL}/${image.replace(/^\/+/, '')}`;
}

function minPrice(p) {
    const prices = p.variants.map(v => v.price).filter(n => n > 0);
    return prices.length ? Math.min(...prices) : 0;
}

export function buildEnDescription(p) {
    const type = p.aiType || 'Hybrid';
    const kind = describeKind(type);
    const article = /^[aeiou]/i.test(kind) ? 'an' : 'a';
    const intro = `${p.name.trim()} is ${article} ${kind} available at Siam Cannabis On Nut, Bangkok's top dispensary near BTS On Nut · Sukhumvit. Starting from ฿${minPrice(p).toLocaleString('en-US')}.`;
    const effects = isAccessory(type) ? '' : ` Perfect for ${getPerfectFor(type).join(', ')}.`;
    return `${intro}${effects} Express delivery to On Nut, Phra Khanong, Udom Suk and nearby Sukhumvit areas within ~1 hour. Tourists & expats welcome. Age 20+ only.`;
}

export function buildThDescription(p) {
    const what = isAccessory(p.aiType) ? 'อุปกรณ์' : 'กัญชา';
    return `สั่ง ${p.name.trim()} ${what}ส่งด่วนถึงบ้านภายในประมาณ 1 ชั่วโมง ย่านอ่อนนุช สุขุมวิท พระโขนง อุดมสุข สวนหลวง ราคาเริ่มต้น ${minPrice(p).toLocaleString('en-US')} บาท สั่งง่ายผ่าน LINE ส่งฟรีในย่านอ่อนนุช จำหน่ายเฉพาะผู้มีอายุ 20 ปีขึ้นไป`;
}

export function strainMeta(p) {
    const type = p.aiType || 'Hybrid';
    const name = p.name.trim();
    const label = ['sativa', 'indica', 'hybrid'].includes(type.toLowerCase()) ? ` ${type}` : '';
    const what = isAccessory(type) ? 'อุปกรณ์กัญชา' : 'กัญชาส่งด่วน';
    return {
        title: `${name}${label} — ${what} อ่อนนุช | Siam Cannabis Bangkok`,
        description: `${name}${label} — ${what} อ่อนนุช สุขุมวิท Bangkok. ราคาเริ่ม ฿${minPrice(p).toLocaleString('en-US')}. ${p.note ? String(p.note).trim().slice(0, 90) + ' · ' : ''}Express delivery ~1hr. Tourists welcome. 20+`,
        ogTitle: `${name} | Siam Cannabis Bangkok`,
        ogDescription: buildEnDescription(p),
        canonical: strainUrl(p.slug),
        image: absoluteImage(p.image),
    };
}

export function buildSchema(p) {
    const prices = p.variants.map(v => v.price).filter(n => n > 0);
    const type = p.aiType || 'Hybrid';
    return {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Product',
                name: p.name.trim(),
                description: buildEnDescription(p),
                brand: { '@type': 'Brand', name: 'Siam Cannabis' },
                image: absoluteImage(p.image),
                category: type,
                offers: {
                    '@type': 'AggregateOffer',
                    lowPrice: prices.length ? Math.min(...prices) : 0,
                    highPrice: prices.length ? Math.max(...prices) : 0,
                    offerCount: p.variants.length,
                    priceCurrency: 'THB',
                    availability: isSoldOut(p) ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
                    seller: { '@type': 'Organization', name: 'Siam Cannabis' },
                },
            },
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
                    { '@type': 'ListItem', position: 2, name: 'Strains', item: `${SITE_URL}/#products` },
                    { '@type': 'ListItem', position: 3, name: p.name.trim(), item: strainUrl(p.slug) },
                ],
            },
        ],
    };
}

// ─── HTML ของหน้าสายพันธุ์ (ใช้ทั้งตอน build และตอนรันในเบราว์เซอร์) ───────────────

const LINE_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 5.94 2 10.76c0 2.91 1.59 5.49 4.07 7.2-.16.57-.53 2.07-.6 2.37-.09.37.14.37.3.27.12-.08 1.93-1.3 2.71-1.83.5.07 1.01.11 1.52.11 5.52 0 10-3.94 10-8.76S17.52 2 12 2z"/></svg>';

export function pickRelated(p, allProducts) {
    return allProducts
        .filter(x => x !== p && x.slug && x.slug !== p.slug && !x.isDrink && x.aiType === p.aiType)
        .slice(0, 4);
}

// img(src, size) คืน URL รูปที่จะใช้จริง (ผู้เรียกส่งตัวที่รู้ว่ารูปไหนย่อไว้ตอน build มาให้)
export function renderStrainHtml(p, allProducts, { t, lineUrl, img = src => src }) {
    const type = p.aiType || 'Hybrid';
    const accessory = isAccessory(type);
    const perfectFor = getPerfectFor(type);
    const name = esc(p.name.trim());
    const note = esc(p.note || '');
    const first = p.variants[0];
    const related = pickRelated(p, allProducts);
    const gallery = (p.images || []).filter(i => i && i !== p.image).slice(0, 5);

    return `
        <nav class="breadcrumb" aria-label="Breadcrumb">
            <a href="/">${t('home')}</a> › <a href="/#products">${t('strains')}</a> › ${name}
        </nav>

        <div class="hero-grid">
            <div class="strain-image-wrap">
                ${p.image
                    ? `<img id="main-img" src="${esc(img(p.image, IMAGE_SIZES.full))}" alt="${name} cannabis Bangkok — Siam Cannabis On Nut" width="960" height="960" fetchpriority="high" decoding="async">`
                    : `<div class="strain-image-placeholder">🌿</div>`}
            </div>

            <div>
                <span class="strain-type-badge ${getBadgeClass(type)}">${esc(type.toUpperCase())}</span>
                <h1 class="strain-name">${name}</h1>
                <p class="strain-tagline">${note || `Premium ${esc(type)} cannabis available at Siam Cannabis On Nut, Bangkok.`}</p>

                ${accessory ? '' : `
                <p class="perfect-for-label">${t('perfectFor')}</p>
                <div class="perfect-for-tags">
                    ${perfectFor.map(tag => `<span class="perfect-tag">${tag}</span>`).join('')}
                </div>`}

                <div class="attr-grid">
                    <div class="attr-card"><p class="attr-label">${t('type')}</p><p class="attr-value">${esc(type)}</p></div>
                    <div class="attr-card"><p class="attr-label">${t('location')}</p><p class="attr-value">On Nut · BTS</p></div>
                    <div class="attr-card"><p class="attr-label">${t('delivery')}</p><p class="attr-value">${t('deliveryVal')}</p></div>
                    <div class="attr-card"><p class="attr-label">${t('tourists')}</p><p class="attr-value">${t('welcome')}</p></div>
                </div>

                <hr class="divider">

                <div class="price-section">
                    <p class="price-label">${t('selectSize')}</p>
                    <div class="variants-wrap" id="variants-wrap">
                        ${p.variants.map((v, i) => `
                            <button class="variant-btn ${i === 0 ? 'is-active' : ''}" ${v.stock <= 0 ? 'style="opacity:0.4"' : ''}
                                onclick="selectVariant(${i})" data-idx="${i}">
                                ${esc(v.size)}${v.stock <= 0 ? ' ' + t('outOfStock') : ''}
                            </button>`).join('')}
                    </div>
                    <div class="price-display" id="price-display">${first ? variantPriceHtml(first) : '—'}</div>
                </div>

                <div class="cta-row">
                    <button class="btn-primary" onclick="addToCartAndBack()">${t('addToCart')}</button>
                    <a href="${esc(lineUrl)}" class="btn-line" target="_blank" rel="noopener"
                       data-analytics-event="contact_line" data-analytics-placement="strain">
                        ${LINE_ICON}
                        ${t('orderLine')}
                    </a>
                </div>
            </div>
        </div>

        ${gallery.length ? `
        <section style="margin-top:40px;">
            <p class="section-title">${t('gallery')}</p>
            <div class="gallery-grid">
                ${gallery.map(g => `
                    <button type="button" class="gallery-thumb" data-full="${esc(img(g, IMAGE_SIZES.full))}" onclick="document.getElementById('main-img').src=this.dataset.full">
                        <img src="${esc(img(g, IMAGE_SIZES.card))}" alt="${name} cannabis photo" width="160" height="160" loading="lazy" decoding="async">
                    </button>`).join('')}
            </div>
        </section>` : ''}

        <section style="margin-top:40px; background:rgba(255,255,255,0.02); border:1px solid var(--border); border-radius:16px; padding:24px;">
            <h2 class="section-title">${t('aboutStrain')}</h2>
            <p class="desc-en">${esc(buildEnDescription(p))}</p>
            <p class="desc-en" style="margin-top:12px;">
                <strong style="color:var(--green);">Siam Cannabis On Nut</strong> is Bangkok's premier cannabis dispensary located near BTS On Nut (Sukhumvit Soi 77).
                We carry premium Sativa, Indica and Hybrid strains sourced from certified Thai growers.
                Express 1-hour delivery available to On Nut, Phra Khanong, Udom Suk, Suan Luang and surrounding Sukhumvit areas.
                Our English-speaking staff are ready to help tourists and expats find their perfect strain.
                Must be 20 years or older. Cannabis for personal use only, in compliance with Thai law.
            </p>
            <p class="desc-th" style="margin-top:12px;">🇹🇭 ${note ? note + ' — ' : ''}${esc(buildThDescription(p))}</p>
        </section>

        ${related.length ? `
        <section style="margin-top:40px;">
            <h2 class="section-title">${t('alsoLike')}</h2>
            <div class="related-grid">
                ${related.map(r => `
                    <a href="${strainPath(r.slug)}" class="related-card">
                        <p class="related-type">${esc(r.aiType || 'FLOWER')}</p>
                        <p class="related-name">${esc(r.name.trim())}</p>
                        <p class="related-price">${t('from')}${minPrice(r).toLocaleString('en-US')}</p>
                    </a>`).join('')}
            </div>
        </section>` : ''}

        <section style="margin-top:48px; text-align:center; padding:32px 16px; background:rgba(74,222,128,0.05); border:1px solid rgba(74,222,128,0.12); border-radius:20px;">
            <p style="font-size:11px;font-weight:700;letter-spacing:0.12em;color:var(--green);margin-bottom:8px;">SIAM CANNABIS · ON NUT</p>
            <h2 style="font-size:20px;font-weight:800;margin-bottom:8px;">${esc(t('shopTitle'))}</h2>
            <p style="font-size:13px;color:var(--muted);margin-bottom:20px;">${esc(t('shopSub'))}</p>
            <a href="/" style="display:inline-block;background:var(--green);color:#031a07;font-weight:800;font-size:14px;padding:12px 28px;border-radius:12px;text-decoration:none;">${t('browseAll')}</a>
        </section>
    `;
}

export function variantPriceHtml(v) {
    return `${v.price.toLocaleString('en-US')}<span class="currency">฿</span>` +
        (v.originalPrice ? `<span style="font-size:16px;color:var(--muted);text-decoration:line-through;margin-left:8px;">${v.originalPrice.toLocaleString('en-US')} ฿</span>` : '');
}

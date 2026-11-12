// หน้าสายพันธุ์: ข้อความ 4 ภาษา, SEO meta/JSON-LD และ HTML ของหน้า — ใช้ทั้งในเบราว์เซอร์ (strain.js) และตอน build (scripts/prerender.mjs)
// ต้องรันใน Node ได้เหมือน catalog.js: ห้ามแตะ DOM และห้าม import config.js
import {
    SITE_URL, IMAGE_SIZES, esc, strainPath, strainUrl, isAccessory, getPerfectFor, isSoldOut, firstAvailableIndex,
} from './catalog.js';

export const STRAIN_I18N = {
    th: {
        backToShop:   'กลับหน้าร้าน',
        home:         'หน้าแรก',
        strains:      'สายพันธุ์',
        perfectFor:   'เหมาะสำหรับ',
        type:         'ประเภท',
        location:     'พื้นที่',
        delivery:     'ส่งภายใน',
        tourists:     'นักท่องเที่ยว',
        welcome:      'ยินดีต้อนรับ ✓',
        selectSize:   'เลือกขนาด',
        addToCart:    'เพิ่มลงตะกร้า',
        orderLine:    'สั่งซื้อ LINE',
        askLine:      'ถามร้านทาง LINE',
        gallery:      'แกลเลอรี',
        aboutStrain:  'เกี่ยวกับสินค้านี้',
        alsoLike:     'สินค้าที่น่าสนใจ',
        from:         'เริ่มต้น ฿',
        shopTitle:    'ร้านกัญชาส่งด่วน ใกล้ BTS อ่อนนุช',
        shopSub:      'ยินดีต้อนรับนักท่องเที่ยว · สตาฟฟ์พูดภาษาอังกฤษ · ส่งด่วนย่านสุขุมวิท · เริ่มรับออเดอร์ 09:00',
        browseAll:    'ดูสินค้าทั้งหมด →',
        outOfStock:   '· หมดสต็อก',
        soldOut:      'สินค้าหมดชั่วคราว',
        soldOutHint:  'สินค้านี้หมดชั่วคราว ทัก LINE ถามวันเข้าของหรือให้ร้านแนะนำตัวใกล้เคียงได้',
        deliveryVal:  '~1 ชั่วโมง',
        lineInterest: 'สนใจสินค้า',
        linePrice:    'ราคา',
    },
    zh: {
        backToShop:   '返回商店',
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
        askLine:      '通过 LINE 咨询',
        gallery:      '图库',
        aboutStrain:  '关于此商品',
        alsoLike:     '您可能也喜欢',
        from:         '起价 ฿',
        shopTitle:    '曼谷 On Nut BTS 附近的大麻快送店',
        shopSub:      '欢迎游客 · 英语员工 · Sukhumvit 快速配送 · 09:00 起接单',
        browseAll:    '浏览所有商品 →',
        outOfStock:   '· 缺货',
        soldOut:      '暂时缺货',
        soldOutHint:  '此商品暂时缺货，请通过 LINE 询问到货时间或让我们推荐类似品种。',
        deliveryVal:  '~1 小时',
    },
    ko: {
        backToShop:   '쇼핑으로 돌아가기',
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
        askLine:      'LINE으로 문의',
        gallery:      '갤러리',
        aboutStrain:  '상품 정보',
        alsoLike:     '이런 상품도 좋아요',
        from:         '시작가 ฿',
        shopTitle:    'BTS 온눗 근처 방콕 대마초 빠른 배달',
        shopSub:      '관광객 환영 · 영어 직원 · Sukhumvit 빠른 배달 · 09:00부터 주문 가능',
        browseAll:    '모든 상품 보기 →',
        outOfStock:   '· 품절',
        soldOut:      '일시 품절',
        soldOutHint:  '현재 품절입니다. LINE으로 재입고 일정이나 비슷한 품종을 문의하세요.',
        deliveryVal:  '~1 시간',
    },
    en: {
        backToShop:   'Back to Shop',
        home:         'Home',
        strains:      'Strains',
        perfectFor:   'PERFECT FOR',
        type:         'TYPE',
        location:     'AREA',
        delivery:     'DELIVERY',
        tourists:     'TOURISTS',
        welcome:      'Welcome ✓',
        selectSize:   'SELECT SIZE',
        addToCart:    'Add to Cart',
        orderLine:    'Order on LINE',
        askLine:      'Ask us on LINE',
        gallery:      'GALLERY',
        aboutStrain:  'ABOUT THIS PRODUCT',
        alsoLike:     'YOU MAY ALSO LIKE',
        from:         'from ฿',
        shopTitle:    'Express Cannabis Delivery Near BTS On Nut, Bangkok',
        shopSub:      'Tourists & expats welcome · English staff · Express delivery Sukhumvit · Orders from 09:00',
        browseAll:    'Browse All Products →',
        outOfStock:   '· Out of Stock',
        soldOut:      'Temporarily out of stock',
        soldOutHint:  'This one is out of stock for now. Message us on LINE for the restock date or a similar strain.',
        deliveryVal:  '~1 Hour',
        // ข้อความที่แนบไปกับปุ่ม LINE (สตาฟฟ์อ่าน): ไทยสำหรับหน้าไทย นอกนั้นใช้อังกฤษชุดนี้
        lineInterest: 'Interested in',
        linePrice:    'price',
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

// คำเรียกสินค้าในประโยคไทย
function describeKindTh(type = '') {
    const t = type.toLowerCase();
    if (isAccessory(type)) return 'อุปกรณ์สำหรับสายเขียว';
    if (t === 'trim') return 'ใบทริมกัญชา';
    if (t.includes('pre-roll') || t.includes('preroll')) return 'กัญชามวนสำเร็จ (พรีโรล)';
    if (t === 'sativa') return 'ดอกกัญชาสายซาติวา (Sativa)';
    if (t === 'indica') return 'ดอกกัญชาสายอินดิก้า (Indica)';
    if (t === 'hybrid') return 'ดอกกัญชาสายไฮบริด (Hybrid)';
    return 'ดอกกัญชา';
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

const baht = n => Number(n).toLocaleString('en-US');

// แท็กจากชีตที่สั้นพอจะโชว์เป็นป้าย (เช่น "THC 29%", "อินดิก้า 70") — ข้ามแท็กระบบและแท็กที่เป็นประโยคยาว
export function displayTags(p) {
    const hidden = ['new', 'สินค้าใหม่'];
    return (p.tags || [])
        .map(tag => String(tag).trim())
        .filter(tag => tag && tag.length <= 26 && !hidden.includes(tag.toLowerCase()))
        .slice(0, 6);
}

export function buildEnDescription(p) {
    const type = p.aiType || 'Hybrid';
    const kind = describeKind(type);
    const article = /^[aeiou]/i.test(kind) ? 'an' : 'a';
    const intro = `${p.name.trim()} is ${article} ${kind} available at Siam Cannabis On Nut, Bangkok's top dispensary near BTS On Nut · Sukhumvit. Starting from ฿${baht(minPrice(p))}.`;
    const effects = isAccessory(type) ? '' : ` Perfect for ${getPerfectFor(p.family || type).join(', ')}.`;
    return `${intro}${effects} Express delivery to On Nut, Phra Khanong, Udom Suk and nearby Sukhumvit areas within ~1 hour. Tourists & expats welcome. Age 20+ only.`;
}

// เนื้อหาไทยของหน้า: ใช้เฉพาะข้อมูลจากชีต (ชื่อ ประเภท ขนาด ราคา) + เงื่อนไขบริการที่หน้าแรกประกาศไว้แล้ว
export function buildThContent(p) {
    const name = p.name.trim();
    const accessory = isAccessory(p.aiType);
    const sizes = p.variants.map(v => String(v.size).trim()).filter(Boolean);
    const sizeText = sizes.length > 1 ? ` มีให้เลือก ${sizes.length} ขนาด (${sizes.join(', ')})` : '';
    return {
        heading: accessory
            ? `สั่ง ${name} ส่งด่วน อ่อนนุช · สุขุมวิท`
            : `สั่ง ${name} — กัญชาส่งด่วน อ่อนนุช · สุขุมวิท`,
        intro: `${name} เป็น${describeKindTh(p.aiType)}จากร้าน Siam Cannabis อ่อนนุช ราคาเริ่มต้น ${baht(minPrice(p))} บาท${sizeText}`,
        delivery: 'กดเพิ่มลงตะกร้าบนหน้านี้ หรือทัก LINE ร้านเพื่อสั่งได้เลย ร้านส่งด่วนถึงที่ภายในประมาณ 1 ชั่วโมงในย่านอ่อนนุช พระโขนง อุดมสุข สวนหลวง และสุขุมวิทใกล้เคียง ส่งฟรีในย่านอ่อนนุช ชำระได้ทั้งโอนเงินและเก็บเงินปลายทาง (+50 บาท)',
        legal: 'จำหน่ายเฉพาะผู้ที่มีอายุ 20 ปีขึ้นไป งดจำหน่ายแก่สตรีมีครรภ์และสตรีให้นมบุตร',
    };
}

export function strainMeta(p) {
    const type = p.aiType || 'Hybrid';
    const name = p.name.trim();
    const label = ['sativa', 'indica', 'hybrid'].includes(type.toLowerCase()) ? ` ${type}` : '';
    const what = isAccessory(type) ? 'อุปกรณ์กัญชา' : 'กัญชาส่งด่วน';
    return {
        title: `${name}${label} — ${what} อ่อนนุช | Siam Cannabis Bangkok`,
        description: `${name}${label} — ${what} อ่อนนุช สุขุมวิท Bangkok. ราคาเริ่ม ฿${baht(minPrice(p))}. ${p.note ? String(p.note).trim().slice(0, 90) + ' · ' : ''}Express delivery ~1hr. Tourists welcome. 20+`,
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
                url: strainUrl(p.slug),
                offers: {
                    '@type': 'AggregateOffer',
                    lowPrice: prices.length ? Math.min(...prices) : 0,
                    highPrice: prices.length ? Math.max(...prices) : 0,
                    offerCount: p.variants.length,
                    priceCurrency: 'THB',
                    availability: isSoldOut(p) ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
                    seller: { '@id': `${SITE_URL}/#organization` },
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

const LINE_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 5.94 2 10.76c0 2.91 1.59 5.49 4.07 7.2-.16.57-.53 2.07-.6 2.37-.09.37.14.37.3.27.12-.08 1.93-1.3 2.71-1.83.5.07 1.01.11 1.52.11 5.52 0 10-3.94 10-8.76S17.52 2 12 2z"/></svg>';

// สินค้าที่แนะนำท้ายหน้า: หมวดเดียวกันและยังมีของก่อน แล้วเติมด้วยตัวที่ยังมีของจากหมวดอื่น (ลิงก์ภายในให้ครบ 6)
export function pickRelated(p, allProducts, limit = 6) {
    const pool = allProducts.filter(x => x !== p && x.slug && x.slug !== p.slug && !x.isDrink);
    const sameKind = x => x.aiType === p.aiType || (p.family && x.family === p.family);
    const accessory = isAccessory(p.aiType);
    const ordered = [
        ...pool.filter(x => sameKind(x) && !isSoldOut(x)),
        ...pool.filter(x => !sameKind(x) && !isSoldOut(x) && isAccessory(x.aiType) === accessory),
        ...pool.filter(x => sameKind(x) && isSoldOut(x)),
    ];
    return [...new Set(ordered)].slice(0, limit);
}

// ข้อความที่แนบไปกับปุ่ม LINE ของขนาดที่เลือก
export function lineMessage(p, variant, t) {
    const name = p.name.trim();
    if (!variant) return `${t('lineInterest')}: ${name}`;
    return `${t('lineInterest')}: ${name} (${variant.size}) ${t('linePrice')} ${baht(variant.price)} ฿`;
}

export function variantPriceHtml(v) {
    return `${baht(v.price)}<span class="currency">฿</span>` +
        (v.originalPrice ? `<span style="font-size:16px;color:var(--muted);text-decoration:line-through;margin-left:8px;">${baht(v.originalPrice)} ฿</span>` : '');
}

// img(src, size) คืน URL รูปที่จะใช้จริง · lineUrlFor(message) คืนลิงก์ LINE ของร้านพร้อมข้อความ (ผู้เรียกส่งมาเพราะไฟล์นี้อ่าน config ไม่ได้)
export function renderStrainHtml(p, allProducts, { t, lineUrlFor, img = src => src }) {
    const type = p.aiType || 'Hybrid';
    const accessory = isAccessory(type);
    const perfectFor = getPerfectFor(p.family || type);
    const name = esc(p.name.trim());
    const note = esc(String(p.note || '').trim());
    const soldOut = isSoldOut(p);
    const selectedIdx = firstAvailableIndex(p);
    const selected = p.variants[selectedIdx];
    const related = pickRelated(p, allProducts);
    const gallery = (p.images || []).filter(i => i && i !== p.image).slice(0, 5);
    const tags = displayTags(p);
    const th = buildThContent(p);
    const lineHref = esc(lineUrlFor(lineMessage(p, selected, t)));
    const lineLabel = soldOut ? t('askLine') : t('orderLine');

    return `
        <nav class="breadcrumb" aria-label="Breadcrumb">
            <a href="/">${t('home')}</a> › <a href="/#products">${t('strains')}</a> › <span aria-current="page">${name}</span>
        </nav>

        <div class="hero-grid">
            <div class="strain-image-wrap">
                ${p.image
                    ? `<img id="main-img" src="${esc(img(p.image, IMAGE_SIZES.full))}" alt="${name} — Siam Cannabis On Nut Bangkok" width="960" height="960" fetchpriority="high" decoding="async"${soldOut ? ' style="filter:grayscale(1);opacity:.55;"' : ''}>`
                    : `<div class="strain-image-placeholder" aria-hidden="true">🌿</div>`}
                ${soldOut ? `<span class="sold-out-flag">${t('soldOut')}</span>` : ''}
            </div>

            <div>
                <span class="strain-type-badge ${getBadgeClass(type)}">${esc(type.toUpperCase())}</span>
                <h1 class="strain-name">${name}</h1>
                <p class="strain-tagline">${note || `Premium ${esc(type)} cannabis available at Siam Cannabis On Nut, Bangkok.`}</p>

                ${tags.length ? `<ul class="strain-tags">${tags.map(tag => `<li>${esc(tag)}</li>`).join('')}</ul>` : ''}

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
                    <p class="price-label" id="size-label">${t('selectSize')}</p>
                    <div class="variants-wrap" id="variants-wrap" role="group" aria-labelledby="size-label">
                        ${p.variants.map((v, i) => `
                            <button type="button" class="variant-btn ${i === selectedIdx ? 'is-active' : ''} ${v.stock <= 0 ? 'is-empty' : ''}"
                                aria-pressed="${i === selectedIdx}" onclick="selectVariant(${i})" data-idx="${i}">
                                ${esc(v.size)}${v.stock <= 0 ? ' ' + t('outOfStock') : ''}
                            </button>`).join('')}
                    </div>
                    <div class="price-display" id="price-display" aria-live="polite">${selected ? variantPriceHtml(selected) : '—'}</div>
                </div>

                ${soldOut ? `<p class="sold-out-hint">${t('soldOutHint')}</p>` : ''}

                <div class="cta-row" id="cta-row">
                    <button type="button" class="btn-primary" id="add-btn" onclick="addToCartAndBack()" ${soldOut || !selected || selected.stock <= 0 ? 'disabled' : ''}>${soldOut ? t('soldOut') : t('addToCart')}</button>
                    <a href="${lineHref}" class="btn-line" id="line-btn" target="_blank" rel="noopener"
                       data-analytics-event="contact_line" data-analytics-placement="strain">
                        ${LINE_ICON}
                        ${lineLabel}
                    </a>
                </div>
            </div>
        </div>

        ${gallery.length ? `
        <section style="margin-top:40px;">
            <h2 class="section-title">${t('gallery')}</h2>
            <div class="gallery-grid">
                ${gallery.map(g => `
                    <button type="button" class="gallery-thumb" data-full="${esc(img(g, IMAGE_SIZES.full))}" onclick="document.getElementById('main-img').src=this.dataset.full">
                        <img src="${esc(img(g, IMAGE_SIZES.card))}" alt="${name} photo" width="160" height="160" loading="lazy" decoding="async">
                    </button>`).join('')}
            </div>
        </section>` : ''}

        <section class="about-box" lang="th">
            <h2 class="about-heading">${esc(th.heading)}</h2>
            <p class="desc-th">${esc(th.intro)}${note ? ` — ${note}` : ''}</p>
            <p class="desc-th">${esc(th.delivery)}</p>
            <p class="desc-th desc-legal">${esc(th.legal)}</p>
        </section>

        <section class="about-box" lang="en">
            <h2 class="section-title">${t('aboutStrain')}</h2>
            <p class="desc-en">${esc(buildEnDescription(p))}</p>
            <p class="desc-en">
                <strong style="color:var(--green);">Siam Cannabis On Nut</strong> is Bangkok's premier cannabis dispensary located near BTS On Nut (Sukhumvit Soi 77).
                We carry premium Sativa, Indica and Hybrid strains sourced from certified Thai growers.
                Express 1-hour delivery available to On Nut, Phra Khanong, Udom Suk, Suan Luang and surrounding Sukhumvit areas.
                Our English-speaking staff are ready to help tourists and expats find their perfect strain.
                Must be 20 years or older. Cannabis for personal use only, in compliance with Thai law.
            </p>
        </section>

        ${related.length ? `
        <section style="margin-top:40px;">
            <h2 class="section-title">${t('alsoLike')}</h2>
            <div class="related-grid">
                ${related.map(r => `
                    <a href="${strainPath(r.slug)}" class="related-card">
                        ${r.image ? `<img src="${esc(img(r.image, IMAGE_SIZES.card))}" alt="" width="160" height="160" loading="lazy" decoding="async">` : ''}
                        <span class="related-type">${esc(r.aiType || 'FLOWER')}</span>
                        <span class="related-name">${esc(r.name.trim())}</span>
                        <span class="related-price">${t('from')}${baht(minPrice(r))}</span>
                    </a>`).join('')}
            </div>
        </section>` : ''}

        <section style="margin-top:48px; text-align:center; padding:32px 16px; background:rgba(74,222,128,0.05); border:1px solid rgba(74,222,128,0.12); border-radius:20px;">
            <p style="font-size:11px;font-weight:700;letter-spacing:0.12em;color:var(--green);margin-bottom:8px;">SIAM CANNABIS · ON NUT</p>
            <h2 style="font-size:20px;font-weight:800;margin-bottom:8px;">${esc(t('shopTitle'))}</h2>
            <p style="font-size:13px;color:var(--muted-strong);margin-bottom:20px;">${esc(t('shopSub'))}</p>
            <a href="/#products" class="browse-all">${t('browseAll')}</a>
        </section>

        <div class="sticky-cta" id="sticky-cta" hidden>
            <div class="sticky-cta-info">
                <span class="sticky-cta-name">${name}</span>
                <span class="sticky-cta-price" id="sticky-price">${selected ? `${esc(selected.size)} · ${baht(selected.price)} ฿` : ''}</span>
            </div>
            <button type="button" class="btn-primary" id="sticky-add" onclick="addToCartAndBack()" ${soldOut || !selected || selected.stock <= 0 ? 'disabled' : ''}>${soldOut ? t('soldOut') : t('addToCart')}</button>
            <a href="${lineHref}" class="btn-line" id="sticky-line" target="_blank" rel="noopener" aria-label="${esc(lineLabel)}"
               data-analytics-event="contact_line" data-analytics-placement="strain_sticky">${LINE_ICON}</a>
        </div>
    `;
}

import Papa from 'papaparse';
import { SHEET_CSV_URL, GAS_URL, buildLineUrl, getLineOaUrl } from './config.js';

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
            <a href="index.html">Home</a> › <a href="index.html#products">Strains</a> › ${p.name}
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

                <p class="perfect-for-label">PERFECT FOR</p>
                <div class="perfect-for-tags">
                    ${perfectFor.map(tag => `<span class="perfect-tag">${tag}</span>`).join('')}
                </div>

                <div class="attr-grid">
                    <div class="attr-card">
                        <p class="attr-label">TYPE</p>
                        <p class="attr-value">${type}</p>
                    </div>
                    <div class="attr-card">
                        <p class="attr-label">LOCATION</p>
                        <p class="attr-value">On Nut · BTS</p>
                    </div>
                    <div class="attr-card">
                        <p class="attr-label">DELIVERY</p>
                        <p class="attr-value">~1 Hour</p>
                    </div>
                    <div class="attr-card">
                        <p class="attr-label">TOURISTS</p>
                        <p class="attr-value">Welcome ✓</p>
                    </div>
                </div>

                <hr class="divider">

                <div class="price-section">
                    <p class="price-label">SELECT SIZE</p>
                    <div class="variants-wrap" id="variants-wrap">
                        ${p.variants.map((v, i) => `
                            <button class="variant-btn ${i === 0 ? 'is-active' : ''} ${v.stock <= 0 ? 'opacity-40' : ''}"
                                onclick="selectVariant(${i})" data-idx="${i}">
                                ${v.size}${v.stock <= 0 ? ' · Out of Stock' : ''}
                            </button>
                        `).join('')}
                    </div>
                    <div class="price-display" id="price-display">
                        ${p.variants[0]?.price?.toLocaleString() || '—'}<span class="currency">฿</span>
                        ${p.variants[0]?.originalPrice ? `<span style="font-size:16px;color:var(--muted);text-decoration:line-through;margin-left:8px;">${p.variants[0].originalPrice.toLocaleString()} ฿</span>` : ''}
                    </div>
                </div>

                <div class="cta-row">
                    <button class="btn-primary" onclick="addToCartAndBack()">Add to Cart</button>
                    <a href="${getLineOaUrl()}" class="btn-line" target="_blank" rel="noopener">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 5.94 2 10.76c0 2.91 1.59 5.49 4.07 7.2-.16.57-.53 2.07-.6 2.37-.09.37.14.37.3.27.12-.08 1.93-1.3 2.71-1.83.5.07 1.01.11 1.52.11 5.52 0 10-3.94 10-8.76S17.52 2 12 2z"/></svg>
                        Order on LINE
                    </a>
                </div>
            </div>
        </div>

        ${galleryExtra.length > 0 ? `
        <section style="margin-top:40px;">
            <p class="section-title">GALLERY</p>
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
            <p class="section-title">ABOUT THIS STRAIN</p>
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
            <p class="section-title">YOU MAY ALSO LIKE</p>
            <div class="related-grid">
                ${related.map(r => `
                    <a href="strain.html?s=${encodeURIComponent(toSlug(r.name))}" class="related-card">
                        <p class="related-type">${r.aiType || 'FLOWER'}</p>
                        <p class="related-name">${r.name}</p>
                        <p class="related-price">from ฿${r.variants[0]?.price?.toLocaleString()}</p>
                    </a>
                `).join('')}
            </div>
        </section>` : ''}

        <!-- Bottom CTA -->
        <section style="margin-top:48px; text-align:center; padding:32px 16px; background:rgba(74,222,128,0.05); border:1px solid rgba(74,222,128,0.12); border-radius:20px;">
            <p style="font-size:11px;font-weight:700;letter-spacing:0.12em;color:var(--green);margin-bottom:8px;">SIAM CANNABIS · ON NUT</p>
            <h2 style="font-size:20px;font-weight:800;margin-bottom:8px;">Bangkok's Best Cannabis Shop Near BTS On Nut</h2>
            <p style="font-size:13px;color:var(--muted);margin-bottom:20px;">Tourists & expats welcome · English staff · Express delivery Sukhumvit · Open daily 10:00–23:00</p>
            <a href="index.html" style="display:inline-block;background:var(--green);color:#031a07;font-weight:800;font-size:14px;padding:12px 28px;border-radius:12px;text-decoration:none;">Browse All Strains →</a>
        </section>
    `;

    document.getElementById('loading').style.display = 'none';
    document.getElementById('strain-content').style.display = 'block';

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

if (!targetName) {
    window.location.href = 'index.html';
} else {
    Papa.parse(`${SHEET_CSV_URL}&t=${Date.now()}`, {
        download: true,
        complete: (results) => {
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
        },
        error: () => {
            document.getElementById('loading').innerHTML = `<p>Could not load strain data. <a href="index.html" style="color:var(--green);">Back to shop</a></p>`;
        }
    });
}

// Vite plugin: หลัง build เสร็จ ดึงสินค้าจาก Google Sheet แล้วสร้างไฟล์ static ให้ Google เก็บ index ได้โดยไม่ต้องรัน JS
//   dist/strain/<slug>/index.html  หน้าสายพันธุ์ทีละตัว (title/description/JSON-LD/เนื้อหาครบ)
//   dist/index.html                ใส่การ์ดสินค้า + ลิงก์ไปหน้าสายพันธุ์ไว้ใน #productList
//   dist/sitemap.xml               สร้างจากสินค้าจริงในชีต
//   dist/404.html                  หน้าสายพันธุ์แบบ dynamic สำหรับสินค้าที่เพิ่มหลัง deploy ล่าสุด
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import Papa from 'papaparse';
import { loadEnv } from 'vite';
import {
    SITE_URL, IMAGE_SIZES, esc, groupProducts, sortForStorefront, strainUrl, isSoldOut, isPremiumProduct, getCardPerfectFor,
    imageKey, optimizedImage,
} from '../src/catalog.js';
import { buildProductImages } from './images.mjs';
import { makeT, strainMeta, buildSchema, renderStrainHtml } from '../src/strainView.js';

async function fetchCsv(url, attempts = 3) {
    let lastError;
    for (let i = 1; i <= attempts; i++) {
        try {
            const res = await fetch(`${url}&t=${Date.now()}`, { signal: AbortSignal.timeout(20000) });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const text = await res.text();
            if (!text.startsWith('name,')) throw new Error('ไม่ใช่ CSV ของชีต Products');
            return text;
        } catch (err) {
            lastError = err;
            await new Promise(r => setTimeout(r, 1500 * i));
        }
    }
    throw new Error(`[prerender] ดึง Google Sheet CSV ไม่สำเร็จ: ${lastError?.message}`);
}

function replaceBetween(html, startMarker, endMarker, content) {
    const start = html.indexOf(`<!-- ${startMarker}`);
    const endToken = `<!-- ${endMarker} -->`;
    const end = html.indexOf(endToken);
    if (start < 0 || end < 0) throw new Error(`[prerender] ไม่พบ marker ${startMarker}/${endMarker}`);
    return html.slice(0, start) + content + html.slice(end + endToken.length);
}

const jsonForScript = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

// บอกหน้าเว็บว่ารูปไหนย่อไว้แล้ว (src/catalog.js → parseImageKeys/optimizedImage)
function imageKeysScript(sources, built) {
    const keys = [...new Set(sources.filter(Boolean).map(imageKey).filter(k => built.has(k)))];
    return `<script>window.__imgKeys=${JSON.stringify(keys.join(','))}</script>`;
}

function strainHead(p, built) {
    const meta = strainMeta(p);
    const hero = optimizedImage(p.image, IMAGE_SIZES.full, built);
    return `${imageKeysScript(p.images || [], built)}
    ${hero ? `<link rel="preload" as="image" href="${esc(hero)}" fetchpriority="high">` : ''}
    <title>${esc(meta.title)}</title>
    <meta name="description" content="${esc(meta.description)}">
    <meta name="robots" content="index, follow, max-image-preview:large">
    <link rel="canonical" href="${meta.canonical}">
    <meta property="og:type" content="product">
    <meta property="og:site_name" content="Siam Cannabis Bangkok">
    <meta property="og:title" content="${esc(meta.ogTitle)}">
    <meta property="og:description" content="${esc(meta.ogDescription)}">
    <meta property="og:url" content="${meta.canonical}">
    <meta property="og:image" content="${esc(meta.image)}">
    <meta property="og:locale" content="en_US">
    <script type="application/ld+json" id="strain-schema">${jsonForScript(buildSchema(p))}</script>
    <script type="application/json" id="strain-data">${jsonForScript({ name: p.name, aiType: p.aiType, variants: p.variants })}</script>`;
}

function strainBody(p, products, lineUrl, built) {
    const html = renderStrainHtml(p, products, {
        t: makeT('en'),
        lineUrl,
        img: (src, size) => optimizedImage(src, size, built),
    });
    return `<div class="loading-state" id="loading" style="display:none;"></div>
        <div id="strain-content" data-prerendered="1">${html}</div>`;
}

// การ์ดแบบเดียวกับที่ src/main.js วาด (ฉบับอ่านอย่างเดียว) — main.js จะแทนที่ด้วยการ์ดจริงเมื่อข้อมูลล่าสุดมาถึง
function staticCard(p, index, built) {
    const premium = isPremiumProduct(p);
    const soldOut = isSoldOut(p) || (p.variants[0]?.stock ?? 0) <= 0;
    const name = esc(p.name);
    const href = p.slug && !p.isDrink ? `/strain/${encodeURIComponent(p.slug)}/` : '';
    const loading = `width="480" height="480" decoding="async" ${index < 4 ? 'fetchpriority="high"' : 'loading="lazy"'}`;
    const image = optimizedImage(p.image, IMAGE_SIZES.card, built);
    const first = p.variants[0] || { price: 0 };
    const badge = premium
        ? '<span class="premium-badge text-[8px] px-2 py-1 rounded-full">✦ SELECT</span>'
        : (p.tags.length ? `<span class="product-pill">${esc(p.tags[0])}</span>` : '');
    return `<div class="product-card ${p.isDrink ? 'drink-card' : 'cursor-pointer'} ${premium ? 'premium-card' : ''}">
                <div class="product-visual">
                    ${image ? `<img src="${esc(image)}" alt="${name}" ${loading} class="${soldOut ? 'grayscale opacity-30' : ''}">` : ''}
                    <div class="product-badges">${badge}${p.totalSold > 0 ? `<span class="product-pill sold">${p.totalSold}+ sold</span>` : ''}</div>
                </div>
                <div class="product-content">
                    <div>
                        <p class="product-type">${esc(p.aiType || 'FLOWER')}</p>
                        <h3 class="product-name ${premium ? 'text-amber-100' : ''}">${href ? `<a href="${href}">${name}</a>` : name}</h3>
                        <p class="product-note">${esc(p.note)}</p>
                        ${p.isDrink ? '' : `<p class="perfect-for-strip">Perfect For <span>${getCardPerfectFor(p.aiType, p.tags).join(' / ')}</span></p>`}
                    </div>
                    <div class="variant-row">
                        ${p.variants.map((v, i) => `<span class="variant-chip ${i === 0 ? 'is-active' : ''} ${v.stock <= 0 ? 'is-empty' : ''}">${esc(v.size)}</span>`).join('')}
                    </div>
                    <div class="product-bottom">
                        <div>
                            <p class="product-price-label">From</p>
                            <div class="product-price-row"><p class="product-price ${premium ? 'text-amber-200' : ''}">${first.price.toLocaleString('en-US')} ฿</p></div>
                        </div>
                    </div>
                </div>
            </div>`;
}

function buildSitemap(pages, strains, today) {
    const entry = ({ loc, changefreq, priority }) => `  <url>
    <loc>${esc(loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...pages, ...strains.map(p => ({ loc: strainUrl(p.slug), changefreq: 'weekly', priority: isSoldOut(p) ? '0.5' : '0.8' }))].map(entry).join('\n')}
</urlset>
`;
}

// dev server ไม่มีไฟล์ /strain/<slug>/ (สร้างตอน build) จึงส่งหน้า strain.html แบบ dynamic ให้แทน
export function strainDevRoutes() {
    return {
        name: 'strain-dev-routes',
        apply: 'serve',
        configureServer(server) {
            server.middlewares.use((req, _res, next) => {
                if (/^\/strain\/[^/]+\/?(\?.*)?$/.test(req.url || '')) req.url = '/strain.html';
                next();
            });
        },
    };
}

export function prerenderCatalog() {
    let mode = 'production';
    let root = process.cwd();
    return {
        name: 'prerender-catalog',
        apply: 'build',
        configResolved(config) {
            mode = config.mode;
            root = config.root;
        },
        async closeBundle() {
            const env = { ...loadEnv(mode, root, 'VITE_'), ...process.env };
            const csvUrl = env.VITE_SHEET_CSV_URL;
            const dist = resolve(root, 'dist');
            const today = new Date().toISOString().slice(0, 10);
            const basePages = [
                { loc: `${SITE_URL}/`, changefreq: 'daily', priority: '1.0' },
                { loc: `${SITE_URL}/accessories.html`, changefreq: 'daily', priority: '0.9' },
            ];

            const shell = await readFile(resolve(dist, 'strain.html'), 'utf8');
            await writeFile(resolve(dist, '404.html'), shell.replace('content="index, follow"', 'content="noindex"'));

            if (!csvUrl) {
                console.warn('[prerender] ไม่มี VITE_SHEET_CSV_URL — ข้ามการสร้างหน้าสายพันธุ์ (sitemap มีแค่หน้าหลัก)');
                await writeFile(resolve(dist, 'sitemap.xml'), buildSitemap(basePages, [], today));
                return;
            }

            const csv = await fetchCsv(csvUrl);
            const products = groupProducts(Papa.parse(csv, { skipEmptyLines: true }).data || []);
            if (!products.length) throw new Error('[prerender] ชีต Products ไม่มีสินค้า — หยุด build เพื่อไม่ให้เว็บจริงว่าง');

            const lineId = env.VITE_LINE_OA_ID;
            const lineUrl = lineId ? `https://line.me/R/ti/p/${encodeURIComponent(lineId)}` : 'https://line.me';
            const strains = products.filter(p => p.slug && !p.isDrink);
            const allImages = products.flatMap(p => p.images || []);
            const built = await buildProductImages(allImages, dist);

            for (const p of strains) {
                let html = replaceBetween(shell, 'ssr:head-start', 'ssr:head-end', strainHead(p, built));
                html = replaceBetween(html, 'ssr:body-start', 'ssr:body-end', strainBody(p, products, lineUrl, built));
                const dir = resolve(dist, 'strain', p.slug);
                await mkdir(dir, { recursive: true });
                await writeFile(resolve(dir, 'index.html'), html);
            }

            const indexPath = resolve(dist, 'index.html');
            const indexHtml = await readFile(indexPath, 'utf8');
            const gridTag = '<div id="productList" class="product-grid"></div>';
            if (!indexHtml.includes(gridTag)) throw new Error('[prerender] ไม่พบ #productList ใน index.html');
            const cards = sortForStorefront(products).map((p, i) => staticCard(p, i, built)).join('\n            ');
            const headEnd = '</head>';
            if (!indexHtml.includes(headEnd)) throw new Error('[prerender] ไม่พบ </head> ใน index.html');
            await writeFile(indexPath, indexHtml
                .replace(headEnd, () => `${imageKeysScript(allImages, built)}\n${headEnd}`)
                .replace(gridTag, () => `<div id="productList" class="product-grid" data-ssr="1">\n            ${cards}\n            </div>`));

            await writeFile(resolve(dist, 'sitemap.xml'), buildSitemap(basePages, strains, today));
            console.log(`[prerender] ${strains.length} หน้าสายพันธุ์ + การ์ด ${products.length} ใบในหน้าแรก + sitemap.xml`);
        },
    };
}

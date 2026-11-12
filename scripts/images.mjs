// ย่อรูปสินค้าตอน build: รูปในชีตส่วนใหญ่เป็นไฟล์ต้นฉบับ (บางรูป 4032×3024, 200–460KB) แต่การ์ดแสดงจริงแค่ ~165px
// ดึงรูปทุกใบมาย่อเป็น WebP 2 ขนาด เก็บที่ dist/img/<key>-<ขนาด>.webp แล้วให้หน้าเว็บใช้ไฟล์นี้แทน
// รูปที่ย่อไม่สำเร็จ (โหลดไม่ได้/ไฟล์เสีย) หรือสินค้าที่เพิ่มหลัง build จะใช้ URL เดิมตามปกติ — build ไม่ล้มเพราะรูป
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { IMAGE_SIZES, imageKey } from '../src/catalog.js';

const QUALITY = { [IMAGE_SIZES.card]: 68, [IMAGE_SIZES.full]: 74 };
const CONCURRENCY = 6;

async function loadSource(src, dist) {
    if (/^https?:\/\//i.test(src)) {
        let lastError;
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                const res = await fetch(src, { signal: AbortSignal.timeout(30000) });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return Buffer.from(await res.arrayBuffer());
            } catch (err) {
                lastError = err;
            }
        }
        throw lastError;
    }
    // รูปในโฟลเดอร์ image/ (publicDir) ถูก copy มาอยู่ที่ root ของ dist แล้ว
    return readFile(resolve(dist, decodeURIComponent(src.replace(/^\/+/, ''))));
}

/**
 * @param {string[]} sources รูปทั้งหมดจากชีต (URL เต็ม หรือ path ขึ้นต้นด้วย /)
 * @param {string} dist โฟลเดอร์ dist
 * @returns {Promise<Set<string>>} key ของรูปที่ย่อสำเร็จ (ใช้กับ optimizedImage() ใน src/catalog.js)
 */
export async function buildProductImages(sources, dist) {
    const built = new Set();
    let sharp;
    try {
        sharp = (await import('sharp')).default;
    } catch (err) {
        console.warn(`[images] โหลด sharp ไม่ได้ (${err.message}) — ข้ามการย่อรูป หน้าเว็บใช้รูปต้นฉบับ`);
        return built;
    }

    const outDir = resolve(dist, 'img');
    await mkdir(outDir, { recursive: true });
    const queue = [...new Set(sources.filter(Boolean).filter(src => !src.startsWith('data:')))];
    const failed = [];
    let bytesIn = 0;
    let bytesOut = 0;

    async function worker() {
        for (;;) {
            const src = queue.shift();
            if (!src) return;
            try {
                const input = await loadSource(src, dist);
                const key = imageKey(src);
                let cardBytes = 0;
                for (const size of Object.values(IMAGE_SIZES)) {
                    // fit: outside = ด้านสั้นเท่ากับ size พอดี รูปจึงคลุมกรอบสี่เหลี่ยมจัตุรัสของการ์ดได้ทุกสัดส่วน · rotate() หมุนตาม EXIF ของรูปจากมือถือ
                    const output = await sharp(input)
                        .rotate()
                        .resize({ width: size, height: size, fit: 'outside', withoutEnlargement: true })
                        .webp({ quality: QUALITY[size] })
                        .toBuffer();
                    await writeFile(resolve(outDir, `${key}-${size}.webp`), output);
                    if (size === IMAGE_SIZES.card) cardBytes = output.length;
                }
                built.add(key);
                bytesIn += input.length;
                bytesOut += cardBytes;
            } catch (err) {
                failed.push(`${src} (${err.message})`);
            }
        }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    const kb = n => Math.round(n / 1024);
    console.log(`[images] ย่อรูปสินค้า ${built.size} ใบ: ต้นฉบับรวม ${kb(bytesIn)}KB → ขนาดการ์ดรวม ${kb(bytesOut)}KB`);
    if (failed.length) console.warn(`[images] ย่อไม่สำเร็จ ${failed.length} ใบ (ใช้รูปต้นฉบับแทน):\n  ${failed.join('\n  ')}`);
    return built;
}

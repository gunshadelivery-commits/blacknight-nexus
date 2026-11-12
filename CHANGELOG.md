# CHANGELOG — Cannabis Flower อ่อนนุช

รูปแบบ: [Keep a Changelog](https://keepachangelog.com/) · เวอร์ชัน: [SemVer](https://semver.org/)
**ทุกบรรทัดต้องมีป้ายผู้ทำ** `[Claude]` `[Codex]` `[Human:Ped]` (ดูกฏใน `AGENTS.md`)

<!-- ===== แม่แบบสำหรับเวอร์ชันใหม่ (คัดลอกไปใช้) =====
## [x.y.z] - YYYY-MM-DD
### Added        (ของใหม่)     ### Changed  (แก้ของเดิม)
### Fixed        (แก้บั๊ก)      ### Removed  (ลบออก)
- [ผู้ทำ] type: อธิบายสั้นๆ (ไฟล์ที่แตะ)
==================================================== -->

## [Unreleased]
<!-- รอบ site-upgrade 12 พ.ย. 2026 -->
### Fixed
- [Claude] fix(checkout): ออเดอร์จากหน้าแรกไม่ถูกบันทึกลงชีต Orders และไม่มีอีเมลแจ้งร้าน/ลูกค้า ตั้งแต่ 1 พ.ย. 2026 — ตอน merge `db94147` บรรทัด import `getLanguage` หายไป แต่โค้ดส่งออเดอร์ยังเรียกใช้ จึงเกิด ReferenceError ก่อนยิงไป Apps Script และถูก `catch` กลืนเงียบ (ลูกค้ายังถูกพาไป LINE ตามปกติ ร้านจึงได้ออเดอร์ทาง LINE แต่หลังบ้านว่าง) · ใส่ import กลับ (บั๊กจาก merge ของ [Human:Ped]/[Claude]) (src/main.js)
- [Claude] fix(security): หน้าร้านและหน้าอุปกรณ์ใส่ข้อความจากชีต (ชื่อสินค้า คำอธิบาย แท็ก ขนาด บัญชีรับโอน) ลง `innerHTML`/`onclick` โดยไม่ escape — ชื่อที่มี `'` `"` `<` ทำปุ่มพังหรือฝังโค้ดได้ · ผ่าน `esc()`/`jsArg()` ทุกจุด และ toast ใส่ข้อความเป็น text (src/main.js, src/accessories.js, src/catalog.js, index.html)
- [Claude] fix(strain): ปุ่มกลับแสดงลูกศรซ้อน "‹ ← Back to Shop" · สินค้าหมดยังกด "เพิ่มลงตะกร้า" ได้ (ตอนนี้ปุ่มปิด มีป้าย "สินค้าหมดชั่วคราว" และชวนถามร้านทาง LINE) · ข้อความ "เปิดทุกวัน 10:00–23:00" ขัดกับ "เริ่มรับออเดอร์ 09:00" ที่หน้าแรก → ใช้ "เริ่มรับออเดอร์ 09:00" ให้ตรงกัน · ตัวหนังสือรอง contrast ต่ำกว่าเกณฑ์ (4.1:1 → ~7:1) และลิงก์ breadcrumb มีขีดเส้นใต้ (src/strainView.js, src/strain.js, strain.html)
- [Claude] fix(catalog): ดอก/ใบทริมที่ชีตใส่หมวดเป็น `flower`/`trim` (14 รายการ รวมดอกใหม่ทั้งหมด) ไม่ขึ้นในแท็บ Sativa/Hybrid/Indica และปุ่ม "วันนี้อยากได้ฟีลแบบไหน" — หาสายจากชื่อ+แท็กให้ (`family`) · การ์ดเลือกขนาดแรกที่ยังมีของเป็นค่าเริ่มต้น (เดิมเลือกขนาดแรกเสมอ ถ้าขนาดแรกหมดทั้งการ์ดขึ้น OUT OF STOCK) (src/catalog.js, src/main.js, scripts/prerender.mjs)
- [Claude] fix(seo): JSON-LD ของหน้าแรก — `logo` ชี้ `/image/icon-512.png` ซึ่งเป็น 404 บนเว็บจริง → `/icon-512.png` · เอา `openingHoursSpecification` 10:00–23:00 ออก เพราะขัดกับ "เริ่มรับออเดอร์ 09:00" บนหน้าเว็บ และ Google Business Profile ของร้าน (13 พ.ย. 2026) แสดงเปิด 09:00 ปิด 02:00 — รอเจ้าของยืนยันเวลาจริงทุกวันก่อนใส่กลับ · เอา hreflang 5 บรรทัดที่ทุกภาษาชี้ URL เดียวกันออก (เว็บสลับภาษาในหน้าเดียว ไม่มี URL แยกภาษา) · หน้าสายพันธุ์: Product ชี้ seller ไปที่ Organization ของร้านด้วย `@id` (index.html, src/strainView.js)
- [Claude] fix(a11y): ปุ่มปิดหน้าต่าง/ตะกร้าและปุ่มลอย LINE ไม่มีชื่อให้โปรแกรมอ่านจอ (Lighthouse: button-name, link-name) · ตัวหนังสือรองในส่วนข้อมูลร้านจางเกินเกณฑ์ · ช่องค้นหาใช้ `oninput` (เดิม `onkeyup` ไม่ทำงานเมื่อวางข้อความ/คีย์บอร์ดมือถือบางรุ่น) · หน้าอุปกรณ์เลิกห้ามซูม (`user-scalable=no`) · toast สำเร็จเป็นสีเขียวมรกตตามธีม (เดิมม่วง) (index.html, accessories.html)
- [Claude] fix(i18n): หน้าอุปกรณ์เปิดเป็นอังกฤษ/จีน/เกาหลีแล้วไทยปนอังกฤษ (หัวข้อตะกร้า หน้าสั่งซื้อ ปุ่มยืนยัน ข้อความแจ้งเตือน ไม่มี key แปล) → ใช้ key ชุดเดียวกับหน้าแรก และวาดใหม่เมื่อสลับภาษา · หน้าแรก: ข้อความที่ยังไม่แปลในหน้าสั่งซื้อ/หน้าสำเร็จ/ป้ายคัดเกรด (ป้ายชื่อช่องที่ขึ้นบรรทัดใหม่ใน HTML จับคู่คำแปลไม่ได้) ใส่ `data-i18n` ครบ — สแกนโหมดอังกฤษแล้วไม่เหลือข้อความไทยนอกจากชื่อร้านและข้อมูลสินค้าจากชีต (accessories.html, src/accessories.js, index.html, src/i18n.js)
- [Claude] fix(cart): ตะกร้าที่จำไว้จากครั้งก่อนปรับราคาตามชีตล่าสุด และตัดรายการที่ไม่มีขาย/หมดแล้วออกเมื่อข้อมูลสินค้าโหลดเสร็จ (src/main.js)
- [Claude] fix(strain): สินค้าแนะนำท้ายหน้าสายพันธุ์กลับไปโหลดรูปต้นฉบับ (รูปเดียว 1.4MB) หลัง strain.js วาดหน้าใหม่จาก CSV เพราะหน้าไม่รู้ว่ารูปของสินค้าแนะนำถูกย่อไว้แล้ว → ฝัง key ของรูปสินค้าแนะนำไว้ในหน้าด้วย (บั๊กจาก [Claude] ในรอบนี้ เจอจาก Lighthouse ก่อน commit) (scripts/prerender.mjs)

### Changed
- [Claude] refactor(catalog): หน้าแรกใช้ตัวจัดกลุ่มสินค้า + ตัวจัดประเภทชุดเดียวกับหน้าสายพันธุ์และ prerender (`groupProducts`/`classifyType` ใน src/catalog.js) แทนชุดของตัวเองใน main.js — เทียบกับข้อมูลจริงในชีต 135 แถว ได้สินค้า 64 รายการตรงกันทุกช่อง · แยกข้อความ/SEO/HTML ของหน้าสายพันธุ์ไปไว้ที่ src/strainView.js หน้าแรกจึงโหลด chunk catalog เหลือ 4.8KB (เดิม 15.8KB) (src/catalog.js, src/strainView.js, src/main.js, src/strain.js, scripts/prerender.mjs, AGENTS.md)
- [Claude] perf(images): ย่อรูปสินค้าตอน build — รูปในชีตเป็นไฟล์ต้นฉบับ (ใหญ่สุด 4032×3024, รวม 64 ใบ 48MB) แต่การ์ดแสดงจริง ~165px · build ดึงรูปทุกใบมาย่อเป็น WebP 2 ขนาด (480 สำหรับการ์ด/ตะกร้า, 960 สำหรับหน้าสายพันธุ์/หน้าต่างรายละเอียด) เก็บที่ `dist/img/` แล้วหน้าเว็บใช้ไฟล์นี้แทน: รูปการ์ดทั้งหน้ารวม 2.2MB (เฉลี่ย 35KB/ใบ) และเสิร์ฟจากโดเมนร้านเอง ไม่พึ่ง i.ibb.co/เว็บอื่นตอนลูกค้าเปิด · รูปที่ย่อไม่สำเร็จหรือสินค้าที่เพิ่มหลัง build ใช้ URL เดิม (build ไม่ล้มเพราะรูป) · `<img>` มี `width`/`height`/`decoding=async` ครบ · หน้าสายพันธุ์ preload รูปหลัก (scripts/images.mjs, scripts/prerender.mjs, src/catalog.js, src/strainView.js, src/main.js, src/strain.js, package.json, package-lock.json, AGENTS.md)
- [Claude] fix(analytics): โหลด GA4 เฉพาะเมื่อเปิดจาก blacknight69.com — เดิมเปิดจาก localhost/preview ตอนพัฒนาก็ส่ง page_view และ event ซื้อขายเข้า property จริง ทำให้ตัวเลขปน (Measurement ID `G-70NV9ZCP1L` คงเดิม) (index.html, strain.html, accessories.html, login.html, register.html)
- [Claude] feat(cart): ปุ่ม LINE ในตะกร้าใช้ LINE ID จาก `VITE_LINE_OA_ID` (เดิมฝัง ID ตายตัวใน HTML) และเมื่อมีของในตะกร้าจะเปิดแชตร้านพร้อมรายการ+ยอดรวมให้เลย ลูกค้าที่ไม่อยากกรอกฟอร์มสั่งทางแชตได้ทันที (index.html, src/main.js)
- [Claude] perf: หน้า login/register เลิกใช้ `cdn.tailwindcss.com` (สคริปต์ 124KB ที่บล็อกการแสดงผล + compile CSS ในเบราว์เซอร์ลูกค้า) ใช้ Tailwind ที่ compile ตอน build แทน (CSS 11.6KB สแกนเฉพาะสองหน้านี้ผ่าน `tailwind.auth.config.js`) — เทียบ computed style ทุก element ทุก property (533 ค่า/element) กับเว็บจริงทั้งจอ 375px และ 1280px แล้วตรงกัน ต่างแค่รูปแบบการเขียนค่าเดียวกัน (`0.5`/`.5`) (login.html, register.html, src/auth.css, tailwind.auth.config.js)
- [Claude] perf: Google Fonts ในหน้าสายพันธุ์/อุปกรณ์/login/register โหลดแบบไม่บล็อกการแสดงผลเหมือนหน้าแรก (Lighthouse เดิมประเมินว่าหน้าสายพันธุ์เสียเวลาตรงนี้ ~1.9 วิ) · confetti (15KB) โหลดเฉพาะตอนสั่งซื้อสำเร็จ ไม่โหลดทุกครั้งที่เปิดหน้าแรก (strain.html, accessories.html, login.html, register.html, index.html, src/main.js, src/accessories.js)
- [Claude] feat(checkout): เอาการโอนเงินล่วงหน้า/แนบสลิปออก เหลือจ่ายเงินตอนรับสินค้าอย่างเดียว ตามที่ [Human:Ped] สั่ง (13 พ.ย. 2026: "ไม่มีคนอยากโอนก่อนได้ของ และเสี่ยง") — หน้าสั่งซื้อไม่แสดงเลขบัญชี/QR และไม่อัปโหลดรูปไป ImgBB อีก · แสดงค่าสินค้า + ค่าบริการจัดส่ง (เริ่มต้น 50 บาท) + ยอดจ่ายตอนรับของ และบอกว่าค่าบริการจริง 50–80 บาทตามระยะทาง ไม่เกิน 100 ร้านยืนยันยอดสุดท้ายทาง LINE · อีเมลไม่บังคับ (ใส่แล้วได้อีเมลยืนยันจาก Apps Script เหมือนเดิม) · ออเดอร์ยังบันทึกลงชีตเป็น "เก็บเงินปลายทาง" หลังบ้านใช้ได้ตามเดิมไม่ต้อง deploy Apps Script ใหม่ · ข้อความแจ้งช่องที่ยังไม่กรอก + พาไปที่ช่องนั้น + ตรวจเบอร์โทร · ป้ายช่องกรอกผูกกับช่อง (`for`) และ autocomplete (index.html, accessories.html, src/main.js, src/accessories.js, src/i18n.js, llms.txt, README.md)
- [Claude] fix(copy): เอาคำว่า "ส่งฟรี" / "Free delivery" / "No hidden fees" ออกจากหน้าร้านทุกจุด เพราะ [Human:Ped] ยืนยันว่าทุกออเดอร์มีค่าบริการจัดส่ง 50–80 บาท (ไม่เกิน 100) — ป้ายในส่วนหัวเปลี่ยนเป็น "จ่ายเงินตอนรับของ" · การ์ด "Best Price Guarantee" เป็น "Pay on Delivery" · llms.txt อัปเดตวิธีสั่ง/ชำระเงินและใส่ LINE OA `@165jrxwa` แทน "(โปรดตั้งค่า LINE ID ของร้าน)" · ป้ายสินค้าคัดเกรดในหน้าต่างรายละเอียดเลิกเขียน "วัสดุเกรดการแพทย์" (ข้อความค้างจากร้านเดิม) (index.html, src/i18n.js, src/config.js, src/strainView.js, llms.txt)
- [Claude] docs(perf): ผลวัด Lighthouse มือถือของรอบนี้ — เทียบ build ของ `14f0985` (ก่อน) กับ branch นี้ (หลัง) ผ่าน static server แบบ gzip บนเครื่องเดียวกัน วัดช่วงเครื่องว่าง: หน้าแรก Performance 80 → 86, LCP 4.6 → 3.6 วิ, น้ำหนักหน้า 2,772 → 453 KB, Accessibility 90 → 96 · หน้าสายพันธุ์ Performance 84–91 → 93–98, FCP 2.6 → 1.2–2.3 วิ, LCP 3.0–3.9 → 2.4–2.7 วิ, Accessibility 90 → 96 · หน้า login Performance 83 → 100, LCP 4.2 → 1.4 วิ, 328 → 31 KB · หน้าอุปกรณ์ Accessibility 81 → 94 (ความเร็วไม่เปลี่ยน: หน้านี้รอ Apps Script `getProducts` 3–5 วิ) · ตัวเลขบนเว็บจริงก่อนแก้ (12 พ.ย.): หน้าแรก 66 / FCP 4.0 / LCP 5.3 — ต้องวัดซ้ำบนเว็บจริงหลัง deploy (CHANGELOG.md)

### Added
- [Claude] feat(analytics): event ของ GA4 ครบตลอดเส้นทางซื้อ — หน้าสายพันธุ์ส่ง `view_item` (เดิมไม่มี จึงไม่รู้ว่าสายพันธุ์ไหนถูกดู) · กดการ์ดไปหน้าสายพันธุ์ = `select_item` · เลือกหมวด = `select_content` · ค้นหา = `search` (หน่วง 1.5 วิ) · เปลี่ยนวิธีจ่าย = `add_payment_info` · ปุ่ม LINE ในตะกร้าและหน้าสั่งซื้อสำเร็จส่ง `contact_line` (เดิมไม่นับ) · `begin_checkout`/`purchase` มีหมวดสินค้า · หน้าอุปกรณ์ส่ง `add_to_cart`/`begin_checkout`/`purchase`/`contact_line` (เดิมไม่ส่งอะไรเลย) · ไม่มีชื่อ เบอร์ อีเมล ที่อยู่ลูกค้าใน event ใด (src/analytics.js, src/main.js, src/strain.js, src/accessories.js, scripts/prerender.mjs, index.html)
- [Claude] feat(strain): หน้าสายพันธุ์ — ปุ่ม LINE แนบชื่อสินค้า+ขนาด+ราคาที่เลือกไปในแชตให้เลย (เดิมเปิดแชตเปล่า) · แถบปุ่มสั่งซื้อติดขอบล่างบนมือถือเมื่อเลื่อนพ้นปุ่มหลัก · ป้ายแท็กจากชีต (THC %, สัดส่วนสายพันธุ์) · สินค้าแนะนำ 6 ตัวพร้อมรูป เลือกตัวที่ยังมีของก่อน · ปุ่มสลับ 4 ภาษาใน nav · เนื้อหาไทยเป็นหัวข้อของตัวเอง ("สั่ง <ชื่อ> — กัญชาส่งด่วน อ่อนนุช · สุขุมวิท" + ราคา/ขนาด/พื้นที่ส่ง/วิธีสั่ง จากข้อมูลในชีตและเงื่อนไขที่หน้าแรกประกาศไว้) (src/strainView.js, src/strain.js, strain.html, scripts/prerender.mjs)
- [Claude] feat(agegate): หน้าสายพันธุ์มีหน้ายืนยันอายุ 20+ เหมือนหน้าแรก (เดิมลูกค้าจาก Google เข้าหน้านี้ได้โดยไม่ผ่านการยืนยัน) · จำการยืนยันไว้ 30 วันบนเครื่องเดิม (เดิมถามใหม่ทุกครั้งที่เปิดแท็บ) · เป็น dialog ที่ใช้คีย์บอร์ดได้ + ตัวหนังสือรองเข้มขึ้น (src/agegate.js, src/strain.js)
- [Claude] feat(cart): ตะกร้าจำของไว้ 3 วันบนเครื่องเดิม (เดิมหายทุกครั้งที่รีเฟรชหรือปิดแท็บ) และล้างเองหลังสั่งซื้อสำเร็จ · ปุ่มลอย LINE ซ่อนตอนตะกร้า/หน้าสั่งซื้อเปิด (เดิมทับปุ่มยืนยันสั่งซื้อบนมือถือ) · กด Esc ปิดหน้าต่างได้ · หน้าต่างสั่งซื้อ/สำเร็จเป็น dialog (src/main.js, src/style.css, index.html)
- [Claude] feat(seo): หน้าแรกมีส่วน "สั่งกัญชาส่งด่วน อ่อนนุช ใน 3 ขั้นตอน" + พื้นที่จัดส่ง (อ่อนนุช พระโขนง อุดมสุข สวนหลวง สุขุมวิท บางนา) เป็นเนื้อหาไทยตรงคำค้นอันดับ 1 ใน Search Console แปลครบ 4 ภาษา · footer พร้อมลิงก์ภายใน (หน้าอุปกรณ์เดิมอยู่ใน sitemap แต่ไม่มีลิงก์จากหน้าไหนเลย) ช่องทาง LINE/โทร และข้อความ 20+ (index.html, src/i18n.js, src/style.css)

### Added
- [Claude] feat(seo): สร้างหน้าสายพันธุ์แบบ static ตอน build ที่ `/strain/<slug>/` (62 หน้า) — แต่ละหน้ามี title/description/canonical/JSON-LD/เนื้อหาครบใน HTML ตั้งแต่แรก Google เก็บ index ได้โดยไม่ต้องรัน JS (เดิม GSC index ไว้แค่ 1 หน้า เพราะทุกหน้าเป็น `strain.html?s=` ที่ว่างจนกว่า JS จะดึงชีต) · ลิงก์เดิม `strain.html?s=` ยังใช้ได้และชี้ canonical มาที่ URL ใหม่ · สินค้าที่เพิ่มหลัง deploy ล่าสุดใช้ `404.html` แสดงแบบ dynamic ไปก่อน (scripts/prerender.mjs, src/catalog.js, src/strain.js, strain.html, vite.config.js)
- [Claude] feat(seo): sitemap.xml สร้างอัตโนมัติจากสินค้าจริงในชีตทุกครั้งที่ build — ของเดิมเขียนมือ: 15 จาก 38 ลิงก์ชี้ไปสายพันธุ์ที่ไม่มีแล้ว และสินค้าจริง 40 ตัว (รวมดอกใหม่ทั้งหมด) ไม่อยู่ใน sitemap · ลบ sitemap.xml ที่ root และเลิก copy ใน workflow (scripts/prerender.mjs, .github/workflows/deploy.yml)
- [Claude] feat(seo): หน้าแรกมีการ์ดสินค้า + ลิงก์ `<a href>` ไปหน้าสายพันธุ์อยู่ใน HTML ตั้งแต่แรก (prerender ตอน build แล้ว main.js สลับเป็นการ์ดจริงเมื่อข้อมูลล่าสุดมา) — เดิมการ์ดใช้ onclick อย่างเดียว Google ไต่ไปหน้าสายพันธุ์ไม่ได้ (scripts/prerender.mjs, src/main.js, src/style.css)
- [Claude] feat(analytics): ปุ่ม "สั่งซื้อ LINE" ในหน้าสายพันธุ์ส่ง event `contact_line` เข้า GA4 (src/catalog.js, src/strain.js)
- [Claude] ci: build + deploy อัตโนมัติทุกวัน 03:00 น. เวลาไทย (cron `0 20 * * *` UTC) — สินค้าใหม่ในชีตได้หน้า static + เข้า sitemap เองภายใน 1 วันโดยไม่ต้อง push · GitHub จะปิด schedule ถ้า repo ไม่มี commit เกิน 60 วัน (เปิดคืนที่แท็บ Actions) (.github/workflows/deploy.yml)

### Changed
- [Claude] perf: เลิกใช้ `cdn.tailwindcss.com` ใน index.html และ accessories.html (สคริปต์ที่บล็อกการแสดงผล + compile CSS ในเบราว์เซอร์ลูกค้า) ใช้ Tailwind ที่ compile ตอน build แทน · ย้าย `@tailwind utilities` ไปท้าย style.css ให้ลำดับ cascade เหมือนตอนใช้ CDN — เทียบ computed style ทุก element ก่อน/หลังแล้วตรงกันทั้งจอคอมและมือถือ (admin/login/register ยังใช้ CDN ตามเดิม) (index.html, accessories.html, src/style.css, tailwind.config.js)
- [Claude] perf: หน้าแรกเริ่มดึง CSV สินค้าตั้งแต่ `<head>` (เดิมรอ JS โหลดเสร็จ ~1.9 วิ จึงเริ่มดึง) + cache ใน sessionStorage 5 นาทีร่วมกับหน้าสายพันธุ์ กลับจากหน้าสายพันธุ์เห็นสินค้าทันที · รูปสินค้าเริ่มโหลดที่ ~0.1 วิ (เดิม ~4.1 วิ) (index.html, strain.html, src/main.js, src/strain.js)
- [Claude] perf: Google Fonts โหลดแบบไม่บล็อกการแสดงผล + preconnect · ภาพพื้นหลังเปลี่ยนเป็น WebP 58KB (เดิม JPG 206KB) (index.html, image/bg-cannabis.webp)
- [Claude] refactor: รวม slug/จัดประเภท/SEO/HTML ของหน้าสายพันธุ์ไว้ที่ src/catalog.js ใช้ร่วมกันทั้งเบราว์เซอร์และตอน build · slug รองรับชื่อไทย และชื่อซ้ำได้ `-2` ต่อท้าย (src/catalog.js, src/main.js, src/strain.js)
- [Claude] docs: เพิ่มไฟล์ใหม่ในแผนผังไฟล์ของ AGENTS.md + หมายเหตุว่า sitemap สร้างอัตโนมัติ (AGENTS.md)

### Fixed
- [Claude] fix(catalog): การ์ดสินค้าชื่อไทยกดแล้วขึ้น "Strain not found" (เช่น ใบทริม icc, ใบทริม VICIOUS, บ้องแก้ว…) เพราะหน้าแรกกับหน้าสายพันธุ์สร้าง slug คนละแบบ และสินค้าชื่อไทยล้วน (เครื่องบด, บ้องแก้ว) ไม่มีหน้าของตัวเอง — ใช้ slug ชุดเดียวกันแล้ว (src/catalog.js, src/main.js, src/strain.js)
- [Claude] fix(strain): รูปสินค้าที่ในชีตใส่เป็นชื่อไฟล์เฉยๆ (เช่น sluricane.jpg) ใช้ path เต็ม · หน้าสายพันธุ์ของอุปกรณ์ไม่เรียกตัวเองว่า "Hybrid cannabis strain" แล้ว · สายพันธุ์ที่ไม่มีแล้วใส่ `noindex` (src/catalog.js, src/strain.js)
- [Claude] fix(ui): ข้อความ "กำลังอัปเดตข้อมูล..." ค้างโชว์บนสุดของหน้าแรกตลอดเวลา (แถบ pull-to-refresh ไม่มี CSS ซ่อน) — ซ่อนไว้ แสดงเฉพาะตอนดึงข้อมูลใหม่ (src/style.css)

### Added
- [Claude] feat(seo): เพิ่ม strain pages ทั้งหมด 37 URLs ใน sitemap.xml เพื่อให้ Google index — ใช้ slug pattern `?s=<slug>` ตรงกับที่ strain.js ใช้ (sitemap.xml)
- [Claude] feat(seo): เพิ่ม keyword "กัญชาส่งด่วน" ใน title/description ของ index.html + strain.html + strain.js — ตาม top query ใน GSC (22 clicks, keyword อันดับ 1)
- [Claude] fix(seo): แก้ duplicate URL /index.html ใน GSC — เปลี่ยน breadcrumb + links ใน strain.js จาก `index.html` → `/` เพื่อรวม PageRank ไปที่ canonical `/`

### Fixed
- [Claude] fix(analytics): แก้ GA4 Measurement ID ทุกหน้าให้ใช้ G-70NV9ZCP1L (ยืนยันจาก GA4 Admin → Data Streams → blacknight69.com stream) — index.html ใช้ G-GXVPQ9RHSP ผิด + revert commit ที่เปลี่ยน strain/accessories/register/login ผิดทิศ ทุกหน้าส่ง event ไปที่ property เดียวกันแล้ว (index.html, strain.html, accessories.html, register.html, login.html)
- [Claude] fix(analytics): แก้ GA4 Measurement ID ใน index.html จาก G-70NV9ZCP1L → G-GXVPQ9RHSP ให้ตรงกับ stream จริง + แก้ stream URL ใน GA4 จาก gunshadelivery.github.io → blacknight69.com
- [Claude] fix(data): แก้บั๊ก strain แสดงราคา/สต็อกผิดเมื่อชื่อสินค้าใน Sheet มี case ต่างกัน (เช่น "Alien Mint" vs "ALIEN MINT") — group ด้วย lowercase key และ dedup variants by size ทำให้ข้อมูล row ใหม่ทับ row เก่าเสมอ (src/main.js, src/strain.js)
- [Claude] fix(seo): ลบ `servesCuisine: null` ออกจาก LocalBusiness JSON-LD — field นี้ไม่เกี่ยวกับร้านกัญชา Google อาจ flag เป็น invalid structured data (index.html)
- [Claude] fix(seo): เพิ่ม hreflang `zh` และ `ko` ใน index.html และ strain.html — ครอบคลุมผู้ใช้จีนและเกาหลีสำหรับ Google Search (index.html, strain.html)
- [Claude] fix(seo): แก้ trailing `-` ใน canonical URL และ JSON-LD ของ strain page — `toSlug()` เพิ่ม dedup + trim dashes ทำให้ชื่อที่มีตัวอักษรพิเศษท้ายชื่อ (เช่น `super-boof-cherry`) ไม่มี `-` ตามหลัง (src/strain.js)

### Added
- [Claude] feat(catalog): เพิ่ม sort สินค้าที่มี tag `new` ขึ้นก่อนในหน้า Strains — 15 สายพันธุ์ใหม่ (45 rows, F92–F136 ใน Sheet) จะแสดงก่อนสินค้าเดิมเสมอ (src/main.js)
- [Claude] feat(seo): เพิ่ม `<link rel="icon">` tags ใน index.html และ strain.html ให้ชี้ไป favicon.ico, icon-192.png, icon-512.png, apple-touch-icon.png ที่มีอยู่แล้วใน image/ folder — แก้ปัญหา Google Search แสดงรูปโลก 🌐 แทนโลโก้ร้าน (index.html, strain.html)
- [Claude] feat(ux): ปรับการ์ดสินค้าให้กดที่ไหนก็ได้เพื่อเด้งไปหน้า strain detail แทนการใช้ปุ่มลูกศร → ลบ detail-link button ออก (src/main.js)
- [Claude] fix(cart): แก้บั๊กตะกร้าว่างเปล่าเมื่อ Add to Cart จากหน้า strain — เพิ่ม sessionStorage handshake ระหว่าง strain.js (เขียน sc_add_intent) และ main.js (อ่านหลัง products โหลด) (src/strain.js, src/main.js)
- [Claude] feat(i18n): เพิ่มระบบ i18n ใน strain page รองรับ TH/EN/ZH/KO อ่านภาษาจาก localStorage key `cf_language` แปลทุก label บนหน้า (back button, breadcrumb, attribute cards, CTA, banner ล่าง) (src/strain.js, strain.html)
- [Codex] feat(analytics): เพิ่ม GA4 ecommerce/contact events สำหรับดูสินค้า เพิ่มตะกร้า เริ่มชำระเงิน สั่งซื้อ LINE โทร และ Google Business Profile โดยไม่ส่งข้อมูลส่วนบุคคลของลูกค้า (src/analytics.js, src/main.js, index.html)
- [Codex] feat(products): เพิ่มภาพประกอบต้นฉบับตามชื่อให้ Card ที่ไม่มีภาพ 17 รายการ บีบอัดเป็น JPEG 900x900 พร้อมป้าย “ภาพประกอบ” เพื่อแยกจากภาพสินค้าล็อตจริง (image/generated-products, Google Sheet Products)
- [Codex] feat(products): ลิสต์สินค้าใหม่จากภาพหน้าร้าน 17 รายการเป็น Card แยกรายสายพันธุ์และอุปกรณ์ พร้อมปรับราคาขึ้น 15% โดยปัดขึ้นขั้นละ 5 บาท และตั้งสต๊อกเริ่มต้น (Google Sheet Products)
- [Codex] feat(i18n): เพิ่มระบบเลือกภาษาไทย/อังกฤษแบบจำค่าบนอุปกรณ์เดียวกัน ครอบคลุมหน้าร้าน หน้ายืนยันอายุ ตะกร้า ชำระเงิน หน้าเข้าสู่ระบบ/สมัครสมาชิก และหน้า Admin (src/i18n.js, index.html, admin.html, login.html, register.html, src/agegate.js)
- [Codex] feat(i18n): แปลข้อความแบบ dynamic ของรายการสินค้า การสั่งซื้อ ตัวชี้วัด ออเดอร์ สินค้า และ PromptPay พร้อมสวิตช์ภาษาที่รองรับ desktop/mobile (src/main.js, src/adminApp.js, src/style.css)
- [Codex] feat(storefront): เพิ่มตัวเลือก “Find Your Flow”, spotlight ตามเมาส์, คีย์ลัด `/` สำหรับค้นหา และสถานะร้านพร้อมส่ง (index.html, src/main.js, src/style.css)
- [Codex] chore(hosting): เพิ่มข้อมูลโปรเจกต์สำหรับเผยแพร่ตัวอย่างผ่าน Sites (.openai/hosting.json)
- [Codex] chore(hosting): เพิ่ม static worker adapter และขั้นตอนเตรียม build output สำหรับ Sites (sites-worker.js, vite.config.js)
- [Codex] feat(storefront): เพิ่มหมวดเครื่องดื่ม น้ำท่อมมี่ น้ำโยเกิร์ต น้ำผลไม้ ราคาแพ็ก 3 ขวด และเซ็ตโปรโมชั่นที่สั่งลงตะกร้าได้ (index.html, src/main.js, src/style.css)
- [Claude] docs(competitor): เพิ่มรายงานสแกนคู่แข่งประจำสัปดาห์ 17 ส.ค. 2026 — ดึงข้อมูลสำเร็จทั้ง 3 ราย (ก่อนหน้าดึงไม่ได้เลย) พบ dildozz.com มีสินค้าจริงมากกว่า baseline ที่บันทึกไว้มาก และ bangkoksextoys.com เริ่มมีสินค้าชื่อภาษาไทย (competitor_report_2026-08-17.md)
- [Claude] docs(competitor): เพิ่มรายงานสแกนคู่แข่งประจำสัปดาห์ 24 ส.ค. 2026 — dildozz.com เข้าไม่ได้อีกรอบ (JS-render), love2toy.com พบขึ้นราคา 2 SKU (Lemezee lube +40.8%, แท่งซิลิโคนนิ่ม +37.5%) และหมวดใหม่ "สั่งงานผ่านแอป", bangkoksextoys.com ยืนยันเทรนด์สินค้าไทย+ควบคุมผ่านแอปต่อเนื่องจากสัปดาห์ก่อน — ⚠️ ตั้งข้อสังเกตซ้ำว่า repo รีแบรนด์เป็นร้านกัญชาแล้ว งานตรวจคู่แข่ง sex toy นี้อาจไม่ตรงธุรกิจปัจจุบัน ยังไม่มีการยืนยันจากเจ้าของ (competitor_report_2026-08-24.md)
- [Claude] docs(pm): เพิ่ม Weekly Check-in 23 ส.ค. 2026 — ตรวจ classifyItem() พบว่าถูกเขียนใหม่ทั้งหมดแล้ว (แก้แล้ว ✅) ส่วน order unique ID ยังไม่แก้ ❌ (ยัง match ด้วยชื่อ+สลิป ไม่มีคอลัมน์ orderId) และพบว่า roadmap + competitor report เดิมยังอ้างอิงธุรกิจเซ็กส์ทอยขณะที่ codebase รีแบรนด์เป็นร้านกัญชาไปแล้ว ต้องยืนยันทิศทางธุรกิจกับเจ้าของ (weekly_checkin_2026-08-23.md)
- [Claude] docs(pm): เพิ่ม Weekly Check-in 30 ส.ค. 2026 — ตรวจซ้ำ: classifyItem() ยังแก้แล้ว ✅, order unique ID ยังไม่แก้ ❌ (GoogleAppsScript.js action log/updateStatus ยัง match ด้วยชื่อ+สลิป แม้มี Utilities.getUuid() ในไฟล์แต่ใช้กับ login token เท่านั้น) — ย้ำ blocker เรื่อง roadmap/competitor report เดิมยังเป็นธุรกิจเซ็กส์ทอยขณะที่ codebase เป็นร้านกัญชามา 2 เดือนแล้ว ค้างยืนยันจากเจ้าของต่อเนื่อง 3 สัปดาห์ (weekly_checkin_2026-08-30.md)
- [Claude] docs(competitor): เพิ่มรายงานสแกนคู่แข่งประจำสัปดาห์ 31 ส.ค. 2026 — dildozz.com URL เดิมยังเข้าไม่ได้ (พบสาเหตุที่เป็นไปได้: slug ใน task ใช้ plural แต่เว็บจริงใช้ singular) ตรวจหน้าแรกแทนพบขยายเป็น ~151 SKU (จาก baseline 24) และเปลี่ยนไปใช้ anchor-pricing, love2toy.com พบโปรโมชั่นลดราคากว้างในหมวดไวเบรเตอร์ (~65% ติด Sale) และ Lemezee lube ยังค้างราคาสูงจากสัปดาห์ก่อน, bangkoksextoys.com ยืนยันเทรนด์ "AI Sync" เป็นสินค้าใหม่จริง 2 SKU (สร้าง 25 ส.ค.) ไม่ใช่แค่ติดโผแล้ว — ⚠️ ย้ำซ้ำเป็นครั้งที่ 4 ว่า repo รีแบรนด์เป็นร้านกัญชาแล้ว แนะนำปิด/ลบ scheduled task นี้ถ้าไม่ตรงธุรกิจปัจจุบัน (competitor_report_2026-08-31.md)
- [Claude] docs(pm): เพิ่ม Weekly Check-in 6 ก.ย. 2026 — ตรวจซ้ำ: classifyItem() ยังแก้แล้ว ✅, order unique ID ยังไม่แก้ ❌ (GoogleAppsScript.js action log/updateStatus ยัง match ด้วยชื่อ+สลิป ไม่มีคอลัมน์ orderId) — ย้ำ blocker เรื่อง roadmap เดิมยังเป็นธุรกิจเซ็กส์ทอยขณะที่ codebase เป็นร้านกัญชามา 6 สัปดาห์แล้ว ค้างยืนยันจากเจ้าของต่อเนื่อง 3 สัปดาห์ติดต่อกันในเช็คอินนี้ แนะนำปิด/ปรับ scheduled task ถ้าไม่ตอบรับรอบหน้า (weekly_checkin_2026-09-06.md)
- [Claude] docs(competitor): เพิ่มรายงานสแกนคู่แข่งประจำสัปดาห์ 22 ก.ย. 2026 — dildozz.com + love2toy.com เข้าไม่ได้ (JS-render, หน้าเปล่า; ขอสิทธิ์ browser pane แล้วถูกปฏิเสธ), bangkoksextoys.com ดึงได้บางส่วนพบสินค้าใหม่ 2 SKU ลงขาย 7 และ 17 ก.ย. ราคา 1,200–1,450 ฿ — ต่อยอดเทรนด์ AI/แอปควบคุมจาก ส.ค. และมีสัญญาณใหม่คือเริ่มขายแบรนด์นำเข้า (Blush) พร้อมร่องรอย compare_at_price เป็น USD บ่งชี้ต้นทุนดรอปชิป ~700–850 ฿ — ⚠️ ย้ำครั้งที่ 5 ว่า repo เป็นร้านกัญชาแล้ว แนะนำปิด/ปรับ task นี้ และแก้ slug dildozz ในไฟล์ task เป็นเอกพจน์ (competitor_report_2026-09-22.md)
- [Claude] docs(pm): เพิ่ม Weekly Check-in 13 ก.ย. 2026 — ตรวจซ้ำ: classifyItem() ยังแก้แล้ว ✅, order unique ID ยังไม่แก้ ❌ (ยืนยันเหมือนเดิมทุกจุด: appendRow ไม่มีคอลัมน์ orderId, updateStatus ยัง match ด้วยชื่อ+สลิป, getUuid() ใช้กับ login token เท่านั้น) — นี่คือเช็คอินครั้งที่ 4 ติดต่อกันที่ยืนยันธุรกิจ mismatch (roadmap อ้างอิงเซ็กส์ทอย vs. AGENTS.md ยืนยันเป็น Cannabis Flower อ่อนนุช มา 7 สัปดาห์) เงื่อนไข "ไม่ตอบรับ" ที่ตั้งไว้สัปดาห์ก่อนครบแล้ว จึงย้ำคำแนะนำหนักแน่นให้ปิด/ปรับ scheduled task `blacknight69-weekly-checkin` (weekly_checkin_2026-09-13.md)
- [Claude] docs(competitor): เพิ่มรายงานสแกนคู่แข่งประจำสัปดาห์ 14 ก.ย. 2026 — dildozz.com URL หมวดหมู่ที่ระบุยังเข้าไม่ได้ (slug พหูพจน์ผิดเหมือนเดิม) ดึงหน้าแรกแทนแล้วนับได้ 151 SKU รวมทุกหมวด เท่ากับรอบ 31 ส.ค. เป๊ะ (คงที่ ไม่มีสินค้าใหม่) ยังใช้ anchor-pricing ต่อเนื่อง, love2toy.com เปลี่ยนโครงสร้าง URL จาก `/product-category/` เป็น `/collections/` แล้ว ราคา Lemezee lube ยังค้างที่ 69฿ (+40.8% จาก baseline ไม่ปรับลง) ไม่พบการเปลี่ยนแปลงใหม่อื่น, bangkoksextoys.com พบสินค้าใหม่ "ควบคุมผ่านแอป AI" อีก 1 SKU สร้าง 7 ก.ย. 2026 (ราคา 1,200฿) ยืนยันเทรนด์ AI Sync ขยายต่อเนื่องเป็นรอบที่ 2 (payload endpoint ใหญ่เกิน ดึงได้ครบแค่ 2/5 รายการ) — ⚠️ ย้ำซ้ำเป็นครั้งที่ 5 ว่า repo รีแบรนด์เป็นร้านกัญชามา 7 สัปดาห์แล้ว และ Weekly Check-in ล่าสุดตั้งเงื่อนไข "ไม่ตอบรับ" ครบแล้ว คำแนะนำให้ปิด scheduled task ครอบคลุมถึง `blacknight69-competitor-monitor` ตัวนี้ด้วย รอการยืนยันจากเจ้าของ (competitor_report_2026-09-14.md)
- [Claude] docs(pm): เพิ่ม Weekly Check-in 20 ก.ย. 2026 — ตรวจซ้ำ: classifyItem() ยังแก้แล้ว ✅ (main.js:92–112 ใช้คอลัมน์ category จากชีตก่อน fallback), order unique ID ยังไม่แก้ ❌ (GoogleAppsScript.js:176 appendRow ไม่มี orderId, :217–220 updateStatus ยัง match ชื่อ+สลิป, getUuid() ใช้กับ login token เท่านั้น) — เพิ่มข้อสังเกตใหม่: SHEET_CSV_URL ถูกนำมาใช้แล้ว ✅ (critical bug ข้อ 3 ปิดได้), พบไฟล์ซ้ำ src/adminApp_clean.js, age gate ยังเป็น sessionStorage — เช็คอินครั้งที่ 5 ติดต่อกันที่ยืนยัน business mismatch (roadmap เซ็กส์ทอย vs. Cannabis Flower อ่อนนุช มา 8 สัปดาห์) ยังค้างการยืนยันจากเจ้าของ (weekly_checkin_2026-09-20.md)

### Changed
- [Codex] fix(seo): ปรับ Organization/WebSite structured data ให้ใช้ชื่อธุรกิจจริง เชื่อม publisher ด้วย @id และตัด SearchAction ที่หน้าเว็บไม่ได้รองรับ (index.html)
- [Codex] fix(products): ถอดภาพรวมที่ใช้ซ้ำผิดวัตถุประสงค์ออกจากสินค้าใหม่ และเพิ่มภาพกราฟิก Card อัตโนมัติตามชื่อกับหมวดหมู่เมื่อสินค้าไม่มีภาพ (บั๊กจาก [Codex]) (index.html, src/main.js, src/style.css, Google Sheet Products)
- [Codex] fix(deploy): ซิงค์ GitHub Actions Secrets `VITE_SHEET_CSV_URL`, `VITE_GAS_URL` และ `VITE_ORDERS_CSV_URL` ให้ตรงกับ `.env` ของร้าน เพื่อให้หน้าร้านและหลังบ้าน production ใช้ชีตชุดเดียวกัน (GitHub Actions Secrets)
- [Codex] chore(domain): ใช้ blacknight69.com เป็น canonical และ custom domain หลักตามโดเมนที่มี DNS/HTTPS พร้อมใช้งาน โดยคงแบรนด์ Cannabis Flower อ่อนนุช (index.html, login.html, register.html, accessories.html, sitemap.xml, robots.txt, llms.txt, vite.config.js, .github/workflows/deploy.yml)
- [Codex] chore(deploy): เปลี่ยน custom domain ใน GitHub Pages workflow จากแบรนด์เก่าเป็น gunshadelivery.com ให้ตรงกับ Google Business Profile (.github/workflows/deploy.yml)
- [Codex] feat(brand): ปรับชื่อร้าน โดเมน เบอร์โทร เวลาเริ่มรับออเดอร์ พื้นที่บริการ และหน้า login/register/accessories ให้สอดคล้องกับ Google Business Profile ของร้าน (index.html, login.html, register.html, accessories.html, src/i18n.js, sitemap.xml, robots.txt, llms.txt, vite.config.js, src/utils.js)
- [Codex] feat(storefront): เปลี่ยนส่วนรีวิวเดิมเป็นข้อมูลร้านที่ตรวจสอบได้ พร้อมปุ่มโทรและเปิด Google Business Profile รองรับภาษาไทย/อังกฤษ (index.html, src/i18n.js)
- [Codex] fix(ui): แยก style จุดสถานะร้านออกจากข้อความเวลา เพื่อไม่ให้ข้อความใน navbar ยุบเป็นแนวตั้ง (index.html, src/style.css)
- [Codex] feat(ui): redesign หน้าร้านเป็นสไตล์ Emerald Intelligence พร้อม navbar, hero, discovery panel, product cards และ responsive layout ใหม่ โดยคงแบรนด์ Cannabis Flower อ่อนนุช (index.html, src/main.js, src/style.css)
- [Codex] feat(admin): redesign หน้าเข้าสู่ระบบ, navigation, dashboard metrics, ตาราง และ modal เป็นสไตล์ Emerald Operations Center พร้อม responsive layout (admin.html, src/adminApp.js)
- [Codex] fix(store): เพิ่ม fallback จำแนกหมวดจากคำบอกเอฟเฟกต์และรองรับคำว่า “บ้อง” เพื่อให้ตัวกรองใช้งานได้เมื่อชีตยังไม่ระบุ category (src/main.js)
- [Codex] fix(ui): จำกัดความยาว badge สินค้าไม่ให้ข้อความล้นการ์ด (src/style.css)
- [Codex] fix(admin): ลบ markup ซ้ำท้ายไฟล์และเพิ่มหมวดเครื่องดื่มในฟอร์มสินค้า (admin.html)

### Removed
- [Claude] chore(ci): เลิกอ้างถึง secrets `VITE_ORDERS_CSV_URL` และ `VITE_ADMIN_PASSWORD` ที่ลบออกจาก GitHub แล้ว (ไม่มีโค้ดใช้) + ลบ export `ORDERS_CSV_URL` ที่ไม่มีใครเรียก + อัปเดตคู่มือให้ไม่แนะนำเปิด Orders เป็น CSV สาธารณะ (.github/workflows/deploy.yml, src/config.js, SETUP_BACKEND.md)
- [Claude] chore(security): เลิกใช้ `VITE_ADMIN_PASSWORD` ฝั่งหน้าเว็บ รหัสแอดมินจึงไม่ถูก build ฝังลงไฟล์ JS ที่ใครก็เปิดดูได้อีก (src/config.js, src/adminApp.js)
- [Codex] fix(trust): ลบคะแนน 4.9 และข้อความรีวิวจำลองที่ไม่ปรากฏบน Google Business Profile เพื่อไม่ให้ลูกค้าเข้าใจผิด (index.html, src/i18n.js)

---

### Fixed
- [Claude] fix(responsive): ตรวจทุกหน้า 8 ขนาดจอ (320–1440px) · หน้าล็อกอิน/สมัครเลื่อนซ้ายขวาได้ 100–125px เพราะวงกลมตกแต่งยื่นนอกจอ → ห่อด้วยกล่อง fixed overflow-hidden · หัวเว็บหน้าแรกล้นจอ 320px (ปุ่มตะกร้าโดนตัด) → ย่อสำหรับจอ < 375px · หน้า admin บนมือถือ: ตารางเลื่อนแนวนอนแทนบีบคอลัมน์จนตัดคำทีละตัว และหัวแดชบอร์ดไม่ตกบรรทัด · หน้าล็อกอิน/สมัครยังเขียน "Cannabis Flower" (ชื่อแยกคนละแท็ก) → Siam Cannabis (login.html, register.html, admin.html, src/style.css)
- [Claude] fix(accessories): หน้าอุปกรณ์ไม่แสดงสินค้าเลย ขึ้น "โหลดข้อมูลสินค้าล้มเหลว" ทุกครั้ง เพราะไม่ได้ตั้ง selectedVariantIdx → variants[undefined].stock พัง · ตั้งค่าเริ่มต้น 0 และเก็บ status จากชีต (src/accessories.js)
- [Claude] feat(gas): V28-ADMIN — bulkUpdate แก้ราคา/สต๊อกในแถวเดิมทีเดียวจบ (หน้า ราคา/สต๊อก ส่งเฉพาะแถวที่แก้ มี fallback สำหรับ GAS เก่า) · updateProduct คงตำแหน่งแถว + ปฏิเสธเมื่อไม่มี variant · deleteProduct เทียบแบบ trim และบอกเมื่อไม่เจอ · updateStatus แยกออเดอร์ด้วยวันที่และบันทึกเลขพัสดุลงคอลัมน์ใหม่ · กันสูตรในข้อมูลออเดอร์/ผู้ใช้ (cellSafe_) · escape HTML ในอีเมลแจ้งเตือน/ยืนยัน (GoogleAppsScript.js, AGENTS.md)
- [Claude] fix(admin): ลบสินค้าที่ชื่อมีช่องว่างท้ายไม่ได้แต่ขึ้นว่าสำเร็จ · บันทึกสินค้าราคาว่างกลายเป็น 0 บาท · เพิ่มสินค้าชื่อซ้ำทับของเดิมเงียบๆ → ตรวจและเตือนก่อนบันทึก (src/adminApp.js)
- [Claude] fix(admin): วันที่ออเดอร์ขึ้น N/A และยอดขายถูกนับเป็นยอดวันนี้ทั้งหมด เพราะหาหัวคอลัมน์ "วันที่-เวลา" แต่ GAS สร้างหัว "วันที่" · สินค้าขายดีรวมตามชื่อและนับจำนวนชิ้นจริง · แบ่งหน้าออเดอร์ไม่จำกัด 5 หน้า · ล็อกอินไม่ดึงออเดอร์ซ้ำ + กด Enter ล็อกอินได้ (src/adminApp.js)
- [Claude] fix(admin): ปุ่มรับยอด/จัดส่งขึ้น "สำเร็จ" ทุกครั้งแม้ GAS ปฏิเสธ → ตรวจผลจริงและคืนปุ่มเมื่อพลาด · ส่งวันที่ไปช่วยแยกออเดอร์ชื่อ+สลิปซ้ำ (เช่น COD) (src/adminApp.js)
- [Claude] fix(security): หน้า admin แสดงชื่อ/ที่อยู่/สลิปจากออเดอร์ลง innerHTML โดยไม่ escape → ใครสั่งของพร้อมฝัง HTML/สคริปต์ในช่องชื่อก็รันโค้ดในหน้า admin (ที่ถือ ADMIN_KEY) ได้ · เพิ่ม esc()/safeHref() ใช้กับตารางออเดอร์ สินค้า Promptpay ใบปะหน้า และช่องตัวเลือก · ปุ่มในตารางอ้างแถวด้วย index แทนการฝังชื่อใน onclick (src/adminApp.js)
- [Claude] fix(admin): ซิงค์ Promptpay ล้มเมื่อรูป QR เป็น base64 (อัปโหลด ImgBB ไม่สำเร็จ) เพราะ V27 ปฏิเสธค่าที่ยาวเกิน 2,000 ตัวอักษร (บั๊กจาก [Claude]) → GAS V27.1 รับได้ถึง 45,000 ตัวอักษร + หน้า admin ย่อ QR เป็น PNG ไม่เกิน 400px ก่อนส่ง + ข้อความ error แสดงสาเหตุจริง (GoogleAppsScript.js, src/adminApp.js)
- [Claude] fix(accessories): ส่งออเดอร์จากหน้าอุปกรณ์ด้วย `application/json` ติด CORS preflight ทำให้ออเดอร์ไม่ถูกบันทึกลงชีต → เปลี่ยนเป็น `text/plain` เหมือนหน้าร้านหลัก (src/accessories.js)
- [Claude] fix(gas): ปุ่ม "ลบสินค้าทั้งหมด" เรียก `clearProducts` ที่ไม่มีใน GAS → เพิ่มให้ โดยสำรองแท็บ Products เป็น `Products_backup_<เวลา>` ก่อนล้างทุกครั้ง · action ที่ไม่รู้จักตอบ `UNKNOWN_ACTION` แทนค่าว่าง (GoogleAppsScript.js)
- [Claude] fix(admin): บันทึก/ลบบัญชี Promptpay ในหน้า admin ไม่เคยถึงชีต (ส่ง `application/json` ทำให้ติด CORS preflight + GAS ไม่มี action `saveSettings`/`saveBank`) → แท็บ BankAccounts ว่าง หน้าชำระเงินไม่แสดงช่องทางโอน · เพิ่ม `saveSettings`/`saveBank` ใน GAS V27-BANK (เก็บเป็นข้อความ เลข 0 นำหน้าไม่หาย, ปฏิเสธ QR ที่อัปโหลดไม่สำเร็จ) และเปลี่ยนเป็น `text/plain` + ตรวจผลจาก GAS (GoogleAppsScript.js, src/adminApp.js)
- [Claude] fix(build): ย้าย `@rollup/rollup-linux-x64-gnu` จาก dependencies ไป optionalDependencies ให้ `npm ci` บน Windows/macOS ไม่ล้ม (บน Linux/CI ยังติดตั้งเหมือนเดิม) (package.json, package-lock.json)

## [2.5.0] - 2026-07-27
### Added
- [Claude] feat(admin): การ์ด "ยอดขายวันนี้" + จำนวนออเดอร์วันนี้ (admin.html, src/adminApp.js)
- [Claude] feat(admin): ยอดขายเสริมที่เพิ่มขึ้นทุกวันอัตโนมัติ ผ่าน config `FAKE_SALES` (เดือน/สัปดาห์/รวม/กราฟ) — ยอดรวมเพิ่มขึ้นทุกวันแบบการันตี
### Changed
- [Claude] chore(admin): ปรับ `FAKE_SALES` ให้ยอดวันนี้อยู่หลักพัน (~2-3 พัน) ไม่เวอร์ — baseDaily 16000→1700, growth 55→4

## [2.4.0] - 2026-07-27
### Added
- [Claude] feat(admin): แท็บ "ปรับราคา/สต๊อก" แก้ราคา-สต๊อกทุกรายการในครั้งเดียว + ปรับเร็ว (+%/+฿/ตั้งค่า, ตั้ง/+/- สต๊อก) บันทึกผ่าน `updateProduct` เดิม ไม่ต้อง re-deploy GAS

## [2.3.0] - 2026-07-27
### Added
- [Claude] docs: `SETUP_BACKEND.md` คู่มือตั้งชีต + deploy Apps Script ของร้านเอง
- [Claude] feat(gas): auto ใส่หัวคอลัมน์แท็บ Orders เมื่อว่าง (GoogleAppsScript.js)
### Changed
- [Claude] feat(admin): รีแบรนด์หน้า admin (title, โลโก้ 🌿, หมวดหมู่กัญชา, ใบปะหน้าใช้ชื่อร้านใหม่)
- [Human:Ped] chore: ตั้ง backend ของร้านเอง (Google Sheet + Apps Script) แล้วใส่ URL ใน .env
### Fixed
- [Claude] fix(env): แปลงลิงก์ `/edit` เป็น CSV `/export?format=csv` เพื่อให้ PapaParse อ่านได้
- [Claude] fix(store): trim คอลัมน์ category (ชีตมีช่องว่างท้ายคำ) ให้เข้าแท็บถูก (src/main.js)

## [2.2.0] - 2026-07-27
### Changed
- [Claude] feat(ui): พื้นหลังหน้าร้านเป็นภาพกัญชา `bg-cannabis.jpg` + overlay เขียวเข้มให้ตัวหนังสืออ่านง่าย (index.html)
### Fixed
- [Claude] fix(ui): โลโก้หาย (image/logo.png ถูกลบ) → แทนด้วยโลโก้ CSS วงกลม 🌿 (index.html)

## [2.1.0] - 2026-07-27
### Changed
- [Claude] feat(store): ดึงรายการสินค้าจาก Google Sheet CSV ด้วย PapaParse แทน GAS getProducts (src/main.js)
- [Claude] feat(store): จัดหมวดกัญชาอัตโนมัติจากชื่อ+tags (Sativa/Indica/Hybrid/Pre-roll/อุปกรณ์)
- [Human:Ped] chore(data): ตั้ง category ให้สินค้า 24 รายการในชีต (แนะนำโดย [Claude])

## [2.0.0] - 2026-07-27
### Changed — รีแบรนด์ครั้งใหญ่ (BlackNight69 → Cannabis Flower อ่อนนุช)
- [Claude] feat(brand): เปลี่ยนชื่อร้าน/แท็กไลน์/โลโก้ (src/config.js, index.html)
- [Claude] feat(seo): title, meta, keywords, JSON-LD local business (อ่อนนุช/สุขุมวิท/สวนหลวง/อุดมสุข), sitemap, robots, llms.txt
- [Claude] feat(ui): hero, หมวดหมู่, รีวิว, trust badges เป็นธีมกัญชา; age gate 18+ → 20+
### Note
- ฐานเดิม: gunshadelivery v1.2.1 (git history เก่ายังอยู่)

---
_เวอร์ชันปัจจุบัน: **2.5.0** · ผู้สร้างฐาน: [Claude] · ต่อไป: AI ทุกตัวบันทึกต่อที่นี่_

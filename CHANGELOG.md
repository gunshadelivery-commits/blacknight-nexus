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
### Fixed
- [Claude] fix(seo): ลบ `servesCuisine: null` ออกจาก LocalBusiness JSON-LD — field นี้ไม่เกี่ยวกับร้านกัญชา Google อาจ flag เป็น invalid structured data (index.html)
- [Claude] fix(seo): เพิ่ม hreflang `zh` และ `ko` ใน index.html และ strain.html — ครอบคลุมผู้ใช้จีนและเกาหลีสำหรับ Google Search (index.html, strain.html)
- [Claude] fix(seo): แก้ trailing `-` ใน canonical URL และ JSON-LD ของ strain page — `toSlug()` เพิ่ม dedup + trim dashes ทำให้ชื่อที่มีตัวอักษรพิเศษท้ายชื่อ (เช่น `super-boof-cherry`) ไม่มี `-` ตามหลัง (src/strain.js)

### Added
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

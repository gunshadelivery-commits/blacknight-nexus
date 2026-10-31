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
### Added
- [Claude] feat(i18n): เพิ่มภาษาจีน (ตัวย่อ) และเกาหลี ครบทุกข้อความที่ลูกค้าเห็น (หน้าร้าน อุปกรณ์ ยืนยันอายุ สมัคร/ล็อกอิน) + ปุ่ม 中文 / 한국 · เบราว์เซอร์จีน/เกาหลีได้ภาษานั้นอัตโนมัติ · ข้อความที่ไม่มีใน zh/ko ใช้อังกฤษแทน · หน้า admin ยังมีแค่ TH/EN (src/i18n.js, index.html, login.html, register.html, src/agegate.js, src/style.css, AGENTS.md)
- [Claude] feat(image): เพิ่มรูปสินค้าเมนูชุด 2 จำนวน 13 รูป (จัตุรัส 900px JPEG) — lemon-cherry-gelato, vice-city, marmalade, khalifa-kush, alien-mint, king-juice, mimosa, zapple, permanent, homegrown-1111, kief-mac-1, kief-dosidos, trim-super-boof (image/*.jpg)
- [Claude] feat(image): เพิ่มรูปสินค้าเมนู 11 รูป (จัตุรัส 900px JPEG) — green-apple, trim-vicious, sluricane, ultra-smooth, zupra, lemon-runtz, wedding-crasher, superboof-mid-pop, mac-1-mid-bud, granny-candy, pink-runtz (image/*.jpg)
- [Claude] feat(gas): แยกข้อมูลลูกค้าออกจากไฟล์สาธารณะ — แท็บ `Orders`/`Users` ย้ายไปสเปรดชีตส่วนตัว (Script Properties → `PRIVATE_SHEET_ID` มี fallback ใช้ไฟล์หลักถ้ายังไม่ตั้ง) และเพิ่มคำสั่ง `getOrders` ที่ต้องมี ADMIN_KEY ให้หน้า admin ใช้แทน CSV (GoogleAppsScript.js, SETUP_BACKEND.md, AGENTS.md)
- [Claude] fix(admin): หน้า admin เลิกอ่านออเดอร์จาก CSV สาธารณะ (`VITE_ORDERS_CSV_URL`) เปลี่ยนเป็นดึงผ่าน GAS `getOrders` หลังล็อกอิน พร้อมถอด PapaParse ออกจากหน้า admin (src/adminApp.js)
- [Claude] feat(gas): เพิ่มการตรวจสิทธิ์ก่อนเขียนข้อมูลใน Apps Script — `addProduct` `updateProduct` `deleteProduct` `updateStatus` `saveSettings` `saveBank` `clearProducts` ต้องมี `ADMIN_KEY` (เก็บใน Script Properties ไม่อยู่ในโค้ด) ส่วนคำสั่งของลูกค้า `getProducts` `getBank` `register` `login` `log` ยังเปิดตามเดิม พร้อมคำสั่ง `verifyAdmin` สำหรับตรวจรหัสตอนล็อกอิน และคู่มือตั้งค่า (GoogleAppsScript.js, SETUP_BACKEND.md)
- [Codex] feat(i18n): เพิ่มระบบเลือกภาษาไทย/อังกฤษแบบจำค่าบนอุปกรณ์เดียวกัน ครอบคลุมหน้าร้าน หน้ายืนยันอายุ ตะกร้า ชำระเงิน หน้าเข้าสู่ระบบ/สมัครสมาชิก และหน้า Admin (src/i18n.js, index.html, admin.html, login.html, register.html, src/agegate.js)
- [Codex] feat(i18n): แปลข้อความแบบ dynamic ของรายการสินค้า การสั่งซื้อ ตัวชี้วัด ออเดอร์ สินค้า และ PromptPay พร้อมสวิตช์ภาษาที่รองรับ desktop/mobile (src/main.js, src/adminApp.js, src/style.css)
- [Codex] feat(storefront): เพิ่มตัวเลือก “Find Your Flow”, spotlight ตามเมาส์, คีย์ลัด `/` สำหรับค้นหา และสถานะร้านพร้อมส่ง (index.html, src/main.js, src/style.css)
- [Codex] chore(hosting): เพิ่มข้อมูลโปรเจกต์สำหรับเผยแพร่ตัวอย่างผ่าน Sites (.openai/hosting.json)
- [Codex] chore(hosting): เพิ่ม static worker adapter และขั้นตอนเตรียม build output สำหรับ Sites (sites-worker.js, vite.config.js)
- [Codex] feat(storefront): เพิ่มหมวดเครื่องดื่ม น้ำท่อมมี่ น้ำโยเกิร์ต น้ำผลไม้ ราคาแพ็ก 3 ขวด และเซ็ตโปรโมชั่นที่สั่งลงตะกร้าได้ (index.html, src/main.js, src/style.css)

### Changed
- [Claude] feat(i18n): หน้าร้านเปิดครั้งแรกเป็นภาษาอังกฤษ (คนที่เคยเลือกภาษาไว้ยังได้ภาษาเดิม · หน้า admin ยังเริ่มที่ไทยผ่าน data-default-lang) + ซ่อนหน้าไว้จนแปลเสร็จกันกะพริบเป็นไทย + แปลข้อความที่ตกหล่น (1 ชม., แท็บเมนูน้ำ, หัวข้อหน้าอุปกรณ์, เมนูหน้าแรก) (src/i18n.js, index.html, accessories.html, login.html, register.html, admin.html, AGENTS.md)
- [Claude] style(ui): เปลี่ยนแถบเลื่อนทุกหน้าเป็นแบบบาง 6px สีเขียวมรกตโปร่งแสง หัวมน ไม่มีปุ่มลูกศร/พื้นขาว (Firefox ใช้ scrollbar-width: thin) (src/style.css)
- [Claude] fix(admin): ล็อกอินหลังบ้านตรวจรหัสที่ Apps Script แทนการเทียบในเบราว์เซอร์ และแนบรหัสไปกับทุกคำสั่งที่ต้องใช้สิทธิ์ 9 จุด เก็บรหัสใน sessionStorage (ปิดแท็บแล้วหลุด) (src/adminApp.js)
- [Claude] docs(agents): แก้กฏข้อ 7 ให้ตรงกับที่ย้ายรหัสแอดมินไปไว้ฝั่ง Apps Script (AGENTS.md)
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

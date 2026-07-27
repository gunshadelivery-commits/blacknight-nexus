# AGENTS.md — กฏการทำงานสำหรับ AI ทุกตัว

> ไฟล์นี้คือ **กติกากลาง** ของโปรเจกต์ **Cannabis Flower อ่อนนุช**
> AI ทุกตัว (Claude, Codex, Cursor, Gemini ฯลฯ) **ต้องอ่านไฟล์นี้ + `CHANGELOG.md` ก่อนเริ่มงานทุกครั้ง** และทำตามเท่านั้น
> มาตรฐานที่ใช้: [AGENTS.md](https://agents.md) · [Keep a Changelog](https://keepachangelog.com) · [SemVer](https://semver.org) · [Conventional Commits](https://www.conventionalcommits.org)

---

## 1. โปรเจกต์นี้คืออะไร (30 วินาที)
ร้านกัญชา **delivery** ย่านอ่อนนุช/สุขุมวิท — เว็บ sale page + หลังบ้าน admin
- **Frontend:** static SPA, Vite + Tailwind, ฟอนต์ Kanit, ธีมเขียวมรกต (emerald), ภาษาไทย, age gate 20+
- **หน้าร้าน** `index.html` + `src/main.js` → อ่านสินค้าจาก Google Sheet **CSV** (`VITE_SHEET_CSV_URL`) ด้วย PapaParse
- **หลังบ้าน** `admin.html` + `src/adminApp.js` → อ่าน/เขียนสินค้า + ออเดอร์ผ่าน **Apps Script** (`VITE_GAS_URL`)
- **Backend:** `GoogleAppsScript.js` (เอาไปวางใน Google Apps Script ของร้าน) + Google Sheet 4 แท็บ: Products, Orders, BankAccounts, Users
- **สั่งซื้อ:** ผ่าน LINE OA (`VITE_LINE_OA_ID`)

## 2. กฏเหล็ก (ห้ามฝ่าฝืน)
1. **อ่าน `AGENTS.md` + `CHANGELOG.md` ก่อนเสมอ** แล้วจึงลงมือ
2. **ทุกการแก้ต้องบันทึกใน `CHANGELOG.md`** พร้อมป้ายผู้ทำ (ดูข้อ 3) — ไม่บันทึก = งานยังไม่เสร็จ
3. **แก้เท่าที่ขอ** โฟกัสงานเดียว diff เล็ก อย่ารื้อของที่ทำงานอยู่แล้วโดยไม่จำเป็น
4. **ห้ามเปลี่ยน `VITE_*` URL ใน`.env`** โดยไม่ได้รับอนุญาตจากเจ้าของ (ผูกกับชีต/หลังบ้านจริง)
5. **`npm run build` ต้องผ่าน** ก่อนบอกว่าเสร็จ และควรเปิด preview ยืนยันด้วยตา
6. **ตัวเลขปลอมใน dashboard (`FAKE_SALES` ใน `src/adminApp.js`) เป็นของหลังบ้านส่วนตัว** ห้ามนำไปอ้างเป็นยอดจริงกับลูกค้า
7. **ตอบ/คอมเมนต์เป็นภาษาไทย** (เจ้าของเป็นคนไทย) โค้ด/ตัวแปรเป็นอังกฤษได้
8. **รักษาแบรนด์:** ชื่อ "Cannabis Flower อ่อนนุช", ธีมเขียว, หมวดหมู่ Sativa/Indica/Hybrid/Pre-roll/อุปกรณ์

## 3. ป้ายกำกับผู้ทำ (Author Tags) — สำคัญ
ทุกบรรทัดใน `CHANGELOG.md` ต้องมีป้ายว่า **ใครทำ**:
- `[Claude]` — งานที่ Claude ทำ
- `[Codex]` — งานที่ Codex ทำ
- `[Human:Ped]` — เจ้าของแก้เอง
- เวลาแก้บั๊กของคนอื่น ให้ระบุ: `[Codex] fix: ... (บั๊กจาก [Claude])`

## 4. ขั้นตอนทุกครั้งที่แก้ (Definition of Done)
1. อ่านกฏ → เข้าใจงาน
2. แก้โค้ด (โฟกัส diff เล็ก)
3. `npm run build` ผ่าน + เปิด preview เช็คด้วยตา
4. เพิ่มบรรทัดใน `CHANGELOG.md` (หมวด Added/Changed/Fixed + ป้ายผู้ทำ + ไฟล์ที่แตะ)
5. commit ด้วย Conventional Commits: `feat: ...`, `fix: ...`, `chore: ...`, `docs: ...`
   - รูปแบบ: `<type>(scope): สรุปสั้น` เช่น `feat(admin): เพิ่มปรับราคาทุกตัว`

## 5. อย่าแตะ / ระวังพิเศษ (Guardrails)
- **`.env` เปลี่ยนแล้ว build ไม่อัปเดต** → ต้อง `rm -rf node_modules/.vite dist` แล้ว `npm run build` (Vite ฝัง env ตอน build)
- **`updateProduct` ใน GAS ลบ+เขียนแถวใหม่** → บันทึกสินค้าแล้วลำดับแถวในชีตจะสลับ (หมวดหมู่ไม่หายเพราะส่งไปด้วย) เป็นพฤติกรรมปกติ
- **หน้าร้านอ่าน CSV / admin อ่าน-เขียน GAS** → ทั้งคู่ต้องชี้ชีตเดียวกันเสมอ
- **คอลัมน์ชีต Products (เรียงตามนี้):** `name, size, price, note, image, tags, status, stock, sold_count, category`
- อย่า commit คีย์/ความลับใหม่ลง repo สาธารณะ

## 6. แผนผังไฟล์
| ไฟล์ | หน้าที่ |
|------|--------|
| `index.html` / `src/main.js` | หน้าร้านลูกค้า (storefront) |
| `admin.html` / `src/adminApp.js` | หลังบ้าน (ยอดขาย, จัดการสินค้า, ปรับราคา/สต๊อก, promptpay) |
| `src/config.js` | ชื่อร้าน + อ่านค่า `VITE_*` + helper LINE/ImgBB |
| `src/agegate.js` | หน้ายืนยันอายุ 20+ |
| `GoogleAppsScript.js` | โค้ดหลังบ้าน (วางใน Google Apps Script) |
| `.env` | ค่าเชื่อมต่อ (Sheet CSV, GAS, LINE, ImgBB, รหัส admin) |
| `SETUP_BACKEND.md` | คู่มือตั้งชีต + deploy Apps Script |
| `CHANGELOG.md` | ประวัติเวอร์ชัน + ใครทำอะไร |

## 7. คำสั่งที่ใช้บ่อย
```bash
npm run dev        # dev server
npm run build      # build ไป dist/  (ต้องผ่านก่อนบอกว่าเสร็จ)
npm run preview    # ดู build จริง
rm -rf node_modules/.vite dist && npm run build   # เมื่อแก้ .env แล้วไม่อัปเดต
```
รหัสผ่าน admin อยู่ใน `.env` (`VITE_ADMIN_PASSWORD`)

---
_เวอร์ชันกฏนี้: 1.0 · ปรับปรุงกฏได้ แต่ต้องบันทึกใน CHANGELOG พร้อมป้ายผู้ทำ_
